"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SignUpInput = {
	email: string;
	password: string;
	username: string;
	display_name?: string;
};

type SignInInput = {
	email: string;
	password: string;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the current authenticated user session and profile.
 * Re-fetches on window focus (React Query default) to stay in sync.
 */
export function useAuth() {
	return useQuery<{ user: Profile | null; isAuthenticated: boolean }>({
		queryKey: ["auth"],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return { user: null, isAuthenticated: false };

			const { data: profile, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", user.id)
				.single();

			if (error) {
				// Profile might not exist yet (race condition with trigger)
				return { user: null, isAuthenticated: true };
			}

			return { user: profile as Profile, isAuthenticated: true };
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Sign up with email, password, and username.
 * The username is passed as user metadata so the database trigger
 * (fn_handle_new_user) can set it on the profile row.
 */
export function useSignUp() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async ({ email, password, username, display_name }: SignUpInput) => {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						username,
						display_name: display_name ?? username,
					},
				},
			});
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			router.push("/onboarding");
		},
	});
}

/**
 * Sign in with email + password.
 */
export function useSignIn() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async ({ email, password }: SignInInput) => {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			router.push("/");
		},
	});
}

/**
 * Sign out the current user.
 */
export function useSignOut() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async () => {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.clear();
			router.push("/sign-in");
		},
	});
}
