import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as ClientOnly } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as useCameras, r as timeAgo, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
//#region dist/server/assets/map-BLiiKpro.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var QC_CENTER = [14.676, 121.0437];
function hash(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return (h >>> 0) / 4294967295;
}
function geocodeViolations(violations, cameras) {
	const byCode = new Map(cameras.map((c) => [c.code, c]));
	return violations.map((v) => {
		const cam = v.camera_code ? byCode.get(v.camera_code) : void 0;
		let lat = cam?.lat != null ? Number(cam.lat) : QC_CENTER[0];
		let lng = cam?.lng != null ? Number(cam.lng) : QC_CENTER[1];
		const jLat = (hash(v.id + ":lat") - .5) * .006;
		const jLng = (hash(v.id + ":lng") - .5) * .006;
		lat += jLat;
		lng += jLng;
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
		return {
			...v,
			lat,
			lng
		};
	}).filter((v) => v !== null);
}
function roadSegments(cameras) {
	const set = /* @__PURE__ */ new Set();
	for (const c of cameras) if (c.location) set.add(c.location);
	return Array.from(set).sort();
}
function violationColor(type) {
	const t = type.toLowerCase();
	if (t.includes("red")) return "#ef4444";
	if (t.includes("speed")) return "#f59e0b";
	if (t.includes("park")) return "#3b82f6";
	if (t.includes("swerv") || t.includes("lane")) return "#8b5cf6";
	return "#10b981";
}
function toCsv(rows) {
	const headers = [
		"id",
		"plate_number",
		"violation_type",
		"location",
		"camera_code",
		"confidence",
		"status",
		"lat",
		"lng",
		"detected_at"
	];
	const escape = (v) => {
		const s = v == null ? "" : String(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
	};
	const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");
	return `${headers.join(",")}\n${body}`;
}
function downloadCsv(filename, csv) {
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
var WINDOW_PRESETS = [
	{
		label: "1H",
		hours: 1
	},
	{
		label: "6H",
		hours: 6
	},
	{
		label: "24H",
		hours: 24
	},
	{
		label: "7D",
		hours: 168
	}
];
function GisMapPage() {
	const { data: violations = [] } = useViolations(500);
	const { data: cameras = [] } = useCameras();
	const segments = (0, import_react.useMemo)(() => roadSegments(cameras), [cameras]);
	const [selectedSegments, setSelectedSegments] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [windowHours, setWindowHours] = (0, import_react.useState)(24);
	const [showHeatmap, setShowHeatmap] = (0, import_react.useState)(true);
	const [showMarkers, setShowMarkers] = (0, import_react.useState)(true);
	const [showCameras, setShowCameras] = (0, import_react.useState)(true);
	const [sliderPct, setSliderPct] = (0, import_react.useState)(100);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const rafRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		let last = performance.now();
		const tick = (t) => {
			const dt = t - last;
			last = t;
			setSliderPct((p) => {
				const next = p + dt / 12e3 * 100;
				if (next >= 100) {
					setPlaying(false);
					return 100;
				}
				return next;
			});
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [playing]);
	const geo = (0, import_react.useMemo)(() => geocodeViolations(violations, cameras), [violations, cameras]);
	const now = (0, import_react.useMemo)(() => Date.now(), [violations]);
	const windowStart = now - windowHours * 3600 * 1e3;
	const cursorTs = windowStart + (now - windowStart) * sliderPct / 100;
	const filtered = (0, import_react.useMemo)(() => {
		return geo.filter((v) => {
			const ts = new Date(v.detected_at).getTime();
			if (ts < windowStart || ts > cursorTs) return false;
			if (selectedSegments.size && !selectedSegments.has(v.location)) return false;
			return true;
		});
	}, [
		geo,
		windowStart,
		cursorTs,
		selectedSegments
	]);
	const analytics = (0, import_react.useMemo)(() => computeAnalytics(filtered), [filtered]);
	const toggleSegment = (s) => {
		setSelectedSegments((prev) => {
			const next = new Set(prev);
			if (next.has(s)) next.delete(s);
			else next.add(s);
			return next;
		});
	};
	const handleExport = () => {
		const csv = toCsv(filtered);
		downloadCsv(`qc-violations-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.csv`, csv);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "lg:col-span-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel relative h-[720px] overflow-hidden rounded-3xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnly, { fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapSkeleton, {}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-auto rounded-xl border border-border bg-background/80 px-3 py-2 backdrop-blur-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[10px] uppercase tracking-widest text-subtle",
								children: "Quezon City · Live GIS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-semibold text-foreground",
								children: [filtered.length.toLocaleString(), " detections in view"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-auto flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerToggle, {
									icon: import_lucide_react.Layers,
									active: showHeatmap,
									onClick: () => setShowHeatmap((v) => !v),
									label: "Heatmap"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerToggle, {
									icon: import_lucide_react.MapPin,
									active: showMarkers,
									onClick: () => setShowMarkers((v) => !v),
									label: "Markers"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerToggle, {
									icon: import_lucide_react.Radio,
									active: showCameras,
									onClick: () => setShowCameras((v) => !v),
									label: "Cameras"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute bottom-4 left-4 rounded-xl border border-border bg-background/80 p-3 backdrop-blur-md",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 font-mono text-[9px] uppercase tracking-widest text-subtle",
								children: "Heat intensity"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-40 rounded-full bg-gradient-to-r from-[#3b82f6] via-[#10b981] via-60% to-[#ef4444]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex justify-between font-mono text-[9px] text-subtle",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "low" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "critical" })]
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel mt-6 rounded-3xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								if (sliderPct >= 100) setSliderPct(0);
								setPlaying((p) => !p);
							},
							className: "inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90",
							children: [playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Pause, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Play, { className: "size-3.5" }), playing ? "Pause" : "Play"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								setPlaying(false);
								setSliderPct(100);
							},
							className: "inline-flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs font-medium text-foreground hover:bg-panel",
							title: "Reset",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.RotateCcw, { className: "size-3.5" }), "Reset"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ml-auto flex items-center gap-1 rounded-lg border border-border bg-panel-elevated p-1",
							children: WINDOW_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setWindowHours(p.hours);
									setSliderPct(100);
								},
								className: cn("rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest", windowHours === p.hours ? "bg-primary/20 text-primary" : "text-subtle hover:text-foreground"),
								children: p.label
							}, p.label))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleExport,
							className: "inline-flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs font-medium text-foreground hover:bg-panel",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Download, { className: "size-3.5" }), "Export CSV"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: 100,
						step: .5,
						value: sliderPct,
						onChange: (e) => {
							setPlaying(false);
							setSliderPct(Number(e.target.value));
						},
						className: "w-full accent-primary",
						"aria-label": "Time cursor"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-subtle",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(windowStart).toLocaleString() }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-primary",
								children: ["cursor · ", new Date(cursorTs).toLocaleString()]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(now).toLocaleString() })
						]
					})]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "flex flex-col gap-6 lg:col-span-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel overflow-hidden rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between border-b border-border p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Filter, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold text-foreground",
								children: "Road segments"
							})]
						}), selectedSegments.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setSelectedSegments(/* @__PURE__ */ new Set()),
							className: "font-mono text-[10px] uppercase tracking-widest text-subtle hover:text-foreground",
							children: ["Clear · ", selectedSegments.size]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-64 overflow-y-auto p-3",
						children: [segments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "p-3 text-xs text-subtle",
							children: "No segments available."
						}), segments.map((s) => {
							const active = selectedSegments.has(s);
							const count = analytics.perSegment.get(s) ?? 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => toggleSegment(s),
								className: cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors", active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-panel-elevated hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									children: s
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[10px] text-subtle",
									children: count
								})]
							}, s);
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel rounded-3xl p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-foreground",
							children: "Window analytics"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[10px] uppercase tracking-widest text-subtle",
							children: "Data currently on the map"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Detections",
									value: analytics.total.toLocaleString()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Avg confidence",
									value: `${analytics.avgConfidence.toFixed(1)}%`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Segments",
									value: String(analytics.perSegment.size)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Types",
									value: String(analytics.perType.size)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[10px] uppercase tracking-widest text-subtle",
								children: "By type"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 space-y-2",
								children: [[...analytics.perType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, count]) => {
									const pct = analytics.total ? count / analytics.total * 100 : 0;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate text-foreground",
											children: type
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono text-[10px] text-subtle",
											children: [
												count,
												" · ",
												pct.toFixed(0),
												"%"
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 h-1.5 overflow-hidden rounded-full bg-panel-elevated",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full rounded-full",
											style: {
												width: `${pct}%`,
												backgroundColor: violationColor(type)
											}
										})
									})] }, type);
								}), analytics.total === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-subtle",
									children: "No detections in current window."
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel overflow-hidden rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-b border-border p-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-foreground",
							children: "Recent in window"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-72 divide-y divide-border overflow-y-auto",
						children: [filtered.slice(0, 12).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowItem, { v }, v.id)), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-6 text-center text-xs text-subtle",
							children: "No detections"
						})]
					})]
				})
			]
		})]
	});
}
function MapSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid size-full place-items-center bg-panel-elevated",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs uppercase tracking-widest text-subtle",
			children: "Loading GIS layers…"
		})
	});
}
function LayerToggle({ icon: Icon, active, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors", active ? "border-primary/50 bg-primary/20 text-primary" : "border-border bg-background/70 text-muted-foreground hover:text-foreground"),
		"aria-pressed": active,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), label]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-panel-elevated p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-[9px] uppercase tracking-widest text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-mono text-lg font-bold text-foreground",
			children: value
		})]
	});
}
function RowItem({ v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-xs font-semibold uppercase tracking-wide text-foreground",
				children: v.violation_type
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "truncate text-[11px] text-subtle",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-muted-foreground",
						children: v.plate_number
					}),
					" · ",
					v.location
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 font-mono text-[10px] text-subtle",
			children: timeAgo(v.detected_at)
		})]
	});
}
function computeAnalytics(rows) {
	const perType = /* @__PURE__ */ new Map();
	const perSegment = /* @__PURE__ */ new Map();
	let confSum = 0;
	for (const r of rows) {
		perType.set(r.violation_type, (perType.get(r.violation_type) ?? 0) + 1);
		perSegment.set(r.location, (perSegment.get(r.location) ?? 0) + 1);
		confSum += Number(r.confidence) || 0;
	}
	return {
		total: rows.length,
		avgConfidence: rows.length ? confSum / rows.length : 0,
		perType,
		perSegment
	};
}
//#endregion
export { GisMapPage as component };
