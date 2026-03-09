"use client";

import { TopNav } from "./TopNav";

interface ShellProps {
	children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
	return (
		<div className="min-h-dvh bg-creme">
			<TopNav />
			<main className="pt-20 pb-6">{children}</main>
		</div>
	);
}
