import Link from "next/link";

export default async function CheckInDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	await params;

	return (
		<div className="flex flex-col gap-6">
			{/* Hero photo placeholder */}
			<div className="aspect-square w-full bg-parchment" />

			<div className="flex flex-col gap-6 px-4 pb-8">
				{/* User who checked in */}
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-parchment">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							className="text-sesame"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
					</div>
					<div>
						<Link
							href="/profile/baker_jane"
							className="text-sm font-medium text-espresso hover:text-brioche transition-colors"
						>
							@baker_jane
						</Link>
						<p className="text-xs text-sesame">2 hours ago</p>
					</div>
				</div>

				{/* Pastry info */}
				<div>
					<h1 className="font-display text-2xl text-espresso">
						Pain au Chocolat
					</h1>
					<Link
						href="/bakery/1"
						className="mt-1 text-sm text-brioche transition-colors hover:text-brioche/80"
					>
						Boulangerie Moderne
					</Link>
				</div>

				{/* Rating */}
				<div className="flex items-center gap-1">
					{Array.from({ length: 5 }).map((_, i) => (
						<svg
							key={i}
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill={i < 4 ? "currentColor" : "none"}
							stroke="currentColor"
							strokeWidth="1.5"
							className={i < 4 ? "text-caramel" : "text-parchment"}
						>
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					))}
				</div>

				{/* Notes */}
				<p className="text-sm leading-relaxed text-ganache">
					Perfectly flaky with a rich chocolate center. The layers were
					beautifully laminated and it had just the right amount of sweetness.
				</p>

				{/* Crave button */}
				<button
					type="button"
					className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[14px] bg-parchment px-5 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
					>
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
					</svg>
					Crave
				</button>
			</div>
		</div>
	);
}
