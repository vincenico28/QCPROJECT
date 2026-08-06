// Browser-safe helpers for the GIS map. No leaflet imports here.
import type { Violation, Camera } from "./traffic";

// Barangay Culiat, Quezon City centroid
export const QC_CENTER: [number, number] = [14.676, 121.0437];

export type GeoViolation = Violation & { lat: number; lng: number };

// Deterministic pseudo-jitter so a violation without coords always
// resolves to the same point on the map.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

export function geocodeViolations(violations: Violation[], cameras: Camera[]): GeoViolation[] {
  const byCode = new Map(cameras.map((c) => [c.code, c] as const));
  return violations
    .map((v) => {
      const cam = v.camera_code ? byCode.get(v.camera_code) : undefined;
      let lat = cam?.lat != null ? Number(cam.lat) : QC_CENTER[0];
      let lng = cam?.lng != null ? Number(cam.lng) : QC_CENTER[1];
      // small deterministic jitter so overlapping detections spread out
      const jLat = (hash(v.id + ":lat") - 0.5) * 0.006;
      const jLng = (hash(v.id + ":lng") - 0.5) * 0.006;
      lat += jLat;
      lng += jLng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { ...v, lat, lng };
    })
    .filter((v): v is GeoViolation => v !== null);
}

export function roadSegments(cameras: Camera[]): string[] {
  const set = new Set<string>();
  for (const c of cameras) if (c.location) set.add(c.location);
  return Array.from(set).sort();
}

export function violationColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("red")) return "#ef4444";
  if (t.includes("speed")) return "#f59e0b";
  if (t.includes("park")) return "#3b82f6";
  if (t.includes("swerv") || t.includes("lane")) return "#8b5cf6";
  return "#10b981";
}

export function toCsv(rows: GeoViolation[]): string {
  const headers = [
    "id",
    "plate_number",
    "violation_type",
    "location",
    "camera_code",
    "confidence",
    "status",
    "lat",
    "lng",
    "detected_at",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) => headers.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(","))
    .join("\n");
  return `${headers.join(",")}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
