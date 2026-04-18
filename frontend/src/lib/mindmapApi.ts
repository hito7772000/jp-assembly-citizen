import { API_BASE } from "./api";

export type NodeType =
	| "problem"
	| "solution"
	| "alternative"
	| "supplement";

export interface MindmapNode {
	id: string;
	parent_id: string;
	type: string;
	content: string;
	path: string;
	depth: number;
}

export interface MindmapInfo {
	id: string;
	topic: string;
	node_count: number;
}

export interface MindmapListItem {
	id: string;
	topic: string;
}

export interface CreateNodeInput {
	parent_id: string;
	type: NodeType;
	content: string;
	solution?: string;
}

export async function fetchMapInfo(mapId: string): Promise<MindmapInfo> {
	const res = await fetch(`${API_BASE}/maps/${encodeURIComponent(mapId)}`);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to load map info: ${res.status} ${text}`);
	}
	return await res.json();
}

export async function fetchMindmaps(limit = 50): Promise<MindmapListItem[]> {
	const res = await fetch(`${API_BASE}/maps?limit=${limit}`);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to load mindmaps: ${res.status} ${text}`);
	}
	return await res.json();
}

export async function fetchMapNodes(mapId: string, depth = 10): Promise<MindmapNode[]> {
	const res = await fetch(`${API_BASE}/maps/${encodeURIComponent(mapId)}/nodes?depth=${depth}`);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to load nodes: ${res.status} ${text}`);
	}
	return await res.json();
}

export async function createMapNode(mapId: string, payload: CreateNodeInput): Promise<MindmapNode> {
	const res = await fetch(`${API_BASE}/maps/${encodeURIComponent(mapId)}/nodes`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		let message = `Failed to create node: ${res.status}`;
		try {
			const body = await res.json();
			if (typeof body?.error === "string") {
				message = body.error;
			}
		} catch {
			// ignore non-JSON error body
		}
		throw new Error(message);
	}

	return await res.json();
}

export function toWebSocketUrl(mapId: string): string {
	const base = API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
	return `${base}/ws/${encodeURIComponent(mapId)}`;
}
