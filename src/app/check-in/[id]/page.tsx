"use client";

import { useCheckIn } from "@/api/check-ins";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { PageTransition } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { Camera, Heart, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function CheckInDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { data: checkin, isLoading, error } = useCheckIn(id);

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
					<button
						type="button"
						className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-parchment px-5 text-sm font-medium text-espresso transition-colors duration-150 hover:bg-parchment/80"
					>
						<Heart size={16} />
						Crave
					</button>
					<Link
						href={`/pastry/${checkin.pastry_id}`}
						className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-brioche/10 px-5 text-sm font-medium text-brioche transition-colors duration-150 hover:bg-brioche/20"
					>
						View Pastry
					</Link>
				</div>
			</div>
		</PageTransition>
	);
}
