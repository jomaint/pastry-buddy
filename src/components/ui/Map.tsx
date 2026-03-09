"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const MapInner = dynamic(
	() =>
		import("react-leaflet").then((mod) => {
			const { MapContainer, TileLayer, Marker, Popup } = mod;

			function MapComponent({
				lat,
				lng,
				name,
			}: {
				lat: number;
				lng: number;
				name: string;
			}) {
				return (
					<MapContainer
						center={[lat, lng]}
						zoom={15}
						scrollWheelZoom={false}
						className="h-full w-full rounded-[16px]"
						style={{ height: "100%", width: "100%" }}
					>
						<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						<Marker position={[lat, lng]}>
							<Popup>{name}</Popup>
						</Marker>
					</MapContainer>
				);
			}

			return MapComponent;
		}),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full w-full items-center justify-center rounded-[16px] bg-parchment/50">
				<Loader2 size={20} className="animate-spin text-sesame" />
			</div>
		),
	},
);

export function BakeryMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
	return (
		<div className="h-[240px] w-full overflow-hidden rounded-[16px]">
			<MapInner lat={lat} lng={lng} name={name} />
		</div>
	);
}
