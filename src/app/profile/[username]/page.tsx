"use client";

import { useAuth } from "@/api/auth";
import { useTasteProfile, useTopRatedPastries } from "@/api/check-ins";
import {
	useBakeriesVisited,
	useFollow,
	useFollowCounts,
	useIsFollowing,
	useProfileByUsername,
	useUnfollow,
} from "@/api/profiles";
import { FavoritePastries } from "@/components/profile";
import { PageTransition } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { BarChart3, Loader2, Trophy, User } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function PublicProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = use(params);
	const { data: profile, isLoading } = useProfileByUsername(username);
	const { data: auth } = useAuth();
	const { data: bakeriesVisited } = useBakeriesVisited(profile?.id ?? "");
	const { data: followCounts } = useFollowCounts(profile?.id ?? "");
	const { data: isFollowing } = useIsFollowing(profile?.id ?? "");
	const { data: tasteProfile } = useTasteProfile(profile?.id);
	const { data: topRated } = useTopRatedPastries(profile?.id);
	const follow = useFollow();
	const unfollow = useUnfollow();

	const isOwnProfile = auth?.user?.id === profile?.id;

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
		{ label: "Logged", value: profile.total_checkins },
		{ label: "Bakeries", value: bakeriesVisited ?? 0 },
		{ label: "Following", value: followCounts?.following ?? 0 },
		{ label: "Followers", value: followCounts?.followers ?? 0 },
	];

	const handleFollowToggle = () => {
		if (isFollowing) {
			unfollow.mutate(profile.id);
		} else {
			follow.mutate(profile.id);
		}
	};

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
					<p className="mt-1 text-xs text-sesame/70">Level {profile.level}</p>
				</div>
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
						<p className="text-sm text-sesame">No top 5 yet</p>
					</div>
				)}
			</section>
		</PageTransition>
	);
}
