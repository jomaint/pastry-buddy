"use client";

import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Croissant } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";

const THRESHOLD = 80;
const MAX_PULL = THRESHOLD * 1.5;

interface PullToRefreshProps {
	onRefresh: () => Promise<void>;
	children: ReactNode;
	className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
	const [state, setState] = useState<"idle" | "pulling" | "ready" | "refreshing">("idle");
	const pullY = useMotionValue(0);
	const startY = useRef(0);
	const controls = useAnimation();
	const containerRef = useRef<HTMLDivElement>(null);

	// Derived motion values for the croissant
	const progress = useTransform(pullY, [0, THRESHOLD], [0, 1], { clamp: true });
	const croissantRotate = useTransform(pullY, [0, THRESHOLD], [0, 180]);
	const croissantScale = useTransform(pullY, [0, THRESHOLD * 0.3, THRESHOLD], [0.4, 0.7, 1]);
	const croissantOpacity = useTransform(pullY, [0, THRESHOLD * 0.2, THRESHOLD], [0, 0.6, 1]);
	const indicatorHeight = useTransform(pullY, [0, MAX_PULL], [0, 64], { clamp: true });

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (state === "refreshing") return;
			const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
			if (scrollTop > 0) return;
			startY.current = e.touches[0].clientY;
			setState("pulling");
		},
		[state],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (state !== "pulling" && state !== "ready") return;
			const diff = e.touches[0].clientY - startY.current;
			if (diff < 0) {
				pullY.set(0);
				return;
			}
			const dampened = Math.min(diff * 0.4, MAX_PULL);
			pullY.set(dampened);
			controls.set({ y: dampened });

			// Toggle ready state
			if (dampened >= THRESHOLD && state !== "ready") {
				setState("ready");
			} else if (dampened < THRESHOLD && state === "ready") {
				setState("pulling");
			}
		},
		[state, controls, pullY],
	);

	const handleTouchEnd = useCallback(async () => {
		if (state !== "pulling" && state !== "ready") return;

		if (pullY.get() >= THRESHOLD) {
			setState("refreshing");
			// Snap to resting position
			pullY.set(THRESHOLD * 0.6);
			await controls.start({
				y: THRESHOLD * 0.6,
				transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
			});
			try {
				await onRefresh();
			} finally {
				// Success bounce — slight overshoot then settle
				await controls.start({
					y: -4,
					transition: { duration: 0.15, ease: [0.25, 1, 0.5, 1] },
				});
				pullY.set(0);
				await controls.start({
					y: 0,
					transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
				});
				setState("idle");
			}
		} else {
			pullY.set(0);
			await controls.start({
				y: 0,
				transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
			});
			setState("idle");
		}
	}, [state, controls, onRefresh, pullY]);

	const hintText =
		state === "refreshing"
			? "Refreshing..."
			: state === "ready"
				? "Release to refresh"
				: "Pull to refresh";

	const isActive = state !== "idle";

	return (
		<div
			ref={containerRef}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			className={className}
		>
			{/* Fixed indicator — renders above the sticky header (z-30) */}
			{isActive && (
				<motion.div
					className="fixed inset-x-0 top-0 z-40 flex items-end justify-center bg-creme/90 backdrop-blur-sm"
					style={{ height: indicatorHeight }}
				>
					<div className="flex flex-col items-center gap-1.5 pb-2">
						<motion.div
							className="flex items-center justify-center"
							style={{
								rotate: state === "refreshing" ? undefined : croissantRotate,
								scale: state === "refreshing" ? 1 : croissantScale,
								opacity: state === "refreshing" ? 1 : croissantOpacity,
							}}
							animate={
								state === "refreshing"
									? {
											rotate: [0, 360],
											transition: {
												rotate: {
													repeat: Number.POSITIVE_INFINITY,
													duration: 0.8,
													ease: "linear",
												},
											},
										}
									: undefined
							}
						>
							<Croissant
								size={22}
								className={
									state === "ready" || state === "refreshing" ? "text-brioche" : "text-brioche/60"
								}
							/>
						</motion.div>
						<motion.span
							className="text-[11px] font-medium text-sesame"
							style={{ opacity: croissantOpacity }}
						>
							{hintText}
						</motion.span>
					</div>
				</motion.div>
			)}

			<motion.div animate={controls}>{children}</motion.div>
		</div>
	);
}
