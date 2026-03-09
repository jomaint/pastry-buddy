"use client";

import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Unhandled error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-parchment">
				<span className="text-2xl">😔</span>
			</div>
			<h1 className="font-display text-xl text-espresso">Something went wrong</h1>
			<p className="max-w-sm text-center text-sm text-sesame">
				We hit an unexpected error. Please try again.
			</p>
			<button
				type="button"
				onClick={reset}
				className="rounded-[14px] bg-brioche px-6 py-2.5 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
			>
				Try again
			</button>
		</div>
	);
}
