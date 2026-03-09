"use client";

import { usePastryCheckIns } from "@/api/check-ins";
import { Rating } from "@/components/ui/Rating";
import { Loader2, MessageSquare, User } from "lucide-react";
import Link from "next/link";

function timeAgo(dateStr: string): string {
	const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString();
}

export function PastryCheckIns({ pastryId }: { pastryId: string }) {
	const { data: checkIns, isLoading } = usePastryCheckIns(pastryId);

	return (
		<section className="flex flex-col gap-3">
			<h2 className="font-display text-lg text-espresso">Recent check-ins</h2>
			{isLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 size={20} className="animate-spin text-sesame" />
				</div>
			) : checkIns && checkIns.length > 0 ? (
				<div className="flex flex-col gap-2">
					{checkIns.slice(0, 10).map((ci) => (
						<Link
							key={ci.id}
							href={`/check-in/${ci.id}`}
							className="flex items-start gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-colors hover:bg-parchment/40"
						>
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-parchment">
								<User size={14} className="text-sesame" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-espresso">@{ci.user_username}</span>
									<span className="text-xs text-sesame">{timeAgo(ci.created_at)}</span>
								</div>
								<Rating value={ci.rating} size="sm" readonly className="mt-1" />
								{ci.notes && <p className="mt-1.5 text-sm text-ganache line-clamp-2">{ci.notes}</p>}
								{ci.flavor_tags && ci.flavor_tags.length > 0 && (
									<div className="mt-1.5 flex flex-wrap gap-1">
										{ci.flavor_tags.map((tag: string) => (
											<span
												key={tag}
												className="rounded-full bg-parchment/60 px-2 py-0.5 text-xs text-sesame"
											>
												{tag}
											</span>
										))}
									</div>
								)}
							</div>
						</Link>
					))}
				</div>
			) : (
				<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-10">
					<div className="flex flex-col items-center gap-2">
						<MessageSquare size={20} className="text-sesame" />
						<p className="text-sm text-sesame">No check-ins yet. Be the first!</p>
					</div>
				</div>
			)}
		</section>
	);
}
