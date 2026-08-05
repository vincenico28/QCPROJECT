import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { O as isRedirect, g as Link, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as createServerFn, r as getServerFnById, t as TSS_SERVER_FUNCTION } from "./server.mjs";
import { t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as formatPeso, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
//#region dist/server/assets/lookup-CCitEAz7.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var schema = objectType({
	plate: stringType().trim().min(3).max(12),
	reference: stringType().trim().min(4).max(32)
});
/**
* Public motorist lookup. Requires BOTH the plate number and the exact citation
* reference, so a citation can only be read by someone already holding the
* ticket. Only non-sensitive columns are returned (no officer, no violation id).
*/
var lookupCitation = createServerFn({ method: "POST" }).inputValidator((data) => schema.parse(data)).handler(createSsrRpc("f76b2e957fbc579340314e4efc58ef0a13bf26646c0e0c8dfc5933d699117528"));
function LookupPage() {
	const [plate, setPlate] = (0, import_react.useState)("");
	const [reference, setReference] = (0, import_react.useState)("");
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [result, setResult] = (0, import_react.useState)(null);
	const run = useServerFn(lookupCitation);
	const search = useMutation({
		mutationFn: (input) => run({ data: input }),
		onSuccess: (row) => {
			setResult(row);
			setNotFound(!row);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-3xl items-center justify-between px-6 py-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "inline-flex items-center gap-2 text-xs text-subtle transition-colors hover:text-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowLeft, { className: "size-3.5" }), "Back to home"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
					children: "QC LGU · Public Service"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold tracking-tight text-foreground",
					children: "Citation Lookup"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted-foreground",
					children: "Enter your plate number and the citation reference printed on your ticket or SMS notice to view the offense, amount due and payment status."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (e) => {
						e.preventDefault();
						setNotFound(false);
						setResult(null);
						search.mutate({
							plate: plate.trim(),
							reference: reference.trim()
						});
					},
					className: "panel grid gap-4 rounded-2xl p-6 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
								children: "Plate number"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: plate,
								onChange: (e) => setPlate(e.target.value.toUpperCase()),
								placeholder: "ABC1234",
								className: inputClass
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
								children: "Citation reference"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: reference,
								onChange: (e) => setReference(e.target.value.toUpperCase()),
								placeholder: "QC-2026-000123",
								className: inputClass
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: search.isPending || plate.trim().length < 3 || reference.trim().length < 4,
								className: "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50",
								children: [search.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "size-4" }), "Look up citation"]
							})
						})
					]
				}),
				search.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger",
					children: "Lookup failed. Please check your details and try again."
				}),
				notFound && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-xl border border-border bg-panel p-6 text-sm text-muted-foreground",
					children: "No citation matches that plate and reference. Double-check the reference code, or visit the QC LGU enforcement office for assistance."
				}),
				result && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CitationCard, { citation: result }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-start gap-2 text-xs text-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ShieldCheck, { className: "mt-0.5 size-3.5 shrink-0" }), "For your privacy, records are only shown when the plate number and the exact citation reference match. Enforcement data is otherwise restricted to authorized QC LGU personnel."]
				})
			]
		})]
	});
}
function CitationCard({ citation }) {
	const tone = citation.status === "paid" ? "border-success/30 bg-success/10 text-success" : citation.status === "contested" ? "border-warning/30 bg-warning/10 text-warning" : "border-danger/30 bg-danger/10 text-danger";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "panel flex flex-col gap-5 rounded-2xl p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.FileText, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono-tab text-sm font-bold text-foreground",
						children: citation.citation_number
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("rounded-full border px-2.5 py-1 font-mono-tab text-[10px] font-bold uppercase tracking-widest", tone),
					children: citation.status
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid grid-cols-2 gap-5 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Plate",
						value: citation.plate_number
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Vehicle",
						value: citation.vehicle_model ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Issued",
						value: new Date(citation.issued_at).toLocaleDateString("en-PH", {
							year: "numeric",
							month: "short",
							day: "numeric"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Amount",
						value: formatPeso(citation.amount)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-background/40 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
					children: "Offense"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-foreground",
					children: citation.offense
				})]
			}),
			citation.status !== "paid" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Settle this citation at any QC LGU treasury window or authorized payment center. Bring a valid ID and this reference number."
			})
		]
	});
}
function Detail({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "mt-1 font-mono-tab text-sm font-semibold text-foreground",
		children: value
	})] });
}
var inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 font-mono-tab text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20";
//#endregion
export { LookupPage as component };
