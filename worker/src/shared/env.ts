export interface MapDoNamespace {
	idFromName(name: string): DurableObjectId;
	get(id: DurableObjectId): DurableObjectStub;
}

export interface Env {
	DB: D1Database;
	AI: {
		run(model: string, input: unknown): Promise<any>;
	};
	MAP_DO: MapDoNamespace;
}
