import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link, v as useParams } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as useCitations, n as formatPeso, r as timeAgo, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { r as DispatchDialog } from "./router-CsIn8Ssg.mjs";
//#region dist/server/assets/vehicles._plate-CXzocn14.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
function VehicleDetailPage() {
	const { plate } = useParams({ from: "/vehicles/$plate" });
	const { data: violations = [], isLoading: vLoading } = useViolations(500);
	const { data: citations = [], isLoading: cLoading } = useCitations(500);
	const own = (0, import_react.useMemo)(() => violations.filter((v) => v.plate_number === plate), [violations, plate]);
	const ownCitations = (0, import_react.useMemo)(() => citations.filter((c) => c.plate_number === plate), [citations, plate]);
	const outstanding = ownCitations.filter((c) => c.status === "unpaid" || c.status === "overdue").reduce((s, c) => s + Number(c.amount), 0);
	const paid = ownCitations.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
	const totalRecords = own.length + ownCitations.length;
	const unpaidCount = ownCitations.filter((c) => c.status === "unpaid" || c.status === "overdue").length;
	const risk = outstanding >= 5e3 || unpaidCount >= 3 ? "blocked" : totalRecords >= 4 || outstanding > 0 ? "flagged" : totalRecords >= 2 ? "watch" : "clean";
	const model = ownCitations.find((c) => c.vehicle_model)?.vehicle_model ?? null;
	const timeline = (0, import_react.useMemo)(() => {
		const items = [...own.map((v) => ({
			kind: "detection",
			at: v.detected_at,
			title: v.violation_type,
			location: v.location,
			meta: `${Math.round(Number(v.confidence) * (Number(v.confidence) <= 1 ? 100 : 1))}% AI · ${v.camera_code ?? "—"}`,
			status: v.status
		})), ...ownCitations.map((c) => ({
			kind: "citation",
			at: c.issued_at,
			title: `${c.citation_number} — ${c.offense}`,
			location: c.officer_name ?? "Unassigned officer",
			meta: formatPeso(Number(c.amount)),
			status: c.status
		}))];
		items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
		return items;
	}, [own, ownCitations]);
	const lastSeen = timeline[0];
	if (vLoading || cLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-64 place-items-center text-sm text-subtle",
		children: "Loading vehicle record…"
	});
	if (totalRecords === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-4 p-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-subtle",
			children: [
				"No enforcement record found for plate ",
				plate,
				"."
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/vehicles",
			className: "rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-panel-elevated",
			children: "Back to registry"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/vehicles",
				className: "inline-flex w-fit items-center gap-2 text-xs text-subtle transition-colors hover:text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowLeft, { className: "size-3.5" }), " Vehicle registry"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-14 place-items-center rounded-xl bg-primary/10 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Car, {
							className: "size-6",
							strokeWidth: 1.8
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-mono-tab text-2xl font-semibold tracking-tight text-foreground",
						children: plate
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: model ?? "Vehicle model unknown" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase", risk === "clean" ? "bg-success/10 text-success border-success/30" : risk === "watch" ? "bg-primary/10 text-primary border-primary/30" : risk === "flagged" ? "bg-warning/10 text-warning border-warning/30" : "bg-danger/10 text-danger border-danger/30"),
								children: risk
							}),
							lastSeen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: "·"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Last seen ", timeAgo(lastSeen.at)] })] })
						]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DispatchDialog, { trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Radio, { className: "size-4" }), " Dispatch intercept"]
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: import_lucide_react.ShieldAlert,
						label: "AI Detections",
						value: own.length.toLocaleString(),
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: import_lucide_react.CreditCard,
						label: "Citations Issued",
						value: ownCitations.length.toLocaleString(),
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: import_lucide_react.Ban,
						label: "Outstanding",
						value: formatPeso(outstanding),
						tone: outstanding > 0 ? "danger" : "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: import_lucide_react.CreditCard,
						label: "Settled",
						value: formatPeso(paid),
						tone: "success"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[1.4fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel rounded-2xl p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-mono-tab text-[11px] font-semibold uppercase tracking-widest text-subtle",
						children: "Enforcement Timeline"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-5 flex flex-col gap-4",
						children: timeline.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("mt-1 grid size-7 shrink-0 place-items-center rounded-lg", t.kind === "citation" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"),
									children: t.kind === "citation" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.CreditCard, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Camera, { className: "size-3.5" })
								}), i < timeline.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1 w-px flex-1 bg-border" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 pb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium text-foreground",
										children: t.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
										children: timeAgo(t.at)
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.MapPin, { className: "size-3 text-subtle" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.location }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-subtle",
											children: "·"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono-tab",
											children: t.meta
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-subtle",
											children: "·"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono-tab uppercase",
											children: t.status
										})
									]
								})]
							})]
						}, `${t.kind}-${i}`))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel rounded-2xl p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-mono-tab text-[11px] font-semibold uppercase tracking-widest text-subtle",
							children: "Citation Ledger"
						}),
						ownCitations.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-sm text-subtle",
							children: "No citations issued to this vehicle."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 flex flex-col gap-3",
							children: ownCitations.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border bg-panel-elevated/40 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono-tab text-sm font-semibold text-foreground",
											children: c.citation_number
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase", c.status === "paid" ? "border-success/30 bg-success/10 text-success" : c.status === "overdue" ? "border-danger/30 bg-danger/10 text-danger" : "border-warning/30 bg-warning/10 text-warning"),
											children: c.status
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 text-sm text-muted-foreground",
										children: c.offense
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex items-center justify-between text-xs text-subtle",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.officer_name ?? "Unassigned" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono-tab text-foreground",
											children: formatPeso(Number(c.amount))
										})]
									})
								]
							}, c.id))
						})
					]
				})]
			})
		]
	});
}
function Stat({ icon: Icon, label, value, tone }) {
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
				className: cn("grid size-9 place-items-center rounded-lg", tone === "danger" ? "text-danger bg-danger/10" : tone === "warning" ? "text-warning bg-warning/10" : tone === "success" ? "text-success bg-success/10" : "text-primary bg-primary/10"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-4",
					strokeWidth: 2
				})
			})]
		})
	});
}
//#endregion
export { VehicleDetailPage as component };
