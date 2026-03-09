import { Star } from "lucide-react";

interface InlineRatingProps {
	value: number | null;
	count?: number;
}

export function InlineRating({ value, count }: InlineRatingProps) {
	if (!value) return null;

	return (
		<div className="flex items-center gap-1">
			<Star size={12} className="fill-caramel text-caramel" />
			<span className="text-xs font-medium text-espresso tabular-nums">{value}</span>
			{count != null && <span className="text-xs text-sesame tabular-nums">· {count}</span>}
		</div>
	);
}
