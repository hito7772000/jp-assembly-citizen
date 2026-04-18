import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
	createMapNode,
	fetchMapInfo,
	fetchMapNodes,
	type MindmapInfo,
	type MindmapNode,
	type NodeType,
	toWebSocketUrl,
} from "../lib/mindmapApi";

const NODE_TYPES: Array<{ value: NodeType; label: string }> = [
	{ value: "problem", label: "問題 (problem)" },
	{ value: "solution", label: "解決策 (solution)" },
	{ value: "alternative", label: "代替案 (alternative)" },
	{ value: "supplement", label: "補足 (supplement)" },
];

const NODE_WIDTH = 260;
const NODE_HEIGHT = 86;
const COLUMN_GAP = 120;
const ROW_GAP = 26;
const PADDING = 36;

export default function MindmapPage() {
	const [searchParams] = useSearchParams();
	const [mapIdInput, setMapIdInput] = useState(searchParams.get("mapId") ?? "");
	const [activeMapId, setActiveMapId] = useState("");
	const [mapInfo, setMapInfo] = useState<MindmapInfo | null>(null);
	const [nodes, setNodes] = useState<MindmapNode[]>([]);
	const [selectedParentId, setSelectedParentId] = useState("");
	const [type, setType] = useState<NodeType>("problem");
	const [content, setContent] = useState("");
	const [solution, setSolution] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [formMessage, setFormMessage] = useState("");
	const [formMessageType, setFormMessageType] = useState<"error" | "success">("success");
	const [socketState, setSocketState] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
	const [composerOpen, setComposerOpen] = useState(false);
	const [zoom, setZoom] = useState(1);

	const sortedNodes = useMemo(
		() => [...nodes].sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path)),
		[nodes],
	);

	const selectedNode = useMemo(
		() => sortedNodes.find((n) => n.id === selectedParentId) ?? null,
		[sortedNodes, selectedParentId],
	);

	const { positions, edges, svgWidth, svgHeight } = useMemo(() => {
		const byDepth = new Map<number, MindmapNode[]>();
		let maxDepth = 0;

		for (const node of sortedNodes) {
			const list = byDepth.get(node.depth) ?? [];
			list.push(node);
			byDepth.set(node.depth, list);
			maxDepth = Math.max(maxDepth, node.depth);
		}

		let maxRows = 0;
		const positionsMap = new Map<string, { x: number; y: number }>();

		for (const [depth, list] of byDepth.entries()) {
			maxRows = Math.max(maxRows, list.length);
			list.forEach((node, rowIndex) => {
				positionsMap.set(node.id, {
					x: PADDING + depth * (NODE_WIDTH + COLUMN_GAP),
					y: PADDING + rowIndex * (NODE_HEIGHT + ROW_GAP),
				});
			});
		}

		const width = Math.max(960, PADDING * 2 + (maxDepth + 1) * NODE_WIDTH + maxDepth * COLUMN_GAP);
		const rows = Math.max(1, maxRows);
		const height = Math.max(560, PADDING * 2 + rows * NODE_HEIGHT + (rows - 1) * ROW_GAP);

		const edgeLines: Array<{ from: string; to: string; x1: number; y1: number; x2: number; y2: number }> = [];
		for (const node of sortedNodes) {
			if (node.parent_id === node.id) continue;
			const from = positionsMap.get(node.parent_id);
			const to = positionsMap.get(node.id);
			if (!from || !to) continue;
			edgeLines.push({
				from: node.parent_id,
				to: node.id,
				x1: from.x + NODE_WIDTH,
				y1: from.y + NODE_HEIGHT / 2,
				x2: to.x,
				y2: to.y + NODE_HEIGHT / 2,
			});
		}

		return {
			positions: positionsMap,
			edges: edgeLines,
			svgWidth: width,
			svgHeight: height,
		};
	}, [sortedNodes]);

	useEffect(() => {
		if (!activeMapId) return;

		let cancelled = false;
		setSocketState("connecting");
		const ws = new WebSocket(toWebSocketUrl(activeMapId));

		ws.onopen = () => {
			if (!cancelled) setSocketState("connected");
		};
		ws.onclose = () => {
			if (!cancelled) setSocketState("disconnected");
		};
		ws.onerror = () => {
			if (!cancelled) setSocketState("disconnected");
		};
		ws.onmessage = (event) => {
			if (cancelled) return;
			try {
				const payload = JSON.parse(String(event.data));
				if (payload?.type !== "node_added" || !payload?.node?.id) return;
				const nextNode = payload.node as MindmapNode;
				setNodes((prev) => (prev.some((n) => n.id === nextNode.id) ? prev : [...prev, nextNode]));
			} catch {
				// ignore malformed events
			}
		};

		return () => {
			cancelled = true;
			ws.close();
		};
	}, [activeMapId]);

	const loadMapById = async (mapId: string) => {
		if (!mapId) {
			setErrorMessage("mapId を入力してください。");
			return;
		}

		setLoading(true);
		setErrorMessage("");
		setFormMessage("");

		try {
			const [info, fetchedNodes] = await Promise.all([fetchMapInfo(mapId), fetchMapNodes(mapId)]);
			setActiveMapId(mapId);
			setMapInfo(info);
			setNodes(fetchedNodes);
			const root = fetchedNodes.find((n) => n.depth === 0);
			setSelectedParentId(root?.id ?? "");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "マップの読み込みに失敗しました。";
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	const loadMap = async () => {
		await loadMapById(mapIdInput.trim());
	};

	const validateForm = (): string | null => {
		if (!activeMapId) return "先に mapId を読み込んでください。";
		if (!selectedParentId) return "親ノードを選択してください。";
		if (!content.trim()) return "投稿内容を入力してください。";
		if (type === "problem" && !solution.trim()) {
			return "問題を投稿する場合、解決策の入力が必須です。";
		}
		return null;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormMessage("");

		const validationError = validateForm();
		if (validationError) {
			setFormMessage(validationError);
			setFormMessageType("error");
			return;
		}

		setSubmitting(true);
		try {
			const created = await createMapNode(activeMapId, {
				parent_id: selectedParentId,
				type,
				content: content.trim(),
				solution: type === "problem" ? solution.trim() : undefined,
			});
			setNodes((prev) => (prev.some((n) => n.id === created.id) ? prev : [...prev, created]));
			setContent("");
			setSolution("");
			setComposerOpen(false);
			setFormMessage("投稿しました。");
			setFormMessageType("success");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "投稿に失敗しました。";
			setFormMessage(message);
			setFormMessageType("error");
		} finally {
			setSubmitting(false);
		}
	};

	const closeComposer = () => {
		if (submitting) return;
		setComposerOpen(false);
	};

	useEffect(() => {
		if (mapIdInput) {
			loadMapById(mapIdInput.trim());
		}
	}, []);

	return (
		<div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f7f8fb" }}>
			<header
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "10px 14px",
					background: "#ffffff",
					borderBottom: "1px solid #dde3ee",
				}}
			>
				<strong style={{ whiteSpace: "nowrap" }}>Mindmap</strong>
				<input
					value={mapIdInput}
					onChange={(e) => setMapIdInput(e.target.value)}
					placeholder="mapId"
					style={{ flex: 1, padding: "8px 10px", border: "1px solid #cfd8e6", borderRadius: 8 }}
				/>
				<button onClick={loadMap} disabled={loading} style={ghostButton}>
					{loading ? "読み込み中..." : "読み込む"}
				</button>
				<div style={{ fontSize: 12, color: "#546072", minWidth: 190, textAlign: "right" }}>
					{mapInfo ? `${mapInfo.topic} | nodes ${nodes.length}` : "map 未選択"} | ws {socketState}
				</div>
			</header>

			{errorMessage && <div style={{ color: "#c62828", padding: "8px 14px" }}>{errorMessage}</div>}
			{formMessage && !composerOpen && (
				<div style={{ color: formMessageType === "error" ? "#c62828" : "#2e7d32", padding: "6px 14px" }}>
					{formMessage}
				</div>
			)}

			<main style={{ position: "relative", flex: 1, minHeight: 0 }}>
				<div style={{ position: "absolute", top: 12, right: 12, zIndex: 2, display: "flex", gap: 8 }}>
					<button style={ghostButton} onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}>-</button>
					<button style={ghostButton} onClick={() => setZoom((z) => Math.min(2, Number((z + 0.1).toFixed(1))))}>+</button>
					<button style={ghostButton} onClick={() => setZoom(1)}>Fit</button>
				</div>

				<div style={{ height: "100%", overflow: "auto", background: gridBackground, position: "relative" }}>
					{!activeMapId && (
						<div style={emptyStateStyle}>
							管理者が作成した mapId を入力して「読み込む」を押してください。
						</div>
					)}
					{activeMapId && !loading && sortedNodes.length === 0 && (
						<div style={emptyStateStyle}>
							このマップにはまだノードがありません。右下の「＋ 投稿」から追加できます。
						</div>
					)}
					<div style={{ width: svgWidth * zoom, height: svgHeight * zoom }}>
						<svg width={svgWidth * zoom} height={svgHeight * zoom} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
							{edges.map((edge) => (
								<line
									key={`${edge.from}-${edge.to}`}
									x1={edge.x1}
									y1={edge.y1}
									x2={edge.x2}
									y2={edge.y2}
									stroke="#9cb0cb"
									strokeWidth={2}
									strokeLinecap="round"
								/>
							))}

							{sortedNodes.map((node) => {
								const pos = positions.get(node.id);
								if (!pos) return null;
								const selected = node.id === selectedParentId;
								return (
									<g key={node.id} onClick={() => setSelectedParentId(node.id)} style={{ cursor: "pointer" }}>
										<rect
											x={pos.x}
											y={pos.y}
											width={NODE_WIDTH}
											height={NODE_HEIGHT}
											rx={14}
											fill={selected ? "#e5f2ff" : "#ffffff"}
											stroke={selected ? "#1976d2" : "#c6d3e6"}
											strokeWidth={selected ? 2.5 : 1.5}
										/>
										<text x={pos.x + 14} y={pos.y + 24} fill="#4f5c73" fontSize={12} fontWeight={700}>
											{node.type}
										</text>
										<foreignObject x={pos.x + 12} y={pos.y + 30} width={NODE_WIDTH - 24} height={NODE_HEIGHT - 36}>
											<div
												xmlns="http://www.w3.org/1999/xhtml"
												style={{
													fontSize: 13,
													lineHeight: 1.3,
													color: "#1e2a3d",
													overflow: "hidden",
													display: "-webkit-box",
													WebkitLineClamp: 2,
													WebkitBoxOrient: "vertical",
												}}
											>
												{node.content}
											</div>
										</foreignObject>
									</g>
								);
							})}
						</svg>
					</div>
				</div>

				<button
					onClick={() => setComposerOpen(true)}
					disabled={!activeMapId}
					style={{
						position: "absolute",
						right: 16,
						bottom: 16,
						zIndex: 3,
						borderRadius: 999,
						padding: "13px 18px",
						background: activeMapId ? "#1976d2" : "#a0b3ce",
						color: "white",
						border: "none",
						fontWeight: 700,
						cursor: activeMapId ? "pointer" : "not-allowed",
						boxShadow: "0 8px 24px rgba(25,118,210,0.35)",
					}}
				>
					＋ 投稿
				</button>

				{composerOpen && (
					<>
						<div onClick={closeComposer} style={overlayStyle} />
						<aside style={drawerStyle}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<h2 style={{ margin: 0, fontSize: 18 }}>ノード投稿</h2>
								<button onClick={closeComposer} style={ghostButton}>閉じる</button>
							</div>

							<p style={{ fontSize: 13, color: "#58657a" }}>
								親ノード: {selectedNode ? `${selectedNode.type} / ${selectedNode.id}` : "未選択"}
							</p>

							<form onSubmit={handleSubmit}>
								<div style={{ marginBottom: 10 }}>
									<label style={labelStyle}>種別</label>
									<select
										value={type}
										onChange={(e) => {
											setType(e.target.value as NodeType);
											setFormMessage("");
										}}
										style={fieldStyle}
									>
										{NODE_TYPES.map((item) => (
											<option key={item.value} value={item.value}>{item.label}</option>
										))}
									</select>
								</div>

								<div style={{ marginBottom: 10 }}>
									<label style={labelStyle}>投稿内容</label>
									<textarea
										value={content}
										onChange={(e) => {
											setContent(e.target.value);
											setFormMessage("");
										}}
										rows={5}
										style={fieldStyle}
									/>
								</div>

								{type === "problem" && (
									<div style={{ marginBottom: 10 }}>
										<label style={labelStyle}>解決策（problem の場合は必須）</label>
										<textarea
											value={solution}
											onChange={(e) => {
												setSolution(e.target.value);
												setFormMessage("");
											}}
											rows={4}
											style={fieldStyle}
										/>
									</div>
								)}

								{formMessage && (
									<p style={{ color: formMessageType === "error" ? "#c62828" : "#2e7d32", marginTop: 4 }}>
										{formMessage}
									</p>
								)}

								<button type="submit" disabled={submitting} style={primaryButton}>
									{submitting ? "送信中..." : "投稿する"}
								</button>
							</form>
						</aside>
					</>
				)}
			</main>
		</div>
	);
}

const gridBackground = {
	backgroundImage:
		"linear-gradient(to right, rgba(150,170,200,.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(150,170,200,.18) 1px, transparent 1px)",
	backgroundSize: "28px 28px",
};

const ghostButton: CSSProperties = {
	padding: "8px 12px",
	borderRadius: 8,
	border: "1px solid #cfd8e6",
	background: "#fff",
	cursor: "pointer",
};

const primaryButton: CSSProperties = {
	padding: "10px 14px",
	borderRadius: 10,
	border: "none",
	background: "#1976d2",
	color: "#fff",
	fontWeight: 700,
	cursor: "pointer",
};

const fieldStyle: CSSProperties = {
	width: "100%",
	padding: 8,
	border: "1px solid #cfd8e6",
	borderRadius: 8,
	fontSize: 14,
};

const labelStyle: CSSProperties = {
	display: "block",
	marginBottom: 4,
	fontWeight: 600,
	fontSize: 13,
	color: "#46526a",
};

const overlayStyle: CSSProperties = {
	position: "absolute",
	inset: 0,
	background: "rgba(0, 0, 0, 0.2)",
	zIndex: 10,
};

const drawerStyle: CSSProperties = {
	position: "absolute",
	top: 0,
	right: 0,
	height: "100%",
	width: "min(420px, 92vw)",
	background: "#fff",
	padding: 16,
	boxShadow: "-12px 0 30px rgba(0,0,0,0.14)",
	zIndex: 11,
	overflowY: "auto",
};

const emptyStateStyle: CSSProperties = {
	position: "absolute",
	inset: 0,
	display: "grid",
	placeItems: "center",
	padding: 24,
	color: "#4d5c75",
	fontSize: 14,
	textAlign: "center",
	pointerEvents: "none",
};

