"use client";

import { ArrowLeft, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
	showBack?: boolean;
	title?: string;
	onMenuOpen?: () => void;
}

export function Header({ showBack, title, onMenuOpen }: HeaderProps) {
	const router = useRouter();

	return (
		<header className="sticky top-0 z-30 flex items-center h-14 px-4 bg-flour/80 backdrop-blur-xl border-b border-parchment/60 md:hidden">
			{showBack ? (
				<button
					type="button"
					aria-label="Go back"
					onClick={() => router.back()}
					className="flex items-center justify-center w-11 h-11 -ml-2 rounded-[14px] text-espresso transition-colors duration-150 hover:bg-parchment active:bg-parchment/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche"
				>
					<ArrowLeft size={20} />
				</button>
			) : onMenuOpen ? (
				<button
					type="button"
					aria-label="Open menu"
					onClick={onMenuOpen}
					className="flex items-center justify-center w-11 h-11 -ml-2 rounded-[14px] text-espresso transition-colors duration-150 hover:bg-parchment active:bg-parchment/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche"
				>
					<Menu size={20} />
				</button>
			) : null}
			<span className="flex-1 font-display text-lg text-espresso tracking-tight ml-1">
				{title ?? "Pastry Buddy"}
			</span>
		</header>
	);
}
