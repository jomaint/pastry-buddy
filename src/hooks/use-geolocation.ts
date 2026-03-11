"use client";

import { useCallback, useEffect, useState } from "react";

type GeoState = {
	latitude: number;
	longitude: number;
	loading: boolean;
	error: string | null;
	/** Whether the user has granted or denied permission */
	prompted: boolean;
};

const DEFAULT: GeoState = {
	latitude: 0,
	longitude: 0,
	loading: false,
	error: null,
	prompted: false,
};

/**
 * Browser geolocation hook. Requests position on mount (if `auto` is true)
 * or on demand via `request()`. Falls back to a default city if denied.
 */
export function useGeolocation(opts?: { auto?: boolean }) {
	const [state, setState] = useState<GeoState>(DEFAULT);

	const request = useCallback(() => {
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setState((s) => ({ ...s, error: "Geolocation not supported", prompted: true }));
			return;
		}

		setState((s) => ({ ...s, loading: true }));

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setState({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					loading: false,
					error: null,
					prompted: true,
				});
			},
			(err) => {
				setState((s) => ({
					...s,
					loading: false,
					error: err.message,
					prompted: true,
				}));
			},
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 10 },
		);
	}, []);

	useEffect(() => {
		if (opts?.auto) request();
	}, [opts?.auto, request]);

	const hasLocation = state.latitude !== 0 || state.longitude !== 0;

	return { ...state, hasLocation, request };
}
