"use client";

import { useState } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface ShellProps {
	children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	return (
		<div className="min-h-dvh bg-creme">
			<Sidebar
				collapsed={sidebarCollapsed}
				onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
			/>

			<div
				className="shell-content"
				style={{ "--sidebar-w": sidebarCollapsed ? "80px" : "256px" } as React.CSSProperties}
			>
				<Header />

				<main className="pb-20 md:pb-0">{children}</main>
			</div>

			<BottomNav />
		</div>
	);
}
