"use client";

import { PASTRY_CATEGORIES } from "@/config/pastry-categories";
import {
	BAKERIES,
	getBakery,
	getPastriesByCategory,
	getTrendingPastries,
	search,
} from "@/lib/mock-data";
import { MapPin, Search, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DiscoverPage() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const trending = getTrendingPastries(6);
	const searchResults = query.length >= 2 ? search(query) : null;
	const categoryResults = activeCategory ? getPastriesByCategory(activeCategory) : null;

	const showingResults = searchResults || categoryResults;

	return (
		<div className="flex flex-col gap-6 px-4 py-6">
			<h1 className="font-display text-3xl text-espresso">Discover</h1>

			{/* Search bar */}
			<div className="relative">
				<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sesame" />
				<input
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setActiveCategory(null);
					}}
					placeholder="Search pastries, bakeries, or flavors..."
					className="h-11 w-full rounded-[12px] border border-parchment bg-flour pl-10 pr-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/30"
				/>
			</div>

			{/* Category pills */}
			<div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
				{PASTRY_CATEGORIES.map((cat) => (
					<button
						key={cat.name}
						type="button"
						onClick={() => {
							setActiveCategory(activeCategory === cat.name ? null : cat.name);
							setQuery("");
						}}
						className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
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
			{searchResults && (
				<section className="flex flex-col gap-4">
					<p className="text-xs font-medium uppercase tracking-wide text-sesame">
						{searchResults.pastries.length + searchResults.bakeries.length} results for &ldquo;
						{query}&rdquo;
					</p>

					{searchResults.bakeries.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-xs font-medium text-sesame">Bakeries</p>
							{searchResults.bakeries.map((bakery) => (
								<Link
									key={bakery.id}
									href={`/bakery/${bakery.id}`}
									className="flex items-center gap-3 rounded-[16px] bg-flour p-3 shadow-sm transition-shadow hover:shadow-md"
								>
									<div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-parchment">
										<MapPin size={18} className="text-sesame" />
									</div>
									<div>
										<p className="text-sm font-medium text-espresso">{bakery.name}</p>
										<p className="text-xs text-sesame">
											{bakery.address}, {bakery.city}
										</p>
									</div>
								</Link>
							))}
						</div>
					)}

					{searchResults.pastries.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-xs font-medium text-sesame">Pastries</p>
							{searchResults.pastries.map((pastry) => {
								const bakery = getBakery(pastry.bakery_id);
								return (
									<Link
										key={pastry.id}
										href={`/pastry/${pastry.id}`}
										className="flex items-center gap-3 rounded-[16px] bg-flour p-3 shadow-sm transition-shadow hover:shadow-md"
									>
										<div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-parchment">
											<Star size={18} className="text-sesame" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium text-espresso">{pastry.name}</p>
											<p className="text-xs text-sesame">
												{bakery?.name} · {pastry.category}
											</p>
										</div>
										{pastry.avg_rating && (
											<div className="flex items-center gap-1">
												<Star size={12} className="fill-caramel text-caramel" />
												<span className="text-xs font-medium text-espresso">
													{pastry.avg_rating}
												</span>
											</div>
										)}
									</Link>
								);
							})}
						</div>
					)}
				</section>
			)}

			{/* Category results */}
			{categoryResults && (
				<section className="flex flex-col gap-3">
					<p className="text-xs font-medium uppercase tracking-wide text-sesame">
						{categoryResults.length} {activeCategory} pastries
					</p>
					<div className="grid grid-cols-2 gap-3">
						{categoryResults.map((pastry) => {
							const bakery = getBakery(pastry.bakery_id);
							return (
								<Link
									key={pastry.id}
									href={`/pastry/${pastry.id}`}
									className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-shadow hover:shadow-md"
								>
									<div className="aspect-square w-full rounded-[12px] bg-parchment" />
									<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
									<p className="truncate text-xs text-sesame">{bakery?.name}</p>
									{pastry.avg_rating && (
										<div className="flex items-center gap-1">
											<Star size={12} className="fill-caramel text-caramel" />
											<span className="text-xs font-medium text-espresso">{pastry.avg_rating}</span>
											<span className="text-xs text-sesame">· {pastry.total_checkins}</span>
										</div>
									)}
								</Link>
							);
						})}
					</div>
				</section>
			)}

			{/* Default sections (no search/filter active) */}
			{!showingResults && (
				<>
					{/* Trending */}
					<section className="flex flex-col gap-3">
						<h2 className="font-display text-xl text-espresso">Trending Near You</h2>
						<div className="grid grid-cols-2 gap-3">
							{trending.map((pastry) => {
								const bakery = getBakery(pastry.bakery_id);
								return (
									<Link
										key={pastry.id}
										href={`/pastry/${pastry.id}`}
										className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-shadow hover:shadow-md"
									>
										<div className="aspect-square w-full rounded-[12px] bg-parchment" />
										<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
										<p className="truncate text-xs text-sesame">{bakery?.name}</p>
										<div className="flex items-center gap-1">
											<Star size={12} className="fill-caramel text-caramel" />
											<span className="text-xs font-medium text-espresso">{pastry.avg_rating}</span>
											<span className="text-xs text-sesame">· {pastry.total_checkins}</span>
										</div>
									</Link>
								);
							})}
						</div>
					</section>

					{/* Popular Bakeries */}
					<section className="flex flex-col gap-3">
						<h2 className="font-display text-xl text-espresso">Popular Bakeries</h2>
						<div className="flex flex-col gap-2">
							{BAKERIES.slice(0, 8).map((bakery) => (
								<Link
									key={bakery.id}
									href={`/bakery/${bakery.id}`}
									className="flex items-center gap-3 rounded-[16px] bg-flour p-3 shadow-sm transition-shadow hover:shadow-md"
								>
									<div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-parchment">
										<MapPin size={18} className="text-brioche" />
									</div>
									<div>
										<p className="text-sm font-medium text-espresso">{bakery.name}</p>
										<p className="text-xs text-sesame">{bakery.city}</p>
									</div>
								</Link>
							))}
						</div>
					</section>
				</>
			)}
		</div>
	);
}
