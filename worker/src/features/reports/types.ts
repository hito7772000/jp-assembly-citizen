export interface ReportPayload {
	municipality_code: string;
	geometry: { lat: number; lng: number };
	problems: unknown[];
	solutions: unknown[];
	tags: unknown[];
}

export interface NearbyReportRow {
	id: number;
	municipality_code: string;
	geometry: string | { lat: number; lng: number };
	problems: string | unknown[];
	solutions: string | unknown[];
	tags: string | unknown[];
	created_at: string;
	distance: number;
}
