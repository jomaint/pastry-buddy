"use client";

import { useAuth } from "@/api/auth";
import { useAddToList, useCreateList, useLists } from "@/api/lists";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
			{open && <SaveToListModal pastryId={pastryId} onClose={() => setOpen(false)} />}
		</>
	);
}

function SaveToListModal({ pastryId, onClose }: { pastryId: string; onClose: () => void }) {
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 px-4">
			<div className="w-full max-w-sm rounded-[16px] bg-flour p-6 shadow-lg">
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-display text-xl text-espresso">Save to list</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-parchment"
					>
						<X size={16} className="text-sesame" />
					</button>
				</div>

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
						placeholder="New list name"
						value={newListName}
						onChange={(e) => setNewListName(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
						className="flex-1"
					/>
					<Button
						size="sm"
						onClick={handleCreateAndAdd}
						disabled={!newListName.trim() || createList.isPending}
					>
						<Plus size={14} />
					</Button>
				</div>
			</div>
		</div>
	);
}
