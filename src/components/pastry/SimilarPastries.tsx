"use client";

import { useSimilarPastries } from "@/api/recommendations";
import { Croissant, Star } from "lucide-react";
import Link from "next/link";

export function SimilarPastries({ pastryId }: { pastryId: string }) {
	const { data: similar } = useSimilarPastries(pastryId, 4);

	if (!similar || similar.length === 0) return null;

	return (
		<section className="flex flex-col gap-3">
			<h2 className="font-display text-lg text-espresso">You might also like</h2>
			<div className="grid grid-cols-2 gap-3">
				{similar.map((pastry) => (
					<Link
						key={pastry.pastry_id}
						href={`/pastry/${pastry.pastry_id}`}
						className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98]"
					>
						<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
							<Croissant size={24} className="text-brioche/30" />
						</div>
						<p className="truncate text-sm font-medium text-espresso">{pastry.pastry_name}</p>
						<p className="truncate text-xs text-sesame">
							{pastry.place_name} · {pastry.place_city}
						</p>
						{pastry.avg_rating && (
							<div className="flex items-center gap-1">
								<Star size={11} className="fill-caramel text-caramel" />
								<span className="text-xs font-medium text-espresso tabular-nums">
									{pastry.avg_rating}
								</span>
							</div>
						)}
					</Link>
				))}
			</div>
		</section>
	);
}
