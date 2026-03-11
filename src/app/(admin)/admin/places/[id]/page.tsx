"use client";

import { useAdminUpdatePlace } from "@/api/admin";
import { createClient } from "@/lib/supabase/client";
import type { Place } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

const supabase = createClient();

export default function AdminPlaceEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();

	const { data: place, isLoading } = useQuery<Place>({
		queryKey: ["admin", "place", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("places").select("*").eq("id", id).single();
			if (error) throw error;
			return data as Place;
		},
	});

	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [city, setCity] = useState("");
	const [country, setCountry] = useState("");
	const [latitude, setLatitude] = useState<number | "">("");
	const [longitude, setLongitude] = useState<number | "">("");

	useEffect(() => {
		if (place) {
			setName(place.name);
			setAddress(place.address ?? "");
			setCity(place.city ?? "");
			setCountry(place.country ?? "");
			setLatitude(place.latitude ?? "");
			setLongitude(place.longitude ?? "");
		}
	}, [place]);

	const updatePlace = useAdminUpdatePlace();

	const handleSave = () => {
		updatePlace.mutate(
			{
				id,
				name,
				address: address || null,
				city: city || null,
				country: country || null,
				latitude: latitude === "" ? null : Number(latitude),
				longitude: longitude === "" ? null : Number(longitude),
			},
			{
				onSuccess: () => router.push("/admin/places"),
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

	if (!place) {
		return <div className="py-24 text-center text-sm text-sesame">Place not found.</div>;
	}

	return (
		<div>
			<Link
				href="/admin/places"
				className="inline-flex items-center gap-1.5 text-sm text-ganache transition-colors hover:text-espresso"
			>
				<ArrowLeft size={14} />
				Back to places
			</Link>

			<h1 className="mt-4 font-display text-2xl text-espresso">Edit Place</h1>

			<div className="mt-6 flex max-w-lg flex-col gap-4">
				<Field label="Name" value={name} onChange={setName} />
				<Field label="Address" value={address} onChange={setAddress} />
				<Field label="City" value={city} onChange={setCity} />
				<Field label="Country" value={country} onChange={setCountry} />
				<Field
					label="Latitude"
					value={latitude === "" ? "" : String(latitude)}
					onChange={(v) => setLatitude(v === "" ? "" : Number(v))}
					type="number"
				/>
				<Field
					label="Longitude"
					value={longitude === "" ? "" : String(longitude)}
					onChange={(v) => setLongitude(v === "" ? "" : Number(v))}
					type="number"
				/>

				<button
					type="button"
					onClick={handleSave}
					disabled={updatePlace.isPending || !name}
					className="mt-2 inline-flex h-10 items-center justify-center gap-2 self-start bg-brioche px-5 font-medium text-flour rounded-[14px] transition-colors hover:bg-brioche/90 disabled:opacity-50"
				>
					{updatePlace.isPending && <Loader2 size={14} className="animate-spin" />}
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
	type = "text",
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-espresso">{label}</span>
			<input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="h-10 rounded-[12px] border border-parchment bg-flour px-3 text-sm text-espresso placeholder:text-sesame focus:border-brioche focus:outline-none"
			/>
		</label>
	);
}
