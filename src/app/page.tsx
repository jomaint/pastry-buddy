import { MOCK_CHECKINS, getBakery, getTrendingPastries } from "@/lib/mock-data";
import { Camera, Croissant, MapPin, Star } from "lucide-react";
import Link from "next/link";

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const hours = Math.floor(diff / 3600000);
	if (hours < 1) return "just now";
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function FeedPage() {
	const trending = getTrendingPastries(6);

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
			{/* Trending row */}
			<section>
				<p className="mb-3 text-xs font-medium uppercase tracking-wide text-sesame">
					Trending in California
				</p>
				<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
					{trending.map((pastry) => {
						const bakery = getBakery(pastry.bakery_id);
						return (
							<Link
								key={pastry.id}
								href={`/pastry/${pastry.id}`}
								className="flex w-40 shrink-0 flex-col gap-2 rounded-[16px] bg-parchment/60 p-3 transition-colors hover:bg-parchment"
							>
								<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
									<Croissant size={28} className="text-brioche/30" />
								</div>
								<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
								<p className="truncate text-xs text-sesame">{bakery?.name}</p>
								<div className="flex items-center gap-1">
									<Star size={12} className="fill-caramel text-caramel" />
									<span className="text-xs font-medium text-espresso">{pastry.avg_rating}</span>
									<span className="text-xs text-sesame">· {pastry.total_checkins}</span>
								</div>
							</Link>
						);
					})}
				</div>
			</section>

			{/* Feed */}
			<section className="flex flex-col gap-4">
				<h1 className="font-display text-2xl text-espresso">Your Feed</h1>
				{MOCK_CHECKINS.map((checkin) => (
					<Link
						key={checkin.id}
						href={`/check-in/${checkin.id}`}
						className="flex flex-col gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-shadow hover:shadow-md"
					>
						{/* User row */}
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment text-xs font-medium text-ganache">
								{checkin.user.display_name
									?.split(" ")
									.map((n) => n[0])
									.join("")}
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold text-espresso">{checkin.user.display_name}</p>
								<p className="text-xs text-sesame">
									@{checkin.user.username} · {timeAgo(checkin.created_at)}
								</p>
							</div>
							<div className="flex items-center gap-0.5">
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										size={14}
										className={i < checkin.rating ? "fill-caramel text-caramel" : "text-parchment"}
									/>
								))}
							</div>
						</div>

						{/* Photo placeholder */}
						<div className="flex aspect-[4/5] w-full items-center justify-center rounded-[12px] bg-parchment">
							<Camera size={32} className="text-brioche/25" />
						</div>

						{/* Content */}
						<div>
							<p className="font-display text-lg text-espresso">{checkin.pastry.name}</p>
							<div className="mt-0.5 flex items-center gap-1 text-xs text-sesame">
								<MapPin size={12} />
								<span>{checkin.bakery.name}</span>
								<span>· {checkin.bakery.city}</span>
							</div>
						</div>

						{checkin.notes && (
							<p className="text-sm italic leading-relaxed text-ganache">
								&ldquo;{checkin.notes}&rdquo;
							</p>
						)}

						{/* Tags */}
						{checkin.flavor_tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{checkin.flavor_tags.map((tag) => (
									<span
										key={tag}
										className="rounded-full bg-brioche/10 px-2.5 py-0.5 text-xs font-medium text-brioche"
									>
										{tag}
									</span>
								))}
							</div>
						)}
					</Link>
				))}
			</section>
		</div>
	);
}
