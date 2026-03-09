"use client";

import { createClient } from "@/lib/supabase/client";
import type { Bakery, Pastry } from "@/types/database";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

/** Escape special Postgres ILIKE characters so user input is treated literally. */
function escapeIlike(input: string): string {
	return input.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all bakeries, optionally filtered by city.
 */
export function useBakeries(city?: string) {
	return useQuery<Bakery[]>({
		queryKey: ["bakeries", { city }],
		queryFn: async () => {
			let query = supabase.from("bakeries").select("*").order("name");
			if (city) {
				query = query.ilike("city", `%${escapeIlike(city)}%`);
			}
			const { data, error } = await query;
			if (error) throw error;
			return data as Bakery[];
		},
	});
}

/**
 * Fetch a single bakery by slug, including its pastries.
 */
export function useBakery(slug: string) {
	return useQuery<Bakery & { pastries: Pastry[] }>({
		queryKey: ["bakery", slug],
		enabled: !!slug,
		queryFn: async () => {
			const { data: bakery, error: bErr } = await supabase
				.from("bakeries")
				.select("*")
				.eq("slug", slug)
				.single();
			if (bErr) throw bErr;

			const { data: pastries, error: pErr } = await supabase
				.from("pastries")
				.select("*")
				.eq("bakery_id", bakery.id)
				.order("total_checkins", { ascending: false });
			if (pErr) throw pErr;

			return { ...(bakery as Bakery), pastries: pastries as Pastry[] };
		},
	});
}

/**
 * Search bakeries by name using Postgres trigram similarity.
 */
export function useSearchBakeries(query: string) {
	return useQuery<Bakery[]>({
		queryKey: ["bakeries", "search", query],
		enabled: query.length >= 2,
		queryFn: async () => {
			const escaped = escapeIlike(query);
			const { data, error } = await supabase
				.from("bakeries")
				.select("*")
				.or(`name.ilike.%${escaped}%,city.ilike.%${escaped}%,address.ilike.%${escaped}%`)
				.order("name")
				.limit(20);
			if (error) throw error;
			return data as Bakery[];
		},
	});
}

/**
 * Fetch bakeries near a geographic point using earthdistance.
 * Requires an RPC function — falls back to a simple bounding-box filter.
 */
export function useNearbyBakeries(lat: number, lng: number, radiusKm = 10) {
	return useQuery<Bakery[]>({
		queryKey: ["bakeries", "nearby", lat, lng, radiusKm],
		enabled: lat !== 0 && lng !== 0,
		queryFn: async () => {
			// Simple bounding box approximation (~0.009 degrees per km at mid latitudes)
			const delta = radiusKm * 0.009;
			const { data, error } = await supabase
				.from("bakeries")
				.select("*")
				.gte("latitude", lat - delta)
				.lte("latitude", lat + delta)
				.gte("longitude", lng - delta)
				.lte("longitude", lng + delta);
			if (error) throw error;
			return data as Bakery[];
		},
	});
}
