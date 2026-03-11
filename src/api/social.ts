"use client";

import { createClient } from "@/lib/supabase/client";
import type { CheckInComment, CheckInLike, Notification } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

export type LikeStatus = {
	count: number;
	liked: boolean;
};

/**
 * Get like count and whether the current user liked a check-in.
 */
export function useLikes(checkInId: string) {
	return useQuery<LikeStatus>({
		queryKey: ["likes", checkInId],
		enabled: !!checkInId,
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const { count, error } = await supabase
				.from("check_in_likes")
				.select("*", { count: "exact", head: true })
				.eq("check_in_id", checkInId);
			if (error) throw error;

			let liked = false;
			if (user) {
				const { count: myLike } = await supabase
					.from("check_in_likes")
					.select("*", { count: "exact", head: true })
					.eq("check_in_id", checkInId)
					.eq("user_id", user.id);
				liked = (myLike ?? 0) > 0;
			}

			return { count: count ?? 0, liked };
		},
	});
}

/**
 * Toggle like on a check-in (like if not liked, unlike if already liked).
 */
export function useToggleLike() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (checkInId: string) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			// Check if already liked
			const { data: existing } = await supabase
				.from("check_in_likes")
				.select("id")
				.eq("check_in_id", checkInId)
				.eq("user_id", user.id)
				.maybeSingle();

			if (existing) {
				const { error } = await supabase.from("check_in_likes").delete().eq("id", existing.id);
				if (error) throw error;
				return { action: "unliked" as const };
			}

			const { error } = await supabase
				.from("check_in_likes")
				.insert({ check_in_id: checkInId, user_id: user.id });
			if (error) throw error;
			return { action: "liked" as const };
		},
		onSuccess: (_data, checkInId) => {
			queryClient.invalidateQueries({ queryKey: ["likes", checkInId] });
		},
	});
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export type CommentWithUser = CheckInComment & {
	username: string;
	display_name: string | null;
	avatar_url: string | null;
};

/**
 * Fetch comments for a check-in, joined with user profile info.
 */
export function useComments(checkInId: string) {
	return useQuery<CommentWithUser[]>({
		queryKey: ["comments", checkInId],
		enabled: !!checkInId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("check_in_comments")
				.select("*, profiles:user_id(username, display_name, avatar_url)")
				.eq("check_in_id", checkInId)
				.order("created_at", { ascending: true });
			if (error) throw error;

			return (data ?? []).map((row: Record<string, unknown>) => {
				const profile = row.profiles as Record<string, unknown> | null;
				return {
					id: row.id as string,
					check_in_id: row.check_in_id as string,
					user_id: row.user_id as string,
					body: row.body as string,
					created_at: row.created_at as string,
					username: (profile?.username as string) ?? "",
					display_name: (profile?.display_name as string) ?? null,
					avatar_url: (profile?.avatar_url as string) ?? null,
				};
			});
		},
	});
}

/**
 * Add a comment to a check-in.
 */
export function useAddComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ checkInId, body }: { checkInId: string; body: string }) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { data, error } = await supabase
				.from("check_in_comments")
				.insert({ check_in_id: checkInId, user_id: user.id, body })
				.select()
				.single();
			if (error) throw error;
			return data as CheckInComment;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["comments", variables.checkInId] });
		},
	});
}

/**
 * Delete a comment.
 */
export function useDeleteComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ commentId, checkInId }: { commentId: string; checkInId: string }) => {
			const { error } = await supabase.from("check_in_comments").delete().eq("id", commentId);
			if (error) throw error;
			return { checkInId };
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["comments", data.checkInId] });
		},
	});
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/**
 * Fetch notifications for the current user, most recent first.
 */
export function useNotifications(limit = 30) {
	return useQuery<Notification[]>({
		queryKey: ["notifications", limit],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("notifications")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(limit);
			if (error) throw error;
			return (data ?? []) as Notification[];
		},
		staleTime: 1000 * 30, // 30 seconds
	});
}

/**
 * Get count of unread notifications.
 */
export function useUnreadCount() {
	return useQuery<number>({
		queryKey: ["notifications", "unread"],
		queryFn: async () => {
			const { count, error } = await supabase
				.from("notifications")
				.select("*", { count: "exact", head: true })
				.eq("read", false);
			if (error) throw error;
			return count ?? 0;
		},
		staleTime: 1000 * 30,
		refetchInterval: 1000 * 60, // poll every minute
	});
}

/**
 * Mark notifications as read (all or specific IDs).
 */
export function useMarkNotificationsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notificationIds?: string[]) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			let query = supabase
				.from("notifications")
				.update({ read: true })
				.eq("user_id", user.id)
				.eq("read", false);

			if (notificationIds && notificationIds.length > 0) {
				query = query.in("id", notificationIds);
			}

			const { error } = await query;
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}

// ---------------------------------------------------------------------------
// Friend Suggestions
// ---------------------------------------------------------------------------

export type FriendSuggestion = {
	user_id: string;
	username: string;
	display_name: string | null;
	avatar_url: string | null;
	reason: string;
	score: number;
};

/**
 * Get friend suggestions based on shared places and mutual follows.
 */
export function useFriendSuggestions(limit = 5) {
	return useQuery<FriendSuggestion[]>({
		queryKey: ["friend-suggestions", limit],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase.rpc("fn_friend_suggestions", {
				p_user_id: user.id,
				p_limit: limit,
			});
			if (error) throw error;
			return (data ?? []) as FriendSuggestion[];
		},
		staleTime: 1000 * 60 * 10,
	});
}
