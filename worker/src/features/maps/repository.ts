import type { Env } from "../../shared/env";
import type { GetNodesQuery, MapInfoRow, MapListRow, NodeRow } from "./types";

export async function createMapWithRoot(env: Env, mapId: string, topic: string): Promise<void> {
	const rootPath = `${mapId}/${mapId}`;

	const createMapStmt = env.DB.prepare(`INSERT INTO mindmaps (id, topic) VALUES (?1, ?2)`).bind(mapId, topic);
	const createRootStmt = env.DB.prepare(
		`INSERT INTO nodes (id, parent_id, type, content, path, depth)
		 VALUES (?1, ?2, 'root', ?3, ?4, 0)`,
	).bind(mapId, mapId, topic, rootPath);

	await env.DB.batch([createMapStmt, createRootStmt]);
}

export async function findMap(env: Env, mapId: string): Promise<MapInfoRow | null> {
	const stmt = env.DB.prepare(`SELECT id, topic FROM mindmaps WHERE id = ?1 LIMIT 1`).bind(mapId);
	return await stmt.first<MapInfoRow>();
}

export async function findMaps(env: Env, limit: number): Promise<MapListRow[]> {
	const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
	const stmt = env.DB.prepare(
		`SELECT id, topic
		 FROM mindmaps
		 ORDER BY rowid DESC
		 LIMIT ${safeLimit}`,
	);
	const rows = await stmt.all<MapListRow>();
	return rows.results ?? [];
}

export async function countMapNodes(env: Env, mapId: string): Promise<number> {
	const stmt = env.DB.prepare(`SELECT COUNT(*) AS count FROM nodes WHERE path LIKE ?1`).bind(`${mapId}/%`);
	const row = await stmt.first<{ count: number }>();
	return Number(row?.count ?? 0);
}

export async function findNodes(env: Env, mapId: string, query: GetNodesQuery): Promise<NodeRow[]> {
	const clauses: string[] = [];
	const binds: Array<string | number> = [];

	binds.push(`${mapId}/%`);
	clauses.push(`path LIKE ?${binds.length}`);

	if (query.path) {
		binds.push(`${query.path}/%`);
		clauses.push(`path LIKE ?${binds.length}`);
	}

	if (query.range) {
		binds.push(query.range.start);
		clauses.push(`depth >= ?${binds.length}`);
		binds.push(query.range.end);
		clauses.push(`depth <= ?${binds.length}`);
	} else if (query.depth != null) {
		binds.push(query.depth);
		clauses.push(`depth <= ?${binds.length}`);
	}

	binds.push(query.limit);

	const stmt = env.DB.prepare(
		`SELECT id, parent_id, type, content, path, depth
		 FROM nodes
		 WHERE ${clauses.join(" AND ")}
		 ORDER BY depth ASC, path ASC
		 LIMIT ?${binds.length}`,
	).bind(...binds);

	const rows = await stmt.all<NodeRow>();
	return rows.results ?? [];
}
