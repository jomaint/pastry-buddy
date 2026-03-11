"use client";

import { usePlaceCheckIns } from "@/api/check-ins";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { timeAgo } from "@/lib/time-utils";
import { Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function PlaceCheckIns({ placeId }: { placeId: string }) {
	const { data: checkIns, isLoading } = usePlaceCheckIns(placeId, 20);
	const [showAll, setShowAll] = useState(false);

	const visible = showAll ? checkIns : checkIns?.slice(0, 10);

	return (
		<section className="flex flex-col gap-3">
			<h2 className="font-display text-lg text-espresso">Latest Visits</h2>

			{isLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 size={20} className="animate-spin text-sesame" />
				</div>
			) : visible && visible.length > 0 ? (
				<>
					<div className="flex flex-col gap-2">
						{visible.map((ci) => (
							<Link
								key={ci.id}
								href={`/check-in/${ci.id}`}
								className="flex items-start gap-3 rounded-card bg-flour p-4 shadow-sm transition-colors hover:bg-parchment/30"
							>
								<Avatar name={ci.user_display_name || "User"} size="sm" />
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-espresso">
											{ci.user_display_name || `@${ci.user_username}`}
										</span>
										<span className="text-xs text-sesame">{timeAgo(ci.created_at)}</span>
									</div>
									<p className="mt-0.5 text-xs text-sesame">Had the {ci.pastry_name}</p>
									<Rating value={ci.rating} size="sm" readonly className="mt-1" />
									{ci.notes && (
										<p className="mt-1.5 text-sm italic text-ganache line-clamp-2">
											&ldquo;{ci.notes}&rdquo;
										</p>
									)}
									{ci.flavor_tags && ci.flavor_tags.length > 0 && (
										<div className="mt-1.5 flex flex-wrap gap-1">
											{ci.flavor_tags.map((tag: string) => (
												<span
													key={tag}
													className="rounded-chip bg-parchment/60 px-2 py-0.5 text-[11px] text-sesame"
												>
													#{tag}
												</span>
											))}
										</div>
									)}
								</div>
							</Link>
						))}
					</div>
					{!showAll && checkIns && checkIns.length > 10 && (
						<button
							type="button"
							onClick={() => setShowAll(true)}
							className="text-sm font-medium text-brioche transition-colors hover:text-brioche/80"
						>
							See all visits ({checkIns.length})
						</button>
					)}
				</>
			) : (
				<div className="flex flex-col items-center gap-2 rounded-card bg-parchment/50 py-10">
					<p className="max-w-xs text-center text-sm text-sesame">
						This place is waiting for its first review. Grab something and tell us about it.
					</p>
				</div>
			)}
		</section>
	);
}
