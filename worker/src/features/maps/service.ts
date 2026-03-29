import type { Env } from "../../shared/env";
import { jsonError } from "../../shared/http";
import { createId } from "../../shared/id";
import { parseDepthRange } from "../../shared/parsers";
import { requireString } from "../../shared/validation";
import { countMapNodes, createMapWithRoot, findMap, findNodes } from "./repository";
import type { GetNodesQuery } from "./types";

export async function createMapService(env: Env, body: unknown): Promise<Response> {
	const rawTopic = (body as { topic?: unknown } | null)?.topic;
	const topic = requireString(rawTopic, "topic");
	if (topic instanceof Response) return topic;

	const mapId = createId();
	await createMapWithRoot(env, mapId, topic);
	return Response.json({ status: "ok", id: mapId, topic });
}

export async function getMapInfoService(env: Env, mapId: string): Promise<Response> {
	const map = await findMap(env, mapId);
	if (!map) {
		return jsonError("map not found", 404);
	}

	const nodeCount = await countMapNodes(env, mapId);
	return Response.json({ id: map.id, topic: map.topic, node_count: nodeCount });
}

export async function getNodesService(env: Env, mapId: string, request: Request): Promise<Response> {
	const query = parseGetNodesQuery(request);
	if (query instanceof Response) return query;

	const nodes = await findNodes(env, mapId, query);
	return Response.json(nodes);
}

function parseGetNodesQuery(request: Request): GetNodesQuery | Response {
	const url = new URL(request.url);
	const depthRaw = url.searchParams.get("depth");
	const path = url.searchParams.get("path");
	const rangeRaw = url.searchParams.get("range");
	const limitRaw = url.searchParams.get("limit");

	const depth = depthRaw == null ? null : Number(depthRaw);
	if (depthRaw != null && (!Number.isFinite(depth) || depth < 0)) {
		return jsonError("depth must be a non-negative number");
	}

	const limit = limitRaw == null ? 500 : Number(limitRaw);
	if (!Number.isFinite(limit) || limit <= 0) {
		return jsonError("limit must be a positive number");
	}

	const range = parseDepthRange(rangeRaw);
	if (rangeRaw && !range) {
		return jsonError("range must be in `start-end` format (e.g. 1-3)");
	}

	return {
		depth,
		path,
		range,
		limit: Math.min(Math.floor(limit), 2000),
	};
}
