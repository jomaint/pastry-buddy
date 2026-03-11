"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeaderboardEntry = {
	rank: number;
	user_id: string;
	username: string;
	display_name: string | null;
	avatar_url: string | null;
	checkin_count: number;
	is_self: boolean;
};

export type TopPlaceEntry = {
	rank: number;
	place_id: string;
	place_name: string;
	place_slug: string;
	place_city: string | null;
	checkin_count: number;
	unique_visitors: number;
	avg_rating: number;
};

export type TopPastryEntry = {
	rank: number;
	pastry_id: string;
	pastry_name: string;
	pastry_slug: string;
	pastry_category: string;
	place_name: string;
	checkin_count: number;
	avg_rating: number;
};

export type UserRank = {
	rank: number;
	total_users: number;
	percentile: number;
	total_checkins: number;
	weekly_checkins: number;
	weekly_rank: number;
};

export type LeaderboardScope = "friends" | "global";
export type Timeframe = "week" | "month" | "all";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Weekly leaderboard — ranked users by check-ins this week.
 * Scope: 'friends' (followed users + self) or 'global'.
 */
export function useLeaderboard(scope: LeaderboardScope = "friends", limit = 20) {
	return useQuery<LeaderboardEntry[]>({
		queryKey: ["leaderboard", scope, limit],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase.rpc("fn_weekly_leaderboard", {
				p_user_id: user.id,
				p_scope: scope,
				p_limit: limit,
			});
			if (error) throw error;
			return (data ?? []) as LeaderboardEntry[];
		},
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Top places by check-in volume within a timeframe.
 */
export function useTopPlaces(limit = 10, timeframe: Timeframe = "week") {
	return useQuery<TopPlaceEntry[]>({
		queryKey: ["leaderboard", "places", timeframe, limit],
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_top_places", {
				p_limit: limit,
				p_timeframe: timeframe,
			});
			if (error) throw error;
			return (data ?? []) as TopPlaceEntry[];
		},
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Top-rated pastries within a timeframe (minimum check-in threshold applied server-side).
 */
export function useTopPastries(limit = 10, timeframe: Timeframe = "week") {
	return useQuery<TopPastryEntry[]>({
		queryKey: ["leaderboard", "pastries", timeframe, limit],
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_top_pastries", {
				p_limit: limit,
				p_timeframe: timeframe,
			});
			if (error) throw error;
			return (data ?? []) as TopPastryEntry[];
		},
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Current user's rank, percentile, and weekly stats.
 */
export function useUserRank(userId?: string) {
	return useQuery<UserRank | null>({
		queryKey: ["leaderboard", "rank", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_user_rank", {
				p_user_id: userId as string,
			});
			if (error) throw error;
			const rows = data as UserRank[];
			return rows?.[0] ?? null;
		},
		staleTime: 1000 * 60 * 2,
	});
}
