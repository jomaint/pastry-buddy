"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const tabs = ["Pastries", "Bakeries"] as const;

export default function ListsPage() {
	const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Pastries");

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
			<h1 className="font-display text-3xl text-espresso">Your Lists</h1>

			{/* Segment tabs */}
			<div className="flex border-b border-parchment">
				{tabs.map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setActiveTab(tab)}
						className={`relative px-4 pb-3 text-sm font-medium transition-colors ${
							activeTab === tab ? "text-espresso" : "text-sesame hover:text-ganache"
						}`}
					>
						{tab}
						{activeTab === tab && (
							<span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brioche" />
						)}
					</button>
				))}
			</div>

			{/* Empty state */}
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-parchment">
					<Bookmark size={20} className="text-sesame" />
				</div>
				<p className="font-display text-xl text-espresso">Your want-to-try list is empty</p>
				<p className="mt-2 max-w-xs text-sm leading-relaxed text-sesame">
					Save pastries and bakeries you want to visit
				</p>
				<Link
					href="/discover"
					className="mt-6 inline-flex h-10 items-center justify-center rounded-[14px] bg-parchment px-5 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80"
				>
					Explore pastries
				</Link>
			</div>
		</div>
	);
}
