import { SYSTEM_PROMPT } from "./prompt";
import { isMeaningless } from "./filter";

export interface Env {
	DB: D1Database;
	AI: any;
}

function withCors(response: Response): Response {
	const res = response.clone();

	const headers = new Headers(res.headers);
	headers.set("Access-Control-Allow-Origin", "*");
	headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	headers.set("Access-Control-Allow-Headers", "Content-Type");

	return new Response(res.body, {
		status: res.status,
		headers,
	});
}


export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			if (request.method === "OPTIONS") {
				return withCors(new Response(null, { status: 204 }));
			}

			const url = new URL(request.url);

			if (request.method === "GET" && url.pathname === "/voice/summary") {
				const text = url.searchParams.get("text") ?? "";
				return withCors(await handleVoiceSummaryGET(text, env));
			}

			if (request.method === "POST" && url.pathname === "/voice/summary") {
				return withCors(await handleVoiceSummary(request, env));
			}

			if (request.method === "POST" && url.pathname === "/report") {
				return withCors(await handleReport(request, env));
			}

			if (request.method === "GET" && url.pathname === "/reports/nearby") {
				return withCors(await handleNearbyReports(request, env));
			}

			return withCors(new Response("Not found", { status: 404 }));
		} catch (err) {
			console.error("Worker error:", err);
			return withCors(new Response("Internal Server Error", { status: 500 }));
		}
	},
};

async function handleVoiceSummary(request: Request, env: Env): Promise<Response> {
	const body = await request.json<any>();

	console.log("RAW TEXT:", body.text, typeof body.text);

	const text = requireString(body.text, "text");
	if (text instanceof Response) return text;

	if (isMeaningless(text)) {
		return new Response(
			JSON.stringify({ error: "エラーが発生しました。" }),
			{ status: 400, headers: { "Content-Type": "application/json" } }
		);
	}

	const messages = [
		{ role: "system", content: SYSTEM_PROMPT },
		{ role: "user", content: text },
	];

	try {
		const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
			messages,
			temperature: 0.0,
		});

		console.log("=== AI RAW RESPONSE ===");
		console.log(JSON.stringify(aiResponse, null, 2));

		const raw = aiResponse.response ?? aiResponse;

		console.log("=== RAW TEXT FROM AI ===");
		console.log(raw);

		const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

		console.log("=== EXTRACTED JSON TEXT ===");
		console.log(jsonText);

		let json;
		try {
			json = JSON.parse(jsonText);
		} catch {
			json = { error: "invalid_json", jsonText };
		}

		return Response.json(json);
	} catch (err) {
		console.error("AI error:", err);
		return new Response("AI inference failed", { status: 500 });
	}
}

async function handleReport(request: Request, env: Env): Promise<Response> {
	const body = await request.json<any>();

	const municipality_code = requireString(body.municipality_code, "municipality_code");
	if (municipality_code instanceof Response) return municipality_code;

	const geometry = requireGeometry(body.geometry);
	if (geometry instanceof Response) return geometry;

	const problems = requireArray(body.problems, "problems");
	if (problems instanceof Response) return problems;

	const solutions = requireArray(body.solutions, "solutions");
	if (solutions instanceof Response) return solutions;

	const tags = requireArray(body.tags, "tags");
	if (tags instanceof Response) return tags;

	const now = new Date().toLocaleString("sv-SE", {
		timeZone: "Asia/Tokyo",
		hour12: false,
	}).replace(" ", "T");

	const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	const report_id = `${body.municipality_code}-${date}-${uuid}`;

	const stmt = env.DB.prepare(
		`
			INSERT INTO reports
			(municipality_code, geometry, problems, solutions, tags, source, created_at, report_id)
			VALUES
				(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
		`,
	).bind(
		body.municipality_code,
		JSON.stringify(body.geometry),
		JSON.stringify(body.problems),
		JSON.stringify(body.solutions),
		JSON.stringify(body.tags),
		"citizen",
		now,
		report_id,
	);

	const result = await stmt.run();

	return Response.json({
		status: "ok",
		id: result.lastInsertRowId,
	});
}

async function handleVoiceSummaryGET(text: string, env: Env): Promise<Response> {
	const req = new Request("http://dummy", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ text }),
	});

	return handleVoiceSummary(req, env);
}

async function handleNearbyReports(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);

	const lat = requireNumber(url.searchParams.get("lat"), "lat");
	if (lat instanceof Response) return lat;

	const lng = requireNumber(url.searchParams.get("lng"), "lng");
	if (lng instanceof Response) return lng;

	const municipalityCode = requireString(url.searchParams.get("municipality_code"), "municipality_code");
	if (municipalityCode instanceof Response) return municipalityCode;

	const radiusRaw = Number(url.searchParams.get("radius") ?? 500);
	const radius = Math.min(Math.max(radiusRaw, 50), 2000);

	const limitRaw = Number(url.searchParams.get("limit") ?? 20);
	const limit = Math.min(Math.max(limitRaw, 1), 100);

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
	`).bind(lat, lng, radius, limit, municipalityCode);

	const rows = await stmt.all();

	const results = rows.results.map((r) => ({
		...r,
		problems: safeParseArray(r.problems),
		solutions: safeParseArray(r.solutions),
		tags: safeParseArray(r.tags),
		geometry: typeof r.geometry === "string" ? JSON.parse(r.geometry) : r.geometry,
	}));

	return Response.json(results);
}

function safeParseArray(value: any): any[] {
	if (Array.isArray(value)) return value;
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function badRequest(message: string): Response {
	return new Response(JSON.stringify({ error: message }), {
		status: 400,
	});
}

function requireString(value: any, name: string): string | Response {
	if (!value || typeof value !== "string") {
		return badRequest(`${name} is required and must be a string`);
	}
	return value;
}

function requireNumber(value: any, name: string): number | Response {
	const num = Number(value);
	if (Number.isNaN(num)) {
		return badRequest(`${name} must be a valid number`);
	}
	return num;
}

function requireArray(value: any, name: string): any[] | Response {
	if (!Array.isArray(value)) {
		return badRequest(`${name} must be an array`);
	}
	return value;
}

function requireGeometry(value: any): any | Response {
	if (!value || typeof value !== "object" || value.lat == null || value.lng == null) {
		return badRequest("geometry must contain lat and lng");
	}
	return value;
}
