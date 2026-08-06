import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Focus, ScanEye } from "lucide-react";
import { cn } from "@/lib/utils";

type BoundingBox = {
  id: string;
  x: string;
  y: string;
  width: string;
  height: string;
  plate: string;
  isViolation: boolean;
  violationType?: string;
  confidence: number;
  duration: number;
};

const PLATES = ["ABC 1234", "XYZ 9876", "NMB 4452", "GHY 9921", "LKM 3341", "NDG 4412", "WHI 9981"];
const VIOLATIONS = ["No Helmet", "Illegal Lane Change", "Speeding", "Counterflow", "Obstruction"];

export function AiCameraFeed({ code, bitrate }: { code: string; bitrate: string }) {
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [fps, setFps] = useState(60);

  // Simulate FPS changes
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(57 + Math.random() * 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate AI Object Spawning
  useEffect(() => {
    const spawnBox = () => {
      const isViolation = Math.random() > 0.7;
      
      // Random position along the "road" area
      const xPercent = Math.random() * 50 + 10;
      const yPercent = Math.random() * 40 + 20;

      const newBox: BoundingBox = {
        id: Math.random().toString(36).substring(2, 9),
        x: `${xPercent}%`,
        y: `${yPercent}%`,
        width: `${Math.random() * 15 + 10}%`,
        height: `${Math.random() * 20 + 15}%`,
        plate: PLATES[Math.floor(Math.random() * PLATES.length)],
        isViolation,
        violationType: isViolation ? VIOLATIONS[Math.floor(Math.random() * VIOLATIONS.length)] : undefined,
        confidence: 85 + Math.random() * 14,
        duration: 2 + Math.random() * 3, // Stays on screen for 2-5 seconds
      };

      setBoxes((prev) => [...prev, newBox]);

      // Remove after duration
      setTimeout(() => {
        setBoxes((prev) => prev.filter((b) => b.id !== newBox.id));
      }, newBox.duration * 1000);
    };

    const spawner = setInterval(() => {
      if (Math.random() > 0.3) spawnBox();
    }, 1500);

    return () => clearInterval(spawner);
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black font-mono">
      {/* Background CCTV Image */}
      <img
        src="/cctv-1.jpg"
        alt="CCTV Feed"
        className="absolute inset-0 size-full object-cover opacity-60 mix-blend-luminosity grayscale"
      />
      
      {/* Grid overlay for HUD look */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] mix-blend-overlay" />

      {/* AI Model Specs HUD (Top Left) */}
      <div className="absolute left-4 top-4 flex flex-col gap-1 text-[10px] text-primary shadow-black drop-shadow-md">
        <span className="flex items-center gap-2 font-bold tracking-widest text-white">
          <ScanEye className="size-3 text-primary" />
          YOLOv11 VISION
        </span>
        <span>MODEL: qc-traffic-v2.1.pt</span>
        <span>RES: 1920x1080</span>
        <span>FPS: {fps}</span>
        <span>BITRATE: {bitrate} Mbps</span>
      </div>

      {/* Live Recording HUD (Top Right) */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-1 text-[10px] text-success shadow-black drop-shadow-md">
        <span className="flex items-center gap-1.5 font-bold tracking-widest text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-danger" />
          LIVE REC
        </span>
        <span>{new Date().toISOString().replace('T', ' ').slice(0, 19)}</span>
        <span>CAM: {code}</span>
      </div>

      {/* Bounding Boxes Layer */}
      <AnimatePresence>
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
            }}
            className={cn(
              "border-[1.5px] bg-black/10 backdrop-blur-[0.5px]",
              box.isViolation ? "border-danger shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "border-success shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            )}
          >
            {/* Decorative Corner Crosshairs */}
            <Focus className={cn("absolute -left-2 -top-2 size-4", box.isViolation ? "text-danger" : "text-success")} />
            <Focus className={cn("absolute -right-2 -bottom-2 size-4 rotate-180", box.isViolation ? "text-danger" : "text-success")} />

            {/* AI Label above the box */}
            <div
              className={cn(
                "absolute -top-5 left-0 flex items-center gap-1.5 whitespace-nowrap px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white",
                box.isViolation ? "bg-danger" : "bg-success"
              )}
            >
              <span>{box.plate}</span>
              <span className="opacity-80">[{box.confidence.toFixed(1)}%]</span>
              {box.isViolation && (
                <span className="border-l border-white/30 pl-1.5 text-white">{box.violationType}</span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bottom HUD */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] text-subtle">
        <span>FRAME {Math.floor(Math.random() * 99999).toString().padStart(5, '0')}</span>
        <span className="flex items-center gap-2 font-bold text-white">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
          </span>
          AI INFERENCE ACTIVE
        </span>
      </div>
    </div>
  );
}
