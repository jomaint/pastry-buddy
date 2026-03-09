import { Heart, Star, User } from "lucide-react";
import Link from "next/link";

export default async function CheckInDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	await params;

	return (
		<div className="mx-auto max-w-2xl">
			{/* Hero photo placeholder */}
			<div className="relative aspect-square w-full bg-parchment">
				<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-espresso/40 to-transparent" />
			</div>

			<div className="flex flex-col gap-6 px-4 pb-8 pt-6">
				{/* User who checked in */}
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-parchment">
						<User size={16} className="text-sesame" />
					</div>
					<div>
						<Link
							href="/profile/baker_jane"
							className="text-sm font-medium text-espresso transition-colors hover:text-brioche"
						>
							@baker_jane
						</Link>
						<p className="text-xs text-sesame">2 hours ago</p>
					</div>
				</div>

				{/* Pastry info */}
				<div>
					<h1 className="font-display text-2xl text-espresso">Pain au Chocolat</h1>
					<Link
						href="/bakery/1"
						className="mt-1 inline-block text-sm text-brioche transition-colors hover:text-brioche/80"
					>
						Boulangerie Moderne
					</Link>
				</div>

				{/* Rating */}
				<div className="flex items-center gap-1">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							key={i}
							size={20}
							className={i < 4 ? "fill-caramel text-caramel" : "text-parchment"}
						/>
					))}
				</div>

				{/* Notes */}
				<p className="text-sm leading-relaxed text-ganache">
					Perfectly flaky with a rich chocolate center. The layers were beautifully laminated and it
					had just the right amount of sweetness.
				</p>

				{/* Crave button */}
				<button
					type="button"
					className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[14px] bg-parchment px-5 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80"
				>
					<Heart size={16} />
					Crave
				</button>
			</div>
		</div>
	);
}
