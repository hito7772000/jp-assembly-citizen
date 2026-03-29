import type { Env } from "../../shared/env";
import { createReportService, getNearbyReportsService } from "./service";

export async function createReportHandler(request: Request, env: Env): Promise<Response> {
	const body = await request.json<unknown>();
	return createReportService(env, body);
}

export async function nearbyReportsHandler(request: Request, env: Env): Promise<Response> {
	return getNearbyReportsService(env, request);
}
