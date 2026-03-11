"use client";

import { useCallback, useState } from "react";
import { Drawer } from "./Drawer";
import { Header } from "./Header";
import { TopNav } from "./TopNav";

interface ShellProps {
	children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const handleClose = useCallback(() => setDrawerOpen(false), []);

	return (
		<div className="min-h-dvh bg-creme">
			<Header onMenuOpen={() => setDrawerOpen(true)} />
			<TopNav />
			<main className="pb-6 md:pt-20 lg:px-6">{children}</main>
			<Drawer open={drawerOpen} onClose={handleClose} />
		</div>
	);
}
