/**
 * Supabase client utilities.
 *
 * Re-exports the browser and server clients from their dedicated modules
 * and provides a convenience singleton for client components.
 */

export { createClient as createBrowserClient } from "./supabase/client";
export { createClient as createServerClient } from "./supabase/server";

/**
 * Supabase Database type definitions.
 *
 * When you run `supabase gen types typescript` these will be generated
 * automatically. Until then we manually map our application types so
 * the client is fully type-safe.
 */
import type {
	Badge,
	CheckIn,
	CheckInComment,
	CheckInLike,
	Follow,
	List,
	ListItem,
	Notification,
	Pastry,
	Place,
	Profile,
	UserBadge,
} from "@/types/database";

export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: Profile;
				Insert: Omit<
					Profile,
					| "created_at"
					| "updated_at"
					| "level"
					| "xp"
					| "total_checkins"
					| "onboarding_completed"
					| "onboarding_step"
				> & {
					level?: number;
					xp?: number;
					total_checkins?: number;
					onboarding_completed?: boolean;
					onboarding_step?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Omit<Profile, "id" | "created_at">>;
			};
			places: {
				Row: Place;
				Insert: Omit<Place, "created_at"> & { created_at?: string };
				Update: Partial<Omit<Place, "id" | "created_at">>;
			};
			pastries: {
				Row: Pastry;
				Insert: Omit<Pastry, "created_at" | "avg_rating" | "total_checkins"> & {
					avg_rating?: number | null;
					total_checkins?: number;
					created_at?: string;
				};
				Update: Partial<Omit<Pastry, "id" | "created_at">>;
			};
			check_ins: {
				Row: CheckIn;
				Insert: Omit<CheckIn, "id" | "created_at"> & {
					id?: string;
					created_at?: string;
				};
				Update: Partial<Omit<CheckIn, "id" | "created_at">>;
			};
			lists: {
				Row: List;
				Insert: Omit<List, "id" | "created_at" | "updated_at"> & {
					id?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Omit<List, "id" | "created_at">>;
			};
			list_items: {
				Row: ListItem;
				Insert: Omit<ListItem, "id" | "added_at"> & {
					id?: string;
					added_at?: string;
				};
				Update: Partial<Omit<ListItem, "id" | "added_at">>;
			};
			badges: {
				Row: Badge;
				Insert: Omit<Badge, "id" | "created_at"> & {
					id?: string;
					created_at?: string;
				};
				Update: Partial<Omit<Badge, "id" | "created_at">>;
			};
			user_badges: {
				Row: UserBadge;
				Insert: Omit<UserBadge, "id" | "unlocked_at"> & {
					id?: string;
					unlocked_at?: string;
				};
				Update: Partial<Omit<UserBadge, "id">>;
			};
			follows: {
				Row: Follow;
				Insert: Omit<Follow, "id" | "created_at"> & {
					id?: string;
					created_at?: string;
				};
				Update: Partial<Omit<Follow, "id" | "created_at">>;
			};
			check_in_likes: {
				Row: CheckInLike;
				Insert: Omit<CheckInLike, "id" | "created_at"> & {
					id?: string;
					created_at?: string;
				};
				Update: never;
			};
			check_in_comments: {
				Row: CheckInComment;
				Insert: Omit<CheckInComment, "id" | "created_at"> & {
					id?: string;
					created_at?: string;
				};
				Update: never;
			};
			notifications: {
				Row: Notification;
				Insert: Omit<Notification, "id" | "created_at" | "read"> & {
					id?: string;
					read?: boolean;
					created_at?: string;
				};
				Update: Partial<Pick<Notification, "read">>;
			};
			user_events: {
				Row: {
					id: string;
					user_id: string | null;
					event_name: string;
					properties: Record<string, unknown>;
					page_path: string | null;
					created_at: string;
				};
				Insert: {
					user_id?: string | null;
					event_name: string;
					properties?: Record<string, unknown>;
					page_path?: string | null;
				};
				Update: never;
			};
		};
		Views: {
			feed_view: {
				Row: CheckIn & {
					user_username: string;
					user_display_name: string | null;
					user_avatar_url: string | null;
					user_level: number;
					pastry_name: string;
					pastry_slug: string;
					pastry_category: string;
					pastry_photo_url: string | null;
					pastry_avg_rating: number | null;
					place_name: string;
					place_slug: string;
					place_city: string | null;
				};
			};
		};
	};
};
