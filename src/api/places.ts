"use client";

import { createClient } from "@/lib/supabase/client";
import type { Pastry, Place } from "@/types/database";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Place Stats
// ---------------------------------------------------------------------------

export type PlaceStats = {
	totalCheckIns: number;
	uniqueVisitors: number;
	avgRating: number;
};

/**
 * Fetch aggregate stats for a place (total check-ins, unique visitors, avg rating).
 */
export function usePlaceStats(placeId: string) {
	return useQuery<PlaceStats>({
		queryKey: ["place-stats", placeId],
		enabled: !!placeId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("check_ins")
				.select("user_id, rating")
				.eq("place_id", placeId);
			if (error) throw error;

			const rows = data ?? [];
			const uniqueUsers = new Set(rows.map((r: { user_id: string }) => r.user_id));
			const ratings = rows.map((r: { rating: number }) => r.rating).filter((r) => r != null);
			const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

			return {
				totalCheckIns: rows.length,
				uniqueVisitors: uniqueUsers.size,
				avgRating: Math.round(avg * 10) / 10,
			};
		},
		staleTime: 1000 * 60 * 2,
	});
}

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
 * Fetch a single place by ID or slug, including its pastries.
 */
export function usePlace(idOrSlug: string) {
	return useQuery<Place & { pastries: Pastry[] }>({
		queryKey: ["place", idOrSlug],
		enabled: !!idOrSlug,
		queryFn: async () => {
			// Try by ID first, then by slug
			let { data: place, error: bErr } = await supabase
				.from("places")
				.select("*")
				.eq("id", idOrSlug)
				.single();

			if (bErr || !place) {
				const res = await supabase.from("places").select("*").eq("slug", idOrSlug).single();
				place = res.data;
				bErr = res.error;
			}
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
 * Fetch places that have pastries in a given category, with the matching pastries.
 */
export function usePlacesByCategory(category: string | null) {
	return useQuery<(Place & { pastries: Pastry[] })[]>({
		queryKey: ["places", "by-category", category],
		enabled: !!category,
		queryFn: async () => {
			// Fetch pastries in this category with their place info
			const { data, error } = await supabase
				.from("pastries")
				.select("*, places!inner(*)")
				.eq("category", category as string)
				.order("total_checkins", { ascending: false })
				.limit(100);
			if (error) throw error;

			// Group by place
			const placeMap = new Map<string, Place & { pastries: Pastry[] }>();
			for (const row of data ?? []) {
				const place = (row as Record<string, unknown>).places as Place;
				const pastry = { ...(row as unknown as Pastry) };
				if (!placeMap.has(place.id)) {
					placeMap.set(place.id, { ...place, pastries: [] });
				}
				placeMap.get(place.id)!.pastries.push(pastry);
			}

			// Sort places by total pastry check-ins in this category
			return Array.from(placeMap.values()).sort(
				(a, b) =>
					b.pastries.reduce((sum, p) => sum + (p.total_checkins ?? 0), 0) -
					a.pastries.reduce((sum, p) => sum + (p.total_checkins ?? 0), 0),
			);
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
