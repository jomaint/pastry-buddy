"use client";

import { useAuth } from "@/api/auth";
import { useLikes, useToggleLike } from "@/api/social";
import { useTrackEvent } from "@/hooks/use-track-event";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
	checkInId: string;
	compact?: boolean;
}

export function LikeButton({ checkInId, compact = false }: LikeButtonProps) {
	const { data: auth } = useAuth();
	const router = useRouter();
	const { data: likeStatus } = useLikes(checkInId);
	const toggleLike = useToggleLike();
	const trackEvent = useTrackEvent();

	const liked = likeStatus?.liked ?? false;
	const count = likeStatus?.count ?? 0;

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!auth?.isAuthenticated) {
			router.push("/sign-in");
			return;
		}

		toggleLike.mutate(checkInId);
		trackEvent(liked ? "unlike" : "like", { properties: { check_in_id: checkInId } });
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={toggleLike.isPending}
			className={clsx(
				"inline-flex items-center gap-1.5 transition-colors duration-150",
				compact
					? "rounded-full px-2 py-1 text-xs"
					: "min-h-[44px] rounded-[14px] px-4 text-sm font-medium",
				liked
					? "bg-raspberry/10 text-raspberry"
					: "bg-parchment text-sesame hover:text-ganache hover:bg-parchment/80",
			)}
			aria-label={liked ? "Unlike" : "Like"}
		>
			<motion.span
				animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
				transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
				className="flex items-center"
			>
				<Heart
					size={compact ? 14 : 16}
					className={clsx(liked && "fill-raspberry text-raspberry")}
				/>
			</motion.span>
			{count > 0 && <span className="tabular-nums">{count}</span>}
			{!compact && !count && <span>Crave</span>}
		</button>
	);
}
