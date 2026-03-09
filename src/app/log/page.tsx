"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";

const steps = [
	{ number: 1, label: "Select" },
	{ number: 2, label: "Rate" },
	{ number: 3, label: "Post" },
];

export default function LogPage() {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6">
			<h1 className="font-display text-3xl text-espresso">Log a Pastry</h1>

			{/* Step indicator */}
			<div className="flex items-center justify-center">
				{steps.map((step, i) => (
					<div key={step.number} className="flex items-center">
						<div className="flex items-center gap-2">
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
									i === 0 ? "bg-brioche text-flour" : "bg-parchment text-sesame"
								}`}
							>
								{step.number}
							</div>
							<span className={`text-sm font-medium ${i === 0 ? "text-espresso" : "text-sesame"}`}>
								{step.label}
							</span>
						</div>
						{i < steps.length - 1 && <div className="mx-3 h-px w-8 bg-parchment" />}
					</div>
				))}
			</div>

			{/* Search input */}
			<div className="flex flex-col gap-3">
				<label htmlFor="pastry-search" className="text-sm font-medium text-espresso">
					Find a pastry or bakery
				</label>
				<input
					id="pastry-search"
					type="text"
					placeholder="Search by name, type, or bakery…"
					className="h-11 w-full rounded-[12px] border border-parchment bg-flour px-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/30"
				/>
			</div>

			{/* Or add new */}
			<div className="text-center">
				<Link
					href="/log"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-brioche transition-colors hover:text-brioche/80"
				>
					<Plus size={14} />
					Add something new
				</Link>
			</div>

			{/* Placeholder for results */}
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-parchment">
					<Search size={20} className="text-sesame" />
				</div>
				<p className="text-sm text-sesame">Start typing to find your pastry</p>
			</div>
		</div>
	);
}
