"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmLabel?: string;
	isLoading?: boolean;
}

export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Confirm",
	isLoading = false,
}: ConfirmDialogProps) {
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					className="fixed inset-0 z-[60] flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
				>
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-espresso/50"
						onClick={isLoading ? undefined : onClose}
						onKeyDown={undefined}
					/>

					{/* Dialog */}
					<motion.div
						className="relative mx-4 w-full max-w-sm rounded-[16px] bg-flour p-6 shadow-lg"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.15 }}
					>
						<h2 className="font-display text-lg text-espresso">{title}</h2>
						<p className="mt-2 text-sm text-ganache">{description}</p>

						<div className="mt-6 flex gap-3 justify-end">
							<button
								type="button"
								onClick={onClose}
								disabled={isLoading}
								className="rounded-[14px] bg-parchment px-4 py-2 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80 disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={onConfirm}
								disabled={isLoading}
								className="inline-flex items-center gap-2 rounded-[14px] bg-raspberry px-4 py-2 text-sm font-medium text-flour transition-colors hover:bg-raspberry/90 disabled:opacity-50"
							>
								{isLoading && <Loader2 size={14} className="animate-spin" />}
								{confirmLabel}
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
