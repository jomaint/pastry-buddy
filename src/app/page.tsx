import Link from "next/link";

export default function FeedPage() {
	return (
		<div className="flex flex-col gap-8 px-4 py-6">
			{/* Trending row placeholder */}
			<section className="rounded-[16px] bg-parchment/50 px-4 py-3">
				<p className="text-xs font-medium tracking-wide text-sesame uppercase">
					Trending today
				</p>
				<p className="mt-1 text-sm text-ganache">
					Check back soon for trending pastries near you
				</p>
			</section>

			{/* Empty state */}
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<h1 className="font-display text-3xl text-espresso">Your Feed</h1>
				<p className="mt-3 max-w-xs text-sm leading-relaxed text-sesame">
					Follow friends and log your first pastry to see check-ins here
				</p>
				<Link
					href="/log"
					className="mt-8 inline-flex h-12 items-center justify-center rounded-[14px] bg-brioche px-6 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
				>
					Log Your First Pastry
				</Link>
			</div>
		</div>
	);
}
