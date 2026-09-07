import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDeveloperKeys, useCreateApiKey, useRevokeApiKey } from "@/lib/data/developer";
import {
  Loader2,
  Code2,
  Key,
  Copy,
  Plus,
  Activity,
  BookOpen,
  Trash2,
  X,
  CheckCircle2,
  Send,
  Radio,
  Terminal,
  Webhook,
  Play,
  Server,
  Zap,
  ShieldCheck,
  Check,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [{ title: "Developer API Portal & Sandbox — QC Flow Guardian" }],
  }),
  component: DeveloperPage,
});

type TabType = "keys" | "sandbox" | "webhooks";

const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/traffic/flow",
    title: "Corridor Flow & Velocity",
    description: "Returns average velocities, saturation levels, and risk indices across Commonwealth, Katipunan, and Visayas.",
    mockResponse: {
      status: "success",
      timestamp: new Date().toISOString(),
      grid: "QC-CENTRAL-METRO",
      active_corridors: [
        {
          corridor: "Commonwealth Ave (Batasan to Litex)",
          average_speed_kph: 28.4,
          congestion_level: "HIGH",
          lane_count: 18,
          active_cameras: 12,
          incident_risk_index: 0.84,
        },
        {
          corridor: "Katipunan Ave Beltway",
          average_speed_kph: 41.2,
          congestion_level: "MODERATE",
          lane_count: 6,
          active_cameras: 8,
          incident_risk_index: 0.48,
        },
      ],
    },
  },
  {
    method: "GET",
    path: "/api/v1/cameras",
    title: "Optical Sentinel Camera Grid",
    description: "Enumerate active ANPR nodes, optical clarity percentage, thermal readings, and live streaming endpoints.",
    mockResponse: {
      status: "success",
      total_nodes: 42,
      nodes_online: 41,
      cameras: [
        {
          id: "CAM-042",
          location: "Commonwealth Ave cor. Tandang Sora",
          status: "ONLINE",
          resolution: "4K 60FPS HDR",
          anpr_accuracy_rate: "99.4%",
          coordinates: [14.6563, 121.0697],
          last_heartbeat_ms_ago: 120,
        },
        {
          id: "CAM-133",
          location: "Elliptical Road North Sector",
          status: "ONLINE",
          resolution: "4K 60FPS HDR",
          anpr_accuracy_rate: "98.8%",
          coordinates: [14.6486, 121.0466],
          last_heartbeat_ms_ago: 85,
        },
      ],
    },
  },
  {
    method: "GET",
    path: "/api/v1/advisories",
    title: "Public Traffic Advisories",
    description: "Real-time rerouting bulletins, roadwork notices, and weather advisories formatted for consumer navigation apps.",
    mockResponse: {
      status: "success",
      active_advisories_count: 3,
      advisories: [
        {
          id: "ADV-2026-091",
          title: "Commonwealth Ave Inbound Drainage Upgrading",
          severity: "MODERATE",
          affected_lanes: "Lanes 1 & 2 (Rightmost)",
          start_time: "2026-09-07T06:00:00Z",
          expected_clearing: "2026-09-07T18:00:00Z",
          advisory_type: "ROADWORK",
        },
      ],
    },
  },
  {
    method: "POST",
    path: "/api/v1/dispatches/emergency",
    title: "Third-Party Automated Dispatch Trigger",
    description: "Allows certified navigation or emergency partners (e.g. Waze, MMDA) to request patrol verification for reported hazards.",
    mockResponse: {
      status: "dispatched",
      dispatch_id: "DSP-2026-00941",
      reference: "QC-DSP-0941",
      assigned_officer: "Ofc. Ramon Rodriguez (#7742)",
      priority: "CRITICAL",
      eta_minutes: 4,
      timestamp: new Date().toISOString(),
    },
  },
];

function DeveloperPage() {
  const { data: keys, isLoading } = useDeveloperKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [activeTab, setActiveTab] = useState<TabType>("keys");
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");

  // Sandbox State
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [executing, setExecuting] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<any | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState("https://traffic-relay.waze.com/qc-lgu/events");
  const [webhookSecret, setWebhookSecret] = useState("whsec_qc_8f71b290ea11c4a");
  const [testSending, setTestSending] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    createKey.mutate(
      { name: keyName.trim() },
      {
        onSuccess: (newKey) => {
          toast.success(`API Key "${newKey.name}" created!`, {
            description: "Store your key securely. It has been authorized for QC LGU API endpoints.",
          });
          setCreateOpen(false);
          setKeyName("");
        },
      }
    );
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExecuteSandbox = () => {
    setExecuting(true);
    setSandboxResponse(null);
    setLatency(null);

    const ms = Math.floor(25 + Math.random() * 45);
    setTimeout(() => {
      setExecuting(false);
      setSandboxResponse(selectedEndpoint.mockResponse);
      setLatency(ms);
      toast.success(`200 OK — Request executed in ${ms}ms`);
    }, 450);
  };

  const handleCopyCurl = () => {
    const key = keys?.[0]?.key || "sk_live_qc_demo_key";
    const curl = `curl -X ${selectedEndpoint.method} "https://api.qc-flow-guardian.gov.ph${selectedEndpoint.path}" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Accept: application/json"`;
    navigator.clipboard.writeText(curl);
    toast.success("cURL command copied to clipboard!");
  };

  const handleTestWebhook = () => {
    setTestSending(true);
    setTimeout(() => {
      setTestSending(false);
      toast.success("Webhook event delivered successfully!", {
        description: `HTTP 200 response from ${webhookUrl} (Payload: incident.accident_flagged)`,
      });
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 text-foreground">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-purple-400 border border-purple-500/30">
              API GATEWAY v2.4
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-purple-500"></span>
            </span>
            <span className="text-xs text-subtle">· 99.98% SLA Guaranteed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2 mt-1">
            <Code2 className="size-6 text-purple-500" />
            Developer API Portal & Sandbox
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage authenticated API keys, test endpoints in the live sandbox, and configure Webhooks for third-party systems (Waze, MMDA, Google Maps).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              toast.info("Developer Documentation is accessible at: https://docs.qc-flow-guardian.gov.ph")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-panel-elevated"
          >
            <BookOpen className="size-3.5 text-purple-400" />
            API Docs
          </button>

          <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-colors hover:bg-purple-500">
                <Plus className="size-3.5" />
                Generate New Key
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-lg bg-purple-500/20 text-purple-400">
                      <Key className="size-4" />
                    </div>
                    <Dialog.Title className="text-lg font-bold text-white">Generate API Key</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="rounded-lg p-1 text-muted-foreground hover:bg-panel-elevated hover:text-white">
                      <X className="size-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Application or Service Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Waze Connected Citizens Feed"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This key will grant read/write access to Quezon City real-time traffic speeds, camera telemetry, and active advisories under the Open Traffic Data Protocol.
                  </p>

                  <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={createKey.isPending}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                    >
                      {createKey.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      Generate Key
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Navigation Tab Pills */}
      <div className="flex border-b border-border/60 pb-1 gap-2">
        <button
          onClick={() => setActiveTab("keys")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === "keys"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-muted-foreground hover:text-white hover:bg-panel"
          )}
        >
          <Key className="size-3.5" />
          Active API Keys ({keys?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("sandbox")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === "sandbox"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-muted-foreground hover:text-white hover:bg-panel"
          )}
        >
          <Terminal className="size-3.5" />
          Live API Sandbox
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === "webhooks"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-muted-foreground hover:text-white hover:bg-panel"
          )}
        >
          <Webhook className="size-3.5" />
          Webhooks & Events
        </button>
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === "keys" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isLoading || !keys ? (
              <div className="grid h-64 place-items-center rounded-2xl border border-border bg-panel">
                <Loader2 className="size-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="grid gap-4">
                {keys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="panel rounded-2xl border border-border p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Key className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base sm:text-lg">{apiKey.name}</h3>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="rounded bg-black/60 px-2.5 py-1 text-xs font-mono text-purple-300 border border-purple-500/30">
                            {apiKey.key}
                          </code>
                          <button
                            onClick={() => handleCopy(apiKey.key, apiKey.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedKey === apiKey.id ? (
                              <Check className="size-4 text-emerald-400" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Created {new Date(apiKey.createdAt).toLocaleDateString()} · Rate Limit: 10,000 req/min
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-6 md:gap-2 items-center md:items-end justify-between border-t md:border-t-0 border-border/50 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                          Last Used
                        </p>
                        <p className="text-xs font-semibold text-white mt-0.5">
                          {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : "Never"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            30D Requests
                          </p>
                          <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center md:justify-end gap-1">
                            <Activity className="size-3" />
                            {apiKey.requestsLast30Days.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            revokeKey.mutate({ id: apiKey.id });
                            toast.error(`Revoked API key: ${apiKey.name}`);
                          }}
                          className="rounded-xl p-2 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          title="Revoke API Key"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel rounded-2xl border border-border p-5 shadow-lg bg-panel">
              <h3 className="font-bold text-white mb-4">Traffic API Usage (30 Days)</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground">Total Ingested Calls</span>
                  <span className="font-mono-tab font-bold text-white">1,495,320</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground">Active Third-Party Keys</span>
                  <span className="font-mono-tab font-bold text-white">{keys?.length || 2}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground">Average Global Latency</span>
                  <span className="font-mono-tab font-bold text-emerald-400">34ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Error Rate</span>
                  <span className="font-mono-tab font-bold text-emerald-400">0.01%</span>
                </div>
              </div>
            </div>

            <div className="panel rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-lg">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Zap className="size-4" /> Partner Integration Tier
              </div>
              <p className="text-xs text-muted-foreground mt-2 mb-4 leading-relaxed">
                Connect your civic mapping, telemetry, or fleet management system with authenticated sub-second access to Quezon City's camera and traffic sensor network.
              </p>
              <button
                onClick={() => setActiveTab("sandbox")}
                className="w-full rounded-xl bg-purple-600/30 border border-purple-500/50 px-4 py-2.5 text-xs font-bold text-purple-200 transition-colors hover:bg-purple-600/50"
              >
                Launch API Sandbox →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE API SANDBOX */}
      {activeTab === "sandbox" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Endpoint Selector */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-mono-tab font-bold uppercase tracking-wider text-muted-foreground">
              Select REST Endpoint
            </h3>
            <div className="flex flex-col gap-2">
              {API_ENDPOINTS.map((endpoint) => {
                const isSelected = selectedEndpoint.path === endpoint.path;
                return (
                  <button
                    key={endpoint.path}
                    onClick={() => {
                      setSelectedEndpoint(endpoint);
                      setSandboxResponse(null);
                      setLatency(null);
                    }}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-4 text-left transition-all",
                      isSelected
                        ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                        : "border-border bg-panel hover:bg-panel-elevated"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
                          endpoint.method === "GET"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">{endpoint.path}</span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-foreground">{endpoint.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                      {endpoint.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Request & Response Runner */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="panel rounded-2xl border border-border p-5 shadow-lg bg-panel">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    https://api.qc-flow-guardian.gov.ph{selectedEndpoint.path}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCurl}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-3 py-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
                  >
                    <Copy className="size-3" />
                    Copy cURL
                  </button>

                  <button
                    onClick={handleExecuteSandbox}
                    disabled={executing}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition-colors disabled:opacity-50"
                  >
                    {executing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    Execute Request
                  </button>
                </div>
              </div>

              {/* Request Headers Preview */}
              <div className="mt-4 text-xs font-mono">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Headers Sent:
                </span>
                <div className="mt-1 rounded-xl bg-black/60 p-3 text-muted-foreground space-y-1">
                  <div>
                    <span className="text-purple-400">Authorization:</span> Bearer{" "}
                    {keys?.[0]?.key || "sk_live_qc_981a89c20f1882ea77289a2"}
                  </div>
                  <div>
                    <span className="text-purple-400">Content-Type:</span> application/json
                  </div>
                  <div>
                    <span className="text-purple-400">QC-Client-Version:</span> 2026.9.1
                  </div>
                </div>
              </div>

              {/* Response Display */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Server className="size-3 text-emerald-400" /> Response Payload:
                  </span>
                  {latency && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
                      <span className="text-subtle">· Latency: {latency}ms</span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl bg-black/90 p-4 border border-white/10 font-mono text-xs text-emerald-400 min-h-64 max-h-96">
                  {executing ? (
                    <div className="grid h-48 place-items-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 animate-spin text-purple-500" />
                        <span className="text-xs">Connecting to edge gateway…</span>
                      </div>
                    </div>
                  ) : sandboxResponse ? (
                    <pre>{JSON.stringify(sandboxResponse, null, 2)}</pre>
                  ) : (
                    <div className="grid h-48 place-items-center text-muted-foreground text-center">
                      <div>
                        <p className="text-xs">Click "Execute Request" above to test this endpoint live.</p>
                        <p className="text-[10px] text-subtle mt-1">Real-time JSON response will render here.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="panel rounded-2xl border border-border p-6 shadow-lg bg-panel">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Webhook className="size-5 text-purple-500" />
                Outgoing Webhook Destination
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-5">
                Quezon City Flow Guardian can push real-time event payloads via HTTPS POST whenever critical traffic events occur.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Payload Delivery URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com/api/webhooks/qc-traffic"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Signing Secret (HMAC-SHA256)
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookSecret}
                      className="w-full rounded-xl border border-border bg-black/60 px-3.5 py-2.5 text-xs text-purple-300 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(webhookSecret);
                        toast.success("Webhook secret copied!");
                      }}
                      className="rounded-xl border border-border bg-panel-elevated p-2.5 text-muted-foreground hover:text-white"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Subscribed Event Topics
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {[
                      { topic: "incident.accident_flagged", label: "Accident / Collision Detection" },
                      { topic: "flow.surge_detected", label: "Congestion Spike (>80% Saturation)" },
                      { topic: "dispatch.unit_assigned", label: "Officer Deployment Status Change" },
                      { topic: "camera.sensor_degraded", label: "Hardware & Thermal Alert" },
                    ].map((item) => (
                      <label
                        key={item.topic}
                        className="flex items-center gap-2 rounded-xl border border-border/70 bg-panel-elevated p-3 cursor-pointer hover:bg-white/[0.02]"
                      >
                        <input
                          type="checkbox"
                          defaultChecked
                          className="size-4 rounded border-border text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-white">{item.label}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{item.topic}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Retry Policy: Exponential backoff with 5 attempts over 2 hours.
                  </span>
                  <button
                    onClick={handleTestWebhook}
                    disabled={testSending}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition-colors disabled:opacity-50"
                  >
                    {testSending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    Send Test Event
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel rounded-2xl border border-border p-5 shadow-lg bg-panel">
              <h3 className="font-bold text-white text-sm mb-3">Sample Webhook JSON Payload</h3>
              <div className="overflow-x-auto rounded-xl bg-black/90 p-3 border border-white/10 font-mono text-[11px] text-purple-300">
                <pre>
{`{
  "event": "incident.accident_flagged",
  "id": "evt_991823a",
  "created_at": "2026-09-07T10:55:00Z",
  "data": {
    "camera_code": "CAM-042",
    "location": "Commonwealth Ave",
    "severity": "CRITICAL",
    "optical_confidence": 0.96,
    "coordinates": [14.6563, 121.0697]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

