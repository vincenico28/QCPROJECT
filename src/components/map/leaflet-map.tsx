// Browser-only. Loaded via React.lazy inside <ClientOnly>.
// Never import this module from an SSR-reachable path statically.
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";
import type { GeoViolation } from "@/lib/data/gis";
import { violationColor } from "@/lib/data/gis";
import type { Camera } from "@/lib/data/traffic";

type Props = {
  violations: GeoViolation[];
  cameras: Camera[];
  center: [number, number];
  showHeatmap: boolean;
  showMarkers: boolean;
  showCameras: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HeatLayer = any;

export default function LeafletMap({
  violations,
  cameras,
  center,
  showHeatmap,
  showMarkers,
  showCameras,
}: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatRef = useRef<HeatLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const cameraLayerRef = useRef<L.LayerGroup | null>(null);

  // init map once
  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;
    const map = L.map(nodeRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
      preferCanvas: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    cameraLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // ensure correct sizing after mount inside flex container
    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      mapRef.current = null;
      heatRef.current = null;
      markerLayerRef.current = null;
      cameraLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // heat points
  const heatPoints = useMemo(
    () =>
      violations.map(
        (v) =>
          [v.lat, v.lng, Math.max(0.2, Number(v.confidence) / 100)] as [number, number, number],
      ),
    [violations],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }
    if (showHeatmap && heatPoints.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      heatRef.current = (L as any)
        .heatLayer(heatPoints, {
          radius: 28,
          blur: 22,
          maxZoom: 17,
          minOpacity: 0.35,
          gradient: {
            0.2: "#3b82f6",
            0.45: "#10b981",
            0.65: "#f59e0b",
            0.85: "#ef4444",
          },
        })
        .addTo(map);
    }
  }, [heatPoints, showHeatmap]);

  // markers
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showMarkers) return;
    for (const v of violations) {
      const color = violationColor(v.violation_type);
      const marker = L.circleMarker([v.lat, v.lng], {
        radius: 5,
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.7,
      });
      marker.bindPopup(
        `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5">
          <div style="font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.08em">${escapeHtml(v.violation_type)}</div>
          <div style="margin-top:4px">Plate <b>${escapeHtml(v.plate_number)}</b></div>
          <div>${escapeHtml(v.location)}</div>
          <div style="opacity:.7">Confidence ${Number(v.confidence).toFixed(1)}%</div>
          <div style="opacity:.7">${new Date(v.detected_at).toLocaleString()}</div>
        </div>`,
      );
      marker.addTo(layer);
    }
  }, [violations, showMarkers]);

  // cameras
  useEffect(() => {
    const layer = cameraLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showCameras) return;
    for (const c of cameras) {
      if (c.lat == null || c.lng == null) continue;
      const online = c.status !== "offline";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:4px;border:2px solid ${
          online ? "#10b981" : "#64748b"
        };background:rgba(15,23,42,.85);box-shadow:0 0 8px ${
          online ? "rgba(16,185,129,.6)" : "rgba(100,116,139,.4)"
        }"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([Number(c.lat), Number(c.lng)], { icon });
      marker.bindPopup(
        `<div style="font-family:'JetBrains Mono',monospace;font-size:11px">
          <div style="font-weight:700">${escapeHtml(c.code)}</div>
          <div>${escapeHtml(c.location)}</div>
          <div style="opacity:.7;text-transform:uppercase">${escapeHtml(c.status)}</div>
        </div>`,
      );
      marker.addTo(layer);
    }
  }, [cameras, showCameras]);

  return <div ref={nodeRef} className="size-full" aria-label="Interactive GIS map" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}
