"use client";

import {
	type AdminMapPlace,
	useAdminAllPlaces,
	useAdminDeletePlace,
	useAdminPlaces,
} from "@/api/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable } from "@/components/admin/DataTable";
import { type MapBounds, PlacesMap } from "@/components/admin/PlacesMap";
import { useDebounce } from "@/hooks/use-debounce";
import type { Place } from "@/types/database";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertTriangle,
	ArrowDownAZ,
	ArrowDownWideNarrow,
	Clock,
	Croissant,
	ExternalLink,
	List,
	Map as MapIcon,
	MapPin,
	Navigation,
	Pencil,
	Search,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TABLE_LIMIT = 20;

type ViewMode = "split" | "map" | "table";
type SortMode = "name" | "checkins" | "recent";

function usePersistedState<T extends string>(key: string, defaultValue: T): [T, (v: T) => void] {
	const [value, setValue] = useState<T>(() => {
		if (typeof window === "undefined") return defaultValue;
		return (localStorage.getItem(key) as T) ?? defaultValue;
	});

	const set = useCallback(
		(v: T) => {
			setValue(v);
			localStorage.setItem(key, v);
		},
		[key],
	);

	return [value, set];
}

export default function AdminPlacesPage() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);
	const [page, setPage] = useState(1);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [viewMode, setViewMode] = usePersistedState<ViewMode>("admin-places-view", "split");
	const [sortMode, setSortMode] = usePersistedState<SortMode>("admin-places-sort", "checkins");
	const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

	const searchParam = debouncedSearch || undefined;

	// Full paginated query for table-only mode
	const { data: tableData, isLoading: tableLoading } = useAdminPlaces({
		search: searchParam,
		page: page - 1,
		limit: TABLE_LIMIT,
	});

	// All places for map + viewport list
	const { data: allPlaces } = useAdminAllPlaces(searchParam);

	const deletePlace = useAdminDeletePlace();

	const mappablePlaces = useMemo(
		() => (allPlaces ?? []).filter((p) => p.latitude != null && p.longitude != null),
		[allPlaces],
	);

	// Places visible in the current map viewport
	const viewportPlaces = useMemo(() => {
		if (!mapBounds) return mappablePlaces;
		return mappablePlaces.filter((p) => {
			const lat = p.latitude ?? 0;
			const lng = p.longitude ?? 0;
			return (
				lat >= mapBounds.south &&
				lat <= mapBounds.north &&
				lng >= mapBounds.west &&
				lng <= mapBounds.east
			);
		});
	}, [mappablePlaces, mapBounds]);

	// Sort viewport places
	const sortedViewportPlaces = useMemo(() => {
		const sorted = [...viewportPlaces];
		switch (sortMode) {
			case "checkins":
				sorted.sort((a, b) => b.checkin_count - a.checkin_count);
				break;
			case "recent":
				sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
				break;
			default:
				sorted.sort((a, b) => a.name.localeCompare(b.name));
		}
		return sorted;
	}, [viewportPlaces, sortMode]);

	const handleBoundsChange = useCallback((bounds: MapBounds) => {
		setMapBounds(bounds);
	}, []);

	// Bidirectional sync: fly map to selected place from list
	const selectedPlace = useMemo(
		() => (allPlaces ?? []).find((p) => p.id === selectedPlaceId) ?? null,
		[allPlaces, selectedPlaceId],
	);

	const totalPlaces = allPlaces?.length ?? 0;
	const withCoords = mappablePlaces.length;
	const withoutCoords = totalPlaces - withCoords;

	const showMap = viewMode === "split" || viewMode === "map";
	const showSidebarList = viewMode === "split";
	const showTable = viewMode === "table";

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-4 pb-4">
				<div>
					<h1 className="font-display text-2xl text-espresso">Places</h1>
					<div className="mt-1 flex items-center gap-3 text-xs text-sesame">
						<span className="inline-flex items-center gap-1">
							<MapPin size={11} />
							{totalPlaces} total
						</span>
						<span className="inline-flex items-center gap-1 text-pistachio">
							{withCoords} mapped
						</span>
						{withoutCoords > 0 && (
							<span className="inline-flex items-center gap-1 text-raspberry/70">
								<AlertTriangle size={10} />
								{withoutCoords} missing coords
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* Search */}
					<div className="relative">
						<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sesame" />
						<input
							type="text"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search places..."
							className="h-9 w-56 rounded-[12px] border border-parchment bg-flour pl-8 pr-3 text-sm text-espresso placeholder:text-sesame focus:border-brioche focus:outline-none"
						/>
					</div>

					{/* View toggle */}
					<div className="flex rounded-[12px] border border-parchment p-0.5">
						<ViewToggle
							icon={<LayoutSplitIcon />}
							active={viewMode === "split"}
							onClick={() => setViewMode("split")}
							label="Split view"
						/>
						<ViewToggle
							icon={<MapIcon size={14} />}
							active={viewMode === "map"}
							onClick={() => setViewMode("map")}
							label="Map view"
						/>
						<ViewToggle
							icon={<List size={14} />}
							active={viewMode === "table"}
							onClick={() => setViewMode("table")}
							label="Table view"
						/>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex min-h-0 flex-1 gap-0">
				{/* Map */}
				{showMap && (
					<div
						className={`overflow-hidden ${
							viewMode === "map"
								? "h-[calc(100vh-180px)] w-full rounded-[16px] border border-parchment"
								: "h-[calc(100vh-180px)] flex-[3] rounded-l-[16px] border border-parchment"
						}`}
					>
						<PlacesMap
							places={mappablePlaces}
							selectedId={selectedPlaceId}
							flyToLat={selectedPlace?.latitude}
							flyToLng={selectedPlace?.longitude}
							onSelect={(place) => setSelectedPlaceId(place.id)}
							onBoundsChange={handleBoundsChange}
						/>
					</div>
				)}

				{/* Viewport-synced sidebar list (split mode) */}
				{showSidebarList && (
					<ViewportList
						places={sortedViewportPlaces}
						allPlaces={allPlaces ?? []}
						selectedId={selectedPlaceId}
						onSelect={setSelectedPlaceId}
						onDelete={setDeleteTarget}
						withoutCoords={withoutCoords}
						sortMode={sortMode}
						onSortChange={setSortMode}
					/>
				)}

				{/* Full data table (table mode) */}
				{showTable && (
					<div className="w-full">
						<DataTable<Place>
							columns={tableColumns}
							data={tableData?.data ?? []}
							totalCount={tableData?.count ?? 0}
							page={page}
							limit={TABLE_LIMIT}
							onPageChange={setPage}
							isLoading={tableLoading}
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
				)}
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

// ---------------------------------------------------------------------------
// Viewport sidebar list — lightweight, scrollable, synced to map bounds
// ---------------------------------------------------------------------------

function ViewportList({
	places,
	allPlaces,
	selectedId,
	onSelect,
	onDelete,
	withoutCoords,
	sortMode,
	onSortChange,
}: {
	places: AdminMapPlace[];
	allPlaces: AdminMapPlace[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	onDelete: (id: string) => void;
	withoutCoords: number;
	sortMode: SortMode;
	onSortChange: (mode: SortMode) => void;
}) {
	const listRef = useRef<HTMLDivElement>(null);
	const selectedRef = useRef<HTMLButtonElement>(null);

	// Auto-scroll to selected item
	useEffect(() => {
		if (selectedId && selectedRef.current) {
			selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	}, [selectedId]);

	// Places without coords that can't appear on the map
	const unmappedPlaces = useMemo(
		() => allPlaces.filter((p) => p.latitude == null || p.longitude == null),
		[allPlaces],
	);

	const [showUnmapped, setShowUnmapped] = useState(false);

	return (
		<div className="flex h-[calc(100vh-180px)] w-[340px] shrink-0 flex-col rounded-r-[16px] border border-l-0 border-parchment bg-flour">
			{/* List header */}
			<div className="flex items-center justify-between border-b border-parchment px-4 py-3">
				<div>
					<span className="text-sm font-medium text-espresso">{places.length} in view</span>
					<span className="ml-1.5 text-xs text-sesame">of {allPlaces.length}</span>
				</div>
				<div className="flex items-center gap-1">
					{/* Sort controls */}
					<SortButton
						icon={<ArrowDownWideNarrow size={12} />}
						active={sortMode === "checkins"}
						onClick={() => onSortChange("checkins")}
						label="Sort by check-ins"
					/>
					<SortButton
						icon={<ArrowDownAZ size={12} />}
						active={sortMode === "name"}
						onClick={() => onSortChange("name")}
						label="Sort A-Z"
					/>
					<SortButton
						icon={<Clock size={12} />}
						active={sortMode === "recent"}
						onClick={() => onSortChange("recent")}
						label="Sort by newest"
					/>
					{/* Unmapped toggle */}
					{withoutCoords > 0 && (
						<>
							<div className="mx-1 h-4 w-px bg-parchment" />
							<button
								type="button"
								onClick={() => setShowUnmapped((v) => !v)}
								className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs transition-colors ${
									showUnmapped
										? "bg-raspberry/10 font-medium text-raspberry"
										: "text-sesame hover:bg-parchment/60 hover:text-espresso"
								}`}
							>
								<AlertTriangle size={10} />
								{withoutCoords}
							</button>
						</>
					)}
				</div>
			</div>

			{/* Scrollable list */}
			<div ref={listRef} className="flex-1 overflow-y-auto">
				{showUnmapped && unmappedPlaces.length > 0 && (
					<div className="border-b border-parchment bg-raspberry/[0.03] px-4 py-2">
						<p className="mb-2 text-xs font-medium uppercase tracking-wider text-raspberry/70">
							Missing coordinates
						</p>
						{unmappedPlaces.map((place) => (
							<PlaceRow
								key={place.id}
								place={place}
								isSelected={selectedId === place.id}
								onSelect={onSelect}
								onDelete={onDelete}
								showWarning
							/>
						))}
					</div>
				)}

				{places.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
						<MapPin size={24} className="mb-2 text-parchment" />
						<p className="text-sm font-medium text-espresso">No places in this area</p>
						<p className="mt-1 text-xs leading-relaxed text-sesame">
							This could be a good area to expand into.
							<br />
							Zoom out or pan to see places.
						</p>
					</div>
				) : (
					places.map((place) => {
						const isSelected = selectedId === place.id;
						return (
							<div key={place.id}>
								<PlaceRow
									ref={isSelected ? selectedRef : undefined}
									place={place}
									isSelected={isSelected}
									onSelect={onSelect}
									onDelete={onDelete}
								/>
								<AnimatePresence>
									{isSelected && (
										<PlaceDetailPanel
											place={place}
											onClose={() => onSelect(null)}
											onDelete={onDelete}
										/>
									)}
								</AnimatePresence>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Individual place row in the sidebar
// ---------------------------------------------------------------------------

import { forwardRef } from "react";

const PlaceRow = forwardRef<
	HTMLButtonElement,
	{
		place: AdminMapPlace;
		isSelected: boolean;
		onSelect: (id: string | null) => void;
		onDelete: (id: string) => void;
		showWarning?: boolean;
	}
>(function PlaceRow({ place, isSelected, onSelect, onDelete, showWarning }, ref) {
	const missingFields: string[] = [];
	if (!place.address) missingFields.push("address");
	if (!place.city) missingFields.push("city");
	if (place.latitude == null) missingFields.push("coords");

	return (
		<button
			ref={ref}
			type="button"
			onClick={() => onSelect(isSelected ? null : place.id)}
			className={`group flex w-full cursor-pointer items-start gap-3 border-b border-parchment/50 px-4 py-3 text-left transition-colors ${
				isSelected ? "bg-brioche/8" : "hover:bg-parchment/30"
			}`}
		>
			{/* Marker dot */}
			<div
				className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
					showWarning
						? "bg-raspberry/50"
						: isSelected
							? "bg-espresso ring-2 ring-brioche"
							: "bg-brioche"
				}`}
			/>

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-espresso">{place.name}</p>
				<p className="truncate text-xs text-sesame">
					{[place.city, place.country].filter(Boolean).join(", ") || "No location info"}
				</p>

				{/* Activity + quality row */}
				<div className="mt-1 flex items-center gap-2">
					{(place.pastry_count > 0 || place.checkin_count > 0) && (
						<span className="text-[10px] tabular-nums text-sesame">
							{place.pastry_count} {place.pastry_count === 1 ? "item" : "items"} &middot;{" "}
							{place.checkin_count} {place.checkin_count === 1 ? "check-in" : "check-ins"}
						</span>
					)}
					{place.pastry_count === 0 && place.checkin_count === 0 && (
						<span className="text-[10px] text-raspberry/50">No activity</span>
					)}
					{missingFields.length > 0 &&
						missingFields.map((field) => (
							<span
								key={field}
								className="inline-flex rounded-[6px] bg-raspberry/8 px-1.5 py-0.5 text-[10px] font-medium text-raspberry/70"
							>
								no {field}
							</span>
						))}
				</div>
			</div>
			<div
				className={`flex shrink-0 items-center gap-1 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
			>
				<Link
					href={`/admin/places/${place.id}`}
					onClick={(e) => e.stopPropagation()}
					className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-sesame transition-colors hover:bg-parchment hover:text-espresso"
					title="Edit"
				>
					<Pencil size={11} />
				</Link>
				<Link
					href={`/place/${place.slug ?? place.id}`}
					onClick={(e) => e.stopPropagation()}
					className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-sesame transition-colors hover:bg-parchment hover:text-espresso"
					title="View on site"
				>
					<ExternalLink size={11} />
				</Link>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(place.id);
					}}
					className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-sesame transition-colors hover:bg-raspberry/10 hover:text-raspberry"
					title="Delete"
				>
					<Trash2 size={11} />
				</button>
			</div>
		</button>
	);
});

// ---------------------------------------------------------------------------
// Inline detail panel — slides open below the selected row
// ---------------------------------------------------------------------------

function PlaceDetailPanel({
	place,
	onClose,
	onDelete,
}: {
	place: AdminMapPlace;
	onClose: () => void;
	onDelete: (id: string) => void;
}) {
	const missingFields: string[] = [];
	if (!place.address) missingFields.push("Address");
	if (!place.city) missingFields.push("City");
	if (!place.country) missingFields.push("Country");
	if (place.latitude == null) missingFields.push("Latitude");
	if (place.longitude == null) missingFields.push("Longitude");
	if (!place.google_place_id) missingFields.push("Google Place ID");

	const completedFields = 6 - missingFields.length;

	return (
		<motion.div
			initial={{ height: 0, opacity: 0 }}
			animate={{ height: "auto", opacity: 1 }}
			exit={{ height: 0, opacity: 0 }}
			transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
			className="overflow-hidden"
		>
			<div className="border-b border-brioche/20 bg-creme/50 px-4 py-4">
				{/* Header */}
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<h3 className="truncate font-display text-base text-espresso">{place.name}</h3>
						{place.address && (
							<p className="mt-0.5 truncate text-xs text-sesame">{place.address}</p>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-sesame transition-colors hover:bg-parchment hover:text-espresso"
					>
						<X size={12} />
					</button>
				</div>

				{/* Stats row */}
				<div className="mt-3 flex gap-3">
					<DetailStat icon={<Croissant size={12} />} value={place.pastry_count} label="pastries" />
					<DetailStat icon={<MapPin size={12} />} value={place.checkin_count} label="check-ins" />
					<DetailStat
						icon={<Navigation size={12} />}
						value={
							place.latitude != null
								? `${place.latitude.toFixed(4)}, ${place.longitude?.toFixed(4)}`
								: "\u2014"
						}
						label="coords"
						mono
					/>
				</div>

				{/* Data quality */}
				<div className="mt-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-medium text-ganache">Data completeness</span>
						<span className="font-mono text-[11px] tabular-nums text-sesame">
							{completedFields}/6
						</span>
					</div>
					<div className="mt-1.5 flex gap-1">
						{Array.from({ length: 6 }, (_, i) => (
							<div
								key={`seg-${place.id}-${i}`}
								className={`h-1 flex-1 rounded-full ${
									i < completedFields ? "bg-pistachio/60" : "bg-raspberry/20"
								}`}
							/>
						))}
					</div>
					{missingFields.length > 0 && (
						<p className="mt-1.5 text-[10px] text-raspberry/60">
							Missing: {missingFields.join(", ")}
						</p>
					)}
				</div>

				{/* Location info */}
				{(place.city || place.country) && (
					<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ganache">
						{place.city && (
							<span>
								<span className="text-sesame">City </span>
								{place.city}
							</span>
						)}
						{place.country && (
							<span>
								<span className="text-sesame">Country </span>
								{place.country}
							</span>
						)}
					</div>
				)}

				{/* Timestamps */}
				<p className="mt-3 font-mono text-[10px] tabular-nums text-sesame/70">
					Created{" "}
					{new Date(place.created_at).toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})}
				</p>

				{/* Actions */}
				<div className="mt-3 flex items-center gap-2">
					<Link
						href={`/admin/places/${place.id}`}
						className="inline-flex h-8 items-center gap-1.5 rounded-[12px] bg-espresso px-3 text-xs font-medium text-flour transition-colors hover:bg-espresso/90"
					>
						<Pencil size={11} />
						Edit place
					</Link>
					<Link
						href={`/place/${place.slug ?? place.id}`}
						target="_blank"
						className="inline-flex h-8 items-center gap-1.5 rounded-[12px] border border-parchment px-3 text-xs font-medium text-ganache transition-colors hover:bg-parchment/60"
					>
						<ExternalLink size={11} />
						View on site
					</Link>
					<button
						type="button"
						onClick={() => onDelete(place.id)}
						className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[12px] border border-raspberry/20 px-3 text-xs font-medium text-raspberry transition-colors hover:bg-raspberry/5"
					>
						<Trash2 size={11} />
						Delete
					</button>
				</div>
			</div>
		</motion.div>
	);
}

function DetailStat({
	icon,
	value,
	label,
	mono,
}: {
	icon: React.ReactNode;
	value: number | string;
	label: string;
	mono?: boolean;
}) {
	return (
		<div className="flex items-center gap-1.5 rounded-[8px] bg-flour px-2.5 py-1.5 text-xs">
			<span className="text-sesame">{icon}</span>
			<span
				className={`font-medium text-espresso ${mono ? "font-mono text-[11px] tabular-nums" : ""}`}
			>
				{value}
			</span>
			<span className="text-sesame">{label}</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Table columns for table-only view
// ---------------------------------------------------------------------------

const tableColumns = [
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
		key: "coords",
		label: "Coords",
		render: (row: Place) => (
			<span className="font-mono text-xs tabular-nums text-ganache">
				{row.latitude != null && row.longitude != null
					? `${row.latitude.toFixed(3)}, ${row.longitude.toFixed(3)}`
					: "\u2014"}
			</span>
		),
	},
];

// ---------------------------------------------------------------------------
// Small UI components
// ---------------------------------------------------------------------------

function SortButton({
	icon,
	active,
	onClick,
	label,
}: {
	icon: React.ReactNode;
	active: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={label}
			className={`inline-flex h-6 w-6 items-center justify-center rounded-[6px] transition-colors ${
				active ? "bg-espresso text-flour" : "text-sesame hover:bg-parchment/60 hover:text-espresso"
			}`}
		>
			{icon}
		</button>
	);
}

function ViewToggle({
	icon,
	active,
	onClick,
	label,
}: {
	icon: React.ReactNode;
	active: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={label}
			className={`inline-flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors ${
				active ? "bg-espresso text-flour" : "text-sesame hover:bg-parchment/60 hover:text-espresso"
			}`}
		>
			{icon}
		</button>
	);
}

function LayoutSplitIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="Split view"
		>
			<rect x="1" y="1" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
			<rect x="8" y="1" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
		</svg>
	);
}
