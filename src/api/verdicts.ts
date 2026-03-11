"use client";

import { createClient } from "@/lib/supabase/client";
import type { UserItemVerdict, VerdictLabel } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

export const VERDICT_LABELS: { value: VerdictLabel; label: string; emoji: string }[] = [
	{ value: "go_to", label: "My go-to", emoji: "🏆" },
	{ value: "hidden_gem", label: "Hidden gem", emoji: "💎" },
	{ value: "worth_the_detour", label: "Worth the detour", emoji: "🗺" },
	{ value: "one_and_done", label: "One and done", emoji: "👋" },
	{ value: "overrated", label: "Overrated", emoji: "😬" },
];

/**
 * Fetch a user's verdict for a specific pastry+place.
 */
export function useVerdict(userId?: string, pastryId?: string, placeId?: string) {
	return useQuery<UserItemVerdict | null>({
		queryKey: ["verdict", userId, pastryId, placeId],
		enabled: !!userId && !!pastryId && !!placeId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("user_item_verdicts")
				.select("*")
				.eq("user_id", userId as string)
				.eq("pastry_id", pastryId as string)
				.eq("place_id", placeId as string)
				.maybeSingle();
			if (error) throw error;
			return data as UserItemVerdict | null;
		},
	});
}

/**
 * Set or update a verdict label on an item card.
 */
export function useSetVerdict() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			pastryId,
			placeId,
			verdict,
		}: {
			pastryId: string;
			placeId: string;
			verdict: VerdictLabel;
		}) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { data, error } = await supabase
				.from("user_item_verdicts")
				.upsert(
					{
						user_id: user.id,
						pastry_id: pastryId,
						place_id: placeId,
						verdict,
					},
					{ onConflict: "user_id,pastry_id,place_id" },
				)
				.select()
				.single();
			if (error) throw error;
			return data as UserItemVerdict;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["verdict"],
			});
			queryClient.invalidateQueries({ queryKey: ["item-cards"] });
		},
	});
}
