"use client";

import { useAdminStats } from "@/api/admin";
import { StatCard } from "@/components/admin/StatCard";

export default function AdminDashboard() {
	const { data: stats, isLoading } = useAdminStats();

	return (
		<div>
			<h1 className="font-display text-2xl text-espresso">Dashboard</h1>

			<div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
				{isLoading ? (
					Array.from({ length: 8 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
						<div key={i} className="rounded-[16px] bg-flour p-5 shadow-sm">
							<div className="h-7 w-16 animate-pulse rounded bg-parchment" />
							<div className="mt-2 h-4 w-24 animate-pulse rounded bg-parchment" />
						</div>
					))
				) : (
					<>
						<StatCard label="Total Users" value={stats?.total_users ?? 0} />
						<StatCard label="Total Check-ins" value={stats?.total_checkins ?? 0} />
						<StatCard label="Total Pastries" value={stats?.total_pastries ?? 0} />
						<StatCard label="Total Places" value={stats?.total_places ?? 0} />
						<StatCard
							label="New Users Today"
							value={stats?.users_today ?? 0}
							subtitle="Since midnight"
						/>
						<StatCard
							label="Check-ins Today"
							value={stats?.checkins_today ?? 0}
							subtitle="Since midnight"
						/>
						<StatCard
							label="Check-ins This Week"
							value={stats?.checkins_this_week ?? 0}
							subtitle="Last 7 days"
						/>
						<StatCard
							label="Check-ins This Month"
							value={stats?.checkins_this_month ?? 0}
							subtitle="Last 30 days"
						/>
					</>
				)}
			</div>
		</div>
	);
}
