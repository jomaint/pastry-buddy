"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Bookmark, Home, PlusCircle, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = { Home, Search, PlusCircle, Bookmark, User } as const;

const items = [
	{ label: "Feed", href: "/", icon: "Home" as const },
	{ label: "Discover", href: "/discover", icon: "Search" as const },
	{ label: "Log", href: "/log", icon: "PlusCircle" as const },
	{ label: "Lists", href: "/lists", icon: "Bookmark" as const },
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
				"w-[calc(100%-24px)] max-w-[560px]",
				"flex items-center h-14",
				"rounded-full",
				"bg-flour/75 backdrop-blur-2xl",
				"border border-parchment/50",
				"shadow-[0_0_0_0.5px_rgba(44,24,16,0.04),0_1px_2px_rgba(44,24,16,0.04),0_4px_12px_rgba(44,24,16,0.06),0_12px_32px_rgba(44,24,16,0.04)]",
			)}
		>
			{/* Logo — desktop only */}
			<span className="hidden md:block pl-5 pr-2 font-display text-[15px] text-espresso tracking-tight whitespace-nowrap select-none">
				Pastry Buddy
			</span>

			{/* Nav items */}
			<div className="flex-1 flex items-center justify-center gap-0.5 px-1.5">
				{items.map((item) => {
					const Icon = icons[item.icon];
					const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
					const isLog = item.icon === "PlusCircle";

					if (isLog) {
						return (
							<Link
								key={item.href}
								href={item.href}
								aria-label={item.label}
								className={clsx(
									"relative flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] rounded-full px-3.5 mx-0.5",
									"bg-brioche text-flour",
									"shadow-[0_1px_4px_rgba(200,135,95,0.3),0_2px_8px_rgba(200,135,95,0.15)]",
									"transition-all duration-150",
									"hover:shadow-[0_1px_4px_rgba(200,135,95,0.4),0_4px_12px_rgba(200,135,95,0.25)]",
									"hover:scale-[1.03]",
									"active:scale-[0.97]",
									"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche",
								)}
							>
								<Icon size={18} strokeWidth={2.25} />
								<span className="hidden md:inline text-[13px] font-medium">{item.label}</span>
							</Link>
						);
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-label={item.label}
							aria-current={isActive ? "page" : undefined}
							className={clsx(
								"relative flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] rounded-full px-3 md:px-3.5",
								"transition-all duration-150",
								"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche",
								isActive
									? "bg-brioche/10 text-brioche"
									: "text-sesame hover:text-ganache hover:bg-parchment/50",
							)}
						>
							<Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
							<span
								className={clsx(
									"hidden md:inline text-[13px]",
									isActive ? "font-medium" : "font-normal",
								)}
							>
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>

			{/* Avatar — desktop only */}
			<div className="hidden md:flex items-center pr-3 pl-1">
				<div
					className={clsx(
						"w-8 h-8 rounded-full",
						"bg-parchment",
						"flex items-center justify-center",
						"text-sesame",
						"border border-parchment/80",
					)}
				>
					<User size={15} strokeWidth={1.75} />
				</div>
			</div>
		</motion.nav>
	);
}
