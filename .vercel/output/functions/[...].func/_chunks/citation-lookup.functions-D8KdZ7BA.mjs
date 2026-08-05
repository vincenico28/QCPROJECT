import { n as createServerFn, t as TSS_SERVER_FUNCTION } from "./server.mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
//#region dist/server/assets/citation-lookup.functions-D8KdZ7BA.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var schema = objectType({
	plate: stringType().trim().min(3).max(12),
	reference: stringType().trim().min(4).max(32)
});
var lookupCitation_createServerFn_handler = createServerRpc({
	id: "f76b2e957fbc579340314e4efc58ef0a13bf26646c0e0c8dfc5933d699117528",
	name: "lookupCitation",
	filename: "src/lib/citation-lookup.functions.ts"
}, (opts) => lookupCitation.__executeServer(opts));
var lookupCitation = createServerFn({ method: "POST" }).inputValidator((data) => schema.parse(data)).handler(lookupCitation_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-DC5BpFfG.mjs");
	const { data: row, error } = await supabaseAdmin.from("citations").select("citation_number, plate_number, offense, amount, status, issued_at, vehicle_model").eq("citation_number", data.reference.toUpperCase()).ilike("plate_number", data.plate.replace(/\s+/g, "")).maybeSingle();
	if (error) throw new Error("Lookup failed. Please try again.");
	return row ?? null;
});
//#endregion
export { lookupCitation_createServerFn_handler };
