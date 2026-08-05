import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as useCitations, n as formatPeso, r as timeAgo, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
//#region dist/server/assets/citations-DGjbQDZu.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var STATUSES = [
	"all",
	"unpaid",
	"paid",
	"contested",
	"overdue"
];
function CitationsPage() {
	const { data: citations = [], isLoading } = useCitations(200);
	const [status, setStatus] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const filtered = (0, import_react.useMemo)(() => {
		return citations.filter((c) => {
			if (status !== "all" && c.status !== status) return false;
			if (!q) return true;
			const n = q.toLowerCase();
			return c.citation_number.toLowerCase().includes(n) || c.plate_number.toLowerCase().includes(n) || c.offense.toLowerCase().includes(n) || (c.officer_name ?? "").toLowerCase().includes(n);
		});
	}, [
		citations,
		status,
		q
	]);
	const stats = (0, import_react.useMemo)(() => {
		const total = citations.reduce((s, c) => s + Number(c.amount), 0);
		const paid = citations.filter((c) => c.status === "paid");
		const paidSum = paid.reduce((s, c) => s + Number(c.amount), 0);
		const unpaidSum = citations.filter((c) => c.status === "unpaid" || c.status === "overdue").reduce((s, c) => s + Number(c.amount), 0);
		const collectionRate = total > 0 ? paidSum / total * 100 : 0;
		return {
			issued: citations.length,
			total,
			paidSum,
			unpaidSum,
			collectionRate,
			counts: {
				all: citations.length,
				unpaid: citations.filter((c) => c.status === "unpaid").length,
				paid: paid.length,
				contested: citations.filter((c) => c.status === "contested").length,
				overdue: citations.filter((c) => c.status === "overdue").length
			}
		};
	}, [citations]);
	function exportCsv() {
		const csv = [[
			"Citation",
			"Plate",
			"Vehicle",
			"Offense",
			"Amount",
			"Status",
			"Officer",
			"Issued"
		], ...filtered.map((c) => [
			c.citation_number,
			c.plate_number,
			c.vehicle_model ?? "",
			c.offense,
			String(c.amount),
			c.status,
			c.officer_name ?? "",
			new Date(c.issued_at).toISOString()
		])].map((r) => r.map((v) => `"${String(v).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `citations-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: "Citations Issued",
						value: stats.issued.toLocaleString(),
						icon: import_lucide_react.Receipt,
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: "Revenue Collected",
						value: formatPeso(stats.paidSum),
						icon: import_lucide_react.CheckCircle2,
						tone: "success",
						sub: `${stats.collectionRate.toFixed(1)}% collection rate`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: "Outstanding",
						value: formatPeso(stats.unpaidSum),
						icon: import_lucide_react.Clock,
						tone: "warning",
						sub: `${stats.counts.unpaid + stats.counts.overdue} tickets`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: "Total Billed",
						value: formatPeso(stats.total),
						icon: import_lucide_react.TrendingUp,
						tone: "primary"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1 overflow-x-auto",
					children: STATUSES.map((s) => {
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setStatus(s),
							className: cn("shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors", status === s ? "bg-primary/15 text-primary" : "text-subtle hover:bg-panel-elevated hover:text-foreground"),
							children: [s, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 rounded bg-panel-elevated px-1.5 py-0.5 text-[9px] text-muted-foreground",
								children: stats.counts[s]
							})]
						}, s);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "relative flex items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "pointer-events-none absolute left-3 size-4 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "Search citation, plate, officer…",
							className: "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: exportCsv,
						className: "inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Download, { className: "size-4" }), " Export"]
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
								"Citation #",
								"Plate",
								"Vehicle",
								"Offense",
								"Amount",
								"Officer",
								"Issued",
								"Status"
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
									children: "Loading citations…"
								}) }),
								!isLoading && filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CitationRow, { c }, c.id)),
								!isLoading && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 8,
									className: "p-8 text-center text-sm text-subtle",
									children: "No citations match your filters."
								}) })
							]
						})]
					})
				})
			})
		]
	});
}
function KpiCard({ label, value, icon: Icon, tone, sub }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "panel rounded-2xl p-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 text-2xl font-semibold tracking-tight text-foreground",
					children: value
				}),
				sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 font-mono-tab text-[11px] text-muted-foreground",
					children: sub
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("grid size-9 place-items-center rounded-lg", tone === "success" ? "text-success bg-success/10" : tone === "warning" ? "text-warning bg-warning/10" : "text-primary bg-primary/10"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-4",
					strokeWidth: 2
				})
			})]
		})
	});
}
function CitationRow({ c }) {
	const statusTone = c.status === "paid" ? "bg-success/10 text-success border-success/30" : c.status === "contested" ? "bg-primary/10 text-primary border-primary/30" : c.status === "overdue" ? "bg-danger/10 text-danger border-danger/30" : "bg-warning/10 text-warning border-warning/30";
	const StatusIcon = c.status === "paid" ? import_lucide_react.CheckCircle2 : c.status === "overdue" ? import_lucide_react.XCircle : import_lucide_react.Clock;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "text-sm transition-colors hover:bg-panel-elevated/50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 font-mono-tab text-foreground",
				children: c.citation_number
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 font-mono-tab text-foreground",
				children: c.plate_number
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-muted-foreground",
				children: c.vehicle_model ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-foreground",
				children: c.offense
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 font-mono-tab text-foreground",
				children: formatPeso(Number(c.amount))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-muted-foreground",
				children: c.officer_name ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-foreground",
					children: timeAgo(c.issued_at)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono-tab text-[10px] text-subtle",
					children: new Date(c.issued_at).toLocaleDateString("en-PH")
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase", statusTone),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, { className: "size-3" }), c.status]
				})
			})
		]
	});
}
//#endregion
export { CitationsPage as component };
