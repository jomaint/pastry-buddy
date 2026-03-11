"use client";

import { useAuth } from "@/api/auth";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, Search, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const items = [
	{ label: "Feed", href: "/", icon: Home },
	{ label: "Discover", href: "/discover", icon: Search },
	{ label: "Profile", href: "/profile", icon: User },
];

interface DrawerProps {
	open: boolean;
	onClose: () => void;
}

export function Drawer({ open, onClose }: DrawerProps) {
	const pathname = usePathname();
	const { data: auth } = useAuth();
	const profile = auth?.user;

	// Close on route change
	useEffect(() => {
		onClose();
	}, [pathname, onClose]);

	// Lock body scroll when open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [open]);

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0 z-50 bg-espresso/30 backdrop-blur-sm"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
						aria-hidden="true"
					/>

					{/* Drawer panel */}
					<motion.nav
						aria-label="Navigation menu"
						className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-flour shadow-xl"
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
					>
						{/* Header */}
						<div className="flex items-center justify-between px-5 pt-[max(20px,env(safe-area-inset-top))] pb-4">
							<span className="font-display text-xl text-espresso tracking-tight">
								Pastry Buddy
							</span>
							<button
								type="button"
								onClick={onClose}
								aria-label="Close menu"
								className="flex h-9 w-9 items-center justify-center rounded-full text-sesame transition-colors hover:bg-parchment active:bg-parchment/80"
							>
								<X size={18} />
							</button>
						</div>

						{/* Nav items */}
						<div className="flex flex-col gap-1 px-3 py-4">
							{items.map((item) => {
								const isActive =
									item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
								return (
									<Link
										key={item.href}
										href={item.href}
										className={`flex items-center gap-3 rounded-button px-4 py-3 text-sm font-medium transition-colors duration-150 ${
											isActive ? "bg-brioche/10 text-brioche" : "text-ganache hover:bg-parchment/60"
										}`}
									>
										<item.icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
										{item.label}
									</Link>
								);
							})}
						</div>

						{/* Spacer */}
						<div className="flex-1" />

						{/* User section */}
						<div
							className="border-t border-parchment px-5 py-5"
							style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
						>
							{profile ? (
								<div className="flex items-center gap-3">
									<Avatar name={profile.username || "User"} size="sm" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-espresso truncate">
											@{profile.username}
										</p>
										<p className="text-xs text-sesame truncate">
											Level {profile.level} · {profile.xp} XP
										</p>
									</div>
								</div>
							) : (
								<Link
									href="/sign-in"
									className="flex items-center gap-3 text-sm font-medium text-ganache hover:text-espresso transition-colors"
								>
									<LogOut size={16} />
									Sign in
								</Link>
							)}
						</div>
					</motion.nav>
				</>
			)}
		</AnimatePresence>
	);
}
