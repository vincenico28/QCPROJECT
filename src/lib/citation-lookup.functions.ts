import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  plate: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  query: z.string().trim().optional(),
}).refine(
  (data) => Boolean((data.plate && data.plate.length >= 2) || (data.reference && data.reference.length >= 2) || (data.query && data.query.length >= 2)),
  { message: "Please enter a license plate or citation reference number" }
);

export type PublicCitation = {
  id: string;
  citation_number: string;
  plate_number: string;
  offense: string;
  amount: number;
  status: string;
  issued_at: string;
  vehicle_model: string | null;
  location?: string | null;
  officer_name?: string | null;
  dueDate?: string | null;
  evidence_url?: string | null;
  ordinanceCode?: string | null;
  isCitizenRegistered?: boolean;
  citizenName?: string;
};

export type PublicVehicleLookupResult = {
  searchedQuery: string;
  plateNumber: string;
  vehicleFound: boolean;
  vehicleModel?: string;
  registeredOwner?: string;
  isCitizenRegistered: boolean;
  citizenName?: string;
  citizenEmail?: string;
  ltoAlarmStatus: "CLEARED" | "WARNING_DUE_SOON" | "LTO_ALARM_ACTIVE";
  ltoAlarmTagged: boolean;
  riskLevel: "Clean" | "Watch" | "Flagged" | "Blocked";
  totalCitations: number;
  unpaidCount: number;
  totalOutstanding: number;
  citations: PublicCitation[];
};

export const SAMPLE_CITATIONS: PublicCitation[] = [
  {
    id: "CIT-00129",
    citation_number: "NOV-2026-QC-00129",
    plate_number: "NDB-8921",
    vehicle_model: "Toyota Vios 1.3E (Silver)",
    offense: "Red Light / Beating the Traffic Signal",
    ordinanceCode: "MMDA Reg. 16-002 / QC Ord. SP-2938",
    location: "Commonwealth Ave — Tandang Sora Intersection (Cam #04)",
    amount: 2000,
    status: "unpaid",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    officer_name: "QC ANPR Node Grid (Cam #04)",
    evidence_url: "/assets/violation-1.jpg",
  },
  {
    id: "CIT-00135",
    citation_number: "QC-88218",
    plate_number: "ABC 1234",
    vehicle_model: "Honda Click 125i (Black/Red)",
    offense: "Riding Motorcycle Without Standard Protective Helmet",
    ordinanceCode: "RA 10054 / QC Ord. SP-1444",
    location: "Katipunan Flyover Southbound Ramp",
    amount: 1500,
    status: "pending",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    officer_name: "Ofc. Rodriguez (Badge #7742)",
    evidence_url: "/assets/violation-2.jpg",
  },
  {
    id: "CIT-00142",
    citation_number: "QC-88217",
    plate_number: "WHI 9981",
    vehicle_model: "Honda Civic 1.5 RS Turbo (White)",
    offense: "Overspeeding (Exceeding 60 kph limit — Recorded 82 kph)",
    ordinanceCode: "QC Speed Ordinance SP-2636, S-2017",
    location: "Elliptical Road North Sector (Cam #133)",
    amount: 3000,
    status: "contested",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    officer_name: "Ofc. Cruz (Badge #5219)",
    evidence_url: "/assets/violation-3.jpg",
  },
  {
    id: "CIT-00149",
    citation_number: "QC-88219",
    plate_number: "NDG 4412",
    vehicle_model: "Toyota Vios 1.5G (Bronze Metallic)",
    offense: "Obstruction of Traffic / Yellow Box Blocking",
    ordinanceCode: "QC Ordinance SP-2938",
    location: "Tomas Morato cor. Timog Ave",
    amount: 2000,
    status: "paid",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    officer_name: "Ofc. Santos (Badge #3104)",
    evidence_url: "/assets/violation-1.jpg",
  },
  {
    id: "CIT-00155",
    citation_number: "NOV-2026-QC-00142",
    plate_number: "XYZ-987",
    vehicle_model: "Mitsubishi Mirage G4 (Gray)",
    offense: "Counterflow Driving / Crossing Solid Double Yellow Line",
    ordinanceCode: "QC Strict Flow Law SP-3112",
    location: "Visayas Ave near Central Market",
    amount: 2500,
    status: "contested",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    officer_name: "QC High-Def AI Sentinel",
    evidence_url: "/assets/violation-2.jpg",
  },
];

/**
 * Public motorist lookup. Queries live Supabase database with fallback to pre-seeded dataset.
 * Supports searching by Plate Number, Citation Reference, or both.
 */
export const lookupCitation = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<PublicVehicleLookupResult | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Normalize user inputs
    const queryInput = (data.query || "").trim();
    const plateInput = (data.plate || "").trim();
    const refInput = (data.reference || "").trim();

    const searchStr = queryInput || (plateInput && refInput ? `${plateInput} ${refInput}` : plateInput || refInput);
    const compactInput = searchStr.replace(/[\s-]/g, "").toUpperCase();

    try {
      // 1. Fetch live citations, vehicles, citizen vehicles, citizen profiles in parallel
      const [citationsRes, vehiclesRes, citizenVehsRes, citizenProfsRes] = await Promise.all([
        supabaseAdmin
          .from("citations")
          .select("*, violations(evidence_url, location, camera_code)"),
        supabaseAdmin.from("vehicles").select("*"),
        supabaseAdmin.from("citizen_vehicles").select("*"),
        supabaseAdmin.from("citizen_profiles").select("*"),
      ]);

      const allCits = citationsRes.data || [];
      const allVehs = vehiclesRes.data || [];
      const allCv = citizenVehsRes.data || [];
      const allProf = citizenProfsRes.data || [];

      // Create quick lookup maps
      const profMap = new Map<string, any>();
      for (const p of allProf) {
        profMap.set(p.id, p);
      }

      // 2. Identify target vehicle & plate
      // Check if search query matches a vehicle plate directly
      let matchedPlate: string | null = null;
      let matchedVeh: any = null;
      let matchedCv: any = null;
      let matchedCitation: any = null;

      // Check vehicles by plate
      matchedVeh = allVehs.find((v: any) => {
        const norm = (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        return norm === compactInput || (plateInput && norm === plateInput.replace(/[\s-]/g, "").toUpperCase());
      });

      // Check citizen vehicles by plate
      matchedCv = allCv.find((cv: any) => {
        const norm = (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        return norm === compactInput || (plateInput && norm === plateInput.replace(/[\s-]/g, "").toUpperCase());
      });

      // Check citations by reference or plate
      const matchingCitsByRef = allCits.filter((c: any) => {
        const numNorm = (c.citation_number || "").replace(/[\s-]/g, "").toUpperCase();
        const refNorm = refInput ? refInput.replace(/[\s-]/g, "").toUpperCase() : "";
        return (
          numNorm === compactInput ||
          (refNorm && numNorm.includes(refNorm)) ||
          numNorm.includes(compactInput)
        );
      });

      if (matchingCitsByRef.length > 0) {
        matchedCitation = matchingCitsByRef[0];
      }

      if (matchedVeh) {
        matchedPlate = matchedVeh.plate_number;
      } else if (matchedCv) {
        matchedPlate = matchedCv.plate_number;
      } else if (matchedCitation) {
        matchedPlate = matchedCitation.plate_number;
      } else if (plateInput) {
        matchedPlate = plateInput.toUpperCase();
      } else if (searchStr.length <= 10 && !searchStr.toUpperCase().startsWith("NOV-") && !searchStr.toUpperCase().startsWith("CIT-")) {
        matchedPlate = searchStr.toUpperCase();
      }

      // If a plate is found or suspected, gather all citations for that plate
      const compactPlate = matchedPlate ? matchedPlate.replace(/[\s-]/g, "").toUpperCase() : compactInput;

      let vehicleCitations = allCits.filter((c: any) => {
        const cPlateNorm = (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
        const cNumNorm = (c.citation_number || "").replace(/[\s-]/g, "").toUpperCase();
        
        if (matchedPlate && cPlateNorm === compactPlate) return true;
        if (refInput && cNumNorm.includes(refInput.replace(/[\s-]/g, "").toUpperCase())) return true;
        if (cNumNorm === compactInput) return true;
        return false;
      });

      // Find vehicle record if not found yet
      if (!matchedVeh && matchedPlate) {
        matchedVeh = allVehs.find(
          (v: any) => (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate
        );
      }
      if (!matchedCv && matchedPlate) {
        matchedCv = allCv.find(
          (cv: any) => (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase() === compactPlate
        );
      }

      const linkedProfile = matchedCv?.citizen_id ? profMap.get(matchedCv.citizen_id) : null;
      const isCitizen = Boolean(matchedCv || linkedProfile);

      // Format matching citations into PublicCitation list
      const formattedCitations: PublicCitation[] = vehicleCitations.map((c: any) => {
        const evidence = c.evidence_url || c.violations?.evidence_url || "/assets/violation-1.jpg";
        const loc = c.violations?.location || c.location || "Quezon City Monitored Road Corridor";
        return {
          id: c.id,
          citation_number: c.citation_number,
          plate_number: c.plate_number,
          offense: c.offense,
          amount: Number(c.amount || 0),
          status: c.status,
          issued_at: c.issued_at,
          vehicle_model: c.vehicle_model || matchedVeh?.make_model || matchedCv?.make_model || "Registered Vehicle",
          location: loc,
          officer_name: c.officer_name || "QC Road Enforcer",
          dueDate: new Date(new Date(c.issued_at).getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          evidence_url: evidence,
          isCitizenRegistered: isCitizen,
          citizenName: linkedProfile?.full_name || matchedVeh?.registered_owner,
        };
      });

      // Compute liabilities
      const unpaidCits = formattedCitations.filter(
        (c) => c.status === "unpaid" || c.status === "pending" || c.status === "overdue"
      );
      const totalOutstanding = unpaidCits.reduce((sum, c) => sum + c.amount, 0);
      const hasAlarm = Boolean(
        matchedVeh?.lto_alarm_tagged ||
        matchedCv?.lto_alarm_status === "LTO_ALARM_ACTIVE" ||
        unpaidCits.length > 0
      );

      const alarmStatus: "CLEARED" | "WARNING_DUE_SOON" | "LTO_ALARM_ACTIVE" =
        unpaidCits.length > 0
          ? "LTO_ALARM_ACTIVE"
          : matchedCv?.lto_alarm_status === "WARNING_DUE_SOON"
          ? "WARNING_DUE_SOON"
          : "CLEARED";

      const risk: "Clean" | "Watch" | "Flagged" | "Blocked" =
        totalOutstanding >= 5000 || unpaidCits.length >= 3
          ? "Blocked"
          : unpaidCits.length > 0
          ? "Flagged"
          : (matchedVeh?.risk_level as any) || "Clean";

      // If either vehicle or citations were found in live DB
      if (matchedVeh || matchedCv || formattedCitations.length > 0) {
        return {
          searchedQuery: searchStr,
          plateNumber: matchedPlate || formattedCitations[0]?.plate_number || searchStr.toUpperCase(),
          vehicleFound: Boolean(matchedVeh || matchedCv),
          vehicleModel: matchedVeh?.make_model || matchedCv?.make_model || formattedCitations[0]?.vehicle_model || undefined,
          registeredOwner: linkedProfile?.full_name || matchedVeh?.registered_owner || undefined,
          isCitizenRegistered: isCitizen,
          citizenName: linkedProfile?.full_name || (isCitizen ? matchedVeh?.registered_owner : undefined),
          citizenEmail: linkedProfile?.email || undefined,
          ltoAlarmStatus: alarmStatus,
          ltoAlarmTagged: hasAlarm,
          riskLevel: risk,
          totalCitations: formattedCitations.length,
          unpaidCount: unpaidCits.length,
          totalOutstanding,
          citations: formattedCitations,
        };
      }
    } catch (err) {
      console.warn("[lookupCitation] Database query warning:", err);
    }

    // 3. Fallback to sample dataset for mock / demonstration lookup cases
    const sampleMatches = SAMPLE_CITATIONS.filter((c) => {
      const cPlateNorm = c.plate_number.replace(/[\s-]/g, "").toUpperCase();
      const cNumNorm = c.citation_number.replace(/[\s-]/g, "").toUpperCase();
      return (
        cPlateNorm === compactInput ||
        cNumNorm === compactInput ||
        (refInput && cNumNorm.includes(refInput.replace(/[\s-]/g, "").toUpperCase())) ||
        cNumNorm.includes(compactInput) ||
        compactInput.includes(cPlateNorm)
      );
    });

    if (sampleMatches.length > 0) {
      const unpaid = sampleMatches.filter((c) => c.status === "unpaid" || c.status === "pending" || c.status === "overdue");
      const outstanding = unpaid.reduce((sum, c) => sum + c.amount, 0);
      return {
        searchedQuery: searchStr,
        plateNumber: sampleMatches[0].plate_number,
        vehicleFound: true,
        vehicleModel: sampleMatches[0].vehicle_model ?? "Sample Vehicle",
        registeredOwner: "Verified Motorist",
        isCitizenRegistered: sampleMatches[0].plate_number === "NDB-8921",
        citizenName: sampleMatches[0].plate_number === "NDB-8921" ? "Juan Dela Cruz" : undefined,
        ltoAlarmStatus: unpaid.length > 0 ? "LTO_ALARM_ACTIVE" : "CLEARED",
        ltoAlarmTagged: unpaid.length > 0,
        riskLevel: unpaid.length > 0 ? "Flagged" : "Clean",
        totalCitations: sampleMatches.length,
        unpaidCount: unpaid.length,
        totalOutstanding: outstanding,
        citations: sampleMatches,
      };
    }

    // 4. Check if the plate is known clean vehicle (e.g. CAS 3901, NCAP-9900)
    if (compactInput === "CAS3901") {
      return {
        searchedQuery: searchStr,
        plateNumber: "CAS 3901",
        vehicleFound: true,
        vehicleModel: "Toyota Fortuner 2.8 Black",
        registeredOwner: "Juan Dela Cruz",
        isCitizenRegistered: true,
        citizenName: "Juan Dela Cruz",
        citizenEmail: "juan.delacruz@gmail.com",
        ltoAlarmStatus: "CLEARED",
        ltoAlarmTagged: false,
        riskLevel: "Clean",
        totalCitations: 0,
        unpaidCount: 0,
        totalOutstanding: 0,
        citations: [],
      };
    }

    return null;
  });
