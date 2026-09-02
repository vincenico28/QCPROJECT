import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Search,
  Loader2,
  ArrowLeft,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatPeso, timeAgo, useUpdateCitationStatus } from "@/lib/data/traffic";
import { serverFetchCitations } from "@/lib/server.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officer/scan")({
  head: () => ({
    meta: [{ title: "Scan Citation & OVR · Culiat Traffic Ops" }],
  }),
  component: ScannerPage,
});

function ScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [citation, setCitation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const updateCitation = useUpdateCitationStatus();

  useEffect(() => {
    if (scanResult) return;

    let scanner: Html5QrcodeScanner | null = null;
    try {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          scanner?.clear();
          setScanResult(decodedText);
        },
        () => {
          // failure callback ignored during live scanning
        }
      );
    } catch (err) {
      console.warn("Scanner init warning:", err);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanResult]);

  useEffect(() => {
    if (!scanResult) return;

    async function lookup(query: string) {
      setLoading(true);
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const cleanQuery = query.trim();

        let foundCitation = null;
        try {
          const { data: dbRows, error } = await supabase
            .from("citations")
            .select("*")
            .or(`citation_number.ilike.%${cleanQuery}%,plate_number.ilike.%${cleanQuery}%`)
            .limit(1);

          if (!error && dbRows && dbRows.length > 0) {
            foundCitation = dbRows[0];
          }
        } catch {
          // fallback
        }

        if (!foundCitation) {
          const rows = await serverFetchCitations({ data: 100 });
          const lowerQuery = cleanQuery.toLowerCase();
          foundCitation = rows?.find(
            (c: any) =>
              c.citation_number?.toLowerCase() === lowerQuery ||
              c.plate_number?.toLowerCase() === lowerQuery ||
              lowerQuery.includes(c.citation_number?.toLowerCase() || "___")
          );
        }

        if (!foundCitation) {
          toast.error("No active citation found for this reference.");
          setCitation(null);
        } else {
          setCitation(foundCitation);
          toast.success("Citation record loaded successfully");

          try {
            await supabase.from("audit_logs").insert({
              actor_name: "Field Enforcement Officer",
              actor_role: "officer",
              action: "OFFICER_QR_SCAN_VERIFIED",
              target_resource: `Citation: ${foundCitation.citation_number} (${foundCitation.plate_number})`,
              details: `Status: ${foundCitation.status}, Amount: PHP ${foundCitation.amount}`,
            });
          } catch (err) {
            console.warn(err);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Lookup error occurred");
      } finally {
        setLoading(false);
      }
    }

    lookup(scanResult);
  }, [scanResult]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput) return;
    setScanResult(manualInput);
  };

  return (
    <div className="flex flex-col p-4 pb-20 max-w-xl mx-auto w-full min-h-screen bg-background border-x border-border">
      {/* Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
        >
          <ArrowLeft className="size-3.5 text-primary" />
          Terminal
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
        >
          <LayoutDashboard className="size-3.5 text-subtle" />
          Command Center
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
          <QrCode className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Scan Citation & OVR</h2>
          <p className="text-xs text-muted-foreground">Verify printed QR tickets or driver notices</p>
        </div>
      </div>

      {!scanResult ? (
        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-2xl p-2">
            <div id="reader" className="w-full text-foreground rounded-2xl overflow-hidden" />
          </div>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs font-mono-tab uppercase tracking-widest text-subtle">
              <span className="bg-background px-3">or manual lookup</span>
            </div>
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                placeholder="License Plate or Citation #"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full rounded-xl border border-border bg-panel py-3 pl-9 pr-4 text-xs font-medium text-foreground placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              Verify
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              setScanResult(null);
              setCitation(null);
              setManualInput("");
            }}
            className="self-start inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-bold text-primary hover:bg-panel-elevated transition-colors"
          >
            <RotateCcw className="size-3.5" />
            Scan Another Record
          </button>

          {loading ? (
            <div className="mt-10 flex flex-col items-center gap-2 text-subtle">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs font-mono-tab">Retrieving citation record from database...</p>
            </div>
          ) : citation ? (
            <div className="panel flex flex-col gap-4 rounded-3xl border border-border bg-panel p-6 shadow-xl">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    Notice of Violation #{citation.citation_number}
                  </p>
                  <p className="mt-1 font-mono-tab text-2xl font-black text-foreground">
                    {citation.plate_number}
                  </p>
                </div>
                <StatusPill status={citation.status} />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-subtle font-mono-tab text-[10px] uppercase">Offense</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{citation.offense}</p>
                </div>

                <div>
                  <span className="text-subtle font-mono-tab text-[10px] uppercase">Issuing Authority</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {citation.officer_name || "QC Camera Node Grid"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Issued Date</span>
                    <p className="font-mono-tab text-foreground mt-0.5">
                      {new Date(citation.issued_at).toLocaleDateString("en-PH")}
                    </p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Fine Balance</span>
                    <p className="font-mono-tab text-lg font-black text-foreground mt-0.5">
                      {formatPeso(citation.amount).replace("PHP", "₱")}
                    </p>
                  </div>
                </div>
              </div>

              {(citation.status === "pending" || citation.status === "unpaid") && (
                <div className="mt-2 grid gap-2 pt-3 border-t border-border">
                  <button
                    onClick={async () => {
                      try {
                        await updateCitation.mutateAsync({
                          citationId: citation.citation_number,
                          status: "paid",
                        });
                        toast.success("Citation marked as settled (Cash Receipt)");
                        setCitation({ ...citation, status: "paid" });
                      } catch (err: any) {
                        toast.error(err?.message || "Failed to update citation status");
                      }
                    }}
                    disabled={updateCitation.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" />
                    {updateCitation.isPending ? "Processing..." : "Mark Paid (Cash OTC Settlement)"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-border bg-panel p-8 text-center text-subtle">
              <p className="text-sm">No citation found matching reference "{scanResult}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-success/10 text-success border-success/30"
      : status === "contested"
      ? "bg-danger/10 text-danger border-danger/30"
      : "bg-warning/10 text-warning border-warning/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
        tone
      )}
    >
      {status}
    </span>
  );
}
