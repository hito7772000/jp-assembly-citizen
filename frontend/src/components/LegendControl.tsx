import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { markerIcons } from "../lib/markerIcons";
import "./LegendControl.css";

export function LegendControl() {
    const map = useMap();

    useEffect(() => {
        const legend = new L.Control({ position: "bottomright" });

        legend.onAdd = () => {
            const container = L.DomUtil.create("div", "legend-container");

            const isPc = window.innerWidth > 600;
            const defaultOpenClass = isPc ? "open" : "";

            container.innerHTML = `
        <button class="legend-toggle">ℹ️</button>
        <div class="legend-panel ${defaultOpenClass}">
          <b>凡例</b><br>
          <div class="legend-item">
            <img src="${markerIcons.violet.options.iconUrl}" />
            周辺のレポート
          </div>
          <div class="legend-item">
            <img src="${markerIcons.red.options.iconUrl}" />
            クリックした地点
          </div>
          <div class="legend-item">
            <img src="${markerIcons.gray.options.iconUrl}" />
            市役所庁舎
          </div>
        </div>
      `;

            const panel = container.querySelector(".legend-panel");
            const button = container.querySelector(".legend-toggle");

            button?.addEventListener("click", () => {
                panel?.classList.toggle("open");
            });

            L.DomEvent.disableClickPropagation(container);

            return container;
        };

        legend.addTo(map);

        return () => {
            legend.remove();
        };
    }, [map]);

    return null;
}
