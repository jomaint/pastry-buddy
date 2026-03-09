import { FavoritePastries } from "@/components/profile";
import { ChartBar, Trophy, User } from "lucide-react";

const stats = [
	{ label: "Logged", value: 12 },
	{ label: "Bakeries", value: 5 },
	{ label: "Streak", value: 3 },
];

// Placeholder — will come from Supabase once wired
const mockFavorites = ["Croissants", "Tarts", "Cakes"];

export default async function PublicProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6">
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-parchment">
					<User size={28} className="text-sesame" />
				</div>
				<div>
					<p className="font-display text-xl text-espresso">@{username}</p>
					<p className="mt-0.5 text-sm text-sesame">Curious Nibbler</p>
				</div>
				<button
					type="button"
					className="mt-1 inline-flex h-9 items-center justify-center rounded-[14px] bg-brioche px-5 text-sm font-medium text-flour transition-colors hover:bg-brioche/90 active:bg-brioche/80"
				>
					Follow
				</button>
			</div>

			{/* Stats */}
			<div className="flex items-center justify-center gap-0 rounded-[16px] bg-parchment/60 py-4">
				{stats.map((stat, i) => (
					<div
						key={stat.label}
						className={`flex flex-1 flex-col items-center gap-0.5 ${
							i < stats.length - 1 ? "border-r border-parchment" : ""
						}`}
					>
						<span className="font-display text-2xl text-espresso">{stat.value}</span>
						<span className="text-xs text-sesame">{stat.label}</span>
					</div>
				))}
			</div>

			{/* Favorite Pastries (read-only on public profiles) */}
			<FavoritePastries favorites={mockFavorites} />

			{/* Taste Profile */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Taste Profile</h2>
				<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
					<ChartBar size={24} className="text-sesame" />
					<p className="text-sm text-sesame">Taste profile coming soon</p>
				</div>
			</section>

			{/* Top 5 */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Top 5</h2>
				<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
					<Trophy size={24} className="text-sesame" />
					<p className="text-sm text-sesame">No top 5 yet</p>
				</div>
			</section>
		</div>
	);
}
