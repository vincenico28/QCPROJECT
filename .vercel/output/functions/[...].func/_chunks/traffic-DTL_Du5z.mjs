import { t as supabase } from "./client-BAxwUCp8.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region dist/server/assets/traffic-DTL_Du5z.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function useOfficers() {
	return useQuery({
		queryKey: ["officers"],
		queryFn: async () => {
			const { data, error } = await supabase.from("officers").select("*").order("citations_issued", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
}
function useViolations(limit = 20) {
	return useQuery({
		queryKey: ["violations", limit],
		queryFn: async () => {
			const { data, error } = await supabase.from("violations").select("*").order("detected_at", { ascending: false }).limit(limit);
			if (error) throw error;
			return data ?? [];
		},
		refetchInterval: 15e3
	});
}
function useCitations(limit = 20) {
	return useQuery({
		queryKey: ["citations", limit],
		queryFn: async () => {
			const { data, error } = await supabase.from("citations").select("*").order("issued_at", { ascending: false }).limit(limit);
			if (error) throw error;
			return data ?? [];
		}
	});
}
function useCameras() {
	return useQuery({
		queryKey: ["cameras"],
		queryFn: async () => {
			const { data, error } = await supabase.from("cameras").select("*").order("code");
			if (error) throw error;
			return data ?? [];
		}
	});
}
function formatPeso(amount) {
	return new Intl.NumberFormat("en-PH", {
		style: "currency",
		currency: "PHP",
		maximumFractionDigits: 0
	}).format(amount);
}
function timeAgo(iso) {
	const diff = Date.now() - new Date(iso).getTime();
	const s = Math.floor(diff / 1e3);
	if (s < 60) return `${s}s ago`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}
//#endregion
export { useCitations as a, useCameras as i, formatPeso as n, useOfficers as o, timeAgo as r, useViolations as s, cn as t };
