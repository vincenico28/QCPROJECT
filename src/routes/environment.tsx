import { createFileRoute } from "@tanstack/react-router";
import { useEnvSensors } from "@/lib/data/environment";
import { Loader2, Wind, MapPin, Thermometer, Droplets, CloudFog, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/environment")({
  head: () => ({
    meta: [{ title: "Environmental Monitoring — QC Command Center" }],
  }),
  component: EnvironmentPage,
});

function EnvironmentPage() {
  const { data: sensors, isLoading } = useEnvSensors();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wind className="size-6 text-teal-400" />
            Environmental Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">Live Air Quality Index (AQI) and climate data from intersection IoT sensors.</p>
        </div>
      </div>

      {isLoading || !sensors ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {sensors.map(sensor => (
              <div key={sensor.id} className={cn(
                 "panel flex flex-col gap-4 rounded-xl border p-5 shadow-lg relative overflow-hidden transition-all",
                 sensor.status === "Unhealthy" ? "border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-transparent" :
                 sensor.status === "Good" ? "border-teal-500/30" : "border-border"
              )}>
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "grid size-12 place-items-center rounded-lg shadow-inner",
                         sensor.status === "Good" ? "bg-teal-500/20 text-teal-400" :
                         sensor.status === "Moderate" ? "bg-yellow-500/20 text-yellow-400" :
                         "bg-orange-500/20 text-orange-500"
                       )}>
                          <Wind className="size-6" />
                       </div>
                       <div>
                          <h3 className="font-bold text-white leading-tight">{sensor.location}</h3>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                             <MapPin className="size-3" />
                             ID: {sensor.id}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overall AQI</p>
                       <p className={cn(
                         "text-4xl font-black mt-1 font-mono-tab",
                         sensor.status === "Good" ? "text-teal-400" :
                         sensor.status === "Moderate" ? "text-yellow-400" : "text-orange-500"
                       )}>
                          {sensor.aqi}
                       </p>
                       <span className={cn(
                          "inline-flex rounded mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                          sensor.status === "Good" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                          sensor.status === "Moderate" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-orange-500/10 text-orange-500 border-orange-500/20"
                       )}>
                         {sensor.status}
                       </span>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-between rounded bg-background/50 px-2 py-1.5 border border-border/50">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                             <CloudFog className="size-3" /> PM2.5
                          </div>
                          <span className="font-mono-tab text-xs font-bold text-white">{sensor.pm25}</span>
                       </div>
                       <div className="flex items-center justify-between rounded bg-background/50 px-2 py-1.5 border border-border/50">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                             <Wind className="size-3" /> CO2
                          </div>
                          <span className="font-mono-tab text-xs font-bold text-white">{sensor.co2ppm} ppm</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/50 pt-4">
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-background/50 p-2 border border-border/50">
                       <Thermometer className="size-4 text-red-400" />
                       <span className="text-sm font-bold text-white">{sensor.temperatureC}°C</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-background/50 p-2 border border-border/50">
                       <Droplets className="size-4 text-blue-400" />
                       <span className="text-sm font-bold text-white">{sensor.humidity}%</span>
                    </div>
                 </div>
                 
                 {sensor.status === "Unhealthy" && (
                    <div className="mt-2 flex items-start gap-2 rounded bg-orange-500/10 p-3 border border-orange-500/20">
                       <AlertTriangle className="size-4 text-orange-500 shrink-0 mt-0.5" />
                       <p className="text-xs text-orange-200">Poor air quality detected. Consider issuing a localized public advisory.</p>
                    </div>
                 )}
              </div>
           ))}
        </div>
      )}
    </div>
  );
}
