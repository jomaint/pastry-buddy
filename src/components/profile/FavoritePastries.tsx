"use client";

import { PASTRY_CATEGORIES } from "@/config/pastry-categories";
import clsx from "clsx";
import { Heart, Pencil } from "lucide-react";
import { useState } from "react";

interface FavoritePastriesProps {
	favorites: string[];
	editable?: boolean;
	onSave?: (favorites: string[]) => void;
}

function FavoritePastries({ favorites, editable = false, onSave }: FavoritePastriesProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [selected, setSelected] = useState<string[]>(favorites);

	function handleToggle(category: string) {
		setSelected((prev) =>
			prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
		);
	}

	function handleSave() {
		onSave?.(selected);
		setIsEditing(false);
	}

	function handleCancel() {
		setSelected(favorites);
		setIsEditing(false);
	}

	const displayItems = isEditing
		? PASTRY_CATEGORIES
		: PASTRY_CATEGORIES.filter((c) => favorites.includes(c.name));
	const isEmpty = favorites.length === 0 && !isEditing;

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="font-display text-xl text-espresso">Favorite Pastries</h2>
				{editable && !isEditing && (
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="inline-flex items-center gap-1.5 rounded-[14px] px-3 py-1.5 text-xs font-medium text-sesame transition-colors duration-150 hover:bg-parchment hover:text-ganache"
					>
						<Pencil size={12} />
						Edit
					</button>
				)}
			</div>

			{isEmpty ? (
				<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-10">
					<Heart size={20} className="text-sesame" />
					<p className="text-sm text-sesame">
						{editable ? "Tell others what you love" : "No favorites yet"}
					</p>
					{editable && (
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="mt-1 inline-flex h-8 items-center rounded-[14px] bg-brioche px-4 text-sm font-medium text-flour transition-colors duration-150 hover:bg-brioche/90"
						>
							Add favorites
						</button>
					)}
				</div>
			) : (
				<div className="flex flex-wrap gap-2">
					{displayItems.map((category) => {
						const isSelected = selected.includes(category.name);
						const showAsChip = isEditing || isSelected;

						if (!showAsChip) return null;

						return (
							<button
								key={category.name}
								type="button"
								disabled={!isEditing}
								onClick={() => isEditing && handleToggle(category.name)}
								className={clsx(
									"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
									"border transition-colors duration-150",
									isEditing && "cursor-pointer",
									!isEditing && "cursor-default",
									isSelected
										? "border-brioche bg-brioche/10 text-brioche"
										: "border-transparent bg-parchment text-ganache hover:border-sesame",
								)}
							>
								{category.name}
							</button>
						);
					})}
				</div>
			)}

			{isEditing && (
				<div className="flex items-center gap-2 pt-1">
					<button
						type="button"
						onClick={handleSave}
						className="inline-flex h-8 items-center rounded-[14px] bg-brioche px-4 text-sm font-medium text-flour transition-colors duration-150 hover:bg-brioche/90"
					>
						Save
					</button>
					<button
						type="button"
						onClick={handleCancel}
						className="inline-flex h-8 items-center rounded-[14px] px-4 text-sm font-medium text-sesame transition-colors duration-150 hover:bg-parchment hover:text-ganache"
					>
						Cancel
					</button>
					<span className="ml-auto text-xs text-sesame">{selected.length} selected</span>
				</div>
			)}
		</section>
	);
}

export { FavoritePastries };
