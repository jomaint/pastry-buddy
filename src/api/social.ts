"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UnlockedFeatures = {
	total_checkins: number;
	basic_profile: boolean;
	recommendations: boolean;
	discover_filters: boolean;
	taste_profile: boolean;
	lists: boolean;
	badges: boolean;
	streaks: boolean;
	taste_match: boolean;
	leaderboard: boolean;
	advanced_stats: boolean;
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Get a user's consecutive-day check-in streak via SQL function.
 */
export function useStreakRpc(userId?: string) {
	return useQuery<number>({
		queryKey: ["streak-rpc", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_user_streak", {
				p_user_id: userId as string,
			});
			if (error) throw error;
			return (data as number) ?? 0;
		},
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Get taste similarity score between two users (0-99) via SQL function.
 * Returns null if either user has < 3 check-ins.
 */
export function useTasteSimilarity(userA?: string, userB?: string) {
	return useQuery<number | null>({
		queryKey: ["taste-similarity", userA, userB],
		enabled: !!userA && !!userB && userA !== userB,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_taste_similarity", {
				p_user_a: userA as string,
				p_user_b: userB as string,
			});
			if (error) throw error;
			return data as number | null;
		},
		staleTime: 1000 * 60 * 10,
	});
}

/**
 * Get how well a pastry matches a user's taste profile (0-99).
 * Returns null if user has no taste data.
 */
export function usePastryMatchScore(userId?: string, pastryId?: string) {
	return useQuery<number | null>({
		queryKey: ["pastry-match", userId, pastryId],
		enabled: !!userId && !!pastryId,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_pastry_match_score", {
				p_user_id: userId as string,
				p_pastry_id: pastryId as string,
			});
			if (error) throw error;
			return data as number | null;
		},
		staleTime: 1000 * 60 * 10,
	});
}

/**
 * Get which features a user has unlocked based on their check-in count.
 */
export function useUnlockedFeatures(userId?: string) {
	return useQuery<UnlockedFeatures>({
		queryKey: ["unlocked-features", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_user_unlocked_features", {
				p_user_id: userId as string,
			});
			if (error) throw error;
			return data as unknown as UnlockedFeatures;
		},
		staleTime: 1000 * 60 * 2,
	});
}
