import { FavoritePastries } from "@/components/profile";

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
		<div className="flex flex-col gap-8 px-4 py-6">
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-parchment">
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-sesame"
					>
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				</div>
				<div>
					<p className="font-display text-xl text-espresso">@{username}</p>
					<p className="mt-0.5 text-sm text-sesame">Curious Nibbler</p>
				</div>
				<button
					type="button"
					className="mt-1 inline-flex h-9 items-center justify-center rounded-[14px] bg-brioche px-5 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
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
				<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-16">
					<p className="text-sm text-sesame">Taste profile coming soon</p>
				</div>
			</section>

			{/* Top 5 */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Top 5</h2>
				<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-12">
					<p className="text-sm text-sesame">No top 5 yet</p>
				</div>
			</section>
		</div>
	);
}
