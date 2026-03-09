"use client";

import { useTrackEvent } from "@/hooks/use-track-event";
import clsx from "clsx";
import { Check, Share2 } from "lucide-react";
import { useCallback, useState } from "react";

interface ShareButtonProps {
	checkInId: string;
	pastryName: string;
	compact?: boolean;
}

export function ShareButton({ checkInId, pastryName, compact = false }: ShareButtonProps) {
	const [copied, setCopied] = useState(false);
	const trackEvent = useTrackEvent();

	const handleShare = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const url = `${window.location.origin}/check-in/${checkInId}`;
			const shareData = {
				title: `${pastryName} — Pastry Buddy`,
				text: `Check out this ${pastryName} on Pastry Buddy!`,
				url,
			};

			if (navigator.share) {
				try {
					await navigator.share(shareData);
					trackEvent("share", { properties: { check_in_id: checkInId, method: "native" } });
				} catch {
					// User cancelled share — no-op
				}
			} else {
				await navigator.clipboard.writeText(url);
				setCopied(true);
				trackEvent("share", { properties: { check_in_id: checkInId, method: "clipboard" } });
				setTimeout(() => setCopied(false), 2000);
			}
		},
		[checkInId, pastryName, trackEvent],
	);

	return (
		<button
			type="button"
			onClick={handleShare}
			className={clsx(
				"inline-flex items-center gap-1.5 transition-colors duration-150",
				compact
					? "rounded-full px-2 py-1 text-xs"
					: "min-h-[44px] rounded-[14px] px-4 text-sm font-medium",
				copied
					? "bg-pistachio/10 text-pistachio"
					: "bg-parchment text-sesame hover:text-ganache hover:bg-parchment/80",
			)}
			aria-label="Share"
		>
			{copied ? <Check size={compact ? 14 : 16} /> : <Share2 size={compact ? 14 : 16} />}
			{!compact && <span>{copied ? "Copied!" : "Share"}</span>}
		</button>
	);
}
