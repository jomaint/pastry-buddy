export default function BakeryLoading() {
	return (
		<div className="mx-auto max-w-2xl">
			<div className="aspect-[16/9] w-full animate-pulse bg-parchment" />
			<div className="flex flex-col gap-4 px-4 pt-6">
				<div className="h-7 w-56 animate-pulse rounded bg-parchment" />
				<div className="h-4 w-40 animate-pulse rounded bg-parchment" />
				<div className="mt-4 grid grid-cols-2 gap-3">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="aspect-square animate-pulse rounded-[16px] bg-parchment" />
					))}
				</div>
			</div>
		</div>
	);
}
