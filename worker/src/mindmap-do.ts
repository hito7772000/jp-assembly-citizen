interface DurableEnv {
	DB: D1Database;
}

type NodeType =
	| "root"
	| "seed"
	| "question"
	| "problem"
	| "solution"
	| "alternative"
	| "supplement";

const ALLOWED_CHILDREN: Record<NodeType, readonly NodeType[]> = {
	root: ["seed"],
	seed: ["question"],
	question: ["problem", "solution", "alternative", "supplement"],
	problem: ["problem", "solution", "alternative", "supplement"],
	solution: ["solution", "alternative", "supplement"],
	alternative: ["alternative", "supplement"],
	supplement: ["supplement"],
};

interface NodeRow {
	id: string;
	parent_id: string;
	type: NodeType;
	content: string;
	path: string;
	depth: number;
}

export class MindmapDO {
	private readonly state: DurableObjectState;
	private readonly env: DurableEnv;
	private readonly sockets: Set<WebSocket>;

	constructor(state: DurableObjectState, env: DurableEnv) {
		this.state = state;
		this.env = env;
		this.sockets = new Set<WebSocket>();
	}

	async fetch(request: Request): Promise<Response> {
		const upgrade = request.headers.get("Upgrade");
		if (upgrade?.toLowerCase() === "websocket") {
			return this.handleWebSocket();
		}

		if (request.method === "POST") {
			return this.handleAddNode(request);
		}

		return new Response("Not found", { status: 404 });
	}

	private async handleWebSocket(): Promise<Response> {
		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];

		server.accept();
		this.sockets.add(server);

		const cleanup = () => {
			this.sockets.delete(server);
		};

		server.addEventListener("close", cleanup);
		server.addEventListener("error", cleanup);

		server.send(JSON.stringify({ type: "connected" }));
		return new Response(null, { status: 101, webSocket: client });
	}

	private async handleAddNode(request: Request): Promise<Response> {
		const mapId = this.extractMapId(request.url);
		if (!mapId) {
			return this.badRequest("mapId is required in path");
		}

		const body = await request.json<any>();
		const parentId = this.requireString(body.parent_id, "parent_id");
		if (parentId instanceof Response) return parentId;

		const rawType = this.requireString(body.type, "type");
		if (rawType instanceof Response) return rawType;

		const content = this.requireString(body.content, "content");
		if (content instanceof Response) return content;

		const type = this.normalizeNodeType(rawType);
		if (!type) {
			return this.badRequest("type is invalid");
		}

		const solution = this.parseOptionalString(body.solution);
		if (type === "problem" && !solution) {
			return this.badRequest("solution is required when type is problem");
		}
		const storedContent = this.buildStoredContent(type, content, solution);

		const parentStmt = this.env.DB.prepare(
			`SELECT id, parent_id, type, content, path, depth
			 FROM nodes
			 WHERE id = ?1 AND path LIKE ?2
			 LIMIT 1`,
		).bind(parentId, `${mapId}/%`);

		const parent = await parentStmt.first<NodeRow>();
		if (!parent) {
			return new Response(JSON.stringify({ error: "parent node not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const parentType = this.normalizeNodeType(parent.type);
		if (!parentType) {
			return new Response(JSON.stringify({ error: "parent type is invalid" }), {
				status: 409,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!ALLOWED_CHILDREN[parentType].includes(type)) {
			return new Response(JSON.stringify({ error: `type ${type} is not allowed under ${parentType}` }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const nodeId = this.createId();
		const nextPath = `${parent.path}/${nodeId}`;
		const nextDepth = Number(parent.depth) + 1;

		const insert = this.env.DB.prepare(
			`INSERT INTO nodes (id, parent_id, type, content, path, depth)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
		).bind(nodeId, parent.id, type, storedContent, nextPath, nextDepth);

		await insert.run();

		const payload = {
			type: "node_added",
			node: {
				id: nodeId,
				parent_id: parent.id,
				type,
				content: storedContent,
				path: nextPath,
				depth: nextDepth,
			},
		};
		this.broadcast(JSON.stringify(payload));

		return new Response(JSON.stringify(payload.node), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	}

	private broadcast(message: string): void {
		for (const socket of this.sockets) {
			try {
				socket.send(message);
			} catch {
				this.sockets.delete(socket);
			}
		}
	}

	private extractMapId(rawUrl: string): string | null {
		const url = new URL(rawUrl);
		const parts = url.pathname.split("/");
		if (parts.length >= 3) {
			return parts[2] || null;
		}
		return null;
	}

	private createId(): string {
		return crypto.randomUUID().replace(/-/g, "").slice(0, 26);
	}

	private normalizeNodeType(type: string): NodeType | null {
		const normalized = type.trim().toLowerCase();
		if (normalized === "appendix") {
			return "supplement";
		}
		if (normalized in ALLOWED_CHILDREN) {
			return normalized as NodeType;
		}
		return null;
	}

	private badRequest(message: string): Response {
		return new Response(JSON.stringify({ error: message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	private requireString(value: unknown, name: string): string | Response {
		if (typeof value !== "string" || value.trim().length === 0) {
			return this.badRequest(`${name} is required and must be a non-empty string`);
		}
		return value.trim();
	}

	private parseOptionalString(value: unknown): string | null {
		if (typeof value !== "string") return null;
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	private buildStoredContent(type: NodeType, content: string, solution: string | null): string {
		if (type !== "problem") {
			return content;
		}
		return `問題: ${content}\n解決策: ${solution}`;
	}
}
