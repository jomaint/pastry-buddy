"use client";

import { AnimatePresence, type PanInfo, motion, useDragControls } from "framer-motion";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

interface BottomSheetProps {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
	title?: string;
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
	const dragControls = useDragControls();
	const sheetRef = useRef<HTMLDivElement>(null);

	// Lock body scroll when open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [open]);

	// Close on escape
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [open, onClose]);

	const handleDragEnd = useCallback(
		(_: unknown, info: PanInfo) => {
			if (info.offset.y > 100 || info.velocity.y > 300) {
				onClose();
			}
		},
		[onClose],
	);

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-espresso/40"
						onClick={onClose}
					/>

					{/* Sheet */}
					<motion.div
						ref={sheetRef}
						// biome-ignore lint/a11y/useSemanticElements: motion.div incompatible with native <dialog>
						role="dialog"
						aria-modal="true"
						aria-label={title}
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
						drag="y"
						dragControls={dragControls}
						dragConstraints={{ top: 0 }}
						dragElastic={0.1}
						onDragEnd={handleDragEnd}
						className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[24px] bg-flour shadow-lg"
						style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
					>
						{/* Drag handle */}
						<div className="flex justify-center py-3">
							<div className="h-1 w-8 rounded-full bg-sesame/30" />
						</div>

						{/* Header */}
						{title && (
							<div className="px-5 pb-3">
								<h2 className="font-display text-xl text-espresso">{title}</h2>
							</div>
						)}

						{/* Content */}
						<div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
