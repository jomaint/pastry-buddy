"use client";

import { useAdminCheckIns, useAdminDeleteCheckIn } from "@/api/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable } from "@/components/admin/DataTable";
import { Star, Trash2 } from "lucide-react";
import { useState } from "react";

const LIMIT = 20;

type AdminCheckIn = {
	id: string;
	rating: number;
	notes: string | null;
	created_at: string;
	profiles: { username: string; display_name: string | null };
	pastries: { name: string; category: string };
	places: { name: string; city: string | null };
};

export default function AdminCheckInsPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

	const { data, isLoading } = useAdminCheckIns({
		search: search || undefined,
		page: page - 1,
		limit: LIMIT,
	});

	const deleteCheckIn = useAdminDeleteCheckIn();

	const columns = [
		{
			key: "user",
			label: "User",
			render: (row: AdminCheckIn) => (
				<span className="font-medium text-espresso">@{row.profiles.username}</span>
			),
		},
		{
			key: "pastry",
			label: "Pastry",
			render: (row: AdminCheckIn) => <span>{row.pastries.name}</span>,
		},
		{
			key: "place",
			label: "Place",
			render: (row: AdminCheckIn) => <span>{row.places.name}</span>,
		},
		{
			key: "rating",
			label: "Rating",
			render: (row: AdminCheckIn) => (
				<span className="inline-flex items-center gap-1 tabular-nums">
					{row.rating}
					<Star size={12} className="fill-brioche text-brioche" />
				</span>
			),
		},
		{
			key: "notes",
			label: "Notes",
			render: (row: AdminCheckIn) => (
				<span className="text-ganache">
					{row.notes
						? row.notes.length > 40
							? `${row.notes.slice(0, 40)}...`
							: row.notes
						: "\u2014"}
				</span>
			),
		},
		{
			key: "created_at",
			label: "Date",
			render: (row: AdminCheckIn) => (
				<span className="text-ganache">{new Date(row.created_at).toLocaleDateString()}</span>
			),
		},
	];

	return (
		<div>
			<h1 className="font-display text-2xl text-espresso">Check-ins</h1>

			<div className="mt-6">
				<DataTable<AdminCheckIn>
					columns={columns}
					data={(data?.data ?? []) as AdminCheckIn[]}
					totalCount={data?.count ?? 0}
					page={page}
					limit={LIMIT}
					onPageChange={setPage}
					searchValue={search}
					onSearchChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					searchPlaceholder="Search by notes..."
					isLoading={isLoading}
					actions={(row) => (
						<button
							type="button"
							onClick={() => setDeleteTarget(row.id)}
							className="inline-flex items-center gap-1.5 rounded-[14px] border border-raspberry/20 px-3 py-1.5 text-xs font-medium text-raspberry transition-colors hover:bg-raspberry/5"
						>
							<Trash2 size={12} />
							Delete
						</button>
					)}
				/>
			</div>

			<ConfirmDialog
				open={deleteTarget !== null}
				onClose={() => setDeleteTarget(null)}
				onConfirm={() => {
					if (deleteTarget) {
						deleteCheckIn.mutate(deleteTarget, {
							onSuccess: () => setDeleteTarget(null),
						});
					}
				}}
				title="Delete check-in"
				description="This will permanently remove this check-in. This action cannot be undone."
				confirmLabel="Delete"
				isLoading={deleteCheckIn.isPending}
			/>
		</div>
	);
}
