const PROD_API_BASE = "https://jp-assembly-civic-worker.hito7772000.workers.dev";
const DEV_API_BASE = "http://localhost:8787";

export const API_BASE =
	import.meta.env.VITE_API_BASE ??
	(import.meta.env.DEV ? DEV_API_BASE : PROD_API_BASE);
