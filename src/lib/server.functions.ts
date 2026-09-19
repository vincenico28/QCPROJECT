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

// Helper to verify if an identifier is a standard UUID string
function isUUID(val: unknown): boolean {
  if (typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

/**
 * Builds a safe filter for citations query without triggering
 * "invalid input syntax for type uuid" error in PostgreSQL when querying by human-readable citation_number.
 */
function applyCitationIdentifierFilter<T>(query: T, identifier: string): T {
  const clean = identifier?.trim() || "";
  if (!clean) return query;
  if (isUUID(clean)) {
    return (query as any).or(`citation_number.eq.${clean},id.eq.${clean}`);
  }
  return (query as any).eq("citation_number", clean);
}

// -------------------------------------------------------------
// 1. VIOLATIONS
// -------------------------------------------------------------
export const serverFetchViolations = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const raw = typeof input === "number" ? input : typeof (input as any)?.data === "number" ? (input as any).data : Number(input);
    return !isNaN(raw) && raw > 0 ? raw : 500;
  })
  .handler(async ({ data: limit }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const numLimit = typeof limit === "number" && limit > 0 ? limit : 500;
    try {
      const { data, error } = await supabaseAdmin
        .from("violations")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(numLimit);
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Violations]", err);
    }
    return null;
  });


export const serverFetchCitations = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const raw = typeof input === "number" ? input : typeof (input as any)?.data === "number" ? (input as any).data : Number(input);
    return !isNaN(raw) && raw > 0 ? raw : 500;
  })
  .handler(async ({ data: limit }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const numLimit = typeof limit === "number" && limit > 0 ? limit : 500;
    try {
      const [citsRes, cvRes, profRes, vehRes] = await Promise.all([
        supabaseAdmin
          .from("citations")
          .select("*, violations(evidence_url, location, camera_code)")
          .order("issued_at", { ascending: false })
          .limit(numLimit),
        supabaseAdmin.from("citizen_vehicles").select("*"),
        supabaseAdmin.from("citizen_profiles").select("*"),
        supabaseAdmin.from("vehicles").select("plate_number, registered_owner, risk_level, lto_alarm_tagged"),
      ]);

      const data = citsRes.data;
      if (!citsRes.error && data) {
        // In-memory deduplication ONLY if identical citation_number or id occurs twice
        const seenIds = new Set<string>();
        const seenCitationNumbers = new Set<string>();
        const uniqueList: any[] = [];

        // Sort so latest issued ones are prioritized
        const sorted = [...data].sort((a, b) => {
          return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime();
        });

        for (const c of sorted) {
          if (c.id && seenIds.has(c.id)) continue;
          if (c.citation_number && seenCitationNumbers.has(c.citation_number)) continue;
          if (c.id) seenIds.add(c.id);
          if (c.citation_number) seenCitationNumbers.add(c.citation_number);
          uniqueList.push(c);
        }

        // Build quick lookup maps for citizen motorist linkage
        const profileById = new Map<string, any>();
        for (const p of profRes.data || []) {
          profileById.set(p.id, p);
        }

        const citizenByPlate = new Map<string, any>();
        for (const cv of cvRes.data || []) {
          const norm = (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
          const prof = cv.citizen_id ? profileById.get(cv.citizen_id) : null;
          citizenByPlate.set(norm, { cv, prof });
        }

        const vehByPlate = new Map<string, any>();
        for (const v of vehRes.data || []) {
          const norm = (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
          vehByPlate.set(norm, v);
        }

        // Re-sort by issued_at DESC for display
        uniqueList.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());

        return uniqueList.map((c: any) => {
          const normPlate = (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
          const citizenMatch = citizenByPlate.get(normPlate);
          const vehMatch = vehByPlate.get(normPlate);

          const isCitizen = !!citizenMatch;
          const citizenName = citizenMatch?.prof?.full_name || vehMatch?.registered_owner || undefined;
          const citizenEmail = citizenMatch?.prof?.email || undefined;
          const citizenPhone = citizenMatch?.prof?.phone || undefined;
          const registeredOwner = citizenName || vehMatch?.registered_owner || undefined;
          const ltoAlarm = !!vehMatch?.lto_alarm_tagged || citizenMatch?.cv?.lto_alarm_status === "LTO_ALARM_ACTIVE";
          const risk = vehMatch?.risk_level || (ltoAlarm ? "Flagged" : "Clean");

          return {
            ...c,
            isCitizenRegistered: isCitizen,
            citizenName,
            citizenEmail,
            citizenPhone,
            registeredOwner,
            ltoAlarmTagged: ltoAlarm,
            riskLevel: risk,
            evidence_url: c.evidence_url || c.violations?.evidence_url || "/assets/violation-1.jpg",
            location: c.violations?.location || c.location || "Quezon City Road Corridor",
          };
        });
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Citations]", err);
    }
    return null;
  });

export const serverFetchCitationById = createServerFn({ method: "GET" })
  .validator((identifier: unknown) => String(identifier || "").trim())
  .handler(async ({ data: identifier }) => {
    if (!identifier) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      let q = supabaseAdmin
        .from("citations")
        .select("*, violations(evidence_url, location, camera_code)");
      q = applyCitationIdentifierFilter(q, identifier);
      const { data, error } = await q.maybeSingle();

      if (!error && data) {
        const row = data as any;
        const normPlate = (row.plate_number || "").replace(/[\s-]/g, "").toUpperCase();

        let citizenInfo: any = {};
        try {
          const [cvRes, profRes, vehRes] = await Promise.all([
            supabaseAdmin.from("citizen_vehicles").select("*"),
            supabaseAdmin.from("citizen_profiles").select("*"),
            supabaseAdmin.from("vehicles").select("*"),
          ]);
          const cvMatch = (cvRes.data || []).find((cv: any) =>
            (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === normPlate
          );
          const profMatch = cvMatch?.citizen_id
            ? (profRes.data || []).find((p: any) => p.id === cvMatch.citizen_id)
            : null;
          const vehMatch = (vehRes.data || []).find((v: any) =>
            (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === normPlate
          );

          citizenInfo = {
            isCitizenRegistered: !!cvMatch,
            citizenName: profMatch?.full_name || vehMatch?.registered_owner || undefined,
            citizenEmail: profMatch?.email || undefined,
            citizenPhone: profMatch?.phone || undefined,
            registeredOwner: profMatch?.full_name || vehMatch?.registered_owner || undefined,
            ltoAlarmTagged: !!vehMatch?.lto_alarm_tagged || cvMatch?.lto_alarm_status === "LTO_ALARM_ACTIVE",
            riskLevel: vehMatch?.risk_level || (cvMatch?.lto_alarm_status === "LTO_ALARM_ACTIVE" ? "Flagged" : "Clean"),
          };
        } catch {
          // fallback
        }

        return {
          ...row,
          ...citizenInfo,
          evidence_url: row.evidence_url || row.violations?.evidence_url || "/assets/violation-1.jpg",
          location: row.violations?.location || row.location || "Quezon City Road Corridor",
        };
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Citation by ID]", err);
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
// CITIZEN MOTORIST & EMAIL DISPATCH HELPERS
// -------------------------------------------------------------
async function findCitizenMotoristForPlate(plateNumber: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const compact = plateNumber.replace(/[\s-]/g, "").toUpperCase();

  try {
    const [cvRes, vehRes, profRes] = await Promise.all([
      supabaseAdmin.from("citizen_vehicles").select("id, citizen_id, plate_number, make_model"),
      supabaseAdmin.from("vehicles").select("plate_number, registered_owner"),
      supabaseAdmin.from("citizen_profiles").select("id, full_name, email, phone"),
    ]);

    const profMap = new Map<string, any>();
    for (const p of profRes.data || []) {
      profMap.set(p.id, p);
    }

    const cvMatch = (cvRes.data || []).find(
      (cv: any) => (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compact
    );

    if (cvMatch?.citizen_id) {
      const prof = profMap.get(cvMatch.citizen_id);
      if (prof?.email) {
        return {
          isCitizenRegistered: true,
          fullName: prof.full_name || "Registered Citizen Motorist",
          email: prof.email,
          phone: prof.phone || undefined,
          vehicleModel: cvMatch.make_model || undefined,
        };
      }
    }

    // Fallback to vehicles registry
    const vehMatch = (vehRes.data || []).find(
      (v: any) => (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compact
    );

    if (vehMatch?.registered_owner) {
      return {
        isCitizenRegistered: false,
        fullName: vehMatch.registered_owner,
        email: `motorist.${compact.toLowerCase()}@motorist.qc.gov.ph`,
        phone: undefined,
        vehicleModel: undefined,
      };
    }
  } catch (findErr) {
    console.warn("[findCitizenMotoristForPlate]", findErr);
  }

  return null;
}

// Shared helper to clear vehicle LTO alarms if no unpaid citations remain
async function clearVehicleLtoAlarms(plateNumber: string, currentCitationNumber?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const compact = plateNumber.replace(/[\s-]/g, "").toUpperCase();
    let query = supabaseAdmin
      .from("citations")
      .select("id, status, plate_number");

    if (currentCitationNumber) {
      query = query.neq("citation_number", currentCitationNumber).neq("id", currentCitationNumber);
    }

    const { data: allCitations } = await query;

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
    console.warn("[clearVehicleLtoAlarms]", err);
  }
}

// Shared helper to dispatch citation notice email to registered motorist
async function dispatchCitizenNoticeEmail(
  plateNumber: string,
  citationNumber: string,
  offense: string,
  amount: number,
  issuedAt: string
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const motorist = await findCitizenMotoristForPlate(plateNumber);
    const recipientEmail = motorist?.email || `motorist.${plateNumber.replace(/[\s-]/g, "").toLowerCase()}@motorist.qc.gov.ph`;
    const recipientName = motorist?.fullName || "Registered Motorist";

    const emailSubject = `QC LGU & MMDA NCAP: Official Notice of Violation (${citationNumber})`;
    await supabaseAdmin.from("email_logs").insert({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      citation_number: citationNumber,
      subject: emailSubject,
      template_name: "Citation Notice",
      status: "delivered",
      sent_at: issuedAt,
    });

    await supabaseAdmin.from("audit_logs").insert({
      actor_name: "QC Automated Communications Gateway",
      actor_role: "system",
      action: "AUTO_CITATION_NOTICE_DISPATCHED",
      target_resource: `Citation: ${citationNumber} (Plate: ${plateNumber})`,
      details: `Automated Notice of Violation email logged for ${recipientName} (${recipientEmail}) · Offense: ${offense} · Fine: ₱${Number(amount).toLocaleString()}`,
    });
  } catch (err) {
    console.warn("[dispatchCitizenNoticeEmail]", err);
  }
}

// Shared helper to dispatch payment receipt & LTO clearance email to registered motorist
async function dispatchPaymentReceiptNotice(
  plateNumber: string,
  citationNumber: string,
  options?: {
    payerName?: string;
    payerEmail?: string;
    amount?: number;
    receiptNumber?: string;
    clearanceNumber?: string;
    method?: string;
  }
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const motorist = await findCitizenMotoristForPlate(plateNumber);
    const recipientEmail = options?.payerEmail || motorist?.email || `motorist.${citationNumber.toLowerCase().replace(/[^a-z0-9]/g, "")}@motorist.qc.gov.ph`;
    const recipientName = options?.payerName || motorist?.fullName || "Verified Motorist";
    const receiptNo = options?.receiptNumber || `OR-2026-${citationNumber.replace(/[^0-9]/g, "").slice(-6) || "882101"}`;
    const clearanceNo = options?.clearanceNumber || `QC-CLR-2026-${citationNumber.replace(/[^0-9]/g, "").slice(-6) || "882101"}`;

    const { sendRealSettlementEmail } = await import("@/lib/email.service.server");
    const emailResult = await sendRealSettlementEmail({
      citationNumber,
      plateNumber,
      receiptNumber: receiptNo,
      clearanceNumber: clearanceNo,
      amount: options?.amount || 2000,
      recipientEmail,
      recipientName,
      paymentMethod: options?.method,
    });

    await supabaseAdmin.from("email_logs").insert({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      citation_number: citationNumber,
      subject: emailResult.subject,
      template_name: "Payment Receipt",
      status: "delivered",
      sent_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("audit_logs").insert({
      actor_name: "QC Treasury / Settlement Gateway",
      actor_role: "finance",
      action: "AUTO_PAYMENT_CLEARANCE_DISPATCHED",
      target_resource: `Citation: ${citationNumber} (Plate: ${plateNumber})`,
      details: `Official Electronic Receipt and LTO Clearance confirmation dispatched to ${recipientName} (${recipientEmail})${options?.receiptNumber ? ` · Ref: ${options.receiptNumber}` : ""} · Engine: ${emailResult.provider}`,
    });
  } catch (err) {
    console.warn("[dispatchPaymentReceiptNotice]", err);
  }
}

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

      // 3. Automated Citizen Motorist Email Notice Dispatch
      await dispatchCitizenNoticeEmail(plate, citation_number, data.offense, data.amount, issued_at);
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
    let updateQ = supabaseAdmin
      .from("citations")
      .update({ status: data.status });
    updateQ = applyCitationIdentifierFilter(updateQ, data.citationNumber);
    const { error } = await updateQ;

    if (error) {
      console.error("[Supabase Error: Update Citation Status]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    // If citation is marked paid or settled, ensure payment record exists, clear LTO alarms, and dispatch clearance receipt!
    if (data.status === "paid" || data.status === "settled" || data.status === "waived") {
      try {
        let citQ = supabaseAdmin
          .from("citations")
          .select("id, citation_number, plate_number, offense, amount");
        citQ = applyCitationIdentifierFilter(citQ, data.citationNumber);
        const { data: citRow } = await citQ.maybeSingle();

        if (citRow?.plate_number) {
          const citNum = citRow.citation_number || data.citationNumber;

          // Check if payment row exists
          const { data: existingPay } = await supabaseAdmin
            .from("payments")
            .select("id")
            .or(`citation_id.eq.${citNum},citation_id.eq.${data.citationNumber}`)
            .maybeSingle();

          if (!existingPay) {
            const cleanCitNum = citNum.replace(/[^0-9]/g, "");
            const refSuffix = cleanCitNum ? cleanCitNum.slice(-6) : Math.floor(100000 + Math.random() * 900000);
            await supabaseAdmin.from("payments").insert({
              citation_id: citNum,
              plate_number: citRow.plate_number,
              payer_name: "Registered Motorist",
              amount: Number(citRow.amount || 2000),
              method: "over-the-counter",
              reference_number: `OR-2026-${refSuffix}`,
              status: "verified",
              submitted_date: new Date().toISOString(),
            });
          }

          await clearVehicleLtoAlarms(citRow.plate_number, citNum);
          await dispatchPaymentReceiptNotice(citRow.plate_number, citNum, {
            amount: Number(citRow.amount || 0),
          });
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

const dispatchSupportSchema = z.object({
  dispatchId: z.string(),
  supportType: z.enum(["wrecker", "medic", "fire", "police_backup"]),
  action: z.enum(["request", "cancel", "arrived"]).default("request"),
  notes: z.string().optional(),
});

export const serverRequestDispatchSupport = createServerFn({ method: "POST" })
  .validator((data: unknown) => dispatchSupportSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();

    const { data: dispatch, error: fetchErr } = await supabaseAdmin
      .from("dispatches")
      .select("id, instructions, reference, location, officer_name")
      .eq("id", data.dispatchId)
      .maybeSingle();

    if (fetchErr || !dispatch) {
      throw new Error("Dispatch not found");
    }

    const supportLabels: Record<string, string> = {
      wrecker: "MMDA Heavy Wrecker Tow Truck",
      medic: "QC DRRMC 911 Emergency Ambulance",
      fire: "BFP Bureau of Fire Rescue",
      police_backup: "QCPD Station Tactical Backup",
    };
    const label = supportLabels[data.supportType] || data.supportType;

    const instructions = dispatch.instructions || "";
    const tagPrefix = `[SUPPORT:${data.supportType}:`;

    // Strip previous tag for this supportType
    const lines = instructions.split("\n").filter((line) => !line.trim().startsWith(tagPrefix));

    if (data.action === "request") {
      const eta = data.supportType === "medic" ? "6m" : data.supportType === "wrecker" ? "10m" : "8m";
      lines.push(`${tagPrefix}inbound:${eta}:${label}]`);
    } else if (data.action === "arrived") {
      lines.push(`${tagPrefix}on_scene:0m:${label}]`);
    } // if cancel, it's removed

    const updatedInstructions = lines.join("\n").trim();

    const { error: updErr } = await supabaseAdmin
      .from("dispatches")
      .update({
        instructions: updatedInstructions,
        updated_at: now,
      })
      .eq("id", data.dispatchId);

    if (updErr) {
      throw new Error(`Database Error: ${updErr.message}`);
    }

    // Audit log
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: dispatch.officer_name || "Central Dispatch Console",
        actor_role: "dispatcher",
        action: `SUPPORT_UNIT_${data.action.toUpperCase()}`,
        target_resource: `Dispatch: ${dispatch.reference} (${dispatch.location})`,
        details: `${label} - Action: ${data.action.toUpperCase()}${data.notes ? ` · Notes: ${data.notes}` : ""}`,
      });
    } catch (auditErr) {
      console.warn(auditErr);
    }

    return {
      success: true,
      supportType: data.supportType,
      action: data.action,
      label,
      updatedInstructions,
    };
  });

// -------------------------------------------------------------
// 6. ONLINE PAYMENT SETTLEMENT
// -------------------------------------------------------------
const paymentCheckoutSchema = z
  .object({
    citationNumber: z.string().trim().min(4),
    plateNumber: z.string().trim().min(3),
    amount: z.number().positive(),
    paymentMethod: z.enum(["gcash", "maya", "landbank", "card", "otc"]),
    payerEmail: z.string().email(),
    payerName: z.string().min(2),
    referenceNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "gcash") {
        return !!data.referenceNumber && data.referenceNumber.trim().length >= 4;
      }
      return true;
    },
    {
      message: "GCash Reference Number is required before proceeding with settlement.",
      path: ["referenceNumber"],
    }
  );

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

    const receiptNumber = data.referenceNumber?.trim() || `OR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const paidAt = new Date().toISOString();

    const isManualGateway = data.paymentMethod === "gcash" || data.paymentMethod === "maya";
    const paymentStatus = isManualGateway ? "pending_verification" : "verified";

    const { error: insertErr } = await supabaseAdmin
      .from("payments")
      .insert({
        citation_id: data.citationNumber,
        plate_number: data.plateNumber,
        payer_name: data.payerName,
        amount: data.amount,
        method: data.paymentMethod,
        reference_number: receiptNumber,
        status: paymentStatus,
        submitted_date: paidAt,
      });

    if (insertErr) {
      console.warn("[Supabase Warning: Payment Insert (Check RLS)]", insertErr.message);
      // We log warning but don't strictly fail the user if the payment log fails for some reason
    }

    const citationTargetStatus = isManualGateway ? "payment_pending" : "paid";

    let updateCitQ = supabaseAdmin
      .from("citations")
      .update({ status: citationTargetStatus });
    updateCitQ = applyCitationIdentifierFilter(updateCitQ, data.citationNumber);
    const { error } = await updateCitQ;

    if (error) {
      console.error("[Supabase Error: Payment Checkout]", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: data.payerName,
        actor_role: "citizen",
        action: isManualGateway ? "PAYMENT_SUBMITTED_FOR_VERIFICATION" : "CITATION_ONLINE_SETTLED",
        target_resource: `Citation: ${data.citationNumber} (Plate: ${data.plateNumber})`,
        details: `Amount: PHP ${data.amount}, Method: ${data.paymentMethod.toUpperCase()}, Ref: ${receiptNumber}${isManualGateway ? " (Awaiting Treasury Reconciliation)" : " (Auto Verified)"}`,
      });

      // Automatically log payment notification in communications
      try {
        await supabaseAdmin.from("email_logs").insert({
          recipient_email: data.payerEmail || `${data.plateNumber.toLowerCase().replace(/[\s-]/g, "")}@motorist.qc.gov.ph`,
          recipient_name: data.payerName || "Registered Motorist",
          citation_number: data.citationNumber,
          subject: isManualGateway
            ? `Payment Proof Received · Pending Treasury Verification: ${data.citationNumber}`
            : `Official Electronic Receipt & LTO Clearance: ${data.citationNumber}`,
          template_name: isManualGateway ? "Payment Submission Acknowledgement" : "Payment Receipt",
          status: "delivered",
        });
      } catch (logNoticeErr) {
        console.warn("[Payment Checkout] Notification log notice:", logNoticeErr);
      }

      // Clear vehicle LTO alarms ONLY if payment is verified (automated gateway) and no unpaid citations remain
      if (!isManualGateway) {
        const compact = data.plateNumber.replace(/[\s-]/g, "").toUpperCase();
        const { data: allCitations } = await supabaseAdmin
          .from("citations")
          .select("id, status, plate_number")
          .neq("citation_number", data.citationNumber);

        const remainingUnpaid = (allCitations || []).filter(
          (c: any) =>
            c.plate_number.replace(/[\s-]/g, "").toUpperCase() === compact &&
            (c.status === "unpaid" || c.status === "overdue" || c.status === "pending" || c.status === "payment_pending" || c.status === "payment_failed")
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

const recordFailedPaymentSchema = z.object({
  citationNumber: z.string().trim().min(1),
  plateNumber: z.string().trim().optional(),
  amount: z.number().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  reason: z.string().optional(),
  payerName: z.string().optional(),
  payerEmail: z.string().optional(),
});

export const serverRecordFailedPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => recordFailedPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const failedAt = new Date().toISOString();
    const failRef = data.referenceNumber?.trim() || `FAIL-${Math.floor(100000 + Math.random() * 900000)}`;
    const reasonText = data.reason?.trim() || "Payment gateway authorization declined or transaction timed out";

    // 1. Insert failed payment record
    try {
      await supabaseAdmin.from("payments").insert({
        citation_id: data.citationNumber,
        plate_number: data.plateNumber || "UNKNOWN",
        payer_name: data.payerName || "Citizen Motorist",
        amount: data.amount || 2000,
        method: data.paymentMethod || "online",
        reference_number: failRef,
        status: "failed",
        submitted_date: failedAt,
      });
    } catch (e: any) {
      console.warn("[Failed Payment Log Warning]", e?.message);
    }

    // 2. Update citation status to 'payment_failed'
    try {
      let updateCitQ = supabaseAdmin
        .from("citations")
        .update({ status: "payment_failed", updated_at: failedAt } as any);
      updateCitQ = applyCitationIdentifierFilter(updateCitQ, data.citationNumber);
      await updateCitQ;
    } catch (e: any) {
      console.warn("[Citation Update Failed Status Warning]", e?.message);
    }

    // 3. Log audit trail
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: data.payerName || "Citizen Motorist",
        actor_role: "citizen",
        action: "PAYMENT_NOT_PUSHED_THROUGH",
        target_resource: `Citation: ${data.citationNumber} (Plate: ${data.plateNumber || "N/A"})`,
        details: `Reason: ${reasonText}. Reference: ${failRef}`,
      });
    } catch (e: any) {
      console.warn("[Audit Log Warning]", e?.message);
    }

    return { success: true, reference: failRef, reason: reasonText };
  });

// -------------------------------------------------------------
// 6B. SETTLEMENT NOTICE DISPATCH (SMS & EMAIL)
// -------------------------------------------------------------
const dispatchSettlementNoticeSchema = z.object({
  citationNumber: z.string().trim().min(3),
  plateNumber: z.string().trim().min(2),
  receiptNumber: z.string().trim().min(3),
  clearanceNumber: z.string().optional(),
  recipientName: z.string().optional(),
  amount: z.number().positive(),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  recipientPhone: z.string().trim().optional().or(z.literal("")),
  paymentMethod: z.string().optional(),
  originUrl: z.string().optional(),
  sendEmail: z.boolean().default(true),
  sendSms: z.boolean().default(true),
});

export const serverDispatchSettlementNotice = createServerFn({ method: "POST" })
  .validator((data: unknown) => dispatchSettlementNoticeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const dispatchedChannels: string[] = [];
    const dispatchId = `DSP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    let emailDispatchInfo: {
      provider: string;
      delivered: boolean;
      messageId?: string;
      subject: string;
      html: string;
    } | null = null;
    let emlContent: string | null = null;

    // 1. Dispatch Real Email Notice
    if (data.sendEmail && data.recipientEmail && data.recipientEmail.includes("@")) {
      try {
        const motorist = await findCitizenMotoristForPlate(data.plateNumber);
        const recipientName = data.recipientName || motorist?.fullName || "Verified Motorist";

        const { sendRealSettlementEmail, generateEmlMessage } = await import("@/lib/email.service.server");
        const emailResult = await sendRealSettlementEmail({
          citationNumber: data.citationNumber,
          plateNumber: data.plateNumber,
          receiptNumber: data.receiptNumber,
          clearanceNumber: data.clearanceNumber,
          amount: data.amount,
          recipientEmail: data.recipientEmail.trim().toLowerCase(),
          recipientName,
          recipientPhone: data.recipientPhone,
          paymentMethod: data.paymentMethod,
          originUrl: data.originUrl,
        });

        emlContent = generateEmlMessage(
          {
            citationNumber: data.citationNumber,
            plateNumber: data.plateNumber,
            receiptNumber: data.receiptNumber,
            clearanceNumber: data.clearanceNumber,
            amount: data.amount,
            recipientEmail: data.recipientEmail.trim().toLowerCase(),
            recipientName,
            paymentMethod: data.paymentMethod,
          },
          emailResult.html
        );

        emailDispatchInfo = {
          provider: emailResult.provider,
          delivered: emailResult.delivered,
          messageId: emailResult.messageId,
          subject: emailResult.subject,
          html: emailResult.html,
        };

        await supabaseAdmin.from("email_logs").insert({
          recipient_email: data.recipientEmail.trim().toLowerCase(),
          recipient_name: recipientName,
          citation_number: data.citationNumber,
          subject: emailResult.subject,
          template_name: "Payment Receipt",
          status: "delivered",
        });

        const providerLabel =
          emailResult.provider === "resend"
            ? "Resend API"
            : emailResult.provider === "smtp"
              ? "SMTP Gateway"
              : "Direct Delivery Gateway";

        dispatchedChannels.push(`Email (${providerLabel} -> ${data.recipientEmail.trim()})`);
      } catch (err: any) {
        console.warn("[Settlement Dispatch] Email log error:", err?.message || err);
      }
    }

    const smsMessage = `QC DPOS & MMDA NCAP Clearance: Official Receipt ${data.receiptNumber} issued for ${data.plateNumber.toUpperCase()} (NOV: ${data.citationNumber}). Fine of PHP ${data.amount.toLocaleString()} SETTLED. LTO LTMS Registration Hold has been LIFTED. Clearance ref: ${data.clearanceNumber || "QC-CLR-2026"}.`;

    // 2. Dispatch SMS Notice (Tracked in audit_logs)
    if (data.sendSms && data.recipientPhone && data.recipientPhone.length >= 7) {
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_name: "QC LGU Automated Notification Gateway",
          actor_role: "system",
          action: "SMS_SETTLEMENT_NOTICE_DISPATCHED",
          target_resource: `Mobile: ${data.recipientPhone} (Citation: ${data.citationNumber})`,
          details: `Dispatch Ref: ${dispatchId} · Plate: ${data.plateNumber} · OR: ${data.receiptNumber} · Amount: PHP ${data.amount} · SMS Status: DELIVERED`,
        });
        dispatchedChannels.push(`SMS (${data.recipientPhone.trim()})`);
      } catch (err: any) {
        console.warn("[Settlement Dispatch] SMS log error:", err?.message || err);
      }
    }

    // 3. General Audit Log
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: "Citizen Dispatch Terminal",
        actor_role: "citizen",
        action: "SETTLEMENT_NOTICE_DISPATCH_REQUESTED",
        target_resource: `Citation: ${data.citationNumber} (Plate: ${data.plateNumber})`,
        details: `Dispatched channels: ${dispatchedChannels.join(", ") || "Standard Portal Archive"} · OR: ${data.receiptNumber}`,
      });
    } catch (auditErr) {
      console.warn("[Settlement Dispatch] Audit error:", auditErr);
    }

    return {
      success: true,
      dispatchId,
      dispatchedAt: nowIso,
      dispatchedChannels,
      emailInfo: emailDispatchInfo,
      emlContent,
      smsText: smsMessage,
      message: `Official e-Receipt and LTO Clearance dispatched successfully via ${dispatchedChannels.join(" & ") || "Digital Portal"}.`,
    };
  });

// Note: clearVehicleLtoAlarms is hoisted above for global availability

// -------------------------------------------------------------
// 6B. STRIPE & GCASH CHECKOUT GATEWAY
// -------------------------------------------------------------
const stripeCheckoutSessionSchema = z.object({
  citationNumber: z.string().trim().min(4),
  plateNumber: z.string().trim().min(3),
  amount: z.number().positive(),
  paymentMethod: z.enum(["gcash", "card", "all"]).default("gcash"),
  payerEmail: z.string().email(),
  payerName: z.string().min(2),
  originUrl: z.string().optional(),
});

export const serverCreateStripeCheckoutSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => stripeCheckoutSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    const isConfigured = !!stripeKey && !stripeKey.startsWith("sk_test_placeholder") && stripeKey.length > 10;

    const origin = (data.originUrl || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

    if (!isConfigured) {
      console.log("[Stripe Checkout] STRIPE_SECRET_KEY is not configured in .env. Running in Simulated Test Mode.");
      const simSessionId = `sim_stripe_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        url: null,
        sessionId: simSessionId,
        simulated: true,
        redirectUrl: `${origin}/portal/receipt/${encodeURIComponent(data.citationNumber)}?session_id=${simSessionId}&provider=stripe_simulated&method=${data.paymentMethod}`,
      };
    }

    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);

      // In Stripe Philippines accounts, GCash is enabled for PHP currency transactions.
      let paymentMethodTypes: ("card" | "gcash")[] = ["card"];
      if (data.paymentMethod === "gcash") {
        paymentMethodTypes = ["gcash", "card"];
      } else if (data.paymentMethod === "card") {
        paymentMethodTypes = ["card"];
      } else {
        paymentMethodTypes = ["gcash", "card"];
      }

      let session;
      try {
        session = await stripe.checkout.sessions.create({
          payment_method_types: paymentMethodTypes,
          line_items: [
            {
              price_data: {
                currency: "php",
                product_data: {
                  name: `Notice of Violation: ${data.citationNumber}`,
                  description: `Quezon City Traffic Settlement · Plate ${data.plateNumber} · QC DPOS`,
                },
                unit_amount: Math.round(data.amount * 100), // in centavos
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          customer_email: data.payerEmail,
          client_reference_id: data.citationNumber,
          metadata: {
            citationNumber: data.citationNumber,
            plateNumber: data.plateNumber,
            payerName: data.payerName,
            paymentMethod: data.paymentMethod,
          },
          success_url: `${origin}/portal/receipt/${encodeURIComponent(data.citationNumber)}?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
          cancel_url: `${origin}/portal/pay/${encodeURIComponent(data.citationNumber)}?canceled=true`,
        });
      } catch (pmError: any) {
        // If Stripe account doesn't support 'gcash' (e.g. non-PH Stripe account), fallback to universal checkout
        if (pmError?.message && (pmError.message.includes("gcash") || pmError.message.includes("payment_method_types"))) {
          console.warn("[Stripe Warning] 'gcash' is not enabled on this Stripe account country. Falling back to universal methods.", pmError.message);
          session = await stripe.checkout.sessions.create({
            line_items: [
              {
                price_data: {
                  currency: "php",
                  product_data: {
                    name: `Notice of Violation: ${data.citationNumber}`,
                    description: `Quezon City Traffic Settlement · Plate ${data.plateNumber} · QC DPOS`,
                  },
                  unit_amount: Math.round(data.amount * 100),
                },
                quantity: 1,
              },
            ],
            mode: "payment",
            customer_email: data.payerEmail,
            client_reference_id: data.citationNumber,
            metadata: {
              citationNumber: data.citationNumber,
              plateNumber: data.plateNumber,
              payerName: data.payerName,
              paymentMethod: data.paymentMethod,
            },
            success_url: `${origin}/portal/receipt/${encodeURIComponent(data.citationNumber)}?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
            cancel_url: `${origin}/portal/pay/${encodeURIComponent(data.citationNumber)}?canceled=true`,
          });
        } else {
          throw pmError;
        }
      }

      return {
        url: session.url,
        sessionId: session.id,
        simulated: false,
        redirectUrl: session.url,
      };
    } catch (err: any) {
      console.error("[Stripe Session Creation Error]", err);
      throw new Error(`Stripe Error: ${err?.message || "Failed to initialize payment gateway."}`);
    }
  });

const stripeVerifySessionSchema = z.object({
  sessionId: z.string().trim().min(5),
  citationNumber: z.string().trim().min(4),
});

export const serverVerifyStripeSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => stripeVerifySessionSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Simulation Check
    if (data.sessionId.startsWith("sim_stripe_")) {
      const receiptNumber = `OR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const paidAt = new Date().toISOString();

      let citSelQ = supabaseAdmin
        .from("citations")
        .select("*");
      citSelQ = applyCitationIdentifierFilter(citSelQ, data.citationNumber);
      const { data: cit } = await citSelQ.maybeSingle();

      const plateNumber = cit?.plate_number || "QC-PLATE";
      const amount = cit?.amount || 2000;

      let citUpdQ = supabaseAdmin
        .from("citations")
        .update({ status: "paid" });
      citUpdQ = applyCitationIdentifierFilter(citUpdQ, data.citationNumber);
      await citUpdQ;

      const { error: insErr } = await supabaseAdmin.from("payments").insert({
        citation_id: data.citationNumber,
        plate_number: plateNumber,
        payer_name: "Verified Motorist (Stripe Test Simulator)",
        amount,
        method: "gcash",
        reference_number: receiptNumber,
        status: "verified",
        submitted_date: paidAt,
      });

      if (insErr) {
        console.warn("[Stripe Verify Payment Insert Warn]", insErr.message);
      }

      await clearVehicleLtoAlarms(plateNumber, data.citationNumber);
      await dispatchPaymentReceiptNotice(plateNumber, data.citationNumber, {
        payerName: "Verified Motorist (Stripe Test Simulator)",
        amount,
        receiptNumber,
        method: "GCash (Stripe Test Mode)",
      });

      return {
        verified: true,
        simulated: true,
        receiptNumber,
        paymentMethod: "GCash (Stripe Test Mode)",
        amount,
        paidAt,
        plateNumber,
        citationNumber: data.citationNumber,
      };
    }

    // 2. Real Stripe API Verification
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey) {
      throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return {
        verified: false,
        status: session.payment_status,
        message: "Payment is pending or has not been confirmed by Stripe.",
      };
    }

    const receiptNumber = `OR-STRIPE-${session.id.slice(-8).toUpperCase()}`;
    const paidAt = new Date().toISOString();
    const citNumber = session.client_reference_id || session.metadata?.citationNumber || data.citationNumber;
    const plateNumber = session.metadata?.plateNumber || "QC-MOTORIST";
    const amount = (session.amount_total || 0) / 100;
    const rawMethod = session.payment_method_types?.[0] || "gcash";
    const paymentMethod = rawMethod === "gcash" ? "GCash (via Stripe)" : `${rawMethod.toUpperCase()} (via Stripe)`;
    const payerName = session.metadata?.payerName || session.customer_details?.name || "Verified Motorist";

    let stripeUpdQ = supabaseAdmin
      .from("citations")
      .update({ status: "paid" });
    stripeUpdQ = applyCitationIdentifierFilter(stripeUpdQ, citNumber);
    await stripeUpdQ;

    const { data: existingPay } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("reference_number", receiptNumber)
      .maybeSingle();

    if (!existingPay) {
      const { error: insErr } = await supabaseAdmin.from("payments").insert({
        citation_id: citNumber,
        plate_number: plateNumber,
        payer_name: payerName,
        amount,
        method: rawMethod,
        reference_number: receiptNumber,
        status: "verified",
        submitted_date: paidAt,
      });

      if (insErr) {
        console.warn("[Stripe Verify Payment Insert Warn]", insErr.message);
      }

      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_name: payerName,
          actor_role: "citizen",
          action: "STRIPE_PAYMENT_VERIFIED",
          target_resource: `Citation: ${citNumber} (Session: ${session.id})`,
          details: `Amount: PHP ${amount}, Channel: ${paymentMethod}, Intent: ${typeof session.payment_intent === "object" ? session.payment_intent?.id : session.payment_intent || "N/A"}`,
        });
      } catch (logErr) {
        console.warn(logErr);
      }
    }

    await clearVehicleLtoAlarms(plateNumber, citNumber);
    await dispatchPaymentReceiptNotice(plateNumber, citNumber, {
      payerName,
      payerEmail: session.customer_email || undefined,
      amount,
      receiptNumber,
      method: paymentMethod,
    });

    return {
      verified: true,
      simulated: false,
      receiptNumber,
      paymentMethod,
      amount,
      paidAt,
      plateNumber,
      citationNumber: citNumber,
      stripePaymentIntentId: typeof session.payment_intent === "object" ? session.payment_intent?.id : session.payment_intent,
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
      const [allVehiclesRes, cvListRes, profListRes] = await Promise.all([
        supabaseAdmin.from("vehicles").select("*"),
        supabaseAdmin.from("citizen_vehicles").select("*"),
        supabaseAdmin.from("citizen_profiles").select("*"),
      ]);

      const allVehicles = allVehiclesRes.data || [];
      const cvList = cvListRes.data || [];
      const profList = profListRes.data || [];

      const dbVehicle = (allVehicles || []).find(
        (v: any) => v.plate_number.replace(/[\s-]/g, "").toUpperCase() === compactPlate
      );
      const cvMatch = (cvList || []).find(
        (v: any) => (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate
      );

      const matchingProfile = cvMatch?.citizen_id
        ? (profList || []).find((p: any) => p.id === cvMatch.citizen_id)
        : null;

      const citizenOwner = matchingProfile?.full_name;

      if (dbVehicle || cvMatch) {
        // Count unpaid citations
        const { data: allCitations } = await supabaseAdmin.from("citations").select("id, status, plate_number");
        const unpaid = (allCitations || []).filter(
          (c: any) =>
            c.plate_number.replace(/[\s-]/g, "").toUpperCase() === compactPlate &&
            (c.status === "unpaid" || c.status === "overdue" || c.status === "pending")
        );

        const citationsCount = unpaid.length;
        const plateNumber = dbVehicle?.plate_number || cvMatch?.plate_number || cleanPlate;
        const makeModel = dbVehicle?.make_model || cvMatch?.make_model || "Registered Vehicle";
        const owner = citizenOwner || dbVehicle?.registered_owner || "Verified Resident (QC Registry)";
        const ltoAlarm = !!dbVehicle?.lto_alarm_tagged || cvMatch?.lto_alarm_status === "LTO_ALARM_ACTIVE" || citationsCount > 0;

        return {
          plateNumber,
          makeModel,
          year: 2024,
          color: dbVehicle?.color || "Silver",
          chassisNumber: dbVehicle?.chassis_number || `CHS-${compactPlate}-QC`,
          engineNumber: `ENG-${compactPlate}-QC`,
          registrationStatus: (dbVehicle?.registration_status || "CURRENT") as any,
          ltoAlarmTagged: ltoAlarm,
          unsettledCitationsCount: citationsCount,
          registeredOwner: owner,
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
      const [paymentsReq, refundsReq, citationsReq] = await Promise.all([
        supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("refunds").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("citations").select("id, citation_number, offense, amount, plate_number, vehicle_model, officer_name, issued_at, status"),
      ]);

      const citMap = new Map<string, any>();
      (citationsReq.data || []).forEach((c: any) => {
        if (c.citation_number) citMap.set(c.citation_number, c);
        if (c.id) citMap.set(c.id, c);
      });

      const existingPayCitIds = new Set<string>();
      (paymentsReq.data || []).forEach((p: any) => {
        if (p.citation_id) existingPayCitIds.add(p.citation_id);
      });

      const enrichedPayments = (paymentsReq.data || []).map((p: any) => {
        const cit = citMap.get(p.citation_id) || {};
        return {
          ...p,
          offense: cit.offense || null,
          vehicle_model: cit.vehicle_model || null,
          officer_name: cit.officer_name || null,
          citation_issued_at: cit.issued_at || null,
          citation_status: cit.status || null,
        };
      });

      // Synthesize verified payment entries for citations marked 'paid' or 'settled' that don't have a payment record
      (citationsReq.data || []).forEach((c: any) => {
        const isPaidStatus = c.status === "paid" || c.status === "settled";
        if (isPaidStatus && !existingPayCitIds.has(c.citation_number) && !existingPayCitIds.has(c.id)) {
          const citNum = c.citation_number || c.id;
          const cleanCitNum = citNum.replace(/[^0-9]/g, "");
          const refSuffix = cleanCitNum ? cleanCitNum.slice(-6) : Math.floor(100000 + Math.random() * 900000);
          enrichedPayments.push({
            id: `pay-cit-${c.id || citNum}`,
            citation_id: citNum,
            plate_number: c.plate_number || "QC-PLATE",
            payer_name: "Registered Motorist",
            amount: Number(c.amount || 2000),
            method: "over-the-counter",
            reference_number: `OR-2026-${refSuffix}`,
            proof_url: null,
            status: "verified",
            submitted_date: c.issued_at || new Date().toISOString(),
            created_at: c.issued_at || new Date().toISOString(),
            offense: c.offense || null,
            vehicle_model: c.vehicle_model || null,
            officer_name: c.officer_name || null,
            citation_issued_at: c.issued_at || null,
            citation_status: c.status || "paid",
          });
        }
      });

      // Sort all payments by timestamp descending (newest first)
      enrichedPayments.sort((a: any, b: any) => {
        const timeA = new Date(a.submitted_date || a.created_at || 0).getTime();
        const timeB = new Date(b.submitted_date || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      return {
        pendingPayments: enrichedPayments,
        pendingRefunds: refundsReq.data || [],
      };
    } catch (err) {
      console.error("[Supabase Error: Fetch Finance Queue]", err);
      return { pendingPayments: [], pendingRefunds: [] };
    }
  });

const verifyPaymentSchema = z.object({
  paymentId: z.string(),
  citationId: z.string(),
  referenceNumber: z.string().trim().min(3, "GCash Reference Number is required for verification"),
  cashierNotes: z.string().optional(),
});

export const serverVerifyPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => verifyPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Update Payment status and verified reference number
    const updatePayload: any = {
      status: "verified",
      reference_number: data.referenceNumber.trim(),
    };
    const { error: payErr } = await supabaseAdmin
      .from("payments")
      .update(updatePayload)
      .eq("id", data.paymentId);
    if (payErr) throw new Error(`Database Error: ${payErr.message}`);

    // 2. Update Citation status to paid
    let verifyUpdQ = supabaseAdmin
      .from("citations")
      .update({ status: "paid" });
    verifyUpdQ = applyCitationIdentifierFilter(verifyUpdQ, data.citationId);
    await verifyUpdQ;

    // 3. Clear vehicle LTO alarms if no unpaid citations remain
    let resolvedPlate = "";
    try {
      let citQuery = supabaseAdmin.from("citations").select("plate_number");
      citQuery = applyCitationIdentifierFilter(citQuery, data.citationId);
      const { data: citRow } = await citQuery.maybeSingle();

      if (citRow?.plate_number) {
        resolvedPlate = citRow.plate_number;
        await clearVehicleLtoAlarms(resolvedPlate, data.citationId);
      }
    } catch (clearErr) {
      console.warn("[Finance] Error checking remaining citations for vehicle clearance:", clearErr);
    }

    // 4. Immutable Audit Trail & Notification Dispatch
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: "QC Treasury Cashier",
        actor_role: "finance",
        action: "PAYMENT_VERIFIED_AND_SETTLED",
        target_resource: `Citation: ${data.citationId}`,
        details: `Verified GCash Ref: ${data.referenceNumber}${data.cashierNotes ? ` · Notes: ${data.cashierNotes}` : ""}`,
      });

      // Dispatch settlement confirmation email log to communications hub
      await dispatchPaymentReceiptNotice(resolvedPlate || data.citationId, data.citationId, {
        receiptNumber: data.referenceNumber,
      });
    } catch (auditErr) {
      console.warn(auditErr);
    }

    return { success: true };
  });

const declinePaymentSchema = z.object({
  paymentId: z.string(),
  citationId: z.string(),
  reason: z.string().trim().min(3, "Decline reason is required"),
  cashierNotes: z.string().optional(),
});

export const serverDeclinePayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => declinePaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const failedAt = new Date().toISOString();
    const reasonText = data.reason.trim();

    // 1. Update Payment status to 'rejected' and save failure reason/notes
    try {
      const updatePayload: any = {
        status: "rejected",
        failure_reason: reasonText,
      };
      if (data.cashierNotes) {
        updatePayload.notes = data.cashierNotes.trim();
      }
      const { error: payErr } = await supabaseAdmin
        .from("payments")
        .update(updatePayload)
        .eq("id", data.paymentId);

      if (payErr) {
        console.warn("[Finance] Retrying payment update with status only:", payErr.message);
        await supabaseAdmin
          .from("payments")
          .update({ status: "rejected" })
          .eq("id", data.paymentId);
      }
    } catch (payEx: any) {
      console.warn("[Finance] Error updating payment record on decline:", payEx?.message);
    }

    // 2. Update Citation status to 'payment_failed'
    try {
      let declineUpdQ = supabaseAdmin
        .from("citations")
        .update({
          status: "payment_failed",
          updated_at: failedAt,
        } as any);
      declineUpdQ = applyCitationIdentifierFilter(declineUpdQ, data.citationId);
      await declineUpdQ;
    } catch (citEx: any) {
      console.warn("[Finance] Error updating citation status to payment_failed:", citEx?.message);
    }

    // 3. Immutable Audit Trail & Notification Dispatch
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: "QC Treasury Cashier",
        actor_role: "finance",
        action: "PAYMENT_DECLINED_BY_TREASURY",
        target_resource: `Citation: ${data.citationId}`,
        details: `Decline Reason: ${reasonText}${data.cashierNotes ? ` · Notes: ${data.cashierNotes.trim()}` : ""}`,
      });

      // Dispatch settlement declined email log
      try {
        let recipientEmail = `motorist.${data.citationId.toLowerCase().replace(/[^a-z0-9]/g, "")}@motorist.qc.gov.ph`;
        let recipientName = "Citizen Motorist";

        let citQ = supabaseAdmin.from("citations").select("plate_number");
        citQ = applyCitationIdentifierFilter(citQ, data.citationId);
        const { data: citRow } = await citQ.maybeSingle();

        if (citRow?.plate_number) {
          const motorist = await findCitizenMotoristForPlate(citRow.plate_number);
          if (motorist) {
            recipientEmail = motorist.email;
            recipientName = motorist.fullName;
          }
        }

        await supabaseAdmin.from("email_logs").insert({
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          citation_number: data.citationId,
          subject: `Action Required: Payment Incomplete / Declined Notice: ${data.citationId}`,
          template_name: "Payment Declined",
          status: "delivered",
          sent_at: failedAt,
        });
      } catch (eLogErr) {
        console.warn("[Finance] Error logging declined payment notice:", eLogErr);
      }
    } catch (auditErr) {
      console.warn("[Finance] Audit logging error:", auditErr);
    }

    return { success: true, citationId: data.citationId, reason: reasonText };
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

      // If no profile found in DB, return null (do not auto-create on read query)
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
      if (vehicles.length === 0 && profile.id === "a0000000-0000-0000-0000-000000000001") {
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

      // Fetch all payment records to cross-reference payment verification and failures
      const citNumbers = (cmdCitations || []).map((c: any) => c.citation_number).filter(Boolean);
      const citIds = (cmdCitations || []).map((c: any) => c.id).filter(Boolean);
      const allCitIdentifiers = new Set([...citNumbers, ...citIds]);

      const { data: payRows } = await supabaseAdmin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      // STRICT citation payment matching: payments must strictly correspond to the citation identifier
      const matchedPayments = (payRows || []).filter((p: any) => {
        return allCitIdentifiers.has(p.citation_id);
      });

      // Update vehicle ltoAlarmStatus dynamically based on real citation state
      vehicles = vehicles.map((v: any) => {
        const vCompact = v.plateNumber.replace(/[\s-]/g, "").toUpperCase();
        const hasUnpaid = cmdCitations.some((c: any) => {
          const cCompact = (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
          if (cCompact !== vCompact) return false;
          const citPayment = matchedPayments.find(
            (p: any) => p.citation_id === c.citation_number || p.citation_id === c.id
          );
          const payStatus = citPayment?.status;
          // If payment was rejected or failed, or citation marked payment_failed/unpaid/overdue, it is definitely unpaid
          if (payStatus === "rejected" || payStatus === "failed" || c.status === "payment_failed") {
            return true;
          }
          // If payment is pending verification, fine is not yet cleared
          if (payStatus === "pending_verification" || c.status === "payment_pending") {
            return true;
          }
          const isCitPaid = payStatus === "verified" || ((c.status === "paid" || c.status === "settled") && payStatus !== "rejected" && payStatus !== "pending_verification");
          return !isCitPaid && c.status !== "appealed" && c.status !== "dismissed";
        });
        return {
          ...v,
          ltoAlarmStatus: hasUnpaid ? ("LTO_ALARM_ACTIVE" as const) : ("CLEARED" as const),
        };
      });

      const { parseEvidenceUrls } = await import("@/lib/storage");

      let citations: any[] = (cmdCitations || []).map((cmd: any) => {
        const cmdNov = cmd.citation_number;
        const cmdId = cmd.id;

        // Match latest payment record strictly for this citation (NEVER fall back to plate matching)
        const payment = matchedPayments.find(
          (p: any) => p.citation_id === cmdNov || p.citation_id === cmdId
        );

        // Strict priority evaluation:
        // 1. REJECTED / DECLINED / FAILED payments ALWAYS result in payment_failed and unpaid fine
        const isFailed =
          payment?.status === "rejected" ||
          payment?.status === "failed" ||
          cmd.status === "payment_failed" ||
          cmd.status === "failed";

        // 2. PENDING VERIFICATION payments (e.g. submitted GCash/Maya waiting for Treasury)
        const isPendingVerification =
          !isFailed &&
          (payment?.status === "pending_verification" || cmd.status === "payment_pending");

        // 3. VERIFIED SETTLED payments
        const isPaid =
          !isFailed &&
          !isPendingVerification &&
          (payment?.status === "verified" || cmd.status === "paid" || cmd.status === "settled");

        let paymentStatus: "verified" | "failed" | "pending_verification" | "none" = "none";
        let citationStatus: "unpaid" | "settled" | "appealed" | "payment_failed" | "payment_pending" = "unpaid";

        if (isFailed) {
          paymentStatus = "failed";
          citationStatus = "payment_failed";
        } else if (isPendingVerification) {
          paymentStatus = "pending_verification";
          citationStatus = "payment_pending";
        } else if (isPaid) {
          paymentStatus = "verified";
          citationStatus = "settled";
        } else if (cmd.status === "appealed" || cmd.status === "contested" || cmd.status === "disputed") {
          citationStatus = "appealed";
        } else {
          citationStatus = "unpaid";
        }

        const rawEvidence = cmd.evidence_url || cmd.violations?.evidence_url;
        const frames = parseEvidenceUrls(rawEvidence);
        const evidenceFrames = frames.map((frameUrl, idx) => ({
          url: frameUrl,
          label: frames.length > 1 ? `Optical Capture Frame #${idx + 1}` : `Optical Sentinel Capture: ${cmd.offense}`,
          timestamp: new Date(cmd.issued_at).toLocaleTimeString(),
        }));

        const receiptNumber = payment?.reference_number || (isPaid ? `OR-2026-${cmd.id.slice(-6).toUpperCase()}` : undefined);
        const clearanceCertNumber = isPaid ? `MMDA-QC-CLR-${cmd.id.slice(-5).toUpperCase()}` : undefined;

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
          status: citationStatus,
          ltoAlarmStatus: isPaid ? ("CLEARED" as const) : ("LTO_ALARM_ACTIVE" as const),
          evidenceFrames,
          clearanceCertNumber,
          paymentDetails: {
            status: paymentStatus,
            referenceNumber: payment?.reference_number,
            method: payment?.method ? payment.method.toUpperCase() : isPaid ? "GCASH (ONLINE)" : undefined,
            paidAt: payment?.submitted_date || (isPaid ? cmd.updated_at || cmd.issued_at : undefined),
            receiptNumber,
            failureReason: isFailed
              ? ((payment as any)?.failure_reason ||
                (payment as any)?.notes ||
                (payment?.status === "rejected"
                  ? "Payment reference was declined by QC Treasury Cashier. Fine remains unpaid."
                  : "Online transaction did not push through (payment gateway declined or timed out)"))
              : undefined,
          },
        };
      });

      const isDefaultDemoAccount = profile.id === "a0000000-0000-0000-0000-000000000001";
      if (citations.length === 0 && isDefaultDemoAccount && (vRows || []).length === 0) {
        const primaryPlate = vehicles[0]?.plateNumber || "NDB 8921";
        citations = [
          {
            id: "cit-nov-00135",
            novNumber: "NOV-2026-QC-00135",
            plateNumber: primaryPlate,
            violation: "Disregarding Traffic Control Signals (Red Light Violation)",
            ordinanceCode: "QC Traffic Ordinance SP-2938 / MMDA NCAP",
            location: "Commonwealth Ave corner Tandang Sora Flyover Northbound",
            date: new Date(Date.now() - 3 * 86400000).toISOString(),
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            amount: 2000,
            surcharge: 0,
            status: "unpaid" as const,
            ltoAlarmStatus: "LTO_ALARM_ACTIVE" as const,
            evidenceFrames: [
              {
                url: "/evidence_sample_plate.jpg",
                label: "Optical Capture: Vehicle Crosses Stop Line on Red Signal",
                timestamp: "14:22:08",
              },
            ],
            paymentDetails: {
              status: "none" as const,
            },
          },
          {
            id: "cit-nov-00129",
            novNumber: "NOV-2026-QC-00129",
            plateNumber: primaryPlate,
            violation: "Disregarding Traffic Signs (Illegal U-Turn Over Double Yellow Line)",
            ordinanceCode: "QC Ordinance SP-2938 S-2020 / MMDA Regulation 24-001",
            location: "Quezon Avenue near EDSA Flyover Westbound",
            date: new Date(Date.now() - 14 * 86400000).toISOString(),
            dueDate: new Date(Date.now() - 4 * 86400000).toISOString(),
            amount: 1000,
            surcharge: 0,
            status: "settled" as const,
            ltoAlarmStatus: "CLEARED" as const,
            clearanceCertNumber: "MMDA-QC-CLR-88129",
            evidenceFrames: [
              {
                url: "/evidence_sample_plate.jpg",
                label: "Optical Capture: Prohibited Maneuver",
                timestamp: "10:15:30",
              },
            ],
            paymentDetails: {
              status: "verified" as const,
              referenceNumber: "GCASH-9821039812",
              receiptNumber: "OR-2026-881924",
              method: "GCASH (ONLINE QR PH)",
              paidAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            },
          },
          {
            id: "cit-nov-00118",
            novNumber: "NOV-2026-QC-00118",
            plateNumber: primaryPlate,
            violation: "Obstruction of Pedestrian Zebra Crosswalk",
            ordinanceCode: "QC Ordinance SP-1444 / Section 46 RA 4136",
            location: "Visayas Avenue near QC Hall Gate 2",
            date: new Date(Date.now() - 5 * 86400000).toISOString(),
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
            amount: 1500,
            surcharge: 0,
            status: "payment_failed" as const,
            ltoAlarmStatus: "LTO_ALARM_ACTIVE" as const,
            evidenceFrames: [
              {
                url: "/evidence_sample_plate.jpg",
                label: "Optical Capture: Encroaching Marked Crosswalk",
                timestamp: "08:44:12",
              },
            ],
            paymentDetails: {
              status: "failed" as const,
              method: "ONLINE PAYMENT (MAYA / CARD)",
              referenceNumber: "FAIL-491028",
              paidAt: new Date(Date.now() - 1 * 86400000).toISOString(),
              failureReason: "Transaction did not push through: Payment gateway authorization declined by card issuing bank. Outstanding balance remains unpaid.",
            },
          },
          {
            id: "cit-nov-00094",
            novNumber: "NOV-2026-QC-00094",
            plateNumber: primaryPlate,
            violation: "Loading and Unloading in Prohibited Zone",
            ordinanceCode: "QC Ordinance SP-2938 / MMDA NCAP",
            location: "Katipunan Avenue near Ateneo Gate 3",
            date: new Date(Date.now() - 8 * 86400000).toISOString(),
            dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
            amount: 2000,
            surcharge: 0,
            status: "appealed" as const,
            ltoAlarmStatus: "WARNING_DUE_SOON" as const,
            evidenceFrames: [
              {
                url: "/evidence_sample_plate.jpg",
                label: "Optical Capture: Vehicle Stoppage",
                timestamp: "16:02:45",
              },
            ],
            paymentDetails: {
              status: "none" as const,
            },
          },
        ];
      }

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
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  driverLicenseNumber: z.string().optional(),
  tokens: z.number().optional(),
});

export const serverSaveCitizenProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => saveCitizenProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashPassword, setFallbackPasswordHash } = await import("@/lib/citizen-auth.server");
    const id = data.id || generateUUID();
    const now = new Date().toISOString();
    const cleanEmail = data.email.trim().toLowerCase();

    let passwordHash: string | undefined = undefined;
    if (data.password && data.password.trim()) {
      passwordHash = hashPassword(data.password.trim());
      setFallbackPasswordHash(cleanEmail, passwordHash);
    }

    const payload: any = {
      id,
      full_name: data.fullName,
      email: cleanEmail,
      phone: data.phone || null,
      address: data.address || "Barangay Culiat, Quezon City",
      driver_license_number: data.driverLicenseNumber || null,
      tokens: data.tokens ?? 250,
      updated_at: now,
    };
    if (passwordHash) {
      payload.password_hash = passwordHash;
    }

    let { data: row, error } = await supabaseAdmin
      .from("citizen_profiles")
      .upsert(payload)
      .select()
      .maybeSingle();

    if (error && (error.message?.includes("password_hash") || (error as any).code === "42703")) {
      console.warn("[Supabase Warning] password_hash column not found, saving without column in Supabase:", error.message);
      delete payload.password_hash;
      const retry = await supabaseAdmin
        .from("citizen_profiles")
        .upsert(payload)
        .select()
        .maybeSingle();
      row = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[Supabase Error: Save Citizen Profile]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || { id, ...data };
  });

const citizenLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const serverCitizenLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => citizenLoginSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyPassword, getFallbackPasswordHash, setFallbackPasswordHash, DEFAULT_INITIAL_PASSWORD_HASH } = await import("@/lib/citizen-auth.server");
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password.trim();

    // 1. Fetch citizen profile by email
    const { data: profiles, error } = await supabaseAdmin
      .from("citizen_profiles")
      .select("*")
      .ilike("email", cleanEmail)
      .limit(1);

    if (error) {
      console.error("[Supabase Error: Citizen Login]", error);
      throw new Error("Unable to connect to citizen authentication service. Please try again.");
    }

    const profile = profiles?.[0];
    if (!profile) {
      throw new Error("No citizen account found with this email address. Please check your email or register.");
    }

    // 2. Validate password
    let storedHash: string | undefined = (profile as any).password_hash || getFallbackPasswordHash(cleanEmail);

    // If profile exists without password_hash in DB and fallback, check legacy standard Admin123
    if (!storedHash) {
      if (verifyPassword(cleanPassword, DEFAULT_INITIAL_PASSWORD_HASH)) {
        storedHash = DEFAULT_INITIAL_PASSWORD_HASH;
        setFallbackPasswordHash(cleanEmail, DEFAULT_INITIAL_PASSWORD_HASH);
      } else {
        throw new Error("Invalid password. Please verify your credentials or use Reset Password.");
      }
    }

    const isValid = verifyPassword(cleanPassword, storedHash);
    if (!isValid) {
      throw new Error("Invalid password. Please verify your credentials.");
    }

    return {
      success: true,
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
    };
  });

const resetCitizenPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const serverResetCitizenPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => resetCitizenPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashPassword, setFallbackPasswordHash } = await import("@/lib/citizen-auth.server");
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.newPassword.trim();

    const { data: profiles, error } = await supabaseAdmin
      .from("citizen_profiles")
      .select("id")
      .ilike("email", cleanEmail)
      .limit(1);

    if (error || !profiles || profiles.length === 0) {
      throw new Error("No citizen account found with this email address. Please register first.");
    }

    const newHash = hashPassword(cleanPassword);
    setFallbackPasswordHash(cleanEmail, newHash);

    try {
      await supabaseAdmin
        .from("citizen_profiles")
        .update({ password_hash: newHash, updated_at: new Date().toISOString() } as any)
        .eq("id", profiles[0].id);
    } catch (updateErr: any) {
      console.warn("Could not persist password_hash to Supabase (migration may be pending):", updateErr.message);
    }

    return {
      success: true,
      message: "Password updated successfully. You may now sign in with your new password.",
    };
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
        .select("full_name, phone")
        .eq("id", data.citizen_id)
        .maybeSingle();

      const ownerName = profile?.full_name || "Verified Citizen Motorist";
      const contactNumber = profile?.phone || null;

      await supabaseAdmin.from("vehicles").upsert({
        plate_number: cleanPlate,
        make_model: data.make_model,
        registered_owner: ownerName,
        contact_number: contactNumber,
        registration_status: "CURRENT",
        lto_alarm_tagged: alarmStatus !== "CLEARED",
        risk_level: alarmStatus !== "CLEARED" ? "Watch" : "Clean",
        updated_at: new Date().toISOString(),
      }, { onConflict: "plate_number" });
    } catch (vehUpsertErr) {
      console.warn("[serverAddCitizenVehicle] Sync to public.vehicles warning:", vehUpsertErr);
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
        .filter((c: any) => c.status === "unpaid" || c.status === "pending" || c.status === "issued").length;

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
  vehicleType?: string;
  violations: number;
  citations: number;
  unpaid: number;
  outstanding: number;
  totalBilled: number;
  lastSeen: string;
  lastOffense: string;
  risk: "clean" | "watch" | "flagged" | "blocked";
  ltoAlarm: boolean;
  isCitizenRegistered: boolean;
  citizenId?: string;
  citizenName?: string;
  citizenEmail?: string;
  citizenPhone?: string;
  citizenAddress?: string;
  citizenDriverLicense?: string;
  citizenTokens?: number;
};

export const serverFetchRegisteredVehicles = createServerFn({ method: "GET" })
  .handler(async (): Promise<RegisteredVehicleRecord[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const [vRes, cvRes, profRes, cRes, vioRes] = await Promise.all([
        supabaseAdmin.from("vehicles").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("citizen_vehicles").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("citizen_profiles").select("*"),
        supabaseAdmin.from("citations").select("*").order("issued_at", { ascending: false }),
        supabaseAdmin.from("violations").select("*").order("detected_at", { ascending: false }),
      ]);

      const dbVehicles = vRes.data || [];
      const citizenVehicles = cvRes.data || [];
      const citizenProfiles = profRes.data || [];
      const citations = cRes.data || [];
      const violations = vioRes.data || [];

      // Map citizen profiles by id
      const profileMap = new Map<string, any>();
      for (const p of citizenProfiles) {
        if (p.id) profileMap.set(p.id, p);
      }

      // Index citizen vehicles by compact plate
      const citizenMap = new Map<string, any>();
      for (const cv of citizenVehicles) {
        const compact = (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        if (compact) {
          const profile = cv.citizen_id ? profileMap.get(cv.citizen_id) : null;
          citizenMap.set(compact, { ...cv, profile });
        }
      }

      const map = new Map<string, RegisteredVehicleRecord>();

      // 1. Process dbVehicles and cross-link citizen profile
      for (const v of dbVehicles) {
        const compact = (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        const cv = citizenMap.get(compact);
        const isCitizen = !!cv;
        const profile = cv?.profile;

        const owner = isCitizen
          ? (profile?.full_name || v.registered_owner || "Verified Citizen")
          : (v.registered_owner || "Verified Motorist");

        map.set(compact, {
          plate: v.plate_number,
          model: v.make_model || cv?.make_model || null,
          owner,
          color: v.color || "Silver",
          chassis: v.chassis_number || undefined,
          vehicleType: cv?.vehicle_type || "Private Vehicle",
          violations: 0,
          citations: 0,
          unpaid: 0,
          outstanding: 0,
          totalBilled: 0,
          lastSeen: v.created_at || new Date().toISOString(),
          lastOffense: "None (Clean Record)",
          risk: ((v.risk_level || "Clean").toLowerCase()) as "clean" | "watch" | "flagged" | "blocked",
          ltoAlarm: !!v.lto_alarm_tagged || cv?.lto_alarm_status === "LTO_ALARM_ACTIVE",
          isCitizenRegistered: isCitizen,
          citizenId: cv?.citizen_id || undefined,
          citizenName: profile?.full_name || undefined,
          citizenEmail: profile?.email || undefined,
          citizenPhone: profile?.phone || v.contact_number || undefined,
          citizenAddress: profile?.address || undefined,
          citizenDriverLicense: profile?.driver_license_number || undefined,
          citizenTokens: typeof profile?.tokens === "number" ? profile.tokens : undefined,
        });
      }

      // 2. Ensure all citizen_vehicles are represented in the map and auto-synced into public.vehicles
      for (const cv of citizenVehicles) {
        const compact = (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        if (!map.has(compact)) {
          const profile = cv.citizen_id ? profileMap.get(cv.citizen_id) : null;
          const owner = profile?.full_name || "Verified Citizen Motorist";
          const isAlarm = cv.lto_alarm_status === "LTO_ALARM_ACTIVE";

          map.set(compact, {
            plate: cv.plate_number,
            model: cv.make_model,
            owner,
            color: "Silver",
            chassis: undefined,
            vehicleType: cv.vehicle_type || "Private Vehicle",
            violations: 0,
            citations: 0,
            unpaid: 0,
            outstanding: 0,
            totalBilled: 0,
            lastSeen: cv.created_at || new Date().toISOString(),
            lastOffense: "None (Clean Record)",
            risk: isAlarm ? "flagged" : "clean",
            ltoAlarm: isAlarm,
            isCitizenRegistered: true,
            citizenId: cv.citizen_id || undefined,
            citizenName: profile?.full_name || undefined,
            citizenEmail: profile?.email || undefined,
            citizenPhone: profile?.phone || undefined,
            citizenAddress: profile?.address || undefined,
            citizenDriverLicense: profile?.driver_license_number || undefined,
            citizenTokens: typeof profile?.tokens === "number" ? profile.tokens : undefined,
          });

          // Auto-sync into public.vehicles in background
          void (async () => {
            try {
              await supabaseAdmin.from("vehicles").upsert({
                plate_number: (cv.plate_number || "").toUpperCase().trim(),
                make_model: cv.make_model,
                registered_owner: owner,
                contact_number: profile?.phone || null,
                registration_status: "CURRENT",
                risk_level: isAlarm ? "Flagged" : "Clean",
                lto_alarm_tagged: isAlarm,
                updated_at: new Date().toISOString(),
              }, { onConflict: "plate_number" });
            } catch (syncErr) {
              console.warn("[Vehicles] Background vehicle sync upsert failed:", syncErr);
            }
          })();
        }
      }

      // 3. Aggregate violations
      for (const vio of violations) {
        const compact = (vio.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        let row = map.get(compact);
        if (!row) {
          const cv = citizenMap.get(compact);
          const profile = cv?.profile;
          row = {
            plate: vio.plate_number,
            model: cv?.make_model || null,
            owner: profile?.full_name || "Unregistered Motorist",
            vehicleType: cv?.vehicle_type,
            violations: 0,
            citations: 0,
            unpaid: 0,
            outstanding: 0,
            totalBilled: 0,
            lastSeen: vio.detected_at,
            lastOffense: vio.violation_type,
            risk: "clean",
            ltoAlarm: false,
            isCitizenRegistered: !!cv,
            citizenId: cv?.citizen_id || undefined,
            citizenName: profile?.full_name || undefined,
            citizenEmail: profile?.email || undefined,
            citizenPhone: profile?.phone || undefined,
            citizenAddress: profile?.address || undefined,
            citizenDriverLicense: profile?.driver_license_number || undefined,
            citizenTokens: typeof profile?.tokens === "number" ? profile.tokens : undefined,
          };
          map.set(compact, row);
        }
        row.violations += 1;
        if (new Date(vio.detected_at) >= new Date(row.lastSeen)) {
          row.lastSeen = vio.detected_at;
          row.lastOffense = vio.violation_type;
        }
      }

      // 4. Aggregate citations
      for (const cit of citations) {
        const compact = (cit.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        let row = map.get(compact);
        if (!row) {
          const cv = citizenMap.get(compact);
          const profile = cv?.profile;
          row = {
            plate: cit.plate_number,
            model: cit.vehicle_model || cv?.make_model || null,
            owner: profile?.full_name || "Unregistered Motorist",
            vehicleType: cv?.vehicle_type,
            violations: 0,
            citations: 0,
            unpaid: 0,
            outstanding: 0,
            totalBilled: 0,
            lastSeen: cit.issued_at,
            lastOffense: cit.offense,
            risk: "clean",
            ltoAlarm: false,
            isCitizenRegistered: !!cv,
            citizenId: cv?.citizen_id || undefined,
            citizenName: profile?.full_name || undefined,
            citizenEmail: profile?.email || undefined,
            citizenPhone: profile?.phone || undefined,
            citizenAddress: profile?.address || undefined,
            citizenDriverLicense: profile?.driver_license_number || undefined,
            citizenTokens: typeof profile?.tokens === "number" ? profile.tokens : undefined,
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
          (b.isCitizenRegistered ? 1 : 0) - (a.isCitizenRegistered ? 1 : 0) ||
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
  isCitizenRegistered?: boolean;
  citizenId?: string;
  citizenEmail?: string;
  citizenPhone?: string;
  citizenAddress?: string;
  citizenDriverLicense?: string;
};

export const serverLookupVehicleDetails = createServerFn({ method: "POST" })
  .validator((data: unknown) => vehicleLookupSchema.parse(data))
  .handler(async ({ data }): Promise<VehicleLookupResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rawPlate = data.plateNumber.trim();
    const compactPlate = rawPlate.replace(/[\s-]/g, "").toUpperCase();

    // 1. Check live database tables (vehicles + citizen_vehicles + citizen_profiles)
    try {
      const [vListRes, cvListRes, profListRes, allCitsRes] = await Promise.all([
        supabaseAdmin.from("vehicles").select("*"),
        supabaseAdmin.from("citizen_vehicles").select("*"),
        supabaseAdmin.from("citizen_profiles").select("*"),
        supabaseAdmin.from("citations").select("*"),
      ]);

      const vList = vListRes.data || [];
      const cvList = cvListRes.data || [];
      const profList = profListRes.data || [];
      const allCits = allCitsRes.data || [];

      const match = (vList || []).find((v: any) =>
        (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate ||
        (v.plate_number || "").toUpperCase() === rawPlate.toUpperCase()
      );

      const cvMatch = (cvList || []).find((v: any) =>
        (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate ||
        (v.plate_number || "").toUpperCase() === rawPlate.toUpperCase()
      );

      const matchingProfile = cvMatch?.citizen_id
        ? (profList || []).find((p: any) => p.id === cvMatch.citizen_id)
        : null;

      const matchingCits = (allCits || []).filter((c: any) =>
        (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate
      );
      const unpaidCits = matchingCits.filter((c: any) => c.status === "unpaid" || c.status === "overdue" || c.status === "pending");
      const unpaidCount = unpaidCits.length;
      const outstanding = unpaidCits.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

      const isCitizen = !!cvMatch;

      if (match || cvMatch) {
        let risk: "Clean" | "Watch" | "Flagged" | "Blocked" = ((match?.risk_level || (cvMatch?.lto_alarm_status === "LTO_ALARM_ACTIVE" ? "Flagged" : "Clean")) as any) || "Clean";
        let alarm = !!match?.lto_alarm_tagged || cvMatch?.lto_alarm_status === "LTO_ALARM_ACTIVE";
        if (outstanding >= 5000 || unpaidCount >= 3) {
          risk = "Blocked";
          alarm = true;
        } else if (unpaidCount > 0) {
          risk = "Flagged";
          alarm = true;
        }

        const ownerName = matchingProfile?.full_name || match?.registered_owner || "Verified Resident";
        const ownerEmail = matchingProfile?.email || undefined;
        const phone = matchingProfile?.phone || match?.contact_number || undefined;

        return {
          foundInDatabase: true,
          plateNumber: match?.plate_number || cvMatch?.plate_number || rawPlate,
          makeModel: match?.make_model || cvMatch?.make_model || "Registered Vehicle",
          registeredOwner: ownerName,
          ownerEmail,
          color: match?.color || "Silver",
          vehicleType: cvMatch?.vehicle_type || "Private Vehicle",
          chassisNumber: match?.chassis_number || undefined,
          registrationStatus: (match?.registration_status as any) || "CURRENT",
          riskLevel: risk,
          ltoAlarmTagged: alarm,
          unpaidCitationsCount: unpaidCount,
          outstandingAmount: outstanding,
          citizenName: matchingProfile?.full_name || (isCitizen ? ownerName : undefined),
          isCitizenRegistered: isCitizen,
          citizenId: cvMatch?.citizen_id || undefined,
          citizenEmail: ownerEmail,
          citizenPhone: phone,
          citizenAddress: matchingProfile?.address || undefined,
          citizenDriverLicense: matchingProfile?.driver_license_number || undefined,
        };
      }
    } catch (err) {
      console.warn("[Vehicle Lookup] DB Error:", err);
    }

    // 2. Fallback to LTO verification
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
      outstandingAmount: 0,
      isCitizenRegistered: false,
    };
  });

// -------------------------------------------------------------
// TWO-FACTOR AUTHENTICATION (2FA) 6-DIGIT OTP DISPATCH & VERIFY
// -------------------------------------------------------------
const activeOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const send2FAOtpSchema = z.object({
  email: z.string().email(),
});

export const serverDispatch2FAOtp = createServerFn({ method: "POST" })
  .validator((data: unknown) => send2FAOtpSchema.parse(data))
  .handler(async ({ data }) => {
    const cleanEmail = data.email.toLowerCase().trim();
    // Generate secure 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 1 * 60 * 1000; // 1 minute (60 seconds)

    activeOtpStore.set(cleanEmail, {
      code: otpCode,
      expiresAt,
      attempts: 0,
    });

    console.log(`[2FA OTP Engine] Generated 6-digit code for ${cleanEmail}: ${otpCode}`);

    try {
      const { send2FAOtpEmail } = await import("@/lib/email.service.server");
      const result = await send2FAOtpEmail({
        recipientEmail: cleanEmail,
        otpCode,
      });

      // Audit log entry
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("audit_logs").insert({
          actor_name: cleanEmail,
          actor_role: "auth_challenge",
          action: "2FA_OTP_CHALLENGE_ISSUED",
          target_resource: "Command Center 2FA",
          details: `6-digit OTP code dispatched via ${result.provider}. Message ID: ${result.messageId || "N/A"}`,
        });
      } catch {
        // Non-blocking
      }

      return {
        success: true,
        provider: result.provider,
        expiresInSeconds: 60,
        message: "A 6-digit security code has been transmitted via SMTP to your official email.",
      };
    } catch (err: any) {
      console.error("[2FA OTP Engine] Failed to dispatch OTP:", err);
      throw new Error(`Failed to transmit 2FA code: ${err?.message || err}`);
    }
  });

const verify2FAOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export const serverVerify2FAOtp = createServerFn({ method: "POST" })
  .validator((data: unknown) => verify2FAOtpSchema.parse(data))
  .handler(async ({ data }) => {
    const cleanEmail = data.email.toLowerCase().trim();
    const cleanCode = data.code.trim();

    const stored = activeOtpStore.get(cleanEmail);

    if (!stored) {
      return {
        success: false,
        error: "No active 2FA code found. Please request a new security code.",
      };
    }

    if (Date.now() > stored.expiresAt) {
      activeOtpStore.delete(cleanEmail);
      return {
        success: false,
        error: "This 2FA code has expired. Please request a new code.",
      };
    }

    stored.attempts += 1;
    if (stored.attempts > 5) {
      activeOtpStore.delete(cleanEmail);
      return {
        success: false,
        error: "Too many failed attempts. For your security, please request a new code.",
      };
    }

    if (stored.code !== cleanCode) {
      return {
        success: false,
        error: "Invalid 6-digit code. Please verify the code in your email.",
      };
    }

    // Code verified! Remove from pending store
    activeOtpStore.delete(cleanEmail);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("audit_logs").insert({
        actor_name: cleanEmail,
        actor_role: "auth_verified",
        action: "2FA_CLEARANCE_VERIFIED",
        target_resource: "Command Center Access",
        details: "Operator successfully completed 6-digit Two-Factor Authentication via SMTP.",
      });
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      verified: true,
      email: cleanEmail,
      message: "2FA Security Clearance Verified.",
    };
  });

