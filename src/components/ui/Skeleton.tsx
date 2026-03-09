import clsx from "clsx";

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
	return <div className={clsx("animate-pulse rounded-[12px] bg-parchment/60", className)} />;
}

export function FeedCardSkeleton() {
	return (
		<div className="flex flex-col gap-3 rounded-[16px] bg-flour p-4 shadow-sm">
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-1.5">
					<Skeleton className="h-3.5 w-24" />
					<Skeleton className="h-3 w-16" />
				</div>
			</div>
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-3 w-1/2" />
			<div className="flex gap-1.5">
				<Skeleton className="h-6 w-16 rounded-full" />
				<Skeleton className="h-6 w-14 rounded-full" />
				<Skeleton className="h-6 w-18 rounded-full" />
			</div>
		</div>
	);
}

export function PastryCardSkeleton() {
	return (
		<div className="flex flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm">
			<Skeleton className="aspect-square w-full rounded-[12px]" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-3 w-1/2" />
		</div>
	);
}

export function ListCardSkeleton() {
	return (
		<div className="flex items-center gap-3 rounded-[16px] bg-flour p-4 shadow-sm">
			<Skeleton className="h-10 w-10 rounded-[12px]" />
			<div className="flex-1 space-y-1.5">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-48" />
			</div>
			<Skeleton className="h-4 w-4 rounded" />
		</div>
	);
}

export function ProfileSkeleton() {
	return (
		<div className="flex flex-col items-center gap-3">
			<Skeleton className="h-20 w-20 rounded-full" />
			<Skeleton className="h-5 w-32" />
			<Skeleton className="h-3 w-24" />
		</div>
	);
}

export function StatsSkeleton() {
	return (
		<div className="flex items-center justify-center gap-0 rounded-[16px] bg-parchment/60 py-4">
			{[1, 2, 3, 4].map((i) => (
				<div key={i} className="flex flex-1 flex-col items-center gap-1.5">
					<Skeleton className="h-7 w-8" />
					<Skeleton className="h-3 w-12" />
				</div>
			))}
		</div>
	);
}
