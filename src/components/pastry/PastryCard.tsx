import { TasteMatchPill } from "@/components/ui/TasteMatchPill";
import { Croissant } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PastryCardProps {
	id: string;
	name: string;
	placeName?: string;
	placeId: string;
	category: string;
	showTasteMatch?: boolean;
	photoUrl?: string | null;
}

export function PastryCard({
	id,
	name,
	placeName,
	placeId,
	category,
	showTasteMatch = true,
	photoUrl,
}: PastryCardProps) {
	return (
		<Link
			href={`/place/${placeId}?pastry=${id}`}
			className="flex flex-col gap-2 rounded-card bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
		>
			<div className="relative aspect-square w-full overflow-hidden rounded-input bg-parchment">
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
			{/* Place-first hierarchy */}
			{placeName && <p className="truncate text-sm font-medium text-espresso">{placeName}</p>}
			<p className="truncate text-xs text-sesame">{name}</p>
			<div className="flex items-center justify-between">
				<span className="rounded-chip bg-parchment/60 px-2 py-0.5 text-[11px] font-medium text-sesame">
					{category}
				</span>
				{showTasteMatch && <TasteMatchPill category={category} />}
			</div>
		</Link>
	);
}
