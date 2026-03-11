"use client";

import { useTrackEvent } from "@/hooks/use-track-event";
import { useEffect } from "react";

type Props = {
	event: "pastry_viewed" | "place_viewed" | "page_view";
	properties?: Record<string, unknown>;
};

export function PageViewTracker({ event, properties }: Props) {
	const trackEvent = useTrackEvent();

	// biome-ignore lint/correctness/useExhaustiveDependencies: fire once on mount — event/properties are static per render
	useEffect(() => {
		trackEvent(event, { properties });
	}, [trackEvent, event]);

	return null;
}
