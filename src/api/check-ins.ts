"use client";

import type { Database } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import type { CheckIn } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FeedItem = Database["public"]["Views"]["feed_view"]["Row"];

type CreateCheckInInput = {
	pastry_id: string;
	bakery_id: string;
	rating: number;
	notes?: string;
	photo_url?: string;
	flavor_tags?: string[];
	taste_ratings?: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch the social feed — check-ins from users the current user follows,
 * plus their own. Falls back to global feed if not following anyone.
 */
export function useFeed(opts?: { limit?: number; offset?: number }) {
	const { limit = 20, offset = 0 } = opts ?? {};

	return useQuery<FeedItem[]>({
		queryKey: ["feed", { limit, offset }],
		queryFn: async () => {
			// First check if user is authenticated
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				// Get the list of users we follow
				const { data: follows } = await supabase
					.from("follows")
					.select("following_id")
					.eq("follower_id", user.id);

				const followingIds = (follows ?? []).map((f: { following_id: string }) => f.following_id);

				// If following people, show their feed + own; otherwise global
				if (followingIds.length > 0) {
					const ids = [...followingIds, user.id];
					const { data, error } = await supabase
						.from("feed_view")
						.select("*")
						.in("user_id", ids)
						.order("created_at", { ascending: false })
						.range(offset, offset + limit - 1);
					if (error) throw error;
					return data as FeedItem[];
				}
			}

			// Global feed fallback
			const { data, error } = await supabase
				.from("feed_view")
				.select("*")
				.order("created_at", { ascending: false })
				.range(offset, offset + limit - 1);
			if (error) throw error;
			return data as FeedItem[];
		},
	});
}

/**
 * Fetch check-ins for a specific pastry.
 */
export function usePastryCheckIns(pastryId: string) {
	return useQuery<FeedItem[]>({
		queryKey: ["check-ins", "pastry", pastryId],
		enabled: !!pastryId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("feed_view")
				.select("*")
				.eq("pastry_id", pastryId)
				.order("created_at", { ascending: false })
				.limit(50);
			if (error) throw error;
			return data as FeedItem[];
		},
	});
}

/**
 * Fetch a single check-in by ID from the feed_view (includes joined data).
 */
export function useCheckIn(id: string) {
	return useQuery<FeedItem>({
		queryKey: ["check-in", id],
		enabled: !!id,
		queryFn: async () => {
			const { data, error } = await supabase.from("feed_view").select("*").eq("id", id).single();
			if (error) throw error;
			return data as FeedItem;
		},
	});
}

/**
 * Fetch flavor tag distribution for a user's taste profile.
 */
export function useTasteProfile(userId?: string) {
	return useQuery<{ tag: string; count: number }[]>({
		queryKey: ["taste-profile", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("check_ins")
				.select("flavor_tags")
				.eq("user_id", userId as string);
			if (error) throw error;

			const tagCounts: Record<string, number> = {};
			for (const row of data ?? []) {
				for (const tag of (row as { flavor_tags: string[] }).flavor_tags ?? []) {
					tagCounts[tag] = (tagCounts[tag] || 0) + 1;
				}
			}

			return Object.entries(tagCounts)
				.map(([tag, count]) => ({ tag, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 8);
		},
	});
}

/**
 * Fetch a user's top-rated pastries (highest rated check-ins).
 */
export function useTopRatedPastries(userId?: string) {
	return useQuery<
		{ pastry_name: string; bakery_name: string; rating: number; pastry_slug: string }[]
	>({
		queryKey: ["top-rated", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("feed_view")
				.select("*")
				.eq("user_id", userId as string)
				.order("rating", { ascending: false })
				.limit(5);
			if (error) throw error;

			return (data ?? []).map((row: Record<string, unknown>) => ({
				pastry_name: row.pastry_name as string,
				bakery_name: row.bakery_name as string,
				rating: row.rating as number,
				pastry_slug: row.pastry_slug as string,
			}));
		},
	});
}

/**
 * Get category-specific check-in counts and whether user has a perfect rating.
 */
export function useBadgeStats(userId?: string) {
	return useQuery<{ categoryCheckins: Record<string, number>; hasPerfectRating: boolean }>({
		queryKey: ["badge-stats", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("feed_view")
				.select("pastry_category, rating")
				.eq("user_id", userId as string);
			if (error) throw error;

			const categoryCheckins: Record<string, number> = {};
			let hasPerfectRating = false;

			for (const row of (data ?? []) as { pastry_category: string; rating: number }[]) {
				categoryCheckins[row.pastry_category] = (categoryCheckins[row.pastry_category] || 0) + 1;
				if (row.rating === 5) hasPerfectRating = true;
			}

			return { categoryCheckins, hasPerfectRating };
		},
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Get a user's flavor tag counts for taste match calculation.
 */
export function useUserFlavorTags(userId?: string) {
	return useQuery<Record<string, number>>({
		queryKey: ["user-flavor-tags", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("check_ins")
				.select("flavor_tags")
				.eq("user_id", userId as string);
			if (error) throw error;

			const tagCounts: Record<string, number> = {};
			for (const row of data ?? []) {
				for (const tag of (row as { flavor_tags: string[] }).flavor_tags ?? []) {
					tagCounts[tag] = (tagCounts[tag] || 0) + 1;
				}
			}
			return tagCounts;
		},
		staleTime: 1000 * 60 * 5,
	});
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new check-in. Invalidates feed and check-in caches on success.
 */
export function useCreateCheckIn() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateCheckInInput) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { data, error } = await supabase
				.from("check_ins")
				.insert({
					user_id: user.id,
					pastry_id: input.pastry_id,
					bakery_id: input.bakery_id,
					rating: input.rating,
					notes: input.notes ?? null,
					photo_url: input.photo_url ?? null,
					flavor_tags: input.flavor_tags ?? [],
					taste_ratings: input.taste_ratings ?? null,
				})
				.select()
				.single();
			if (error) throw error;
			return data as CheckIn;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["feed"] });
			queryClient.invalidateQueries({ queryKey: ["check-ins"] });
			queryClient.invalidateQueries({ queryKey: ["pastries"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["bakeries-visited"] });
			queryClient.invalidateQueries({ queryKey: ["recommendations"] });
			queryClient.invalidateQueries({ queryKey: ["taste-profile"] });
			queryClient.invalidateQueries({ queryKey: ["top-rated"] });
			queryClient.invalidateQueries({ queryKey: ["streak-rpc"] });
			queryClient.invalidateQueries({ queryKey: ["unlocked-features"] });
			queryClient.invalidateQueries({ queryKey: ["taste-similarity"] });
			queryClient.invalidateQueries({ queryKey: ["pastry-match"] });
			queryClient.invalidateQueries({ queryKey: ["getting-started"] });
		},
	});
}
