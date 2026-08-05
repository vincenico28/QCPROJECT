import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { o as useOfficers, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
//#region dist/server/assets/officers.index-CcbCHB5V.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var FILTERS = [
	"all",
	"on_duty",
	"active",
	"on_leave",
	"suspended"
];
var LABELS = {
	all: "All",
	on_duty: "On duty",
	active: "Active",
	on_leave: "On leave",
	suspended: "Suspended"
};
function OfficersPage() {
	const { data: officers = [], isLoading } = useOfficers();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const counts = (0, import_react.useMemo)(() => ({
		all: officers.length,
		on_duty: officers.filter((o) => o.on_duty).length,
		active: officers.filter((o) => o.status === "active").length,
		on_leave: officers.filter((o) => o.status === "on_leave").length,
		suspended: officers.filter((o) => o.status === "suspended").length
	}), [officers]);
	const totalCitations = (0, import_react.useMemo)(() => officers.reduce((sum, o) => sum + o.citations_issued, 0), [officers]);
	const filtered = (0, import_react.useMemo)(() => {
		const needle = q.toLowerCase();
		return officers.filter((o) => {
			if (filter === "on_duty" && !o.on_duty) return false;
			if (filter !== "all" && filter !== "on_duty" && o.status !== filter) return false;
			if (!needle) return true;
			return o.full_name.toLowerCase().includes(needle) || o.badge_number.includes(needle) || o.unit.toLowerCase().includes(needle) || o.district.toLowerCase().includes(needle);
		});
	}, [
		officers,
		filter,
		q
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Personnel",
						value: officers.length,
						icon: import_lucide_react.Users
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "On duty now",
						value: counts.on_duty,
						icon: import_lucide_react.Activity,
						tone: "text-success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Citations issued",
						value: totalCitations,
						icon: import_lucide_react.ShieldCheck,
						tone: "text-primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Avg per officer",
						value: officers.length ? Math.round(totalCitations / officers.length) : 0,
						icon: import_lucide_react.Activity,
						tone: "text-warning"
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
						children: [LABELS[f], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 rounded bg-panel-elevated px-1.5 py-0.5 text-[9px] text-muted-foreground",
							children: counts[f]
						})]
					}, f))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "relative flex items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "pointer-events-none absolute left-3 size-4 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search name, badge, unit…",
						className: "w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-80"
					})]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel grid h-64 place-items-center rounded-2xl text-sm text-subtle",
				children: "Loading personnel roster…"
			}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel grid h-64 place-items-center rounded-2xl text-sm text-subtle",
				children: "No officers match the current filters."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel overflow-hidden rounded-2xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[900px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 font-medium",
									children: "Officer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 font-medium",
									children: "Rank"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 font-medium",
									children: "Unit"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 font-medium",
									children: "District"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 font-medium",
									children: "Contact"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 text-right font-medium",
									children: "Citations"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 font-medium",
									children: "Status"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficerRow, { officer: o }, o.id)) })]
					})
				})
			})
		]
	});
}
function initials(name) {
	return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}
function OfficerRow({ officer }) {
	const statusTone = officer.status === "active" ? "text-success border-success/30 bg-success/10" : officer.status === "on_leave" ? "text-warning border-warning/30 bg-warning/10" : "text-danger border-danger/30 bg-danger/10";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "border-b border-border/60 transition-colors last:border-0 hover:bg-panel-elevated/60",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative grid size-9 shrink-0 place-items-center rounded-full bg-panel-elevated font-mono-tab text-[11px] font-bold text-foreground ring-1 ring-border",
						children: [initials(officer.full_name), officer.on_duty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-panel bg-success" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/officers/$badge",
							params: { badge: officer.badge_number },
							className: "truncate font-medium text-foreground transition-colors hover:text-primary",
							children: officer.full_name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
							children: ["Badge #", officer.badge_number]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3.5 text-muted-foreground",
				children: officer.rank
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3.5 text-muted-foreground",
				children: officer.unit
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3.5 font-mono-tab text-xs text-muted-foreground",
				children: officer.district
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3.5",
				children: officer.contact_number ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1.5 font-mono-tab text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Phone, { className: "size-3 text-subtle" }), officer.contact_number]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-subtle",
					children: "—"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3.5 text-right font-mono-tab font-semibold text-foreground",
				children: officer.citations_issued
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-start gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("rounded-md border px-2 py-0.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest", statusTone),
						children: officer.status.replace("_", " ")
					}), officer.on_duty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono-tab text-[9px] uppercase tracking-widest text-success",
						children: "● On duty"
					})]
				})
			})
		]
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
export { OfficersPage as component };
