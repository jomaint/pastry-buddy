"use client";

import { useAuth } from "@/api/auth";
import { useBadgeStats, useTasteProfile, useTopRatedPastries } from "@/api/check-ins";
import { useLists } from "@/api/lists";
import { useBakeriesVisited, useFollowCounts, useUpdateProfile } from "@/api/profiles";
import { useStreakRpc, useUnlockedFeatures } from "@/api/social";
import { FavoritePastries } from "@/components/profile";
import { BadgeCard } from "@/components/profile/BadgeCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { ProfileSkeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { BADGES } from "@/config/badges";
import { useTrackEvent } from "@/hooks/use-track-event";
import { evaluateBadges } from "@/lib/badge-utils";
import { Award, BarChart3, Flame, Lock, Trophy, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ProfilePage() {
	const { data: auth, isLoading } = useAuth();
	const profile = auth?.user;
	const { data: bakeriesVisited } = useBakeriesVisited(profile?.id ?? "");
	const { data: followCounts } = useFollowCounts(profile?.id ?? "");
	const { data: tasteProfile } = useTasteProfile(profile?.id);
	const { data: topRated } = useTopRatedPastries(profile?.id);
	const { data: streak } = useStreakRpc(profile?.id);
	const { data: badgeStats } = useBadgeStats(profile?.id);
	const { data: lists } = useLists();
	const { data: features } = useUnlockedFeatures(profile?.id);
	const updateProfile = useUpdateProfile();
	const trackEvent = useTrackEvent();

	useEffect(() => {
		trackEvent("page_view", { pagePath: "/profile" });
	}, [trackEvent]);

	const badgeStatuses = useMemo(() => {
		if (!profile) return [];
		return evaluateBadges(BADGES, {
			totalCheckins: profile.total_checkins,
			bakeriesVisited: bakeriesVisited ?? 0,
			followers: followCounts?.followers ?? 0,
			following: followCounts?.following ?? 0,
			listsCount: lists?.length ?? 0,
			streak: streak ?? 0,
			hasPerfectRating: badgeStats?.hasPerfectRating ?? false,
			categoryCheckins: badgeStats?.categoryCheckins ?? {},
		});
	}, [profile, bakeriesVisited, followCounts, lists, streak, badgeStats]);

	const unlockedCount = badgeStatuses.filter((b) => b.unlocked).length;

	if (isLoading) {
		return (
			<PageTransition className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6">
				<ProfileSkeleton />
				<StatsSkeleton />
			</PageTransition>
		);
	}

	if (!profile) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<User size={32} className="text-sesame" />
				<p className="mt-4 font-display text-xl text-espresso">Sign in to see your profile</p>
				<Link
					href="/sign-in"
					className="mt-4 inline-flex h-10 items-center justify-center rounded-[14px] bg-brioche px-5 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
				>
					Sign In
				</Link>
			</div>
		);
	}

	const stats = [
		{ label: "Logged", value: profile.total_checkins },
		{ label: "Bakeries", value: bakeriesVisited ?? 0 },
		{ label: "Following", value: followCounts?.following ?? 0 },
		{ label: "Followers", value: followCounts?.followers ?? 0 },
	];

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6">
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-parchment">
					<User size={28} className="text-sesame" />
				</div>
				<div>
					<p className="font-display text-xl text-espresso">@{profile.username}</p>
					<p className="mt-0.5 text-sm text-sesame">{profile.bio || "Curious Nibbler"}</p>
					<p className="mt-1 text-xs text-sesame/70">
						Level {profile.level} · {profile.xp} XP
					</p>
				</div>
				{/* Streak */}
				{(streak ?? 0) > 0 && (
					<div className="inline-flex items-center gap-1.5 rounded-full bg-raspberry/10 px-3 py-1.5">
						<Flame size={14} className="text-raspberry" />
						<span className="text-sm font-medium text-raspberry tabular-nums">
							{streak}-day streak
						</span>
					</div>
				)}
			</div>

			{/* Stats */}
			<div className="flex items-center justify-center gap-0 rounded-[16px] bg-parchment/60 py-4">
				{stats.map((stat, i) => (
					<div
						key={stat.label}
						className={`flex flex-1 flex-col items-center gap-0.5 ${
							i < stats.length - 1 ? "border-r border-parchment" : ""
						}`}
					>
						<span className="font-display text-2xl text-espresso tabular-nums">{stat.value}</span>
						<span className="text-xs text-sesame">{stat.label}</span>
					</div>
				))}
			</div>

			{/* Favorite Pastries */}
			<FavoritePastries
				favorites={profile.favorite_categories}
				editable
				onSave={(categories) => {
					updateProfile.mutate({ favorite_categories: categories });
				}}
			/>

			{/* Taste Profile */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Taste Profile</h2>
				{features?.taste_profile ? (
					tasteProfile && tasteProfile.length > 0 ? (
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
							<p className="text-sm text-sesame">Log more pastries to build your taste profile</p>
						</div>
					)
				) : (
					<LockedFeature
						icon={<BarChart3 size={20} className="text-sesame" />}
						title="Taste Profile"
						current={features?.total_checkins ?? 0}
						target={5}
						description="Log {remaining} more pastries to unlock your personalized taste profile"
					/>
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
								href={`/pastry/${item.pastry_slug}`}
								className="flex items-center gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-colors hover:bg-parchment/40"
							>
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-parchment/60 font-display text-sm text-espresso">
									{i + 1}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-espresso truncate">{item.pastry_name}</p>
									<p className="text-xs text-sesame truncate">{item.bakery_name}</p>
								</div>
								<Rating value={item.rating} size="sm" readonly />
							</Link>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
						<Trophy size={24} className="text-sesame" />
						<p className="text-sm text-sesame">Rate pastries to build your top 5</p>
					</div>
				)}
			</section>

			{/* Badges */}
			<section className="flex flex-col gap-3">
				{features?.badges ? (
					<>
						<div className="flex items-center justify-between">
							<h2 className="font-display text-xl text-espresso">Badges</h2>
							<span className="text-xs text-sesame tabular-nums">
								{unlockedCount}/{badgeStatuses.length} unlocked
							</span>
						</div>
						<div className="grid grid-cols-3 gap-2">
							{[...badgeStatuses]
								.sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1))
								.map((status) => (
									<BadgeCard
										key={status.badge.name}
										badge={status.badge}
										unlocked={status.unlocked}
										progress={status.progress}
									/>
								))}
						</div>
					</>
				) : (
					<>
						<h2 className="font-display text-xl text-espresso">Badges</h2>
						<LockedFeature
							icon={<Award size={20} className="text-sesame" />}
							title="Badges"
							current={features?.total_checkins ?? 0}
							target={3}
							description="Log {remaining} more pastries to unlock badge collection"
						/>
					</>
				)}
			</section>
		</PageTransition>
	);
}

function LockedFeature({
	icon,
	title,
	current,
	target,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	current: number;
	target: number;
	description: string;
}) {
	const remaining = Math.max(0, target - current);
	const progress = Math.min(100, (current / target) * 100);

	return (
		<div className="relative overflow-hidden rounded-[16px] bg-parchment/30 p-6">
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment/60">
					{icon}
				</div>
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-center gap-1.5">
						<Lock size={12} className="text-sesame" />
						<p className="text-sm font-medium text-ganache">{title}</p>
					</div>
					<p className="text-xs text-sesame">
						{description.replace("{remaining}", String(remaining))}
					</p>
				</div>
				<div className="w-full max-w-[200px]">
					<div className="h-1.5 w-full rounded-full bg-parchment">
						<div
							className="h-1.5 rounded-full bg-brioche/50 transition-all duration-500"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<p className="mt-1 text-[11px] text-sesame tabular-nums">
						{current}/{target} check-ins
					</p>
				</div>
			</div>
		</div>
	);
}
