"use client";

import { useAuth } from "@/api/auth";
import { useBakeries, useSearchBakeries } from "@/api/bakeries";
import { useCreateCheckIn } from "@/api/check-ins";
import { usePastries } from "@/api/pastries";
import { Confetti } from "@/components/ui/Confetti";
import { useToast } from "@/components/ui/Toast";
import { getContextualFlavors } from "@/config/contextual-flavors";
import { FLAVOR_TAGS, TEXTURE_TAGS } from "@/config/pastry-categories";
import { useDebounce } from "@/hooks/use-debounce";
import { useTrackEvent } from "@/hooks/use-track-event";
import type { PlaceResult } from "@/lib/place-search";
import { searchPlaces } from "@/lib/place-search";
import type { Bakery, Pastry } from "@/types/database";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	Check,
	ChevronRight,
	Loader2,
	MapPin,
	Plus,
	Search,
	Sparkles,
	Star,
	Store,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Step = "bakery" | "pastry" | "rate" | "done";

export default function LogPage() {
	const [step, setStep] = useState<Step>("bakery");

	// Bakery selection
	const [bakeryQuery, setBakeryQuery] = useState("");
	const [selectedBakery, setSelectedBakery] = useState<Bakery | null>(null);
	const [nominatimResults, setNominatimResults] = useState<PlaceResult[]>([]);
	const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
	const debouncedBakeryQuery = useDebounce(bakeryQuery, 400);

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

	// Confetti and toast
	const [showConfetti, setShowConfetti] = useState(false);
	const toast = useToast();
	const { data: auth } = useAuth();
	const trackEvent = useTrackEvent();

	useEffect(() => {
		trackEvent("page_view", { pagePath: "/log" });
	}, [trackEvent]);

	// Supabase hooks
	const { data: popularBakeries } = useBakeries();
	const { data: searchedBakeries } = useSearchBakeries(bakeryQuery);
	const { data: bakeryPastries } = usePastries(
		selectedBakery ? { bakeryId: selectedBakery.id, sort: "checkins", limit: 20 } : undefined,
	);
	const { data: allPastriesSearch } = usePastries(
		pastryQuery.length >= 2 ? { sort: "checkins", limit: 50 } : undefined,
	);
	const createCheckIn = useCreateCheckIn();

	// Local bakery search results from Supabase
	const localBakeryResults = useMemo(() => {
		if (bakeryQuery.length < 2) return [];
		return (searchedBakeries ?? []).slice(0, 5);
	}, [bakeryQuery, searchedBakeries]);

	// Nominatim search (debounced, only when local results are sparse)
	useEffect(() => {
		if (debouncedBakeryQuery.length < 3) {
			setNominatimResults([]);
			return;
		}
		if (localBakeryResults.length >= 3) {
			setNominatimResults([]);
			return;
		}

		let cancelled = false;
		setIsSearchingPlaces(true);

		searchPlaces(debouncedBakeryQuery)
			.then((results) => {
				if (!cancelled) {
					const localNames = new Set(localBakeryResults.map((b) => b.name.toLowerCase()));
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
	}, [debouncedBakeryQuery, localBakeryResults]);

	// Pastry search (filtered to selected bakery first, then all)
	const pastryResults = useMemo(() => {
		if (!selectedBakery) return [];
		const bPastries = bakeryPastries ?? [];
		if (pastryQuery.length < 2) return bPastries.slice(0, 8);
		const q = pastryQuery.toLowerCase();
		const fromBakery = bPastries.filter(
			(p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
		);
		const fromAll = (allPastriesSearch ?? [])
			.filter(
				(p) =>
					p.bakery_id !== selectedBakery.id &&
					(p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
			)
			.slice(0, 5);
		return [...fromBakery, ...fromAll];
	}, [selectedBakery, pastryQuery, bakeryPastries, allPastriesSearch]);

	// Get bakery name for pastry results
	const getBakeryName = useCallback(
		(bakeryId: string) => {
			return popularBakeries?.find((b) => b.id === bakeryId)?.name ?? "";
		},
		[popularBakeries],
	);

	const selectBakery = useCallback((bakery: Bakery) => {
		setSelectedBakery(bakery);
		setBakeryQuery("");
		setNominatimResults([]);
		setStep("pastry");
	}, []);

	const selectNominatimPlace = useCallback((place: PlaceResult) => {
		const newBakery: Bakery = {
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
		setSelectedBakery(newBakery);
		setBakeryQuery("");
		setNominatimResults([]);
		setStep("pastry");
	}, []);

	const selectPastry = useCallback((pastry: Pastry) => {
		setSelectedPastry(pastry);
		setPastryQuery("");
		setStep("rate");
	}, []);

	const selectCustomPastry = useCallback(() => {
		if (!customPastryName.trim() || !selectedBakery) return;
		const custom: Pastry = {
			id: `custom-${Date.now()}`,
			name: customPastryName.trim(),
			slug: customPastryName.trim().toLowerCase().replace(/\s+/g, "-"),
			bakery_id: selectedBakery.id,
			category: "Pastries",
			description: null,
			photo_url: null,
			avg_rating: 0,
			total_checkins: 0,
			created_by: "user",
			created_at: new Date().toISOString(),
		};
		setSelectedPastry(custom);
		setCustomPastryName("");
		setPastryQuery("");
		setStep("rate");
	}, [customPastryName, selectedBakery]);

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
		if (!selectedBakery || !selectedPastry || rating === 0) return;

		createCheckIn.mutate(
			{
				pastry_id: selectedPastry.id,
				bakery_id: selectedBakery.id,
				rating,
				notes: notes || undefined,
				flavor_tags: [...selectedFlavors, ...selectedTextures],
			},
			{
				onSuccess: () => {
					trackEvent("check_in_created", {
						properties: {
							pastry_id: selectedPastry?.id,
							bakery_id: selectedBakery?.id,
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
							title: "First Bite! 🧁",
							description: "You earned your first badge",
							icon: "🏆",
						});
					} else if (totalCheckins === 10) {
						toast.show({
							type: "badge",
							title: "Regular! 🍰",
							description: "10 pastries logged — you're a regular now",
							icon: "🏅",
						});
					} else if (totalCheckins === 50) {
						toast.show({
							type: "badge",
							title: "Connoisseur! 🎂",
							description: "50 pastries — true connoisseur status",
							icon: "👑",
						});
					}

					if (rating === 5) {
						toast.show({
							type: "success",
							title: "A perfect 5! ⭐",
							description: "This one must be incredible",
						});
					}
				},
			},
		);
	}, [
		selectedBakery,
		selectedPastry,
		rating,
		notes,
		selectedFlavors,
		selectedTextures,
		createCheckIn,
		auth?.user?.total_checkins,
		toast,
		trackEvent,
	]);

	const handleReset = useCallback(() => {
		setStep("bakery");
		setSelectedBakery(null);
		setSelectedPastry(null);
		setBakeryQuery("");
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
			setStep("bakery");
			setSelectedBakery(null);
		} else if (step === "rate") {
			setStep("pastry");
			setSelectedPastry(null);
			setRating(0);
			setSelectedFlavors([]);
			setSelectedTextures([]);
			setNotes("");
		}
	}, [step]);

	const stepIndex = step === "bakery" ? 0 : step === "pastry" ? 1 : step === "rate" ? 2 : 3;

	return (
		<div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
			<Confetti active={showConfetti} />
			{step !== "done" && (
				<>
					{/* Header */}
					<div className="flex items-center gap-3">
						{step !== "bakery" && (
							<button
								type="button"
								onClick={goBack}
								className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment/60 text-sesame transition-colors hover:bg-parchment hover:text-espresso"
							>
								<ArrowLeft size={16} />
							</button>
						)}
						<h1 className="font-display text-2xl text-espresso">Log a Pastry</h1>
					</div>

					{/* Step indicator */}
					<div className="flex items-center gap-2">
						{["Bakery", "Pastry", "Rate"].map((label, i) => (
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
				{step === "bakery" && (
					<motion.div
						key="bakery"
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
								value={bakeryQuery}
								onChange={(e) => setBakeryQuery(e.target.value)}
								placeholder="Search bakeries & cafes..."
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
							{localBakeryResults.length > 0 && (
								<div className="flex flex-col gap-0.5">
									{bakeryQuery.length >= 2 && (
										<p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-sesame">
											In Pastry Buddy
										</p>
									)}
									{localBakeryResults.map((bakery) => (
										<button
											key={bakery.id}
											type="button"
											onClick={() => selectBakery(bakery)}
											className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-parchment/50"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brioche/10">
												<Store size={16} className="text-brioche" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-espresso truncate">{bakery.name}</p>
												<p className="text-xs text-sesame truncate">
													{bakery.address} · {bakery.city}
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
											onClick={() => selectNominatimPlace(place)}
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
							{bakeryQuery.length < 2 && (
								<div className="flex flex-col gap-0.5">
									<p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-sesame">
										Popular bakeries
									</p>
									{(popularBakeries ?? []).slice(0, 5).map((bakery) => (
										<button
											key={bakery.id}
											type="button"
											onClick={() => selectBakery(bakery)}
											className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-parchment/50"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brioche/10">
												<Store size={16} className="text-brioche" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-espresso truncate">{bakery.name}</p>
												<p className="text-xs text-sesame truncate">{bakery.city}</p>
											</div>
											<ChevronRight size={14} className="shrink-0 text-sesame" />
										</button>
									))}
								</div>
							)}

							{/* No results + searching */}
							{bakeryQuery.length >= 2 &&
								localBakeryResults.length === 0 &&
								nominatimResults.length === 0 &&
								!isSearchingPlaces && (
									<div className="flex flex-col items-center gap-2 py-8 text-center">
										<MapPin size={20} className="text-sesame" />
										<p className="text-sm text-sesame">No places found for "{bakeryQuery}"</p>
										<p className="text-xs text-sesame">Try a different search or add it manually</p>
									</div>
								)}
						</div>
					</motion.div>
				)}

				{step === "pastry" && selectedBakery && (
					<motion.div
						key="pastry"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-4"
					>
						{/* Selected bakery chip */}
						<div className="flex items-center gap-2 rounded-[12px] bg-parchment/50 px-3 py-2">
							<Store size={14} className="shrink-0 text-brioche" />
							<span className="text-sm font-medium text-espresso truncate">
								{selectedBakery.name}
							</span>
							<span className="text-xs text-sesame truncate">{selectedBakery.city}</span>
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
								const bakeryName = getBakeryName(pastry.bakery_id);
								const isFromSelected = pastry.bakery_id === selectedBakery.id;
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
												{!isFromSelected && bakeryName ? ` · ${bakeryName}` : ""}
											</p>
										</div>
										{(pastry.avg_rating ?? 0) > 0 && (
											<div className="flex items-center gap-0.5 shrink-0">
												<Star size={11} className="fill-caramel text-caramel" />
												<span className="text-xs font-medium text-caramel tabular-nums">
													{pastry.avg_rating?.toFixed(1)}
												</span>
											</div>
										)}
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

				{step === "rate" && selectedBakery && selectedPastry && (
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
								{selectedBakery.name} · {selectedBakery.city}
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
							{rating > 0 && (
								<p className="text-xs text-sesame">
									{rating === 1 && "Not for me"}
									{rating === 2 && "It was okay"}
									{rating === 3 && "Pretty good"}
									{rating === 4 && "Really good"}
									{rating === 5 && "Incredible"}
								</p>
							)}
						</div>

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

				{step === "done" && selectedBakery && selectedPastry && (
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
							<h2 className="font-display text-2xl text-espresso">Logged!</h2>
							<p className="text-sm text-ganache">
								<span className="font-medium">{selectedPastry.name}</span> at{" "}
								<span className="font-medium">{selectedBakery.name}</span>
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
						<button
							type="button"
							onClick={handleReset}
							className="flex h-10 items-center gap-1.5 rounded-[14px] bg-parchment/60 px-5 text-sm font-medium text-ganache transition-colors hover:bg-parchment"
						>
							<Plus size={14} />
							Log another
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
