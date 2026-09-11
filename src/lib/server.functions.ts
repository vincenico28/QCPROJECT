import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Helper to generate a standard UUID v4
function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// -------------------------------------------------------------
// 1. VIOLATIONS
// -------------------------------------------------------------
export const serverFetchViolations = createServerFn({ method: "GET" })
  .validator((limit: unknown) => (typeof limit === "number" ? limit : 50))
  .handler(async ({ data: limit }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("violations")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(limit);
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Violations]", err);
    }
    return null;
  });


export const serverFetchCitations = createServerFn({ method: "GET" })
  .validator((limit: unknown) => (typeof limit === "number" ? limit : 50))
  .handler(async ({ data: limit }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("citations")
        .select("*, violations(evidence_url, location, camera_code)")
        .order("issued_at", { ascending: false })
        .limit(limit);
      if (!error && data) {
        // Group by violation_id to deduplicate any duplicate records
        const seenViolations = new Set<string>();
        const uniqueList: any[] = [];
        const duplicateIdsToDelete: string[] = [];

        // Sort so paid citations or earlier issued ones are preserved
        const sorted = [...data].sort((a, b) => {
          if (a.status === "paid" && b.status !== "paid") return -1;
          if (b.status === "paid" && a.status !== "paid") return 1;
          return new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime();
        });

        for (const c of sorted) {
          if (c.violation_id) {
            if (seenViolations.has(c.violation_id)) {
              duplicateIdsToDelete.push(c.id);
              continue;
            }
            seenViolations.add(c.violation_id);
          }
          uniqueList.push(c);
        }

        // Background purge of duplicate IDs from database if any exist
        if (duplicateIdsToDelete.length > 0) {
          Promise.resolve(
            supabaseAdmin
              .from("citations")
              .delete()
              .in("id", duplicateIdsToDelete)
          )
            .then(() => console.log(`[Deduplication] Purged ${duplicateIdsToDelete.length} duplicate citation rows.`))
            .catch((e: any) => console.warn("[Deduplication] Could not purge duplicate rows:", e));
        }

        // Re-sort by issued_at DESC for display
        uniqueList.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());

        return uniqueList.map((c: any) => ({
          ...c,
          evidence_url: c.evidence_url || c.violations?.evidence_url || "/assets/violation-1.jpg",
          location: c.violations?.location || c.location || "Quezon City Road Corridor",
        }));
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Citations]", err);
    }
    return null;
  });

const violationInsertSchema = z.object({
  plate_number: z.string().trim().optional(),
  plateNumber: z.string().trim().optional(),
  violation_type: z.string().trim().optional(),
  violationType: z.string().trim().optional(),
  location: z.string().trim().min(2),
  confidence: z.number().min(0).max(100).default(95).optional(),
  evidence_url: z.string().nullable().optional(),
  evidenceUrl: z.string().nullable().optional(),
  ai_detected: z.boolean().optional(),
  aiDetected: z.boolean().optional(),
  camera_code: z.string().nullable().optional(),
  cameraCode: z.string().nullable().optional(),
  status: z.string().default("pending").optional(),
});

export const serverSaveViolation = createServerFn({ method: "POST" })
  .validator((data: unknown) => violationInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const now = new Date().toISOString();

    const plate = (data.plate_number || data.plateNumber || "").toUpperCase().trim();
    if (!plate) {
      throw new Error("Missing license plate number");
    }
    const violationType = data.violation_type || data.violationType || "Traffic Infraction";
    const cameraCode = data.camera_code || data.cameraCode || "QC-CAM-1001";
    const rawEvidence = data.evidence_url || data.evidenceUrl || "/assets/violation-1.jpg";
    const { ensureEvidenceUploadedToSupabase } = await import("@/lib/storage");
    const evidenceUrl = await ensureEvidenceUploadedToSupabase(rawEvidence, {
      plateNumber: plate,
      category: violationType,
      folder: "violations",
    });
    const aiDetected = data.ai_detected ?? data.aiDetected ?? false;
    const rawConf = data.confidence ?? 95;
    const confidence = rawConf > 1 ? rawConf : rawConf * 100;
    const status = data.status || "pending";

    const { data: row, error } = await supabaseAdmin
      .from("violations")
      .insert({
        id,
        plate_number: plate,
        violation_type: violationType,
        location: data.location,
        confidence,
        status,
        evidence_url: evidenceUrl,
        ai_detected: aiDetected,
        camera_code: cameraCode,
        detected_at: now,
        created_at: now,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Violation]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || {
      id,
      plate_number: plate,
      violation_type: violationType,
      location: data.location,
      confidence,
      status,
      evidence_url: evidenceUrl,
      ai_detected: aiDetected,
      camera_code: cameraCode,
      detected_at: now,
    };
  });

const violationUpdateStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const serverUpdateViolationStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => violationUpdateStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("violations")
      .update({ status: data.status })
      .eq("id", data.id);

    if (error) {
      console.error("[Supabase Error: Update Violation Status]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return { success: true };
  });

// -------------------------------------------------------------
// 2. CITATIONS
// -------------------------------------------------------------
const citationInsertSchema = z.object({
  violation_id: z.string().nullable().optional(),
  violationId: z.string().nullable().optional(),
  plate_number: z.string().trim().optional(),
  plateNumber: z.string().trim().optional(),
  vehicle_model: z.string().nullable().optional(),
  vehicleModel: z.string().nullable().optional(),
  offense: z.string().trim().min(2),
  amount: z.number().positive(),
  status: z.string().default("unpaid").optional(),
  officer_name: z.string().nullable().optional(),
  officerName: z.string().nullable().optional(),
  evidence_url: z.string().nullable().optional(),
  evidenceUrl: z.string().nullable().optional(),
});

export const serverSaveCitation = createServerFn({ method: "POST" })
  .validator((data: unknown) => citationInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const citation_number = `NOV-2026-QC-${Math.floor(10000 + Math.random() * 90000)}`;
    const issued_at = new Date().toISOString();

    const plate = (data.plate_number || data.plateNumber || "").toUpperCase().trim();
    if (!plate) {
      throw new Error("Missing license plate number");
    }
    const violationId = data.violation_id || data.violationId || null;
    const vehicleModel = data.vehicle_model || data.vehicleModel || null;
    const officerName = data.officer_name || data.officerName || "QC Enforcer";
    const status = data.status || "unpaid";
    const rawEvidence = data.evidence_url || data.evidenceUrl || null;
    const { ensureEvidenceUploadedToSupabase } = await import("@/lib/storage");
    const evidenceUrl = rawEvidence
      ? await ensureEvidenceUploadedToSupabase(rawEvidence, {
          plateNumber: plate,
          category: data.offense,
          folder: "citations",
        })
      : null;

    // 1. DEDUPLICATION: If a citation already exists for this violation, return it idempotently
    if (violationId) {
      const { data: existingCitation } = await supabaseAdmin
        .from("citations")
        .select("*")
        .eq("violation_id", violationId)
        .order("issued_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingCitation) {
        console.warn(
          `[serverSaveCitation] Citation already exists for violation ${violationId}: ${existingCitation.citation_number}. Preventing duplicate creation.`
        );
        // Ensure the violation status is marked confirmed and evidence synced
        const updatePayload: { status: string; evidence_url?: string } = { status: "confirmed" };
        if (evidenceUrl) updatePayload.evidence_url = evidenceUrl;
        await supabaseAdmin
          .from("violations")
          .update(updatePayload as any)
          .eq("id", violationId);

        return existingCitation;
      }
    }

    // 2. DOUBLE-CLICK PROTECTION: Prevent rapid duplicate issuance for same plate and offense within 10s
    if (!violationId && plate) {
      const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
      const { data: recentDup } = await supabaseAdmin
        .from("citations")
        .select("*")
        .eq("plate_number", plate)
        .eq("offense", data.offense)
        .gte("issued_at", tenSecondsAgo)
        .maybeSingle();

      if (recentDup) {
        console.warn(
          `[serverSaveCitation] Duplicate citation attempt detected for plate ${plate} within 10s. Returning existing citation ${recentDup.citation_number}.`
        );
        return recentDup;
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from("citations")
      .insert({
        id,
        citation_number,
        violation_id: violationId,
        plate_number: plate,
        vehicle_model: vehicleModel,
        offense: data.offense,
        amount: data.amount,
        status,
        officer_name: officerName,
        evidence_url: evidenceUrl,
        issued_at,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Citation]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    // Automatically transition violation status to 'confirmed' upon citation creation
    if (violationId) {
      try {
        const updatePayload: { status: string; evidence_url?: string } = { status: "confirmed" };
        if (evidenceUrl) updatePayload.evidence_url = evidenceUrl;
        await supabaseAdmin
          .from("violations")
          .update(updatePayload as any)
          .eq("id", violationId);
      } catch (vioErr) {
        console.warn("[serverSaveCitation] Could not update violation status to confirmed:", vioErr);
      }
    } else if (evidenceUrl) {
      try {
        const newVioId = generateUUID();
        await supabaseAdmin.from("violations").insert({
          id: newVioId,
          plate_number: plate,
          violation_type: data.offense,
          location: "Quezon City Road Corridor",
          confidence: 100,
          status: "confirmed",
          evidence_url: evidenceUrl,
          ai_detected: false,
          camera_code: "FIELD-OVR",
          detected_at: issued_at,
          created_at: issued_at,
        });
        await supabaseAdmin.from("citations").update({ violation_id: newVioId }).eq("id", id);
      } catch (vioErr) {
        console.warn("[serverSaveCitation] Could not create linked violation record for direct citation:", vioErr);
      }
    }

    // Automatically synchronize LTO alarm tags and risk status across vehicles & citizen_vehicles
    if (status === "unpaid" || status === "overdue") {
      try {
        const compactPlate = plate.replace(/[\s-]/g, "");
        // 1. Tag vehicles registry
        const { data: allVehs } = await supabaseAdmin.from("vehicles").select("plate_number");
        const matchingVeh = (allVehs || []).find(
          (v: any) => v.plate_number.replace(/[\s-]/g, "").toUpperCase() === compactPlate
        );
        if (matchingVeh) {
          await supabaseAdmin
            .from("vehicles")
            .update({
              lto_alarm_tagged: true,
              risk_level: "Flagged",
            })
            .eq("plate_number", matchingVeh.plate_number);
        }

        // 2. Tag citizen_vehicles
        const { data: allCv } = await supabaseAdmin.from("citizen_vehicles").select("id, plate_number");
        const matchingCv = (allCv || []).filter(
          (cv: any) => cv.plate_number.replace(/[\s-]/g, "").toUpperCase() === compactPlate
        );
        for (const cv of matchingCv) {
          await supabaseAdmin
            .from("citizen_vehicles")
            .update({ lto_alarm_status: "LTO_ALARM_ACTIVE" })
            .eq("id", cv.id);
        }
      } catch (syncErr) {
        console.warn("[Citation] Could not sync LTO alarm tag:", syncErr);
      }
    }

    return row || { id, citation_number, plate_number: plate, offense: data.offense, amount: data.amount, status, officer_name: officerName, issued_at };
  });

const citationUpdateStatusSchema = z.object({
  citationNumber: z.string(),
  status: z.string(),
});

export const serverUpdateCitationStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => citationUpdateStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("citations")
      .update({ status: data.status })
      .eq("citation_number", data.citationNumber);

    if (error) {
      console.error("[Supabase Error: Update Citation Status]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    // If citation is marked paid or settled, verify if vehicle has other unpaid citations.
    // If not, clear the LTO alarm tags!
    if (data.status === "paid" || data.status === "settled" || data.status === "waived") {
      try {
        const { data: citRow } = await supabaseAdmin
          .from("citations")
          .select("plate_number")
          .eq("citation_number", data.citationNumber)
          .maybeSingle();

        if (citRow?.plate_number) {
          const compact = citRow.plate_number.replace(/[\s-]/g, "").toUpperCase();
          const { data: allCitations } = await supabaseAdmin
            .from("citations")
            .select("id, status, plate_number")
            .neq("citation_number", data.citationNumber);

          const remainingUnpaid = (allCitations || []).filter(
            (c: any) =>
              c.plate_number.replace(/[\s-]/g, "").toUpperCase() === compact &&
              (c.status === "unpaid" || c.status === "overdue" || c.status === "pending")
          );

          if (remainingUnpaid.length === 0) {
            // All cleared!
            const { data: allVehs } = await supabaseAdmin.from("vehicles").select("plate_number");
            const matchingVeh = (allVehs || []).find(
              (v: any) => v.plate_number.replace(/[\s-]/g, "").toUpperCase() === compact
            );
            if (matchingVeh) {
              await supabaseAdmin
                .from("vehicles")
                .update({ lto_alarm_tagged: false, risk_level: "Clean" })
                .eq("plate_number", matchingVeh.plate_number);
            }

            const { data: allCv } = await supabaseAdmin.from("citizen_vehicles").select("id, plate_number");
            const matchingCv = (allCv || []).filter(
              (cv: any) => cv.plate_number.replace(/[\s-]/g, "").toUpperCase() === compact
            );
            for (const cv of matchingCv) {
              await supabaseAdmin
                .from("citizen_vehicles")
                .update({ lto_alarm_status: "CLEARED" })
                .eq("id", cv.id);
            }
          }
        }
      } catch (clearErr) {
        console.warn("[Citation] Error checking remaining citations for vehicle clearance:", clearErr);
      }
    }

    return { success: true };
  });

// -------------------------------------------------------------
// 3. OFFICERS
// -------------------------------------------------------------
export const serverFetchOfficers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("officers")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Officers]", err);
    }
    return null;
  });

const officerInsertSchema = z.object({
  badge_number: z.string().trim().min(2),
  full_name: z.string().trim().min(2),
  rank: z.string().default("Officer I"),
  unit: z.string().default("Traffic Management"),
  district: z.string().default("District 6 (Culiat)"),
  contact_number: z.string().nullable().optional(),
});

export const serverSaveOfficer = createServerFn({ method: "POST" })
  .validator((data: unknown) => officerInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const now = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("officers")
      .insert({
        id,
        badge_number: data.badge_number.toUpperCase().trim(),
        full_name: data.full_name,
        rank: data.rank,
        unit: data.unit,
        district: data.district,
        contact_number: data.contact_number || null,
        status: "active",
        on_duty: true,
        citations_issued: 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Officer]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || { id, ...data, status: "active", on_duty: true, citations_issued: 0 };
  });

const toggleDutySchema = z.object({
  id: z.string(),
  on_duty: z.boolean(),
});

export const serverToggleOfficerDuty = createServerFn({ method: "POST" })
  .validator((data: unknown) => toggleDutySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("officers")
      .update({ on_duty: data.on_duty, updated_at: new Date().toISOString() })
      .eq("id", data.id);

    if (error) {
      console.error("[Supabase Error: Toggle Officer Duty]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return { success: true };
  });

// -------------------------------------------------------------
// 4. CAMERAS
// -------------------------------------------------------------
export const serverFetchCameras = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("cameras")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Cameras]", err);
    }
    return null;
  });

const cameraInsertSchema = z.object({
  code: z.string().trim().min(3),
  location: z.string().trim().min(2),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  status: z.string().default("online"),
});

export const serverSaveCamera = createServerFn({ method: "POST" })
  .validator((data: unknown) => cameraInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const now = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("cameras")
      .insert({
        id,
        code: data.code.toUpperCase().trim(),
        location: data.location,
        lat: data.lat || 14.6563,
        lng: data.lng || 121.0697,
        status: data.status,
        created_at: now,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Camera]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || { id, ...data, created_at: now };
  });

const cameraUpdateSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  location: z.string().optional(),
});

export const serverUpdateCamera = createServerFn({ method: "POST" })
  .validator((data: unknown) => cameraUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updates: { status?: string; location?: string } = {};
    if (data.status) updates.status = data.status;
    if (data.location) updates.location = data.location;

    const { error } = await supabaseAdmin
      .from("cameras")
      .update(updates)
      .eq("id", data.id);

    if (error) {
      console.error("[Supabase Error: Update Camera]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return { success: true };
  });

// -------------------------------------------------------------
// 5. DISPATCHES
// -------------------------------------------------------------
export const serverFetchDispatches = createServerFn({ method: "GET" })
  .validator((limit: unknown) => (typeof limit === "number" ? limit : 50))
  .handler(async ({ data: limit }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("dispatches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Dispatches]", err);
    }
    return null;
  });

const dispatchInsertSchema = z.object({
  officer_id: z.string().nullable().optional(),
  officer_name: z.string().nullable().optional(),
  badge_number: z.string().nullable().optional(),
  violation_id: z.string().nullable().optional(),
  location: z.string().trim().min(2),
  priority: z.string().default("medium"),
  instructions: z.string().nullable().optional(),
});

export const serverSaveDispatch = createServerFn({ method: "POST" })
  .validator((data: unknown) => dispatchInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const reference = `REF-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("dispatches")
      .insert({
        id,
        reference,
        officer_id: data.officer_id || null,
        officer_name: data.officer_name || null,
        badge_number: data.badge_number || null,
        violation_id: data.violation_id || null,
        location: data.location,
        priority: data.priority,
        instructions: data.instructions || null,
        status: "queued",
        created_at: now,
        updated_at: now,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Dispatch]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || { id, reference, ...data, status: "queued", created_at: now };
  });

const dispatchUpdateStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const serverUpdateDispatchStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => dispatchUpdateStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const updates: {
      status: string;
      updated_at: string;
      acknowledged_at?: string | null;
      resolved_at?: string | null;
    } = { status: data.status, updated_at: now };

    if (data.status === "en_route" || data.status === "on_scene") {
      updates.acknowledged_at = now;
    }
    if (data.status === "resolved" || data.status === "cancelled") {
      updates.resolved_at = now;
    }

    const { error } = await supabaseAdmin
      .from("dispatches")
      .update(updates)
      .eq("id", data.id);

    if (error) {
      console.error("[Supabase Error: Update Dispatch Status]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return { success: true };
  });

// -------------------------------------------------------------
// 6. ONLINE PAYMENT SETTLEMENT
// -------------------------------------------------------------
const paymentCheckoutSchema = z.object({
  citationNumber: z.string().trim().min(4),
  plateNumber: z.string().trim().min(3),
  amount: z.number().positive(),
  paymentMethod: z.enum(["gcash", "maya", "landbank", "card", "otc"]),
  payerEmail: z.string().email(),
  payerName: z.string().min(2),
});

export type PaymentReceiptResult = {
  receiptNumber: string;
  citationNumber: string;
  plateNumber: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  ltoClearanceStatus: "CLEARED" | "PENDING";
  qrVerificationUrl: string;
};

export const processPaymentCheckout = createServerFn({ method: "POST" })
  .validator((data: unknown) => paymentCheckoutSchema.parse(data))
  .handler(async ({ data }): Promise<PaymentReceiptResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const receiptNumber = `OR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const paidAt = new Date().toISOString();

    const { error: insertErr } = await supabaseAdmin
      .from("payments")
      .insert({
        citation_id: data.citationNumber,
        plate_number: data.plateNumber,
        payer_name: data.payerName,
        amount: data.amount,
        method: data.paymentMethod,
        reference_number: receiptNumber,
        status: "pending_verification",
        submitted_date: paidAt,
      });

    if (insertErr) {
      console.error("[Supabase Error: Payment Insert]", insertErr);
      // We log but don't strictly fail the user if the payment log fails for some reason
    }

    const { error } = await supabaseAdmin
      .from("citations")
      .update({ status: "paid" })
      .eq("citation_number", data.citationNumber);

    if (error) {
      console.error("[Supabase Error: Payment Checkout]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: data.payerName,
        actor_role: "citizen",
        action: "CITATION_ONLINE_SETTLED",
        target_resource: `Citation: ${data.citationNumber} (Plate: ${data.plateNumber})`,
        details: `Amount: PHP ${data.amount}, Method: ${data.paymentMethod.toUpperCase()}, Ref: ${receiptNumber}`,
      });

      // Clear vehicle LTO alarms if no unpaid citations remain
      const compact = data.plateNumber.replace(/[\s-]/g, "").toUpperCase();
      const { data: allCitations } = await supabaseAdmin
        .from("citations")
        .select("id, status, plate_number")
        .neq("citation_number", data.citationNumber);

      const remainingUnpaid = (allCitations || []).filter(
        (c: any) =>
          c.plate_number.replace(/[\s-]/g, "").toUpperCase() === compact &&
          (c.status === "unpaid" || c.status === "overdue" || c.status === "pending")
      );

      if (remainingUnpaid.length === 0) {
        const { data: allVehs } = await supabaseAdmin.from("vehicles").select("plate_number");
        const matchingVeh = (allVehs || []).find(
          (v: any) => v.plate_number.replace(/[\s-]/g, "").toUpperCase() === compact
        );
        if (matchingVeh) {
          await supabaseAdmin
            .from("vehicles")
            .update({ lto_alarm_tagged: false, risk_level: "Clean" })
            .eq("plate_number", matchingVeh.plate_number);
        }

        const { data: allCv } = await supabaseAdmin.from("citizen_vehicles").select("id, plate_number");
        const matchingCv = (allCv || []).filter(
          (cv: any) => cv.plate_number.replace(/[\s-]/g, "").toUpperCase() === compact
        );
        for (const cv of matchingCv) {
          await supabaseAdmin
            .from("citizen_vehicles")
            .update({ lto_alarm_status: "CLEARED" })
            .eq("id", cv.id);
        }
      }
    } catch (err) {
      console.warn(err);
    }

    return {
      receiptNumber,
      citationNumber: data.citationNumber,
      plateNumber: data.plateNumber,
      amount: data.amount,
      paymentMethod: data.paymentMethod.toUpperCase(),
      paidAt,
      ltoClearanceStatus: "CLEARED",
      qrVerificationUrl: `https://culiat-traffic.qc.gov.ph/portal/receipt/${data.citationNumber}`,
    };
  });

// -------------------------------------------------------------
// 7. LTO LTMS VEHICLE LOOKUP
// -------------------------------------------------------------
const ltoLookupSchema = z.object({
  plateNumber: z.string().trim().min(3).max(10),
});

export type LTOVehicleRecord = {
  plateNumber: string;
  makeModel: string;
  year: number;
  color: string;
  chassisNumber: string;
  engineNumber: string;
  registrationStatus: "CURRENT" | "EXPIRED" | "SUSPENDED";
  ltoAlarmTagged: boolean;
  unsettledCitationsCount: number;
  registeredOwner: string;
};

export const verifyVehicleRegistrationLTO = createServerFn({ method: "POST" })
  .validator((data: unknown) => ltoLookupSchema.parse(data))
  .handler(async ({ data }): Promise<LTOVehicleRecord> => {
    const cleanPlate = data.plateNumber.replace(/\s+/g, "").toUpperCase();
    const compactPlate = cleanPlate.replace(/[\s-]/g, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Check live database first
    try {
      const { data: allVehicles } = await supabaseAdmin.from("vehicles").select("*");
      const dbVehicle = (allVehicles || []).find(
        (v: any) => v.plate_number.replace(/[\s-]/g, "").toUpperCase() === compactPlate
      );

      if (dbVehicle) {
        // Count unpaid citations
        const { data: allCitations } = await supabaseAdmin.from("citations").select("id, status, plate_number");
        const unpaid = (allCitations || []).filter(
          (c: any) =>
            c.plate_number.replace(/[\s-]/g, "").toUpperCase() === compactPlate &&
            (c.status === "unpaid" || c.status === "overdue" || c.status === "pending")
        );

        const citationsCount = unpaid.length;
        return {
          plateNumber: dbVehicle.plate_number,
          makeModel: dbVehicle.make_model || "Registered Vehicle",
          year: 2024,
          color: dbVehicle.color || "Silver",
          chassisNumber: dbVehicle.chassis_number || `CHS-${compactPlate}-QC`,
          engineNumber: `ENG-${compactPlate}-QC`,
          registrationStatus: (dbVehicle.registration_status || "CURRENT") as any,
          ltoAlarmTagged: !!dbVehicle.lto_alarm_tagged || citationsCount > 0,
          unsettledCitationsCount: citationsCount,
          registeredOwner: dbVehicle.registered_owner || "Verified Resident (QC Registry)",
        };
      }
    } catch (err) {
      console.warn("[LTO Lookup] Database lookup error:", err);
    }

    const sampleRecords: Record<string, LTOVehicleRecord> = {
      NDB8921: {
        plateNumber: "NDB-8921",
        makeModel: "Toyota Vios 1.3E Dual VVT-i",
        year: 2023,
        color: "Thermalyte Silver",
        chassisNumber: "NCP150-8912384",
        engineNumber: "1NR-FE-928134",
        registrationStatus: "CURRENT",
        ltoAlarmTagged: false,
        unsettledCitationsCount: 1,
        registeredOwner: "Juan Dela Cruz (Barangay Culiat, QC)",
      },
      ABC1234: {
        plateNumber: "ABC-1234",
        makeModel: "Mitsubishi Mirage G4 GLS",
        year: 2022,
        color: "Titanium Gray Metallic",
        chassisNumber: "A03A-7821943",
        engineNumber: "3A92-671294",
        registrationStatus: "CURRENT",
        ltoAlarmTagged: false,
        unsettledCitationsCount: 0,
        registeredOwner: "Maria Santos (Tandang Sora, QC)",
      },
      CAS3901: {
        plateNumber: "CAS-3901",
        makeModel: "Toyota Fortuner 2.8 4x4",
        year: 2024,
        color: "Attitude Black Mica",
        chassisNumber: "GUN156-4910283",
        engineNumber: "1GD-FTV-891204",
        registrationStatus: "CURRENT",
        ltoAlarmTagged: true,
        unsettledCitationsCount: 2,
        registeredOwner: "Enterprise Fleet Logistics Corp.",
      },
    };

    return (
      sampleRecords[compactPlate] ||
      sampleRecords[cleanPlate] || {
        plateNumber: data.plateNumber.toUpperCase(),
        makeModel: "Private Vehicle / Sedan",
        year: 2023,
        color: "Standard",
        chassisNumber: `LTO-CHS-${Math.floor(100000 + Math.random() * 900000)}`,
        engineNumber: `LTO-ENG-${Math.floor(100000 + Math.random() * 900000)}`,
        registrationStatus: "CURRENT",
        ltoAlarmTagged: false,
        unsettledCitationsCount: 0,
        registeredOwner: "Verified Motorist (QC Registry)",
      }
    );
  });

// -------------------------------------------------------------
// 8. TRAFFIC ADJUDICATION BOARD (TAB) DISPUTES
// -------------------------------------------------------------
export const serverFetchDisputes = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("disputes")
        .select("*, citation:citations(*)")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Disputes]", err);
    }
    return null;
  });

const disputeInsertSchema = z.object({
  citationNumber: z.string().trim().min(3),
  reason: z.string().trim().min(5),
  statutoryGround: z.string().optional(),
});

export const serverSaveDispute = createServerFn({ method: "POST" })
  .validator((data: unknown) => disputeInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const now = new Date().toISOString();

    // Look up citation UUID in Supabase
    let citationUUID = generateUUID();
    try {
      const { data: cit } = await supabaseAdmin
        .from("citations")
        .select("id")
        .eq("citation_number", data.citationNumber)
        .maybeSingle();
      if (cit?.id) citationUUID = cit.id;
    } catch {
      // fallback
    }

    const { error } = await supabaseAdmin.from("disputes").insert({
      id,
      citation_id: citationUUID,
      reason: `${data.statutoryGround ? `[${data.statutoryGround}] ` : ""}${data.reason}`,
      status: "pending",
      created_at: now,
    });

    if (error) {
      console.error("[Supabase Error: Save Dispute]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    // Mark citation contested
    await supabaseAdmin
      .from("citations")
      .update({ status: "contested" })
      .eq("citation_number", data.citationNumber);

    return { id, citationNumber: data.citationNumber, status: "pending", created_at: now };
  });

const disputeResolveSchema = z.object({
  disputeId: z.string(),
  action: z.enum(["grant", "uphold"]),
  resolutionNotes: z.string().optional(),
});

export const serverResolveDispute = createServerFn({ method: "POST" })
  .validator((data: unknown) => disputeResolveSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const newStatus = data.action === "grant" ? "approved" : "rejected";
    const citationNewStatus = data.action === "grant" ? "waived" : "unpaid";

    // First fetch the dispute to get the citation_id
    const { data: disputeRow, error: disputeErr } = await supabaseAdmin
      .from("disputes")
      .select("citation_id")
      .eq("id", data.disputeId)
      .maybeSingle();

    if (disputeErr || !disputeRow) {
      throw new Error(`Dispute not found or database error`);
    }

    const { error } = await supabaseAdmin
      .from("disputes")
      .update({
        status: newStatus,
        admin_notes: data.resolutionNotes || null,
        resolved_at: now,
      })
      .eq("id", data.disputeId);

    if (error) {
      console.error("[Supabase Error: Resolve Dispute]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    if (disputeRow.citation_id) {
      await supabaseAdmin
        .from("citations")
        .update({
          status: citationNewStatus,
          ...(data.action === "grant" && { amount: 0 }),
        })
        .eq("id", disputeRow.citation_id);
    }

    return { success: true, status: newStatus, resolvedAt: now };
  });

// -------------------------------------------------------------
// 9. CITIZEN HAZARD REPORTS
// -------------------------------------------------------------
export const serverFetchCitizenReports = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("hazard_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Hazard Reports]", err);
    }
    return [];
  });

const hazardReportInsertSchema = z.object({
  reporter_name: z.string().default("Anonymous Citizen"),
  category: z.string(),
  location: z.string(),
  description: z.string(),
});

export const serverSaveCitizenReport = createServerFn({ method: "POST" })
  .validator((data: unknown) => hazardReportInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const now = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("hazard_reports")
      .insert({
        id,
        reporter_name: data.reporter_name,
        category: data.category,
        location: data.location,
        description: data.description,
        status: "pending",
        created_at: now,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Hazard Report]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    return row;
  });

// -------------------------------------------------------------
// 10. FINANCE & PAYMENTS
// -------------------------------------------------------------
export const serverFetchFinanceQueue = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const [paymentsReq, refundsReq] = await Promise.all([
        supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("refunds").select("*").order("created_at", { ascending: false })
      ]);
      return {
        pendingPayments: paymentsReq.data || [],
        pendingRefunds: refundsReq.data || []
      };
    } catch (err) {
      console.error("[Supabase Error: Fetch Finance Queue]", err);
      return { pendingPayments: [], pendingRefunds: [] };
    }
  });

const verifyPaymentSchema = z.object({
  paymentId: z.string(),
  citationId: z.string(),
});

export const serverVerifyPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => verifyPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Update Payment status
    const { error: payErr } = await supabaseAdmin
      .from("payments")
      .update({ status: "verified" })
      .eq("id", data.paymentId);
    if (payErr) throw new Error(`Database Error: ${payErr.message}`);

    // 2. Update Citation status
    // Note: citation_id in the mock was actually citation_number (e.g. NOV-2026-QC-00129)
    await supabaseAdmin
      .from("citations")
      .update({ status: "paid" })
      .eq("citation_number", data.citationId);

    return { success: true };
  });

const processRefundSchema = z.object({
  refundId: z.string(),
});

export const serverProcessRefund = createServerFn({ method: "POST" })
  .validator((data: unknown) => processRefundSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("refunds")
      .update({ status: "processed", approved_date: new Date().toISOString() })
      .eq("id", data.refundId);
    if (error) throw new Error(`Database Error: ${error.message}`);
    return { success: true };
  });

export const serverFetchFinanceAnalytics = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const [revReq, budReq] = await Promise.all([
        supabaseAdmin.from("revenue_reports").select("*"),
        supabaseAdmin.from("budget_allocations").select("*")
      ]);
      return {
        revenue: revReq.data || [],
        budget: budReq.data || [],
      };
    } catch (err) {
      console.error("[Supabase Error: Fetch Finance Analytics]", err);
      return { revenue: [], budget: [] };
    }
  });

// -------------------------------------------------------------
// 10. CITIZEN PROFILES, VEHICLES & VOUCHERS
// -------------------------------------------------------------
const fetchCitizenSchema = z.object({
  id: z.string().optional(),
  email: z.string().optional(),
});

export const serverFetchCitizenProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => fetchCitizenSchema.parse(data || {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      let query = supabaseAdmin.from("citizen_profiles").select("*");
      if (data.id) {
        query = query.eq("id", data.id);
      } else if (data.email) {
        query = query.eq("email", data.email);
      }

      const { data: profiles } = await query.limit(1);
      let profile = profiles?.[0];

      // If no profile found in DB, return or seed Juan Dela Cruz
      if (!profile) {
        const defaultEmail = data.email || "juan.delacruz@gmail.com";
        const newId = data.id || "a0000000-0000-0000-0000-000000000001";
        const now = new Date().toISOString();
        const { data: created } = await supabaseAdmin
          .from("citizen_profiles")
          .upsert({
            id: newId,
            full_name: "Juan Dela Cruz",
            email: defaultEmail,
            phone: "0917-123-4567",
            address: "124 Visayas Avenue, Barangay Culiat, Quezon City",
            driver_license_number: "N01-20-994812",
            tokens: 280,
          })
          .select()
          .maybeSingle();
        profile = created || {
          id: newId,
          full_name: "Juan Dela Cruz",
          email: defaultEmail,
          phone: "0917-123-4567",
          address: "124 Visayas Avenue, Barangay Culiat, Quezon City",
          driver_license_number: "N01-20-994812",
          tokens: 280,
          created_at: now,
          updated_at: now,
        };
      }

      if (!profile) return null;

      // Fetch citizen vehicles
      const { data: vRows } = await supabaseAdmin
        .from("citizen_vehicles")
        .select("*")
        .eq("citizen_id", profile.id);

      // Also check vehicles table for any vehicle registered under citizen's name
      const { data: registryVehicles } = await supabaseAdmin
        .from("vehicles")
        .select("*")
        .ilike("registered_owner", profile.full_name);

      const combinedVehiclesMap = new Map<string, any>();
      for (const cv of (vRows || [])) {
        const compact = cv.plate_number.replace(/[\s-]/g, "").toUpperCase();
        combinedVehiclesMap.set(compact, {
          id: cv.id,
          plateNumber: cv.plate_number,
          makeModel: cv.make_model,
          type: cv.vehicle_type || "Sedan",
          status: (cv.status || "verified") as "verified" | "pending",
          ltoExpiry: cv.lto_expiry || "2027-12-31",
          ltoAlarmStatus: (cv.lto_alarm_status || "CLEARED") as "CLEARED" | "WARNING_DUE_SOON" | "LTO_ALARM_ACTIVE",
        });
      }

      for (const rv of (registryVehicles || [])) {
        const compact = rv.plate_number.replace(/[\s-]/g, "").toUpperCase();
        if (!combinedVehiclesMap.has(compact)) {
          combinedVehiclesMap.set(compact, {
            id: rv.id || `veh-${compact}`,
            plateNumber: rv.plate_number,
            makeModel: rv.make_model || "Registered Vehicle",
            type: "Sedan",
            status: "verified",
            ltoExpiry: "2027-12-31",
            ltoAlarmStatus: rv.lto_alarm_tagged ? "LTO_ALARM_ACTIVE" : "CLEARED",
          });
        }
      }

      let vehicles = Array.from(combinedVehiclesMap.values());
      if (vehicles.length === 0) {
        vehicles = [
          {
            id: "veh-001",
            plateNumber: "NDB 8921",
            makeModel: "Toyota Vios 1.3E Silver",
            type: "Sedan",
            status: "verified" as const,
            ltoExpiry: "2027-12-31",
            ltoAlarmStatus: "CLEARED" as const,
          },
        ];
      }

      // Fetch citations for citizen's plates
      const plateCompacts = new Set(vehicles.map((v: any) => v.plateNumber.replace(/[\s-]/g, "").toUpperCase()));
      const { data: allCmdCitations } = await supabaseAdmin
        .from("citations")
        .select("*, violations(evidence_url, location)")
        .order("issued_at", { ascending: false });

      const cmdCitations = (allCmdCitations || []).filter((c: any) => {
        const cCompact = (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        return plateCompacts.has(cCompact);
      });

      // Update vehicle ltoAlarmStatus dynamically based on real citation state
      vehicles = vehicles.map((v: any) => {
        const vCompact = v.plateNumber.replace(/[\s-]/g, "").toUpperCase();
        const hasUnpaid = cmdCitations.some(
          (c: any) =>
            c.plate_number.replace(/[\s-]/g, "").toUpperCase() === vCompact &&
            (c.status === "unpaid" || c.status === "overdue" || c.status === "pending")
        );
        return {
          ...v,
          ltoAlarmStatus: hasUnpaid ? ("LTO_ALARM_ACTIVE" as const) : ("CLEARED" as const),
        };
      });

      const { parseEvidenceUrls } = await import("@/lib/storage");

      const citations = (cmdCitations || []).map((cmd: any) => {
        const isPaid = cmd.status === "paid" || cmd.status === "settled";
        const rawEvidence = cmd.evidence_url || cmd.violations?.evidence_url;
        const frames = parseEvidenceUrls(rawEvidence);
        const evidenceFrames = frames.map((frameUrl, idx) => ({
          url: frameUrl,
          label: frames.length > 1 ? `Optical Capture Frame #${idx + 1}` : `Optical Sentinel Capture: ${cmd.offense}`,
          timestamp: new Date(cmd.issued_at).toLocaleTimeString(),
        }));

        return {
          id: cmd.id,
          novNumber: cmd.citation_number,
          plateNumber: cmd.plate_number,
          violation: cmd.offense,
          ordinanceCode: "QC Traffic Ordinance SP-2938 / MMDA NCAP",
          location: cmd.violations?.location || "Quezon City Active Corridor",
          date: cmd.issued_at,
          dueDate: new Date(new Date(cmd.issued_at).getTime() + 10 * 86400000).toISOString(),
          amount: Number(cmd.amount) || 2000,
          surcharge: 0,
          status: isPaid ? ("settled" as const) : ("unpaid" as const),
          ltoAlarmStatus: isPaid ? ("CLEARED" as const) : ("LTO_ALARM_ACTIVE" as const),
          evidenceFrames,
        };
      });

      // Fetch citizen vouchers
      const { data: voucherRows } = await supabaseAdmin
        .from("citizen_vouchers")
        .select("*")
        .eq("citizen_id", profile.id);

      const vouchers = (voucherRows || []).map((v: any) => ({
        id: v.id,
        code: v.code,
        title: v.title,
        description: v.description || "",
        cost: Number(v.cost) || 50,
        claimedAt: v.claimed_at,
        status: (v.status || "active") as "active" | "used",
      }));

      // Fetch hazard reports
      const { data: hazardRows } = await supabaseAdmin
        .from("hazard_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      const hazards = (hazardRows || []).map((h: any) => ({
        id: h.id,
        category: h.category as any,
        location: h.location,
        description: h.description,
        reportedAt: h.created_at,
        status: (h.status === "resolved" ? "Resolved" : h.status === "dispatched" ? "Officer Dispatched" : "Under Review") as any,
      }));

      return {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone || "0917-123-4567",
        address: profile.address || "124 Visayas Avenue, Barangay Culiat, Quezon City",
        tokens: Number(profile.tokens) || 280,
        driverLicenseNumber: profile.driver_license_number || "N01-20-994812",
        vehicles,
        citations,
        vouchers,
        hazards,
      };
    } catch (err) {
      console.error("[Supabase Error: Fetch Citizen Profile]", err);
      return null;
    }
  });

const saveCitizenProfileSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  driverLicenseNumber: z.string().optional(),
  tokens: z.number().optional(),
});

export const serverSaveCitizenProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => saveCitizenProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = data.id || generateUUID();
    const now = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("citizen_profiles")
      .upsert({
        id,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        address: data.address || "Barangay Culiat, Quezon City",
        driver_license_number: data.driverLicenseNumber || null,
        tokens: data.tokens ?? 250,
        updated_at: now,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Citizen Profile]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || { id, ...data };
  });

const addCitizenVehicleSchema = z.object({
  citizen_id: z.string(),
  plate_number: z.string().min(2),
  make_model: z.string().min(2),
  vehicle_type: z.string().default("Sedan"),
});

export const serverAddCitizenVehicle = createServerFn({ method: "POST" })
  .validator((data: unknown) => addCitizenVehicleSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanPlate = data.plate_number.toUpperCase().trim();
    const id = generateUUID();

    // Check if plate has outstanding violations in Supabase
    const { data: unpaid } = await supabaseAdmin
      .from("citations")
      .select("id")
      .eq("plate_number", cleanPlate)
      .in("status", ["unpaid", "pending"]);

    const alarmStatus = unpaid && unpaid.length > 0 ? "WARNING_DUE_SOON" : "CLEARED";

    // 1. Insert into citizen_vehicles
    const { data: row, error } = await supabaseAdmin
      .from("citizen_vehicles")
      .insert({
        id,
        citizen_id: data.citizen_id,
        plate_number: cleanPlate,
        make_model: data.make_model,
        vehicle_type: data.vehicle_type,
        status: "verified",
        lto_expiry: "2027-12-31",
        lto_alarm_status: alarmStatus,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Add Citizen Vehicle]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    // 2. Also register into main vehicles table
    try {
      const { data: profile } = await supabaseAdmin
        .from("citizen_profiles")
        .select("full_name")
        .eq("id", data.citizen_id)
        .maybeSingle();

      const ownerName = profile?.full_name || "Verified Resident";

      await supabaseAdmin.from("vehicles").upsert({
        plate_number: cleanPlate,
        make_model: data.make_model,
        registered_owner: ownerName,
        registration_status: "CURRENT",
        lto_alarm_tagged: alarmStatus !== "CLEARED",
        risk_level: alarmStatus !== "CLEARED" ? "Watch" : "Clean",
      }, { onConflict: "plate_number" });
    } catch {
      // main vehicles fallback
    }

    return row || {
      id,
      plateNumber: cleanPlate,
      makeModel: data.make_model,
      type: data.vehicle_type,
      status: "verified",
      ltoExpiry: "2027-12-31",
      ltoAlarmStatus: alarmStatus,
    };
  });

const removeCitizenVehicleSchema = z.object({
  vehicle_id: z.string(),
});

export const serverRemoveCitizenVehicle = createServerFn({ method: "POST" })
  .validator((data: unknown) => removeCitizenVehicleSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("citizen_vehicles")
      .delete()
      .eq("id", data.vehicle_id);

    if (error) {
      console.error("[Supabase Error: Remove Citizen Vehicle]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return { success: true };
  });

const redeemVoucherSchema = z.object({
  citizen_id: z.string(),
  code: z.string(),
  title: z.string(),
  cost: z.number(),
  description: z.string().optional(),
});

export const serverRedeemCitizenVoucher = createServerFn({ method: "POST" })
  .validator((data: unknown) => redeemVoucherSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();

    // 1. Insert voucher
    const { error } = await supabaseAdmin
      .from("citizen_vouchers")
      .insert({
        id,
        citizen_id: data.citizen_id,
        code: data.code,
        title: data.title,
        description: data.description || null,
        cost: data.cost,
        status: "active",
      });

    if (error) {
      console.error("[Supabase Error: Redeem Voucher]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    // 2. Decrement tokens
    const { data: profile } = await supabaseAdmin
      .from("citizen_profiles")
      .select("tokens")
      .eq("id", data.citizen_id)
      .maybeSingle();

    if (profile) {
      const remaining = Math.max(0, (profile.tokens || 0) - data.cost);
      await supabaseAdmin
        .from("citizen_profiles")
        .update({ tokens: remaining })
        .eq("id", data.citizen_id);
    }

    return { id, code: data.code, title: data.title, cost: data.cost, status: "active" };
  });

const nominateDriverSchema = z.object({
  citation_id: z.string(),
  citizen_id: z.string().optional(),
  nominee_name: z.string().min(2),
  nominee_license: z.string().min(4),
});

export const serverSubmitDriverNomination = createServerFn({ method: "POST" })
  .validator((data: unknown) => nominateDriverSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();

    const { data: row, error } = await supabaseAdmin
      .from("driver_nominations")
      .insert({
        id,
        citation_id: data.citation_id,
        citizen_id: data.citizen_id || null,
        nominee_name: data.nominee_name,
        nominee_license: data.nominee_license,
        status: "submitted",
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Submit Driver Nomination]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    return row || { id, ...data, status: "submitted" };
  });

// -------------------------------------------------------------
// 11. COMMAND DASHBOARD AGGREGATED METRICS
// -------------------------------------------------------------
export const serverFetchCommandDashboardMetrics = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const [vRes, cRes, oRes, camRes] = await Promise.all([
        supabaseAdmin.from("violations").select("id, status, confidence, detected_at, created_at, violation_type, location, plate_number, evidence_url, camera_code", { count: "exact" }).order("detected_at", { ascending: false }).limit(20),
        supabaseAdmin.from("citations").select("id, citation_number, status, amount, issued_at, offense, plate_number, vehicle_model, officer_name", { count: "exact" }).order("issued_at", { ascending: false }).limit(25),
        supabaseAdmin.from("officers").select("*"),
        supabaseAdmin.from("cameras").select("*"),
      ]);

      const violationsList = vRes.data || [];
      const citationsList = cRes.data || [];
      const officersList = oRes.data || [];
      const camerasList = camRes.data || [];

      // Calculate real totals
      const totalViolationsCount = vRes.count ?? violationsList.length;
      const totalCitationsCount = cRes.count ?? citationsList.length;
      const activeOfficers = officersList.filter((o: any) => o.on_duty !== false).length;
      const totalOfficers = officersList.length || 10;

      const settlementRevenue = citationsList
        .filter((c: any) => c.status === "paid" || c.status === "settled")
        .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

      const pendingCitations = citationsList
        .filter((c: any) => c.status === "unpaid" || c.status === "pending").length;

      const activeCameras = camerasList.filter((c: any) => c.status !== "offline").length;

      return {
        dailyViolations: totalViolationsCount > 0 ? totalViolationsCount : violationsList.length,
        activeOfficers,
        totalOfficers,
        settlementRevenue,
        pendingCitations: pendingCitations > 0 ? pendingCitations : (totalCitationsCount - citationsList.filter((c: any) => c.status === "paid").length),
        activeCameras: activeCameras > 0 ? activeCameras : camerasList.length,
        totalCameras: camerasList.length || 6,
        cameras: camerasList,
        recentViolations: violationsList.slice(0, 8),
        recentCitations: citationsList.slice(0, 15),
      };
    } catch (err) {
      console.error("[Supabase Error: Command Metrics]", err);
      return {
        dailyViolations: 0,
        activeOfficers: 0,
        totalOfficers: 0,
        settlementRevenue: 0,
        pendingCitations: 0,
        activeCameras: 0,
        totalCameras: 0,
        cameras: [],
        recentViolations: [],
        recentCitations: [],
      };
    }
  });

// -------------------------------------------------------------
// 12. MOTORIST VEHICLE REGISTRY & LOOKUP
// -------------------------------------------------------------
const registerVehicleSchema = z.object({
  plateNumber: z.string().trim().min(2),
  makeModel: z.string().trim().min(2),
  registeredOwner: z.string().trim().min(2),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  color: z.string().optional(),
  vehicleType: z.string().optional(),
  chassisNumber: z.string().optional(),
});

export const serverRegisterVehicle = createServerFn({ method: "POST" })
  .validator((data: unknown) => registerVehicleSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanPlate = data.plateNumber.toUpperCase().trim();
    const compactPlate = cleanPlate.replace(/[\s-]/g, "");

    // 1. Check citations to compute risk level and LTO alarm
    const { data: allCitations } = await supabaseAdmin
      .from("citations")
      .select("id, status, amount, plate_number");

    const plateCits = (allCitations || []).filter(
      (c: any) => (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate
    );
    const unpaid = plateCits.filter((c: any) => c.status === "unpaid" || c.status === "overdue");
    const outstanding = unpaid.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

    let riskLevel = "Clean";
    let ltoAlarmTagged = false;
    if (outstanding >= 5000 || unpaid.length >= 3) {
      riskLevel = "Blocked";
      ltoAlarmTagged = true;
    } else if (unpaid.length >= 1 || outstanding > 0) {
      riskLevel = "Flagged";
      ltoAlarmTagged = true;
    }

    // 2. Upsert into public.vehicles
    const now = new Date().toISOString();
    const { data: vehicleRow, error: vehErr } = await supabaseAdmin
      .from("vehicles")
      .upsert(
        {
          plate_number: cleanPlate,
          make_model: data.makeModel,
          registered_owner: data.registeredOwner,
          color: data.color || "Silver",
          chassis_number: data.chassisNumber || null,
          registration_status: "CURRENT",
          risk_level: riskLevel,
          lto_alarm_tagged: ltoAlarmTagged,
          updated_at: now,
        },
        { onConflict: "plate_number" }
      )
      .select()
      .maybeSingle();

    if (vehErr) {
      console.warn("[Supabase Warning: Register Vehicle in public.vehicles]", vehErr.message);
    }

    // 3. Link to citizen_profiles & citizen_vehicles
    try {
      let citizenId: string | null = null;
      if (data.ownerEmail && data.ownerEmail.trim()) {
        const cleanEmail = data.ownerEmail.trim().toLowerCase();
        const { data: existingProfile } = await supabaseAdmin
          .from("citizen_profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (existingProfile?.id) {
          citizenId = existingProfile.id;
        } else {
          const newCitizenId = generateUUID();
          const { data: newProfile } = await supabaseAdmin
            .from("citizen_profiles")
            .insert({
              id: newCitizenId,
              full_name: data.registeredOwner,
              email: cleanEmail,
              address: "Barangay Culiat, Quezon City",
              tokens: 150,
            })
            .select("id")
            .maybeSingle();
          if (newProfile?.id) citizenId = newProfile.id;
        }
      }

      if (!citizenId) {
        // Look up citizen profile by full name
        const { data: matchingProfile } = await supabaseAdmin
          .from("citizen_profiles")
          .select("id")
          .ilike("full_name", data.registeredOwner)
          .maybeSingle();

        if (matchingProfile?.id) {
          citizenId = matchingProfile.id;
        } else {
          // Default to demo citizen Juan Dela Cruz
          citizenId = "a0000000-0000-0000-0000-000000000001";
        }
      }

      if (citizenId) {
        // Upsert into citizen_vehicles
        const { data: existingCv } = await supabaseAdmin
          .from("citizen_vehicles")
          .select("id")
          .eq("citizen_id", citizenId)
          .ilike("plate_number", cleanPlate)
          .maybeSingle();

        const cvAlarmStatus = ltoAlarmTagged ? "LTO_ALARM_ACTIVE" : "CLEARED";
        if (existingCv?.id) {
          await supabaseAdmin
            .from("citizen_vehicles")
            .update({
              make_model: data.makeModel,
              vehicle_type: data.vehicleType || "Sedan",
              status: "verified",
              lto_alarm_status: cvAlarmStatus,
            })
            .eq("id", existingCv.id);
        } else {
          await supabaseAdmin
            .from("citizen_vehicles")
            .insert({
              id: generateUUID(),
              citizen_id: citizenId,
              plate_number: cleanPlate,
              make_model: data.makeModel,
              vehicle_type: data.vehicleType || "Sedan",
              status: "verified",
              lto_expiry: "2027-12-31",
              lto_alarm_status: cvAlarmStatus,
            });
        }
      }
    } catch (citizenErr) {
      console.warn("[Register Vehicle] Error linking citizen profile:", citizenErr);
    }

    // 4. Audit log
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: "Vehicle Registry Officer",
        actor_role: "admin",
        action: "VEHICLE_REGISTERED",
        target_resource: `Plate: ${cleanPlate}`,
        details: `Registered ${data.makeModel} to ${data.registeredOwner}. Status: CURRENT, Risk: ${riskLevel}`,
      });
    } catch (auditErr) {
      console.warn(auditErr);
    }

    return vehicleRow || {
      plate_number: cleanPlate,
      make_model: data.makeModel,
      registered_owner: data.registeredOwner,
      color: data.color || "Silver",
      chassis_number: data.chassisNumber || null,
      registration_status: "CURRENT",
      risk_level: riskLevel,
      lto_alarm_tagged: ltoAlarmTagged,
    };
  });

export type RegisteredVehicleRecord = {
  plate: string;
  model: string | null;
  owner: string;
  color?: string;
  chassis?: string;
  violations: number;
  citations: number;
  unpaid: number;
  outstanding: number;
  totalBilled: number;
  lastSeen: string;
  lastOffense: string;
  risk: "clean" | "watch" | "flagged" | "blocked";
  ltoAlarm: boolean;
};

export const serverFetchRegisteredVehicles = createServerFn({ method: "GET" })
  .handler(async (): Promise<RegisteredVehicleRecord[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const [vRes, cvRes, cRes, vioRes] = await Promise.all([
        supabaseAdmin.from("vehicles").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("citizen_vehicles").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("citations").select("*").order("issued_at", { ascending: false }),
        supabaseAdmin.from("violations").select("*").order("detected_at", { ascending: false }),
      ]);

      const dbVehicles = vRes.data || [];
      const citizenVehicles = cvRes.data || [];
      const citations = cRes.data || [];
      const violations = vioRes.data || [];

      const map = new Map<string, RegisteredVehicleRecord>();

      // Populate from citizen_vehicles first
      for (const cv of citizenVehicles) {
        const compact = (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        map.set(compact, {
          plate: cv.plate_number,
          model: cv.make_model,
          owner: "Verified Citizen",
          color: "Silver",
          chassis: undefined,
          violations: 0,
          citations: 0,
          unpaid: 0,
          outstanding: 0,
          totalBilled: 0,
          lastSeen: cv.created_at || new Date().toISOString(),
          lastOffense: "None (Clean Record)",
          risk: cv.lto_alarm_status === "LTO_ALARM_ACTIVE" ? "flagged" : "clean",
          ltoAlarm: cv.lto_alarm_status === "LTO_ALARM_ACTIVE",
        });
      }

      // Populate from dbVehicles (overriding or enriching)
      for (const v of dbVehicles) {
        const compact = (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        map.set(compact, {
          plate: v.plate_number,
          model: v.make_model,
          owner: v.registered_owner || "Verified Motorist",
          color: v.color || "Silver",
          chassis: v.chassis_number || undefined,
          violations: 0,
          citations: 0,
          unpaid: 0,
          outstanding: 0,
          totalBilled: 0,
          lastSeen: v.created_at || new Date().toISOString(),
          lastOffense: "None (Clean Record)",
          risk: ((v.risk_level || "Clean").toLowerCase()) as "clean" | "watch" | "flagged" | "blocked",
          ltoAlarm: !!v.lto_alarm_tagged,
        });
      }

      // Aggregate violations
      for (const vio of violations) {
        const compact = (vio.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        let row = map.get(compact);
        if (!row) {
          row = {
            plate: vio.plate_number,
            model: null,
            owner: "Unregistered Motorist",
            violations: 0,
            citations: 0,
            unpaid: 0,
            outstanding: 0,
            totalBilled: 0,
            lastSeen: vio.detected_at,
            lastOffense: vio.violation_type,
            risk: "clean",
            ltoAlarm: false,
          };
          map.set(compact, row);
        }
        row.violations += 1;
        if (new Date(vio.detected_at) >= new Date(row.lastSeen)) {
          row.lastSeen = vio.detected_at;
          row.lastOffense = vio.violation_type;
        }
      }

      // Aggregate citations
      for (const cit of citations) {
        const compact = (cit.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        let row = map.get(compact);
        if (!row) {
          row = {
            plate: cit.plate_number,
            model: cit.vehicle_model,
            owner: "Unregistered Motorist",
            violations: 0,
            citations: 0,
            unpaid: 0,
            outstanding: 0,
            totalBilled: 0,
            lastSeen: cit.issued_at,
            lastOffense: cit.offense,
            risk: "clean",
            ltoAlarm: false,
          };
          map.set(compact, row);
        }
        row.model = row.model || cit.vehicle_model;
        row.citations += 1;
        row.totalBilled += Number(cit.amount || 0);
        if (cit.status === "unpaid" || cit.status === "overdue") {
          row.unpaid += 1;
          row.outstanding += Number(cit.amount || 0);
        }
        if (new Date(cit.issued_at) >= new Date(row.lastSeen)) {
          row.lastSeen = cit.issued_at;
          row.lastOffense = cit.offense;
        }
      }

      const rows = Array.from(map.values()).map((r) => {
        const total = r.violations + r.citations;
        let risk: "clean" | "watch" | "flagged" | "blocked" = r.risk || "clean";
        let ltoAlarm = r.ltoAlarm || false;

        if (r.outstanding >= 5000 || r.unpaid >= 3) {
          risk = "blocked";
          ltoAlarm = true;
        } else if (total >= 4 || r.outstanding > 0 || r.unpaid >= 1) {
          risk = "flagged";
          ltoAlarm = true;
        } else if (total >= 2) {
          risk = "watch";
        }
        return { ...r, risk, ltoAlarm };
      });

      rows.sort(
        (a, b) =>
          b.outstanding - a.outstanding ||
          b.violations + b.citations - (a.violations + a.citations) ||
          new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
      return rows;
    } catch (err) {
      console.error("[Supabase Error: Fetch Registered Vehicles]", err);
      return [];
    }
  });

const vehicleLookupSchema = z.object({
  plateNumber: z.string().trim().min(2),
});

export type VehicleLookupResult = {
  foundInDatabase: boolean;
  plateNumber: string;
  makeModel: string;
  registeredOwner: string;
  ownerEmail?: string;
  color: string;
  vehicleType?: string;
  chassisNumber?: string;
  registrationStatus: "CURRENT" | "EXPIRED" | "SUSPENDED";
  riskLevel: "Clean" | "Watch" | "Flagged" | "Blocked";
  ltoAlarmTagged: boolean;
  unpaidCitationsCount: number;
  outstandingAmount: number;
  citizenName?: string;
};

export const serverLookupVehicleDetails = createServerFn({ method: "POST" })
  .validator((data: unknown) => vehicleLookupSchema.parse(data))
  .handler(async ({ data }): Promise<VehicleLookupResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rawPlate = data.plateNumber.trim();
    const compactPlate = rawPlate.replace(/[\s-]/g, "").toUpperCase();

    // 1. Check public.vehicles
    try {
      const { data: vList } = await supabaseAdmin
        .from("vehicles")
        .select("*");

      const match = (vList || []).find((v: any) =>
        (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate ||
        (v.plate_number || "").toUpperCase() === rawPlate.toUpperCase()
      );

      if (match) {
        // Fetch citations for this plate
        const { data: allCits } = await supabaseAdmin
          .from("citations")
          .select("*");

        const matchingCits = (allCits || []).filter((c: any) =>
          (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate
        );
        const unpaidCits = matchingCits.filter((c: any) => c.status === "unpaid" || c.status === "overdue" || c.status === "pending");
        const unpaidCount = unpaidCits.length;
        const outstanding = unpaidCits.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

        let risk: "Clean" | "Watch" | "Flagged" | "Blocked" = (match.risk_level as any) || "Clean";
        let alarm = !!match.lto_alarm_tagged;
        if (outstanding >= 5000 || unpaidCount >= 3) {
          risk = "Blocked";
          alarm = true;
        } else if (unpaidCount > 0) {
          risk = "Flagged";
          alarm = true;
        }

        return {
          foundInDatabase: true,
          plateNumber: match.plate_number,
          makeModel: match.make_model || "Registered Vehicle",
          registeredOwner: match.registered_owner || "Verified Motorist",
          color: match.color || "Silver",
          chassisNumber: match.chassis_number || undefined,
          registrationStatus: (match.registration_status as any) || "CURRENT",
          riskLevel: risk,
          ltoAlarmTagged: alarm,
          unpaidCitationsCount: unpaidCount,
          outstandingAmount: outstanding,
        };
      }
    } catch (err) {
      console.warn("[Vehicle Lookup] DB Error:", err);
    }

    // 2. Check citizen_vehicles
    try {
      const { data: cvList } = await supabaseAdmin
        .from("citizen_vehicles")
        .select("*");

      const cvMatch = (cvList || []).find((v: any) =>
        (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate ||
        (v.plate_number || "").toUpperCase() === rawPlate.toUpperCase()
      );

      if (cvMatch) {
        let ownerName = "Verified Resident";
        let ownerEmail: string | undefined = undefined;
        if (cvMatch.citizen_id) {
          const { data: prof } = await supabaseAdmin
            .from("citizen_profiles")
            .select("full_name, email")
            .eq("id", cvMatch.citizen_id)
            .maybeSingle();
          if (prof?.full_name) ownerName = prof.full_name;
          if (prof?.email) ownerEmail = prof.email;
        }

        const alarm = cvMatch.lto_alarm_status !== "CLEARED";
        return {
          foundInDatabase: true,
          plateNumber: cvMatch.plate_number,
          makeModel: cvMatch.make_model,
          registeredOwner: ownerName,
          ownerEmail,
          color: "Silver",
          vehicleType: cvMatch.vehicle_type,
          registrationStatus: "CURRENT",
          riskLevel: alarm ? "Flagged" : "Clean",
          ltoAlarmTagged: alarm,
          unpaidCitationsCount: alarm ? 1 : 0,
          outstandingAmount: 0,
          citizenName: ownerName,
        };
      }
    } catch (err) {
      console.warn("[Vehicle Lookup] Citizen DB Error:", err);
    }

    // 3. Fallback to LTO verification
    const lto = await verifyVehicleRegistrationLTO({ data: { plateNumber: rawPlate } });
    return {
      foundInDatabase: false,
      plateNumber: lto.plateNumber,
      makeModel: lto.makeModel,
      registeredOwner: lto.registeredOwner,
      color: lto.color,
      chassisNumber: lto.chassisNumber,
      registrationStatus: lto.registrationStatus,
      riskLevel: lto.ltoAlarmTagged ? "Flagged" : "Clean",
      ltoAlarmTagged: lto.ltoAlarmTagged,
      unpaidCitationsCount: lto.unsettledCitationsCount,
      outstandingAmount: lto.unsettledCitationsCount * 2000,
    };
  });

