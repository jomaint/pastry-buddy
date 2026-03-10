"use client";

import { useBakeries, useSearchBakeries } from "@/api/bakeries";
import { usePastries, useSearchPastries, useTrendingPastries } from "@/api/pastries";
import { useFollow } from "@/api/profiles";
import { useRecommendedBakeries } from "@/api/recommendations";
import { useFriendSuggestions } from "@/api/social";
import { FloatingAddButton } from "@/components/check-in/FloatingAddButton";
import { PastryCard } from "@/components/pastry/PastryCard";
import { Avatar } from "@/components/ui/Avatar";
import { InlineRating } from "@/components/ui/InlineRating";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { PastryCardSkeleton } from "@/components/ui/Skeleton";
import { PASTRY_CATEGORIES } from "@/config/pastry-categories";
import { usePageView } from "@/hooks/use-page-view";
import { useTrackEvent } from "@/hooks/use-track-event";
import { Croissant, MapPin, Search, Sparkles, Star, Store, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function DiscoverPage() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const { data: trending, isLoading: trendingLoading } = useTrendingPastries(6);
	const { data: allBakeries } = useBakeries();
	const { data: friendSuggestions } = useFriendSuggestions();
	const follow = useFollow();
	const { data: searchedPastries } = useSearchPastries(query);
	const { data: searchedBakeries } = useSearchBakeries(query);
	const { data: recommendedBakeries } = useRecommendedBakeries(4);
	const { data: categoryPastries } = usePastries(
		activeCategory ? { category: activeCategory, sort: "checkins", limit: 50 } : undefined,
	);

	const trackEvent = useTrackEvent();
	const searchTracked = useRef("");
	usePageView("/discover");

	// Track search when results appear
	useEffect(() => {
		if (query.length >= 2 && query !== searchTracked.current) {
			searchTracked.current = query;
			trackEvent("search_performed", { properties: { query, page: "discover" } });
		}
	}, [query, trackEvent]);

	const getBakeryName = (bakeryId: string) => {
		return allBakeries?.find((b) => b.id === bakeryId)?.name ?? "";
	};

	const hasSearchResults = query.length >= 2 && (searchedPastries || searchedBakeries);
	const hasCategoryResults = activeCategory && categoryPastries;
	const showingResults = hasSearchResults || hasCategoryResults;

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 lg:max-w-4xl lg:gap-8 lg:py-8">
			{/* Header */}
			<div>
				<div className="flex items-center gap-2">
					<Sparkles size={18} className="text-brioche" />
					<h1 className="font-display text-3xl text-espresso">Discover</h1>
				</div>
				<p className="mt-1 text-sm text-sesame">Find your next favorite pastry</p>
			</div>

			{/* Search bar */}
			<div className="relative">
				<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sesame" />
				<input
					type="search"
					aria-label="Search pastries, bakeries, or flavors"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setActiveCategory(null);
					}}
					placeholder="Search pastries, bakeries, or flavors..."
					className="h-12 w-full rounded-[14px] border border-parchment bg-flour pl-10 pr-4 text-sm text-espresso placeholder:text-sesame transition-all duration-150 focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20 focus:shadow-[0_0_0_4px_rgba(212,162,78,0.08)]"
				/>
			</div>

			{/* Category pills */}
			<div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
				{PASTRY_CATEGORIES.map((cat) => (
					<button
						key={cat.name}
						type="button"
						onClick={() => {
							setActiveCategory(activeCategory === cat.name ? null : cat.name);
							setQuery("");
						}}
						className={`shrink-0 rounded-full px-4 min-h-9 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche ${
							activeCategory === cat.name
								? "golden-gradient text-flour shadow-[0_2px_8px_rgba(212,162,78,0.25)]"
								: "bg-parchment text-ganache hover:bg-brioche/10 hover:text-brioche"
						}`}
					>
						{cat.name}
					</button>
				))}
			</div>

			{/* Search results */}
			{hasSearchResults && (
				<section className="flex flex-col gap-4">
					<p className="text-xs font-medium uppercase tracking-wide text-sesame">
						{(searchedPastries?.length ?? 0) + (searchedBakeries?.length ?? 0)} results for &ldquo;
						{query}&rdquo;
					</p>

					{searchedBakeries && searchedBakeries.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-xs font-medium uppercase tracking-wide text-sesame">Bakeries</p>
							{searchedBakeries.map((bakery) => (
								<Link
									key={bakery.id}
									href={`/bakery/${bakery.id}`}
									className="flex items-center gap-3 rounded-[16px] bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
								>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment">
										<MapPin size={16} className="text-sesame" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-espresso">{bakery.name}</p>
										<p className="truncate text-xs text-sesame">
											{bakery.address}, {bakery.city}
										</p>
									</div>
								</Link>
							))}
						</div>
					)}

					{searchedPastries && searchedPastries.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-xs font-medium uppercase tracking-wide text-sesame">Pastries</p>
							{searchedPastries.map((pastry) => (
								<Link
									key={pastry.id}
									href={`/pastry/${pastry.id}`}
									className="flex items-center gap-3 rounded-[16px] bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
								>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment">
										<Croissant size={16} className="text-brioche/40" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
										<p className="truncate text-xs text-sesame">
											{pastry.bakery_name} · {pastry.category}
										</p>
									</div>
									<div className="shrink-0">
										<InlineRating value={pastry.avg_rating} />
									</div>
								</Link>
							))}
						</div>
					)}
				</section>
			)}

			{/* Category results */}
			{hasCategoryResults && (
				<section className="flex flex-col gap-3">
					<p className="text-xs font-medium uppercase tracking-wide text-sesame">
						{categoryPastries.length} {activeCategory} pastries
					</p>
					<StaggerContainer className="grid grid-cols-2 gap-3 lg:grid-cols-3">
						{categoryPastries.map((pastry) => (
							<StaggerItem key={pastry.id}>
								<PastryCard
									id={pastry.id}
									name={pastry.name}
									bakeryName={getBakeryName(pastry.bakery_id)}
									category={pastry.category}
									avgRating={pastry.avg_rating}
									totalCheckins={pastry.total_checkins}
								/>
							</StaggerItem>
						))}
					</StaggerContainer>
				</section>
			)}

			{/* Default sections (no search/filter active) */}
			{!showingResults && (
				<>
					{/* Trending */}
					<section className="flex flex-col gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-base">🔥</span>
							<h2 className="font-display text-xl text-espresso">Trending Near You</h2>
						</div>
						{trendingLoading ? (
							<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
								{[1, 2, 3, 4].map((i) => (
									<PastryCardSkeleton key={i} />
								))}
							</div>
						) : (
							<StaggerContainer className="grid grid-cols-2 gap-3 lg:grid-cols-3">
								{trending?.map((pastry) => (
									<StaggerItem key={pastry.id}>
										<PastryCard
											id={pastry.id}
											name={pastry.name}
											bakeryName={getBakeryName(pastry.bakery_id)}
											category={pastry.category}
											avgRating={pastry.avg_rating}
											totalCheckins={pastry.total_checkins}
										/>
									</StaggerItem>
								))}
							</StaggerContainer>
						)}
					</section>

					{/* Recommended bakeries */}
					{recommendedBakeries && recommendedBakeries.length > 0 && (
						<section className="flex flex-col gap-3">
							<div className="flex items-center gap-1.5">
								<span className="text-base">✨</span>
								<h2 className="font-display text-xl text-espresso">Recommended for You</h2>
							</div>
							<StaggerContainer className="flex flex-col gap-2">
								{recommendedBakeries.map((bakery) => (
									<StaggerItem key={bakery.bakery_id}>
										<Link
											href={`/bakery/${bakery.bakery_id}`}
											className="flex items-center gap-3 rounded-[16px] bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
										>
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brioche/10">
												<Store size={16} className="text-brioche" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-espresso">
													{bakery.bakery_name}
												</p>
												<p className="truncate text-xs text-sesame">
													{bakery.bakery_city} · {bakery.pastry_count} pastries
												</p>
												<p className="truncate text-[11px] text-brioche/70 mt-0.5">
													{bakery.reason}
												</p>
											</div>
											{bakery.avg_bakery_rating && (
												<div className="flex shrink-0 items-center gap-1">
													<Star size={12} className="fill-caramel text-caramel" />
													<span className="text-xs font-medium text-espresso tabular-nums">
														{bakery.avg_bakery_rating.toFixed(1)}
													</span>
												</div>
											)}
										</Link>
									</StaggerItem>
								))}
							</StaggerContainer>
						</section>
					)}

					{/* People You Might Know */}
					{friendSuggestions && friendSuggestions.length > 0 && (
						<section className="flex flex-col gap-3">
							<div className="flex items-center gap-1.5">
								<span className="text-base">👋</span>
								<h2 className="font-display text-xl text-espresso">People You Might Know</h2>
							</div>
							<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
								{friendSuggestions.map((person) => (
									<div
										key={person.user_id}
										className="flex w-36 shrink-0 flex-col items-center gap-2 rounded-[16px] bg-flour p-4 shadow-sm"
									>
										<Avatar name={person.display_name || person.username} size="md" />
										<div className="w-full text-center">
											<p className="truncate text-sm font-medium text-espresso">
												{person.display_name || `@${person.username}`}
											</p>
											<p className="truncate text-[11px] text-sesame">{person.reason}</p>
										</div>
										<button
											type="button"
											onClick={() => {
												follow.mutate(person.user_id);
												trackEvent("follow", {
													properties: {
														source: "discover_suggestions",
														target_user_id: person.user_id,
													},
												});
											}}
											disabled={follow.isPending}
											className="inline-flex min-h-[36px] w-full items-center justify-center gap-1 rounded-[14px] golden-gradient px-3 text-xs font-medium text-flour transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
										>
											<UserPlus size={12} />
											Follow
										</button>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Popular Bakeries */}
					<section className="flex flex-col gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-base">🏪</span>
							<h2 className="font-display text-xl text-espresso">Popular Bakeries</h2>
						</div>
						<StaggerContainer className="flex flex-col gap-2">
							{allBakeries?.slice(0, 8).map((bakery) => (
								<StaggerItem key={bakery.id}>
									<Link
										href={`/bakery/${bakery.id}`}
										className="flex items-center gap-3 rounded-[16px] bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
									>
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment">
											<MapPin size={16} className="text-brioche" />
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-espresso">{bakery.name}</p>
											<p className="truncate text-xs text-sesame">{bakery.city}</p>
										</div>
									</Link>
								</StaggerItem>
							))}
						</StaggerContainer>
					</section>
				</>
			)}
			<FloatingAddButton />
		</PageTransition>
	);
}
