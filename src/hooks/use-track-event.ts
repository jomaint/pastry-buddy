"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback } from "react";

const supabase = createClient();

type EventName =
	| "page_view"
	| "check_in_created"
	| "search_performed"
	| "list_created"
	| "list_item_added"
	| "sign_up"
	| "sign_in"
	| "follow"
	| "unfollow"
	| "pastry_viewed"
	| "bakery_viewed"
	| "profile_viewed"
	| "recommendation_clicked";

type TrackEventOptions = {
	properties?: Record<string, unknown>;
	pagePath?: string;
};

/**
 * Hook that returns a fire-and-forget event tracking function.
 * Events are stored in the user_events table for analytics.
 */
export function useTrackEvent() {
	return useCallback(async (eventName: EventName, options?: TrackEventOptions) => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			await supabase.from("user_events").insert({
				user_id: user?.id ?? null,
				event_name: eventName,
				properties: options?.properties ?? {},
				page_path:
					options?.pagePath ?? (typeof window !== "undefined" ? window.location.pathname : null),
			});
		} catch {
			// Analytics should never break the app — silently ignore errors
		}
	}, []);
}
