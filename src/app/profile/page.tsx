const stats = [
	{ label: "Logged", value: 0 },
	{ label: "Bakeries", value: 0 },
	{ label: "Streak", value: 0 },
];

export default function ProfilePage() {
	return (
		<div className="flex flex-col gap-8 px-4 py-6">
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				{/* Avatar */}
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
					<p className="font-display text-xl text-espresso">@pastry_lover</p>
					<p className="mt-0.5 text-sm text-sesame">Curious Nibbler</p>
				</div>
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
						<span className="font-display text-2xl text-espresso">
							{stat.value}
						</span>
						<span className="text-xs text-sesame">{stat.label}</span>
					</div>
				))}
			</div>

			{/* Taste Profile */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Taste Profile</h2>
				<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-16">
					<p className="text-sm text-sesame">
						Log more pastries to build your taste profile
					</p>
				</div>
			</section>

			{/* Badges */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Badges</h2>
				<div className="grid grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="flex aspect-square items-center justify-center rounded-[12px] bg-parchment/50"
						>
							<div className="h-6 w-6 rounded-full bg-parchment" />
						</div>
					))}
				</div>
			</section>

			{/* Top 5 */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Top 5</h2>
				<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-12">
					<p className="text-sm text-sesame">
						Rate pastries to build your top 5
					</p>
				</div>
			</section>
		</div>
	);
}
