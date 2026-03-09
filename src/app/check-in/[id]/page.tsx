"use client";

import { useCheckIn } from "@/api/check-ins";
import { CommentSection } from "@/components/social/CommentSection";
import { LikeButton } from "@/components/social/LikeButton";
import { ShareButton } from "@/components/social/ShareButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { PageTransition } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { useTrackEvent } from "@/hooks/use-track-event";
import { timeAgo } from "@/lib/time-utils";
import { Camera, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect } from "react";

export default function CheckInDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { data: checkin, isLoading, error } = useCheckIn(id);
	const trackEvent = useTrackEvent();

	useEffect(() => {
		if (checkin) {
			trackEvent("page_view", { properties: { check_in_id: id }, pagePath: `/check-in/${id}` });
		}
		// eslint-disable-next-line -- track once when checkin loads; id/trackEvent are stable
	}, [checkin, id, trackEvent]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 size={24} className="animate-spin text-sesame" />
			</div>
		);
	}

	if (error || !checkin) return notFound();

	return (
		<PageTransition className="mx-auto max-w-2xl">
			{/* Hero photo placeholder */}
			<div className="relative aspect-[4/5] w-full bg-parchment">
				<div className="absolute inset-0 flex items-center justify-center">
					<Camera size={48} className="text-sesame/30" />
				</div>
				<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-espresso/40 to-transparent" />
			</div>

			<div className="flex flex-col gap-6 px-4 pb-8 pt-6">
				{/* User who checked in */}
				<div className="flex items-center gap-3">
					<Avatar name={checkin.user_display_name || "User"} size="md" />
					<div className="flex-1">
						<p className="text-sm font-semibold text-espresso">{checkin.user_display_name}</p>
						<p className="text-xs text-sesame">
							@{checkin.user_username} · {timeAgo(checkin.created_at)}
						</p>
					</div>
				</div>

				{/* Pastry info */}
				<div>
					<Link
						href={`/pastry/${checkin.pastry_id}`}
						className="font-display text-2xl text-espresso transition-colors duration-150 hover:text-brioche"
					>
						{checkin.pastry_name}
					</Link>
					<div className="mt-1.5 flex items-center gap-1.5">
						<MapPin size={14} className="text-sesame" />
						<Link
							href={`/bakery/${checkin.bakery_id}`}
							className="text-sm text-brioche transition-colors duration-150 hover:text-brioche/80"
						>
							{checkin.bakery_name}
						</Link>
						<span className="text-sm text-sesame">· {checkin.bakery_city}</span>
					</div>
				</div>

				{/* Rating */}
				<div className="flex items-center gap-2">
					<Rating value={checkin.rating} size="md" readonly />
					<span className="text-sm font-medium text-espresso tabular-nums">{checkin.rating}/5</span>
				</div>

				{/* Notes */}
				{checkin.notes && (
					<p className="text-sm italic leading-relaxed text-ganache">
						&ldquo;{checkin.notes}&rdquo;
					</p>
				)}

				{/* Tags */}
				{checkin.flavor_tags && checkin.flavor_tags.length > 0 && (
					<div className="flex flex-col gap-2">
						<p className="text-xs font-medium uppercase tracking-wide text-sesame">Flavor Tags</p>
						<div className="flex flex-wrap gap-1.5">
							{checkin.flavor_tags.map((tag) => (
								<Badge key={tag} variant="brioche">
									{tag}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Category badge */}
				<div className="flex flex-wrap gap-2">
					<Badge>{checkin.pastry_category}</Badge>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<LikeButton checkInId={id} />
					<ShareButton checkInId={id} pastryName={checkin.pastry_name} />
					<Link
						href={`/pastry/${checkin.pastry_id}`}
						className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-brioche/10 px-5 text-sm font-medium text-brioche transition-colors duration-150 hover:bg-brioche/20"
					>
						View Pastry
					</Link>
				</div>

				{/* Comments */}
				<div className="border-t border-parchment pt-6">
					<CommentSection checkInId={id} />
				</div>
			</div>
		</PageTransition>
	);
}
