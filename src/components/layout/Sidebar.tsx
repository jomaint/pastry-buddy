"use client";

import {
	Home,
	Search,
	PlusCircle,
	Bookmark,
	User,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

const icons = { Home, Search, PlusCircle, Bookmark, User } as const;

const items = [
	{ label: "Feed", href: "/", icon: "Home" as const },
	{ label: "Discover", href: "/discover", icon: "Search" as const },
	{ label: "Log", href: "/log", icon: "PlusCircle" as const },
	{ label: "Lists", href: "/lists", icon: "Bookmark" as const },
	{ label: "Profile", href: "/profile", icon: "User" as const },
];

export function Sidebar() {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<aside
			className={clsx(
				"hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-flour border-r border-parchment transition-[width] duration-200",
				collapsed ? "w-20" : "w-64",
			)}
		>
			{/* Logo */}
			<div className={clsx("flex items-center h-16 px-5", collapsed && "justify-center px-0")}>
				{!collapsed && (
					<span className="font-display text-xl text-espresso tracking-tight">
						Pastry Buddy
					</span>
				)}
				{collapsed && (
					<span className="font-display text-xl text-espresso">P</span>
				)}
			</div>

			{/* Nav items */}
			<nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
				{items.map((item) => {
					const Icon = icons[item.icon];
					const isActive =
						item.href === "/"
							? pathname === "/"
							: pathname.startsWith(item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={clsx(
								"flex items-center gap-3 h-10 rounded-[14px] transition-colors duration-150",
								collapsed ? "justify-center px-0" : "px-3",
								isActive
									? "bg-brioche/10 text-brioche"
									: "text-ganache hover:bg-parchment",
							)}
						>
							<Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
							{!collapsed && (
								<span className="text-sm font-medium">{item.label}</span>
							)}
						</Link>
					);
				})}
			</nav>

			{/* Collapse toggle */}
			<button
				type="button"
				onClick={() => setCollapsed((c) => !c)}
				className="flex items-center justify-center h-12 mx-3 mb-4 rounded-[14px] text-ganache hover:bg-parchment transition-colors duration-150"
			>
				{collapsed ? (
					<ChevronRight size={18} />
				) : (
					<>
						<ChevronLeft size={18} />
						<span className="text-sm font-medium ml-2">Collapse</span>
					</>
				)}
			</button>
		</aside>
	);
}
