import { routeRequest } from "./router";
import type { Env } from "./shared/env";
import { withCors } from "./shared/http";

export { MindmapDO } from "./mindmap-do";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			return await routeRequest(request, env);
		} catch (err) {
			console.error("Worker error:", err);
			return withCors(new Response("Internal Server Error", { status: 500 }));
		}
	},
};
