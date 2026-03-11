"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Home, PlusCircle, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = { Home, Search, PlusCircle, User } as const;

const items = [
	{ label: "Feed", href: "/", icon: "Home" as const },
	{ label: "Discover", href: "/discover", icon: "Search" as const },
	{ label: "Add", href: "/add", icon: "PlusCircle" as const },
	{ label: "Profile", href: "/profile", icon: "User" as const },
];

interface SidebarProps {
	collapsed: boolean;
	onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
	const pathname = usePathname();

	return (
		<aside
			className={clsx(
				"hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-flour border-r border-parchment transition-[width] duration-200",
				collapsed ? "w-20" : "w-64",
			)}
		>
			{/* Logo */}
			<div
				className={clsx(
					"flex items-center h-16 border-b border-parchment",
					collapsed ? "justify-center px-0" : "px-5",
				)}
			>
				{collapsed ? (
					<span className="font-display text-xl text-espresso">P</span>
				) : (
					<span className="font-display text-xl text-espresso tracking-tight">Pastry Buddy</span>
				)}
			</div>

			{/* Nav items */}
			<nav aria-label="Main navigation" className="flex-1 flex flex-col gap-1.5 px-3 mt-3">
				{items.map((item) => {
					const Icon = icons[item.icon];
					const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-label={item.label}
							aria-current={isActive ? "page" : undefined}
							className={clsx(
								"flex items-center gap-3 h-10 rounded-[14px] transition-colors duration-150",
								"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche",
								collapsed ? "justify-center px-0" : "px-3",
								isActive
									? "bg-brioche/10 text-brioche font-medium"
									: "text-ganache hover:bg-parchment",
							)}
						>
							<Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
							{!collapsed && <span className="text-sm">{item.label}</span>}
						</Link>
					);
				})}
			</nav>

			{/* Collapse toggle */}
			<button
				type="button"
				aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				onClick={onToggleCollapse}
				className={clsx(
					"flex items-center justify-center h-12 mx-3 mb-4 rounded-[14px] text-ganache transition-colors duration-150",
					"hover:bg-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche",
				)}
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
