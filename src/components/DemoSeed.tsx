"use client";

import type { FeedItem } from "@/api/check-ins";
import { MOCK_CHECKINS, MOCK_USERS, PASTRIES, PLACES, getTrendingPastries } from "@/lib/mock-data";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/**
 * Seeds React Query cache with mock data so the app looks populated
 * without a Supabase connection. Drop this component into Providers.
 */
export function DemoSeed() {
	const queryClient = useQueryClient();
	const seeded = useRef(false);

	useEffect(() => {
		if (seeded.current) return;
		seeded.current = true;

		const demoUser = MOCK_USERS[0];

		// Auth — fake logged-in user
		queryClient.setQueryData(["auth"], {
			user: demoUser,
			isAuthenticated: true,
		});

		// Places — usePlaces(city?) uses ["places", { city }]
		queryClient.setQueryData(["places", { city: undefined }], PLACES);

		// Trending pastries — useTrendingPastries(6) calls usePastries({sort:"checkins",limit:6})
		const trending = getTrendingPastries(6);
		queryClient.setQueryData(
			["pastries", { category: undefined, placeId: undefined, sort: "checkins", limit: 6 }],
			trending,
		);

		// All pastries
		queryClient.setQueryData(
			["pastries", { category: undefined, placeId: undefined, sort: "checkins", limit: 50 }],
			PASTRIES,
		);

		// Feed — transform MOCK_CHECKINS to FeedItem shape
		const feedItems: FeedItem[] = MOCK_CHECKINS.map((c) => ({
			id: c.id,
			user_id: c.user_id,
			pastry_id: c.pastry_id,
			place_id: c.place_id,
			rating: c.rating,
			notes: c.notes,
			photo_url: c.photo_url,
			flavor_tags: c.flavor_tags,
			taste_ratings: c.taste_ratings,
			created_at: c.created_at,
			user_username: c.user.username,
			user_display_name: c.user.display_name,
			user_avatar_url: c.user.avatar_url,
			user_level: c.user.level,
			pastry_name: c.pastry.name,
			pastry_slug: c.pastry.slug,
			pastry_category: c.pastry.category,
			pastry_photo_url: c.pastry.photo_url,
			pastry_avg_rating: c.pastry.avg_rating,
			place_name: c.place.name,
			place_slug: c.place.slug,
			place_city: c.place.city,
		}));

		queryClient.setQueryData(["feed", { limit: 20, offset: 0 }], feedItems);

		// Leaderboard — useLeaderboard("friends", 3) for MiniLeaderboard
		const leaderboardEntries = MOCK_USERS.map((u, i) => ({
			user_id: u.id,
			username: u.username,
			display_name: u.display_name,
			avatar_url: u.avatar_url,
			checkin_count: u.total_checkins,
			rank: i + 1,
		}));
		queryClient.setQueryData(["leaderboard", "friends", 3], leaderboardEntries.slice(0, 3));
		queryClient.setQueryData(["leaderboard", "friends", 20], leaderboardEntries);
		// useUserRank uses ["leaderboard", "rank", userId]
		queryClient.setQueryData(["leaderboard", "rank", demoUser.id], 1);

		// Notifications — useNotifications(limit=20) uses ["notifications", 20]
		queryClient.setQueryData(["notifications", 20], []);
		// useUnreadNotificationCount uses ["notifications", "unread"]
		queryClient.setQueryData(["notifications", "unread"], 0);
	}, [queryClient]);

	return null;
}
