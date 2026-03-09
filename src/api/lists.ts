"use client";

import { createClient } from "@/lib/supabase/client";
import type { List, ListItem, Pastry } from "@/types/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListWithItems = List & {
	items: (ListItem & { pastry: Pastry })[];
};

type CreateListInput = {
	name: string;
	description?: string;
	is_public?: boolean;
};

type AddToListInput = {
	list_id: string;
	pastry_id: string;
	rank?: number;
	notes?: string;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all lists for the current user.
 */
export function useLists() {
	return useQuery<List[]>({
		queryKey: ["lists"],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase
				.from("lists")
				.select("*")
				.eq("user_id", user.id)
				.order("updated_at", { ascending: false });
			if (error) throw error;
			return data as List[];
		},
	});
}

/**
 * Fetch a single list with all its items and pastry details.
 */
export function useList(listId: string) {
	return useQuery<ListWithItems>({
		queryKey: ["list", listId],
		enabled: !!listId,
		queryFn: async () => {
			const { data: list, error: lErr } = await supabase
				.from("lists")
				.select("*")
				.eq("id", listId)
				.single();
			if (lErr) throw lErr;

			const { data: items, error: iErr } = await supabase
				.from("list_items")
				.select("*, pastries(*)")
				.eq("list_id", listId)
				.order("rank", { ascending: true, nullsFirst: false });
			if (iErr) throw iErr;

			const mappedItems = (items ?? []).map((item: Record<string, unknown>) => ({
				...(item as unknown as ListItem),
				pastry: item.pastries as Pastry,
			}));

			return { ...(list as List), items: mappedItems };
		},
	});
}

/**
 * Fetch public lists for a given user profile.
 */
export function useUserLists(userId: string) {
	return useQuery<List[]>({
		queryKey: ["lists", "user", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("lists")
				.select("*")
				.eq("user_id", userId)
				.eq("is_public", true)
				.order("updated_at", { ascending: false });
			if (error) throw error;
			return data as List[];
		},
	});
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new list.
 */
export function useCreateList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ name, description, is_public = true }: CreateListInput) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const { data, error } = await supabase
				.from("lists")
				.insert({
					user_id: user.id,
					name,
					description: description ?? null,
					is_public,
				})
				.select()
				.single();
			if (error) throw error;
			return data as List;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["lists"] });
		},
	});
}

/**
 * Add a pastry to a list.
 */
export function useAddToList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ list_id, pastry_id, rank, notes }: AddToListInput) => {
			const { data, error } = await supabase
				.from("list_items")
				.insert({
					list_id,
					pastry_id,
					rank: rank ?? null,
					notes: notes ?? null,
				})
				.select()
				.single();
			if (error) throw error;
			return data as ListItem;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["list", variables.list_id] });
			queryClient.invalidateQueries({ queryKey: ["lists"] });
		},
	});
}

/**
 * Remove a pastry from a list.
 */
export function useRemoveFromList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ itemId, listId }: { itemId: string; listId: string }) => {
			const { error } = await supabase.from("list_items").delete().eq("id", itemId);
			if (error) throw error;
			return { listId };
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["list", variables.listId] });
			queryClient.invalidateQueries({ queryKey: ["lists"] });
		},
	});
}
