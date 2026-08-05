import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, l as useRouterState, m as createFileRoute, p as lazyRouteComponent, s as Scripts, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as supabase } from "./client-BAxwUCp8.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { i as useQueryClient, n as useQuery, r as QueryClientProvider, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as useCitations, i as useCameras, n as formatPeso, o as useOfficers, r as timeAgo, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, c as DialogTrigger$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
import { t as _e } from "../_libs/cmdk.mjs";
//#region dist/server/assets/dialog-DuasTLNy.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var Dialog = Dialog$1;
var DialogTrigger = DialogTrigger$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
//#endregion
//#region dist/server/assets/router-CsIn8Ssg.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var styles_default = "/assets/styles-VsjlkeZ2.css";
function useAuth() {
	const [session, setSession] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
			setSession(s);
			setLoading(false);
		});
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	return {
		session,
		loading,
		user: session?.user ?? null
	};
}
function SignInScreen() {
	const [mode, setMode] = (0, import_react.useState)("signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [message, setMessage] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	async function onSubmit(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		setMessage(null);
		try {
			if (mode === "signin") {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (error) throw error;
			} else {
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
					options: { emailRedirectTo: window.location.origin }
				});
				if (error) throw error;
				if (!data.session) setMessage("Account created. Check your email to confirm access.");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 flex flex-col items-center text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-12 place-items-center overflow-hidden rounded-2xl shadow-lg shadow-primary/30",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/qc-favicon.webp",
							alt: "QC Logo",
							className: "size-full object-contain"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-5 text-2xl font-semibold tracking-tight text-foreground",
						children: "QC Traffic Operations"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono-tab text-[11px] uppercase tracking-widest text-subtle",
						children: "Restricted · Authorized personnel only"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "panel rounded-2xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-5 flex rounded-lg border border-border bg-panel p-1",
						children: ["signin", "signup"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMode(m),
							className: cn("flex-1 rounded-md px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors", mode === m ? "bg-primary/15 text-primary" : "text-subtle hover:text-foreground"),
							children: m === "signin" ? "Sign in" : "Register"
						}, m))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
							children: "Official email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							required: true,
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "officer@quezoncity.gov.ph",
							className: "mt-1.5 w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-4 block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							required: true,
							minLength: 6,
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "••••••••",
							className: "mt-1.5 w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger",
						children: error
					}),
					message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success",
						children: message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "submit",
						disabled: busy,
						className: "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-60",
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Loader2, { className: "size-4 animate-spin" }), mode === "signin" ? "Access command center" : "Create account"]
					})
				]
			})]
		})
	});
}
var DISPATCH_STATUS_LABEL = {
	queued: "Queued",
	en_route: "En Route",
	on_scene: "On Scene",
	resolved: "Resolved",
	cancelled: "Cancelled"
};
function useDispatches(limit = 50) {
	return useQuery({
		queryKey: ["dispatches", limit],
		queryFn: async () => {
			const { data, error } = await supabase.from("dispatches").select("*").order("created_at", { ascending: false }).limit(limit);
			if (error) throw error;
			return data ?? [];
		},
		refetchInterval: 2e4
	});
}
function useCreateDispatch() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (input) => {
			const { data: auth } = await supabase.auth.getUser();
			const { data, error } = await supabase.from("dispatches").insert({
				...input,
				created_by: auth.user?.id ?? null
			}).select().single();
			if (error) throw error;
			return data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] })
	});
}
function useUpdateDispatchStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, status }) => {
			const patch = { status };
			if (status === "en_route" || status === "on_scene") patch.acknowledged_at = (/* @__PURE__ */ new Date()).toISOString();
			if (status === "resolved" || status === "cancelled") patch.resolved_at = (/* @__PURE__ */ new Date()).toISOString();
			const { error } = await supabase.from("dispatches").update(patch).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] })
	});
}
var PRIORITIES = [
	"low",
	"medium",
	"high",
	"critical"
];
function DispatchDialog({ trigger }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [officerId, setOfficerId] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [violationId, setViolationId] = (0, import_react.useState)("");
	const [priority, setPriority] = (0, import_react.useState)("medium");
	const [instructions, setInstructions] = (0, import_react.useState)("");
	const { data: officers = [] } = useOfficers();
	const { data: violations = [] } = useViolations(15);
	const create = useCreateDispatch();
	const available = officers.filter((o) => o.status !== "off_duty");
	function reset() {
		setOfficerId("");
		setLocation("");
		setViolationId("");
		setPriority("medium");
		setInstructions("");
	}
	async function submit(e) {
		e.preventDefault();
		const officer = officers.find((o) => o.id === officerId) ?? null;
		if (!location.trim()) {
			toast.error("Location is required");
			return;
		}
		try {
			const row = await create.mutateAsync({
				officer_id: officer?.id ?? null,
				officer_name: officer?.full_name ?? null,
				badge_number: officer?.badge_number ?? null,
				location: location.trim(),
				priority,
				instructions: instructions.trim() || null,
				violation_id: violationId || null
			});
			toast.success(`Dispatch ${row.reference} sent`, { description: officer ? `${officer.rank} ${officer.full_name} · ${location}` : `Unassigned · ${location}` });
			reset();
			setOpen(false);
		} catch (err) {
			toast.error("Dispatch failed", { description: err instanceof Error ? err.message : "Please try again." });
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: (o) => {
			setOpen(o);
			if (!o) reset();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-lg border-border bg-panel",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2 text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Radio, { className: "size-4 text-primary" }), "Dispatch Officer"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
				className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
				children: "QC LGU · Field assignment order"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Officer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: officerId,
							onChange: (e) => setOfficerId(e.target.value),
							className: inputClass,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Unassigned · nearest unit"
							}), available.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: o.id,
								children: [
									o.badge_number,
									" · ",
									o.rank,
									" ",
									o.full_name,
									" (",
									o.district,
									")"
								]
							}, o.id))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Location",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: location,
							onChange: (e) => setLocation(e.target.value),
							placeholder: "e.g. Commonwealth Ave cor. Tandang Sora",
							className: inputClass
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Link violation (optional)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: violationId,
							onChange: (e) => {
								setViolationId(e.target.value);
								const v = violations.find((x) => x.id === e.target.value);
								if (v && !location) setLocation(v.location);
							},
							className: inputClass,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "No linked detection"
							}), violations.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: v.id,
								children: [
									v.plate_number,
									" · ",
									v.violation_type,
									" · ",
									v.location
								]
							}, v.id))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Priority",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2",
							children: PRIORITIES.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPriority(p),
								className: cn("flex-1 rounded-lg border px-2 py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest transition-colors", priority === p ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-subtle hover:text-foreground"),
								children: p
							}, p))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Instructions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: instructions,
							onChange: (e) => setInstructions(e.target.value),
							rows: 3,
							placeholder: "Situation brief, required equipment, contact…",
							className: cn(inputClass, "resize-none")
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "submit",
						disabled: create.isPending,
						className: "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-60",
						children: [create.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Loader2, { className: "size-4 animate-spin" }), "Send dispatch"]
					}) })
				]
			})]
		})]
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
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
var READ_KEY = "qc-alerts-read-at";
function NotificationsMenu() {
	const navigate = useNavigate();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [readAt, setReadAt] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return 0;
		return Number(window.localStorage.getItem(READ_KEY) ?? 0);
	});
	const { data: violations = [] } = useViolations(40);
	const { data: dispatches = [] } = useDispatches(30);
	const { data: cameras = [] } = useCameras();
	const alerts = (0, import_react.useMemo)(() => {
		const items = [];
		for (const v of violations) {
			if (v.status !== "pending") continue;
			const conf = Number(v.confidence);
			items.push({
				id: `v-${v.id}`,
				kind: "violation",
				title: `${v.violation_type} · ${v.plate_number}`,
				detail: `${v.location} · ${conf.toFixed(1)}% confidence`,
				at: v.detected_at,
				severity: conf >= 92 ? "critical" : "warning",
				to: "/violations"
			});
		}
		for (const d of dispatches) {
			if (d.status !== "queued" && d.status !== "en_route") continue;
			items.push({
				id: `d-${d.id}`,
				kind: "dispatch",
				title: `${d.priority === "critical" ? "Critical " : ""}Dispatch ${d.reference}`,
				detail: `${d.location} · ${d.officer_name ?? "Unassigned"}`,
				at: d.created_at,
				severity: d.priority === "critical" ? "critical" : "info",
				to: "/dispatch"
			});
		}
		for (const c of cameras) {
			if (c.status === "online") continue;
			items.push({
				id: `c-${c.id}`,
				kind: "camera",
				title: `Node ${c.code} ${c.status}`,
				detail: c.location,
				at: (/* @__PURE__ */ new Date()).toISOString(),
				severity: "warning",
				to: `/cameras/${c.code}`
			});
		}
		return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);
	}, [
		violations,
		dispatches,
		cameras
	]);
	const unread = alerts.filter((a) => new Date(a.at).getTime() > readAt).length;
	const markRead = () => {
		const now = Date.now();
		setReadAt(now);
		if (typeof window !== "undefined") window.localStorage.setItem(READ_KEY, String(now));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: (v) => {
			setOpen(v);
			if (v) markRead();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "relative grid size-10 place-items-center rounded-xl border border-border bg-panel text-subtle transition-colors hover:text-foreground",
				"aria-label": `Notifications${unread ? `, ${unread} unread` : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Bell, {
					className: "size-4",
					strokeWidth: 2
				}), unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 font-mono-tab text-[9px] font-bold text-white",
					children: unread > 9 ? "9+" : unread
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
			align: "end",
			className: "w-[22rem] border-border bg-panel p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono-tab text-[11px] font-semibold uppercase tracking-widest text-subtle",
					children: "Live Alerts"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono-tab text-[10px] text-muted-foreground",
					children: [alerts.length, " active"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-[24rem] divide-y divide-border overflow-y-auto",
				children: [alerts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-2 p-8 text-center text-sm text-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.CheckCheck, { className: "size-5 text-success" }), "All clear — no open alerts."]
				}), alerts.map((a) => {
					const Icon = a.kind === "dispatch" ? import_lucide_react.Radio : a.kind === "camera" ? import_lucide_react.VideoOff : import_lucide_react.AlertTriangle;
					const tone = a.severity === "critical" ? "text-danger" : a.severity === "warning" ? "text-warning" : "text-primary";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setOpen(false);
							navigate({ to: a.to });
						},
						className: "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-panel-elevated",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("mt-0.5 size-4 shrink-0", tone) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate text-sm font-medium text-foreground",
									children: a.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate text-xs text-muted-foreground",
									children: a.detail
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 font-mono-tab text-[10px] text-subtle",
								children: timeAgo(a.at)
							})
						]
					}, a.id);
				})]
			})]
		})]
	});
}
var Command$2 = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$2.displayName = _e.displayName;
var CommandDialog = ({ children, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "overflow-hidden p-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command$2, {
				className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
				children
			})
		})
	});
};
var CommandInput = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
		ref,
		className: cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = _e.Input.displayName;
var CommandList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = _e.List.displayName;
var CommandEmpty = import_react.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = _e.Empty.displayName;
var CommandGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = _e.Group.displayName;
var CommandSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = _e.Separator.displayName;
var CommandItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
	ref,
	className: cn("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", className),
	...props
}));
CommandItem.displayName = _e.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
var PAGES = [
	{
		to: "/dashboard",
		label: "Command Dashboard",
		icon: import_lucide_react.LayoutDashboard
	},
	{
		to: "/violations",
		label: "Violations",
		icon: import_lucide_react.FileText
	},
	{
		to: "/citations",
		label: "Citations",
		icon: import_lucide_react.CreditCard
	},
	{
		to: "/cameras",
		label: "Cameras",
		icon: import_lucide_react.Video
	},
	{
		to: "/map",
		label: "GIS Map",
		icon: import_lucide_react.Map
	},
	{
		to: "/vehicles",
		label: "Vehicles",
		icon: import_lucide_react.Car
	},
	{
		to: "/officers",
		label: "Officers",
		icon: import_lucide_react.Users
	},
	{
		to: "/dispatch",
		label: "Dispatch",
		icon: import_lucide_react.Radio
	},
	{
		to: "/analytics",
		label: "Analytics",
		icon: import_lucide_react.BarChart3
	}
];
function useCommandPalette() {
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return {
		open,
		setOpen
	};
}
function CommandPalette({ open, onOpenChange }) {
	const navigate = useNavigate();
	const { data: violations = [] } = useViolations(100);
	const { data: citations = [] } = useCitations(100);
	const { data: cameras = [] } = useCameras();
	const { data: officers = [] } = useOfficers();
	const plates = (0, import_react.useMemo)(() => {
		const seen = /* @__PURE__ */ new Map();
		for (const v of violations) seen.set(v.plate_number, (seen.get(v.plate_number) ?? 0) + 1);
		for (const c of citations) seen.set(c.plate_number, (seen.get(c.plate_number) ?? 0) + 1);
		return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([plate, count]) => ({
			plate,
			count
		}));
	}, [violations, citations]);
	const goPlate = (plate) => {
		onOpenChange(false);
		navigate({
			to: "/vehicles/$plate",
			params: { plate }
		});
	};
	const go = (to) => {
		onOpenChange(false);
		navigate({ to });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandDialog, {
		open,
		onOpenChange,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandInput, { placeholder: "Search plates, citations, cameras, officers…" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandList, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandEmpty, { children: "No matches found." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
				heading: "Navigate",
				children: PAGES.map((p) => {
					const Icon = p.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
						value: `nav ${p.label}`,
						onSelect: () => go(p.to),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mr-2 size-4" }), p.label]
					}, p.to);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandSeparator, {}),
			plates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
				heading: "Plates",
				children: plates.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
					value: `plate ${p.plate}`,
					onSelect: () => goPlate(p.plate),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "mr-2 size-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab",
							children: p.plate
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-auto text-xs text-muted-foreground",
							children: [
								p.count,
								" record",
								p.count === 1 ? "" : "s"
							]
						})
					]
				}, p.plate))
			}),
			citations.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
				heading: "Citations",
				children: citations.slice(0, 10).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
					value: `citation ${c.citation_number} ${c.plate_number} ${c.offense}`,
					onSelect: () => go("/citations"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.CreditCard, { className: "mr-2 size-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab",
							children: c.citation_number
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 truncate text-xs text-muted-foreground",
							children: [
								c.plate_number,
								" · ",
								c.offense
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-auto font-mono-tab text-xs",
							children: formatPeso(Number(c.amount))
						})
					]
				}, c.id))
			}),
			cameras.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
				heading: "Cameras",
				children: cameras.slice(0, 10).map((cam) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
					value: `camera ${cam.code} ${cam.location}`,
					onSelect: () => go(`/cameras/${cam.code}`),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Video, { className: "mr-2 size-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono-tab",
							children: cam.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 truncate text-xs text-muted-foreground",
							children: cam.location
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-auto text-[10px] uppercase text-muted-foreground",
							children: cam.status
						})
					]
				}, cam.id))
			}),
			officers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
				heading: "Officers",
				children: officers.slice(0, 10).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
					value: `officer ${o.badge_number} ${o.full_name} ${o.unit}`,
					onSelect: () => go(`/officers/${o.badge_number}`),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Users, { className: "mr-2 size-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: o.full_name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 font-mono-tab text-xs text-muted-foreground",
							children: o.badge_number
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-auto text-[10px] uppercase text-muted-foreground",
							children: o.on_duty ? "on duty" : "off duty"
						})
					]
				}, o.id))
			})
		] })]
	});
}
var NAV = [
	{
		to: "/dashboard",
		label: "Command",
		icon: import_lucide_react.LayoutDashboard
	},
	{
		to: "/violations",
		label: "Violations",
		icon: import_lucide_react.FileText
	},
	{
		to: "/citations",
		label: "Citations",
		icon: import_lucide_react.CreditCard
	},
	{
		to: "/cameras",
		label: "Cameras",
		icon: import_lucide_react.Video
	},
	{
		to: "/map",
		label: "GIS Map",
		icon: import_lucide_react.Map
	},
	{
		to: "/vehicles",
		label: "Vehicles",
		icon: import_lucide_react.Car
	},
	{
		to: "/officers",
		label: "Officers",
		icon: import_lucide_react.Users
	},
	{
		to: "/dispatch",
		label: "Dispatch",
		icon: import_lucide_react.Radio
	},
	{
		to: "/analytics",
		label: "Analytics",
		icon: import_lucide_react.BarChart3
	}
];
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { session, loading, user } = useAuth();
	const email = user?.email ?? null;
	const palette = useCommandPalette();
	if (pathname === "/" || pathname.startsWith("/lookup")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Loader2, { className: "size-6 animate-spin text-primary" })
	});
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInScreen, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "sticky top-0 flex h-dvh w-20 shrink-0 flex-col items-center gap-8 border-r border-border bg-panel py-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/dashboard",
						className: "grid size-10 place-items-center overflow-hidden rounded-xl shadow-lg shadow-primary/30",
						"aria-label": "Quezon City Traffic Ops",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/qc-favicon.webp",
							alt: "QC Logo",
							className: "size-full object-contain"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex flex-col gap-2",
						children: NAV.map((item) => {
							const active = pathname.startsWith(item.to);
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								"aria-label": item.label,
								className: cn("group relative grid size-10 place-items-center rounded-xl transition-colors", active ? "bg-primary/10 text-primary" : "text-subtle hover:bg-panel-elevated hover:text-foreground"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
										className: "size-5",
										strokeWidth: 1.75
									}),
									active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -left-3 h-6 w-0.5 rounded-full bg-primary shadow-glow" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-border bg-panel-elevated px-2 py-1 text-xs font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100",
										children: item.label
									})
								]
							}, item.to);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => supabase.auth.signOut(),
							className: "grid size-10 place-items-center rounded-xl text-subtle transition-colors hover:bg-panel-elevated hover:text-danger",
							"aria-label": "Sign out",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.LogOut, {
								className: "size-5",
								strokeWidth: 1.75
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-10 place-items-center rounded-full bg-panel-elevated font-mono-tab text-[11px] font-bold text-foreground ring-2 ring-primary/40",
							title: email ?? "Signed in",
							children: (email?.[0] ?? "Q").toUpperCase()
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md sm:h-20 sm:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden min-w-0 flex-1 sm:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeading, { pathname })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-3 sm:gap-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => palette.setOpen(true),
								"aria-label": "Open search",
								className: "relative hidden lg:flex w-72 items-center rounded-lg border border-border bg-panel py-2 pl-9 pr-14 text-left text-sm text-subtle transition-colors hover:border-primary/40 hover:text-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className: "pointer-events-none absolute left-3 size-4 text-subtle" }),
									"Search plate, officer, location…",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "pointer-events-none absolute right-2 flex items-center gap-1 rounded-md border border-border bg-panel-elevated px-1.5 py-0.5 font-mono-tab text-[10px] text-subtle",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Command, { className: "size-3" }), " K"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden md:flex flex-col items-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
									children: "System"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1.5 font-mono-tab text-[11px] font-medium text-success",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-pulse rounded-full bg-success" }), "OPERATIONAL"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationsMenu, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DispatchDialog, { trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "hidden sm:inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
								children: "Dispatch Officer"
							}) })
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "min-w-0 flex-1",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandPalette, {
				open: palette.open,
				onOpenChange: palette.setOpen
			})
		]
	});
}
function PageHeading({ pathname }) {
	const match = NAV.find((n) => pathname.startsWith(n.to));
	const title = match?.to === "/dashboard" ? "Traffic Operations Command" : match?.label ?? "Traffic Operations Command";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "truncate text-xl font-semibold tracking-tight text-foreground",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono-tab text-[11px] uppercase tracking-widest text-subtle",
			children: "Sector · Quezon City Central District"
		})]
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs uppercase tracking-widest text-muted-foreground",
					children: "404 · Signal lost"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-3xl font-semibold text-foreground",
					children: "Route not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you are looking for is not registered in the operations grid."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90",
					children: "Return to Command"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs uppercase tracking-widest text-danger",
					children: "System fault"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-2xl font-semibold text-foreground",
					children: "This panel didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Try again or return to the command dashboard."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "rounded-lg border border-border-strong bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated",
						children: "Home"
					})]
				})
			]
		})
	});
}
var Route$14 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "QC Traffic Ops — AI Enforcement Command · Quezon City LGU" },
			{
				name: "description",
				content: "Real-time AI traffic violation detection, IoT camera monitoring, digital citations and online payment for the Quezon City LGU."
			},
			{
				name: "author",
				content: "Quezon City LGU"
			},
			{
				name: "theme-color",
				content: "#020617"
			},
			{
				property: "og:title",
				content: "QC Traffic Ops — AI Enforcement Command"
			},
			{
				property: "og:description",
				content: "Live AI violation detection, CCTV monitoring, and digital citations for Quezon City."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/qc-favicon.webp",
				type: "image/webp"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
			},
			{
				rel: "stylesheet",
				href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
				integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
				crossOrigin: ""
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-background text-foreground",
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
function RootComponent() {
	const { queryClient } = Route$14.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})]
	});
}
var $$splitComponentImporter$13 = () => import("./routes-M7sRiSSu.mjs");
var Route$13 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "QC Traffic Ops — AI Traffic Enforcement for Quezon City" },
		{
			name: "description",
			content: "AI-powered traffic violation detection, IoT camera monitoring, and digital citations for the Quezon City LGU enforcement teams."
		},
		{
			property: "og:title",
			content: "QC Traffic Ops — AI Traffic Enforcement for Quezon City"
		},
		{
			property: "og:description",
			content: "Detect violations automatically, monitor the CCTV grid in real time, and issue digital citations from one command center."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./analytics-bcAQoVai.mjs");
var Route$12 = createFileRoute("/analytics")({
	head: () => ({ meta: [
		{ title: "Enforcement Analytics · QC Traffic Ops" },
		{
			name: "description",
			content: "Trend analysis of Quezon City traffic violations, citation revenue, offense mix and officer performance."
		},
		{
			property: "og:title",
			content: "Enforcement Analytics · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Charts and exportable reports covering detections, revenue collection and enforcement performance."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./citations-DGjbQDZu.mjs");
var Route$11 = createFileRoute("/citations")({
	head: () => ({ meta: [
		{ title: "Citations · QC Traffic Ops" },
		{
			name: "description",
			content: "Digital traffic citations issued across Quezon City with payment status, officer attribution, and revenue analytics."
		},
		{
			property: "og:title",
			content: "Citations · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Digital citations ledger with payment tracking and revenue analytics for Quezon City enforcement."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./dashboard-CixRSpaX.mjs");
var Route$10 = createFileRoute("/dashboard")({
	head: () => ({ meta: [
		{ title: "Command Dashboard · QC Traffic Ops" },
		{
			name: "description",
			content: "Real-time traffic violations, AI detections, live CCTV feeds and citation revenue for Quezon City."
		},
		{
			property: "og:title",
			content: "Command Dashboard · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Live AI enforcement dashboard for the Quezon City LGU: violations, citations, cameras, and revenue."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./dispatch-CBvEj37e.mjs");
var Route$9 = createFileRoute("/dispatch")({
	head: () => ({ meta: [
		{ title: "Officer Dispatch Board · QC Traffic Ops" },
		{
			name: "description",
			content: "Assign Quezon City enforcement officers to incidents and track dispatch status from queued to resolved."
		},
		{
			property: "og:title",
			content: "Officer Dispatch Board · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Live dispatch queue with priority routing, officer assignment and field status tracking."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./lookup-CCitEAz7.mjs");
var Route$8 = createFileRoute("/lookup")({
	head: () => ({ meta: [
		{ title: "Citation Lookup · QC Traffic Ops" },
		{
			name: "description",
			content: "Check the status and amount due of a Quezon City traffic citation using your plate number and citation reference."
		},
		{
			property: "og:title",
			content: "Citation Lookup · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Motorist self-service portal to verify a Quezon City traffic citation, its offense, amount and payment status."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./map-BLiiKpro.mjs");
var Route$7 = createFileRoute("/map")({
	head: () => ({ meta: [
		{ title: "GIS Live Map · QC Traffic Ops" },
		{
			name: "description",
			content: "Interactive Leaflet GIS heatmap of Quezon City traffic violations with road segment filters, time-range playback, and CSV export."
		},
		{
			property: "og:title",
			content: "GIS Live Map · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Interactive heatmap of AI-detected traffic violations across Quezon City."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./violations-BHnxNVOG.mjs");
var Route$6 = createFileRoute("/violations")({
	head: () => ({ meta: [
		{ title: "Violations · QC Traffic Ops" },
		{
			name: "description",
			content: "AI-detected traffic violations across Quezon City with confidence scores, evidence, and enforcement status."
		},
		{
			property: "og:title",
			content: "Violations · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Live AI-detected violations across Quezon City with evidence and status."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./cameras.index-cVyd9VNe.mjs");
var Route$5 = createFileRoute("/cameras/")({
	head: () => ({ meta: [
		{ title: "IoT Cameras · QC Traffic Ops" },
		{
			name: "description",
			content: "Live IoT enforcement camera network across Quezon City — uptime, health status, and per-camera detection counts."
		},
		{
			property: "og:title",
			content: "IoT Cameras · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Monitor the Quezon City enforcement camera network: uptime, health, and detections per node."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./cameras._code-B_lKFu5W.mjs");
var Route$4 = createFileRoute("/cameras/$code")({
	head: ({ params }) => ({ meta: [
		{ title: `Camera ${params.code} · QC Traffic Ops` },
		{
			name: "description",
			content: `Live status, recent AI detections, event timeline and troubleshooting actions for enforcement camera ${params.code} in Quezon City.`
		},
		{
			property: "og:title",
			content: `Camera ${params.code} · QC Traffic Ops`
		},
		{
			property: "og:description",
			content: `Diagnostics and detection history for enforcement camera ${params.code}.`
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./officers.index-CcbCHB5V.mjs");
var Route$3 = createFileRoute("/officers/")({
	head: () => ({ meta: [
		{ title: "Officers · QC Traffic Ops" },
		{
			name: "description",
			content: "Quezon City traffic enforcement personnel roster with duty status, unit assignment, and citation output per officer."
		},
		{
			property: "og:title",
			content: "Officers · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Enforcement personnel roster: duty status, districts, units and citation output."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./officers._badge-An7dPsKY.mjs");
var Route$2 = createFileRoute("/officers/$badge")({
	head: ({ params }) => ({ meta: [
		{ title: `Officer #${params.badge} · QC Traffic Ops` },
		{
			name: "description",
			content: `Service record for Quezon City traffic enforcer badge #${params.badge}: duty status, citations issued, revenue collected and dispatch history.`
		},
		{
			property: "og:title",
			content: `Officer #${params.badge} · QC Traffic Ops`
		},
		{
			property: "og:description",
			content: "Officer service record: duty status, citation output, collections and dispatch assignments."
		},
		{
			property: "og:type",
			content: "profile"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./vehicles.index-DXWZ1rJX.mjs");
var Route$1 = createFileRoute("/vehicles/")({
	head: () => ({ meta: [
		{ title: "Vehicles · QC Traffic Ops" },
		{
			name: "description",
			content: "Vehicle registry aggregated from AI detections and citations across Quezon City — offender history, outstanding balances, and watchlist flags."
		},
		{
			property: "og:title",
			content: "Vehicles · QC Traffic Ops"
		},
		{
			property: "og:description",
			content: "Aggregated vehicle registry with offense history, outstanding fines, and watchlist status."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./vehicles._plate-CXzocn14.mjs");
var Route = createFileRoute("/vehicles/$plate")({
	head: ({ params }) => ({ meta: [
		{ title: `${params.plate} · Vehicle Record · QC Traffic Ops` },
		{
			name: "description",
			content: `Enforcement record for plate ${params.plate}: AI detections, issued citations, outstanding balance and watchlist risk level in Quezon City.`
		},
		{
			property: "og:title",
			content: `${params.plate} · Vehicle Record · QC Traffic Ops`
		},
		{
			property: "og:description",
			content: "Vehicle enforcement record: detections, citations, outstanding fines and risk level."
		},
		{
			property: "og:type",
			content: "article"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$13.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$14
});
var AnalyticsRoute = Route$12.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => Route$14
});
var CitationsRoute = Route$11.update({
	id: "/citations",
	path: "/citations",
	getParentRoute: () => Route$14
});
var DashboardRoute = Route$10.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$14
});
var DispatchRoute = Route$9.update({
	id: "/dispatch",
	path: "/dispatch",
	getParentRoute: () => Route$14
});
var LookupRoute = Route$8.update({
	id: "/lookup",
	path: "/lookup",
	getParentRoute: () => Route$14
});
var MapRoute = Route$7.update({
	id: "/map",
	path: "/map",
	getParentRoute: () => Route$14
});
var ViolationsRoute = Route$6.update({
	id: "/violations",
	path: "/violations",
	getParentRoute: () => Route$14
});
var CamerasIndexRoute = Route$5.update({
	id: "/cameras/",
	path: "/cameras/",
	getParentRoute: () => Route$14
});
var CamerasCodeRoute = Route$4.update({
	id: "/cameras/$code",
	path: "/cameras/$code",
	getParentRoute: () => Route$14
});
var OfficersIndexRoute = Route$3.update({
	id: "/officers/",
	path: "/officers/",
	getParentRoute: () => Route$14
});
var OfficersBadgeRoute = Route$2.update({
	id: "/officers/$badge",
	path: "/officers/$badge",
	getParentRoute: () => Route$14
});
var VehiclesIndexRoute = Route$1.update({
	id: "/vehicles/",
	path: "/vehicles/",
	getParentRoute: () => Route$14
});
var rootRouteChildren = {
	IndexRoute,
	AnalyticsRoute,
	CitationsRoute,
	DashboardRoute,
	DispatchRoute,
	LookupRoute,
	MapRoute,
	ViolationsRoute,
	CamerasCodeRoute,
	OfficersBadgeRoute,
	VehiclesPlateRoute: Route.update({
		id: "/vehicles/$plate",
		path: "/vehicles/$plate",
		getParentRoute: () => Route$14
	}),
	CamerasIndexRoute,
	OfficersIndexRoute,
	VehiclesIndexRoute
};
var routeTree = Route$14._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { useDispatches as a, DialogContent as c, DialogHeader as d, DialogTitle as f, DISPATCH_STATUS_LABEL as i, DialogDescription as l, Route$4 as n, useUpdateDispatchStatus as o, DispatchDialog as r, Dialog as s, router_exports as t, DialogFooter as u };
