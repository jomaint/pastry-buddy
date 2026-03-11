"use client";

import { useAuth } from "@/api/auth";
import { useToggleBookmark } from "@/api/bookmarks";
import {
	useFeaturedPastries,
	usePastries,
	useSearchPastries,
	useTrendingPastries,
} from "@/api/pastries";
import { useNearbyPlaces, usePlaces, useSearchPlaces } from "@/api/places";
import { usePersonalizedFeed } from "@/api/recommendations";
import type { RecommendedPastry } from "@/api/recommendations";
import { PastryCard } from "@/components/pastry/PastryCard";
import { InlineRating } from "@/components/ui/InlineRating";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { PastryCardSkeleton } from "@/components/ui/Skeleton";
import { TasteMatchPill } from "@/components/ui/TasteMatchPill";
import { PASTRY_CATEGORIES } from "@/config/pastry-categories";
import { useGeolocation } from "@/hooks/use-geolocation";
import { usePageView } from "@/hooks/use-page-view";
import { useTrackEvent } from "@/hooks/use-track-event";
import {
	Bookmark,
	BookmarkCheck,
	Croissant,
	Loader2,
	MapPin,
	MapPinOff,
	Navigation,
	Search,
	Sparkles,
	Star,
	TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Dynamic map (no SSR — Leaflet needs the DOM)
// ---------------------------------------------------------------------------

const NearbyMap = dynamic(
	() =>
		import("react-leaflet").then((mod) => {
			const { MapContainer, TileLayer, Marker, Popup } = mod;

			type NearbyPlace = {
				id: string;
				name: string;
				address: string | null;
				city: string | null;
				latitude: number | null;
				longitude: number | null;
			};

			function NearbyMapInner({
				lat,
				lng,
				places,
				onSelectPlace,
			}: {
				lat: number;
				lng: number;
				places: NearbyPlace[];
				onSelectPlace: (place: NearbyPlace) => void;
			}) {
				return (
					<MapContainer
						center={[lat, lng]}
						zoom={13}
						scrollWheelZoom
						className="h-full w-full rounded-card"
						style={{ height: "100%", width: "100%" }}
					>
						<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						{places
							.filter((p) => p.latitude != null && p.longitude != null)
							.map((place) => (
								<Marker
									key={place.id}
									position={[place.latitude as number, place.longitude as number]}
									eventHandlers={{ click: () => onSelectPlace(place) }}
								>
									<Popup>
										<span className="font-body text-sm font-medium">{place.name}</span>
									</Popup>
								</Marker>
							))}
					</MapContainer>
				);
			}

			return NearbyMapInner;
		}),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full w-full items-center justify-center rounded-card bg-parchment/50">
				<Loader2 size={20} className="animate-spin text-sesame" />
			</div>
		),
	},
);

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type DiscoverTab = "for-you" | "near-me" | "search";

const TABS: { id: DiscoverTab; label: string; icon: typeof Sparkles }[] = [
	{ id: "for-you", label: "For You", icon: Sparkles },
	{ id: "near-me", label: "Near Me", icon: MapPin },
	{ id: "search", label: "Search", icon: Search },
];

// ---------------------------------------------------------------------------
// Recommendation card
// ---------------------------------------------------------------------------

function RecommendationCard({
	rec,
	onToggleBookmark,
	isSaving,
}: {
	rec: RecommendedPastry;
	onToggleBookmark: (pastryId: string) => void;
	isSaving: boolean;
}) {
	const [saved, setSaved] = useState(false);

	const handleSave = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setSaved((s) => !s);
		onToggleBookmark(rec.pastry_id);
	};

	const matchPercent = Math.round(rec.score * 100);

	return (
		<Link
			href={`/pastry/${rec.pastry_id}`}
			className="group flex items-stretch gap-4 rounded-card bg-flour p-4 shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.99]"
		>
			{/* Left: info */}
			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<span className="shrink-0 rounded-chip bg-parchment px-2 py-0.5 text-[11px] font-medium text-sesame">
						{rec.pastry_category}
					</span>
					<TasteMatchPill pastryId={rec.pastry_id} category={rec.pastry_category} />
				</div>

				<h3 className="truncate font-display text-lg text-espresso">{rec.pastry_name}</h3>

				<p className="flex items-center gap-1 truncate text-sm text-sesame">
					<MapPin size={12} className="shrink-0" />
					{rec.place_name}
					{rec.place_city ? ` · ${rec.place_city}` : ""}
				</p>

				{rec.reason && (
					<p className="mt-0.5 line-clamp-2 text-xs italic text-sesame/80">{rec.reason}</p>
				)}
			</div>

			{/* Right: rating + actions */}
			<div className="flex shrink-0 flex-col items-end justify-between">
				<div className="flex flex-col items-end gap-1">
					{rec.avg_rating != null && rec.avg_rating > 0 && (
						<div className="flex items-center gap-1">
							<Star size={12} className="fill-brioche text-brioche" />
							<span className="font-body text-sm font-medium tabular-nums text-espresso">
								{rec.avg_rating.toFixed(1)}
							</span>
						</div>
					)}
					{rec.total_checkins > 0 && (
						<span className="text-[11px] tabular-nums text-sesame">
							{rec.total_checkins} check-in{rec.total_checkins !== 1 ? "s" : ""}
						</span>
					)}
				</div>

				<button
					type="button"
					onClick={handleSave}
					disabled={isSaving}
					className="flex h-8 w-8 items-center justify-center rounded-button text-sesame transition-colors duration-150 hover:bg-parchment hover:text-brioche active:scale-95"
					aria-label={saved ? "Remove bookmark" : "Save to try later"}
				>
					{saved ? <BookmarkCheck size={18} className="text-brioche" /> : <Bookmark size={18} />}
				</button>
			</div>
		</Link>
	);
}

// ---------------------------------------------------------------------------
// For You tab
// ---------------------------------------------------------------------------

function ForYouTab() {
	const { data: auth } = useAuth();
	const isAuthenticated = auth?.isAuthenticated ?? false;

	const { data: feed, isLoading: feedLoading, refetch: refetchFeed } = usePersonalizedFeed(12);

	const {
		data: trending,
		isLoading: trendingLoading,
		refetch: refetchTrending,
	} = useTrendingPastries(8);
	const { data: featured } = useFeaturedPastries(8);
	const { data: allPlaces } = usePlaces();

	const toggleBookmark = useToggleBookmark();

	const getPlaceName = (placeId: string) => allPlaces?.find((p) => p.id === placeId)?.name ?? "";

	// For unauthenticated: fall back to trending/featured
	const trendingDisplay =
		trending && trending.length >= 3 ? trending : (featured ?? trending ?? []);

	const handleBookmarkToggle = (pastryId: string) => {
		// We need placeId — for now we pass empty string; the mutation
		// will look it up if needed
		toggleBookmark.mutate({ pastryId, placeId: "" });
	};

	const handleRefresh = async () => {
		if (isAuthenticated) {
			await refetchFeed();
		} else {
			await refetchTrending();
		}
	};

	// Authenticated: personalized feed
	if (isAuthenticated) {
		return (
			<PullToRefresh onRefresh={handleRefresh}>
				<div className="flex flex-col gap-4">
					{feedLoading ? (
						<div className="flex flex-col gap-3">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-28 animate-pulse rounded-card bg-parchment/60" />
							))}
						</div>
					) : feed && feed.length > 0 ? (
						<StaggerContainer className="flex flex-col gap-3">
							{feed.map((rec) => (
								<StaggerItem key={rec.pastry_id}>
									<RecommendationCard
										rec={rec}
										onToggleBookmark={handleBookmarkToggle}
										isSaving={toggleBookmark.isPending}
									/>
								</StaggerItem>
							))}
						</StaggerContainer>
					) : (
						<div className="flex flex-col items-center gap-3 py-12 text-center">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment">
								<Sparkles size={20} className="text-sesame" />
							</div>
							<p className="text-sm text-sesame">
								Check in to a few pastries and we&apos;ll start building your personalized
								recommendations.
							</p>
							<Link
								href="/log"
								className="golden-gradient mt-1 inline-flex items-center gap-1.5 rounded-button px-4 py-2 text-sm font-medium text-flour transition-opacity hover:opacity-90"
							>
								Log your first pastry
							</Link>
						</div>
					)}
				</div>
			</PullToRefresh>
		);
	}

	// Unauthenticated: trending with CTA
	return (
		<PullToRefresh onRefresh={handleRefresh}>
			<div className="flex flex-col gap-4">
				{/* Sign-up CTA */}
				<div className="flex flex-col gap-2 rounded-card bg-brioche/8 p-4">
					<p className="font-display text-base text-espresso">Get personalized recommendations</p>
					<p className="text-sm text-sesame">Sign up to get pastry picks tailored to your taste.</p>
					<Link
						href="/onboarding"
						className="golden-gradient mt-1 inline-flex w-fit items-center gap-1.5 rounded-button px-4 py-2 text-sm font-medium text-flour transition-opacity hover:opacity-90"
					>
						Get started
					</Link>
				</div>

				{/* Trending */}
				<div className="flex items-center gap-1.5">
					<TrendingUp size={16} className="text-brioche" />
					<h2 className="font-display text-xl text-espresso">Trending Now</h2>
				</div>

				{trendingLoading ? (
					<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
						{[1, 2, 3, 4].map((i) => (
							<PastryCardSkeleton key={i} />
						))}
					</div>
				) : (
					<StaggerContainer className="grid grid-cols-2 gap-3 lg:grid-cols-3">
						{trendingDisplay?.map((pastry) => (
							<StaggerItem key={pastry.id}>
								<PastryCard
									id={pastry.id}
									name={pastry.name}
									placeName={getPlaceName(pastry.place_id)}
									category={pastry.category}
									avgRating={pastry.avg_rating}
									totalCheckins={pastry.total_checkins}
								/>
							</StaggerItem>
						))}
					</StaggerContainer>
				)}
			</div>
		</PullToRefresh>
	);
}

// ---------------------------------------------------------------------------
// Near Me tab
// ---------------------------------------------------------------------------

function NearMeTab() {
	const geo = useGeolocation({ auto: true });
	const { data: nearbyPlaces, isLoading: placesLoading } = useNearbyPlaces(
		geo.latitude,
		geo.longitude,
	);

	type SelectedPlace = {
		id: string;
		name: string;
		address: string | null;
		city: string | null;
	};
	const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);

	const handleSelectPlace = useCallback(
		(place: { id: string; name: string; address: string | null; city: string | null }) => {
			setSelectedPlace(place);
		},
		[],
	);

	// Geolocation loading
	if (geo.loading) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-center">
				<Loader2 size={24} className="animate-spin text-brioche" />
				<p className="text-sm text-sesame">Finding your location...</p>
			</div>
		);
	}

	// Geolocation denied / error
	if (geo.prompted && geo.error) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment">
					<MapPinOff size={20} className="text-sesame" />
				</div>
				<p className="font-display text-lg text-espresso">Location unavailable</p>
				<p className="max-w-xs text-sm text-sesame">
					Enable location access in your browser settings to discover pastries near you.
				</p>
				<button
					type="button"
					onClick={geo.request}
					className="mt-2 inline-flex items-center gap-1.5 rounded-button border border-parchment px-4 py-2 text-sm font-medium text-espresso transition-colors hover:bg-parchment"
				>
					<Navigation size={14} />
					Try again
				</button>
			</div>
		);
	}

	// Not yet prompted
	if (!geo.hasLocation) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment">
					<MapPin size={20} className="text-sesame" />
				</div>
				<p className="font-display text-lg text-espresso">Discover nearby pastries</p>
				<p className="max-w-xs text-sm text-sesame">
					Share your location to find bakeries and pastry shops near you.
				</p>
				<button
					type="button"
					onClick={geo.request}
					className="golden-gradient mt-2 inline-flex items-center gap-1.5 rounded-button px-4 py-2 text-sm font-medium text-flour transition-opacity hover:opacity-90"
				>
					<Navigation size={14} />
					Share location
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Map */}
			<div className="h-[320px] w-full overflow-hidden rounded-card lg:h-[400px]">
				{placesLoading ? (
					<div className="flex h-full w-full items-center justify-center rounded-card bg-parchment/50">
						<Loader2 size={20} className="animate-spin text-sesame" />
					</div>
				) : (
					<NearbyMap
						lat={geo.latitude}
						lng={geo.longitude}
						places={nearbyPlaces ?? []}
						onSelectPlace={handleSelectPlace}
					/>
				)}
			</div>

			{/* Selected place card */}
			{selectedPlace && (
				<Link
					href={`/place/${selectedPlace.id}`}
					className="flex items-center gap-3 rounded-card bg-flour p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brioche/10">
						<MapPin size={16} className="text-brioche" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-display text-base text-espresso">{selectedPlace.name}</p>
						<p className="truncate text-xs text-sesame">
							{[selectedPlace.address, selectedPlace.city].filter(Boolean).join(", ")}
						</p>
					</div>
					<span className="text-xs font-medium text-brioche">View</span>
				</Link>
			)}

			{/* Nearby places list */}
			{nearbyPlaces && nearbyPlaces.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-medium uppercase tracking-wide text-sesame">
						{nearbyPlaces.length} place{nearbyPlaces.length !== 1 ? "s" : ""} nearby
					</p>
					{nearbyPlaces.map((place) => (
						<Link
							key={place.id}
							href={`/place/${place.id}`}
							className="flex items-center gap-3 rounded-card bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment">
								<MapPin size={16} className="text-sesame" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-espresso">{place.name}</p>
								<p className="truncate text-xs text-sesame">
									{[place.address, place.city].filter(Boolean).join(", ")}
								</p>
							</div>
						</Link>
					))}
				</div>
			)}

			{nearbyPlaces && nearbyPlaces.length === 0 && !placesLoading && (
				<div className="flex flex-col items-center gap-2 py-8 text-center">
					<p className="text-sm text-sesame">
						No places found nearby. Try zooming out or searching instead.
					</p>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Search tab
// ---------------------------------------------------------------------------

function SearchTab() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const { data: allPlaces } = usePlaces();
	const { data: searchedPastries } = useSearchPastries(query);
	const { data: searchedPlaces } = useSearchPlaces(query);
	const { data: categoryPastries } = usePastries(
		activeCategory ? { category: activeCategory, sort: "checkins", limit: 50 } : undefined,
	);

	const trackEvent = useTrackEvent();
	const searchTracked = useRef("");

	useEffect(() => {
		if (query.length >= 2 && query !== searchTracked.current) {
			searchTracked.current = query;
			trackEvent("search_performed", { properties: { query, page: "discover" } });
		}
	}, [query, trackEvent]);

	const getPlaceName = (placeId: string) => allPlaces?.find((b) => b.id === placeId)?.name ?? "";

	const hasSearchResults = query.length >= 2 && (searchedPastries || searchedPlaces);
	const hasCategoryResults = activeCategory && categoryPastries;
	const showingResults = hasSearchResults || hasCategoryResults;

	return (
		<div className="flex flex-col gap-4">
			{/* Search bar */}
			<div className="relative">
				<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sesame" />
				<input
					type="search"
					aria-label="Search pastries, places, or flavors"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setActiveCategory(null);
					}}
					placeholder="Search pastries, places, or flavors..."
					className="h-12 w-full rounded-input border border-parchment bg-flour pl-10 pr-4 text-sm text-espresso placeholder:text-sesame transition-all duration-150 focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20 focus:shadow-[0_0_0_4px_rgba(212,162,78,0.08)]"
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
						className={`shrink-0 rounded-chip px-4 min-h-9 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche ${
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
						{(searchedPastries?.length ?? 0) + (searchedPlaces?.length ?? 0)} results for &ldquo;
						{query}&rdquo;
					</p>

					{searchedPlaces && searchedPlaces.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-xs font-medium uppercase tracking-wide text-sesame">Places</p>
							{searchedPlaces.map((place) => (
								<Link
									key={place.id}
									href={`/place/${place.id}`}
									className="flex items-center gap-3 rounded-card bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
								>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment">
										<MapPin size={16} className="text-sesame" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-espresso">{place.name}</p>
										<p className="truncate text-xs text-sesame">
											{place.address}, {place.city}
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
									className="flex items-center gap-3 rounded-card bg-flour p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
								>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment">
										<Croissant size={16} className="text-brioche/40" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
										<p className="truncate text-xs text-sesame">
											{pastry.place_name} · {pastry.category}
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
									placeName={getPlaceName(pastry.place_id)}
									category={pastry.category}
									avgRating={pastry.avg_rating}
									totalCheckins={pastry.total_checkins}
									photoUrl={pastry.photo_url}
								/>
							</StaggerItem>
						))}
					</StaggerContainer>
				</section>
			)}

			{/* Empty state when no search or category */}
			{!showingResults && (
				<div className="flex flex-col items-center gap-2 py-8 text-center">
					<Search size={20} className="text-sesame/50" />
					<p className="text-sm text-sesame">
						Search for pastries by name, place, or flavor — or pick a category above.
					</p>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DiscoverPage() {
	const { data: auth } = useAuth();
	const isAuthenticated = auth?.isAuthenticated ?? false;
	const [activeTab, setActiveTab] = useState<DiscoverTab>(isAuthenticated ? "for-you" : "for-you");

	const trackEvent = useTrackEvent();
	usePageView("/discover");

	const handleTabChange = (tab: DiscoverTab) => {
		setActiveTab(tab);
		trackEvent("discover_tab_changed", { properties: { tab } });
	};

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

			{/* Tab pills */}
			<div className="flex gap-2">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleTabChange(tab.id)}
							className={`inline-flex items-center gap-1.5 rounded-chip px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche ${
								isActive
									? "golden-gradient text-flour shadow-[0_2px_8px_rgba(212,162,78,0.25)]"
									: "bg-parchment text-ganache hover:bg-brioche/10 hover:text-brioche"
							}`}
						>
							<Icon size={14} />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Tab content */}
			{activeTab === "for-you" && <ForYouTab />}
			{activeTab === "near-me" && <NearMeTab />}
			{activeTab === "search" && <SearchTab />}
		</PageTransition>
	);
}
