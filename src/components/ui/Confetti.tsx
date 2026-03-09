"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const EMOJIS = ["🥐", "🍰", "🧁", "🎉", "✨", "🍩", "🎊", "⭐"];

interface Particle {
	id: number;
	emoji: string;
	x: number;
	delay: number;
	duration: number;
	rotation: number;
	scale: number;
}

function generateParticles(count: number): Particle[] {
	return Array.from({ length: count }, (_, i) => ({
		id: i,
		emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
		x: Math.random() * 100,
		delay: Math.random() * 0.3,
		duration: 1.5 + Math.random() * 1,
		rotation: -180 + Math.random() * 360,
		scale: 0.6 + Math.random() * 0.8,
	}));
}

export function Confetti({
	active,
	count = 24,
}: {
	active: boolean;
	count?: number;
}) {
	const [particles, setParticles] = useState<Particle[]>([]);

	useEffect(() => {
		if (active) {
			setParticles(generateParticles(count));
			const timer = setTimeout(() => setParticles([]), 3000);
			return () => clearTimeout(timer);
		}
		setParticles([]);
	}, [active, count]);

	return (
		<div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
			<AnimatePresence>
				{particles.map((p) => (
					<motion.div
						key={p.id}
						initial={{
							opacity: 1,
							y: -20,
							x: `${p.x}vw`,
							scale: 0,
							rotate: 0,
						}}
						animate={{
							opacity: [1, 1, 0],
							y: "100vh",
							scale: p.scale,
							rotate: p.rotation,
						}}
						exit={{ opacity: 0 }}
						transition={{
							duration: p.duration,
							delay: p.delay,
							ease: [0.25, 0.46, 0.45, 0.94],
						}}
						className="absolute text-2xl"
					>
						{p.emoji}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
