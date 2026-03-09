"use client";

import clsx from "clsx";
import { Star } from "lucide-react";
import { useCallback, useState } from "react";

type RatingSize = "sm" | "md" | "lg";

interface RatingProps {
	value: number;
	max?: number;
	onChange?: (value: number) => void;
	readonly?: boolean;
	size?: RatingSize;
	className?: string;
}

const sizeMap: Record<RatingSize, number> = {
	sm: 14,
	md: 18,
	lg: 24,
};

const gapStyles: Record<RatingSize, string> = {
	sm: "gap-0.5",
	md: "gap-1",
	lg: "gap-1.5",
};

function Rating({
	value,
	max = 5,
	onChange,
	readonly = false,
	size = "md",
	className,
}: RatingProps) {
	const interactive = !readonly && !!onChange;
	const iconSize = sizeMap[size];
	const [tappedIndex, setTappedIndex] = useState<number | null>(null);

	const handleClick = useCallback(
		(index: number) => {
			if (!interactive) return;
			onChange(index + 1);
			setTappedIndex(index);
			setTimeout(() => setTappedIndex(null), 300);
		},
		[interactive, onChange],
	);

	return (
		<div
			className={clsx("inline-flex items-center", gapStyles[size], className)}
			role={interactive ? "radiogroup" : "img"}
			aria-label={`Rating: ${value} out of ${max}`}
		>
			{Array.from({ length: max }, (_, i) => {
				const filled = i < value;
				const isTapped = tappedIndex === i;
				return (
					<button
						key={`star-${i}`}
						type="button"
						disabled={!interactive}
						onClick={() => handleClick(i)}
						className={clsx(
							"inline-flex items-center justify-center p-0 border-0 bg-transparent transition-all duration-150",
							interactive && "cursor-pointer hover:scale-110 active:scale-90",
							!interactive && "cursor-default",
							isTapped && "scale-125",
						)}
						style={{
							transitionDelay: interactive ? `${i * 30}ms` : "0ms",
						}}
						aria-label={`${i + 1} star${i + 1 > 1 ? "s" : ""}`}
					>
						<Star
							size={iconSize}
							className={clsx(
								"transition-colors duration-150",
								filled ? "fill-caramel text-caramel" : "fill-none text-sesame",
							)}
						/>
					</button>
				);
			})}
		</div>
	);
}

export { Rating, type RatingProps };
