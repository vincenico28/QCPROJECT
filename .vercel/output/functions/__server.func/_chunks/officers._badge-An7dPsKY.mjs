import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link, v as useParams } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as useCitations, n as formatPeso, o as useOfficers, r as timeAgo, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { a as useDispatches, i as DISPATCH_STATUS_LABEL, r as DispatchDialog } from "./router-CsIn8Ssg.mjs";
//#region dist/server/assets/officers._badge-An7dPsKY.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
function OfficerDetailPage() {
	const { badge } = useParams({ from: "/officers/$badge" });
	const { data: officers = [], isLoading } = useOfficers();
	const { data: citations = [] } = useCitations(200);
	const { data: dispatches = [] } = useDispatches(200);
	const officer = officers.find((o) => o.badge_number === badge);
	const own = (0, import_react.useMemo)(() => officer ? citations.filter((c) => c.officer_name === officer.full_name) : [], [citations, officer]);
	const ownDispatches = (0, import_react.useMemo)(() => dispatches.filter((d) => d.badge_number === badge), [dispatches, badge]);
	const collected = own.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
	const outstanding = own.filter((c) => c.status !== "paid" && c.status !== "dismissed").reduce((s, c) => s + Number(c.amount), 0);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-64 place-items-center text-sm text-subtle",
		children: "Loading officer record…"
	});
	if (!officer) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-4 p-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-subtle",
			children: [
				"No officer found for badge #",
				badge,
				"."
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/officers",
			className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
			children: "Back to roster"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/officers",
				className: "flex w-fit items-center gap-2 font-mono-tab text-[11px] uppercase tracking-widest text-subtle transition-colors hover:text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowLeft, { className: "size-3.5" }), " Roster"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileHeader, { officer }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Citations issued",
						value: officer.citations_issued,
						icon: import_lucide_react.ShieldCheck,
						tone: "text-primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Collected",
						value: formatPeso(collected),
						icon: import_lucide_react.CreditCard,
						tone: "text-success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Outstanding",
						value: formatPeso(outstanding),
						icon: import_lucide_react.CreditCard,
						tone: "text-warning"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Dispatch orders",
						value: ownDispatches.length,
						icon: import_lucide_react.Radio,
						tone: "text-foreground"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 xl:grid-cols-[1.4fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel overflow-hidden rounded-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-center justify-between border-b border-border px-5 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold text-foreground",
							children: "Citations issued"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
							children: [own.length, " records"]
						})]
					}), own.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-5 py-10 text-center text-sm text-subtle",
						children: "No citations recorded for this officer yet."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[560px] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 font-medium",
										children: "Reference"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 font-medium",
										children: "Plate"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 font-medium",
										children: "Offense"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 text-right font-medium",
										children: "Amount"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 font-medium",
										children: "Status"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: own.slice(0, 25).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/60 last:border-0 hover:bg-panel-elevated/60",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-5 py-3 font-mono-tab text-xs text-primary",
										children: c.citation_number
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-5 py-3 font-mono-tab text-xs font-semibold text-foreground",
										children: c.plate_number
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-5 py-3 text-muted-foreground",
										children: c.offense
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-5 py-3 text-right font-mono-tab text-foreground",
										children: formatPeso(Number(c.amount))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-5 py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("rounded-md border px-2 py-0.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest", c.status === "paid" ? "border-success/30 bg-success/10 text-success" : c.status === "contested" ? "border-warning/30 bg-warning/10 text-warning" : "border-border bg-panel-elevated text-muted-foreground"),
											children: c.status
										})
									})
								]
							}, c.id)) })]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel flex flex-col rounded-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-center justify-between border-b border-border px-5 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold text-foreground",
							children: "Dispatch history"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
							children: ownDispatches.length
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-3 p-5",
						children: ownDispatches.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "py-8 text-center text-sm text-subtle",
							children: "No dispatch orders assigned."
						}) : ownDispatches.slice(0, 12).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border bg-panel-elevated/50 p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono-tab text-[10px] uppercase tracking-widest text-primary",
										children: d.reference
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
										children: DISPATCH_STATUS_LABEL[d.status]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 flex items-center gap-1.5 text-sm text-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.MapPin, { className: "size-3.5 text-subtle" }), d.location]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
									children: [
										d.priority,
										" · ",
										timeAgo(d.created_at)
									]
								})
							]
						}, d.id))
					})]
				})]
			})
		]
	});
}
function ProfileHeader({ officer }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative grid size-16 shrink-0 place-items-center rounded-2xl bg-panel-elevated font-mono-tab text-lg font-bold text-foreground ring-1 ring-border",
				children: [officer.full_name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(""), officer.on_duty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-panel bg-success" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "truncate text-2xl font-semibold tracking-tight text-foreground",
						children: officer.full_name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono-tab text-[11px] uppercase tracking-widest text-subtle",
						children: [
							"Badge #",
							officer.badge_number,
							" · ",
							officer.rank,
							" · ",
							officer.unit,
							" · ",
							officer.district
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("rounded-md border px-2 py-0.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest", officer.status === "active" ? "border-success/30 bg-success/10 text-success" : officer.status === "on_leave" ? "border-warning/30 bg-warning/10 text-warning" : "border-danger/30 bg-danger/10 text-danger"),
								children: officer.status.replace("_", " ")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5 font-mono-tab text-[11px] text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Activity, { className: "size-3.5 text-subtle" }), officer.on_duty ? "On duty" : "Off duty"]
							}),
							officer.contact_number && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5 font-mono-tab text-[11px] text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Phone, { className: "size-3.5 text-subtle" }), officer.contact_number]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DispatchDialog, { trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Radio, { className: "size-4" }), " Dispatch this officer"]
			}) })
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
			className: cn("mt-3 font-mono-tab text-2xl font-bold", tone),
			children: value
		})]
	});
}
//#endregion
export { OfficerDetailPage as component };
