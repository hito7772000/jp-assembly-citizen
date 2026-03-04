-- schema.sql
CREATE TABLE reports (
						 id INTEGER PRIMARY KEY AUTOINCREMENT,
						 municipality_code TEXT NOT NULL,
						 geometry TEXT NOT NULL,
						 problems TEXT NOT NULL,
						 solutions TEXT NOT NULL,
						 tags TEXT NOT NULL,
						 source TEXT NOT NULL,
						 created_at INTEGER NOT NULL,
						 image_public_url TEXT,
						 image_private_key TEXT
);
