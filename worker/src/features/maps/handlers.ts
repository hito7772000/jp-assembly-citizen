import type { Env } from "../../shared/env";
import { createMapService, getMapInfoService, getNodesService } from "./service";

export async function createMapHandler(request: Request, env: Env): Promise<Response> {
	const body = await request.json<unknown>();
	return createMapService(env, body);
}

export async function getMapInfoHandler(mapId: string, env: Env): Promise<Response> {
	return getMapInfoService(env, mapId);
}

export async function getMapNodesHandler(mapId: string, request: Request, env: Env): Promise<Response> {
	return getNodesService(env, mapId, request);
}

export async function addMapNodeProxyHandler(mapId: string, request: Request, env: Env): Promise<Response> {
	const id = env.MAP_DO.idFromName(mapId);
	const stub = env.MAP_DO.get(id);
	return await stub.fetch(request);
}

export async function mapWebSocketHandler(mapId: string, request: Request, env: Env): Promise<Response> {
	const id = env.MAP_DO.idFromName(mapId);
	const stub = env.MAP_DO.get(id);
	return await stub.fetch(request);
}
