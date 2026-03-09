import { InlineRating } from "@/components/ui/InlineRating";
import { TasteMatchPill } from "@/components/ui/TasteMatchPill";
import { Croissant } from "lucide-react";
import Link from "next/link";

interface PastryCardProps {
	id: string;
	name: string;
	bakeryName?: string;
	category: string;
	avgRating: number | null;
	totalCheckins?: number;
	showTasteMatch?: boolean;
}

export function PastryCard({
	id,
	name,
	bakeryName,
	category,
	avgRating,
	totalCheckins,
	showTasteMatch = true,
}: PastryCardProps) {
	return (
		<Link
			href={`/pastry/${id}`}
			className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
		>
			<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
				<Croissant size={28} className="text-brioche/30" />
			</div>
			<p className="truncate text-sm font-medium text-espresso">{name}</p>
			{bakeryName && <p className="truncate text-xs text-sesame">{bakeryName}</p>}
			<div className="flex items-center justify-between">
				<InlineRating value={avgRating} count={totalCheckins} />
				{showTasteMatch && <TasteMatchPill category={category} />}
			</div>
		</Link>
	);
}
