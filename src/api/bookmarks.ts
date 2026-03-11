"use client";

import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all "Want to Try" bookmarks for the current user, with pastry + place info.
 */
export function useBookmarks() {
	return useQuery<
		(Bookmark & { pastry_name: string; pastry_category: string; place_name: string })[]
	>({
		queryKey: ["bookmarks"],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase
				.from("bookmarks")
				.select("*, pastries!inner(name, category), places!inner(name)")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false });
			if (error) throw error;

			return (data ?? []).map((row: Record<string, unknown>) => ({
				...(row as unknown as Bookmark),
				pastry_name: (row.pastries as { name: string })?.name ?? "",
				pastry_category: (row.pastries as { category: string })?.category ?? "",
				place_name: (row.places as { name: string })?.name ?? "",
			}));
		},
	});
}

/**
 * Check if the current user has bookmarked a specific pastry.
 */
export function useIsBookmarked(pastryId: string) {
	return useQuery<boolean>({
		queryKey: ["bookmarks", "check", pastryId],
		enabled: !!pastryId,
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return false;

			const { count, error } = await supabase
				.from("bookmarks")
				.select("*", { count: "exact", head: true })
				.eq("user_id", user.id)
				.eq("pastry_id", pastryId);
			if (error) throw error;
			return (count ?? 0) > 0;
		},
	});
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Toggle bookmark on a pastry (save if not saved, remove if already saved).
 */
export function useToggleBookmark() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ pastryId, placeId }: { pastryId: string; placeId: string }) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { data: existing } = await supabase
				.from("bookmarks")
				.select("id")
				.eq("user_id", user.id)
				.eq("pastry_id", pastryId)
				.maybeSingle();

			if (existing) {
				const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
				if (error) throw error;
				return { action: "removed" as const };
			}

			const { error } = await supabase
				.from("bookmarks")
				.insert({ user_id: user.id, pastry_id: pastryId, place_id: placeId });
			if (error) throw error;
			return { action: "saved" as const };
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			queryClient.invalidateQueries({ queryKey: ["bookmarks", "check", variables.pastryId] });
		},
	});
}
