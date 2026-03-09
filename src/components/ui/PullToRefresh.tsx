"use client";

import { motion, useAnimation } from "framer-motion";
import { Croissant } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";

const THRESHOLD = 80;

interface PullToRefreshProps {
	onRefresh: () => Promise<void>;
	children: ReactNode;
	className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
	const [pulling, setPulling] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const pullDistance = useRef(0);
	const startY = useRef(0);
	const controls = useAnimation();
	const containerRef = useRef<HTMLDivElement>(null);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (refreshing) return;
			const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
			if (scrollTop > 0) return;
			startY.current = e.touches[0].clientY;
			setPulling(true);
		},
		[refreshing],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!pulling || refreshing) return;
			const currentY = e.touches[0].clientY;
			const diff = currentY - startY.current;
			if (diff < 0) {
				pullDistance.current = 0;
				return;
			}
			// Dampen the pull distance
			pullDistance.current = Math.min(diff * 0.4, THRESHOLD * 1.5);
			controls.set({ y: pullDistance.current });
		},
		[pulling, refreshing, controls],
	);

	const handleTouchEnd = useCallback(async () => {
		if (!pulling) return;
		setPulling(false);

		if (pullDistance.current >= THRESHOLD) {
			setRefreshing(true);
			await controls.start({ y: THRESHOLD * 0.6, transition: { duration: 0.2 } });
			try {
				await onRefresh();
			} finally {
				setRefreshing(false);
				await controls.start({ y: 0, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } });
			}
		} else {
			await controls.start({ y: 0, transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] } });
		}
		pullDistance.current = 0;
	}, [pulling, controls, onRefresh]);

	const progress = Math.min(pullDistance.current / THRESHOLD, 1);

	return (
		<div
			ref={containerRef}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			className={className}
		>
			{/* Pull indicator */}
			<div
				className="flex justify-center overflow-hidden"
				style={{ height: pulling || refreshing ? 48 : 0 }}
			>
				<motion.div
					className="flex items-center justify-center"
					animate={{
						rotate: refreshing ? 360 : progress * 180,
						opacity: refreshing ? 1 : progress,
					}}
					transition={
						refreshing
							? { rotate: { repeat: Number.POSITIVE_INFINITY, duration: 0.8, ease: "linear" } }
							: { duration: 0 }
					}
				>
					<Croissant size={24} className="text-brioche" />
				</motion.div>
			</div>

			<motion.div animate={controls}>{children}</motion.div>
		</div>
	);
}
