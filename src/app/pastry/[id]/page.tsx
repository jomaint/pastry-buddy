import Link from "next/link";

export default async function PastryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<div className="flex flex-col gap-6">
			{/* Hero image placeholder */}
			<div className="aspect-[4/5] w-full bg-parchment" />

			<div className="flex flex-col gap-6 px-4 pb-8">
				{/* Title */}
				<div>
					<h1 className="font-display text-2xl text-espresso">
						Almond Croissant
					</h1>
					<Link
						href={`/bakery/${id}`}
						className="mt-1 text-sm text-brioche transition-colors hover:text-brioche/80"
					>
						Maison Laurent
					</Link>
				</div>

				{/* Rating */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1">
						{Array.from({ length: 5 }).map((_, i) => (
							<svg
								key={i}
								width="18"
								height="18"
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
					<span className="text-sm text-sesame">4.0 avg</span>
				</div>

				{/* Tags */}
				<div className="flex flex-wrap gap-2">
					{["Flaky", "Buttery", "Almond", "Sweet"].map((tag) => (
						<span
							key={tag}
							className="rounded-full bg-parchment px-3 py-1.5 text-xs font-medium text-ganache"
						>
							{tag}
						</span>
					))}
				</div>

				{/* Friends who tried this */}
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-lg text-espresso">
						Friends who tried this
					</h2>
					<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-10">
						<p className="text-sm text-sesame">
							No friends have tried this yet
						</p>
					</div>
				</section>
			</div>
		</div>
	);
}
