import type { Env } from "../../shared/env";
import type { NearbyReportRow, ReportPayload } from "./types";

export async function insertReport(env: Env, payload: ReportPayload, reportId: string, createdAt: string): Promise<number> {
	const stmt = env.DB.prepare(
		`INSERT INTO reports
		 (municipality_code, geometry, problems, solutions, tags, source, created_at, report_id)
		 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
	).bind(
		payload.municipality_code,
		JSON.stringify(payload.geometry),
		JSON.stringify(payload.problems),
		JSON.stringify(payload.solutions),
		JSON.stringify(payload.tags),
		"citizen",
		createdAt,
		reportId,
	);

	const result = await stmt.run();
	return Number(result.lastInsertRowId ?? 0);
}

export async function findNearbyReports(
	env: Env,
	params: { lat: number; lng: number; municipalityCode: string; radius: number; limit: number },
): Promise<NearbyReportRow[]> {
	const stmt = env.DB.prepare(`
		SELECT *
		FROM (
			SELECT
				id,
				municipality_code,
				geometry,
				problems,
				solutions,
				tags,
				created_at,
				(
					6371000 * acos(
						cos(radians(?1)) *
						cos(radians(json_extract(geometry, '$.lat'))) *
						cos(radians(json_extract(geometry, '$.lng')) - radians(?2)) +
						sin(radians(?1)) *
						sin(radians(json_extract(geometry, '$.lat')))
					)
				) AS distance
			FROM reports
			WHERE municipality_code = ?5
			  AND created_at >= datetime('now', '-14 days')
		)
		WHERE distance <= ?3
		ORDER BY created_at DESC
		LIMIT ?4
	`).bind(params.lat, params.lng, params.radius, params.limit, params.municipalityCode);

	const rows = await stmt.all<NearbyReportRow>();
	return rows.results ?? [];
}
