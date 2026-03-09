"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

/**
 * Fetch a profile by username.
 */
export function useProfileByUsername(username: string) {
	return useQuery<Profile | null>({
		queryKey: ["profile", "username", username],
		enabled: !!username,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("username", username)
				.single();
			if (error) {
				if (error.code === "PGRST116") return null; // not found
				throw error;
			}
			return data as Profile;
		},
	});
}

/**
 * Fetch follower/following counts for a profile.
 */
export function useFollowCounts(userId: string) {
	return useQuery({
		queryKey: ["follow-counts", userId],
		enabled: !!userId,
		queryFn: async () => {
			const [{ count: followers }, { count: following }] = await Promise.all([
				supabase
					.from("follows")
					.select("*", { count: "exact", head: true })
					.eq("following_id", userId),
				supabase
					.from("follows")
					.select("*", { count: "exact", head: true })
					.eq("follower_id", userId),
			]);
			return { followers: followers ?? 0, following: following ?? 0 };
		},
	});
}

/**
 * Check if the current user follows a given user.
 */
export function useIsFollowing(targetUserId: string) {
	return useQuery<boolean>({
		queryKey: ["is-following", targetUserId],
		enabled: !!targetUserId,
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return false;

			const { count } = await supabase
				.from("follows")
				.select("*", { count: "exact", head: true })
				.eq("follower_id", user.id)
				.eq("following_id", targetUserId);
			return (count ?? 0) > 0;
		},
	});
}

/**
 * Follow a user.
 */
export function useFollow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (targetUserId: string) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { error } = await supabase.from("follows").insert({
				follower_id: user.id,
				following_id: targetUserId,
			});
			if (error) throw error;
		},
		onSuccess: (_data, targetUserId) => {
			queryClient.invalidateQueries({ queryKey: ["is-following", targetUserId] });
			queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
			queryClient.invalidateQueries({ queryKey: ["feed"] });
		},
	});
}

/**
 * Unfollow a user.
 */
export function useUnfollow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (targetUserId: string) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { error } = await supabase
				.from("follows")
				.delete()
				.eq("follower_id", user.id)
				.eq("following_id", targetUserId);
			if (error) throw error;
		},
		onSuccess: (_data, targetUserId) => {
			queryClient.invalidateQueries({ queryKey: ["is-following", targetUserId] });
			queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
			queryClient.invalidateQueries({ queryKey: ["feed"] });
		},
	});
}

/**
 * Update the current user's profile.
 */
export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			updates: Partial<
				Pick<Profile, "display_name" | "bio" | "avatar_url" | "favorite_categories">
			>,
		) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { data, error } = await supabase
				.from("profiles")
				.update(updates)
				.eq("id", user.id)
				.select()
				.single();
			if (error) throw error;
			return data as Profile;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
	});
}

/**
 * Get unique bakeries a user has visited (via check-ins).
 */
export function useBakeriesVisited(userId: string) {
	return useQuery<number>({
		queryKey: ["bakeries-visited", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("check_ins")
				.select("bakery_id")
				.eq("user_id", userId);
			if (error) throw error;
			const unique = new Set((data ?? []).map((d: { bakery_id: string }) => d.bakery_id));
			return unique.size;
		},
	});
}
