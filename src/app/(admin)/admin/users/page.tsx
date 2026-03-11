"use client";

import { useAdminUpdateProfile, useAdminUsers } from "@/api/admin";
import { DataTable } from "@/components/admin/DataTable";
import type { Profile } from "@/types/database";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const LIMIT = 20;

const roleBadgeClass: Record<string, string> = {
	admin: "bg-raspberry/10 text-raspberry",
	staff: "bg-brioche/10 text-brioche",
	user: "bg-parchment text-sesame",
};

const roleOptions: Profile["role"][] = ["admin", "staff", "user"];

export default function AdminUsersPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	const { data, isLoading } = useAdminUsers({
		search: search || undefined,
		page: page - 1,
		limit: LIMIT,
	});

	const updateProfile = useAdminUpdateProfile();

	const columns = [
		{
			key: "username",
			label: "Username",
			render: (row: Profile) => <span className="font-medium text-espresso">@{row.username}</span>,
		},
		{
			key: "display_name",
			label: "Display Name",
			render: (row: Profile) => <span>{row.display_name ?? "\u2014"}</span>,
		},
		{
			key: "role",
			label: "Role",
			render: (row: Profile) => (
				<span
					className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass[row.role] ?? roleBadgeClass.user}`}
				>
					{row.role}
				</span>
			),
		},
		{
			key: "level",
			label: "Level",
			render: (row: Profile) => <span className="tabular-nums">{row.level}</span>,
		},
		{
			key: "total_checkins",
			label: "Check-ins",
			render: (row: Profile) => <span className="tabular-nums">{row.total_checkins}</span>,
		},
		{
			key: "created_at",
			label: "Joined",
			render: (row: Profile) => (
				<span className="text-ganache">{new Date(row.created_at).toLocaleDateString()}</span>
			),
		},
	];

	return (
		<div>
			<h1 className="font-display text-2xl text-espresso">Users</h1>

			<div className="mt-6">
				<DataTable<Profile>
					columns={columns}
					data={data?.data ?? []}
					totalCount={data?.count ?? 0}
					page={page}
					limit={LIMIT}
					onPageChange={setPage}
					searchValue={search}
					onSearchChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					searchPlaceholder="Search by username..."
					isLoading={isLoading}
					actions={(row) => (
						<>
							{roleOptions
								.filter((r) => r !== row.role)
								.map((role) => (
									<button
										key={role}
										type="button"
										onClick={() => updateProfile.mutate({ id: row.id, role })}
										className="rounded-[14px] border border-parchment px-3 py-1.5 text-xs font-medium text-ganache transition-colors hover:bg-parchment/60"
									>
										Make {role.charAt(0).toUpperCase() + role.slice(1)}
									</button>
								))}
							<Link
								href={`/profile/${row.username}`}
								className="inline-flex items-center gap-1 rounded-[14px] border border-parchment px-3 py-1.5 text-xs font-medium text-ganache transition-colors hover:bg-parchment/60"
							>
								<ExternalLink size={12} />
								View
							</Link>
						</>
					)}
				/>
			</div>
		</div>
	);
}
