import { getBakery, getPastriesByBakery } from "@/lib/mock-data";
import { ExternalLink, MapPin, Star, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BakeryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const bakery = getBakery(id);

	if (!bakery) return notFound();

	const pastries = getPastriesByBakery(bakery.id);

	return (
		<div className="mx-auto max-w-2xl">
			{/* Hero placeholder */}
			<div className="relative aspect-[16/9] w-full bg-parchment">
				<div className="absolute inset-0 flex items-center justify-center">
					<Store size={48} className="text-sesame/40" />
				</div>
				<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-espresso/30 to-transparent" />
			</div>

			<div className="flex flex-col gap-6 px-4 pb-8 pt-6">
				{/* Name & address */}
				<div>
					<h1 className="font-display text-2xl text-espresso">{bakery.name}</h1>
					<div className="mt-1.5 flex items-center gap-1.5 text-sm text-sesame">
						<MapPin size={14} />
						<span>
							{bakery.address}, {bakery.city}
						</span>
					</div>
				</div>

				{/* Quick actions */}
				<div className="flex gap-3">
					<a
						href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bakery.name} ${bakery.address} ${bakery.city}`)}`}
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-brioche py-3 text-sm font-medium text-flour transition-colors hover:bg-brioche/90 active:bg-brioche/80"
					>
						<ExternalLink size={16} />
						Get Directions
					</a>
				</div>

				{/* Pastries logged here */}
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-lg text-espresso">
						Pastries logged here
						<span className="ml-2 text-sm font-normal text-sesame">{pastries.length}</span>
					</h2>
					{pastries.length > 0 ? (
						<div className="grid grid-cols-2 gap-3">
							{pastries.map((pastry) => (
								<Link
									key={pastry.id}
									href={`/pastry/${pastry.id}`}
									className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-shadow hover:shadow-md"
								>
									<div className="aspect-square w-full rounded-[12px] bg-parchment" />
									<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
									<p className="text-xs text-sesame">{pastry.category}</p>
									{pastry.avg_rating && (
										<div className="flex items-center gap-1">
											<Star size={12} className="fill-caramel text-caramel" />
											<span className="text-xs font-medium text-espresso">{pastry.avg_rating}</span>
											<span className="text-xs text-sesame">· {pastry.total_checkins}</span>
										</div>
									)}
								</Link>
							))}
						</div>
					) : (
						<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-10">
							<p className="text-sm text-sesame">No pastries logged yet. Be the first!</p>
						</div>
					)}
				</section>

				{/* Map placeholder */}
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-lg text-espresso">Location</h2>
					<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-16">
						<div className="flex flex-col items-center gap-2">
							<MapPin size={24} className="text-sesame" />
							<p className="text-sm text-sesame">Map coming soon</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
