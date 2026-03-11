"use client";

import { usePlace, usePlaceStats } from "@/api/places";
import { FriendsAtPlace } from "@/components/place/FriendsAtPlace";
import { PlaceCheckIns } from "@/components/place/PlaceCheckIns";
import { PlaceMenuRow } from "@/components/place/PlaceMenuRow";
import { PlaceMap } from "@/components/ui/Map";
import { PageTransition } from "@/components/ui/PageTransition";
import { usePageView } from "@/hooks/use-page-view";
import { ExternalLink, Loader2, MapPin, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";

export default function PlaceDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ pastry?: string }>;
}) {
	const { id } = use(params);
	const { pastry: expandPastryId } = use(searchParams);

	const { data: placeData, isLoading, error } = usePlace(id);
	const { data: stats } = usePlaceStats(placeData?.id ?? id);

	const [sortBy, setSortBy] = useState<"popular" | "rated">("popular");

	usePageView(`/place/${id}`);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 size={24} className="animate-spin text-sesame" />
			</div>
		);
	}

	if (error || !placeData) return notFound();

	const place = placeData;
	const pastries = [...(placeData.pastries ?? [])];

	// Sort pastries
	if (sortBy === "rated") {
		pastries.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
	}

	const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address ?? ""} ${place.city ?? ""}`)}`;

	return (
		<PageTransition className="mx-auto max-w-2xl lg:max-w-5xl">
			<div className="lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-8 lg:p-6">
				{/* --------------------------------------------------------- */}
				{/* Left column (sticky on desktop)                           */}
				{/* --------------------------------------------------------- */}
				<div className="lg:sticky lg:top-24 lg:self-start">
					{/* Hero image placeholder */}
					<div className="relative aspect-[16/9] w-full bg-parchment lg:aspect-[4/3] lg:overflow-hidden lg:rounded-card">
						<div className="absolute inset-0 flex items-center justify-center">
							<Store size={48} className="text-sesame/40" />
						</div>
						<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-espresso/30 to-transparent lg:hidden" />
					</div>

					{/* Map — desktop only, below hero */}
					<div className="hidden lg:block lg:mt-4">
						{place.latitude && place.longitude ? (
							<div className="h-[200px] overflow-hidden rounded-card">
								<PlaceMap lat={place.latitude} lng={place.longitude} name={place.name} />
							</div>
						) : null}
					</div>
				</div>

				{/* --------------------------------------------------------- */}
				{/* Right column (scrollable content)                         */}
				{/* --------------------------------------------------------- */}
				<div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-0 lg:pt-0">
					{/* A. Hero Section */}
					<div>
						<h1 className="font-display text-2xl text-espresso lg:text-3xl">{place.name}</h1>
						{place.address && (
							<div className="mt-1.5 flex items-center gap-1.5 text-sm text-sesame">
								<MapPin size={14} />
								<span>
									{place.address}
									{place.city ? `, ${place.city}` : ""}
								</span>
							</div>
						)}

						{/* Stats row */}
						{stats && (stats.totalCheckIns > 0 || pastries.length > 0) && (
							<div className="mt-3 flex flex-wrap gap-2">
								{stats.totalCheckIns > 0 && (
									<span className="rounded-chip bg-parchment/60 px-2.5 py-1 text-xs font-medium tabular-nums text-sesame">
										{stats.totalCheckIns} check-in{stats.totalCheckIns !== 1 ? "s" : ""}
									</span>
								)}
								{pastries.length > 0 && (
									<span className="rounded-chip bg-parchment/60 px-2.5 py-1 text-xs font-medium tabular-nums text-sesame">
										{pastries.length} item{pastries.length !== 1 ? "s" : ""}
									</span>
								)}
								{stats.uniqueVisitors > 0 && (
									<span className="rounded-chip bg-parchment/60 px-2.5 py-1 text-xs font-medium tabular-nums text-sesame">
										{stats.uniqueVisitors} visitor{stats.uniqueVisitors !== 1 ? "s" : ""}
									</span>
								)}
							</div>
						)}
					</div>

					{/* CTAs */}
					<div className="flex gap-3">
						<Link
							href={`/add?place=${place.id}`}
							className="flex flex-1 items-center justify-center gap-2 rounded-button bg-brioche py-3 text-sm font-medium text-flour transition-colors hover:bg-brioche/90 active:bg-brioche/80"
						>
							I&rsquo;ve been here
						</Link>
						<a
							href={directionsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex flex-1 items-center justify-center gap-2 rounded-button border border-parchment bg-flour py-3 text-sm font-medium text-espresso transition-colors hover:bg-parchment/40"
						>
							<ExternalLink size={14} />
							Get Directions
						</a>
					</div>

					{/* B. Social Proof Banner */}
					<FriendsAtPlace placeId={place.id} />

					{/* C. What People Order */}
					<section className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<h2 className="font-display text-lg text-espresso">What People Order</h2>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() => setSortBy("popular")}
									className={`rounded-chip px-2.5 py-1 text-[11px] font-medium transition-colors ${
										sortBy === "popular"
											? "bg-espresso text-flour"
											: "bg-parchment/60 text-sesame hover:bg-parchment"
									}`}
								>
									Most popular
								</button>
								<button
									type="button"
									onClick={() => setSortBy("rated")}
									className={`rounded-chip px-2.5 py-1 text-[11px] font-medium transition-colors ${
										sortBy === "rated"
											? "bg-espresso text-flour"
											: "bg-parchment/60 text-sesame hover:bg-parchment"
									}`}
								>
									Highest rated
								</button>
							</div>
						</div>

						{pastries.length > 0 ? (
							<div className="flex flex-col gap-2">
								{pastries.map((pastry) => (
									<PlaceMenuRow
										key={pastry.id}
										pastry={pastry}
										placeId={place.id}
										defaultExpanded={pastry.id === expandPastryId}
									/>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 rounded-card bg-parchment/50 py-10">
								<p className="text-sm text-sesame">Know what they serve? Add the first item.</p>
								<Link
									href={`/add?place=${place.id}`}
									className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-button bg-brioche px-3 text-xs font-medium text-flour transition-colors hover:bg-brioche/90"
								>
									Add an item
								</Link>
							</div>
						)}
					</section>

					{/* D. Latest Visits */}
					<PlaceCheckIns placeId={place.id} />

					{/* E. Location — mobile only */}
					<section className="flex flex-col gap-3 lg:hidden">
						<h2 className="font-display text-lg text-espresso">Location</h2>
						{place.latitude && place.longitude ? (
							<PlaceMap lat={place.latitude} lng={place.longitude} name={place.name} />
						) : (
							<div className="flex items-center justify-center rounded-card bg-parchment/50 py-16">
								<div className="flex flex-col items-center gap-2">
									<MapPin size={24} className="text-sesame" />
									<p className="text-sm text-sesame">Location not available</p>
								</div>
							</div>
						)}
					</section>
				</div>
			</div>
		</PageTransition>
	);
}
