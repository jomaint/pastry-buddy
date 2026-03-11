"use client";

import { motion, useInView } from "framer-motion";
import { type ReactNode, useRef } from "react";

interface PageTransitionProps {
	children: ReactNode;
	className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function StaggerContainer({ children, className }: PageTransitionProps) {
	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: { transition: { staggerChildren: 0.04 } },
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function StaggerItem({ children, className }: PageTransitionProps) {
	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: 6 },
				visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } },
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/**
 * Reveals children with a fade-up animation when they enter the viewport.
 * Use for list items that load below the fold.
 */
export function ScrollReveal({ children, className }: PageTransitionProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-40px 0px" });

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 12 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
			transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
