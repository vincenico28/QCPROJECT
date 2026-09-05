// Browser-only Predictive Heatmap component loaded via lazy inside <ClientOnly>
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { HeatmapPoint } from "@/lib/data/heatmaps";

if (typeof window !== "undefined") {
  (window as any).L = L;
}

type Props = {
  points: HeatmapPoint[];
  center: [number, number];
};

export default function PredictiveHeatmap({ points, center }: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;

    if (typeof window !== "undefined") {
      (window as any).L = L;
    }

    // Defensive cleanup of any stale Leaflet ID on the DOM node
    if ((nodeRef.current as any)._leaflet_id) {
      delete (nodeRef.current as any)._leaflet_id;
    }

    let map: L.Map | null = null;
    try {
      map = L.map(nodeRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        preferCanvas: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    } catch (err) {
      console.warn("Predictive heatmap init warning:", err);
    }

    return () => {
      try {
        if (map) {
          map.remove();
        }
      } catch (err) {
        console.warn("Leaflet cleanup error:", err);
      }
      if (nodeRef.current && (nodeRef.current as any)._leaflet_id) {
        delete (nodeRef.current as any)._leaflet_id;
      }
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !points.length) return;

    layer.clearLayers();

    points.forEach((point) => {
      const color =
        point.intensity > 0.8 ? "#ef4444" : point.intensity > 0.5 ? "#f97316" : "#eab308";
      const riskLevel =
        point.intensity > 0.8 ? "Critical (90%+ Prob)" : point.intensity > 0.5 ? "Warning (70-89%)" : "Elevated (50-69%)";

      // Outer glow pulse
      const outerGlow = L.circleMarker([point.lat, point.lng], {
        radius: Math.max(14, point.intensity * 32),
        color: "transparent",
        fillColor: color,
        fillOpacity: 0.22,
        interactive: false,
      });
      outerGlow.addTo(layer);

      // Main Heat Bubble
      const bubble = L.circleMarker([point.lat, point.lng], {
        radius: Math.max(8, point.intensity * 20),
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.65,
      });

      bubble.bindPopup(
        `<div style="font-family: Inter, sans-serif; font-size: 12px; color: #fff; min-width: 170px; padding: 4px;">
          <div style="font-weight: 700; font-size: 13px; color: ${color}; margin-bottom: 2px;">
            ${escapeHtml(point.label)}
          </div>
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${color}; font-weight: 600; margin-bottom: 6px;">
            ${riskLevel}
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; font-family: monospace;">
            <span style="color: rgba(255,255,255,0.6);">Pred. Violations:</span>
            <strong style="color: #fff;">${point.predictedViolations}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 3px; font-family: monospace;">
            <span style="color: rgba(255,255,255,0.6);">Risk Score:</span>
            <strong style="color: #fff;">${(point.intensity * 100).toFixed(0)}%</strong>
          </div>
        </div>`
      );

      bubble.addTo(layer);
    });
  }, [points]);

  return <div ref={nodeRef} className="size-full" aria-label="Predictive AI GIS Heatmap" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}
