import { Link } from "react-router-dom";
import { useLocationStore } from "../store/location";
import { useEffect } from "react";

const prefectures = ["山形県", "東京都"];

export default function AreaPage() {
    const setPref = useLocationStore((s) => s.setPref);
    const reset = useLocationStore((s) => s.reset);

    useEffect(() => {
        reset();
    }, [reset]);

    return (
        <div style={{ padding: 20 }}>
            <h2>都道府県を選択</h2>

            {prefectures.map((p) => (
                <div key={p} style={{ marginBottom: 8 }}>
                    <Link
                        to="/municipalityPage"
                        onClick={() => setPref(p)}
                    >
                        {p}
                    </Link>
                </div>
            ))}
        </div>
    );
}
