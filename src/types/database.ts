export interface Profile {
	id: string;
	username: string;
	display_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	favorite_categories: string[];
	level: number;
	xp: number;
	total_checkins: number;
	role: "user" | "staff" | "admin";
	onboarding_completed: boolean;
	onboarding_step: string;
	created_at: string;
	updated_at: string;
}

export interface Place {
	id: string;
	name: string;
	slug: string;
	address: string | null;
	city: string | null;
	country: string | null;
	latitude: number | null;
	longitude: number | null;
	google_place_id: string | null;
	photo_url: string | null;
	created_by: string;
	created_at: string;
}

export interface Pastry {
	id: string;
	name: string;
	slug: string;
	category: string;
	place_id: string;
	description: string | null;
	photo_url: string | null;
	/** @deprecated Pastries are neutral catalog items. Ratings live on check-ins. */
	avg_rating?: number | null;
	/** @deprecated Kept for DB compat. */
	total_checkins?: number;
	featured: boolean;
	created_by: string;
	created_at: string;
}

export interface CheckIn {
	id: string;
	user_id: string;
	pastry_id: string;
	place_id: string;
	rating: number;
	notes: string | null;
	photo_url: string | null;
	flavor_tags: string[];
	taste_ratings: Record<string, number> | null;
	created_at: string;
}

export interface List {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	is_public: boolean;
	created_at: string;
	updated_at: string;
}

export interface ListItem {
	id: string;
	list_id: string;
	pastry_id: string;
	rank: number | null;
	notes: string | null;
	added_at: string;
}

export interface Badge {
	id: string;
	name: string;
	description: string;
	category: string;
	icon: string;
	criteria: Record<string, unknown>;
	created_at: string;
}

export interface UserBadge {
	id: string;
	user_id: string;
	badge_id: string;
	unlocked_at: string;
}

export interface Follow {
	id: string;
	follower_id: string;
	following_id: string;
	created_at: string;
}

export interface Bookmark {
	id: string;
	user_id: string;
	pastry_id: string;
	place_id: string;
	created_at: string;
}

export type VerdictLabel =
	| "go_to"
	| "overrated"
	| "worth_the_detour"
	| "one_and_done"
	| "hidden_gem";

export interface UserItemVerdict {
	id: string;
	user_id: string;
	pastry_id: string;
	place_id: string;
	verdict: VerdictLabel;
	created_at: string;
	updated_at: string;
}

export interface CheckInLike {
	id: string;
	check_in_id: string;
	user_id: string;
	created_at: string;
}

export interface CheckInComment {
	id: string;
	check_in_id: string;
	user_id: string;
	body: string;
	created_at: string;
}

export interface Notification {
	id: string;
	user_id: string;
	actor_id: string | null;
	type: "like" | "comment" | "follow" | "badge";
	reference_id: string | null;
	body: string | null;
	read: boolean;
	created_at: string;
}
