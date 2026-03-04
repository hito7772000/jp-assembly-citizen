import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { useLocationStore } from "../store/location";
import { markerIcons } from "../lib/markerIcons";

export function ClickedMarker({ color = "red" }: { color?: keyof typeof markerIcons }) {
    const coords = useLocationStore((s) => s.coords);
    const map = useMap();

    useEffect(() => {
        if (!coords || coords.lat == null || coords.lng == null) return;

        const marker = L.marker([coords.lat, coords.lng], {
            icon: markerIcons[color],
        }).addTo(map);

        return () => {
            map.removeLayer(marker);
        };
    }, [coords, color, map]);

    return null;
}
