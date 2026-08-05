import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as useCitations, n as formatPeso, r as timeAgo, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
//#region dist/server/assets/vehicles.index-DXWZ1rJX.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var RISKS = [
	"all",
	"clean",
	"watch",
	"flagged",
	"blocked"
];
function VehiclesPage() {
	const { data: violations = [], isLoading: vLoading } = useViolations(500);
	const { data: citations = [], isLoading: cLoading } = useCitations(500);
	const [risk, setRisk] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const vehicles = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const v of violations) {
			const row = map.get(v.plate_number) ?? {
				plate: v.plate_number,
				model: null,
				violations: 0,
				citations: 0,
				unpaid: 0,
				outstanding: 0,
				totalBilled: 0,
				lastSeen: v.detected_at,
				lastOffense: v.violation_type,
				risk: "clean"
			};
			row.violations += 1;
			if (new Date(v.detected_at) >= new Date(row.lastSeen)) {
				row.lastSeen = v.detected_at;
				row.lastOffense = v.violation_type;
			}
			map.set(v.plate_number, row);
		}
		for (const c of citations) {
			const row = map.get(c.plate_number) ?? {
				plate: c.plate_number,
				model: c.vehicle_model,
				violations: 0,
				citations: 0,
				unpaid: 0,
				outstanding: 0,
				totalBilled: 0,
				lastSeen: c.issued_at,
				lastOffense: c.offense,
				risk: "clean"
			};
			row.model = row.model ?? c.vehicle_model;
			row.citations += 1;
			row.totalBilled += Number(c.amount);
			if (c.status === "unpaid" || c.status === "overdue") {
				row.unpaid += 1;
				row.outstanding += Number(c.amount);
			}
			if (new Date(c.issued_at) >= new Date(row.lastSeen)) {
				row.lastSeen = c.issued_at;
				row.lastOffense = c.offense;
			}
			map.set(c.plate_number, row);
		}
		const rows = Array.from(map.values()).map((r) => {
			const total = r.violations + r.citations;
			let risk = "clean";
			if (r.outstanding >= 5e3 || r.unpaid >= 3) risk = "blocked";
			else if (total >= 4 || r.outstanding > 0) risk = "flagged";
			else if (total >= 2) risk = "watch";
			return {
				...r,
				risk
			};
		});
		rows.sort((a, b) => b.outstanding - a.outstanding || b.violations + b.citations - (a.violations + a.citations));
		return rows;
	}, [violations, citations]);
	const filtered = (0, import_react.useMemo)(() => {
		return vehicles.filter((v) => {
			if (risk !== "all" && v.risk !== risk) return false;
			if (!q) return true;
			const n = q.toLowerCase();
			return v.plate.toLowerCase().includes(n) || (v.model ?? "").toLowerCase().includes(n) || v.lastOffense.toLowerCase().includes(n);
		});
	}, [
		vehicles,
		risk,
		q
	]);
	const counts = (0, import_react.useMemo)(() => {
		return {
			all: vehicles.length,
			clean: vehicles.filter((v) => v.risk === "clean").length,
			watch: vehicles.filter((v) => v.risk === "watch").length,
			flagged: vehicles.filter((v) => v.risk === "flagged").length,
			blocked: vehicles.filter((v) => v.risk === "blocked").length
		};
	}, [vehicles]);
	const totalOutstanding = vehicles.reduce((s, v) => s + v.outstanding, 0);
	const isLoading = vLoading || cLoading;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
						icon: import_lucide_react.Car,
						label: "Vehicles Tracked",
						value: counts.all.toLocaleString(),
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
						icon: import_lucide_react.AlertTriangle,
						label: "Flagged",
						value: counts.flagged.toLocaleString(),
						tone: "warning"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
						icon: import_lucide_react.Ban,
						label: "Blocked / Impound",
						value: counts.blocked.toLocaleString(),
						tone: "danger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
						icon: import_lucide_react.ShieldAlert,
						label: "Outstanding Fines",
						value: formatPeso(totalOutstanding),
						tone: "warning"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1 overflow-x-auto",
					children: RISKS.map((s) => {
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setRisk(s),
							className: cn("shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors", risk === s ? "bg-primary/15 text-primary" : "text-subtle hover:bg-panel-elevated hover:text-foreground"),
							children: [s, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 rounded bg-panel-elevated px-1.5 py-0.5 text-[9px] text-muted-foreground",
								children: counts[s]
							})]
						}, s);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "relative flex items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "pointer-events-none absolute left-3 size-4 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search plate, model, offense…",
						className: "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel overflow-hidden rounded-2xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border",
							children: [
								"Plate",
								"Vehicle",
								"Violations",
								"Citations",
								"Outstanding",
								"Last Offense",
								"Last Seen",
								"Risk"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
								children: h
							}, h))
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [
								isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 8,
									className: "p-6 text-center text-sm text-subtle",
									children: "Aggregating vehicle registry…"
								}) }),
								!isLoading && filtered.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VehicleRow, { v }, v.plate)),
								!isLoading && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 8,
									className: "p-8 text-center text-sm text-subtle",
									children: "No vehicles match your filters."
								}) })
							]
						})]
					})
				})
			})
		]
	});
}
function MiniStat({ icon: Icon, label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "panel rounded-2xl p-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 text-2xl font-semibold tracking-tight text-foreground",
				children: value
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("grid size-9 place-items-center rounded-lg", tone === "danger" ? "text-danger bg-danger/10" : tone === "warning" ? "text-warning bg-warning/10" : "text-primary bg-primary/10"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-4",
					strokeWidth: 2
				})
			})]
		})
	});
}
function VehicleRow({ v }) {
	const riskTone = v.risk === "clean" ? "bg-success/10 text-success border-success/30" : v.risk === "watch" ? "bg-primary/10 text-primary border-primary/30" : v.risk === "flagged" ? "bg-warning/10 text-warning border-warning/30" : "bg-danger/10 text-danger border-danger/30";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "text-sm transition-colors hover:bg-panel-elevated/50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/vehicles/$plate",
					params: { plate: v.plate },
					className: "font-mono-tab font-semibold text-foreground transition-colors hover:text-primary",
					children: v.plate
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-muted-foreground",
				children: v.model ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 font-mono-tab text-foreground",
				children: v.violations
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-5 py-3 font-mono-tab text-foreground",
				children: [v.citations, v.unpaid > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ml-1 font-mono-tab text-[10px] text-warning",
					children: [
						"(",
						v.unpaid,
						" unpaid)"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 font-mono-tab text-foreground",
				children: v.outstanding > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-warning",
					children: formatPeso(v.outstanding)
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-subtle",
					children: "—"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-muted-foreground",
				children: v.lastOffense
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-foreground",
					children: timeAgo(v.lastSeen)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono-tab text-[10px] text-subtle",
					children: new Date(v.lastSeen).toLocaleDateString("en-PH")
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase", riskTone),
					children: v.risk
				})
			})
		]
	});
}
//#endregion
export { VehiclesPage as component };
