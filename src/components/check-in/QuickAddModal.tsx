"use client";

import { useCreateCheckIn } from "@/api/check-ins";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Confetti } from "@/components/ui/Confetti";
import { Rating } from "@/components/ui/Rating";
import { useToast } from "@/components/ui/Toast";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Loader2, MapPin } from "lucide-react";
import { useCallback, useState } from "react";

const PASTRY_EMOJIS = [
	"\u{1F950}", // croissant
	"\u{1F370}", // cake
	"\u{1F9C1}", // cupcake
	"\u{1F369}", // donut
	"\u{1F36A}", // cookie
	"\u{1FAD7}", // pouring liquid
	"\u{1F382}", // birthday cake
	"\u2615", // coffee
	"\u{1F35E}", // bread
	"\u{1F9C7}", // waffle
] as const;

interface QuickAddModalProps {
	open: boolean;
	onClose: () => void;
}

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
	const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
	const [pastryName, setPastryName] = useState("");
	const [bakeryName, setBakeryName] = useState("");
	const [rating, setRating] = useState(0);
	const [notes, setNotes] = useState("");
	const [showConfetti, setShowConfetti] = useState(false);

	const createCheckIn = useCreateCheckIn();
	const toast = useToast();

	const canSubmit = selectedEmoji && pastryName.trim() && bakeryName.trim() && rating > 0;

	const resetForm = useCallback(() => {
		setSelectedEmoji(null);
		setPastryName("");
		setBakeryName("");
		setRating(0);
		setNotes("");
	}, []);

	const handleClose = useCallback(() => {
		onClose();
		// Delay reset so the closing animation plays with content visible
		setTimeout(resetForm, 300);
	}, [onClose, resetForm]);

	const handleSubmit = useCallback(() => {
		if (!canSubmit) return;

		const bakeryId = `quick-${Date.now()}`;
		const pastryId = `quick-${Date.now()}-p`;
		const fullNotes = [selectedEmoji, notes].filter(Boolean).join(" ");

		createCheckIn.mutate(
			{
				pastry_id: pastryId,
				bakery_id: bakeryId,
				rating,
				notes: fullNotes || undefined,
				flavor_tags: selectedEmoji ? [selectedEmoji] : [],
			},
			{
				onSuccess: () => {
					setShowConfetti(true);
					toast.show({
						type: "success",
						title: "Pastry logged!",
						description: `${selectedEmoji} ${pastryName}`,
					});
					setTimeout(() => {
						setShowConfetti(false);
						handleClose();
					}, 1500);
				},
				onError: () => {
					toast.show({
						type: "error",
						title: "Couldn't save",
						description: "Something went wrong. Try again?",
					});
				},
			},
		);
	}, [canSubmit, selectedEmoji, pastryName, notes, rating, createCheckIn, toast, handleClose]);

	return (
		<>
			<Confetti active={showConfetti} />
			<BottomSheet open={open} onClose={handleClose} title="New Pastry Find">
				<div className="flex flex-col gap-5 pb-2">
					{/* Emoji picker */}
					<div className="flex flex-col gap-2">
						<p className="text-sm font-medium text-espresso">Pick an emoji</p>
						<div className="grid grid-cols-5 gap-2">
							{PASTRY_EMOJIS.map((emoji) => {
								const isSelected = selectedEmoji === emoji;
								return (
									<motion.button
										key={emoji}
										type="button"
										onClick={() => setSelectedEmoji(isSelected ? null : emoji)}
										whileTap={{ scale: 0.9 }}
										className={clsx(
											"flex h-14 w-full items-center justify-center rounded-[12px] text-2xl transition-all duration-150",
											isSelected
												? "bg-brioche/20 ring-2 ring-brioche"
												: "bg-parchment/60 hover:bg-parchment",
										)}
										aria-label={`Select ${emoji}`}
										aria-pressed={isSelected}
									>
										{emoji}
									</motion.button>
								);
							})}
						</div>
					</div>

					{/* Pastry name */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="quick-pastry-name" className="text-sm font-medium text-espresso">
							What did you try?
						</label>
						<input
							id="quick-pastry-name"
							type="text"
							value={pastryName}
							onChange={(e) => setPastryName(e.target.value)}
							placeholder="e.g. Pistachio Croissant"
							className="h-11 w-full rounded-input border border-parchment bg-flour px-3 text-sm text-espresso placeholder:text-sesame transition-colors duration-150 focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
						/>
					</div>

					{/* Bakery name */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="quick-bakery-name" className="text-sm font-medium text-espresso">
							Where?
						</label>
						<div className="relative">
							<MapPin
								size={16}
								className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sesame"
							/>
							<input
								id="quick-bakery-name"
								type="text"
								value={bakeryName}
								onChange={(e) => setBakeryName(e.target.value)}
								placeholder="Bakery name & location"
								className="h-11 w-full rounded-input border border-parchment bg-flour pl-9 pr-3 text-sm text-espresso placeholder:text-sesame transition-colors duration-150 focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
							/>
						</div>
					</div>

					{/* Rating */}
					<div className="flex flex-col items-center gap-2">
						<p className="text-sm font-medium text-espresso">Rating</p>
						<Rating value={rating} onChange={setRating} size="lg" />
						{rating > 0 && (
							<p className="text-xs text-sesame">
								{rating === 1 && "Not for me"}
								{rating === 2 && "It was okay"}
								{rating === 3 && "Pretty good"}
								{rating === 4 && "Really good"}
								{rating === 5 && "Incredible!"}
							</p>
						)}
					</div>

					{/* Notes */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="quick-notes" className="text-sm font-medium text-espresso">
							Tell us about it <span className="font-normal text-sesame">(optional)</span>
						</label>
						<textarea
							id="quick-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							maxLength={280}
							rows={2}
							placeholder="The flakiest layers, with just the right amount of..."
							className="w-full resize-none rounded-input border border-parchment bg-flour px-3 py-2.5 text-sm text-espresso placeholder:text-sesame transition-colors duration-150 focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/20"
						/>
					</div>

					{/* Submit button */}
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!canSubmit || createCheckIn.isPending}
						className={clsx(
							"flex h-12 w-full items-center justify-center gap-2 rounded-button text-sm font-semibold transition-all duration-150",
							canSubmit && !createCheckIn.isPending
								? "golden-gradient text-flour shadow-[0_2px_8px_rgba(200,135,95,0.3)] active:scale-[0.98]"
								: "bg-parchment text-sesame cursor-not-allowed",
						)}
					>
						{createCheckIn.isPending ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Saving...
							</>
						) : (
							"+ Add My Find"
						)}
					</button>
				</div>
			</BottomSheet>
		</>
	);
}
