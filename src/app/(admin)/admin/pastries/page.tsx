"use client";

import { useAdminDeletePastry, useAdminPastries, useAdminUpdatePastry } from "@/api/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable } from "@/components/admin/DataTable";
import { Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const LIMIT = 20;

type AdminPastry = {
	id: string;
	name: string;
	category: string;
	avg_rating: number | null;
	total_checkins: number;
	featured: boolean;
	created_at: string;
	places: { name: string };
};

export default function AdminPastriesPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

	const { data, isLoading } = useAdminPastries({
		search: search || undefined,
		page: page - 1,
		limit: LIMIT,
	});

	const updatePastry = useAdminUpdatePastry();
	const deletePastry = useAdminDeletePastry();

	const columns = [
		{
			key: "name",
			label: "Name",
			render: (row: AdminPastry) => <span className="font-medium text-espresso">{row.name}</span>,
		},
		{
			key: "category",
			label: "Category",
			render: (row: AdminPastry) => (
				<span className="rounded-full bg-parchment px-2 py-0.5 text-xs font-medium text-ganache">
					{row.category}
				</span>
			),
		},
		{
			key: "place",
			label: "Place",
			render: (row: AdminPastry) => <span>{row.places?.name ?? "\u2014"}</span>,
		},
		{
			key: "avg_rating",
			label: "Avg Rating",
			render: (row: AdminPastry) => (
				<span className="inline-flex items-center gap-1 tabular-nums">
					{row.avg_rating != null ? row.avg_rating.toFixed(1) : "\u2014"}
					<Star size={12} className="fill-brioche text-brioche" />
				</span>
			),
		},
		{
			key: "total_checkins",
			label: "Check-ins",
			render: (row: AdminPastry) => <span className="tabular-nums">{row.total_checkins}</span>,
		},
		{
			key: "featured",
			label: "Featured",
			render: (row: AdminPastry) => (
				<button
					type="button"
					onClick={() => updatePastry.mutate({ id: row.id, featured: !row.featured })}
					className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
						row.featured
							? "bg-pistachio/10 text-pistachio"
							: "bg-parchment text-sesame hover:bg-parchment/80"
					}`}
				>
					{row.featured ? "Featured" : "No"}
				</button>
			),
		},
	];

	return (
		<div>
			<h1 className="font-display text-2xl text-espresso">Pastries</h1>

			<div className="mt-6">
				<DataTable<AdminPastry>
					columns={columns}
					data={(data?.data ?? []) as AdminPastry[]}
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
								href={`/admin/pastries/${row.id}`}
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
						deletePastry.mutate(deleteTarget, {
							onSuccess: () => setDeleteTarget(null),
						});
					}
				}}
				title="Delete pastry"
				description="This will permanently remove this pastry and all associated check-ins. This action cannot be undone."
				confirmLabel="Delete"
				isLoading={deletePastry.isPending}
			/>
		</div>
	);
}
