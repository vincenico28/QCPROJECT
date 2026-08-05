import { s as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as useCitations, i as useCameras, n as formatPeso, r as timeAgo, s as useViolations, t as cn } from "./traffic-DTL_Du5z.mjs";
import { t as require_lucide_react } from "../_libs/lucide-react.mjs";
//#region dist/server/assets/dashboard-CixRSpaX.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var import_lucide_react = require_lucide_react();
var cctv_1_default = "/assets/cctv-1-Bjhj44li.jpg";
var cctv_2_default = "/assets/cctv-2-BJeKjm6V.jpg";
var cctv_3_default = "/assets/cctv-3-dPyrzrGt.jpg";
var violation_1_default = "/assets/violation-1-Dm7iAa01.jpg";
var violation_2_default = "/assets/violation-2-DEPFXG5l.jpg";
var violation_3_default = "/assets/violation-3-9nhXWBO7.jpg";
var CCTV_FEEDS = [
	{
		img: cctv_1_default,
		code: "CAM-042",
		location: "COMMONWEALTH AVE",
		status: "detection",
		label: "DETECTION ACTIVE"
	},
	{
		img: cctv_2_default,
		code: "CAM-108",
		location: "TOMAS MORATO",
		status: "alert",
		label: "ILLEGAL PARKING DETECTED"
	},
	{
		img: cctv_3_default,
		code: "CAM-059",
		location: "EDSA-QUEZON AVE",
		status: "optimal",
		label: "FLOW OPTIMAL"
	}
];
var FEED_IMAGES = [
	violation_1_default,
	violation_2_default,
	violation_3_default
];
function CommandDashboard() {
	const { data: violations = [], isLoading: vLoading } = useViolations(6);
	const { data: citations = [] } = useCitations(10);
	const { data: cameras = [] } = useCameras();
	const kpis = (0, import_react.useMemo)(() => {
		const revenue = citations.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
		const pending = citations.filter((c) => c.status === "pending").length;
		const activeCameras = cameras.filter((c) => c.status !== "offline").length;
		return {
			violations: violations.length > 0 ? 2842 : 0,
			officers: {
				current: 156,
				total: 200
			},
			revenue: 428e3 + revenue,
			pending: 812 + pending,
			activeCameras,
			totalCameras: cameras.length
		};
	}, [
		violations,
		citations,
		cameras
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
				label: "Daily Violations",
				value: "2,842",
				delta: "+14%",
				deltaKind: "danger",
				icon: import_lucide_react.Activity
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
				label: "Active Officers",
				value: "156",
				secondary: `/ ${kpis.officers.total} Total`,
				deltaKind: "muted"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
				label: "Est. Revenue",
				value: formatPeso(kpis.revenue).replace("PHP", "₱"),
				delta: "↑ Targeted",
				deltaKind: "success",
				icon: import_lucide_react.TrendingUp
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
				label: "Pending Payments",
				value: kpis.pending.toLocaleString(),
				delta: "24h Overdue",
				deltaKind: "warning"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-6 lg:col-span-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel relative overflow-hidden rounded-3xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/assets/qc-map-CTbKdSF9.jpg",
								alt: "Real-time GIS heatmap of Quezon City traffic congestion",
								className: "h-[420px] w-full object-cover opacity-70",
								width: 1600,
								height: 900,
								loading: "lazy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute left-6 top-6 flex flex-col gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPill, {
										color: "danger",
										label: "Heavy Congestion: EDSA North"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPill, {
										color: "accent",
										label: "Active Patrol: Fairview"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPill, {
										color: "warning",
										label: "AI Alert: Commonwealth Ave"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute right-6 top-6 rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
									children: "Live Cameras"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-mono-tab text-2xl font-semibold text-foreground",
									children: [kpis.activeCameras, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-base text-subtle",
										children: ["/", kpis.totalCameras]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin$1, {
								top: "34%",
								left: "42%",
								tone: "danger"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin$1, {
								top: "52%",
								left: "55%",
								tone: "warning"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin$1, {
								top: "46%",
								left: "30%",
								tone: "accent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin$1, {
								top: "62%",
								left: "48%",
								tone: "success"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute bottom-4 left-6 right-6 flex items-end justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold text-foreground",
									children: "Quezon City · Live Traffic Heatmap"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
									children: ["Updated · ", (/* @__PURE__ */ new Date()).toLocaleTimeString("en-PH")]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/map",
									className: "inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md hover:bg-panel-elevated",
									children: ["Open GIS View", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowUpRight, { className: "size-3.5" })]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 gap-6 md:grid-cols-3",
						children: CCTV_FEEDS.map((feed) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CctvTile, { feed }, feed.code))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel overflow-hidden rounded-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold text-foreground",
								children: "Recent Citations"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono-tab text-[10px] uppercase tracking-widest text-subtle",
								children: "Digital citations · QC LGU"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/violations",
								className: "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-panel-elevated",
								children: ["View all", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ChevronRight, { className: "size-3.5" })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
									className: "border-b border-border",
									children: [
										"Reference",
										"Plate",
										"Offense",
										"Officer",
										"Status",
										"Amount"
									].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
										children: h
									}, h))
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
									className: "divide-y divide-border",
									children: [citations.slice(0, 6).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "text-sm transition-colors hover:bg-panel-elevated/50",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-5 py-3 font-mono-tab text-foreground",
												children: ["#", c.citation_number]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-5 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "font-mono-tab text-foreground",
													children: c.plate_number
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-xs text-subtle",
													children: c.vehicle_model
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-5 py-3 text-muted-foreground",
												children: c.offense
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-5 py-3 text-muted-foreground",
												children: c.officer_name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-5 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: c.status })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-5 py-3 text-right font-mono-tab font-medium text-foreground",
												children: formatPeso(Number(c.amount)).replace("PHP", "₱")
											})
										]
									}, c.id)), citations.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 6,
										className: "px-5 py-8 text-center text-sm text-subtle",
										children: "No citations yet"
									}) })]
								})]
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "panel flex flex-col overflow-hidden rounded-3xl lg:col-span-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-border p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Radio, { className: "size-4 text-danger" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-foreground",
							children: "LIVE VIOLATIONS FEED"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded border border-danger/30 bg-danger/10 px-2 py-0.5 font-mono-tab text-[10px] font-medium text-danger",
						children: "PRIORITY"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 divide-y divide-border overflow-y-auto",
					children: [
						vLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4 p-5",
							children: [
								0,
								1,
								2
							].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse rounded-xl bg-panel-elevated" }, i))
						}),
						!vLoading && violations.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViolationFeedItem, {
							violation: v,
							image: FEED_IMAGES[i % FEED_IMAGES.length]
						}, v.id)),
						!vLoading && violations.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-8 text-center text-sm text-subtle",
							children: "No live detections"
						})
					]
				})]
			})
		]
	});
}
function KpiCard({ label, value, secondary, delta, deltaKind = "muted", icon: Icon }) {
	const tone = {
		success: "text-success",
		warning: "text-warning",
		danger: "text-danger",
		muted: "text-subtle"
	}[deltaKind];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel col-span-1 rounded-2xl p-6 lg:col-span-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle",
				children: label
			}), Icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-4 text-subtle",
				strokeWidth: 1.75
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex items-baseline gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono-tab text-4xl font-bold tracking-tighter text-foreground",
					children: value
				}),
				secondary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-subtle",
					children: secondary
				}),
				delta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("ml-auto text-xs font-medium", tone),
					children: delta
				})
			]
		})]
	});
}
function MapPill({ color, label }) {
	const tone = {
		danger: "bg-danger shadow-[0_0_10px_oklch(from_var(--danger)_l_c_h_/_0.6)]",
		warning: "bg-warning shadow-[0_0_10px_oklch(from_var(--warning)_l_c_h_/_0.6)]",
		accent: "bg-primary shadow-[0_0_10px_oklch(from_var(--primary)_l_c_h_/_0.6)]",
		success: "bg-success shadow-[0_0_10px_oklch(from_var(--success)_l_c_h_/_0.6)]"
	}[color];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2 backdrop-blur-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", tone) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-medium text-foreground",
			children: label
		})]
	});
}
function MapPin$1({ top, left, tone }) {
	const toneClass = {
		danger: "bg-danger",
		warning: "bg-warning",
		accent: "bg-primary",
		success: "bg-success"
	}[tone];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "pointer-events-none absolute",
		style: {
			top,
			left
		},
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "relative flex size-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", toneClass) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("relative inline-flex size-3 rounded-full ring-2 ring-background", toneClass) })]
		})
	});
}
function CctvTile({ feed }) {
	const badgeTone = feed.status === "alert" ? "text-warning" : feed.status === "detection" ? "text-success" : "text-success";
	const dot = feed.status === "alert" ? "bg-warning animate-pulse" : "bg-success";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "group relative aspect-video overflow-hidden rounded-2xl border border-border bg-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: feed.img,
				alt: `CCTV feed from ${feed.location}`,
				className: "size-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105",
				width: 800,
				height: 512,
				loading: "lazy"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-pulse rounded-full bg-danger" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono-tab text-[9px] font-bold uppercase tracking-widest text-white",
					children: "LIVE"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono-tab text-[10px] text-white/70",
					children: [
						feed.code,
						" | ",
						feed.location
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: cn("flex items-center gap-2 text-xs font-bold text-white", badgeTone),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", dot) }), feed.label]
				})]
			})
		]
	});
}
function ViolationFeedItem({ violation, image }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "p-5 transition-colors hover:bg-panel-elevated/50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mb-3 aspect-video overflow-hidden rounded-lg border border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: image,
						alt: `AI detection: ${violation.violation_type}`,
						className: "size-full object-cover",
						width: 600,
						height: 512,
						loading: "lazy"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute left-2 top-2 rounded bg-danger/90 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-wider text-white",
						children: violation.violation_type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold text-primary backdrop-blur",
						children: [Number(violation.confidence).toFixed(1), "%"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs font-bold uppercase tracking-wide text-foreground",
						children: violation.violation_type
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 text-xs text-subtle",
						children: [
							"Plate",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono-tab text-muted-foreground",
								children: violation.plate_number
							}),
							" · ",
							violation.location
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 font-mono-tab text-[10px] text-subtle",
					children: timeAgo(violation.detected_at)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "flex-1 rounded-md border border-border bg-panel-elevated py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground",
					children: "Dismiss"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "flex-1 rounded-md bg-primary/20 py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/30",
					children: "Issue Citation"
				})]
			})
		]
	});
}
function StatusPill({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase", status === "paid" ? "bg-success/10 text-success border-success/30" : status === "contested" ? "bg-danger/10 text-danger border-danger/30" : "bg-warning/10 text-warning border-warning/30"),
		children: status
	});
}
//#endregion
export { CommandDashboard as component };
