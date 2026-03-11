"use client";

import { ClipboardList, Croissant, LayoutDashboard, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ label: "Dashboard", href: "/admin", icon: LayoutDashboard },
	{ label: "Users", href: "/admin/users", icon: Users },
	{ label: "Check-ins", href: "/admin/check-ins", icon: ClipboardList },
	{ label: "Places", href: "/admin/places", icon: MapPin },
	{ label: "Pastries", href: "/admin/pastries", icon: Croissant },
];

export function AdminSidebar() {
	const pathname = usePathname();

	return (
		<aside className="flex w-56 shrink-0 flex-col border-r border-parchment bg-flour">
			<div className="px-5 py-5">
				<span className="font-display text-lg text-espresso">Pastry Buddy</span>
				<span className="ml-1.5 text-xs font-medium uppercase tracking-wider text-sesame">
					Admin
				</span>
			</div>

			<nav className="flex flex-1 flex-col gap-1 px-3 py-2">
				{navItems.map(({ label, href, icon: Icon }) => {
					const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

					return (
						<Link
							key={href}
							href={href}
							className={`flex h-10 items-center gap-3 rounded-[14px] px-3 text-sm transition-colors ${
								isActive
									? "bg-brioche/10 font-medium text-brioche"
									: "text-ganache hover:bg-parchment/60"
							}`}
						>
							<Icon size={18} />
							{label}
						</Link>
					);
				})}
			</nav>

			<div className="border-t border-parchment px-3 py-4">
				<Link
					href="/"
					className="flex h-10 items-center gap-3 rounded-[14px] px-3 text-sm text-ganache hover:bg-parchment/60"
				>
					&larr; Back to app
				</Link>
			</div>
		</aside>
	);
}
