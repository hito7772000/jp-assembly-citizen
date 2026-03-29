export type NodeType =
	| "root"
	| "seed"
	| "question"
	| "problem"
	| "solution"
	| "alternative"
	| "supplement";

export interface MapInfoRow {
	id: string;
	topic: string;
}

export interface NodeRow {
	id: string;
	parent_id: string;
	type: NodeType;
	content: string;
	path: string;
	depth: number;
}

export interface GetNodesQuery {
	depth: number | null;
	path: string | null;
	range: { start: number; end: number } | null;
	limit: number;
}
