import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
//#region dist/server/assets/routes-M7sRiSSu.js
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var FEATURES = [
	{
		icon: import_lucide_react.Zap,
		title: "AI Violation Detection",
		body: "Computer-vision models flag red-light running, illegal parking, and lane violations with confidence scoring on every event."
	},
	{
		icon: import_lucide_react.Camera,
		title: "IoT Camera Grid",
		body: "Monitor uptime, health, and detection throughput of every enforcement node deployed across the city."
	},
	{
		icon: import_lucide_react.MapPin,
		title: "GIS Hotspot Analytics",
		body: "Interactive heatmaps with time-range playback, road-segment filters, and one-click CSV export."
	},
	{
		icon: import_lucide_react.FileText,
		title: "Digital Citations",
		body: "Issue, track, and reconcile citations with live revenue, outstanding balances, and contest handling."
	}
];
var STATS = [
	{
		label: "Camera nodes",
		value: "120+"
	},
	{
		label: "Detection accuracy",
		value: "94.6%"
	},
	{
		label: "Avg. citation time",
		value: "42s"
	},
	{
		label: "Districts covered",
		value: "6"
	}
];
function LandingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-6xl items-center gap-4 px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-9 place-items-center rounded-xl bg-primary font-mono-tab text-sm font-bold tracking-tighter text-primary-foreground",
							children: "QC"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "QC Traffic Ops"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
								children: "Quezon City LGU"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/dashboard",
							className: "ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
							children: ["Enter Command Center", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowRight, { className: "size-4" })]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 font-mono-tab text-[10px] uppercase tracking-widest text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-pulse rounded-full bg-success" }), "Live enforcement grid"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl",
							children: "AI traffic enforcement command for Quezon City"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 max-w-xl text-base leading-relaxed text-muted-foreground",
							children: "One operations console for automated violation detection, IoT camera health, GIS hotspot analytics, and digital citation issuance — built for QC enforcement units."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-wrap gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/dashboard",
									className: "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
									children: ["Open dashboard", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowRight, { className: "size-4" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/cameras",
									className: "inline-flex items-center gap-2 rounded-lg border border-border-strong bg-panel px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-panel-elevated",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Camera, { className: "size-4" }), "View camera grid"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/lookup",
									className: "inline-flex items-center gap-2 rounded-lg border border-border-strong bg-panel px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-panel-elevated",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.FileText, { className: "size-4" }), "Check my citation"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
							className: "mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4",
							children: STATS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
								children: s.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 font-mono-tab text-2xl font-bold text-foreground",
								children: s.value
							})] }, s.label))
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "panel overflow-hidden rounded-2xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/assets/qc-map-CTbKdSF9.jpg",
							alt: "Quezon City traffic enforcement GIS map with violation hotspots",
							className: "h-full w-full object-cover",
							loading: "lazy"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "border-t border-border bg-panel/40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-6xl px-6 py-16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-semibold tracking-tight",
							children: "Built for the full enforcement workflow"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
							children: FEATURES.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "panel rounded-2xl p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.icon, {
										className: "size-5 text-primary",
										strokeWidth: 2
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-4 text-sm font-semibold text-foreground",
										children: f.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm leading-relaxed text-muted-foreground",
										children: f.body
									})
								]
							}, f.title))
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mx-auto max-w-6xl px-6 py-16",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel flex flex-col items-start gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-semibold tracking-tight",
							children: "Authorized personnel access"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-lg text-sm text-muted-foreground",
							children: "Operational data is restricted to signed-in QC enforcement staff. Sign in to reach live detections, camera diagnostics, and citation records."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/dashboard",
							className: "inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ShieldCheck, { className: "size-4" }), "Staff sign in"]
						})]
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Activity, { className: "size-4 text-primary" }), "QC Traffic Ops · Quezon City Local Government Unit"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono-tab text-[10px] uppercase tracking-widest",
						children: ["Internal system · ", (/* @__PURE__ */ new Date()).getFullYear()]
					})]
				})
			})
		]
	});
}
//#endregion
export { LandingPage as component };
