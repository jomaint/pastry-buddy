"use client";

import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GettingStartedChecklist = {
	has_set_categories: boolean;
	has_first_checkin: boolean;
	has_followed_someone: boolean;
	has_created_list: boolean;
	has_five_checkins: boolean;
	checkin_count: number;
	onboarding_completed: boolean;
};

export type OnboardingStep = "welcome" | "categories" | "location" | "done";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch the getting-started checklist for the current user.
 * Returns progress on key milestones (first check-in, follow, list, etc).
 */
export function useGettingStartedChecklist(userId?: string) {
	return useQuery<GettingStartedChecklist>({
		queryKey: ["getting-started", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_getting_started_checklist", {
				p_user_id: userId as string,
			});
			if (error) throw error;
			return data as unknown as GettingStartedChecklist;
		},
		staleTime: 1000 * 60 * 2,
	});
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Complete onboarding: saves favorite categories and marks onboarding done.
 */
export function useCompleteOnboarding() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (favoriteCategories: string[]) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { error } = await supabase.rpc("fn_complete_onboarding", {
				p_user_id: user.id,
				p_favorite_categories: favoriteCategories,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			queryClient.invalidateQueries({ queryKey: ["getting-started"] });
			queryClient.invalidateQueries({ queryKey: ["unlocked-features"] });
		},
	});
}

/**
 * Update the current onboarding step (for resuming onboarding).
 */
export function useUpdateOnboardingStep() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (step: OnboardingStep) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { error } = await supabase.rpc("fn_update_onboarding_step", {
				p_user_id: user.id,
				p_step: step,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
		},
	});
}

/**
 * Skip onboarding entirely (mark as completed without setting categories).
 */
export function useSkipOnboarding() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { error } = await supabase
				.from("profiles")
				.update({
					onboarding_completed: true,
					onboarding_step: "done",
				})
				.eq("id", user.id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			queryClient.invalidateQueries({ queryKey: ["getting-started"] });
		},
	});
}
