import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { PastryCheckIns } from "@/components/pastry/PastryCheckIns";
import { SaveToListButton } from "@/components/pastry/SaveToListButton";
import { SimilarPastries } from "@/components/pastry/SimilarPastries";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { createClient } from "@/lib/supabase/server";
import type { Bakery, Pastry } from "@/types/database";
import { Heart, UtensilsCrossed } from "lucide-react";
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
	const { data: pastry } = await supabase
		.from("pastries")
		.select("name, category, description, avg_rating")
		.eq("id", id)
		.single();

	if (!pastry) return { title: "Pastry not found" };

	const p = pastry as {
		name: string;
		category: string;
		description: string | null;
		avg_rating: number | null;
	};
	return {
		title: p.name,
		description: p.description ?? `${p.name} — a ${p.category} pastry on Pastry Buddy`,
		openGraph: {
			title: `${p.name} | Pastry Buddy`,
			description: p.description ?? `Rated ${p.avg_rating ?? "N/A"}/5 — ${p.category}`,
		},
	};
}

export default async function PastryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();

	const { data: pastry, error: pErr } = await supabase
		.from("pastries")
		.select("*")
		.eq("id", id)
		.single();

	if (pErr) {
		if (pErr.code === "PGRST116") return notFound();
		throw new Error(`Failed to load pastry: ${pErr.message}`);
	}
	if (!pastry) return notFound();

	const { data: bakery } = await supabase
		.from("bakeries")
		.select("*")
		.eq("id", (pastry as Pastry).bakery_id)
		.single();

	const typedPastry = pastry as Pastry;
	const typedBakery = bakery as Bakery | null;

	return (
		<div className="mx-auto max-w-2xl lg:max-w-5xl">
			<PageViewTracker
				event="pastry_viewed"
				properties={{ pastry_id: typedPastry.id, pastry_name: typedPastry.name }}
			/>
			<div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:p-6">
				{/* Hero image placeholder */}
				<div className="relative aspect-[4/5] w-full bg-parchment lg:aspect-square lg:rounded-[16px] lg:overflow-hidden lg:sticky lg:top-24 lg:self-start">
					<div className="absolute inset-0 flex items-center justify-center">
						<UtensilsCrossed size={48} className="text-sesame/40" />
					</div>
					<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-espresso/40 to-transparent lg:hidden" />
				</div>

				<div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-0 lg:pt-0">
					{/* Title + bakery */}
					<div>
						<h1 className="font-display text-2xl text-espresso lg:text-3xl">{typedPastry.name}</h1>
						{typedBakery && (
							<Link
								href={`/bakery/${typedBakery.id}`}
								className="mt-1 inline-block text-sm text-brioche transition-colors hover:text-brioche/80"
							>
								{typedBakery.name} · {typedBakery.city}
							</Link>
						)}
					</div>

					{/* Rating + stats */}
					<div className="flex items-center gap-4">
						<Rating value={Math.round(typedPastry.avg_rating ?? 0)} size="md" readonly />
						<span className="text-sm font-medium text-espresso tabular-nums">
							{typedPastry.avg_rating}
						</span>
						<span className="text-sm text-sesame tabular-nums">
							{typedPastry.total_checkins} check-ins
						</span>
					</div>

					{/* Description */}
					{typedPastry.description && (
						<p className="text-sm leading-relaxed text-ganache">{typedPastry.description}</p>
					)}

					{/* Category badge */}
					<div className="flex flex-wrap gap-2">
						<Badge variant="brioche">{typedPastry.category}</Badge>
					</div>

					{/* Actions */}
					<div className="flex gap-3">
						<Link
							href={`/log?pastry=${typedPastry.id}&bakery=${typedPastry.bakery_id}`}
							className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-brioche py-3 text-sm font-medium text-flour transition-colors hover:bg-brioche/90 active:bg-brioche/80"
						>
							<Heart size={16} />
							Log this pastry
						</Link>
						<SaveToListButton pastryId={typedPastry.id} />
					</div>

					{/* Recent check-ins */}
					<PastryCheckIns pastryId={typedPastry.id} />

					{/* Similar pastries */}
					<SimilarPastries pastryId={typedPastry.id} />
				</div>
			</div>
		</div>
	);
}
