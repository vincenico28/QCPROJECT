import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as useCameras, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
//#region dist/server/assets/cameras.index-cVyd9VNe.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var FILTERS = [
	"all",
	"online",
	"offline",
	"maintenance"
];
function CamerasPage() {
	const { data: cameras = [], isLoading } = useCameras();
	const { data: violations = [] } = useViolations(200);
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const detectionsByCamera = (0, import_react.useMemo)(() => {
		const map = {};
		for (const v of violations) {
			if (!v.camera_code) continue;
			map[v.camera_code] = (map[v.camera_code] ?? 0) + 1;
		}
		return map;
	}, [violations]);
	const counts = (0, import_react.useMemo)(() => ({
		all: cameras.length,
		online: cameras.filter((c) => c.status === "online").length,
		offline: cameras.filter((c) => c.status === "offline").length,
		maintenance: cameras.filter((c) => c.status === "maintenance").length
	}), [cameras]);
	const filtered = (0, import_react.useMemo)(() => {
		const needle = q.toLowerCase();
		return cameras.filter((c) => {
			if (filter !== "all" && c.status !== filter) return false;
			if (!needle) return true;
			return c.code.toLowerCase().includes(needle) || c.location.toLowerCase().includes(needle);
		});
	}, [
		cameras,
		filter,
		q
	]);
	const uptime = cameras.length > 0 ? Math.round(counts.online / cameras.length * 1e3) / 10 : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Nodes deployed",
						value: cameras.length,
						icon: import_lucide_react.Video
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Online",
						value: counts.online,
						icon: import_lucide_react.Wifi,
						tone: "text-success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Offline",
						value: counts.offline,
						icon: import_lucide_react.WifiOff,
						tone: "text-danger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Network uptime",
						value: `${uptime}%`,
						icon: import_lucide_react.Radio,
						tone: "text-primary"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1 overflow-x-auto",
					children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setFilter(f),
						className: cn("shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors", filter === f ? "bg-primary/15 text-primary" : "text-subtle hover:bg-panel-elevated hover:text-foreground"),
						children: [f, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 rounded bg-panel-elevated px-1.5 py-0.5 text-[9px] text-muted-foreground",
							children: counts[f]
						})]
					}, f))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "relative flex items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "pointer-events-none absolute left-3 size-4 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search camera code or location…",
						className: "w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-80"
					})]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel grid h-64 place-items-center rounded-2xl text-sm text-subtle",
				children: "Establishing link with camera network…"
			}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel grid h-64 place-items-center rounded-2xl text-sm text-subtle",
				children: "No cameras match the current filters."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: filtered.map((cam) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraCard, {
					camera: cam,
					detections: detectionsByCamera[cam.code] ?? 0
				}, cam.id))
			})
		]
	});
}
function CameraCard({ camera, detections }) {
	const online = camera.status === "online";
	const maintenance = camera.status === "maintenance";
	const StatusIcon = online ? import_lucide_react.Wifi : maintenance ? import_lucide_react.Wrench : import_lucide_react.WifiOff;
	const tone = online ? "text-success" : maintenance ? "text-warning" : "text-danger";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/cameras/$code",
		params: { code: camera.code },
		className: "panel block overflow-hidden rounded-2xl transition-colors hover:border-primary/40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative aspect-video bg-panel-elevated",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 grid place-items-center",
					children: online ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-2 text-subtle",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Video, {
							className: "size-8",
							strokeWidth: 1.5
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab text-[10px] uppercase tracking-widest",
							children: "Live feed · 1080p"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-2 text-danger/70",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.WifiOff, {
							className: "size-8",
							strokeWidth: 1.5
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab text-[10px] uppercase tracking-widest",
							children: "No signal"
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", online ? "animate-pulse bg-success" : maintenance ? "bg-warning" : "bg-danger") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-foreground",
						children: camera.code
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-1 font-mono-tab text-[10px] text-subtle backdrop-blur-sm",
					children: [detections, " detections"]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3 p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "truncate text-sm font-semibold text-foreground",
					children: camera.location
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
					children: camera.lat != null && camera.lng != null ? `${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}` : "Coordinates pending"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: cn("flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-2 py-1 font-mono-tab text-[10px] font-semibold uppercase tracking-widest", tone),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, { className: "size-3" }), camera.status]
			})]
		})]
	});
}
function Kpi({ label, value, icon: Icon, tone = "text-foreground" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel rounded-2xl p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: cn("size-4", tone),
				strokeWidth: 2
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("mt-3 font-mono-tab text-3xl font-bold", tone),
			children: value
		})]
	});
}
//#endregion
export { CamerasPage as component };
