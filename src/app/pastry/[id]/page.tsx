import { getBakery, getPastry } from "@/lib/mock-data";
import { Bookmark, Heart, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PastryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const pastry = getPastry(id);

	if (!pastry) return notFound();

	const bakery = getBakery(pastry.bakery_id);

	return (
		<div className="flex flex-col gap-6">
			{/* Hero image placeholder */}
			<div className="relative aspect-[4/5] w-full bg-parchment">
				<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-espresso/40 to-transparent" />
			</div>

			<div className="flex flex-col gap-6 px-4 pb-8">
				{/* Title + bakery */}
				<div>
					<h1 className="font-display text-2xl text-espresso">{pastry.name}</h1>
					{bakery && (
						<Link
							href={`/bakery/${bakery.id}`}
							className="mt-1 inline-block text-sm text-brioche transition-colors hover:text-brioche/80"
						>
							{bakery.name} · {bakery.city}
						</Link>
					)}
				</div>

				{/* Rating + stats */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1">
						{Array.from({ length: 5 }).map((_, i) => (
							<Star
								key={i}
								size={18}
								className={
									i < Math.round(pastry.avg_rating ?? 0)
										? "fill-caramel text-caramel"
										: "text-parchment"
								}
							/>
						))}
					</div>
					<span className="text-sm font-medium text-espresso">{pastry.avg_rating}</span>
					<span className="text-sm text-sesame">{pastry.total_checkins} check-ins</span>
				</div>

				{/* Description */}
				{pastry.description && (
					<p className="text-sm leading-relaxed text-ganache">{pastry.description}</p>
				)}

				{/* Category badge */}
				<div className="flex flex-wrap gap-2">
					<span className="rounded-full bg-brioche/10 px-3 py-1.5 text-xs font-medium text-brioche">
						{pastry.category}
					</span>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<button
						type="button"
						className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-brioche py-3 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
					>
						<Heart size={16} />
						Crave
					</button>
					<button
						type="button"
						className="flex items-center justify-center gap-2 rounded-[14px] bg-parchment px-5 py-3 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80"
					>
						<Bookmark size={16} />
						Save
					</button>
				</div>

				{/* Friends who tried this */}
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-lg text-espresso">Friends who tried this</h2>
					<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-10">
						<p className="text-sm text-sesame">No friends have tried this yet</p>
					</div>
				</section>
			</div>
		</div>
	);
}
