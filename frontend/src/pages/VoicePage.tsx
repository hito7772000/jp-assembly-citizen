import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useLocationStore } from "../store/location";
import { useNavigate } from "react-router-dom";
import { VoiceSummary } from "../components/VoiceSummary";
import { useEffect } from "react";
import L from "leaflet";
import { markerIcons } from "../lib/markerIcons";

function SelectedLocationMarker() {
    const coords = useLocationStore((s) => s.coords);
    const map = useMap();

    useEffect(() => {
        if (!coords || coords.lat == null || coords.lng == null) return;

        const marker = L.marker([coords.lat, coords.lng], {
            icon: markerIcons.red,
        }).addTo(map);

        return () => {
            map.removeLayer(marker);
        };
    }, [coords, map]);

    return null;
}

export default function VoicePage() {
    const { pref, city, coords } = useLocationStore();
    const navigate = useNavigate();

    const lat = coords?.lat;
    const lng = coords?.lng;

    useEffect(() => {
        if (!pref || !city) {
            navigate("/");
        }
    }, [pref, city, navigate]);

    const hasValidCoords = lat != null && lng != null;

    return (
        <div style={{ height: "100vh", padding: 20 }}>
            {hasValidCoords && (
                <div style={{ height: "30%", width: "100%", marginBottom: "16px" }}>
                    <MapContainer
                        center={[lat as number, lng as number]}  // ← null ではないと保証
                        zoom={17}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        <SelectedLocationMarker />
                    </MapContainer>
                </div>
            )}

            {hasValidCoords && (
                <h3>
                    {pref} {city}（{lat!.toFixed(5)}, {lng!.toFixed(5)}）への投稿
                </h3>
            )}

            <VoiceSummary />
        </div>
    );
}
