CREATE TABLE IF NOT EXISTS mindmaps (
	id TEXT PRIMARY KEY,
	topic TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
	id TEXT PRIMARY KEY,
	parent_id TEXT NOT NULL,
	type TEXT NOT NULL,
	content TEXT NOT NULL,
	path TEXT NOT NULL,
	depth INTEGER NOT NULL CHECK(depth >= 0)
);

CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(path);
CREATE INDEX IF NOT EXISTS idx_nodes_depth ON nodes(depth);
CREATE INDEX IF NOT EXISTS idx_nodes_path_depth ON nodes(path, depth);
