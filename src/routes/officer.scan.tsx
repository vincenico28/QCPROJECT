import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Search, Loader2, ArrowLeft, LayoutDashboard, QrCode } from "lucide-react";
import { toast } from "sonner";
import { formatPeso, timeAgo, useUpdateCitationStatus } from "@/lib/data/traffic";
import { serverFetchCitations } from "@/lib/server.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officer/scan")({
  head: () => ({
    meta: [{ title: "Scan Citation · Culiat Traffic Ops" }],
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
    // Initialize Scanner only if we are not showing a result
    if (scanResult) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // success callback
        scanner.clear();
        setScanResult(decodedText);
      },
      (error) => {
        // failure callback (fires repeatedly while scanning, ignore)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanResult]);

  useEffect(() => {
    if (!scanResult) return;
    
    // We expect the QR code to contain the citation_number or we fallback to plate search
    async function lookup(query: string) {
      setLoading(true);
      try {
        const rows = await serverFetchCitations({ data: 100 });
        const cleanQuery = query.trim().toLowerCase();
        const data = rows?.find((c: any) => 
          c.citation_number?.toLowerCase() === cleanQuery || 
          c.plate_number?.toLowerCase() === cleanQuery ||
          cleanQuery.includes(c.citation_number?.toLowerCase() || "___")
        );

        if (!data) {
          toast.error("No active citation found for this reference.");
          setCitation(null);
        } else {
          setCitation(data);
          toast.success("Citation record loaded successfully");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to query database for citation");
      } finally {
        setLoading(false);
      }
    }
    lookup(scanResult);
  }, [scanResult]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setScanResult(manualInput.trim());
  };

  return (
    <div className="flex flex-col p-4 pb-20 max-w-2xl mx-auto w-full">
      {/* Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
        >
          <ArrowLeft className="size-3.5 text-primary" />
          Back to Terminal
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
        >
          <LayoutDashboard className="size-3.5 text-subtle" />
          Command Center
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-lg bg-blue-500/20 text-blue-400">
          <QrCode className="size-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Scan Citation / License</h2>
      </div>

      {!scanResult ? (
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-black">
            <div id="reader" className="w-full text-foreground" />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs font-semibold uppercase tracking-widest text-subtle">
              <span className="bg-background px-2">or enter manually</span>
            </div>
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                placeholder="Plate or Citation #"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-panel py-3 pl-9 pr-4 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
            >
              Search
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
            className="self-start text-xs font-semibold uppercase tracking-widest text-primary"
          >
            ← Scan another
          </button>

          {loading ? (
            <div className="mt-10 flex flex-col items-center gap-2 text-subtle">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Retrieving record...</p>
            </div>
          ) : citation ? (
            <div className="panel flex flex-col gap-3 rounded-2xl border border-border p-5 shadow-lg">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">
                    Citation #{citation.citation_number}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-foreground">
                    {citation.plate_number}
                  </p>
                </div>
                <StatusPill status={citation.status} />
              </div>
              <div className="py-2">
                <p className="text-xs text-subtle">Offense</p>
                <p className="font-medium text-foreground">{citation.offense}</p>
                
                <p className="mt-3 text-xs text-subtle">Issued At</p>
                <p className="font-medium text-foreground">{new Date(citation.issued_at).toLocaleString()}</p>
                
                <p className="mt-3 text-xs text-subtle">Amount Due</p>
                <p className="font-mono text-lg font-bold text-foreground">
                  {formatPeso(citation.amount).replace("PHP", "₱")}
                </p>
              </div>

              {(citation.status === "pending" || citation.status === "unpaid") && (
                <div className="mt-3 grid gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await updateCitation.mutateAsync({
                          citationId: citation.citation_number,
                          status: "paid",
                        });
                        toast.success("Citation marked as paid (Cash)");
                        setCitation({ ...citation, status: "paid" });
                      } catch (err: any) {
                        toast.error(err?.message || "Failed to update citation status");
                      }
                    }}
                    disabled={updateCitation.isPending}
                    className="rounded-lg bg-success px-4 py-3 text-sm font-semibold text-success-foreground shadow-lg shadow-success/20 disabled:opacity-50 hover:bg-success/90 transition-colors"
                  >
                    {updateCitation.isPending ? "Processing..." : "Mark as Paid (Cash)"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-10 text-center">
              <p className="text-sm text-subtle">No citation found for "{scanResult}".</p>
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
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
        tone,
      )}
    >
      {status}
    </span>
  );
}
