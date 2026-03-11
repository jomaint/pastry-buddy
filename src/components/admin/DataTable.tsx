"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface Column<T> {
	key: string;
	label: string;
	render?: (row: T) => React.ReactNode;
	className?: string;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	totalCount?: number;
	page?: number;
	limit?: number;
	onPageChange?: (page: number) => void;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	searchPlaceholder?: string;
	isLoading?: boolean;
	actions?: (row: T) => React.ReactNode;
}

// biome-ignore lint/suspicious/noExplicitAny: generic table rows need flexible typing
export function DataTable<T extends Record<string, any>>({
	columns,
	data,
	totalCount,
	page = 1,
	limit = 20,
	onPageChange,
	searchValue,
	onSearchChange,
	searchPlaceholder = "Search...",
	isLoading = false,
	actions,
}: DataTableProps<T>) {
	const [localSearch, setLocalSearch] = useState(searchValue ?? "");
	const debouncedSearch = useDebounce(localSearch, 300);

	useEffect(() => {
		if (onSearchChange && debouncedSearch !== searchValue) {
			onSearchChange(debouncedSearch);
		}
	}, [debouncedSearch, onSearchChange, searchValue]);

	// Sync external searchValue changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only sync when searchValue prop changes externally
	useEffect(() => {
		if (searchValue !== undefined && searchValue !== localSearch) {
			setLocalSearch(searchValue);
		}
	}, [searchValue]);

	const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / limit)) : 1;
	const allColumns = actions
		? [...columns, { key: "__actions", label: "", className: "w-12" }]
		: columns;

	return (
		<div className="rounded-[16px] bg-flour shadow-sm">
			{/* Search */}
			{onSearchChange && (
				<div className="border-b border-parchment p-4">
					<div className="relative">
						<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sesame" />
						<input
							type="text"
							value={localSearch}
							onChange={(e) => setLocalSearch(e.target.value)}
							placeholder={searchPlaceholder}
							className="h-10 w-full rounded-[12px] border border-parchment bg-flour pl-9 pr-3 text-sm text-espresso placeholder:text-sesame focus:border-brioche focus:outline-none"
						/>
					</div>
				</div>
			)}

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr>
							{allColumns.map((col) => (
								<th
									key={col.key}
									className={`border-b border-parchment px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-sesame ${col.className ?? ""}`}
								>
									{col.label}
								</th>
							))}
						</tr>
					</thead>

					<tbody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
								<tr key={`skeleton-${i}`}>
									{allColumns.map((col) => (
										<td key={col.key} className="border-b border-parchment/50 px-4 py-3">
											<div className="h-4 w-2/3 animate-pulse rounded bg-parchment" />
										</td>
									))}
								</tr>
							))
						) : data.length === 0 ? (
							<tr>
								<td
									colSpan={allColumns.length}
									className="px-4 py-12 text-center text-sm text-sesame"
								>
									No results found.
								</td>
							</tr>
						) : (
							data.map((row, rowIdx) => (
								<tr
									key={(row.id as string) ?? rowIdx}
									className="transition-colors hover:bg-parchment/30"
								>
									{columns.map((col) => (
										<td
											key={col.key}
											className={`border-b border-parchment/50 px-4 py-3 text-espresso ${col.className ?? ""}`}
										>
											{col.render
												? col.render(row)
												: ((row[col.key] as React.ReactNode) ?? "\u2014")}
										</td>
									))}
									{actions && (
										<td className="border-b border-parchment/50 px-4 py-3">{actions(row)}</td>
									)}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{onPageChange && totalCount != null && (
				<div className="flex items-center justify-between border-t border-parchment px-4 py-3">
					<span className="text-xs text-sesame">
						Page {page} of {totalPages}
					</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => onPageChange(page - 1)}
							disabled={page <= 1}
							className="inline-flex items-center gap-1 rounded-[14px] bg-parchment px-4 py-2 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80 disabled:cursor-not-allowed disabled:opacity-40"
						>
							<ChevronLeft size={14} />
							Previous
						</button>
						<button
							type="button"
							onClick={() => onPageChange(page + 1)}
							disabled={page >= totalPages}
							className="inline-flex items-center gap-1 rounded-[14px] bg-parchment px-4 py-2 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Next
							<ChevronRight size={14} />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
