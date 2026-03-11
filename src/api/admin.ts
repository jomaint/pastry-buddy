"use client";

import { createClient } from "@/lib/supabase/client";
import type { CheckIn, Pastry, Place, Profile } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminStats = {
	total_users: number;
	total_checkins: number;
	total_pastries: number;
	total_places: number;
	total_comments: number;
	users_today: number;
	checkins_today: number;
	checkins_this_week: number;
	checkins_this_month: number;
};

type PaginationOpts = {
	search?: string;
	page?: number;
	limit?: number;
};

type AdminCheckIn = CheckIn & {
	profiles: { username: string; display_name: string | null };
	pastries: { name: string; category: string };
	places: { name: string; city: string | null };
};

type AdminPastry = Pastry & {
	places: { name: string };
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch aggregate admin dashboard stats via an RPC function.
 */
export function useAdminStats() {
	return useQuery<AdminStats>({
		queryKey: ["admin", "stats"],
		queryFn: async () => {
			const { data, error } = await supabase.rpc("fn_admin_stats");
			if (error) throw error;
			return data as AdminStats;
		},
	});
}

/**
 * Paginated list of all user profiles, with optional search on username.
 */
export function useAdminUsers(opts: PaginationOpts = {}) {
	const { search, page = 0, limit = 20 } = opts;

	return useQuery<{ data: Profile[]; count: number }>({
		queryKey: ["admin", "users", opts],
		queryFn: async () => {
			const from = page * limit;
			const to = from + limit - 1;

			let query = supabase
				.from("profiles")
				.select("*", { count: "exact" })
				.order("created_at", { ascending: false })
				.range(from, to);

			if (search) {
				query = query.ilike("username", `%${search}%`);
			}

			const { data, error, count } = await query;
			if (error) throw error;
			return { data: (data ?? []) as Profile[], count: count ?? 0 };
		},
	});
}

/**
 * Paginated list of all check-ins with joined user, pastry, and place info.
 */
export function useAdminCheckIns(opts: PaginationOpts = {}) {
	const { search, page = 0, limit = 20 } = opts;

	return useQuery<{ data: AdminCheckIn[]; count: number }>({
		queryKey: ["admin", "check-ins", opts],
		queryFn: async () => {
			const from = page * limit;
			const to = from + limit - 1;

			let query = supabase
				.from("check_ins")
				.select(
					"*, profiles!check_ins_user_id_fkey(username, display_name), pastries!inner(name, category), places!inner(name, city)",
					{ count: "exact" },
				)
				.order("created_at", { ascending: false })
				.range(from, to);

			if (search) {
				query = query.ilike("notes", `%${search}%`);
			}

			const { data, error, count } = await query;
			if (error) throw error;
			return { data: (data ?? []) as AdminCheckIn[], count: count ?? 0 };
		},
	});
}

/**
 * Paginated list of all places, with optional search on name.
 */
export function useAdminPlaces(opts: PaginationOpts = {}) {
	const { search, page = 0, limit = 20 } = opts;

	return useQuery<{ data: Place[]; count: number }>({
		queryKey: ["admin", "places", opts],
		queryFn: async () => {
			const from = page * limit;
			const to = from + limit - 1;

			let query = supabase
				.from("places")
				.select("*", { count: "exact" })
				.order("name", { ascending: true })
				.range(from, to);

			if (search) {
				query = query.ilike("name", `%${search}%`);
			}

			const { data, error, count } = await query;
			if (error) throw error;
			return { data: (data ?? []) as Place[], count: count ?? 0 };
		},
	});
}

/**
 * Paginated list of all pastries with joined place name, optional search on pastry name.
 */
export function useAdminPastries(opts: PaginationOpts = {}) {
	const { search, page = 0, limit = 20 } = opts;

	return useQuery<{ data: AdminPastry[]; count: number }>({
		queryKey: ["admin", "pastries", opts],
		queryFn: async () => {
			const from = page * limit;
			const to = from + limit - 1;

			let query = supabase
				.from("pastries")
				.select("*, places!inner(name)", { count: "exact" })
				.order("name", { ascending: true })
				.range(from, to);

			if (search) {
				query = query.ilike("name", `%${search}%`);
			}

			const { data, error, count } = await query;
			if (error) throw error;
			return { data: (data ?? []) as AdminPastry[], count: count ?? 0 };
		},
	});
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Update any fields on a user profile by id.
 */
export function useAdminUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...fields }: Partial<Profile> & { id: string }) => {
			const { data, error } = await supabase
				.from("profiles")
				.update(fields)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	});
}

/**
 * Delete a check-in by id.
 */
export function useAdminDeleteCheckIn() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("check_ins").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "check-ins"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	});
}

/**
 * Delete a comment by id.
 */
export function useAdminDeleteComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("check_in_comments").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	});
}

/**
 * Update pastry fields by id.
 */
export function useAdminUpdatePastry() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...fields }: Partial<Pastry> & { id: string }) => {
			const { data, error } = await supabase
				.from("pastries")
				.update(fields)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "pastries"] });
		},
	});
}

/**
 * Delete a pastry by id.
 */
export function useAdminDeletePastry() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("pastries").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "pastries"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	});
}

/**
 * Update place fields by id.
 */
export function useAdminUpdatePlace() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...fields }: Partial<Place> & { id: string }) => {
			const { data, error } = await supabase
				.from("places")
				.update(fields)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "places"] });
		},
	});
}

/**
 * Delete a place by id.
 */
export function useAdminDeletePlace() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("places").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "places"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	});
}

/**
 * Merge two places: reassign all pastries and check-ins from the source place
 * to the target place, then delete the source.
 */
export function useAdminMergePlaces() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
			// Move all pastries from source to target
			const { error: pastryError } = await supabase
				.from("pastries")
				.update({ place_id: targetId })
				.eq("place_id", sourceId);
			if (pastryError) throw pastryError;

			// Move all check-ins from source to target
			const { error: checkInError } = await supabase
				.from("check_ins")
				.update({ place_id: targetId })
				.eq("place_id", sourceId);
			if (checkInError) throw checkInError;

			// Delete the source place
			const { error: deleteError } = await supabase.from("places").delete().eq("id", sourceId);
			if (deleteError) throw deleteError;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "places"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "pastries"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	});
}
