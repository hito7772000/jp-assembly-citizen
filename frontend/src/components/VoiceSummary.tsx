import { useState, useRef, useEffect } from "react";
import { useLocationStore } from "../store/location";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

export function VoiceSummary() {
    const navigate = useNavigate();
    const clearCoords = useLocationStore((s) => s.setCoords);

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [finalData, setFinalData] = useState<any>(null);
    const [awaitConfirm, setAwaitConfirm] = useState(false);
    const [posted, setPosted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const pushAI = (text: string) => {
        setMessages((prev) => [...prev, { from: "ai", text }]);
    };

    const pushUser = (text: string) => {
        setMessages((prev) => [...prev, { from: "user", text }]);
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;

        pushUser(input);
        setLoading(true);
        pushAI("内容を整理しています…");

        try {
            const res = await fetch(`${API_BASE}/voice/summary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input }),
            });

            const data = await res.json();
            setFinalData(data);

            pushAI(data.emotion);

            if (!Array.isArray(data.issues) || data.issues.length === 0 ||
                !Array.isArray(data.solutions) || data.solutions.length === 0) {

                pushAI("⚠️ 問題点または改善案が抽出できませんでした。投稿できません。");
                setAwaitConfirm(false);
                return;
            }

            const summaryCard =
                `📘 整理した内容\n\n` +
                `【問題点】\n${data.issues.map((i: string) => "・" + i).join("\n")}\n\n` +
                `【改善案】\n${data.solutions.map((s: string) => "・" + s).join("\n")}\n\n`;

            pushAI(summaryCard);
            pushAI("この内容で投稿しますか？");

            setAwaitConfirm(true);
        } catch (err: any) {
            if (err.name === "AbortError") {
                pushAI("⚠️ サーバーの応答がありません（タイムアウト）。トップに戻ります。");
            } else {
                pushAI("⚠️ エラーが発生しました。トップに戻ります。");
            }

            setTimeout(() => navigate("/"), 3000);
        } finally {
            setLoading(false);
            setInput("");
        }
    };

    const { municipalityCode, coords } = useLocationStore();

    const handleConfirm = async (yes: boolean) => {
        setAwaitConfirm(false);

        if (yes && finalData) {
            pushUser("はい");

            await fetch(`${API_BASE}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    municipality_code: municipalityCode,
                    geometry: coords,
                    problems: finalData.issues,
                    solutions: finalData.solutions,
                    tags: finalData.tags,
                }),
            });

            pushAI("投稿が完了しました。ありがとうございます。");
            setPosted(true);

            setTimeout(() => {
                clearCoords(null, null);
                navigate("/mapPage");
            }, 3000);
        } else {
            pushUser("いいえ");
            pushAI("投稿をキャンセルしました。必要であれば、もう一度入力してください。");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "90vh",
                maxWidth: 300,
                margin: "0 auto",
            }}
        >
            <h2 style={{ textAlign: "center" }}>市民の声（PoC）</h2>

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                            background: msg.from === "user" ? "rgba(0, 120, 212, 0.9)" : "#f2f2f2",
                            color: msg.from === "user" ? "#fff" : "#000",
                            padding: "10px 14px",
                            borderRadius: 12,
                            maxWidth: "80%",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {msg.text}
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {awaitConfirm && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 20,
                        padding: 10,
                        borderTop: "1px solid #444",
                    }}
                >
                    <button
                        onClick={() => handleConfirm(true)}
                        style={{
                            padding: "10px 20px",
                            borderRadius: 20,
                            background: "#0078d4",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        はい
                    </button>

                    <button
                        onClick={() => handleConfirm(false)}
                        style={{
                            padding: "10px 20px",
                            borderRadius: 20,
                            background: "#555",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        いいえ
                    </button>
                </div>
            )}

            {!posted && !awaitConfirm && (
                <div
                    style={{
                        display: "flex",
                        padding: 10,
                        borderTop: "1px solid #444",
                        gap: 10,
                    }}
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmit();
                        }}
                        placeholder="メッセージを入力..."
                        style={{
                            flex: 1,
                            padding: "10px 14px",
                            borderRadius: 20,
                            border: "1px solid #666",
                            background: "#222",
                            color: "#fff",
                        }}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 20,
                            background: loading ? "#555" : "#0078d4",
                            color: "#fff",
                            border: "none",
                            cursor: loading ? "default" : "pointer",
                        }}
                    >
                        送信
                    </button>
                </div>
            )}
        </div>
    );
}
