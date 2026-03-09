"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface ChipProps {
	selected?: boolean;
	onToggle?: () => void;
	children: ReactNode;
	className?: string;
}

function Chip({ selected = false, onToggle, children, className }: ChipProps) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onToggle}
			className={clsx(
				"inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium min-h-[44px]",
				"border transition-colors duration-150 cursor-pointer",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brioche/30",
				selected
					? "bg-brioche/10 text-brioche border-brioche"
					: "bg-parchment text-ganache border-transparent hover:border-sesame",
				className,
			)}
		>
			{children}
		</button>
	);
}

export { Chip, type ChipProps };
