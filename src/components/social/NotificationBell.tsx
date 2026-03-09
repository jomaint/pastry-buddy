"use client";

import { useAuth } from "@/api/auth";
import { useMarkNotificationsRead, useNotifications, useUnreadCount } from "@/api/social";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { timeAgo } from "@/lib/time-utils";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Heart, MessageCircle, Trophy, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

const typeIcons = {
	like: Heart,
	comment: MessageCircle,
	follow: UserPlus,
	badge: Trophy,
} as const;

const typeColors = {
	like: "text-raspberry bg-raspberry/10",
	comment: "text-brioche bg-brioche/10",
	follow: "text-pistachio bg-pistachio/10",
	badge: "text-caramel bg-caramel/10",
} as const;

export function NotificationBell() {
	const { data: auth } = useAuth();
	const { data: unreadCount } = useUnreadCount();
	const [open, setOpen] = useState(false);

	if (!auth?.isAuthenticated) return null;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="relative flex h-11 w-11 items-center justify-center rounded-full text-sesame transition-colors hover:text-ganache hover:bg-parchment/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brioche"
				aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
			>
				<Bell size={18} strokeWidth={1.75} />
				<AnimatePresence>
					{(unreadCount ?? 0) > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0 }}
							className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-raspberry px-1 text-[10px] font-bold text-flour tabular-nums"
						>
							{(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
						</motion.span>
					)}
				</AnimatePresence>
			</button>

			{open && <NotificationPanel open={open} onClose={() => setOpen(false)} />}
		</>
	);
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { data: notifications, isLoading } = useNotifications();
	const markRead = useMarkNotificationsRead();
	const isMobile = useMediaQuery("(max-width: 767px)");

	const handleOpen = useCallback(() => {
		markRead.mutate(undefined);
	}, [markRead]);

	// Mark as read when panel opens
	if (open && !markRead.isPending && !markRead.isSuccess) {
		handleOpen();
	}

	const content = (
		<div className="flex flex-col gap-1">
			{isLoading ? (
				<div className="py-8 text-center text-sm text-sesame">Loading...</div>
			) : !notifications || notifications.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-12 text-center">
					<Bell size={24} className="text-sesame/40" />
					<p className="text-sm text-sesame">No notifications yet</p>
					<p className="text-xs text-sesame/70">Activity from friends will show up here</p>
				</div>
			) : (
				notifications.map((n) => {
					const Icon = typeIcons[n.type];
					return (
						<Link
							key={n.id}
							href={n.reference_id ? `/check-in/${n.reference_id}` : "#"}
							onClick={onClose}
							className={clsx(
								"flex items-start gap-3 rounded-[12px] p-3 transition-colors hover:bg-parchment/40",
								!n.read && "bg-brioche/5",
							)}
						>
							<span
								className={clsx(
									"flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
									typeColors[n.type],
								)}
							>
								<Icon size={14} />
							</span>
							<div className="flex-1 min-w-0">
								<p className="text-sm text-espresso leading-snug">{n.body}</p>
								<p className="mt-0.5 text-[11px] text-sesame">{timeAgo(n.created_at)}</p>
							</div>
							{!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brioche" />}
						</Link>
					);
				})
			)}
		</div>
	);

	if (isMobile) {
		return (
			<BottomSheet open={open} onClose={onClose} title="Notifications">
				{content}
			</BottomSheet>
		);
	}

	return (
		<>
			<div className="fixed inset-0 z-40" onClick={onClose} onKeyDown={() => {}} />
			<motion.div
				initial={{ opacity: 0, y: -8, scale: 0.96 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -8, scale: 0.96 }}
				transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
				className="fixed top-16 right-4 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-[16px] bg-flour p-2 shadow-lg border border-parchment/50"
			>
				<div className="px-3 py-2 mb-1">
					<h2 className="font-display text-lg text-espresso">Notifications</h2>
				</div>
				{content}
			</motion.div>
		</>
	);
}
