import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as useCameras, r as timeAgo, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route$4 } from "./router-CsIn8Ssg.mjs";
//#region dist/server/assets/cameras._code-B_lKFu5W.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
function hashCode(s) {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) >>> 0;
	return h;
}
function CameraDetailPage() {
	const { code } = Route$4.useParams();
	const { data: cameras = [], isLoading, refetch } = useCameras();
	const { data: violations = [] } = useViolations(200);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const camera = cameras.find((c) => c.code === code);
	const detections = (0, import_react.useMemo)(() => violations.filter((v) => v.camera_code === code).slice(0, 12), [violations, code]);
	const health = (0, import_react.useMemo)(() => {
		const h = hashCode(code);
		return {
			uptime: (97 + (h >> 3) % 30 / 10).toFixed(1),
			latency: 40 + h % 90,
			bitrate: (3 + (h >> 5) % 40 / 10).toFixed(1),
			firmware: `v2.${h % 9}.${(h >> 7) % 10}`,
			temp: 38 + (h >> 2) % 14
		};
	}, [code]);
	const timeline = (0, import_react.useMemo)(() => {
		const events = detections.map((d) => ({
			at: d.detected_at,
			kind: "detection",
			label: `${d.violation_type} · ${d.plate_number}`,
			detail: `${Math.round(Number(d.confidence) * 100)}% confidence`
		}));
		const base = Date.now();
		const h = hashCode(code);
		const system = [
			{
				at: (/* @__PURE__ */ new Date(base - (2 + h % 5) * 36e5)).toISOString(),
				kind: "system",
				label: "Heartbeat check passed",
				detail: `Latency ${health.latency}ms`
			},
			{
				at: (/* @__PURE__ */ new Date(base - (9 + h % 11) * 36e5)).toISOString(),
				kind: "system",
				label: "Firmware verified",
				detail: health.firmware
			},
			{
				at: (/* @__PURE__ */ new Date(base - (26 + h % 20) * 36e5)).toISOString(),
				kind: camera?.status === "online" ? "system" : "fault",
				label: camera?.status === "online" ? "Stream re-synced after tile refresh" : "Link degraded — node stopped reporting",
				detail: camera?.status === "online" ? "No packet loss" : "Dispatch required"
			}
		];
		return [...events, ...system].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
	}, [
		detections,
		camera?.status,
		code,
		health.latency,
		health.firmware
	]);
	function runAction(id, label, done) {
		setBusy(id);
		toast.loading(label, { id });
		window.setTimeout(() => {
			setBusy(null);
			toast.success(done, { id });
			refetch();
		}, 1400);
	}
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-64 place-items-center text-sm text-subtle",
		children: "Loading camera diagnostics…"
	});
	if (!camera) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-start gap-4 p-6 lg:p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/cameras",
			className: "inline-flex items-center gap-2 text-sm text-subtle hover:text-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowLeft, { className: "size-4" }), " Back to camera grid"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel grid h-64 w-full place-items-center rounded-2xl text-sm text-subtle",
			children: [
				"No camera registered with code “",
				code,
				"”."
			]
		})]
	});
	const online = camera.status === "online";
	const maintenance = camera.status === "maintenance";
	const StatusIcon = online ? import_lucide_react.Wifi : maintenance ? import_lucide_react.Wrench : import_lucide_react.WifiOff;
	const tone = online ? "text-success" : maintenance ? "text-warning" : "text-danger";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-6 lg:p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/cameras",
						className: "inline-flex items-center gap-2 font-mono-tab text-[11px] uppercase tracking-widest text-subtle hover:text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowLeft, { className: "size-3.5" }), " Camera grid"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 truncate text-2xl font-semibold tracking-tight text-foreground",
						children: camera.code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: camera.location
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: cn("flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono-tab text-[11px] font-semibold uppercase tracking-widest", tone),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, { className: "size-3.5" }), camera.status]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 xl:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6 xl:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "panel overflow-hidden rounded-2xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative aspect-video bg-panel-elevated",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 grid place-items-center",
									children: online ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center gap-2 text-subtle",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Video, {
											className: "size-10",
											strokeWidth: 1.5
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono-tab text-[10px] uppercase tracking-widest",
											children: [
												"Live feed · 1080p · ",
												health.bitrate,
												" Mbps"
											]
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center gap-2 text-danger/70",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.WifiOff, {
											className: "size-10",
											strokeWidth: 1.5
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono-tab text-[10px] uppercase tracking-widest",
											children: "No signal"
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 backdrop-blur-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", online ? "animate-pulse bg-success" : maintenance ? "bg-warning" : "bg-danger") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-foreground",
										children: online ? "Streaming" : camera.status
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-1 font-mono-tab text-[10px] text-subtle backdrop-blur-sm",
									children: camera.lat != null && camera.lng != null ? `${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}` : "Coordinates pending"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Uptime (30d)",
								value: `${health.uptime}%`,
								icon: import_lucide_react.Activity,
								tone: "text-success"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Latency",
								value: `${health.latency}ms`,
								icon: import_lucide_react.Signal,
								tone: "text-primary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Detections",
								value: detections.length,
								icon: import_lucide_react.ShieldAlert
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Core temp",
								value: `${health.temp}°C`,
								icon: import_lucide_react.Gauge,
								tone: health.temp > 48 ? "text-warning" : "text-foreground"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel rounded-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "flex items-center justify-between border-b border-border px-5 py-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold text-foreground",
								children: "Last detections"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/violations",
								className: "font-mono-tab text-[10px] uppercase tracking-widest text-primary hover:underline",
								children: "All violations"
							})]
						}), detections.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-40 place-items-center text-sm text-subtle",
							children: "No detections recorded from this node yet."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-border",
							children: detections.slice(0, 8).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-4 px-5 py-3.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono-tab text-xs font-bold text-foreground",
										children: d.plate_number
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 flex-1 truncate text-sm text-muted-foreground",
										children: d.violation_type
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono-tab text-[11px] text-primary",
										children: [Math.round(Number(d.confidence) * 100), "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
										children: timeAgo(d.detected_at)
									})
								]
							}, d.id))
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold text-foreground",
								children: "Quick actions"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Troubleshooting controls for this node."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-col gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										icon: import_lucide_react.RefreshCw,
										label: "Restart stream",
										busy: busy === "restart",
										disabled: busy !== null,
										onClick: () => runAction("restart", `Restarting stream on ${camera.code}…`, "Stream restarted")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										icon: import_lucide_react.Stethoscope,
										label: "Run diagnostics",
										busy: busy === "diag",
										disabled: busy !== null,
										onClick: () => runAction("diag", "Running node diagnostics…", "Diagnostics complete — no faults found")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										icon: import_lucide_react.Power,
										label: "Reboot node",
										busy: busy === "reboot",
										disabled: busy !== null,
										onClick: () => runAction("reboot", `Rebooting ${camera.code}…`, "Node rebooted and back online")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										icon: import_lucide_react.Wrench,
										label: "Flag for maintenance",
										busy: busy === "flag",
										disabled: busy !== null,
										onClick: () => runAction("flag", "Filing maintenance ticket…", "Maintenance ticket dispatched")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										icon: import_lucide_react.Copy,
										label: "Copy stream URL",
										busy: false,
										disabled: busy !== null,
										onClick: () => {
											navigator.clipboard?.writeText(`rtsp://qc-traffic.local/${camera.code.toLowerCase()}/live`).then(() => toast.success("Stream URL copied")).catch(() => toast.error("Clipboard unavailable"));
										}
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel rounded-2xl p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-foreground",
							children: "Node info"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 space-y-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Firmware",
									value: health.firmware
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Bitrate",
									value: `${health.bitrate} Mbps`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Status",
									value: camera.status
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Coordinates",
									value: camera.lat != null && camera.lng != null ? `${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}` : "—"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel rounded-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "flex items-center gap-2 border-b border-border px-5 py-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Clock, { className: "size-4 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold text-foreground",
								children: "Event timeline"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "max-h-96 space-y-0 overflow-y-auto px-5 py-4",
							children: timeline.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "relative flex gap-3 pb-5 last:pb-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-1.5 flex flex-col items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 shrink-0 rounded-full", e.kind === "detection" ? "bg-primary" : e.kind === "fault" ? "bg-danger" : "bg-subtle") }), i < timeline.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1 w-px flex-1 bg-border" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm text-foreground",
										children: e.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
										children: [
											timeAgo(e.at),
											" · ",
											e.detail
										]
									})]
								})]
							}, `${e.at}-${i}`))
						})]
					})
				]
			})]
		})]
	});
}
function Row({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "truncate font-mono-tab text-xs text-foreground",
			children: value
		})]
	});
}
function Metric({ label, value, icon: Icon, tone = "text-foreground" }) {
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
function ActionButton({ icon: Icon, label, onClick, busy, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		disabled,
		className: "flex items-center gap-3 rounded-lg border border-border bg-panel-elevated px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: cn("size-4", busy && "animate-spin"),
			strokeWidth: 2
		}), label]
	});
}
//#endregion
export { CameraDetailPage as component };
