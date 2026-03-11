import { InlineRating } from "@/components/ui/InlineRating";
import { TasteMatchPill } from "@/components/ui/TasteMatchPill";
import { Croissant } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PastryCardProps {
	id: string;
	name: string;
	placeName?: string;
	category: string;
	avgRating: number | null;
	totalCheckins?: number;
	showTasteMatch?: boolean;
	photoUrl?: string | null;
}

export function PastryCard({
	id,
	name,
	placeName,
	category,
	avgRating,
	totalCheckins,
	showTasteMatch = true,
	photoUrl,
}: PastryCardProps) {
	return (
		<Link
			href={`/pastry/${id}`}
			className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
		>
			<div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-parchment">
				{photoUrl ? (
					<Image
						src={photoUrl}
						alt={name}
						fill
						sizes="(max-width: 768px) 50vw, 33vw"
						className="object-cover"
					/>
				) : (
					<div className="flex h-full items-center justify-center">
						<Croissant size={28} className="text-brioche/30" />
					</div>
				)}
			</div>
			<p className="truncate text-sm font-medium text-espresso">{name}</p>
			{placeName && <p className="truncate text-xs text-sesame">{placeName}</p>}
			<div className="flex items-center justify-between">
				<InlineRating value={avgRating} count={totalCheckins} />
				{showTasteMatch && <TasteMatchPill category={category} />}
			</div>
		</Link>
	);
}
