"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
	icon: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<motion.div
				className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-parchment/60"
				animate={{ y: [0, -6, 0] }}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			>
				{icon}
			</motion.div>
			<p className="font-display text-xl text-espresso">{title}</p>
			{description && (
				<p className="mt-2 max-w-[260px] text-sm leading-relaxed text-sesame">{description}</p>
			)}
			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}
