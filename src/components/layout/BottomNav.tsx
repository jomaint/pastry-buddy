"use client";

import { Home, Search, PlusCircle, Bookmark, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const icons = { Home, Search, PlusCircle, Bookmark, User } as const;

const items = [
	{ label: "Feed", href: "/", icon: "Home" as const },
	{ label: "Discover", href: "/discover", icon: "Search" as const },
	{ label: "Log", href: "/log", icon: "PlusCircle" as const },
	{ label: "Lists", href: "/lists", icon: "Bookmark" as const },
	{ label: "Profile", href: "/profile", icon: "User" as const },
];

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-flour/80 backdrop-blur-xl border-t border-parchment">
			<div
				className="flex items-end justify-around px-2 pt-2"
				style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
			>
				{items.map((item) => {
					const Icon = icons[item.icon];
					const isActive =
						item.href === "/"
							? pathname === "/"
							: pathname.startsWith(item.href);
					const isLog = item.icon === "PlusCircle";

					if (isLog) {
						return (
							<Link
								key={item.href}
								href={item.href}
								className="flex flex-col items-center gap-0.5 -mt-3"
							>
								<span className="flex items-center justify-center w-12 h-12 rounded-full bg-brioche text-flour shadow-sm">
									<Icon size={24} strokeWidth={2} />
								</span>
								<span className="text-[10px] font-medium text-brioche">
									{item.label}
								</span>
							</Link>
						);
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							className={clsx(
								"flex flex-col items-center gap-0.5 py-1 min-w-[48px] transition-colors duration-150",
								isActive ? "text-brioche" : "text-sesame",
							)}
						>
							<Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
							<span className="text-[10px] font-medium">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
