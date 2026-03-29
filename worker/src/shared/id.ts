export function createId(): string {
	return crypto.randomUUID().replace(/-/g, "").slice(0, 26);
}
