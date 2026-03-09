"use client";

import Link from "next/link";

export default function PastryError({ reset }: { reset: () => void }) {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
			<h1 className="font-display text-xl text-espresso">Could not load pastry</h1>
			<p className="text-sm text-sesame">Something went wrong fetching this pastry.</p>
			<div className="flex gap-3">
				<button
					type="button"
					onClick={reset}
					className="rounded-[14px] bg-brioche px-5 py-2.5 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
				>
					Try again
				</button>
				<Link
					href="/discover"
					className="rounded-[14px] bg-parchment px-5 py-2.5 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80"
				>
					Browse pastries
				</Link>
			</div>
		</div>
	);
}
