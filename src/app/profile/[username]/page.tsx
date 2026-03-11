"use client";

import { useAuth } from "@/api/auth";
import { useBadgeStats, useTasteProfile, useTopRatedPastries } from "@/api/check-ins";
import { useLists } from "@/api/lists";
import {
	useFollow,
	useFollowCounts,
	useIsFollowing,
	usePlacesVisited,
	useProfileByUsername,
	useUnfollow,
} from "@/api/profiles";
import { useStreakRpc, useTasteSimilarity } from "@/api/social";
import { FavoritePastries } from "@/components/profile";
import { BadgeCard } from "@/components/profile/BadgeCard";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { PageTransition } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { BADGES } from "@/config/badges";
import { useTrackEvent } from "@/hooks/use-track-event";
import { evaluateBadges } from "@/lib/badge-utils";
import { BarChart3, Flame, Heart, Loader2, Trophy, User } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function PublicProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = use(params);
	const { data: profile, isLoading } = useProfileByUsername(username);
	const { data: auth } = useAuth();
	const { data: placesVisited } = usePlacesVisited(profile?.id ?? "");
	const { data: followCounts } = useFollowCounts(profile?.id ?? "");
	const { data: isFollowing } = useIsFollowing(profile?.id ?? "");
	const { data: tasteProfile } = useTasteProfile(profile?.id);
	const { data: topRated } = useTopRatedPastries(profile?.id);
	const { data: streak } = useStreakRpc(profile?.id);
	const { data: badgeStats } = useBadgeStats(profile?.id);
	const { data: lists } = useLists();
	const { data: tasteSimilarity } = useTasteSimilarity(auth?.user?.id, profile?.id);
	const follow = useFollow();
	const unfollow = useUnfollow();
	const trackEvent = useTrackEvent();

	useEffect(() => {
		if (profile) {
			trackEvent("profile_viewed", { properties: { username, profile_id: profile.id } });
		}
	}, [profile, username, trackEvent]);

	const isOwnProfile = auth?.user?.id === profile?.id;

	const badgeStatuses = useMemo(() => {
		if (!profile) return [];
		return evaluateBadges(BADGES, {
			totalCheckins: profile.total_checkins,
			placesVisited: placesVisited ?? 0,
			followers: followCounts?.followers ?? 0,
			following: followCounts?.following ?? 0,
			listsCount: lists?.length ?? 0,
			streak: streak ?? 0,
			hasPerfectRating: badgeStats?.hasPerfectRating ?? false,
			categoryCheckins: badgeStats?.categoryCheckins ?? {},
		});
	}, [profile, placesVisited, followCounts, lists, streak, badgeStats]);

	const unlockedBadges = badgeStatuses.filter((b) => b.unlocked);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 size={24} className="animate-spin text-sesame" />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<User size={32} className="text-sesame" />
				<p className="mt-4 font-display text-xl text-espresso">User not found</p>
				<p className="mt-1 text-sm text-sesame">@{username} doesn&apos;t exist</p>
			</div>
		);
	}

	const stats = [
		{ label: "Check-ins", value: profile.total_checkins },
		{ label: "Places", value: placesVisited ?? 0 },
		{ label: "Following", value: followCounts?.following ?? 0 },
		{ label: "Followers", value: followCounts?.followers ?? 0 },
	];

	const handleFollowToggle = () => {
		if (isFollowing) {
			unfollow.mutate(profile.id);
			trackEvent("unfollow", { properties: { target_user_id: profile.id } });
		} else {
			follow.mutate(profile.id);
			trackEvent("follow", { properties: { target_user_id: profile.id } });
		}
	};

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6 lg:max-w-3xl lg:py-8">
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-parchment">
					<User size={28} className="text-sesame" />
				</div>
				<div>
					<p className="font-display text-xl text-espresso">@{profile.username}</p>
					<p className="mt-0.5 text-sm text-sesame">{profile.bio || "Curious Nibbler"}</p>
					<p className="mt-1 text-xs text-sesame/70">Level {profile.level}</p>
				</div>
				{/* Taste similarity — Beli-style differentiator */}
				{!isOwnProfile && auth?.isAuthenticated && tasteSimilarity != null && (
					<div className="inline-flex items-center gap-1.5 rounded-full bg-pistachio/10 px-3.5 py-1.5">
						<Heart size={13} className="fill-pistachio text-pistachio" />
						<span className="text-sm font-semibold text-pistachio tabular-nums">
							{tasteSimilarity}% taste match
						</span>
					</div>
				)}
				{!isOwnProfile && auth?.isAuthenticated && tasteSimilarity === null && (
					<p className="text-[11px] text-sesame">Check in more to see your taste match</p>
				)}
				{(streak ?? 0) > 0 && (
					<div className="inline-flex items-center gap-1.5 rounded-full bg-raspberry/10 px-3 py-1.5">
						<Flame size={14} className="text-raspberry" />
						<span className="text-sm font-medium text-raspberry tabular-nums">
							{streak}-day streak
						</span>
					</div>
				)}
				{!isOwnProfile && auth?.isAuthenticated && (
					<button
						type="button"
						onClick={handleFollowToggle}
						disabled={follow.isPending || unfollow.isPending}
						className={`mt-1 inline-flex h-9 items-center justify-center rounded-[14px] px-5 text-sm font-medium transition-colors duration-150 ${
							isFollowing
								? "bg-parchment text-espresso hover:bg-parchment/80"
								: "bg-brioche text-flour hover:bg-brioche/90 active:bg-brioche/80"
						}`}
					>
						{isFollowing ? "Following" : "Follow"}
					</button>
				)}
			</div>

			{/* Stats */}
			<StatsGrid stats={stats} />

			{/* Favorite Pastries (read-only on public profiles) */}
			<FavoritePastries favorites={profile.favorite_categories} />

			{/* Taste Profile */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Taste Profile</h2>
				{tasteProfile && tasteProfile.length > 0 ? (
					<div className="rounded-[16px] bg-flour p-4 shadow-sm">
						<ResponsiveContainer width="100%" height={200}>
							<BarChart data={tasteProfile} layout="vertical" margin={{ left: 0, right: 16 }}>
								<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8e0d4" />
								<XAxis
									type="number"
									allowDecimals={false}
									tick={{ fontSize: 12, fill: "#8a7e72" }}
								/>
								<YAxis
									type="category"
									dataKey="tag"
									width={80}
									tick={{ fontSize: 12, fill: "#3d2e1f" }}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "#faf7f2",
										border: "1px solid #e8e0d4",
										borderRadius: 12,
										fontSize: 13,
									}}
								/>
								<Bar dataKey="count" fill="#c8956c" radius={[0, 6, 6, 0]} name="Check-ins" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
						<BarChart3 size={24} className="text-sesame" />
						<p className="text-sm text-sesame">No taste profile yet</p>
					</div>
				)}
			</section>

			{/* Top 5 */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Top 5</h2>
				{topRated && topRated.length > 0 ? (
					<div className="flex flex-col gap-2">
						{topRated.map((item, i) => (
							<Link
								key={`${item.pastry_slug}-${i}`}
								href={`/place/${item.place_id}?pastry=${item.pastry_id}`}
								className="flex items-center gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-colors hover:bg-parchment/40"
							>
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-parchment/60 font-display text-sm text-espresso">
									{i + 1}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-espresso truncate">{item.pastry_name}</p>
									<p className="text-xs text-sesame truncate">{item.place_name}</p>
								</div>
								<Rating value={item.rating} size="sm" readonly />
							</Link>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
						<Trophy size={24} className="text-sesame" />
						<p className="text-sm text-sesame">No top 5 yet</p>
					</div>
				)}
			</section>

			{/* Badges (show earned only on public profiles) */}
			{unlockedBadges.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-xl text-espresso">Badges</h2>
					<div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
						{unlockedBadges.map((status) => (
							<BadgeCard key={status.badge.name} badge={status.badge} unlocked />
						))}
					</div>
				</section>
			)}
		</PageTransition>
	);
}
