import { createFileRoute } from "@tanstack/react-router";
import { useOfficers } from "@/lib/data/traffic";
import { useOfficerShifts } from "@/lib/data/officer-shifts";
import { Loader2, MapPin, Battery, Clock, Radio, Activity } from "lucide-react";
import { QC_CENTER } from "@/lib/data/gis";

// Lazy load leaflet for map rendering
import React, { Suspense, lazy } from "react";
const MapContainer = lazy(() => import("react-leaflet").then(m => ({ default: m.MapContainer })));
const TileLayer = lazy(() => import("react-leaflet").then(m => ({ default: m.TileLayer })));
const Marker = lazy(() => import("react-leaflet").then(m => ({ default: m.Marker })));
const Popup = lazy(() => import("react-leaflet").then(m => ({ default: m.Popup })));

export const Route = createFileRoute("/officers/shifts")({
  head: () => ({
    meta: [{ title: "Officer Shifts & Tracking — Culiat Traffic Ops" }],
  }),
  component: OfficerShiftsPage,
});

function OfficerShiftsPage() {
  const { data: officers, isLoading: loadingOfficers } = useOfficers();
  const { data: shifts, isLoading: loadingShifts } = useOfficerShifts();

  const isLoading = loadingOfficers || loadingShifts;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Officer Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Monitor active shifts, radio status, and live GPS coordinates.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Shifts Sidebar */}
        <div className="panel flex flex-col gap-4 rounded-xl border border-border p-6 h-[600px] overflow-y-auto">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Radio className="size-5 text-primary" />
            Active Shifts
          </h2>
          {isLoading ? (
             <div className="grid h-40 place-items-center">
               <Loader2 className="size-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              {shifts?.map(shift => {
                const officer = officers?.find(o => o.badge_number === shift.badgeNumber);
                if (!officer) return null;
                
                return (
                  <div key={shift.id} className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-background/80">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{officer.full_name}</p>
                        <p className="text-xs text-muted-foreground">Badge #{officer.badge_number} • {officer.unit}</p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <Activity className="size-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Online</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(shift.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Battery className="size-3" />
                        {shift.batteryLevel}%
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                      <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                      <span className="text-xs text-white leading-relaxed">{shift.currentTask}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live GPS Map */}
        <div className="panel lg:col-span-2 overflow-hidden rounded-xl border border-border relative z-0 h-[600px]">
          <Suspense fallback={<div className="grid h-full place-items-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <MapContainer
              center={QC_CENTER}
              zoom={14}
              zoomControl={false}
              className="h-full w-full z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              
              {shifts?.map(shift => {
                 const officer = officers?.find(o => o.badge_number === shift.badgeNumber);
                 if (!officer) return null;
                 return (
                   <Marker key={shift.id} position={shift.location}>
                     <Popup className="custom-popup">
                       <div className="p-1">
                         <p className="font-bold text-foreground">{officer.full_name}</p>
                         <p className="text-xs text-muted-foreground mt-1">{shift.currentTask}</p>
                       </div>
                     </Popup>
                   </Marker>
                 )
              })}
            </MapContainer>
          </Suspense>
          
          <div className="absolute top-4 left-4 z-[400] rounded-full border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md">
            <span className="flex items-center gap-2 font-mono-tab text-xs font-medium text-white tracking-widest uppercase">
               <span className="relative flex size-2">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                 <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
               </span>
               Live GPS Feed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
