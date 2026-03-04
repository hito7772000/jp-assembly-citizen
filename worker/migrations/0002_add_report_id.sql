-- reports テーブルに report_id を追加
ALTER TABLE reports
	ADD COLUMN report_id TEXT NOT NULL DEFAULT '';
