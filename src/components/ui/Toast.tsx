"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Award, Check, X } from "lucide-react";
import { type ReactNode, createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "badge" | "levelup" | "error";

interface Toast {
	id: number;
	type: ToastType;
	title: string;
	description?: string;
	icon?: string;
}

interface ToastContextValue {
	show: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
	return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const show = useCallback((toast: Omit<Toast, "id">) => {
		const id = nextId++;
		setToasts((prev) => [...prev, { ...toast, id }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ show }}>
			{children}
			<div className="fixed bottom-20 left-0 right-0 z-[90] flex flex-col items-center gap-2 pointer-events-none px-4">
				<AnimatePresence>
					{toasts.map((toast) => (
						<motion.div
							key={toast.id}
							initial={{ opacity: 0, y: 20, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -10, scale: 0.95 }}
							transition={{
								type: "spring",
								stiffness: 400,
								damping: 30,
							}}
							className="pointer-events-auto flex items-center gap-3 rounded-[14px] bg-espresso px-4 py-3 shadow-lg max-w-sm w-full"
						>
							<ToastIcon type={toast.type} icon={toast.icon} />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-flour">{toast.title}</p>
								{toast.description && (
									<p className="text-xs text-flour/70 mt-0.5">{toast.description}</p>
								)}
							</div>
							<button
								type="button"
								aria-label="Dismiss notification"
								onClick={() => dismiss(toast.id)}
								className="shrink-0 text-flour/50 hover:text-flour transition-colors"
							>
								<X size={14} aria-hidden="true" />
							</button>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}

function ToastIcon({ type, icon }: { type: ToastType; icon?: string }) {
	if (icon) {
		return <span className="text-lg">{icon}</span>;
	}

	switch (type) {
		case "badge":
			return (
				<motion.div
					initial={{ rotate: -30, scale: 0 }}
					animate={{ rotate: 0, scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
				>
					<Award size={20} className="text-caramel" />
				</motion.div>
			);
		case "levelup":
			return (
				<motion.div
					initial={{ y: 10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
					className="text-lg"
				>
					🎉
				</motion.div>
			);
		case "error":
			return <X size={18} className="text-raspberry" />;
		default:
			return (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 400, damping: 15 }}
				>
					<Check size={18} className="text-pistachio" />
				</motion.div>
			);
	}
}
