import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useLocationStore } from "../store/location";
import { cityCenters } from "../data/city-centers";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { API_BASE } from "../lib/api";
import { markerIcons } from "../lib/markerIcons";

type Report = {
    id: number;
    geometry: { lat: number; lng: number };
    problems: string[];
    solutions: string[];
};

function CenterOnCity() {
    const city = useLocationStore((s) => s.city);
    const map = useMap();

    useEffect(() => {
        if (city && cityCenters[city]) {
            const { lat, lng } = cityCenters[city];
            map.setView([lat, lng], 16);
        }
    }, [city, map]);

    return null;
}

function ClickHandler() {
    const setCoords = useLocationStore((s) => s.setCoords);
    const navigate = useNavigate();

    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            const { lat, lng } = e.latlng;
            setCoords(lat, lng);
            navigate("/voicePage");
        },
    });

    return null;
}

function ClickedMarker() {
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

function NearbyReports() {
    const map = useMap();
    const municipalityCode = useLocationStore((s) => s.municipalityCode);
    const [reports, setReports] = useState<Report[]>([]);
    const isFetchingRef = useRef(false);
    const hasErrorRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReports = async () => {
            if (isFetchingRef.current || hasErrorRef.current) return;
            isFetchingRef.current = true;

            const center = map.getCenter();
            const bounds = map.getBounds();
            const radius = center.distanceTo(bounds.getNorthEast());

            try {
                const res = await fetch(
                    `${API_BASE}/reports/nearby?lat=${center.lat}&lng=${center.lng}&radius=${radius}&municipality_code=${municipalityCode}`
                );

                if (!res.ok) {
                    hasErrorRef.current = true;
                    alert("サーバーエラーが発生しました。");
                    setTimeout(() => navigate("/"), 3000);
                    return;
                }

                const data: Report[] = await res.json();
                setReports(data);
            } finally {
                isFetchingRef.current = false;
            }
        };

        fetchReports();
        map.on("moveend", fetchReports);

        return () => {
            map.off("moveend", fetchReports);
        };
    }, [map, municipalityCode, navigate]);

    useEffect(() => {
        const markers: L.Marker[] = [];

        reports.forEach((r) => {
            const marker = L.marker([r.geometry.lat, r.geometry.lng], {
                icon: markerIcons.violet,
            }).addTo(map);


            const html = `
              <b>問題点</b><br>
              ${r.problems.map((p) => `・${p}`).join("<br>")}
              <br><br>
              <b>改善案</b><br>
              ${r.solutions.map((s) => `・${s}`).join("<br>")}
            `;

            marker.bindPopup(html);
            markers.push(marker);
        });

        return () => {
            markers.forEach((m) => map.removeLayer(m));
        };
    }, [reports, map]);

    return null;
}

function CityHallMarker() {
    const city = useLocationStore((s) => s.city);
    const map = useMap();
    const center = city ? cityCenters[city] : null;

    useEffect(() => {
        if (!center) return;

        const marker = L.marker([center.lat, center.lng], {
            icon: markerIcons.gray,
        }).addTo(map);
        marker.bindPopup(`<b>${city} 市役所庁舎</b>`);

        return () => {
            map.removeLayer(marker);
        };
    }, [center, map]);

    return null;
}

export default function MapPage() {
    const pref = useLocationStore((s) => s.pref);
    const city = useLocationStore((s) => s.city);
    const municipalityCode = useLocationStore((s) => s.municipalityCode);
    const navigate = useNavigate();
    const hydrated = useLocationStore((s) => s.hydrated);

    if (!hydrated) return null;

    useEffect(() => {
        if (!pref || !city || !municipalityCode) {
            navigate("/");
        }
    }, [pref, city, municipalityCode, navigate]);

    return (
        <div style={{ height: "100vh" }}>
            <MapContainer
                center={[35.68, 139.76]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                <CityHallMarker />
                <CenterOnCity />
                <ClickHandler />
                <NearbyReports />
                <ClickedMarker />
            </MapContainer>
        </div>
    );
}
