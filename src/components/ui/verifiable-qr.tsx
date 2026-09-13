import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function VerifiableQrCode({
  data,
  size = 140,
  className,
}: {
  data: string;
  size?: number;
  className?: string;
}) {
  const cells: boolean[][] = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: 21 }, () => Array(21).fill(false));

    let hash = 0;
    const str = String(data || "QC-VERIFY");
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    const setFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            grid[row + r][col + c] = true;
          }
        }
      }
    };
    setFinder(0, 0);
    setFinder(0, 14);
    setFinder(14, 0);

    for (let i = 8; i < 13; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    let seed = Math.abs(hash) + 12345;
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        const inFinderTL = r < 8 && c < 8;
        const inFinderTR = r < 8 && c >= 13;
        const inFinderBL = r >= 13 && c < 8;
        const inTiming = (r === 6 && c >= 8 && c <= 12) || (c === 6 && r >= 8 && r <= 12);
        if (inFinderTL || inFinderTR || inFinderBL || inTiming) continue;

        seed = (seed * 9301 + 49297) % 233280;
        grid[r][c] = seed / 233280 > 0.48;
      }
    }
    return grid;
  }, [data]);

  return (
    <svg
      viewBox="0 0 21 21"
      width={size}
      height={size}
      className={cn("shape-rendering-crispEdges shrink-0", className)}
      style={{ shapeRendering: "crispEdges" }}
    >
      <rect width="21" height="21" fill="white" />
      {cells.map((row, r) =>
        row.map((cell, c) => (cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null))
      )}
    </svg>
  );
}
