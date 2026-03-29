export function parseDepthRange(value: string | null): { start: number; end: number } | null {
	if (!value) return null;
	const matched = value.match(/^(\d+)-(\d+)$/);
	if (!matched) return null;
	const start = Number(matched[1]);
	const end = Number(matched[2]);
	if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
		return null;
	}
	return { start, end };
}

export function safeParseArray(value: unknown): unknown[] {
	if (Array.isArray(value)) return value;
	if (!value) return [];
	try {
		const parsed = JSON.parse(String(value));
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
