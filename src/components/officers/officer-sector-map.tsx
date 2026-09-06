// Browser-only. Loaded via React.lazy inside <ClientOnly> or Suspense.
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Officer } from "@/lib/data/traffic";
import type { OfficerShift } from "@/lib/data/officer-shifts";

if (typeof window !== "undefined") {
  (window as any).L = L;
}

type Props = {
  officer: Officer;
  shift?: OfficerShift | null;
  location?: [number, number];
  patrolRadiusMeters?: number;
};

export default function OfficerSectorMap({
  officer,
  shift,
  location = [14.6640, 121.0500],
  patrolRadiusMeters = 650,
}: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;

    if (typeof window !== "undefined") {
      (window as any).L = L;
    }

    if ((nodeRef.current as any)._leaflet_id) {
      delete (nodeRef.current as any)._leaflet_id;
    }

    let map: L.Map | null = null;
    try {
      map = L.map(nodeRef.current, {
        center: location,
        zoom: 15,
        zoomControl: false,
        preferCanvas: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    } catch (err) {
      console.warn("OfficerSectorMap init warning:", err);
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

  // Update map markers and patrol sector perimeter
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    map.setView(location, 15);

    // Patrol Perimeter Boundary Circle
    L.circle(location, {
      radius: patrolRadiusMeters,
      color: officer.on_duty ? "#10b981" : "#64748b",
      weight: 1.5,
      dashArray: "4, 6",
      fillColor: officer.on_duty ? "#10b981" : "#64748b",
      fillOpacity: 0.1,
    }).addTo(layer);

    // Custom Officer Pulsing Marker
    const markerHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-3 rounded-full ${officer.on_duty ? "bg-emerald-500/25 animate-ping" : "bg-neutral-500/20"}"></div>
        <div class="relative flex items-center justify-center size-10 rounded-full ${officer.on_duty ? "bg-[#0b0f17] border-2 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)]" : "bg-neutral-900 border-2 border-neutral-500"} text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${officer.on_duty ? "#34d399" : "#94a3b8"}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 4.8 17 6 19 6a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <div class="absolute -bottom-6 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 font-mono text-[9px] font-bold text-white border border-white/15 shadow-xl">
          #${officer.badge_number} · ${officer.on_duty ? "ACTIVE" : "OFF-DUTY"}
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: markerHtml,
      className: "officer-sector-beacon",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <div>
            <strong style="color: #fff; font-size: 13px; display: block;">${officer.full_name}</strong>
            <span style="color: rgba(255,255,255,0.5); font-size: 10px; font-family: monospace;">Badge #${officer.badge_number} · ${officer.rank}</span>
          </div>
          <span style="background: ${officer.on_duty ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)"}; color: ${officer.on_duty ? "#34d399" : "#94a3b8"}; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; border: 1px solid ${officer.on_duty ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.15)"};">
            ${officer.on_duty ? "LIVE PATROL" : "REST SHIFT"}
          </span>
        </div>
        <div style="margin-top: 8px; background: rgba(0,0,0,0.5); padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
          <span style="color: rgba(255,255,255,0.4); font-size: 9px; text-transform: uppercase; display: block; font-family: monospace;">Designated Sector</span>
          <span style="color: #fff; font-size: 11px; font-weight: 500;">${officer.district || "District 1 - Culiat Central"}</span>
        </div>
        ${shift ? `
          <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.6); font-family: monospace;">
            <span>Battery: <strong style="color: #34d399;">${shift.batteryLevel}%</strong></span>
            <span>Task: <strong style="color: #fff;">${shift.currentTask}</strong></span>
          </div>
        ` : ""}
      </div>
    `;

    L.marker(location, { icon }).addTo(layer).bindPopup(popupHtml).openPopup();
  }, [location, officer, shift, patrolRadiusMeters]);

  return <div ref={nodeRef} className="size-full rounded-2xl overflow-hidden" />;
}
