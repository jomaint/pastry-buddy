interface StatCardProps {
	label: string;
	value: number | string;
	subtitle?: string;
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
	return (
		<div className="rounded-[16px] bg-flour p-5 shadow-sm">
			<p className="font-display text-2xl text-espresso">{value}</p>
			<p className="text-sm text-sesame">{label}</p>
			{subtitle && <p className="mt-1 text-xs text-sesame/70">{subtitle}</p>}
		</div>
	);
}
