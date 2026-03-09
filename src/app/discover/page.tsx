"use client";

const categories = [
	"Croissants",
	"Cookies",
	"Cakes",
	"Tarts",
	"Bread",
	"Donuts",
];

const sections = [
	{ title: "Trending Near You", subtitle: "Popular pastries in your area" },
	{ title: "Based on Your Taste", subtitle: "Curated just for you" },
	{ title: "Friends Loved", subtitle: "What your circle is raving about" },
];

export default function DiscoverPage() {
	return (
		<div className="flex flex-col gap-8 px-4 py-6">
			<h1 className="font-display text-3xl text-espresso">Discover</h1>

			{/* Search bar */}
			<div>
				<input
					type="text"
					placeholder="Search pastries, bakeries, or flavors…"
					className="h-11 w-full rounded-[12px] border border-parchment bg-flour px-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/30"
				/>
			</div>

			{/* Category pills */}
			<div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
				{categories.map((category) => (
					<button
						key={category}
						type="button"
						className="shrink-0 rounded-full bg-parchment px-4 py-2 text-sm font-medium text-ganache transition-colors hover:bg-brioche/10 hover:text-brioche"
					>
						{category}
					</button>
				))}
			</div>

			{/* Sections */}
			{sections.map((section) => (
				<section key={section.title} className="flex flex-col gap-3">
					<div>
						<h2 className="font-display text-xl text-espresso">
							{section.title}
						</h2>
						<p className="mt-0.5 text-xs text-sesame">{section.subtitle}</p>
					</div>
					<div className="flex items-center justify-center rounded-[16px] bg-parchment/50 py-12">
						<p className="text-sm text-sesame">Coming soon</p>
					</div>
				</section>
			))}
		</div>
	);
}
