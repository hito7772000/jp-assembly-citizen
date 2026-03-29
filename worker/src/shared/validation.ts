import { jsonError } from "./http";

export function requireString(value: unknown, name: string): string | Response {
	if (typeof value !== "string" || value.trim().length === 0) {
		return jsonError(`${name} is required and must be a non-empty string`);
	}
	return value.trim();
}

export function requireNumber(value: unknown, name: string): number | Response {
	const num = Number(value);
	if (Number.isNaN(num)) {
		return jsonError(`${name} must be a valid number`);
	}
	return num;
}

export function requireArray(value: unknown, name: string): unknown[] | Response {
	if (!Array.isArray(value)) {
		return jsonError(`${name} must be an array`);
	}
	return value;
}

export function requireGeometry(value: unknown): { lat: number; lng: number } | Response {
	if (!value || typeof value !== "object") {
		return jsonError("geometry must contain lat and lng");
	}
	const maybe = value as { lat?: unknown; lng?: unknown };
	if (maybe.lat == null || maybe.lng == null) {
		return jsonError("geometry must contain lat and lng");
	}
	const lat = Number(maybe.lat);
	const lng = Number(maybe.lng);
	if (Number.isNaN(lat) || Number.isNaN(lng)) {
		return jsonError("geometry lat/lng must be numbers");
	}
	return { lat, lng };
}
