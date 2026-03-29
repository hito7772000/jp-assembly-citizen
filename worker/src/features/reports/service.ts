import type { Env } from "../../shared/env";
import { createId } from "../../shared/id";
import { safeParseArray } from "../../shared/parsers";
import { requireArray, requireGeometry, requireNumber, requireString } from "../../shared/validation";
import { findNearbyReports, insertReport } from "./repository";
import type { ReportPayload } from "./types";

export async function createReportService(env: Env, body: unknown): Promise<Response> {
	const payload = parseReportPayload(body);
	if (payload instanceof Response) return payload;

	const now = new Date().toLocaleString("sv-SE", {
		timeZone: "Asia/Tokyo",
		hour12: false,
	}).replace(" ", "T");

	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	const reportId = `${payload.municipality_code}-${date}-${createId().slice(0, 10)}`;
	const id = await insertReport(env, payload, reportId, now);

	return Response.json({ status: "ok", id });
}

export async function getNearbyReportsService(env: Env, request: Request): Promise<Response> {
	const params = parseNearbyParams(request);
	if (params instanceof Response) return params;

	const rows = await findNearbyReports(env, params);
	const mapped = rows.map((row) => ({
		...row,
		problems: safeParseArray(row.problems),
		solutions: safeParseArray(row.solutions),
		tags: safeParseArray(row.tags),
		geometry: typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry,
	}));

	return Response.json(mapped);
}

function parseReportPayload(body: unknown): ReportPayload | Response {
	const b = (body ?? {}) as Record<string, unknown>;

	const municipalityCode = requireString(b.municipality_code, "municipality_code");
	if (municipalityCode instanceof Response) return municipalityCode;

	const geometry = requireGeometry(b.geometry);
	if (geometry instanceof Response) return geometry;

	const problems = requireArray(b.problems, "problems");
	if (problems instanceof Response) return problems;

	const solutions = requireArray(b.solutions, "solutions");
	if (solutions instanceof Response) return solutions;

	const tags = requireArray(b.tags, "tags");
	if (tags instanceof Response) return tags;

	return {
		municipality_code: municipalityCode,
		geometry,
		problems,
		solutions,
		tags,
	};
}

function parseNearbyParams(request: Request):
	| { lat: number; lng: number; municipalityCode: string; radius: number; limit: number }
	| Response {
	const url = new URL(request.url);

	const lat = requireNumber(url.searchParams.get("lat"), "lat");
	if (lat instanceof Response) return lat;

	const lng = requireNumber(url.searchParams.get("lng"), "lng");
	if (lng instanceof Response) return lng;

	const municipalityCode = requireString(url.searchParams.get("municipality_code"), "municipality_code");
	if (municipalityCode instanceof Response) return municipalityCode;

	const radiusRaw = Number(url.searchParams.get("radius") ?? 500);
	const limitRaw = Number(url.searchParams.get("limit") ?? 20);

	return {
		lat,
		lng,
		municipalityCode,
		radius: Math.min(Math.max(radiusRaw, 50), 2000),
		limit: Math.min(Math.max(limitRaw, 1), 100),
	};
}
