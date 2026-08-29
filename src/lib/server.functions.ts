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

const violationInsertSchema = z.object({
  plate_number: z.string().trim().min(3),
  violation_type: z.string().trim().min(2),
  location: z.string().trim().min(2),
  confidence: z.number().min(0).max(100).default(95),
  evidence_url: z.string().nullable().optional(),
  ai_detected: z.boolean().default(true),
  camera_code: z.string().nullable().optional(),
  status: z.string().default("pending"),
});

export const serverSaveViolation = createServerFn({ method: "POST" })
  .validator((data: unknown) => violationInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const now = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("violations")
      .insert({
        id,
        plate_number: data.plate_number.toUpperCase().trim(),
        violation_type: data.violation_type,
        location: data.location,
        confidence: data.confidence > 1 ? data.confidence : data.confidence * 100,
        status: data.status,
        evidence_url: data.evidence_url || "/assets/violation-1.jpg",
        ai_detected: data.ai_detected,
        camera_code: data.camera_code || "QC-CAM-1001",
        detected_at: now,
        created_at: now,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Violation]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || { id, ...data, detected_at: now };
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
export const serverFetchCitations = createServerFn({ method: "GET" })
  .validator((limit: unknown) => (typeof limit === "number" ? limit : 50))
  .handler(async ({ data: limit }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data, error } = await supabaseAdmin
        .from("citations")
        .select("*")
        .order("issued_at", { ascending: false })
        .limit(limit);
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error("[Supabase Error: Fetch Citations]", err);
    }
    return null;
  });

const citationInsertSchema = z.object({
  violation_id: z.string().nullable().optional(),
  plate_number: z.string().trim().min(3),
  vehicle_model: z.string().nullable().optional(),
  offense: z.string().trim().min(2),
  amount: z.number().positive(),
  status: z.string().default("unpaid"),
  officer_name: z.string().nullable().optional(),
});

export const serverSaveCitation = createServerFn({ method: "POST" })
  .validator((data: unknown) => citationInsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = generateUUID();
    const citation_number = `NOV-2026-QC-${Math.floor(10000 + Math.random() * 90000)}`;
    const issued_at = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("citations")
      .insert({
        id,
        citation_number,
        violation_id: data.violation_id || null,
        plate_number: data.plate_number.toUpperCase().trim(),
        vehicle_model: data.vehicle_model || null,
        offense: data.offense,
        amount: data.amount,
        status: data.status,
        officer_name: data.officer_name || "QC Enforcer",
        issued_at,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase Error: Save Citation]", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    return row || { id, citation_number, ...data, issued_at };
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

