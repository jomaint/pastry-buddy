"use client";

import { useAuth } from "@/api/auth";
import { useAddToList, useCreateList, useLists } from "@/api/lists";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Bookmark, Check, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SaveToListButton({ pastryId }: { pastryId: string }) {
	const { data: auth } = useAuth();
	const router = useRouter();
	const [open, setOpen] = useState(false);

	if (!auth?.isAuthenticated) {
		return (
			<button
				type="button"
				onClick={() => router.push("/sign-in")}
				className="flex items-center justify-center gap-2 rounded-[14px] bg-parchment px-5 py-3 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80"
			>
				<Bookmark size={16} />
				Save
			</button>
		);
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex items-center justify-center gap-2 rounded-[14px] bg-parchment px-5 py-3 text-sm font-medium text-espresso transition-colors hover:bg-parchment/80"
			>
				<Bookmark size={16} />
				Save
			</button>
			{open && <SaveToListModal pastryId={pastryId} open={open} onClose={() => setOpen(false)} />}
		</>
	);
}

function SaveToListContent({ pastryId, onClose }: { pastryId: string; onClose: () => void }) {
	const { data: lists, isLoading } = useLists();
	const addToList = useAddToList();
	const createList = useCreateList();
	const [newListName, setNewListName] = useState("");
	const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

	const handleAdd = (listId: string) => {
		addToList.mutate(
			{ list_id: listId, pastry_id: pastryId },
			{
				onSuccess: () => {
					setAddedTo((prev) => new Set(prev).add(listId));
				},
			},
		);
	};

	const handleCreateAndAdd = () => {
		if (!newListName.trim()) return;
		createList.mutate(
			{ name: newListName.trim() },
			{
				onSuccess: (list) => {
					setNewListName("");
					handleAdd(list.id);
				},
			},
		);
	};

	return (
		<>
			{isLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 size={20} className="animate-spin text-sesame" />
				</div>
			) : (
				<div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
					{(lists ?? []).map((list) => (
						<button
							key={list.id}
							type="button"
							onClick={() => handleAdd(list.id)}
							disabled={addedTo.has(list.id) || addToList.isPending}
							className="flex items-center gap-3 rounded-[12px] p-3 text-left transition-colors hover:bg-parchment/40 disabled:opacity-60"
						>
							<Bookmark size={14} className="shrink-0 text-brioche" />
							<span className="flex-1 text-sm text-espresso truncate">{list.name}</span>
							{addedTo.has(list.id) && <Check size={14} className="text-brioche" />}
						</button>
					))}
				</div>
			)}

			<div className="mt-4 flex gap-2">
				<Input
					aria-label="New list name"
					placeholder="New list name"
					value={newListName}
					onChange={(e) => setNewListName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
					className="flex-1"
				/>
				<Button
					size="sm"
					aria-label="Create list"
					onClick={handleCreateAndAdd}
					disabled={!newListName.trim() || createList.isPending}
				>
					<Plus size={14} aria-hidden="true" />
				</Button>
			</div>
		</>
	);
}

function SaveToListModal({
	pastryId,
	open,
	onClose,
}: { pastryId: string; open: boolean; onClose: () => void }) {
	const isMobile = useMediaQuery("(max-width: 767px)");

	if (isMobile) {
		return (
			<BottomSheet open={open} onClose={onClose} title="Save to list">
				<SaveToListContent pastryId={pastryId} onClose={onClose} />
			</BottomSheet>
		);
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 px-4"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			{/* biome-ignore lint/a11y/useSemanticElements: role="dialog" is valid WCAG; native <dialog> requires .showModal() API */}
			<div
				role="dialog"
				aria-labelledby="save-list-title"
				className="w-full max-w-sm rounded-[16px] bg-flour p-6 shadow-lg"
			>
				<div className="flex items-center justify-between mb-4">
					<h2 id="save-list-title" className="font-display text-xl text-espresso">
						Save to list
					</h2>
					<button
						type="button"
						aria-label="Close"
						onClick={onClose}
						className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-parchment"
					>
						<X size={16} className="text-sesame" aria-hidden="true" />
					</button>
				</div>
				<SaveToListContent pastryId={pastryId} onClose={onClose} />
			</div>
		</div>
	);
}
