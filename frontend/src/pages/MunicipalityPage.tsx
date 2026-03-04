import { Link, useNavigate } from "react-router-dom";
import { useLocationStore } from "../store/location";
import { cityCenters } from "../data/city-centers";

const cities: Record<string, string[]> = {
    "東京都": ["日野市"]
};

export default function MunicipalityPage() {
    const pref = useLocationStore((s) => s.pref);
    const setCity = useLocationStore((s) => s.setCity);
    const setMunicipalityCode = useLocationStore((s) => s.setMunicipalityCode);
    const navigate = useNavigate();

    if (!pref) {
        navigate("/");
        return null;
    }

    return (
        <div style={{ padding: 20 }}>
            <h2>{pref} の市区町村を選択</h2>

            {cities[pref]?.map((c) => (
                <div key={c} style={{ marginBottom: 8 }}>
                    <Link
                        to="/mapPage"
                        onClick={() => {
                            setCity(c);
                            setMunicipalityCode(cityCenters[c].code);
                        }}
                    >
                        {c}
                    </Link>
                </div>
            ))}
        </div>
    );
}
