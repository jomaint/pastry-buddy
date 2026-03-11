"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecommendedPastry = {
	pastry_id: string;
	pastry_name: string;
	pastry_slug: string;
	pastry_category: string;
	place_name: string;
	place_city: string;
	avg_rating: number | null;
	total_checkins: number;
	score: number;
	reason: string;
};

export type RecommendedPlace = {
	place_id: string;
	place_name: string;
	place_slug: string;
	place_city: string;
	pastry_count: number;
	avg_place_rating: number | null;
	score: number;
	reason: string;
};

export type SimilarPastry = Omit<RecommendedPastry, "reason">;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Content-based pastry recommendations for the current user.
 * Uses flavor tag overlap, category preferences, and ratings.
 */
export function useRecommendedPastries(limit = 10) {
	return useQuery<RecommendedPastry[]>({
		queryKey: ["recommendations", "pastries", limit],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase.rpc("fn_recommend_pastries_content", {
				p_user_id: user.id,
				p_limit: limit,
			});
			if (error) throw error;
			return (data ?? []) as RecommendedPastry[];
		},
		staleTime: 1000 * 60 * 5, // 5 minutes — recs don't change often
	});
}

/**
 * Collaborative filtering recommendations for the current user.
 * "Users with similar taste also liked..."
 */
export function useCollaborativeRecommendations(limit = 10) {
	return useQuery<RecommendedPastry[]>({
		queryKey: ["recommendations", "collaborative", limit],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase.rpc("fn_recommend_pastries_collaborative", {
				p_user_id: user.id,
				p_limit: limit,
			});
			if (error) throw error;
			return (data ?? []) as RecommendedPastry[];
		},
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Similar pastries for a detail page.
 * Based on category match, flavor tag overlap, and community ratings.
 */
export function useSimilarPastries(pastryId: string, limit = 6) {
	return useQuery<SimilarPastry[]>({
		queryKey: ["recommendations", "similar", pastryId, limit],
		enabled: !!pastryId,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_similar_pastries", {
				p_pastry_id: pastryId,
				p_limit: limit,
			});
			if (error) throw error;
			return (data ?? []) as SimilarPastry[];
		},
		staleTime: 1000 * 60 * 10, // 10 minutes — stable data
	});
}

/**
 * Recommended places the user hasn't visited yet.
 * Based on category preferences and place quality.
 */
export function useRecommendedPlaces(limit = 6) {
	return useQuery<RecommendedPlace[]>({
		queryKey: ["recommendations", "places", limit],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase.rpc("fn_recommend_places", {
				p_user_id: user.id,
				p_limit: limit,
			});
			if (error) throw error;
			return (data ?? []) as RecommendedPlace[];
		},
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Personalized feed: merges content-based + collaborative recommendations,
 * deduplicates, and returns a unified ranked list.
 */
export function usePersonalizedFeed(limit = 12) {
	return useQuery<RecommendedPastry[]>({
		queryKey: ["recommendations", "personalized-feed", limit],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			// Fetch both recommendation sources in parallel
			const [contentResult, collabResult] = await Promise.all([
				supabase.rpc("fn_recommend_pastries_content", {
					p_user_id: user.id,
					p_limit: limit,
				}),
				supabase.rpc("fn_recommend_pastries_collaborative", {
					p_user_id: user.id,
					p_limit: limit,
				}),
			]);

			const content = (contentResult.data ?? []) as RecommendedPastry[];
			const collab = (collabResult.data ?? []) as RecommendedPastry[];

			// Merge and deduplicate, keeping the higher score
			const seen = new Map<string, RecommendedPastry>();
			for (const item of [...content, ...collab]) {
				const existing = seen.get(item.pastry_id);
				if (!existing || item.score > existing.score) {
					seen.set(item.pastry_id, item);
				}
			}

			return Array.from(seen.values())
				.sort((a, b) => b.score - a.score)
				.slice(0, limit);
		},
		staleTime: 1000 * 60 * 5,
	});
}
