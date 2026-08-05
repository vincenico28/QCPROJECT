import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as supabase } from "./client-BAxwUCp8.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as formatPeso, o as useOfficers, r as timeAgo, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as DialogContent, d as DialogHeader, f as DialogTitle, l as DialogDescription, s as Dialog, u as DialogFooter } from "./router-CsIn8Ssg.mjs";
//#region dist/server/assets/violations-BHnxNVOG.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
/** Standard QC LGU fine schedule (PHP) by offense type. */
var FINE_SCHEDULE = {
	"Red Light Jump": 3500,
	Overspeeding: 3e3,
	"No Entry Zone": 5e3,
	Counterflow: 2500,
	Obstruction: 2e3,
	"Illegal Parking": 1e3,
	"No Helmet": 1500,
	"Number Coding": 500
};
function fineFor(offense) {
	return FINE_SCHEDULE[offense] ?? 1e3;
}
function nextCitationNumber() {
	return `QC-${Math.floor(1e4 + Math.random() * 89999)}`;
}
function useReviewViolation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, status }) => {
			const { error } = await supabase.from("violations").update({ status }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["violations"] });
		}
	});
}
function useIssueCitation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (input) => {
			const { data, error } = await supabase.from("citations").insert({
				citation_number: nextCitationNumber(),
				violation_id: input.violation.id,
				plate_number: input.violation.plate_number,
				vehicle_model: input.vehicleModel,
				offense: input.offense,
				amount: input.amount,
				officer_name: input.officerName,
				status: "pending"
			}).select().single();
			if (error) throw error;
			const { error: vErr } = await supabase.from("violations").update({ status: "confirmed" }).eq("id", input.violation.id);
			if (vErr) throw vErr;
			return data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["violations"] });
			qc.invalidateQueries({ queryKey: ["citations"] });
		}
	});
}
function ViolationReviewDialog({ violation, onClose }) {
	const [offense, setOffense] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)(0);
	const [officerId, setOfficerId] = (0, import_react.useState)("");
	const [vehicleModel, setVehicleModel] = (0, import_react.useState)("");
	const { data: officers = [] } = useOfficers();
	const issue = useIssueCitation();
	const review = useReviewViolation();
	(0, import_react.useEffect)(() => {
		if (!violation) return;
		setOffense(violation.violation_type);
		setAmount(fineFor(violation.violation_type));
		setOfficerId("");
		setVehicleModel("");
	}, [violation]);
	if (!violation) return null;
	const v = violation;
	const conf = Number(v.confidence);
	async function confirmAndIssue() {
		const officer = officers.find((o) => o.id === officerId) ?? null;
		try {
			const row = await issue.mutateAsync({
				violation: v,
				offense: offense.trim() || v.violation_type,
				amount,
				officerName: officer ? `${officer.rank} ${officer.full_name}` : null,
				vehicleModel: vehicleModel.trim() || null
			});
			toast.success(`Citation ${row.citation_number} issued`, { description: `${v.plate_number} · ${formatPeso(row.amount)}` });
			onClose();
		} catch (err) {
			toast.error("Could not issue citation", { description: err instanceof Error ? err.message : void 0 });
		}
	}
	async function dismiss() {
		try {
			await review.mutateAsync({
				id: v.id,
				status: "dismissed"
			});
			toast.success(`Detection dismissed`, { description: v.plate_number });
			onClose();
		} catch (err) {
			toast.error("Could not dismiss detection", { description: err instanceof Error ? err.message : void 0 });
		}
	}
	const busy = issue.isPending || review.isPending;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl border-border bg-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2 text-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ShieldCheck, { className: "size-4 text-primary" }),
						"Review detection · ",
						v.plate_number
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
					className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
					children: [
						v.ai_detected ? "AI detection" : "Manual report",
						" · ",
						timeAgo(v.detected_at)
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-5 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-xl border border-border bg-background",
							children: v.evidence_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: v.evidence_url,
								alt: `Evidence capture for ${v.plate_number} — ${v.violation_type}`,
								className: "h-44 w-full object-cover",
								loading: "lazy"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-44 place-items-center text-xs text-subtle",
								children: "No evidence frame"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.MapPin, { className: "size-3.5 text-subtle" }),
										" ",
										v.location
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Camera, { className: "size-3.5 text-subtle" }),
										" ",
										v.camera_code ?? "No node"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono-tab",
									children: [
										"AI confidence:",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: cn("font-bold", conf >= 90 ? "text-success" : conf >= 80 ? "text-primary" : "text-warning"),
											children: [conf.toFixed(1), "%"]
										})
									]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Offense",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: offense,
									onChange: (e) => {
										setOffense(e.target.value);
										setAmount(fineFor(e.target.value));
									},
									className: inputClass
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Fine amount (PHP)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 0,
									step: 100,
									value: amount,
									onChange: (e) => setAmount(Number(e.target.value)),
									className: inputClass
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Issuing officer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: officerId,
									onChange: (e) => setOfficerId(e.target.value),
									className: inputClass,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "System-issued (no officer)"
									}), officers.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: o.id,
										children: [
											o.badge_number,
											" · ",
											o.rank,
											" ",
											o.full_name
										]
									}, o.id))]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Vehicle model (optional)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: vehicleModel,
									onChange: (e) => setVehicleModel(e.target.value),
									placeholder: "e.g. Toyota Vios 2019",
									className: inputClass
								})
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: dismiss,
						disabled: busy,
						className: "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-danger disabled:opacity-50",
						children: [review.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.XCircle, { className: "size-4" }), "Dismiss detection"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: confirmAndIssue,
						disabled: busy || amount <= 0,
						className: "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50",
						children: [issue.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ShieldCheck, { className: "size-4" }), "Confirm & issue citation"]
					})]
				})
			]
		})
	});
}
var inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20";
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
			children: label
		}), children]
	});
}
var STATUSES = [
	"all",
	"pending",
	"confirmed",
	"dismissed"
];
function ViolationsPage() {
	const { data: violations = [], isLoading } = useViolations(100);
	const [status, setStatus] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const [review, setReview] = (0, import_react.useState)(null);
	const filtered = (0, import_react.useMemo)(() => {
		return violations.filter((v) => {
			if (status !== "all" && v.status !== status) return false;
			if (!q) return true;
			const needle = q.toLowerCase();
			return v.plate_number.toLowerCase().includes(needle) || v.violation_type.toLowerCase().includes(needle) || v.location.toLowerCase().includes(needle);
		});
	}, [
		violations,
		status,
		q
	]);
	const counts = (0, import_react.useMemo)(() => {
		return {
			all: violations.length,
			pending: violations.filter((v) => v.status === "pending").length,
			confirmed: violations.filter((v) => v.status === "confirmed").length,
			dismissed: violations.filter((v) => v.status === "dismissed").length
		};
	}, [violations]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [
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
								children: counts[s]
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
							placeholder: "Search plate, type, location…",
							className: "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Filter, { className: "size-4" }), " Filters"]
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
								"Detected",
								"Plate",
								"Violation",
								"Location",
								"Camera",
								"AI",
								"Status",
								""
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
									children: "Loading detections…"
								}) }),
								!isLoading && filtered.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViolationRow, {
									v,
									onReview: () => setReview(v)
								}, v.id)),
								!isLoading && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 8,
									className: "p-8 text-center text-sm text-subtle",
									children: "No violations match your filters."
								}) })
							]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViolationReviewDialog, {
				violation: review,
				onClose: () => setReview(null)
			})
		]
	});
}
function ViolationRow({ v, onReview }) {
	const conf = Number(v.confidence);
	const confTone = conf >= 90 ? "text-success" : conf >= 80 ? "text-primary" : "text-warning";
	const statusTone = v.status === "confirmed" ? "bg-success/10 text-success border-success/30" : v.status === "dismissed" ? "bg-muted text-muted-foreground border-border" : "bg-warning/10 text-warning border-warning/30";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "text-sm transition-colors hover:bg-panel-elevated/50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-foreground",
					children: timeAgo(v.detected_at)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono-tab text-[10px] text-subtle",
					children: new Date(v.detected_at).toLocaleTimeString("en-PH")
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 font-mono-tab text-foreground",
				children: v.plate_number
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-foreground",
				children: v.violation_type
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-muted-foreground",
				children: v.location
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 font-mono-tab text-muted-foreground",
				children: v.camera_code ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("font-mono-tab text-xs font-semibold", confTone),
					children: [conf.toFixed(1), "%"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase", statusTone),
					children: v.status
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-5 py-3 text-right",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onReview,
					className: "rounded-md border border-border px-3 py-1.5 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
					children: "Review"
				})
			})
		]
	});
}
//#endregion
export { ViolationsPage as component };
