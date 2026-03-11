"use client";

import { useAdminDeletePlace, useAdminPlaces } from "@/api/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable } from "@/components/admin/DataTable";
import type { Place } from "@/types/database";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const LIMIT = 20;

export default function AdminPlacesPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

	const { data, isLoading } = useAdminPlaces({
		search: search || undefined,
		page: page - 1,
		limit: LIMIT,
	});

	const deletePlace = useAdminDeletePlace();

	const columns = [
		{
			key: "name",
			label: "Name",
			render: (row: Place) => <span className="font-medium text-espresso">{row.name}</span>,
		},
		{
			key: "city",
			label: "City",
			render: (row: Place) => <span>{row.city ?? "\u2014"}</span>,
		},
		{
			key: "country",
			label: "Country",
			render: (row: Place) => <span>{row.country ?? "\u2014"}</span>,
		},
		{
			key: "created_at",
			label: "Created",
			render: (row: Place) => (
				<span className="text-ganache">{new Date(row.created_at).toLocaleDateString()}</span>
			),
		},
	];

	return (
		<div>
			<h1 className="font-display text-2xl text-espresso">Places</h1>

			<div className="mt-6">
				<DataTable<Place>
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
					searchPlaceholder="Search by name..."
					isLoading={isLoading}
					actions={(row) => (
						<>
							<Link
								href={`/admin/places/${row.id}`}
								className="inline-flex items-center gap-1.5 rounded-[14px] border border-parchment px-3 py-1.5 text-xs font-medium text-ganache transition-colors hover:bg-parchment/60"
							>
								<Pencil size={12} />
								Edit
							</Link>
							<button
								type="button"
								onClick={() => setDeleteTarget(row.id)}
								className="inline-flex items-center gap-1.5 rounded-[14px] border border-raspberry/20 px-3 py-1.5 text-xs font-medium text-raspberry transition-colors hover:bg-raspberry/5"
							>
								<Trash2 size={12} />
								Delete
							</button>
						</>
					)}
				/>
			</div>

			<ConfirmDialog
				open={deleteTarget !== null}
				onClose={() => setDeleteTarget(null)}
				onConfirm={() => {
					if (deleteTarget) {
						deletePlace.mutate(deleteTarget, {
							onSuccess: () => setDeleteTarget(null),
						});
					}
				}}
				title="Delete place"
				description="This will permanently remove this place and may affect associated pastries and check-ins. This action cannot be undone."
				confirmLabel="Delete"
				isLoading={deletePlace.isPending}
			/>
		</div>
	);
}
