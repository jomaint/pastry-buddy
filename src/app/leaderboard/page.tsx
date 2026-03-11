"use client";

import { useAuth } from "@/api/auth";
import {
	type LeaderboardScope,
	type Timeframe,
	useLeaderboard,
	useTopPastries,
	useTopPlaces,
	useUserRank,
} from "@/api/leaderboards";
import { usePastries } from "@/api/pastries";
import { Avatar } from "@/components/ui/Avatar";
import { PageTransition, ScrollReveal } from "@/components/ui/PageTransition";
import { StatsSkeleton } from "@/components/ui/Skeleton";
import { usePageView } from "@/hooks/use-page-view";
import clsx from "clsx";
import { Crown, MapPin, Medal, Star, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Tab = "friends" | "global" | "places" | "pastries";

const TABS: { key: Tab; label: string }[] = [
	{ key: "friends", label: "Friends" },
	{ key: "global", label: "Global" },
	{ key: "places", label: "Places" },
	{ key: "pastries", label: "Pastries" },
];

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
	{ key: "week", label: "This Week" },
	{ key: "month", label: "This Month" },
	{ key: "all", label: "All Time" },
];

function RankBadge({ rank }: { rank: number }) {
	if (rank === 1)
		return (
			<span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD700]/15">
				<Crown size={16} className="text-[#D4A800]" />
			</span>
		);
	if (rank === 2)
		return (
			<span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C0C0C0]/15">
				<Medal size={16} className="text-[#8A8A8A]" />
			</span>
		);
	if (rank === 3)
		return (
			<span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CD7F32]/15">
				<Medal size={16} className="text-[#A0622E]" />
			</span>
		);
	return (
		<span className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment/60 font-display text-sm text-espresso tabular-nums">
			{rank}
		</span>
	);
}

export default function LeaderboardPage() {
	const [tab, setTab] = useState<Tab>("friends");
	const [timeframe, setTimeframe] = useState<Timeframe>("week");
	const { data: auth } = useAuth();

	const scope: LeaderboardScope = tab === "friends" ? "friends" : "global";
	const showUserBoard = tab === "friends" || tab === "global";

	const { data: leaderboard, isLoading: boardLoading } = useLeaderboard(
		scope,
		showUserBoard ? 20 : 0,
	);
	const { data: topPlaces, isLoading: placesLoading } = useTopPlaces(
		tab === "places" ? 10 : 0,
		timeframe,
	);
	const { data: topPastries, isLoading: pastriesLoading } = useTopPastries(
		tab === "pastries" ? 10 : 0,
		timeframe,
	);
	const { data: userRank } = useUserRank(auth?.user?.id);
	const { data: allPastries } = usePastries({ limit: 200 });
	const getPlaceIdForPastry = (pastryId: string) =>
		allPastries?.find((p) => p.id === pastryId)?.place_id ?? "";

	usePageView("/leaderboard");

	const isLoading =
		(showUserBoard && boardLoading) ||
		(tab === "places" && placesLoading) ||
		(tab === "pastries" && pastriesLoading);

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 lg:max-w-3xl lg:gap-8 lg:py-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Trophy size={20} className="text-brioche" />
					<h1 className="font-display text-2xl text-espresso lg:text-3xl">Leaderboard</h1>
				</div>
				{userRank && (
					<div className="flex items-center gap-1.5 rounded-full bg-brioche/10 px-3 py-1.5">
						<span className="text-xs font-medium text-brioche">Top {userRank.percentile}%</span>
					</div>
				)}
			</div>

			{/* User rank summary */}
			{userRank && (
				<div className="flex items-center justify-center gap-6 rounded-[16px] bg-flour p-4 shadow-sm">
					<div className="flex flex-col items-center gap-0.5">
						<span className="font-display text-2xl text-espresso tabular-nums">
							#{userRank.weekly_rank}
						</span>
						<span className="text-xs text-sesame">This Week</span>
					</div>
					<div className="h-8 w-px bg-parchment" />
					<div className="flex flex-col items-center gap-0.5">
						<span className="font-display text-2xl text-espresso tabular-nums">
							{userRank.weekly_checkins}
						</span>
						<span className="text-xs text-sesame">Check-ins</span>
					</div>
					<div className="h-8 w-px bg-parchment" />
					<div className="flex flex-col items-center gap-0.5">
						<span className="font-display text-2xl text-espresso tabular-nums">
							#{userRank.rank}
						</span>
						<span className="text-xs text-sesame">Overall</span>
					</div>
				</div>
			)}

			{/* Tab bar */}
			<div className="flex gap-1 rounded-[14px] bg-parchment/50 p-1">
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className={clsx(
							"flex-1 rounded-[12px] py-2 text-xs font-medium transition-all duration-150",
							tab === t.key ? "bg-flour text-espresso shadow-sm" : "text-sesame hover:text-ganache",
						)}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Timeframe toggle (for places/pastries tabs) */}
			{(tab === "places" || tab === "pastries") && (
				<div className="flex items-center justify-center gap-2">
					{TIMEFRAMES.map((tf) => (
						<button
							key={tf.key}
							type="button"
							onClick={() => setTimeframe(tf.key)}
							className={clsx(
								"rounded-full px-3 py-1.5 text-xs font-medium transition-all",
								timeframe === tf.key
									? "bg-brioche text-flour"
									: "bg-parchment/60 text-sesame hover:text-ganache",
							)}
						>
							{tf.label}
						</button>
					))}
				</div>
			)}

			{/* Loading state */}
			{isLoading && <StatsSkeleton />}

			{/* Friends / Global leaderboard */}
			{showUserBoard && !boardLoading && (
				<div className="flex flex-col gap-1">
					{!leaderboard || leaderboard.length === 0 ? (
						<div className="flex flex-col items-center gap-3 rounded-[16px] bg-parchment/40 py-16 text-center">
							<Users size={24} className="text-sesame" />
							<p className="text-sm font-medium text-espresso">
								{tab === "friends"
									? "Follow friends to see the leaderboard"
									: "No check-ins this week yet"}
							</p>
							{tab === "friends" && (
								<Link
									href="/discover"
									className="mt-1 inline-flex h-8 items-center rounded-[12px] bg-brioche/10 px-4 text-xs font-medium text-brioche transition-colors hover:bg-brioche/20"
								>
									Find friends
								</Link>
							)}
						</div>
					) : (
						leaderboard.map((entry) => (
							<Link
								key={entry.user_id}
								href={`/profile/${entry.username}`}
								className={clsx(
									"flex items-center gap-3 rounded-[14px] px-3 py-3 transition-all duration-150",
									entry.is_self ? "bg-brioche/8 ring-1 ring-brioche/20" : "hover:bg-parchment/40",
								)}
							>
								<RankBadge rank={entry.rank} />
								<Avatar name={entry.display_name || entry.username} size="sm" />
								<div className="flex-1 min-w-0">
									<p
										className={clsx(
											"text-sm truncate",
											entry.is_self ? "font-semibold text-brioche" : "font-medium text-espresso",
										)}
									>
										{entry.display_name || `@${entry.username}`}
										{entry.is_self && (
											<span className="ml-1.5 text-[10px] font-normal text-brioche/70">(you)</span>
										)}
									</p>
									<p className="text-xs text-sesame">@{entry.username}</p>
								</div>
								<div className="flex flex-col items-end gap-0.5">
									<span className="font-display text-lg text-espresso tabular-nums">
										{entry.checkin_count}
									</span>
									<span className="text-[10px] text-sesame">check-ins</span>
								</div>
							</Link>
						))
					)}
				</div>
			)}

			{/* Top Places */}
			{tab === "places" && !placesLoading && (
				<div className="flex flex-col gap-2">
					{!topPlaces || topPlaces.length === 0 ? (
						<div className="flex flex-col items-center gap-3 rounded-[16px] bg-parchment/40 py-16 text-center">
							<MapPin size={24} className="text-sesame" />
							<p className="text-sm text-sesame">No place data yet</p>
						</div>
					) : (
						topPlaces.map((place) => (
							<ScrollReveal key={place.place_id}>
								<Link
									href={`/place/${place.place_id}`}
									className="flex items-center gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
								>
									<RankBadge rank={place.rank} />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-espresso truncate">{place.place_name}</p>
										<p className="text-xs text-sesame truncate">
											{place.place_city} · {place.unique_visitors} visitors
										</p>
									</div>
									<span className="text-xs font-medium text-sesame tabular-nums">
										{place.checkin_count} check-ins
									</span>
								</Link>
							</ScrollReveal>
						))
					)}
				</div>
			)}

			{/* Top Pastries */}
			{tab === "pastries" && !pastriesLoading && (
				<div className="flex flex-col gap-2">
					{!topPastries || topPastries.length === 0 ? (
						<div className="flex flex-col items-center gap-3 rounded-[16px] bg-parchment/40 py-16 text-center">
							<Trophy size={24} className="text-sesame" />
							<p className="text-sm text-sesame">No pastry data yet</p>
						</div>
					) : (
						topPastries.map((pastry) => (
							<ScrollReveal key={pastry.pastry_id}>
								<Link
									href={`/place/${getPlaceIdForPastry(pastry.pastry_id)}?pastry=${pastry.pastry_id}`}
									className="flex items-center gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
								>
									<RankBadge rank={pastry.rank} />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-espresso truncate">
											{pastry.pastry_name}
										</p>
										<p className="text-xs text-sesame truncate">
											{pastry.place_name} · {pastry.pastry_category}
										</p>
									</div>
									<span className="text-xs font-medium text-sesame tabular-nums">
										{pastry.checkin_count} check-ins
									</span>
								</Link>
							</ScrollReveal>
						))
					)}
				</div>
			)}
		</PageTransition>
	);
}
