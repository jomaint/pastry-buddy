"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Home, PlusCircle, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = { Home, Search, PlusCircle, User } as const;

const items = [
	{ label: "Feed", href: "/", icon: "Home" as const },
	{ label: "Discover", href: "/discover", icon: "Search" as const },
	{ label: "Log", href: "/log", icon: "PlusCircle" as const },
	{ label: "Profile", href: "/profile", icon: "User" as const },
];

export function TopNav() {
	const pathname = usePathname();

	return (
		<motion.nav
			aria-label="Main navigation"
			initial={{ opacity: 0, y: -12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
			className={clsx(
				"fixed top-3 left-1/2 -translate-x-1/2 z-50",
				"w-[calc(100%-24px)] max-w-[480px]",
				"hidden md:flex items-center h-14",
				"rounded-full",
				"bg-flour/75 backdrop-blur-2xl",
				"border border-parchment/50",
				"shadow-[0_0_0_0.5px_rgba(44,24,16,0.04),0_1px_2px_rgba(44,24,16,0.04),0_4px_12px_rgba(44,24,16,0.06),0_12px_32px_rgba(44,24,16,0.04)]",
			)}
		>
			{/* Logo */}
			<span className="pl-5 pr-2 font-display text-[15px] text-espresso tracking-tight whitespace-nowrap select-none">
				Pastry Buddy
			</span>

			{/* Nav items */}
			<div className="flex-1 flex items-center justify-center gap-0.5 px-2">
				{items.map((item) => {
					const Icon = icons[item.icon];
					const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
					const isLog = item.icon === "PlusCircle";

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-label={item.label}
							aria-current={isActive ? "page" : undefined}
							className={clsx(
								"relative flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] rounded-full px-3.5",
								"transition-all duration-150",
								"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche",
								isLog && !isActive && "text-brioche hover:bg-brioche/10",
								isLog && isActive && "bg-brioche text-flour",
								!isLog && isActive && "bg-brioche/10 text-brioche",
								!isLog && !isActive && "text-sesame hover:text-ganache hover:bg-parchment/50",
							)}
						>
							<Icon size={18} strokeWidth={isActive || isLog ? 2.25 : 1.75} />
							<span
								className={clsx("text-[13px]", isActive || isLog ? "font-medium" : "font-normal")}
							>
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>

			{/* Right spacing to balance the logo */}
			<div className="w-5" />
		</motion.nav>
	);
}
