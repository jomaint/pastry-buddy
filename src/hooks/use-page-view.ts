"use client";

import { useTrackEvent } from "@/hooks/use-track-event";
import { useEffect } from "react";

/**
 * Track a page view event. Fires once on mount.
 */
export function usePageView(pagePath: string) {
	const trackEvent = useTrackEvent();

	useEffect(() => {
		trackEvent("page_view", { pagePath });
	}, [trackEvent, pagePath]);
}
