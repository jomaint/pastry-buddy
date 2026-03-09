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
			<main className="pt-[env(safe-area-inset-top)] pb-24 md:pt-20 md:pb-6">{children}</main>
			<BottomNav />
		</div>
	);
}
