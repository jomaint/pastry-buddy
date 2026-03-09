export default async function BakeryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	await params;

	return (
		<div className="flex flex-col gap-6">
			{/* Hero placeholder */}
			<div className="aspect-[16/9] w-full bg-parchment" />

			<div className="flex flex-col gap-6 px-4 pb-8">
				{/* Name & address */}
				<div>
					<h1 className="font-display text-2xl text-espresso">
						Maison Laurent
					</h1>
					<p className="mt-1 text-sm text-sesame">
						123 Rue de la Boulangerie, Paris
					</p>
				</div>

				{/* Map placeholder */}
				<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-16">
					<p className="text-sm text-sesame">Map coming soon</p>
				</div>

				{/* Pastries logged here */}
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-lg text-espresso">
						Pastries logged here
					</h2>
					<div className="grid grid-cols-2 gap-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="flex aspect-square items-center justify-center rounded-[16px] bg-parchment/50"
							>
								<div className="h-8 w-8 rounded-full bg-parchment" />
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
