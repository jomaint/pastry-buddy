import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { BakeryMap } from "@/components/ui/Map";
import { createClient } from "@/lib/supabase/server";
import type { Bakery, Pastry } from "@/types/database";
import { Croissant, ExternalLink, MapPin, Star, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const supabase = await createClient();
	const { data: bakery } = await supabase
		.from("bakeries")
		.select("name, city, address")
		.eq("id", id)
		.single();

	if (!bakery) return { title: "Bakery not found" };

	const b = bakery as { name: string; city: string | null; address: string | null };
	return {
		title: b.name,
		description: `${b.name} in ${b.city ?? "unknown"} — discover their pastries on Pastry Buddy`,
		openGraph: {
			title: `${b.name} | Pastry Buddy`,
			description: `${b.address ?? ""}, ${b.city ?? ""}`.trim(),
		},
	};
}

export default async function BakeryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();

	const { data: bakery, error: bErr } = await supabase
		.from("bakeries")
		.select("*")
		.eq("id", id)
		.single();

	if (bErr) {
		if (bErr.code === "PGRST116") return notFound(); // row not found
		throw new Error(`Failed to load bakery: ${bErr.message}`);
	}
	if (!bakery) return notFound();

	const { data: pastries } = await supabase
		.from("pastries")
		.select("*")
		.eq("bakery_id", id)
		.order("total_checkins", { ascending: false });

	const typedBakery = bakery as Bakery;
	const typedPastries = (pastries ?? []) as Pastry[];

	return (
		<div className="mx-auto max-w-2xl lg:max-w-5xl">
			<PageViewTracker
				event="bakery_viewed"
				properties={{ bakery_id: typedBakery.id, bakery_name: typedBakery.name }}
			/>
			<div className="lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-8 lg:p-6">
				{/* Hero placeholder */}
				<div className="relative aspect-[16/9] w-full bg-parchment lg:aspect-[4/3] lg:rounded-[16px] lg:overflow-hidden lg:sticky lg:top-24 lg:self-start">
					<div className="absolute inset-0 flex items-center justify-center">
						<Store size={48} className="text-sesame/40" />
					</div>
					<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-espresso/30 to-transparent lg:hidden" />
				</div>

				<div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-0 lg:pt-0">
					{/* Name & address */}
					<div>
						<h1 className="font-display text-2xl text-espresso lg:text-3xl">{typedBakery.name}</h1>
						<div className="mt-1.5 flex items-center gap-1.5 text-sm text-sesame">
							<MapPin size={14} />
							<span>
								{typedBakery.address}, {typedBakery.city}
							</span>
						</div>
					</div>

					{/* Quick actions */}
					<div className="flex gap-3">
						<a
							href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${typedBakery.name} ${typedBakery.address} ${typedBakery.city}`)}`}
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
							<span className="ml-2 text-sm font-normal text-sesame">{typedPastries.length}</span>
						</h2>
						{typedPastries.length > 0 ? (
							<div className="grid grid-cols-2 gap-3">
								{typedPastries.map((pastry) => (
									<Link
										key={pastry.id}
										href={`/pastry/${pastry.id}`}
										className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-shadow hover:shadow-md"
									>
										<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
											<Croissant size={28} className="text-brioche/30" />
										</div>
										<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
										<p className="text-xs text-sesame">{pastry.category}</p>
										{pastry.avg_rating && (
											<div className="flex items-center gap-1">
												<Star size={12} className="fill-caramel text-caramel" />
												<span className="text-xs font-medium text-espresso">
													{pastry.avg_rating}
												</span>
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

					{/* Map */}
					<section className="flex flex-col gap-3">
						<h2 className="font-display text-lg text-espresso">Location</h2>
						{typedBakery.latitude && typedBakery.longitude ? (
							<BakeryMap
								lat={typedBakery.latitude}
								lng={typedBakery.longitude}
								name={typedBakery.name}
							/>
						) : (
							<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-16">
								<div className="flex flex-col items-center gap-2">
									<MapPin size={24} className="text-sesame" />
									<p className="text-sm text-sesame">Location not available</p>
								</div>
							</div>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}
