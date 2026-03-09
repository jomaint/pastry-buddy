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
 * Fetch pastries with optional filters (category, bakery, sort).
 */
export function usePastries(opts?: {
	category?: string;
	bakeryId?: string;
	sort?: "rating" | "checkins" | "newest";
	limit?: number;
}) {
	const { category, bakeryId, sort = "checkins", limit = 50 } = opts ?? {};

	return useQuery<Pastry[]>({
		queryKey: ["pastries", { category, bakeryId, sort, limit }],
		queryFn: async () => {
			let query = supabase.from("pastries").select("*");

			if (category) query = query.eq("category", category);
			if (bakeryId) query = query.eq("bakery_id", bakeryId);

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
 * Fetch a single pastry by slug, including its bakery.
 */
export function usePastry(slug: string) {
	return useQuery<Pastry & { bakery: Bakery }>({
		queryKey: ["pastry", slug],
		enabled: !!slug,
		queryFn: async () => {
			const { data: pastry, error: pErr } = await supabase
				.from("pastries")
				.select("*")
				.eq("slug", slug)
				.single();
			if (pErr) throw pErr;

			const { data: bakery, error: bErr } = await supabase
				.from("bakeries")
				.select("*")
				.eq("id", pastry.bakery_id)
				.single();
			if (bErr) throw bErr;

			return { ...(pastry as Pastry), bakery: bakery as Bakery };
		},
	});
}

/**
 * Search pastries by name, category, or description using trigram similarity.
 */
export function useSearchPastries(query: string) {
	return useQuery<(Pastry & { bakery_name: string })[]>({
		queryKey: ["pastries", "search", query],
		enabled: query.length >= 2,
		queryFn: async () => {
			const escaped = escapeIlike(query);
			const { data, error } = await supabase
				.from("pastries")
				.select("*, bakeries!inner(name)")
				.or(`name.ilike.%${escaped}%,category.ilike.%${escaped}%,description.ilike.%${escaped}%`)
				.order("total_checkins", { ascending: false })
				.limit(20);
			if (error) throw error;

			// Flatten the bakery name into each row
			return (data ?? []).map((row: Record<string, unknown>) => ({
				...(row as unknown as Pastry),
				bakery_name: (row.bakeries as { name: string })?.name ?? "",
			}));
		},
	});
}

/**
 * Fetch trending pastries (highest check-in count).
 */
export function useTrendingPastries(limit = 6) {
	return usePastries({ sort: "checkins", limit });
}
