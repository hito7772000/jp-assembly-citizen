import { isMeaningless } from "../../filter";
import { SYSTEM_PROMPT } from "./prompt";
import type { Env } from "../../shared/env";
import { jsonError } from "../../shared/http";
import { requireString } from "../../shared/validation";

export async function summarizeVoiceService(env: Env, body: unknown): Promise<Response> {
	const rawText = (body as { text?: unknown } | null)?.text;
	const text = requireString(rawText, "text");
	if (text instanceof Response) return text;

	if (isMeaningless(text)) {
		return jsonError("empty_or_meaningless_input");
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

		const raw = aiResponse.response ?? aiResponse;
		const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

		try {
			return Response.json(JSON.parse(jsonText));
		} catch {
			return Response.json({ error: "invalid_json", jsonText });
		}
	} catch (err) {
		console.error("AI error:", err);
		return new Response("AI inference failed", { status: 500 });
	}
}
