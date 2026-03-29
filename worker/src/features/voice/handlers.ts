import type { Env } from "../../shared/env";
import { summarizeVoiceService } from "./service";

export async function voiceSummaryPostHandler(request: Request, env: Env): Promise<Response> {
	const body = await request.json<unknown>();
	return summarizeVoiceService(env, body);
}

export async function voiceSummaryGetHandler(request: Request, env: Env): Promise<Response> {
	const text = new URL(request.url).searchParams.get("text") ?? "";
	return summarizeVoiceService(env, { text });
}
