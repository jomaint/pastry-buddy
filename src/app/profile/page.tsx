"use client";

import { FavoritePastries } from "@/components/profile";
import { Award, ChartBar, Trophy, User } from "lucide-react";
import { useState } from "react";

const stats = [
	{ label: "Logged", value: 0 },
	{ label: "Bakeries", value: 0 },
	{ label: "Streak", value: 0 },
];

export default function ProfilePage() {
	const [favorites, setFavorites] = useState<string[]>([]);

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6">
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-parchment">
					<User size={28} className="text-sesame" />
				</div>
				<div>
					<p className="font-display text-xl text-espresso">@pastry_lover</p>
					<p className="mt-0.5 text-sm text-sesame">Curious Nibbler</p>
				</div>
			</div>

			{/* Stats */}
			<div className="flex items-center justify-center gap-0 rounded-[16px] bg-parchment/60 py-4">
				{stats.map((stat, i) => (
					<div
						key={stat.label}
						className={`flex flex-1 flex-col items-center gap-0.5 ${
							i < stats.length - 1 ? "border-r border-parchment" : ""
						}`}
					>
						<span className="font-display text-2xl text-espresso">{stat.value}</span>
						<span className="text-xs text-sesame">{stat.label}</span>
					</div>
				))}
			</div>

			{/* Favorite Pastries */}
			<FavoritePastries favorites={favorites} editable onSave={setFavorites} />

			{/* Taste Profile */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Taste Profile</h2>
				<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
					<ChartBar size={24} className="text-sesame" />
					<p className="text-sm text-sesame">Log more pastries to build your taste profile</p>
				</div>
			</section>

			{/* Badges */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Badges</h2>
				<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
					<Award size={24} className="text-sesame" />
					<p className="text-sm text-sesame">Start logging to earn your first badge</p>
				</div>
			</section>

			{/* Top 5 */}
			<section className="flex flex-col gap-3">
				<h2 className="font-display text-xl text-espresso">Top 5</h2>
				<div className="flex flex-col items-center gap-2 rounded-[16px] bg-parchment/50 py-12">
					<Trophy size={24} className="text-sesame" />
					<p className="text-sm text-sesame">Rate pastries to build your top 5</p>
				</div>
			</section>
		</div>
	);
}
