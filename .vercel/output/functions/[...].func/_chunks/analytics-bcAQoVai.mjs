import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as useCitations, n as formatPeso, o as useOfficers, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { t as require_lib } from "../_libs/recharts+[...].mjs";
//#region dist/server/assets/analytics-bcAQoVai.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var import_lib = require_lib();
var RANGES = [
	{
		key: "7d",
		label: "7 Days",
		days: 7
	},
	{
		key: "14d",
		label: "14 Days",
		days: 14
	},
	{
		key: "30d",
		label: "30 Days",
		days: 30
	}
];
var PIE_TONES = [
	"var(--primary)",
	"var(--danger)",
	"var(--warning)",
	"var(--success)",
	"var(--muted-foreground)"
];
function dayKey(iso) {
	return new Date(iso).toISOString().slice(0, 10);
}
function AnalyticsPage() {
	const [range, setRange] = (0, import_react.useState)("14d");
	const days = RANGES.find((r) => r.key === range).days;
	const { data: violations = [], isLoading } = useViolations(500);
	const { data: citations = [] } = useCitations(500);
	const { data: officers = [] } = useOfficers();
	const since = (0, import_react.useMemo)(() => Date.now() - days * 24 * 60 * 60 * 1e3, [days]);
	const scopedViolations = (0, import_react.useMemo)(() => violations.filter((v) => new Date(v.detected_at).getTime() >= since), [violations, since]);
	const scopedCitations = (0, import_react.useMemo)(() => citations.filter((c) => new Date(c.issued_at).getTime() >= since), [citations, since]);
	const trend = (0, import_react.useMemo)(() => {
		const buckets = /* @__PURE__ */ new Map();
		for (let i = days - 1; i >= 0; i--) {
			const d = (/* @__PURE__ */ new Date(Date.now() - i * 864e5)).toISOString().slice(0, 10);
			buckets.set(d, {
				day: d.slice(5),
				detections: 0,
				citations: 0,
				revenue: 0
			});
		}
		for (const v of scopedViolations) {
			const b = buckets.get(dayKey(v.detected_at));
			if (b) b.detections += 1;
		}
		for (const c of scopedCitations) {
			const b = buckets.get(dayKey(c.issued_at));
			if (!b) continue;
			b.citations += 1;
			if (c.status === "paid") b.revenue += Number(c.amount);
		}
		return [...buckets.values()];
	}, [
		scopedViolations,
		scopedCitations,
		days
	]);
	const offenseMix = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const v of scopedViolations) map.set(v.violation_type, (map.get(v.violation_type) ?? 0) + 1);
		return [...map.entries()].map(([name, value]) => ({
			name,
			value
		})).sort((a, b) => b.value - a.value).slice(0, 5);
	}, [scopedViolations]);
	const officerPerf = (0, import_react.useMemo)(() => officers.slice(0, 8).map((o) => ({
		name: o.badge_number,
		citations: o.citations_issued
	})), [officers]);
	const kpis = (0, import_react.useMemo)(() => {
		const revenue = scopedCitations.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
		const billed = scopedCitations.reduce((s, c) => s + Number(c.amount), 0);
		const avgConf = scopedViolations.length > 0 ? scopedViolations.reduce((s, v) => s + Number(v.confidence), 0) / scopedViolations.length : 0;
		return {
			detections: scopedViolations.length,
			revenue,
			collection: billed > 0 ? revenue / billed * 100 : 0,
			avgConf
		};
	}, [scopedViolations, scopedCitations]);
	function exportReport() {
		const csv = [[
			"date",
			"detections",
			"citations",
			"revenue_php"
		], ...trend.map((t) => [
			t.day,
			t.detections,
			t.citations,
			t.revenue
		])].map((r) => r.join(",")).join("\n");
		const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = `qc-enforcement-analytics-${range}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1 rounded-xl border border-border bg-panel p-1",
					children: RANGES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setRange(r.key),
						className: cn("rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-bold uppercase tracking-widest transition-colors", range === r.key ? "bg-primary/15 text-primary" : "text-subtle hover:text-foreground"),
						children: r.label
					}, r.key))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: exportReport,
					className: "ml-auto inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-medium text-foreground hover:bg-panel-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Download, { className: "size-3.5" }), "Export report"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Detections",
						value: kpis.detections.toLocaleString(),
						icon: import_lucide_react.ShieldAlert,
						tone: "danger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Collected Revenue",
						value: formatPeso(kpis.revenue).replace("PHP", "₱"),
						icon: import_lucide_react.Banknote,
						tone: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Collection Rate",
						value: `${kpis.collection.toFixed(1)}%`,
						icon: import_lucide_react.TrendingUp,
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Avg AI Confidence",
						value: `${kpis.avgConf.toFixed(1)}%`,
						icon: import_lucide_react.Gauge,
						tone: "warning"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel rounded-3xl p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartHeading, {
					title: "Detections vs Citations",
					sub: `Daily enforcement volume · last ${days} days`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-72 w-full",
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-full animate-pulse rounded-xl bg-panel-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_lib.AreaChart, {
							data: trend,
							margin: {
								top: 12,
								right: 8,
								left: -16,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
									id: "gDet",
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "0%",
										stopColor: "var(--primary)",
										stopOpacity: .55
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "100%",
										stopColor: "var(--primary)",
										stopOpacity: 0
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
									id: "gCit",
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "0%",
										stopColor: "var(--warning)",
										stopOpacity: .45
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "100%",
										stopColor: "var(--warning)",
										stopOpacity: 0
									})]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "var(--border)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.XAxis, {
									dataKey: "day",
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.YAxis, {
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Tooltip, { contentStyle: tooltipStyle }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Legend, { wrapperStyle: { fontSize: 12 } }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Area, {
									type: "monotone",
									dataKey: "detections",
									stroke: "var(--primary)",
									fill: "url(#gDet)",
									strokeWidth: 2
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Area, {
									type: "monotone",
									dataKey: "citations",
									stroke: "var(--warning)",
									fill: "url(#gCit)",
									strokeWidth: 2
								})
							]
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-6 xl:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel rounded-3xl p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartHeading, {
						title: "Offense Mix",
						sub: "Top violation categories"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-72 w-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_lib.PieChart, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Pie, {
									data: offenseMix,
									dataKey: "value",
									nameKey: "name",
									innerRadius: 60,
									outerRadius: 100,
									paddingAngle: 3,
									stroke: "var(--background)",
									children: offenseMix.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Cell, { fill: PIE_TONES[i % PIE_TONES.length] }, i))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Tooltip, { contentStyle: tooltipStyle }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Legend, { wrapperStyle: { fontSize: 12 } })
							] })
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel rounded-3xl p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartHeading, {
						title: "Officer Performance",
						sub: "Citations issued by badge"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-72 w-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_lib.BarChart, {
								data: officerPerf,
								margin: {
									top: 12,
									right: 8,
									left: -16,
									bottom: 0
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.CartesianGrid, {
										strokeDasharray: "3 3",
										stroke: "var(--border)",
										vertical: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.XAxis, {
										dataKey: "name",
										tick: {
											fontSize: 10,
											fill: "var(--muted-foreground)"
										},
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.YAxis, {
										tick: {
											fontSize: 11,
											fill: "var(--muted-foreground)"
										},
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Tooltip, {
										contentStyle: tooltipStyle,
										cursor: { fill: "var(--panel-elevated)" }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Bar, {
										dataKey: "citations",
										fill: "var(--primary)",
										radius: [
											6,
											6,
											0,
											0
										]
									})
								]
							})
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel rounded-3xl p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartHeading, {
					title: "Daily Collected Revenue",
					sub: "Paid citations only · PHP"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_lib.BarChart, {
							data: trend,
							margin: {
								top: 12,
								right: 8,
								left: 0,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "var(--border)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.XAxis, {
									dataKey: "day",
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.YAxis, {
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Tooltip, {
									contentStyle: tooltipStyle,
									cursor: { fill: "var(--panel-elevated)" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.Bar, {
									dataKey: "revenue",
									fill: "var(--success)",
									radius: [
										6,
										6,
										0,
										0
									]
								})
							]
						})
					})
				})]
			})
		]
	});
}
var tooltipStyle = {
	background: "var(--panel-elevated)",
	border: "1px solid var(--border)",
	borderRadius: 12,
	fontSize: 12,
	color: "var(--foreground)"
};
function ChartHeading({ title, sub }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-semibold text-foreground",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
			children: sub
		})]
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
			className: "mt-3 font-mono-tab text-3xl font-bold tracking-tighter text-foreground",
			children: value
		})]
	});
}
//#endregion
export { AnalyticsPage as component };
