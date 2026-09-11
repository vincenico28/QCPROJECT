import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Citation, type Violation } from "./traffic";
import {
  serverSaveViolation,
  serverUpdateViolationStatus,
  serverSaveCitation,
} from "@/lib/server.functions";

/** Standard QC LGU fine schedule (PHP) by offense type. */
export const FINE_SCHEDULE: Record<string, number> = {
  "Red Light": 2000,
  "Red Light Jump": 3500,
  "Overspeeding": 3000,
  "No Entry Zone": 5000,
  "Counterflow": 2500,
  "Obstruction": 2000,
  "Illegal Parking": 1000,
  "No Helmet": 1500,
  "Number Coding": 500,
  "Yellow Box Infraction": 1500,
  "Bus Lane Violation": 5000,
  "Colorum Vehicle": 5000,
  "Unregistered Vehicle": 3000,
  "Unregister Vehicle": 3000,
  "Reckless Driving": 2000,
  "Disregarding Traffic Sign": 1500,
  "Driving Without License": 3000,
  "Expired Registration": 2000,
  "Illegal Turn": 1000,
  "Smoke Belching": 2500,
  "Jaywalking": 500,
};

export function fineFor(offense: string): number {
  const clean = (offense || "").trim();
  if (FINE_SCHEDULE[clean] !== undefined) {
    return FINE_SCHEDULE[clean];
  }
  const lower = clean.toLowerCase();
  for (const [k, v] of Object.entries(FINE_SCHEDULE)) {
    if (k.toLowerCase() === lower) return v;
  }
  return 1000;
}

export type ParsedOffenseItem = {
  name: string;
  amount: number;
  isCustom?: boolean;
};

/**
 * Splits an offense string by commas/delimiters without splitting on commas
 * that are enclosed inside parentheses or brackets, e.g. "Colorum Vehicle (₱5,000), Unregister Vehicle (₱3,000)".
 */
export function splitOffenses(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const str = raw.trim();
  if (!str) return [];

  const parts: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "(" || char === "[") {
      parenDepth++;
      current += char;
    } else if (char === ")" || char === "]") {
      parenDepth = Math.max(0, parenDepth - 1);
      current += char;
    } else if ((char === "," || char === "•" || char === "/") && parenDepth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.length > 0 ? parts : [str];
}

/**
 * Formats a list of violation items for persistent storage in citations.offense.
 * Encodes individual penalty fines so each violation's assessed penalty is permanently
 * preserved, verifiable on slips, and never reverts to a flat fallback.
 * e.g. "Colorum Vehicle (₱5,000), Unregister Vehicle (₱3,000)"
 */
export function formatOffenseItems(
  items: Array<{ name: string; amount: number; isCustom?: boolean }>
): string {
  const valid = items.filter((i) => i.name && i.name.trim().length > 0);
  if (valid.length === 0) return "Traffic Infraction";

  // If only 1 item and standard fine matches schedule, plain name is sufficient
  if (valid.length === 1 && !valid[0].isCustom && FINE_SCHEDULE[valid[0].name.trim()] === valid[0].amount) {
    return valid[0].name.trim();
  }

  // Serialize each violation item with its exact assigned penalty fine
  return valid
    .map((item) => {
      const clean = item.name.trim();
      return `${clean} (₱${Number(item.amount || 0).toLocaleString()})`;
    })
    .join(", ");
}

/**
 * Parses a citation's offense string into individual violation items with their exact penalty fines.
 * Intelligently handles:
 * 1. Explicit amount markers like "Colorum Vehicle (₱5,000)" or "Illegal Parking [₱1,000]"
 * 2. Known standard offenses from FINE_SCHEDULE
 * 3. Proportional or residual assignment when totalAmount is known (e.g. 2 custom offenses with total ₱8,000 -> ₱4,000 each)
 * 4. Ensures the sum of parsed amounts matches totalAmount when provided
 */
export function parseCitationOffenses(
  rawOffense: string | null | undefined,
  totalAmount?: number
): ParsedOffenseItem[] {
  if (!rawOffense || !rawOffense.trim()) {
    return [{ name: "Traffic Infraction", amount: totalAmount || 1000 }];
  }

  const rawParts = splitOffenses(rawOffense);
  if (rawParts.length === 0) {
    return [{ name: rawOffense.trim(), amount: totalAmount || 1000 }];
  }

  // Regex to extract trailing amount e.g. "Colorum Vehicle (₱5,000)" or "[₱3,000]" or "(5000)"
  const amountPattern = /^(.+?)(?:\s*[\(\[](?:₱|PHP|Php)?\s*([\d,]+)[\)\]])\s*$/i;

  const parsed: Array<{
    name: string;
    explicitAmount: number | null;
    isCustom: boolean;
  }> = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    const match = trimmed.match(amountPattern);
    if (match) {
      const name = match[1].trim();
      const num = Number(match[2].replace(/,/g, ""));
      parsed.push({
        name: name || trimmed,
        explicitAmount: !isNaN(num) && num > 0 ? num : null,
        isCustom: !FINE_SCHEDULE[name],
      });
    } else {
      parsed.push({
        name: trimmed,
        explicitAmount: null,
        isCustom: !FINE_SCHEDULE[trimmed],
      });
    }
  }

  // If only 1 offense and totalAmount is provided, that 1 offense has totalAmount
  if (parsed.length === 1) {
    return [
      {
        name: parsed[0].name,
        amount: parsed[0].explicitAmount || totalAmount || fineFor(parsed[0].name),
        isCustom: parsed[0].isCustom,
      },
    ];
  }

  // Determine amounts for each item
  const resolved: ParsedOffenseItem[] = [];
  let remainingTotal = typeof totalAmount === "number" && totalAmount > 0 ? totalAmount : null;
  const unassignedIndices: number[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item.explicitAmount !== null) {
      resolved[i] = { name: item.name, amount: item.explicitAmount, isCustom: item.isCustom };
      if (remainingTotal !== null) {
        remainingTotal -= item.explicitAmount;
      }
    } else {
      // Case-insensitive lookup in FINE_SCHEDULE
      const lower = item.name.toLowerCase();
      let schedAmount: number | undefined;
      for (const [k, v] of Object.entries(FINE_SCHEDULE)) {
        if (k.toLowerCase() === lower) {
          schedAmount = v;
          break;
        }
      }

      if (schedAmount !== undefined) {
        resolved[i] = { name: item.name, amount: schedAmount, isCustom: item.isCustom };
        if (remainingTotal !== null) {
          remainingTotal -= schedAmount;
        }
      } else {
        unassignedIndices.push(i);
      }
    }
  }

  // If there are unassigned (custom) items
  if (unassignedIndices.length > 0) {
    if (remainingTotal !== null && remainingTotal > 0) {
      // Distribute remaining total evenly among unassigned items
      const share = Math.round(remainingTotal / unassignedIndices.length);
      let allocated = 0;
      unassignedIndices.forEach((idx, uIdx) => {
        const amt = uIdx === unassignedIndices.length - 1 ? remainingTotal! - allocated : share;
        allocated += amt;
        resolved[idx] = {
          name: parsed[idx].name,
          amount: Math.max(100, amt),
          isCustom: true,
        };
      });
    } else {
      // Fallback to default fineFor or equal split if totalAmount is known
      const fallbackPerItem =
        totalAmount !== undefined && totalAmount > 0
          ? Math.max(100, Math.round(totalAmount / parsed.length))
          : undefined;

      unassignedIndices.forEach((idx) => {
        resolved[idx] = {
          name: parsed[idx].name,
          amount: fallbackPerItem ?? fineFor(parsed[idx].name),
          isCustom: true,
        };
      });
    }
  }

  // If totalAmount is given and no items had explicit amounts, ensure the sum equals totalAmount
  const hasAnyExplicit = parsed.some((p) => p.explicitAmount !== null);
  if (totalAmount !== undefined && totalAmount > 0 && !hasAnyExplicit && resolved.length > 0) {
    const currentSum = resolved.reduce((s, r) => s + (r.amount || 0), 0);
    if (currentSum !== totalAmount && currentSum > 0) {
      const ratio = totalAmount / currentSum;
      let running = 0;
      for (let i = 0; i < resolved.length; i++) {
        if (i === resolved.length - 1) {
          resolved[i].amount = Math.max(0, totalAmount - running);
        } else {
          const scaled = Math.round((resolved[i].amount || 0) * ratio);
          resolved[i].amount = scaled;
          running += scaled;
        }
      }
    }
  }

  return resolved;
}

export function nextCitationNumber() {
  const seq = Math.floor(10000 + Math.random() * 89999);
  return `NOV-2026-QC-${seq}`;
}

export function useReviewViolation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "confirmed" | "dismissed" | "pending";
    }) => {
      await serverUpdateViolationStatus({ data: { id, status } });

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: "Violation Review Officer",
          actor_role: "admin",
          action: `VIOLATION_REVIEW_${status.toUpperCase()}`,
          target_resource: `Violation ID: ${id}`,
          details: `Status updated to ${status}`,
        });
      } catch (err) {
        console.warn(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useBulkReviewViolations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: "confirmed" | "dismissed";
    }) => {
      for (const id of ids) {
        await serverUpdateViolationStatus({ data: { id, status } });
      }

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: "Violation Review Officer",
          actor_role: "admin",
          action: `VIOLATION_BULK_${status.toUpperCase()}`,
          target_resource: `${ids.length} Violations`,
          details: `Bulk marked ${ids.length} items as ${status}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return { count: ids.length, status };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}

export type IssueCitationInput = {
  violation: Violation;
  offense: string;
  amount: number;
  officerName: string | null;
  vehicleModel: string | null;
};

export function useIssueCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: IssueCitationInput) => {
      const row = await serverSaveCitation({
        data: {
          violation_id: input.violation.id,
          plate_number: input.violation.plate_number,
          vehicle_model: input.vehicleModel,
          offense: input.offense,
          amount: input.amount,
          officer_name: input.officerName,
          status: "unpaid",
        },
      });

      await serverUpdateViolationStatus({
        data: { id: input.violation.id, status: "confirmed" },
      });

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: input.officerName || "Adjudication Officer",
          actor_role: "admin",
          action: "CITATION_ISSUED_FROM_VIOLATION",
          target_resource: `Plate: ${input.violation.plate_number}`,
          details: `Offense: ${input.offense}, Amount: PHP ${input.amount}, Violation ID: ${input.violation.id}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return row as Citation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useAddManualViolation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      plate_number: string;
      violation_type: string;
      location: string;
      camera_code?: string;
      evidence_url?: string;
      confidence?: number;
      status?: string;
    }) => {
      // Save to real database
      const row = await serverSaveViolation({
        data: {
          plate_number: input.plate_number.toUpperCase().trim(),
          violation_type: input.violation_type,
          location: input.location,
          confidence: input.confidence ?? 99,
          ai_detected: false,
          camera_code: input.camera_code || "FIELD-OFFICER",
          evidence_url: input.evidence_url || "/assets/violation-1.jpg",
          status: input.status || "pending",
        },
      });

      return row as Violation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}
