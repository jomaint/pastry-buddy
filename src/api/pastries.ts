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
 * Fetch pastries with optional filters (category, place, sort).
 */
export function usePastries(opts?: {
	category?: string;
	placeId?: string;
	sort?: "rating" | "checkins" | "newest";
	limit?: number;
}) {
	const { category, placeId, sort = "checkins", limit = 50 } = opts ?? {};

	return useQuery<Pastry[]>({
		queryKey: ["pastries", { category, placeId, sort, limit }],
		queryFn: async () => {
			let query = supabase.from("pastries").select("*");

			if (category) query = query.eq("category", category);
			if (placeId) query = query.eq("place_id", placeId);

			switch (sort) {
				case "rating":
					query = query.order("avg_rating", { ascending: false, nullsFirst: false });
					break;
				case "newest":
					query = query.order("created_at", { ascending: false });
					break;
				default:
					query = query.order("total_checkins", { ascending: false });
			}

			const { data, error } = await query.limit(limit);
			if (error) throw error;
			return data as Pastry[];
		},
	});
}

/**
 * Fetch a single pastry by slug, including its place.
 */
export function usePastry(slug: string) {
	return useQuery<Pastry & { place: Place }>({
		queryKey: ["pastry", slug],
		enabled: !!slug,
		queryFn: async () => {
			const { data: pastry, error: pErr } = await supabase
				.from("pastries")
				.select("*")
				.eq("slug", slug)
				.single();
			if (pErr) throw pErr;

			const { data: place, error: bErr } = await supabase
				.from("places")
				.select("*")
				.eq("id", pastry.place_id)
				.single();
			if (bErr) throw bErr;

			return { ...(pastry as Pastry), place: place as Place };
		},
	});
}

/**
 * Search pastries by name, category, or description using trigram similarity.
 */
export function useSearchPastries(query: string) {
	return useQuery<(Pastry & { place_name: string })[]>({
		queryKey: ["pastries", "search", query],
		enabled: query.length >= 2,
		queryFn: async () => {
			const escaped = escapeIlike(query);
			const { data, error } = await supabase
				.from("pastries")
				.select("*, places!inner(name)")
				.or(`name.ilike.%${escaped}%,category.ilike.%${escaped}%,description.ilike.%${escaped}%`)
				.order("total_checkins", { ascending: false })
				.limit(20);
			if (error) throw error;

			// Flatten the place name into each row
			return (data ?? []).map((row: Record<string, unknown>) => ({
				...(row as unknown as Pastry),
				place_name: (row.places as { name: string })?.name ?? "",
			}));
		},
	});
}

/**
 * Fetch featured (staff-picked) pastries, with place name.
 */
export function useFeaturedPastries(limit = 6) {
	return useQuery<(Pastry & { place_name: string })[]>({
		queryKey: ["pastries", "featured", limit],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("pastries")
				.select("*, places!inner(name)")
				.eq("featured", true)
				.order("total_checkins", { ascending: false })
				.limit(limit);
			if (error) throw error;

			return (data ?? []).map((row: Record<string, unknown>) => ({
				...(row as unknown as Pastry),
				place_name: (row.places as { name: string })?.name ?? "",
			}));
		},
	});
}

/**
 * Fetch trending pastries (highest check-in count), with place name.
 */
export function useTrendingPastries(limit = 6) {
	return useQuery<(Pastry & { place_name: string })[]>({
		queryKey: ["pastries", "trending", limit],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("pastries")
				.select("*, places!inner(name)")
				.order("total_checkins", { ascending: false })
				.limit(limit);
			if (error) throw error;

			return (data ?? []).map((row: Record<string, unknown>) => ({
				...(row as unknown as Pastry),
				place_name: (row.places as { name: string })?.name ?? "",
			}));
		},
	});
}
