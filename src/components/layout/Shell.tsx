"use client";

import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface ShellProps {
	children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
	return (
		<div className="min-h-dvh bg-creme">
			<TopNav />
			<main className="pt-[env(safe-area-inset-top)] pb-[calc(96px+env(safe-area-inset-bottom))] md:pt-20 md:pb-6 lg:px-6">
				{children}
			</main>
			<BottomNav />
		</div>
	);
}
