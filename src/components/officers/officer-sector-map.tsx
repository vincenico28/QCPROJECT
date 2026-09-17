// Browser-only. Loaded via React.lazy inside <ClientOnly> or Suspense.
import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import {
  Crosshair,
  Radio,
  Video,
  AlertTriangle,
  Play,
  Square,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Compass,
  Eye,
  Camera,
  MapPin,
} from "lucide-react";
import type { Officer } from "@/lib/data/traffic";
import type { OfficerShift } from "@/lib/data/officer-shifts";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  (window as any).L = L;
}

// Culiat Sector A Corridor Polygon (Quezon City Enforcer Beat)
const CULIAT_SECTOR_A_POLYGON: [number, number][] = [
  [14.6735, 121.0440],
  [14.6760, 121.0560],
  [14.6690, 121.0645],
  [14.6565, 121.0570],
  [14.6550, 121.0470],
  [14.6620, 121.0410],
];

// Active High-Definition CCTV Nodes along Sector Corridors
const SECTOR_CCTV_BEACONS = [
  {
    id: "CAM-042",
    name: "Commonwealth Ave / Tandang Sora Flyover",
    type: "4K PTZ ANPR Dome",
    coords: [14.6645, 121.0505] as [number, number],
    status: "ONLINE",
    fps: "60 FPS",
    detectionsToday: 142,
    speedRadar: true,
  },
  {
    id: "CAM-108",
    name: "Visayas Ave cor. Central Ave",
    type: "Dual-Lens Traffic Sensor",
    coords: [14.6610, 121.0468] as [number, number],
    status: "ONLINE",
    fps: "30 FPS",
    detectionsToday: 89,
    speedRadar: false,
  },
  {
    id: "CAM-059",
    name: "Tandang Sora cor. Culiat High School",
    type: "Pedestrian & Red Light Enforcer",
    coords: [14.6685, 121.0558] as [number, number],
    status: "ONLINE",
    fps: "60 FPS",
    detectionsToday: 64,
    speedRadar: true,
  },
  {
    id: "CAM-021",
    name: "Luzon Ave Overpass Connector",
    type: "High-Speed Radar Fixed",
    coords: [14.6582, 121.0525] as [number, number],
    status: "ONLINE",
    fps: "60 FPS",
    detectionsToday: 110,
    speedRadar: true,
  },
];

// High-Incident Violation Hotspots (Traffic Intelligence)
const SECTOR_INCIDENT_HOTSPOTS = [
  {
    id: "HOT-01",
    title: "Bus Lane Intrusion Zone",
    corridor: "Commonwealth Ave Westbound",
    coords: [14.6658, 121.0518] as [number, number],
    frequency: "High Risk · 18/day",
    category: "Bus Lane Violation",
    color: "#ef4444",
  },
  {
    id: "HOT-02",
    title: "Illegal Terminal & Loading Zone",
    corridor: "Tandang Sora Market Outer Lane",
    coords: [14.6672, 121.0542] as [number, number],
    frequency: "Moderate · 12/day",
    category: "Obstruction",
    color: "#f59e0b",
  },
  {
    id: "HOT-03",
    title: "Yellow Box Gridlock Chokepoint",
    corridor: "Visayas Central Crossing",
    coords: [14.6615, 121.0475] as [number, number],
    frequency: "Moderate · 10/day",
    category: "Yellow Box Infraction",
    color: "#f59e0b",
  },
];

// Predefined Patrol Sweep Waypoints (Simulation Loop)
const PATROL_SWEEP_WAYPOINTS: [number, number][] = [
  [14.6640, 121.0500],
  [14.6655, 121.0515],
  [14.6672, 121.0538],
  [14.6685, 121.0558],
  [14.6660, 121.0585],
  [14.6625, 121.0540],
  [14.6610, 121.0470],
  [14.6628, 121.0485],
  [14.6640, 121.0500],
];

// Ray-casting algorithm to test if officer coords are inside polygon
function isPointInPolygon(point: [number, number], vs: [number, number][]) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

type Props = {
  officer: Officer;
  shift?: OfficerShift | null;
  location?: [number, number];
  patrolRadiusMeters?: number;
  className?: string;
};

export default function OfficerSectorMap({
  officer,
  shift,
  location = [14.6640, 121.0500],
  patrolRadiusMeters = 650,
  className,
}: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Dynamic Telemetry & Layer States
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(location);
  const [showCctv, setShowCctv] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showSectorBoundary, setShowSectorBoundary] = useState(true);
  const [isSimulatingSweep, setIsSimulatingSweep] = useState(false);
  const [patrolWaypoints, setPatrolWaypoints] = useState<[number, number][]>([location]);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);

  // Sync external location prop if not simulating
  useEffect(() => {
    if (!isSimulatingSweep) {
      setCurrentLocation(location);
    }
  }, [location, isSimulatingSweep]);

  // Patrol Sweep Simulation Timer
  useEffect(() => {
    if (!isSimulatingSweep) return;

    const interval = setInterval(() => {
      setCurrentWaypointIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % PATROL_SWEEP_WAYPOINTS.length;
        const nextCoord = PATROL_SWEEP_WAYPOINTS[nextIdx];
        setCurrentLocation(nextCoord);
        setPatrolWaypoints((prevList) => [...prevList.slice(-14), nextCoord]);
        return nextIdx;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulatingSweep]);

  // Check geofence status
  const isWithinGeofence = useMemo(() => {
    return isPointInPolygon(currentLocation, CULIAT_SECTOR_A_POLYGON);
  }, [currentLocation]);

  // Leaflet Map Initialization
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
        center: currentLocation,
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

  // Render Map Features, Polygons, CCTV Beacons, Hotspots & Officer Marker
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Sector Corridor Boundary Polygon
    if (showSectorBoundary) {
      L.polygon(CULIAT_SECTOR_A_POLYGON, {
        color: isWithinGeofence ? "#10b981" : "#ef4444",
        weight: 2,
        dashArray: "6, 8",
        fillColor: isWithinGeofence ? "#10b981" : "#ef4444",
        fillOpacity: 0.08,
      })
        .addTo(layer)
        .bindTooltip("Culiat Sector A Corridor Perimeter", {
          sticky: true,
          className: "leaflet-sector-tooltip font-mono text-[10px]",
        });
    }

    // 2. Patrol Waypoints Breadcrumb Trail (Polyline)
    if (patrolWaypoints.length > 1) {
      L.polyline(patrolWaypoints, {
        color: "#38bdf8",
        weight: 2.5,
        opacity: 0.85,
        dashArray: "3, 5",
      }).addTo(layer);

      // Breadcrumb dot markers
      patrolWaypoints.slice(0, -1).forEach((pt, i) => {
        const breadcrumbIcon = L.divIcon({
          html: `<div class="size-2 rounded-full bg-cyan-400/80 ring-2 ring-cyan-500/30"></div>`,
          className: "patrol-breadcrumb-dot",
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        });
        L.marker(pt, { icon: breadcrumbIcon }).addTo(layer);
      });
    }

    // 3. Active CCTV Nodes
    if (showCctv) {
      SECTOR_CCTV_BEACONS.forEach((cam) => {
        const cctvHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-1.5 rounded-full bg-cyan-500/20 animate-pulse"></div>
            <div class="size-7 rounded-lg bg-slate-900/90 border border-cyan-400/80 shadow-lg flex items-center justify-center text-cyan-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap rounded bg-black/90 px-1 py-0.2 font-mono text-[7.5px] font-bold text-cyan-300 border border-cyan-500/30 shadow">
              ${cam.id}
            </div>
          </div>
        `;

        const cctvIcon = L.divIcon({
          html: cctvHtml,
          className: "cctv-node-beacon",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const cctvPopup = `
          <div style="font-family: system-ui, sans-serif; min-width: 210px; padding: 4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
              <span style="font-weight:bold; color:#38bdf8; font-family:monospace; font-size:11px;">${cam.id} · ${cam.status}</span>
              <span style="background:rgba(56,189,248,0.15); color:#38bdf8; font-size:8px; font-weight:bold; padding:2px 5px; border-radius:4px;">${cam.fps}</span>
            </div>
            <div style="margin-top:6px; color:#fff; font-size:11px; font-weight:600;">${cam.name}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:2px;">${cam.type}</div>
            <div style="display:flex; justify-content:space-between; margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.06); font-family:monospace; font-size:9px; color:rgba(255,255,255,0.5);">
              <span>AI ANPR Today:</span>
              <strong style="color:#fff;">${cam.detectionsToday} plates</strong>
            </div>
          </div>
        `;

        L.marker(cam.coords, { icon: cctvIcon }).addTo(layer).bindPopup(cctvPopup);
      });
    }

    // 4. High-Incident Violation Hotspots
    if (showHotspots) {
      SECTOR_INCIDENT_HOTSPOTS.forEach((hotspot) => {
        // Warning heat zone
        L.circle(hotspot.coords, {
          radius: 120,
          color: hotspot.color,
          weight: 1,
          dashArray: "3, 5",
          fillColor: hotspot.color,
          fillOpacity: 0.12,
        }).addTo(layer);

        const hotspotHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute -inset-1 rounded-full animate-ping" style="background-color: ${hotspot.color}30;"></div>
            <div class="size-6 rounded-full border border-white/40 shadow-lg flex items-center justify-center text-white" style="background-color: ${hotspot.color};">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
        `;

        const hotspotIcon = L.divIcon({
          html: hotspotHtml,
          className: "incident-hotspot-beacon",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const hotspotPopup = `
          <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
              <span style="font-weight:bold; color:${hotspot.color}; font-family:monospace; font-size:10px;">${hotspot.id} · HOTSPOT</span>
              <span style="color:#fff; font-size:9px; font-weight:bold;">${hotspot.frequency}</span>
            </div>
            <div style="margin-top:6px; color:#fff; font-size:11px; font-weight:600;">${hotspot.title}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:2px;">${hotspot.corridor}</div>
            <div style="margin-top:6px; font-size:9px; color:#fbbf24; font-family:monospace;">Focus Offense: ${hotspot.category}</div>
          </div>
        `;

        L.marker(hotspot.coords, { icon: hotspotIcon }).addTo(layer).bindPopup(hotspotPopup);
      });
    }

    // 5. Officer Patrol Radius Circle
    L.circle(currentLocation, {
      radius: patrolRadiusMeters,
      color: isWithinGeofence ? (officer.on_duty ? "#10b981" : "#64748b") : "#ef4444",
      weight: 1.5,
      dashArray: "4, 6",
      fillColor: isWithinGeofence ? (officer.on_duty ? "#10b981" : "#64748b") : "#ef4444",
      fillOpacity: 0.08,
    }).addTo(layer);

    // 6. Custom Officer Pulsing Marker
    const markerHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-3 rounded-full ${
          isWithinGeofence && officer.on_duty ? "bg-emerald-500/25 animate-ping" : "bg-amber-500/20"
        }"></div>
        <div class="relative flex items-center justify-center size-10 rounded-full ${
          isWithinGeofence && officer.on_duty
            ? "bg-[#0b0f17] border-2 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)]"
            : "bg-neutral-900 border-2 border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.6)]"
        } text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${
            isWithinGeofence && officer.on_duty ? "#34d399" : "#fbbf24"
          }" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 4.8 17 6 19 6a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <div class="absolute -bottom-6 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 font-mono text-[9px] font-bold text-white border border-white/15 shadow-xl">
          #${officer.badge_number} · ${isWithinGeofence ? (officer.on_duty ? "PATROL ACTIVE" : "OFF-DUTY") : "OUT OF BOUNDS"}
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
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; padding: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <div>
            <strong style="color: #fff; font-size: 13px; display: block;">${officer.full_name}</strong>
            <span style="color: rgba(255,255,255,0.5); font-size: 10px; font-family: monospace;">Badge #${officer.badge_number} · ${officer.rank}</span>
          </div>
          <span style="background: ${
            isWithinGeofence ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"
          }; color: ${
      isWithinGeofence ? "#34d399" : "#f87171"
    }; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; border: 1px solid ${
      isWithinGeofence ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"
    };">
            ${isWithinGeofence ? "IN BOUNDS" : "OUT OF SECTOR"}
          </span>
        </div>
        <div style="margin-top: 8px; background: rgba(0,0,0,0.5); padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
          <span style="color: rgba(255,255,255,0.4); font-size: 9px; text-transform: uppercase; display: block; font-family: monospace;">Designated Sector</span>
          <span style="color: #fff; font-size: 11px; font-weight: 500;">${officer.district || "District 1 - Culiat Central"}</span>
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.6); font-family: monospace;">
          <span>GPS Fix: <strong style="color: #38bdf8;">${currentLocation[0].toFixed(4)}°N, ${currentLocation[1].toFixed(4)}°E</strong></span>
        </div>
        ${
          shift
            ? `
          <div style="margin-top: 6px; display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.6); font-family: monospace;">
            <span>Battery: <strong style="color: #34d399;">${shift.batteryLevel}%</strong></span>
            <span>Task: <strong style="color: #fff;">${shift.currentTask}</strong></span>
          </div>
        `
            : ""
        }
      </div>
    `;

    L.marker(currentLocation, { icon }).addTo(layer).bindPopup(popupHtml);
  }, [
    currentLocation,
    officer,
    shift,
    patrolRadiusMeters,
    showCctv,
    showHotspots,
    showSectorBoundary,
    patrolWaypoints,
    isWithinGeofence,
  ]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(currentLocation, 16, { duration: 1 });
    }
  };

  return (
    <div className={cn("relative size-full rounded-2xl overflow-hidden bg-background select-none", className)}>
      {/* Interactive Leaflet Map Container */}
      <div ref={nodeRef} className="size-full" />

      {/* Top Floating Telemetry & Geofence Header */}
      <div className="absolute top-2.5 left-2.5 right-12 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Geofence Status Badge */}
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[10px] font-mono-tab font-bold backdrop-blur-md border shadow-lg transition-all",
            isWithinGeofence
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/85 text-rose-300 border-rose-500/40 animate-pulse"
          )}
        >
          {isWithinGeofence ? (
            <ShieldCheck className="size-3.5 text-emerald-400" />
          ) : (
            <ShieldAlert className="size-3.5 text-rose-400" />
          )}
          <span>
            {isWithinGeofence
              ? "GEOFENCE: IN BOUNDS · SECTOR A CORRIDOR"
              : "ALERT: OUT OF PATROL BOUNDS"}
          </span>
        </div>

        {/* Action Controls Group */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-black/80 backdrop-blur-md p-1 border border-white/10 shadow-lg">
          {/* Recenter Button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Recenter Map on Officer GPS"
          >
            <Crosshair className="size-3.5" />
          </button>

          {/* Toggle CCTV Nodes */}
          <button
            type="button"
            onClick={() => setShowCctv((v) => !v)}
            className={cn(
              "rounded-lg p-1 text-[10px] flex items-center gap-1 transition-all cursor-pointer",
              showCctv
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                : "text-white/40 hover:text-white"
            )}
            title="Toggle CCTV Beacons"
          >
            <Camera className="size-3.5" />
          </button>

          {/* Toggle Incident Hotspots */}
          <button
            type="button"
            onClick={() => setShowHotspots((v) => !v)}
            className={cn(
              "rounded-lg p-1 text-[10px] flex items-center gap-1 transition-all cursor-pointer",
              showHotspots
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-white/40 hover:text-white"
            )}
            title="Toggle Incident Hotspots"
          >
            <AlertTriangle className="size-3.5" />
          </button>

          {/* Patrol Sweep Simulation Button */}
          <button
            type="button"
            onClick={() => setIsSimulatingSweep((v) => !v)}
            className={cn(
              "rounded-lg px-2 py-0.5 text-[10px] font-mono-tab flex items-center gap-1 transition-all cursor-pointer font-bold",
              isSimulatingSweep
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            title={isSimulatingSweep ? "Stop Patrol Sweep" : "Simulate Enforcer Patrol Sweep"}
          >
            {isSimulatingSweep ? (
              <>
                <Square className="size-3 fill-current" />
                <span>Stop Sweep</span>
              </>
            ) : (
              <>
                <Play className="size-3 fill-current" />
                <span>Patrol Sweep</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Live Telemetry Footer */}
      <div className="absolute bottom-2 left-2 right-2 z-[400] flex items-center justify-between pointer-events-none">
        <div className="rounded-lg bg-black/85 backdrop-blur px-2.5 py-1 font-mono-tab text-[9px] text-white/80 border border-white/10 flex items-center gap-2 pointer-events-auto">
          <span className="flex items-center gap-1 text-primary">
            <Radio className="size-3 animate-pulse" />
            LIVE RTK GPS
          </span>
          <span className="text-white/40">|</span>
          <span>{currentLocation[0].toFixed(5)}°N, {currentLocation[1].toFixed(5)}°E</span>
          <span className="text-white/40">|</span>
          <span className="text-emerald-400">±3.5m Acc</span>
        </div>

        {isSimulatingSweep && (
          <div className="rounded-lg bg-cyan-950/85 backdrop-blur px-2 py-1 font-mono-tab text-[9px] text-cyan-300 border border-cyan-500/40 pointer-events-auto flex items-center gap-1 animate-pulse">
            <span>SWEEP WP #{currentWaypointIndex + 1}/{PATROL_SWEEP_WAYPOINTS.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
