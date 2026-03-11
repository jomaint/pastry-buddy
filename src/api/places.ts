"use client";

import { createClient } from "@/lib/supabase/client";
import type { Pastry, Place } from "@/types/database";
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
 * Fetch all places, optionally filtered by city.
 */
export function usePlaces(city?: string) {
	return useQuery<Place[]>({
		queryKey: ["places", { city }],
		queryFn: async () => {
			let query = supabase.from("places").select("*").order("name");
			if (city) {
				query = query.ilike("city", `%${escapeIlike(city)}%`);
			}
			const { data, error } = await query;
			if (error) throw error;
			return data as Place[];
		},
	});
}

/**
 * Fetch a single place by slug, including its pastries.
 */
export function usePlace(slug: string) {
	return useQuery<Place & { pastries: Pastry[] }>({
		queryKey: ["place", slug],
		enabled: !!slug,
		queryFn: async () => {
			const { data: place, error: bErr } = await supabase
				.from("places")
				.select("*")
				.eq("slug", slug)
				.single();
			if (bErr) throw bErr;

			const { data: pastries, error: pErr } = await supabase
				.from("pastries")
				.select("*")
				.eq("place_id", place.id)
				.order("total_checkins", { ascending: false });
			if (pErr) throw pErr;

			return { ...(place as Place), pastries: pastries as Pastry[] };
		},
	});
}

/**
 * Search places by name using Postgres trigram similarity.
 */
export function useSearchPlaces(query: string) {
	return useQuery<Place[]>({
		queryKey: ["places", "search", query],
		enabled: query.length >= 2,
		queryFn: async () => {
			const escaped = escapeIlike(query);
			const { data, error } = await supabase
				.from("places")
				.select("*")
				.or(`name.ilike.%${escaped}%,city.ilike.%${escaped}%,address.ilike.%${escaped}%`)
				.order("name")
				.limit(20);
			if (error) throw error;
			return data as Place[];
		},
	});
}

/**
 * Fetch places near a geographic point using earthdistance.
 * Requires an RPC function — falls back to a simple bounding-box filter.
 */
export function useNearbyPlaces(lat: number, lng: number, radiusKm = 10) {
	return useQuery<Place[]>({
		queryKey: ["places", "nearby", lat, lng, radiusKm],
		enabled: lat !== 0 && lng !== 0,
		queryFn: async () => {
			// Simple bounding box approximation (~0.009 degrees per km at mid latitudes)
			const delta = radiusKm * 0.009;
			const { data, error } = await supabase
				.from("places")
				.select("*")
				.gte("latitude", lat - delta)
				.lte("latitude", lat + delta)
				.gte("longitude", lng - delta)
				.lte("longitude", lng + delta);
			if (error) throw error;
			return data as Place[];
		},
	});
}
