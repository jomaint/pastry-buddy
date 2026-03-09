interface Stat {
	label: string;
	value: number;
}

interface StatsGridProps {
	stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
	return (
		<div className="flex items-center justify-center gap-0 rounded-[16px] bg-parchment/60 py-4">
			{stats.map((stat, i) => (
				<div
					key={stat.label}
					className={`flex flex-1 flex-col items-center gap-0.5 ${
						i < stats.length - 1 ? "border-r border-parchment" : ""
					}`}
				>
					<span className="font-display text-2xl text-espresso tabular-nums">{stat.value}</span>
					<span className="text-xs text-sesame">{stat.label}</span>
				</div>
			))}
		</div>
	);
}
