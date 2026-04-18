import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { fetchMindmaps, type MindmapListItem } from "../lib/mindmapApi";

export default function MindmapListPage() {
	const [maps, setMaps] = useState<MindmapListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		const run = async () => {
			setLoading(true);
			setErrorMessage("");
			try {
				const items = await fetchMindmaps(100);
				setMaps(items);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : "Failed to load mindmap list.";
				setErrorMessage(message);
			} finally {
				setLoading(false);
			}
		};
		run();
	}, []);

	return (
		<div style={{ minHeight: "100dvh", padding: 20, background: "#f6f8fc" }}>
			<div style={{ maxWidth: 980, margin: "0 auto" }}>
				<h1 style={{ margin: "0 0 12px 0", fontSize: 26 }}>Mindmap Themes</h1>
				<p style={{ margin: "0 0 18px 0", color: "#51617a" }}>
					These themes are created by admins. Select one to open the posting page.
				</p>

				{loading && <p>Loading...</p>}
				{errorMessage && <p style={{ color: "#c62828" }}>{errorMessage}</p>}

				{!loading && !errorMessage && (
					<div style={{ background: "#fff", border: "1px solid #d9e2ef", borderRadius: 12, overflow: "hidden" }}>
						<table style={{ width: "100%", borderCollapse: "collapse" }}>
							<thead>
								<tr style={{ background: "#eff4fb" }}>
									<th style={thStyle}>Theme</th>
									<th style={thStyle}>mapId</th>
									<th style={thStyle}>Action</th>
								</tr>
							</thead>
							<tbody>
								{maps.map((map) => (
									<tr key={map.id}>
										<td style={tdStyle}>{map.topic}</td>
										<td style={{ ...tdStyle, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}>{map.id}</td>
										<td style={tdStyle}>
											<Link to={`/mindmap?mapId=${encodeURIComponent(map.id)}`}>Open</Link>
										</td>
									</tr>
								))}
								{maps.length === 0 && (
									<tr>
										<td colSpan={3} style={{ ...tdStyle, textAlign: "center", color: "#61728d" }}>
											No themes found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

const thStyle: CSSProperties = {
	textAlign: "left",
	padding: "12px 14px",
	fontWeight: 700,
	color: "#344359",
	borderBottom: "1px solid #d9e2ef",
};

const tdStyle: CSSProperties = {
	padding: "12px 14px",
	borderBottom: "1px solid #e6edf7",
	verticalAlign: "top",
};
