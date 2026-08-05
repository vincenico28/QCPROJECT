import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { r as timeAgo, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useDispatches, i as DISPATCH_STATUS_LABEL, o as useUpdateDispatchStatus, r as DispatchDialog } from "./router-CsIn8Ssg.mjs";
//#region dist/server/assets/dispatch-CBvEj37e.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var FILTERS = [
	{
		key: "active",
		label: "Active"
	},
	{
		key: "queued",
		label: "Queued"
	},
	{
		key: "en_route",
		label: "En Route"
	},
	{
		key: "on_scene",
		label: "On Scene"
	},
	{
		key: "resolved",
		label: "Resolved"
	},
	{
		key: "all",
		label: "All"
	}
];
function DispatchBoard() {
	const [filter, setFilter] = (0, import_react.useState)("active");
	const { data: dispatches = [], isLoading } = useDispatches(100);
	const update = useUpdateDispatchStatus();
	const rows = (0, import_react.useMemo)(() => {
		if (filter === "all") return dispatches;
		if (filter === "active") return dispatches.filter((d) => [
			"queued",
			"en_route",
			"on_scene"
		].includes(d.status));
		return dispatches.filter((d) => d.status === filter);
	}, [dispatches, filter]);
	const kpis = (0, import_react.useMemo)(() => ({
		queued: dispatches.filter((d) => d.status === "queued").length,
		field: dispatches.filter((d) => ["en_route", "on_scene"].includes(d.status)).length,
		resolved: dispatches.filter((d) => d.status === "resolved").length,
		critical: dispatches.filter((d) => d.priority === "critical" && d.status !== "resolved").length
	}), [dispatches]);
	async function setStatus(d, status) {
		try {
			await update.mutateAsync({
				id: d.id,
				status
			});
			toast.success(`${d.reference} → ${DISPATCH_STATUS_LABEL[status]}`);
		} catch (err) {
			toast.error("Could not update dispatch", { description: err instanceof Error ? err.message : void 0 });
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Queued",
						value: kpis.queued,
						icon: import_lucide_react.Clock,
						tone: "warning"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "In Field",
						value: kpis.field,
						icon: import_lucide_react.Radio,
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Critical Open",
						value: kpis.critical,
						icon: import_lucide_react.Siren,
						tone: "danger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Resolved",
						value: kpis.resolved,
						icon: import_lucide_react.CheckCircle2,
						tone: "success"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1 rounded-xl border border-border bg-panel p-1",
					children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFilter(f.key),
						className: cn("rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-bold uppercase tracking-widest transition-colors", filter === f.key ? "bg-primary/15 text-primary" : "text-subtle hover:text-foreground"),
						children: f.label
					}, f.key))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ml-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DispatchDialog, { trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Radio, { className: "size-4" }), "New dispatch"]
					}) })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-4 xl:grid-cols-2",
				children: [
					isLoading && [
						0,
						1,
						2,
						3
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-2xl bg-panel-elevated" }, i)),
					!isLoading && rows.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "panel flex flex-col gap-4 rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono-tab text-sm font-bold text-foreground",
													children: d.reference
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriorityPill, { priority: d.priority }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: d.status })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.MapPin, { className: "size-3.5 shrink-0 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "truncate",
												children: d.location
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-0.5 text-xs text-subtle",
											children: d.officer_name ? `${d.badge_number} · ${d.officer_name}` : "Unassigned · nearest unit"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 font-mono-tab text-[10px] text-subtle",
									children: timeAgo(d.created_at)
								})]
							}),
							d.instructions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground",
								children: d.instructions
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									"en_route",
									"on_scene",
									"resolved",
									"cancelled"
								].filter((s) => s !== d.status).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setStatus(d, s),
									disabled: update.isPending,
									className: cn("rounded-md border border-border px-3 py-1.5 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50", s === "resolved" && "text-success hover:text-success", s === "cancelled" && "text-danger hover:text-danger"),
									children: DISPATCH_STATUS_LABEL[s]
								}, s))
							})
						]
					}, d.id)),
					!isLoading && rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "panel col-span-full rounded-2xl p-10 text-center text-sm text-subtle",
						children: "No dispatches in this view."
					})
				]
			})
		]
	});
}
function Kpi({ label, value, icon: Icon, tone }) {
	const toneClass = {
		primary: "text-primary",
		success: "text-success",
		warning: "text-warning",
		danger: "text-danger"
	}[tone];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel rounded-2xl p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: cn("size-4", toneClass),
				strokeWidth: 1.75
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 font-mono-tab text-4xl font-bold tracking-tighter text-foreground",
			children: value
		})]
	});
}
function PriorityPill({ priority }) {
	const tone = {
		low: "border-border text-subtle",
		medium: "border-primary/30 bg-primary/10 text-primary",
		high: "border-warning/30 bg-warning/10 text-warning",
		critical: "border-danger/30 bg-danger/10 text-danger"
	}[priority];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("rounded-full border px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-widest", tone),
		children: priority
	});
}
function StatusPill({ status }) {
	const tone = {
		queued: "border-warning/30 bg-warning/10 text-warning",
		en_route: "border-primary/30 bg-primary/10 text-primary",
		on_scene: "border-primary/30 bg-primary/10 text-primary",
		resolved: "border-success/30 bg-success/10 text-success",
		cancelled: "border-border text-subtle"
	}[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("rounded-full border px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-widest", tone),
		children: DISPATCH_STATUS_LABEL[status]
	});
}
//#endregion
export { DispatchBoard as component };
