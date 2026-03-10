"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { QuickAddModal } from "./QuickAddModal";

export function FloatingAddButton() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<motion.button
				type="button"
				onClick={() => setOpen(true)}
				whileTap={{ scale: 0.9 }}
				className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full golden-gradient text-flour shadow-[0_4px_12px_rgba(200,135,95,0.4)]"
				aria-label="Quick add pastry"
			>
				<Plus size={24} strokeWidth={2.5} />
			</motion.button>
			<QuickAddModal open={open} onClose={() => setOpen(false)} />
		</>
	);
}
