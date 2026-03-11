"use client";

import { useAuth } from "@/api/auth";
import { useCreateCheckIn } from "@/api/check-ins";
import { usePastries } from "@/api/pastries";
import { usePlaces, useSearchPlaces } from "@/api/places";
import { Confetti } from "@/components/ui/Confetti";
import { useToast } from "@/components/ui/Toast";
import { getContextualFlavors } from "@/config/contextual-flavors";
import { FLAVOR_TAGS, TEXTURE_TAGS } from "@/config/pastry-categories";
import { useDebounce } from "@/hooks/use-debounce";
import { usePageView } from "@/hooks/use-page-view";
import { useTrackEvent } from "@/hooks/use-track-event";
import { addGuestCheckIn, isGuestAtLimit } from "@/lib/guest-storage";
import type { PlaceResult } from "@/lib/place-search";
import { searchPlaces } from "@/lib/place-search";
import type { Pastry, Place } from "@/types/database";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	Check,
	ChevronDown,
	ChevronRight,
	Loader2,
	MapPin,
	Plus,
	Search,
	Sparkles,
	Star,
	Store,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Step = "place" | "pastry" | "rate" | "done";

export default function AddPage() {
	const [step, setStep] = useState<Step>("place");

	// Place selection
	const [placeQuery, setPlaceQuery] = useState("");
	const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
	const [nominatimResults, setNominatimResults] = useState<PlaceResult[]>([]);
	const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
	const debouncedPlaceQuery = useDebounce(placeQuery, 400);

	// Guest limit state
	const [guestAtLimit, setGuestAtLimit] = useState(false);
	useEffect(() => {
		setGuestAtLimit(isGuestAtLimit());
	}, []);

	// Pastry selection
	const [pastryQuery, setPastryQuery] = useState("");
	const [selectedPastry, setSelectedPastry] = useState<Pastry | null>(null);
	const [customPastryName, setCustomPastryName] = useState("");

	// Rating
	const [rating, setRating] = useState(0);
	const [hoverRating, setHoverRating] = useState(0);
	const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
	const [selectedTextures, setSelectedTextures] = useState<string[]>([]);
	const [notes, setNotes] = useState("");
	const [showTags, setShowTags] = useState(false);

	// Confetti and toast
	const [showConfetti, setShowConfetti] = useState(false);
	const toast = useToast();
	const { data: auth } = useAuth();
	const trackEvent = useTrackEvent();

	usePageView("/add");

	// Supabase hooks
	const { data: popularPlaces } = usePlaces();
	const { data: searchedPlaces } = useSearchPlaces(placeQuery);
	const { data: placePastries } = usePastries(
		selectedPlace ? { placeId: selectedPlace.id, sort: "checkins", limit: 20 } : undefined,
	);
	const { data: allPastriesSearch } = usePastries(
		pastryQuery.length >= 2 ? { sort: "checkins", limit: 50 } : undefined,
	);
	const createCheckIn = useCreateCheckIn();

	// Local place search results from Supabase
	const localPlaceResults = useMemo(() => {
		if (placeQuery.length < 2) return [];
		return (searchedPlaces ?? []).slice(0, 5);
	}, [placeQuery, searchedPlaces]);

	// Nominatim search (debounced, only when local results are sparse)
	useEffect(() => {
		if (debouncedPlaceQuery.length < 3) {
			setNominatimResults([]);
			return;
		}
		if (localPlaceResults.length >= 3) {
			setNominatimResults([]);
			return;
		}

		let cancelled = false;
		setIsSearchingPlaces(true);

		searchPlaces(debouncedPlaceQuery)
			.then((results) => {
				if (!cancelled) {
					const localNames = new Set(localPlaceResults.map((b) => b.name.toLowerCase()));
					setNominatimResults(results.filter((r) => !localNames.has(r.name.toLowerCase())));
					setIsSearchingPlaces(false);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setIsSearchingPlaces(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [debouncedPlaceQuery, localPlaceResults]);

	// Pastry search (filtered to selected place first, then all)
	const pastryResults = useMemo(() => {
		if (!selectedPlace) return [];
		const bPastries = placePastries ?? [];
		if (pastryQuery.length < 2) return bPastries.slice(0, 8);
		const q = pastryQuery.toLowerCase();
		const fromPlace = bPastries.filter(
			(p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
		);
		const fromAll = (allPastriesSearch ?? [])
			.filter(
				(p) =>
					p.place_id !== selectedPlace.id &&
					(p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
			)
			.slice(0, 5);
		return [...fromPlace, ...fromAll];
	}, [selectedPlace, pastryQuery, placePastries, allPastriesSearch]);

	// Get place name for pastry results
	const getPlaceName = useCallback(
		(placeId: string) => {
			return popularPlaces?.find((b) => b.id === placeId)?.name ?? "";
		},
		[popularPlaces],
	);

	const selectPlace = useCallback((place: Place) => {
		setSelectedPlace(place);
		setPlaceQuery("");
		setNominatimResults([]);
		setStep("pastry");
	}, []);

	const selectNominatimResult = useCallback((place: PlaceResult) => {
		const newPlace: Place = {
			id: place.id,
			name: place.name,
			slug: place.id,
			address: place.address,
			city: place.city,
			country: place.country,
			latitude: place.latitude,
			longitude: place.longitude,
			google_place_id: null,
			photo_url: null,
			created_by: "user",
			created_at: new Date().toISOString(),
		};
		setSelectedPlace(newPlace);
		setPlaceQuery("");
		setNominatimResults([]);
		setStep("pastry");
	}, []);

	const selectPastry = useCallback((pastry: Pastry) => {
		setSelectedPastry(pastry);
		setPastryQuery("");
		setStep("rate");
	}, []);

	const selectCustomPastry = useCallback(() => {
		if (!customPastryName.trim() || !selectedPlace) return;
		const custom: Pastry = {
			id: `custom-${Date.now()}`,
			name: customPastryName.trim(),
			slug: customPastryName.trim().toLowerCase().replace(/\s+/g, "-"),
			place_id: selectedPlace.id,
			category: "Pastries",
			description: null,
			photo_url: null,
			featured: false,
			created_by: "user",
			created_at: new Date().toISOString(),
		};
		setSelectedPastry(custom);
		setCustomPastryName("");
		setPastryQuery("");
		setStep("rate");
	}, [customPastryName, selectedPlace]);

	const toggleFlavor = useCallback((tag: string) => {
		setSelectedFlavors((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev,
		);
	}, []);

	const toggleTexture = useCallback((tag: string) => {
		setSelectedTextures((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 3 ? [...prev, tag] : prev,
		);
	}, []);

	const handlePost = useCallback(() => {
		if (!selectedPlace || !selectedPastry || rating === 0) return;

		const isAuthenticated = !!auth?.isAuthenticated;

		if (!isAuthenticated) {
			// Guest logging — store in localStorage
			const result = addGuestCheckIn({
				id: `guest-${Date.now()}`,
				pastry_name: selectedPastry.name,
				pastry_category: selectedPastry.category,
				place_name: selectedPlace.name,
				place_city: selectedPlace.city,
				rating,
				notes: notes || null,
				flavor_tags: [...selectedFlavors, ...selectedTextures],
				created_at: new Date().toISOString(),
				pastry_id: selectedPastry.id,
				place_id: selectedPlace.id,
			});

			if (!result.success) {
				toast.show({
					type: "error",
					title: "Create an account to keep checking in",
					description: "Sign up to save your journal and get personalized recommendations",
				});
				return;
			}

			trackEvent("guest_check_in_created", {
				properties: { rating },
			});

			setStep("done");
			setShowConfetti(true);
			setGuestAtLimit(result.atLimit);
			setTimeout(() => setShowConfetti(false), 3000);
			return;
		}

		createCheckIn.mutate(
			{
				pastry_id: selectedPastry.id,
				place_id: selectedPlace.id,
				rating,
				notes: notes || undefined,
				flavor_tags: [...selectedFlavors, ...selectedTextures],
			},
			{
				onSuccess: () => {
					trackEvent("check_in_created", {
						properties: {
							pastry_id: selectedPastry?.id,
							place_id: selectedPlace?.id,
							rating,
							flavor_tags: [...selectedFlavors, ...selectedTextures],
						},
					});
					setStep("done");
					setShowConfetti(true);
					setTimeout(() => setShowConfetti(false), 3000);

					// Milestone toasts
					const totalCheckins = (auth?.user?.total_checkins ?? 0) + 1;
					if (totalCheckins === 1) {
						toast.show({
							type: "badge",
							title: "First Bite!",
							description: "You earned your first badge",
							icon: "🏆",
						});
					} else if (totalCheckins === 10) {
						toast.show({
							type: "badge",
							title: "Regular!",
							description: "10 pastries — you're a regular now",
							icon: "🏅",
						});
					} else if (totalCheckins === 50) {
						toast.show({
							type: "badge",
							title: "Connoisseur!",
							description: "50 pastries — true connoisseur status",
							icon: "👑",
						});
					}

					if (rating === 5) {
						toast.show({
							type: "success",
							title: "A perfect 5!",
							description: "This one must be incredible",
						});
					}
				},
			},
		);
	}, [
		selectedPlace,
		selectedPastry,
		rating,
		notes,
		selectedFlavors,
		selectedTextures,
		createCheckIn,
		auth,
		toast,
		trackEvent,
	]);

	const handleReset = useCallback(() => {
		setStep("place");
		setSelectedPlace(null);
		setSelectedPastry(null);
		setPlaceQuery("");
		setPastryQuery("");
		setCustomPastryName("");
		setRating(0);
		setHoverRating(0);
		setSelectedFlavors([]);
		setSelectedTextures([]);
		setNotes("");
	}, []);

	const goBack = useCallback(() => {
		if (step === "pastry") {
			setStep("place");
			setSelectedPlace(null);
		} else if (step === "rate") {
			setStep("pastry");
			setSelectedPastry(null);
			setRating(0);
			setSelectedFlavors([]);
			setSelectedTextures([]);
			setNotes("");
		}
	}, [step]);

	const stepIndex = step === "place" ? 0 : step === "pastry" ? 1 : step === "rate" ? 2 : 3;

	return (
		<div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6 lg:py-8">
			<Confetti active={showConfetti} />
			{step !== "done" && (
				<>
					{/* Header */}
					<div className="flex items-center gap-3">
						{step !== "place" && (
							<button
								type="button"
								onClick={goBack}
								className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment/60 text-sesame transition-colors hover:bg-parchment hover:text-espresso"
							>
								<ArrowLeft size={16} />
							</button>
						)}
						<h1 className="font-display text-2xl text-espresso">Check In</h1>
					</div>

					{/* Step indicator */}
					<div className="flex items-center gap-2">
						{["Place", "Pastry", "Rate"].map((label, i) => (
							<div key={label} className="flex items-center gap-2">
								<div className="flex items-center gap-1.5">
									<div
										className={clsx(
											"flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
											i < stepIndex && "bg-pistachio text-flour",
											i === stepIndex && "bg-brioche text-flour",
											i > stepIndex && "bg-parchment text-sesame",
										)}
									>
										{i < stepIndex ? <Check size={12} /> : i + 1}
									</div>
									<span
										className={clsx(
											"text-xs font-medium transition-colors",
											i <= stepIndex ? "text-espresso" : "text-sesame",
										)}
									>
										{label}
									</span>
								</div>
								{i < 2 && (
									<div
										className={clsx(
											"h-px w-6 transition-colors",
											i < stepIndex ? "bg-pistachio" : "bg-parchment",
										)}
									/>
								)}
							</div>
						))}
					</div>
				</>
			)}

			{/* Step content */}
			<AnimatePresence mode="wait">
				{step === "place" && (
					<motion.div
						key="place"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-4"
					>
						<p className="text-sm text-ganache">Where did you go?</p>

						{/* Search input */}
						<div className="relative">
							<Search
								size={16}
								className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sesame"
							/>
							<input
								type="text"
								value={placeQuery}
								onChange={(e) => setPlaceQuery(e.target.value)}
								placeholder="Search places & cafes..."
								// biome-ignore lint/a11y/noAutofocus: intentional UX for step-based flow
								autoFocus
								className="h-11 w-full rounded-[12px] border border-parchment bg-flour pl-10 pr-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
							/>
							{isSearchingPlaces && (
								<Loader2
									size={14}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-sesame"
								/>
							)}
						</div>

						{/* Results */}
						<div className="flex flex-col gap-1">
							{/* Local results */}
							{localPlaceResults.length > 0 && (
								<div className="flex flex-col gap-0.5">
									{placeQuery.length >= 2 && (
										<p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-sesame">
											In Pastry Buddy
										</p>
									)}
									{localPlaceResults.map((place) => (
										<button
											key={place.id}
											type="button"
											onClick={() => selectPlace(place)}
											className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-parchment/50"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brioche/10">
												<Store size={16} className="text-brioche" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-espresso truncate">{place.name}</p>
												<p className="text-xs text-sesame truncate">
													{place.address} · {place.city}
												</p>
											</div>
											<ChevronRight size={14} className="shrink-0 text-sesame" />
										</button>
									))}
								</div>
							)}

							{/* Nominatim results */}
							{nominatimResults.length > 0 && (
								<div className="flex flex-col gap-0.5">
									<p className="px-1 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-sesame">
										Nearby places
									</p>
									{nominatimResults.map((place) => (
										<button
											key={place.id}
											type="button"
											onClick={() => selectNominatimResult(place)}
											className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-parchment/50"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blueberry/10">
												<MapPin size={16} className="text-blueberry" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-espresso truncate">{place.name}</p>
												<p className="text-xs text-sesame truncate">
													{place.address ? `${place.address} · ` : ""}
													{place.city}
												</p>
											</div>
											<ChevronRight size={14} className="shrink-0 text-sesame" />
										</button>
									))}
								</div>
							)}

							{/* Empty state */}
							{placeQuery.length < 2 && (
								<div className="flex flex-col gap-0.5">
									<p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-sesame">
										Popular places
									</p>
									{(popularPlaces ?? []).slice(0, 5).map((place) => (
										<button
											key={place.id}
											type="button"
											onClick={() => selectPlace(place)}
											className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-parchment/50"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brioche/10">
												<Store size={16} className="text-brioche" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-espresso truncate">{place.name}</p>
												<p className="text-xs text-sesame truncate">{place.city}</p>
											</div>
											<ChevronRight size={14} className="shrink-0 text-sesame" />
										</button>
									))}
								</div>
							)}

							{/* No results + searching */}
							{placeQuery.length >= 2 &&
								localPlaceResults.length === 0 &&
								nominatimResults.length === 0 &&
								!isSearchingPlaces && (
									<div className="flex flex-col items-center gap-2 py-8 text-center">
										<MapPin size={20} className="text-sesame" />
										<p className="text-sm text-sesame">No places found for "{placeQuery}"</p>
										<p className="text-xs text-sesame">Try a different search or add it manually</p>
									</div>
								)}
						</div>
					</motion.div>
				)}

				{step === "pastry" && selectedPlace && (
					<motion.div
						key="pastry"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-4"
					>
						{/* Selected place chip */}
						<div className="flex items-center gap-2 rounded-[12px] bg-parchment/50 px-3 py-2">
							<Store size={14} className="shrink-0 text-brioche" />
							<span className="text-sm font-medium text-espresso truncate">
								{selectedPlace.name}
							</span>
							<span className="text-xs text-sesame truncate">{selectedPlace.city}</span>
						</div>

						<p className="text-sm text-ganache">What did you have?</p>

						{/* Pastry search */}
						<div className="relative">
							<Search
								size={16}
								className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sesame"
							/>
							<input
								type="text"
								value={pastryQuery}
								onChange={(e) => setPastryQuery(e.target.value)}
								placeholder="Search pastries..."
								// biome-ignore lint/a11y/noAutofocus: intentional UX for step-based flow
								autoFocus
								className="h-11 w-full rounded-[12px] border border-parchment bg-flour pl-10 pr-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
							/>
						</div>

						{/* Pastry results */}
						<div className="flex flex-col gap-0.5">
							{pastryResults.map((pastry) => {
								const placeName = getPlaceName(pastry.place_id);
								const isFromSelected = pastry.place_id === selectedPlace.id;
								return (
									<button
										key={pastry.id}
										type="button"
										onClick={() => selectPastry(pastry)}
										className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-parchment/50"
									>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium text-espresso truncate">{pastry.name}</p>
											<p className="text-xs text-sesame truncate">
												{pastry.category}
												{!isFromSelected && placeName ? ` · ${placeName}` : ""}
											</p>
										</div>
										<ChevronRight size={14} className="shrink-0 text-sesame" />
									</button>
								);
							})}

							{pastryResults.length === 0 && pastryQuery.length >= 2 && (
								<div className="py-4 text-center text-sm text-sesame">
									No pastries found for "{pastryQuery}"
								</div>
							)}
						</div>

						{/* Add custom pastry */}
						<div className="border-t border-parchment pt-4">
							<p className="pb-2 text-xs font-medium text-sesame">Don't see it? Add it:</p>
							<div className="flex gap-2">
								<input
									type="text"
									value={customPastryName}
									onChange={(e) => setCustomPastryName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && selectCustomPastry()}
									placeholder="e.g. Pistachio Croissant"
									className="h-10 flex-1 rounded-[12px] border border-parchment bg-flour px-3 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
								/>
								<button
									type="button"
									onClick={selectCustomPastry}
									disabled={!customPastryName.trim()}
									className={clsx(
										"flex h-10 items-center gap-1.5 rounded-[14px] px-4 text-sm font-medium transition-all",
										customPastryName.trim()
											? "bg-brioche text-flour hover:bg-brioche/90 active:scale-[0.98]"
											: "bg-parchment text-sesame cursor-not-allowed",
									)}
								>
									<Plus size={14} />
									Add
								</button>
							</div>
						</div>
					</motion.div>
				)}

				{step === "rate" && selectedPlace && selectedPastry && (
					<motion.div
						key="rate"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-5"
					>
						{/* What you're rating */}
						<div className="flex flex-col gap-1 rounded-[12px] bg-parchment/50 px-4 py-3">
							<p className="text-base font-medium text-espresso">{selectedPastry.name}</p>
							<p className="text-xs text-sesame">
								{selectedPlace.name} · {selectedPlace.city}
							</p>
						</div>

						{/* Star rating */}
						<div className="flex flex-col items-center gap-2">
							<p className="text-sm font-medium text-ganache">How was it?</p>
							<div className="flex gap-1">
								{[1, 2, 3, 4, 5].map((star) => {
									const isFilled = star <= (hoverRating || rating);
									const isNewlySelected = star === rating && star > 0;
									return (
										<motion.button
											key={star}
											type="button"
											onClick={() => setRating(star)}
											onMouseEnter={() => setHoverRating(star)}
											onMouseLeave={() => setHoverRating(0)}
											whileTap={{ scale: 0.85 }}
											whileHover={{ scale: 1.15 }}
											className="p-1"
										>
											<motion.div
												animate={
													isNewlySelected
														? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }
														: { scale: 1 }
												}
												transition={{ duration: 0.3 }}
											>
												<Star
													size={28}
													className={clsx(
														"transition-colors duration-150",
														isFilled ? "fill-caramel text-caramel" : "text-parchment",
													)}
												/>
											</motion.div>
										</motion.button>
									);
								})}
							</div>
							{(hoverRating || rating) > 0 && (
								<p className="text-xs text-sesame">
									{(hoverRating || rating) === 1 && "Not for me"}
									{(hoverRating || rating) === 2 && "It was okay"}
									{(hoverRating || rating) === 3 && "Pretty good"}
									{(hoverRating || rating) === 4 && "Loved it"}
									{(hoverRating || rating) === 5 && "Life-changing"}
								</p>
							)}
						</div>

						{/* Flavor & texture tags (collapsible) */}
						<button
							type="button"
							onClick={() => setShowTags(!showTags)}
							className="flex items-center gap-1.5 text-sm text-sesame hover:text-ganache transition-colors"
						>
							<ChevronDown
								size={14}
								className={`transition-transform ${showTags ? "rotate-180" : ""}`}
							/>
							Add flavor & texture tags (optional)
						</button>
						{showTags && (
							<>
								{/* Flavor tags */}
								<div className="flex flex-col gap-2">
									<p className="text-sm font-medium text-ganache">
										Flavors <span className="font-normal text-sesame">(up to 5)</span>
									</p>
									<div className="flex flex-wrap gap-1.5">
										{getContextualFlavors(FLAVOR_TAGS, selectedPastry?.category).map((tag) => (
											<button
												key={tag}
												type="button"
												onClick={() => toggleFlavor(tag)}
												className={clsx(
													"rounded-full px-3 py-1.5 text-xs font-medium transition-all",
													selectedFlavors.includes(tag)
														? "bg-brioche text-flour"
														: "bg-parchment/60 text-ganache hover:bg-parchment",
												)}
											>
												{tag}
											</button>
										))}
									</div>
								</div>

								{/* Texture tags */}
								<div className="flex flex-col gap-2">
									<p className="text-sm font-medium text-ganache">
										Texture <span className="font-normal text-sesame">(up to 3)</span>
									</p>
									<div className="flex flex-wrap gap-1.5">
										{TEXTURE_TAGS.map((tag) => (
											<button
												key={tag}
												type="button"
												onClick={() => toggleTexture(tag)}
												className={clsx(
													"rounded-full px-3 py-1.5 text-xs font-medium transition-all",
													selectedTextures.includes(tag)
														? "bg-brioche text-flour"
														: "bg-parchment/60 text-ganache hover:bg-parchment",
												)}
											>
												{tag}
											</button>
										))}
									</div>
								</div>
							</>
						)}

						{/* Notes */}
						<div className="flex flex-col gap-2">
							<p className="text-sm font-medium text-ganache">
								Notes <span className="font-normal text-sesame">(optional)</span>
							</p>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								maxLength={280}
								rows={3}
								placeholder="One-liner about this pastry..."
								className="w-full resize-none rounded-[12px] border border-parchment bg-flour px-3 py-2.5 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
							/>
							<p className="text-right text-[11px] text-sesame tabular-nums">{notes.length}/280</p>
						</div>

						{/* Post button */}
						<button
							type="button"
							onClick={handlePost}
							disabled={rating === 0 || createCheckIn.isPending}
							className={clsx(
								"flex h-12 items-center justify-center gap-2 rounded-[14px] text-sm font-semibold transition-all",
								rating > 0 && !createCheckIn.isPending
									? "bg-brioche text-flour shadow-[0_2px_8px_rgba(200,135,95,0.3)] hover:bg-brioche/90 active:scale-[0.98]"
									: "bg-parchment text-sesame cursor-not-allowed",
							)}
						>
							{createCheckIn.isPending ? (
								<>
									<Loader2 size={16} className="animate-spin" />
									Posting...
								</>
							) : (
								"Post Check-in"
							)}
						</button>
					</motion.div>
				)}

				{step === "done" && selectedPlace && selectedPastry && (
					<motion.div
						key="done"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
						className="flex flex-col items-center gap-6 py-12 text-center"
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
							className="flex h-16 w-16 items-center justify-center rounded-full bg-pistachio/15"
						>
							<Sparkles size={28} className="text-pistachio" />
						</motion.div>
						<div className="flex flex-col gap-1">
							<h2 className="font-display text-2xl text-espresso">Checked in!</h2>
							<p className="text-sm text-ganache">
								<span className="font-medium">{selectedPastry.name}</span> at{" "}
								<span className="font-medium">{selectedPlace.name}</span>
							</p>
							<div className="flex items-center justify-center gap-0.5 pt-1">
								{Array.from({ length: rating }).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: static star icons
									<Star key={`done-star-${i}`} size={14} className="fill-caramel text-caramel" />
								))}
							</div>
							{(selectedFlavors.length > 0 || selectedTextures.length > 0) && (
								<div className="flex flex-wrap items-center justify-center gap-1 pt-2">
									{[...selectedFlavors, ...selectedTextures].map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-parchment/60 px-2 py-0.5 text-[11px] font-medium text-ganache"
										>
											{tag}
										</span>
									))}
								</div>
							)}
							{notes && <p className="pt-2 text-sm text-sesame italic">"{notes}"</p>}
						</div>
						{/* Guest at limit — nudge to create account */}
						{!auth?.isAuthenticated && guestAtLimit ? (
							<div className="flex flex-col items-center gap-3">
								<p className="text-sm text-ganache">
									Create an account to keep your journal and unlock recommendations.
								</p>
								<Link
									href="/sign-up"
									className="flex h-10 items-center gap-1.5 rounded-[14px] bg-brioche px-5 text-sm font-medium text-flour transition-all hover:bg-brioche/90 active:scale-[0.98]"
								>
									Save my journal
								</Link>
							</div>
						) : (
							<button
								type="button"
								onClick={handleReset}
								className="flex h-10 items-center gap-1.5 rounded-[14px] bg-parchment/60 px-5 text-sm font-medium text-ganache transition-colors hover:bg-parchment"
							>
								<Plus size={14} />
								Check in another
							</button>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
