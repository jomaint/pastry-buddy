"use client";

import { useBakeries, useSearchBakeries } from "@/api/bakeries";
import { usePastries, useSearchPastries, useTrendingPastries } from "@/api/pastries";
import { useRecommendedBakeries } from "@/api/recommendations";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { PastryCardSkeleton } from "@/components/ui/Skeleton";
import { TasteMatchPill } from "@/components/ui/TasteMatchPill";
import { PASTRY_CATEGORIES } from "@/config/pastry-categories";
import { useTrackEvent } from "@/hooks/use-track-event";
import { Croissant, MapPin, Search, Sparkles, Star, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function DiscoverPage() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const { data: trending, isLoading: trendingLoading } = useTrendingPastries(6);
	const { data: allBakeries } = useBakeries();
	const { data: searchedPastries } = useSearchPastries(query);
	const { data: searchedBakeries } = useSearchBakeries(query);
	const { data: recommendedBakeries } = useRecommendedBakeries(4);
	const { data: categoryPastries } = usePastries(
		activeCategory ? { category: activeCategory, sort: "checkins", limit: 50 } : undefined,
	);

	const trackEvent = useTrackEvent();
	const searchTracked = useRef("");

	useEffect(() => {
		trackEvent("page_view", { pagePath: "/discover" });
	}, [trackEvent]);

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
			<h1 className="font-display text-3xl text-espresso">Discover</h1>

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
					className="h-11 w-full rounded-[12px] border border-parchment bg-flour pl-10 pr-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
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
						className={`shrink-0 rounded-full px-4 min-h-9 text-sm font-medium transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche ${
							activeCategory === cat.name
								? "bg-brioche text-flour"
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
									{pastry.avg_rating && (
										<div className="flex shrink-0 items-center gap-1">
											<Star size={12} className="fill-caramel text-caramel" />
											<span className="text-xs font-medium text-espresso tabular-nums">
												{pastry.avg_rating}
											</span>
										</div>
									)}
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
								<Link
									href={`/pastry/${pastry.id}`}
									className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
								>
									<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
										<Croissant size={28} className="text-brioche/30" />
									</div>
									<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
									<p className="truncate text-xs text-sesame">{getBakeryName(pastry.bakery_id)}</p>
									{pastry.avg_rating && (
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-1">
												<Star size={12} className="fill-caramel text-caramel" />
												<span className="text-xs font-medium text-espresso tabular-nums">
													{pastry.avg_rating}
												</span>
												<span className="text-xs text-sesame tabular-nums">
													· {pastry.total_checkins}
												</span>
											</div>
											<TasteMatchPill category={pastry.category} />
										</div>
									)}
								</Link>
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
						<h2 className="font-display text-xl text-espresso">Trending Near You</h2>
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
										<Link
											href={`/pastry/${pastry.id}`}
											className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
										>
											<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
												<Croissant size={28} className="text-brioche/30" />
											</div>
											<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
											<p className="truncate text-xs text-sesame">
												{getBakeryName(pastry.bakery_id)}
											</p>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1">
													<Star size={12} className="fill-caramel text-caramel" />
													<span className="text-xs font-medium text-espresso tabular-nums">
														{pastry.avg_rating}
													</span>
													<span className="text-xs text-sesame tabular-nums">
														· {pastry.total_checkins}
													</span>
												</div>
												<TasteMatchPill category={pastry.category} />
											</div>
										</Link>
									</StaggerItem>
								))}
							</StaggerContainer>
						)}
					</section>

					{/* Recommended bakeries */}
					{recommendedBakeries && recommendedBakeries.length > 0 && (
						<section className="flex flex-col gap-3">
							<div className="flex items-center gap-1.5">
								<Sparkles size={14} className="text-brioche" />
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

					{/* Popular Bakeries */}
					<section className="flex flex-col gap-3">
						<h2 className="font-display text-xl text-espresso">Popular Bakeries</h2>
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
		</PageTransition>
	);
}
