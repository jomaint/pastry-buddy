"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
	showBack?: boolean;
	title?: string;
}

export function Header({ showBack, title }: HeaderProps) {
	const router = useRouter();

	return (
		<header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-flour/80 backdrop-blur-xl md:hidden">
			{showBack && (
				<button
					type="button"
					onClick={() => router.back()}
					className="flex items-center justify-center w-8 h-8 -ml-1 rounded-[14px] text-espresso hover:bg-parchment transition-colors duration-150"
				>
					<ArrowLeft size={20} />
				</button>
			)}
			<span className="font-display text-lg text-espresso tracking-tight ml-1">
				{title ?? "Pastry Buddy"}
			</span>
		</header>
	);
}
