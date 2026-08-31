// Browser-only. Loaded via React.lazy inside <ClientOnly> or Suspense.
// Never import this module from an SSR-reachable path statically.
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Officer } from "@/lib/data/traffic";
import type { OfficerShift } from "@/lib/data/officer-shifts";

if (typeof window !== "undefined") {
  (window as any).L = L;
}

type Props = {
  shifts: OfficerShift[];
  officers: Officer[];
  center?: [number, number];
  zoom?: number;
  selectedBadge?: string | null;
  onSelectOfficer?: (badge: string) => void;
};

export default function OfficerShiftsMap({
  shifts,
  officers,
  center = [14.6640, 121.0500],
  zoom = 14,
  selectedBadge,
  onSelectOfficer,
}: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map instance once
  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;

    if (typeof window !== "undefined") {
      (window as any).L = L;
    }

    const map = L.map(nodeRef.current, {
      center,
      zoom,
      zoomControl: false,
      preferCanvas: true,
    });

    // Dark sleek map tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Zoom control on top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    const markers = L.layerGroup().addTo(map);
    markerLayerRef.current = markers;
    mapRef.current = map;

    // Sizing invalidation after mount
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      try {
        map.remove();
      } catch (err) {
        console.warn("Leaflet cleanup error:", err);
      }
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render & update officer GPS markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    shifts.forEach((shift) => {
      const officer = officers.find((o) => o.badge_number === shift.badgeNumber);
      const isSelected = selectedBadge === shift.badgeNumber;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute -inset-2 rounded-full ${isSelected ? "bg-primary/40 animate-ping" : "bg-emerald-500/20 animate-pulse"}"></div>
          <div class="relative flex items-center justify-center size-9 rounded-full ${isSelected ? "bg-primary border-2 border-white shadow-[0_0_15px_var(--color-primary)]" : "bg-[#12141a] border-2 border-emerald-400 shadow-lg"} text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 4.8 17 6 19 6a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap rounded bg-black/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white border border-white/10 shadow">
            #${shift.badgeNumber}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-officer-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker(shift.location, { icon: customIcon }).addTo(layer);

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <div>
              <strong style="color: #fff; font-size: 13px; display: block;">${officer?.full_name || "Enforcement Officer"}</strong>
              <span style="color: rgba(255,255,255,0.5); font-size: 10px; font-family: monospace;">Badge #${shift.badgeNumber} &bull; ${officer?.unit || "Traffic Sector"}</span>
            </div>
            <span style="background: rgba(16,185,129,0.2); color: #34d399; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; border: 1px solid rgba(16,185,129,0.3);">ONLINE</span>
          </div>
          <div style="margin-top: 8px; background: rgba(0,0,0,0.4); padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
            <span style="color: rgba(255,255,255,0.5); font-size: 9px; text-transform: uppercase; display: block; font-family: monospace;">Active Mission Task</span>
            <span style="color: #fff; font-size: 11px; font-weight: 500;">${shift.currentTask}</span>
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.6); font-family: monospace;">
            <span>Shift: ${new Date(shift.shiftStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <span>Battery: ${shift.batteryLevel}%</span>
          </div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); text-align: right;">
            <a href="/officers/${shift.badgeNumber}" style="color: #3b82f6; font-size: 11px; font-weight: bold; text-decoration: none;">View Full Dossier &rarr;</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: "custom-dark-popup",
      });

      marker.on("click", () => {
        if (onSelectOfficer) {
          onSelectOfficer(shift.badgeNumber);
        }
      });

      if (isSelected) {
        marker.openPopup();
        map.panTo(shift.location, { animate: true });
      }
    });
  }, [shifts, officers, selectedBadge, onSelectOfficer]);

  return <div ref={nodeRef} className="size-full bg-background" />;
}
