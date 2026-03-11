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
	place_id: string;
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
		{
			pastry_id: string;
			pastry_name: string;
			pastry_slug: string;
			place_id: string;
			place_name: string;
			rating: number;
		}[]
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
				pastry_id: row.pastry_id as string,
				pastry_name: row.pastry_name as string,
				pastry_slug: row.pastry_slug as string,
				place_id: row.place_id as string,
				place_name: row.place_name as string,
				rating: row.rating as number,
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
// Item Card Queries (Journal / Profile)
// ---------------------------------------------------------------------------

/**
 * An Item Card groups all check-ins for the same pastry+place by a user.
 */
export type ItemCard = {
	pastry_id: string;
	place_id: string;
	pastry_name: string;
	pastry_category: string;
	pastry_slug: string;
	place_name: string;
	place_city: string | null;
	latest_rating: number;
	avg_rating: number;
	visit_count: number;
	first_visit: string;
	last_visit: string;
	all_notes: string[];
	all_flavor_tags: string[];
	check_in_ids: string[];
};

/**
 * Fetch Item Cards for a user — groups check-ins by pastry+place.
 * Optionally filter by category group.
 */
export function useItemCards(userId?: string, categoryFilter?: string) {
	return useQuery<ItemCard[]>({
		queryKey: ["item-cards", userId, categoryFilter],
		enabled: !!userId,
		queryFn: async () => {
			let query = supabase
				.from("feed_view")
				.select("*")
				.eq("user_id", userId as string)
				.order("created_at", { ascending: false });

			if (categoryFilter) {
				query = query.eq("pastry_category", categoryFilter);
			}

			const { data, error } = await query;
			if (error) throw error;

			// Group by pastry_id + place_id
			const groups = new Map<string, FeedItem[]>();
			for (const row of (data ?? []) as FeedItem[]) {
				const key = `${row.pastry_id}::${row.place_id}`;
				const existing = groups.get(key) ?? [];
				existing.push(row);
				groups.set(key, existing);
			}

			return Array.from(groups.entries())
				.map(([, items]) => {
					const latest = items[0];
					const ratings = items.map((i) => i.rating).filter((r): r is number => r != null);
					const notes = items
						.map((i) => i.notes)
						.filter((n): n is string => n != null && n.length > 0);
					const tags = [...new Set(items.flatMap((i) => (i.flavor_tags as string[] | null) ?? []))];

					return {
						pastry_id: latest.pastry_id as string,
						place_id: latest.place_id as string,
						pastry_name: (latest.pastry_name as string) ?? "",
						pastry_category: (latest.pastry_category as string) ?? "",
						pastry_slug: (latest.pastry_slug as string) ?? "",
						place_name: (latest.place_name as string) ?? "",
						place_city: (latest.place_city as string) ?? null,
						latest_rating: (latest.rating as number) ?? 0,
						avg_rating:
							ratings.length > 0
								? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
								: 0,
						visit_count: items.length,
						first_visit: items[items.length - 1].created_at as string,
						last_visit: latest.created_at as string,
						all_notes: notes,
						all_flavor_tags: tags,
						check_in_ids: items.map((i) => i.id as string),
					};
				})
				.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime());
		},
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Fetch a user's check-ins for a specific pastry+place (for Item Card detail).
 */
export function useItemCheckIns(userId: string, pastryId: string, placeId: string) {
	return useQuery<FeedItem[]>({
		queryKey: ["item-checkins", userId, pastryId, placeId],
		enabled: !!userId && !!pastryId && !!placeId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("feed_view")
				.select("*")
				.eq("user_id", userId)
				.eq("pastry_id", pastryId)
				.eq("place_id", placeId)
				.order("created_at", { ascending: false });
			if (error) throw error;
			return data as FeedItem[];
		},
	});
}

/**
 * Get auto-rankings: user's top items per category.
 */
export function useAutoRankings(userId?: string) {
	return useQuery<Record<string, ItemCard[]>>({
		queryKey: ["auto-rankings", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("feed_view")
				.select("*")
				.eq("user_id", userId as string)
				.order("created_at", { ascending: false });
			if (error) throw error;

			// Group by pastry_id + place_id, then rank by latest rating within each category
			const groups = new Map<string, FeedItem[]>();
			for (const row of (data ?? []) as FeedItem[]) {
				const key = `${row.pastry_id}::${row.place_id}`;
				const existing = groups.get(key) ?? [];
				existing.push(row);
				groups.set(key, existing);
			}

			const cards: ItemCard[] = Array.from(groups.entries()).map(([, items]) => {
				const latest = items[0];
				const ratings = items.map((i) => i.rating).filter((r): r is number => r != null);
				return {
					pastry_id: latest.pastry_id as string,
					place_id: latest.place_id as string,
					pastry_name: (latest.pastry_name as string) ?? "",
					pastry_category: (latest.pastry_category as string) ?? "",
					pastry_slug: (latest.pastry_slug as string) ?? "",
					place_name: (latest.place_name as string) ?? "",
					place_city: (latest.place_city as string) ?? null,
					latest_rating: (latest.rating as number) ?? 0,
					avg_rating:
						ratings.length > 0
							? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
							: 0,
					visit_count: items.length,
					first_visit: items[items.length - 1].created_at as string,
					last_visit: latest.created_at as string,
					all_notes: items
						.map((i) => i.notes)
						.filter((n): n is string => n != null && n.length > 0),
					all_flavor_tags: [
						...new Set(items.flatMap((i) => (i.flavor_tags as string[] | null) ?? [])),
					],
					check_in_ids: items.map((i) => i.id as string),
				};
			});

			// Group by category and take top 5 per category
			const rankings: Record<string, ItemCard[]> = {};
			for (const card of cards) {
				const cat = card.pastry_category || "Other";
				if (!rankings[cat]) rankings[cat] = [];
				rankings[cat].push(card);
			}
			for (const cat of Object.keys(rankings)) {
				rankings[cat] = rankings[cat].sort((a, b) => b.latest_rating - a.latest_rating).slice(0, 5);
			}

			return rankings;
		},
		staleTime: 1000 * 60 * 5,
	});
}

// ---------------------------------------------------------------------------
// Place-scoped queries
// ---------------------------------------------------------------------------

/**
 * Fetch recent check-ins at a specific place.
 */
export function usePlaceCheckIns(placeId: string, limit = 20) {
	return useQuery<FeedItem[]>({
		queryKey: ["check-ins", "place", placeId, limit],
		enabled: !!placeId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("feed_view")
				.select("*")
				.eq("place_id", placeId)
				.order("created_at", { ascending: false })
				.limit(limit);
			if (error) throw error;
			return data as FeedItem[];
		},
	});
}

/**
 * Fetch check-ins for a specific pastry at a specific place.
 */
export function usePastryCheckInsAtPlace(
	pastryId: string,
	placeId: string,
	opts?: { enabled?: boolean },
) {
	return useQuery<FeedItem[]>({
		queryKey: ["check-ins", "pastry-at-place", pastryId, placeId],
		enabled: (opts?.enabled ?? true) && !!pastryId && !!placeId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("feed_view")
				.select("*")
				.eq("pastry_id", pastryId)
				.eq("place_id", placeId)
				.order("created_at", { ascending: false })
				.limit(5);
			if (error) throw error;
			return data as FeedItem[];
		},
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
					place_id: input.place_id,
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
			queryClient.invalidateQueries({ queryKey: ["places-visited"] });
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
