"use client";

import { useCreateList, useList, useLists, useRemoveFromList } from "@/api/lists";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { ListCardSkeleton } from "@/components/ui/Skeleton";
import { useTrackEvent } from "@/hooks/use-track-event";
import {
	ArrowLeft,
	Bookmark,
	ChevronRight,
	Croissant,
	Globe,
	Loader2,
	Lock,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ListsPage() {
	const { data: lists, isLoading } = useLists();
	const [selectedListId, setSelectedListId] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const trackEvent = useTrackEvent();

	useEffect(() => {
		trackEvent("page_view", { pagePath: "/lists" });
	}, [trackEvent]);

	if (selectedListId) {
		return <ListDetailView listId={selectedListId} onBack={() => setSelectedListId(null)} />;
	}

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
			<div className="flex items-center justify-between">
				<h1 className="font-display text-3xl text-espresso">Your Lists</h1>
				<Button size="sm" onClick={() => setShowCreateModal(true)}>
					<Plus size={14} />
					New List
				</Button>
			</div>

			{isLoading ? (
				<div className="flex flex-col gap-2">
					{[1, 2, 3].map((i) => (
						<ListCardSkeleton key={i} />
					))}
				</div>
			) : lists && lists.length > 0 ? (
				<div className="flex flex-col gap-2">
					{lists.map((list) => (
						<button
							key={list.id}
							type="button"
							onClick={() => setSelectedListId(list.id)}
							className="flex items-center gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-colors hover:bg-parchment/40 text-left"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-parchment/60">
								<Bookmark size={16} className="text-brioche" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-espresso truncate">{list.name}</p>
								{list.description && (
									<p className="text-xs text-sesame truncate mt-0.5">{list.description}</p>
								)}
							</div>
							<div className="flex items-center gap-2">
								{list.is_public ? (
									<Globe size={12} className="text-sesame" />
								) : (
									<Lock size={12} className="text-sesame" />
								)}
								<ChevronRight size={14} className="text-sesame" />
							</div>
						</button>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-parchment/60">
						<Croissant size={24} className="text-brioche/40" />
					</div>
					<p className="font-display text-xl text-espresso">No lists yet</p>
					<p className="mt-2 max-w-[260px] text-sm leading-relaxed text-sesame">
						Create lists to organize your favorite pastries and share them with friends
					</p>
					<Button className="mt-6" onClick={() => setShowCreateModal(true)}>
						<Plus size={14} />
						Create your first list
					</Button>
				</div>
			)}

			{showCreateModal && <CreateListModal onClose={() => setShowCreateModal(false)} />}
		</PageTransition>
	);
}

// ---------------------------------------------------------------------------
// List Detail View
// ---------------------------------------------------------------------------

function ListDetailView({ listId, onBack }: { listId: string; onBack: () => void }) {
	const { data: list, isLoading } = useList(listId);
	const removeFromList = useRemoveFromList();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 size={24} className="animate-spin text-sesame" />
			</div>
		);
	}

	if (!list) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<p className="font-display text-xl text-espresso">List not found</p>
				<Button variant="ghost" className="mt-4" onClick={onBack}>
					Go back
				</Button>
			</div>
		);
	}

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onBack}
					className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment/60 transition-colors hover:bg-parchment"
				>
					<ArrowLeft size={16} className="text-espresso" />
				</button>
				<div className="flex-1 min-w-0">
					<h1 className="font-display text-2xl text-espresso truncate">{list.name}</h1>
					{list.description && <p className="text-sm text-sesame mt-0.5">{list.description}</p>}
				</div>
				<div className="flex items-center gap-1 text-xs text-sesame">
					{list.is_public ? <Globe size={12} /> : <Lock size={12} />}
					{list.is_public ? "Public" : "Private"}
				</div>
			</div>

			{list.items.length > 0 ? (
				<div className="flex flex-col gap-2">
					{list.items.map((item) => (
						<div
							key={item.id}
							className="flex items-center gap-3 rounded-[16px] bg-flour p-4 shadow-sm"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-parchment/60">
								<Croissant size={16} className="text-brioche" />
							</div>
							<div className="flex-1 min-w-0">
								<Link
									href={`/pastry/${item.pastry.slug}`}
									className="text-sm font-medium text-espresso hover:text-brioche transition-colors truncate block"
								>
									{item.pastry.name}
								</Link>
								<div className="flex items-center gap-2 mt-0.5">
									<span className="text-xs text-sesame capitalize">{item.pastry.category}</span>
									{item.pastry.avg_rating && (
										<Rating value={Math.round(item.pastry.avg_rating)} size="sm" readonly />
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={() => removeFromList.mutate({ itemId: item.id, listId })}
								disabled={removeFromList.isPending}
								className="flex h-8 w-8 items-center justify-center rounded-full text-sesame transition-colors hover:bg-parchment hover:text-raspberry"
							>
								<Trash2 size={14} />
							</button>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-parchment/60">
						<Bookmark size={24} className="text-brioche/40" />
					</div>
					<p className="font-display text-xl text-espresso">This list is empty</p>
					<p className="mt-2 max-w-[260px] text-sm leading-relaxed text-sesame">
						Add pastries from their detail pages to build this list
					</p>
					<Link
						href="/discover"
						className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-brioche px-5 text-sm font-medium text-flour transition-all duration-150 hover:bg-brioche/90 active:scale-[0.98]"
					>
						<Search size={14} />
						Discover pastries
					</Link>
				</div>
			)}
		</PageTransition>
	);
}

// ---------------------------------------------------------------------------
// Create List Modal
// ---------------------------------------------------------------------------

function CreateListModal({ onClose }: { onClose: () => void }) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(true);
	const createList = useCreateList();
	const trackEvent = useTrackEvent();

	const handleCreate = () => {
		if (!name.trim()) return;
		createList.mutate(
			{ name: name.trim(), description: description.trim() || undefined, is_public: isPublic },
			{
				onSuccess: () => {
					trackEvent("list_created", { properties: { name: name.trim(), is_public: isPublic } });
					onClose();
				},
			},
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 px-4">
			<div className="w-full max-w-sm rounded-[16px] bg-flour p-6 shadow-lg">
				<div className="flex items-center justify-between mb-5">
					<h2 className="font-display text-xl text-espresso">New List</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-parchment"
					>
						<X size={16} className="text-sesame" />
					</button>
				</div>

				<div className="flex flex-col gap-4">
					<Input
						label="Name"
						placeholder="My favorite croissants"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="list-description" className="text-sm font-medium text-espresso">
							Description
						</label>
						<textarea
							id="list-description"
							placeholder="What's this list about?"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							className="w-full rounded-[12px] border border-parchment bg-flour px-3 py-2.5 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/30 resize-none"
						/>
					</div>

					<button
						type="button"
						onClick={() => setIsPublic(!isPublic)}
						className="flex items-center gap-2 text-sm text-espresso"
					>
						<div
							className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
								isPublic ? "border-brioche bg-brioche" : "border-parchment bg-flour"
							}`}
						>
							{isPublic && (
								<svg
									width="10"
									height="8"
									viewBox="0 0 10 8"
									fill="none"
									className="text-flour"
									aria-hidden="true"
									role="img"
								>
									<path
										d="M1 4L3.5 6.5L9 1"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							)}
						</div>
						Make this list public
					</button>

					{createList.error && (
						<p className="text-xs text-raspberry">
							{createList.error instanceof Error
								? createList.error.message
								: "Could not create list"}
						</p>
					)}

					<div className="flex gap-2 mt-1">
						<Button variant="secondary" className="flex-1" onClick={onClose}>
							Cancel
						</Button>
						<Button
							className="flex-1"
							onClick={handleCreate}
							disabled={!name.trim() || createList.isPending}
						>
							{createList.isPending ? <Loader2 size={14} className="animate-spin" /> : "Create"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
