import {
	addMapNodeProxyHandler,
	createMapHandler,
	getMapInfoHandler,
	getMapNodesHandler,
	mapWebSocketHandler,
} from "./features/maps/handlers";
import { createReportHandler, nearbyReportsHandler } from "./features/reports/handlers";
import { voiceSummaryGetHandler, voiceSummaryPostHandler } from "./features/voice/handlers";
import type { Env } from "./shared/env";
import { withCors } from "./shared/http";

export async function routeRequest(request: Request, env: Env): Promise<Response> {
	if (request.method === "OPTIONS") {
		return withCors(new Response(null, { status: 204 }));
	}

	const url = new URL(request.url);
	const pathname = url.pathname;

	if (request.method === "GET" && pathname === "/voice/summary") {
		return withCors(await voiceSummaryGetHandler(request, env));
	}

	if (request.method === "POST" && pathname === "/voice/summary") {
		return withCors(await voiceSummaryPostHandler(request, env));
	}

	if (request.method === "POST" && pathname === "/report") {
		return withCors(await createReportHandler(request, env));
	}

	if (request.method === "GET" && pathname === "/reports/nearby") {
		return withCors(await nearbyReportsHandler(request, env));
	}

	if (request.method === "POST" && pathname === "/maps") {
		return withCors(await createMapHandler(request, env));
	}

	if (request.method === "GET" && /^\/maps\/[^/]+$/.test(pathname)) {
		const mapId = extractPathSegment(pathname, 2);
		return withCors(await getMapInfoHandler(mapId, env));
	}

	if (request.method === "GET" && /^\/maps\/[^/]+\/nodes$/.test(pathname)) {
		const mapId = extractPathSegment(pathname, 2);
		return withCors(await getMapNodesHandler(mapId, request, env));
	}

	if (request.method === "POST" && /^\/maps\/[^/]+\/nodes$/.test(pathname)) {
		const mapId = extractPathSegment(pathname, 2);
		return withCors(await addMapNodeProxyHandler(mapId, request, env));
	}

	if (request.method === "GET" && /^\/ws\/[^/]+$/.test(pathname)) {
		const mapId = extractPathSegment(pathname, 2);
		return await mapWebSocketHandler(mapId, request, env);
	}

	return withCors(new Response("Not found", { status: 404 }));
}

function extractPathSegment(pathname: string, index: number): string {
	return pathname.split("/")[index] ?? "";
}
