"use client";

import { useLeaderboard, useUserRank } from "@/api/leaderboards";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";

const RANK_STYLES = [
	{ bg: "bg-caramel/15", text: "text-caramel", label: "1st" },
	{ bg: "bg-sesame/15", text: "text-sesame", label: "2nd" },
	{ bg: "bg-brioche/15", text: "text-brioche", label: "3rd" },
];

interface MiniLeaderboardProps {
	userId: string;
}

export function MiniLeaderboard({ userId }: MiniLeaderboardProps) {
	const { data: entries } = useLeaderboard("friends", 3);
	const { data: userRank } = useUserRank(userId);

	if (!entries || entries.length === 0) return null;

	const selfInTop3 = entries.some((e) => e.is_self);

	return (
		<div className="rounded-[16px] bg-flour p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Trophy size={16} className="text-brioche" />
					<p className="font-display text-base text-espresso">Friends This Week</p>
				</div>
				<Link
					href="/leaderboard"
					className="flex items-center gap-0.5 text-xs font-medium text-brioche transition-colors hover:text-brioche/80"
				>
					See all
					<ChevronRight size={12} />
				</Link>
			</div>

			{/* Top 3 */}
			<div className="flex flex-col gap-1.5">
				{entries.map((entry, i) => {
					const style = RANK_STYLES[i];
					return (
						<div
							key={entry.user_id}
							className={`flex items-center gap-3 rounded-[12px] px-3 py-2 ${
								entry.is_self ? "bg-brioche/5 ring-1 ring-brioche/20" : "bg-parchment/40"
							}`}
						>
							<span
								className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style?.bg ?? "bg-parchment"} ${style?.text ?? "text-sesame"}`}
							>
								{i + 1}
							</span>
							<Avatar name={entry.display_name || entry.username} size="sm" />
							<div className="flex-1 min-w-0">
								<p
									className={`text-sm truncate ${entry.is_self ? "font-semibold text-espresso" : "text-espresso"}`}
								>
									{entry.is_self ? "You" : entry.display_name || `@${entry.username}`}
								</p>
							</div>
							<span className="text-xs font-medium text-sesame tabular-nums">
								{entry.checkin_count} {entry.checkin_count === 1 ? "check-in" : "check-ins"}
							</span>
						</div>
					);
				})}
			</div>

			{/* User's rank if not in top 3 */}
			{!selfInTop3 && userRank && userRank.weekly_rank > 0 && (
				<div className="mt-2 flex items-center gap-2 rounded-[12px] bg-brioche/5 px-3 py-2 ring-1 ring-brioche/20">
					<span className="text-xs font-medium text-brioche">
						You&apos;re #{userRank.weekly_rank}
					</span>
					<span className="text-xs text-sesame">
						· {userRank.weekly_checkins} check-in{userRank.weekly_checkins !== 1 ? "s" : ""} · Top{" "}
						{userRank.percentile}%
					</span>
				</div>
			)}
		</div>
	);
}
