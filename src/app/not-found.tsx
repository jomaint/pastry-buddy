import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-parchment">
				<span className="text-2xl">🥐</span>
			</div>
			<h1 className="font-display text-xl text-espresso">Page not found</h1>
			<p className="max-w-sm text-center text-sm text-sesame">
				This pastry seems to have gone missing from the display case.
			</p>
			<Link
				href="/"
				className="rounded-[14px] bg-brioche px-6 py-2.5 text-sm font-medium text-flour transition-colors hover:bg-brioche/90"
			>
				Back to home
			</Link>
		</div>
	);
}
