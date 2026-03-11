"use client";

import { useAdminUpdatePastry } from "@/api/admin";
import { createClient } from "@/lib/supabase/client";
import type { Pastry } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

const supabase = createClient();

export default function AdminPastryEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();

	const { data: pastry, isLoading } = useQuery<Pastry>({
		queryKey: ["admin", "pastry", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("pastries").select("*").eq("id", id).single();
			if (error) throw error;
			return data as Pastry;
		},
	});

	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [category, setCategory] = useState("");
	const [description, setDescription] = useState("");
	const [photoUrl, setPhotoUrl] = useState("");
	const [featured, setFeatured] = useState(false);

	useEffect(() => {
		if (pastry) {
			setName(pastry.name);
			setSlug(pastry.slug);
			setCategory(pastry.category);
			setDescription(pastry.description ?? "");
			setPhotoUrl(pastry.photo_url ?? "");
			setFeatured(pastry.featured);
		}
	}, [pastry]);

	const updatePastry = useAdminUpdatePastry();

	const handleSave = () => {
		updatePastry.mutate(
			{
				id,
				name,
				slug,
				category,
				description: description || null,
				photo_url: photoUrl || null,
				featured,
			},
			{
				onSuccess: () => router.push("/admin/pastries"),
			},
		);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 size={24} className="animate-spin text-sesame" />
			</div>
		);
	}

	if (!pastry) {
		return <div className="py-24 text-center text-sm text-sesame">Pastry not found.</div>;
	}

	return (
		<div>
			<Link
				href="/admin/pastries"
				className="inline-flex items-center gap-1.5 text-sm text-ganache transition-colors hover:text-espresso"
			>
				<ArrowLeft size={14} />
				Back to pastries
			</Link>

			<h1 className="mt-4 font-display text-2xl text-espresso">Edit Pastry</h1>

			<div className="mt-6 flex max-w-lg flex-col gap-4">
				<Field label="Name" value={name} onChange={setName} />
				<Field label="Slug" value={slug} onChange={setSlug} />
				<Field label="Category" value={category} onChange={setCategory} />

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-espresso">Description</span>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={4}
						className="rounded-[12px] border border-parchment bg-flour px-3 py-2 text-sm text-espresso placeholder:text-sesame focus:border-brioche focus:outline-none"
					/>
				</label>

				<Field label="Photo URL" value={photoUrl} onChange={setPhotoUrl} />

				<label className="flex items-center gap-3">
					<input
						type="checkbox"
						checked={featured}
						onChange={(e) => setFeatured(e.target.checked)}
						className="h-4 w-4 rounded border-parchment accent-brioche"
					/>
					<span className="text-sm font-medium text-espresso">Featured</span>
				</label>

				<button
					type="button"
					onClick={handleSave}
					disabled={updatePastry.isPending || !name}
					className="mt-2 inline-flex h-10 items-center justify-center gap-2 self-start bg-brioche px-5 font-medium text-flour rounded-[14px] transition-colors hover:bg-brioche/90 disabled:opacity-50"
				>
					{updatePastry.isPending && <Loader2 size={14} className="animate-spin" />}
					Save Changes
				</button>
			</div>
		</div>
	);
}

function Field({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-espresso">{label}</span>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="h-10 rounded-[12px] border border-parchment bg-flour px-3 text-sm text-espresso placeholder:text-sesame focus:border-brioche focus:outline-none"
			/>
		</label>
	);
}
