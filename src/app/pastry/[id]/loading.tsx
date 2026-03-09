export default function PastryLoading() {
	return (
		<div className="mx-auto max-w-2xl">
			<div className="aspect-[4/5] w-full animate-pulse bg-parchment" />
			<div className="flex flex-col gap-4 px-4 pt-6">
				<div className="h-7 w-48 animate-pulse rounded bg-parchment" />
				<div className="h-4 w-32 animate-pulse rounded bg-parchment" />
				<div className="h-4 w-full animate-pulse rounded bg-parchment" />
				<div className="h-4 w-3/4 animate-pulse rounded bg-parchment" />
			</div>
		</div>
	);
}
