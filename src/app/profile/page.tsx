"use client";

import { useAuth } from "@/api/auth";
import { useBookmarks } from "@/api/bookmarks";
import {
	type ItemCard,
	useAutoRankings,
	useItemCards,
	useTasteProfile,
	useTopRatedPastries,
} from "@/api/check-ins";
import { useFollowCounts, usePlacesVisited, useUpdateProfile } from "@/api/profiles";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { PageTransition } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { ProfileSkeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { CATEGORY_GROUPS } from "@/config/pastry-categories";
import { usePageView } from "@/hooks/use-page-view";
import { useTrackEvent } from "@/hooks/use-track-event";
import { timeAgo } from "@/lib/time-utils";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	Award,
	Bookmark,
	ChevronDown,
	Clock,
	Grid,
	MapPin,
	Star,
	Trophy,
	User,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ViewMode = "collection" | "timeline" | "rankings";

function formatMonthYear(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function formatFullMonth(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});
}

// ---------------------------------------------------------------------------
// Progressive Insights
// ---------------------------------------------------------------------------

function ProgressiveInsights({
	items,
	tasteProfile,
	placesVisited,
}: {
	items: ItemCard[];
	tasteProfile: { tag: string; count: number }[] | undefined;
	placesVisited: number;
}) {
	const count = items.length;

	if (count === 0) return null;

	const categories = [...new Set(items.map((i) => i.pastry_category).filter(Boolean))];

	if (count < 5) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-card bg-parchment/50 p-4"
			>
				<p className="text-sm text-sesame">
					<span className="font-medium text-espresso">
						Log {5 - count} more item{5 - count > 1 ? "s" : ""}
					</span>{" "}
					to see your first ranking
				</p>
				<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-parchment">
					<div
						className="h-full rounded-full golden-gradient transition-all duration-500"
						style={{ width: `${(count / 5) * 100}%` }}
					/>
				</div>
			</motion.div>
		);
	}

	if (count < 15) {
		const topCategory =
			categories.length > 0
				? categories.sort(
						(a, b) =>
							items.filter((i) => i.pastry_category === b).length -
							items.filter((i) => i.pastry_category === a).length,
					)[0]
				: null;

		return (
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-card bg-parchment/50 p-4"
			>
				<p className="text-sm text-espresso">
					{topCategory ? (
						<>
							Your top category is <span className="font-display font-medium">{topCategory}</span>{" "}
							with {items.filter((i) => i.pastry_category === topCategory).length} items
						</>
					) : (
						<>
							You have logged <span className="font-medium">{count} items</span> so far
						</>
					)}
				</p>
				<p className="mt-1 text-xs text-sesame">
					{categories.length} categor{categories.length === 1 ? "y" : "ies"} explored
				</p>
			</motion.div>
		);
	}

	if (count < 30) {
		const topTags = (tasteProfile ?? []).slice(0, 4);

		return (
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-card bg-parchment/50 p-4"
			>
				<p className="text-sm font-medium text-espresso">Your taste profile is taking shape</p>
				{topTags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1.5">
						{topTags.map((t) => (
							<span
								key={t.tag}
								className="inline-flex items-center rounded-chip bg-flour px-2.5 py-1 text-xs text-espresso"
							>
								{t.tag}
								<span className="ml-1 tabular-nums text-sesame">{t.count}</span>
							</span>
						))}
					</div>
				)}
			</motion.div>
		);
	}

	// 30+ items
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-card bg-parchment/50 p-4"
		>
			<p className="text-sm font-medium text-espresso">
				You have tried <span className="font-display text-base tabular-nums">{count}</span> items
				across <span className="font-display text-base tabular-nums">{categories.length}</span>{" "}
				categories
			</p>
			<p className="mt-1 text-xs text-sesame">
				{placesVisited} place{placesVisited !== 1 ? "s" : ""} visited
				{(tasteProfile ?? []).length > 0 && (
					<>
						{" "}
						&middot; Top flavor: <span className="text-espresso">{tasteProfile?.[0].tag}</span>
					</>
				)}
			</p>
		</motion.div>
	);
}

// ---------------------------------------------------------------------------
// Item Card Component
// ---------------------------------------------------------------------------

function ItemCardView({ card }: { card: ItemCard }) {
	const [expanded, setExpanded] = useState(false);
	const hasNotes = card.all_notes.length > 0;

	const dateRange =
		card.visit_count === 1
			? formatMonthYear(card.first_visit)
			: `${formatMonthYear(card.first_visit)} \u2013 ${formatMonthYear(card.last_visit)}`;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-card bg-flour p-4 shadow-sm"
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<Link
						href={`/pastry/${card.pastry_slug}`}
						className="font-display text-base text-espresso hover:text-brioche transition-colors"
					>
						{card.pastry_name}
					</Link>
					<div className="mt-0.5 flex items-center gap-1 text-xs text-sesame">
						<MapPin size={11} className="shrink-0" />
						<span className="truncate">{card.place_name}</span>
					</div>
				</div>
				<Rating value={card.latest_rating} size="sm" readonly />
			</div>

			{/* Visit info */}
			<p className="mt-2 text-xs tabular-nums text-sesame">
				{card.visit_count} visit{card.visit_count > 1 ? "s" : ""} &middot; {dateRange}
			</p>

			{/* Flavor tags */}
			{card.all_flavor_tags.length > 0 && (
				<div className="mt-2.5 flex flex-wrap gap-1.5">
					{card.all_flavor_tags.map((tag) => (
						<span
							key={tag}
							className="rounded-chip bg-parchment/60 px-2.5 py-0.5 text-xs text-espresso"
						>
							{tag}
						</span>
					))}
				</div>
			)}

			{/* Expandable notes timeline */}
			{hasNotes && (
				<>
					<button
						type="button"
						onClick={() => setExpanded(!expanded)}
						className="mt-3 flex items-center gap-1 text-xs font-medium text-brioche transition-colors hover:text-brioche/80"
					>
						<ChevronDown
							size={14}
							className={clsx("transition-transform duration-200", expanded && "rotate-180")}
						/>
						{expanded ? "Hide" : "Show"} notes ({card.all_notes.length})
					</button>
					<AnimatePresence>
						{expanded && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="overflow-hidden"
							>
								<div className="mt-2 flex flex-col gap-2 border-l-2 border-parchment pl-3">
									{card.all_notes.map((note, i) => (
										<p
											key={`note-${card.pastry_id}-${i}`}
											className="text-xs leading-relaxed text-sesame"
										>
											{note}
										</p>
									))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</>
			)}
		</motion.div>
	);
}

// ---------------------------------------------------------------------------
// Timeline View
// ---------------------------------------------------------------------------

function TimelineView({ items }: { items: ItemCard[] }) {
	// Group items by month of last visit
	const grouped = useMemo(() => {
		const groups: Record<string, ItemCard[]> = {};
		for (const item of items) {
			const key = formatFullMonth(item.last_visit);
			if (!groups[key]) groups[key] = [];
			groups[key].push(item);
		}
		return Object.entries(groups);
	}, [items]);

	if (grouped.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-card bg-parchment/50 py-12">
				<Clock size={24} className="text-sesame" />
				<p className="text-sm text-sesame">No check-ins yet</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{grouped.map(([month, monthItems]) => (
				<section key={month}>
					<h3 className="mb-3 font-display text-base text-espresso">{month}</h3>
					<div className="flex flex-col gap-2">
						{monthItems.map((card) => (
							<Link
								key={`${card.pastry_id}-${card.place_id}`}
								href={`/pastry/${card.pastry_slug}`}
								className="flex items-center gap-3 rounded-card bg-flour p-3 shadow-sm transition-colors hover:bg-parchment/30"
							>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-espresso truncate">{card.pastry_name}</p>
									<p className="text-xs text-sesame truncate">{card.place_name}</p>
								</div>
								<Rating value={card.latest_rating} size="sm" readonly />
							</Link>
						))}
					</div>
				</section>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Rankings View
// ---------------------------------------------------------------------------

function RankingsView({ rankings }: { rankings: Record<string, ItemCard[]> | undefined }) {
	if (!rankings || Object.keys(rankings).length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-card bg-parchment/50 py-12">
				<Trophy size={24} className="text-sesame" />
				<p className="text-sm text-sesame">Rate more items to see rankings</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{Object.entries(rankings).map(([category, cards]) => (
				<section key={category}>
					<h3 className="mb-3 font-display text-base text-espresso">Your Top {category}</h3>
					<div className="flex flex-col gap-1.5">
						{cards.map((card, i) => (
							<Link
								key={`${card.pastry_id}-${card.place_id}`}
								href={`/pastry/${card.pastry_slug}`}
								className="flex items-center gap-3 rounded-card bg-flour p-3 shadow-sm transition-colors hover:bg-parchment/30"
							>
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-parchment/60 font-display text-sm text-espresso tabular-nums">
									{i + 1}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-espresso truncate">{card.pastry_name}</p>
									<p className="text-xs text-sesame truncate">{card.place_name}</p>
								</div>
								<Rating value={card.latest_rating} size="sm" readonly />
							</Link>
						))}
					</div>
				</section>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Bookmarks / Want to Try
// ---------------------------------------------------------------------------

function WantToTrySection() {
	const { data: bookmarks } = useBookmarks();

	if (!bookmarks || bookmarks.length === 0) return null;

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<Bookmark size={16} className="text-brioche" />
				<h2 className="font-display text-lg text-espresso">Want to Try</h2>
			</div>
			<div className="flex flex-col gap-1.5">
				{bookmarks.map((bm) => (
					<div key={bm.id} className="flex items-center gap-3 rounded-card bg-flour p-3 shadow-sm">
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-espresso truncate">{bm.pastry_name}</p>
							<p className="text-xs text-sesame truncate">{bm.place_name}</p>
						</div>
						<Link
							href="/log"
							className="shrink-0 rounded-button bg-parchment/60 px-3 py-1.5 text-xs font-medium text-espresso transition-colors hover:bg-parchment"
						>
							Tried it?
						</Link>
					</div>
				))}
			</div>
		</section>
	);
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
	const { data: auth, isLoading } = useAuth();
	const profile = auth?.user;
	const userId = profile?.id ?? "";

	const { data: placesVisited } = usePlacesVisited(userId);
	const { data: followCounts } = useFollowCounts(userId);
	const updateProfile = useUpdateProfile();
	const trackEvent = useTrackEvent();

	const [viewMode, setViewMode] = useState<ViewMode>("collection");
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

	const { data: itemCards, isLoading: itemsLoading } = useItemCards(userId, categoryFilter);
	const { data: rankings } = useAutoRankings(userId);
	const { data: tasteProfile } = useTasteProfile(userId);

	usePageView("/profile");

	// ---------------------------------------------------------------------------
	// Loading
	// ---------------------------------------------------------------------------

	if (isLoading) {
		return (
			<PageTransition className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6">
				<ProfileSkeleton />
				<StatsSkeleton />
			</PageTransition>
		);
	}

	// ---------------------------------------------------------------------------
	// Guest state
	// ---------------------------------------------------------------------------

	if (!profile) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<User size={32} className="text-sesame" />
				<p className="mt-4 font-display text-xl text-espresso">Sign in to see your profile</p>
				<Link
					href="/sign-in"
					className="mt-4 inline-flex h-10 items-center justify-center rounded-button bg-brioche px-5 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
				>
					Sign In
				</Link>
			</div>
		);
	}

	// ---------------------------------------------------------------------------
	// Stats
	// ---------------------------------------------------------------------------

	const stats = [
		{ label: "Logged", value: profile.total_checkins },
		{ label: "Places", value: placesVisited ?? 0 },
		{ label: "Following", value: followCounts?.following ?? 0 },
		{ label: "Followers", value: followCounts?.followers ?? 0 },
	];

	const items = itemCards ?? [];

	// ---------------------------------------------------------------------------
	// View mode tabs config
	// ---------------------------------------------------------------------------

	const viewTabs: { key: ViewMode; label: string; icon: typeof Grid }[] = [
		{ key: "collection", label: "Collection", icon: Grid },
		{ key: "timeline", label: "Timeline", icon: Clock },
		{ key: "rankings", label: "Rankings", icon: Award },
	];

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 lg:max-w-3xl lg:py-8">
			{/* Profile Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-parchment">
					<User size={28} className="text-sesame" />
				</div>
				<div>
					<p className="font-display text-xl text-espresso">@{profile.username}</p>
					<p className="mt-0.5 text-sm text-sesame">{profile.bio || "Curious Nibbler"}</p>
					<p className="mt-1 text-xs text-sesame/70">
						Level {profile.level} &middot; {profile.xp} XP
					</p>
				</div>
			</div>

			{/* Stats */}
			<StatsGrid stats={stats} />

			{/* View Mode Tabs */}
			<div className="flex items-center justify-center gap-1.5">
				{viewTabs.map((tab) => {
					const Icon = tab.icon;
					const active = viewMode === tab.key;
					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => {
								setViewMode(tab.key);
								trackEvent("profile_view_changed", { properties: { view: tab.key } });
							}}
							className={clsx(
								"inline-flex items-center gap-1.5 rounded-chip px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
								active
									? "golden-gradient text-flour shadow-sm"
									: "bg-parchment/60 text-sesame hover:bg-parchment hover:text-espresso",
							)}
						>
							<Icon size={13} />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Category Filter Row (shown for collection & timeline) */}
			{viewMode !== "rankings" && (
				<div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
					<button
						type="button"
						onClick={() => setCategoryFilter(undefined)}
						className={clsx(
							"shrink-0 rounded-chip px-3 py-1.5 text-xs font-medium transition-all duration-150",
							!categoryFilter
								? "golden-gradient text-flour shadow-sm"
								: "bg-parchment/60 text-sesame hover:bg-parchment hover:text-espresso",
						)}
					>
						All
					</button>
					{CATEGORY_GROUPS.map((group) => (
						<button
							key={group.key}
							type="button"
							onClick={() =>
								setCategoryFilter(categoryFilter === group.key ? undefined : group.key)
							}
							className={clsx(
								"shrink-0 rounded-chip px-3 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap",
								categoryFilter === group.key
									? "golden-gradient text-flour shadow-sm"
									: "bg-parchment/60 text-sesame hover:bg-parchment hover:text-espresso",
							)}
						>
							{group.emoji} {group.label}
						</button>
					))}
				</div>
			)}

			{/* Main Content Area */}
			<AnimatePresence mode="wait">
				{viewMode === "collection" && (
					<motion.div
						key="collection"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-4"
					>
						{/* Progressive Insights */}
						<ProgressiveInsights
							items={items}
							tasteProfile={tasteProfile}
							placesVisited={placesVisited ?? 0}
						/>

						{/* Item Cards Grid */}
						{itemsLoading ? (
							<div className="flex flex-col gap-3">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-28 animate-pulse rounded-card bg-parchment/40" />
								))}
							</div>
						) : items.length > 0 ? (
							<div className="flex flex-col gap-3">
								{items.map((card) => (
									<ItemCardView key={`${card.pastry_id}-${card.place_id}`} card={card} />
								))}
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 rounded-card bg-parchment/50 py-12">
								<Star size={24} className="text-sesame" />
								<p className="text-sm text-sesame">
									{categoryFilter
										? "No items in this category yet"
										: "Start logging pastries to build your collection"}
								</p>
								<Link
									href="/log"
									className="mt-2 inline-flex h-9 items-center justify-center rounded-button bg-brioche px-4 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
								>
									Log your first
								</Link>
							</div>
						)}
					</motion.div>
				)}

				{viewMode === "timeline" && (
					<motion.div
						key="timeline"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
					>
						<TimelineView items={items} />
					</motion.div>
				)}

				{viewMode === "rankings" && (
					<motion.div
						key="rankings"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
					>
						<RankingsView rankings={rankings} />
					</motion.div>
				)}
			</AnimatePresence>

			{/* Want to Try Section */}
			<WantToTrySection />
		</PageTransition>
	);
}
