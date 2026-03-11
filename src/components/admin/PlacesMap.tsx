"use client";

import type { AdminMapPlace } from "@/api/admin";
import { Loader2, Maximize2 } from "lucide-react";
import dynamic from "next/dynamic";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

export type MapBounds = {
	north: number;
	south: number;
	east: number;
	west: number;
};

const PlacesMapInner = dynamic(
	() =>
		import("react-leaflet").then((mod) => {
			const React = require("react");
			const { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } = mod;
			const MarkerClusterGroup = require("react-leaflet-cluster").default;

			function FitBounds({ places }: { places: AdminMapPlace[] }) {
				const map = useMap();
				const fitted = React.useRef(false);

				React.useEffect(() => {
					if (places.length > 0 && !fitted.current) {
						const L = require("leaflet");
						const bounds = L.latLngBounds(
							places.map((p: AdminMapPlace) => [p.latitude ?? 0, p.longitude ?? 0]),
						);
						map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
						fitted.current = true;
					}
				}, [places, map]);

				return null;
			}

			function BoundsWatcher({
				onBoundsChange,
			}: {
				onBoundsChange: (bounds: MapBounds) => void;
			}) {
				const map = useMap();

				const emitBounds = React.useCallback(() => {
					const b = map.getBounds();
					onBoundsChange({
						north: b.getNorth(),
						south: b.getSouth(),
						east: b.getEast(),
						west: b.getWest(),
					});
				}, [map, onBoundsChange]);

				React.useEffect(() => {
					setTimeout(emitBounds, 200);
				}, [emitBounds]);

				useMapEvents({
					moveend: emitBounds,
					zoomend: emitBounds,
				});

				return null;
			}

			function FlyToSelected({
				lat,
				lng,
			}: {
				lat: number | null;
				lng: number | null;
			}) {
				const map = useMap();
				const prev = React.useRef(null as string | null);

				React.useEffect(() => {
					const key = lat != null && lng != null ? `${lat},${lng}` : null;
					if (key && key !== prev.current && lat != null && lng != null) {
						map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
					}
					prev.current = key;
				}, [lat, lng, map]);

				return null;
			}

			function FitAllButton({ places }: { places: AdminMapPlace[] }) {
				const map = useMap();

				return (
					<button
						type="button"
						onClick={() => {
							if (places.length === 0) return;
							const L = require("leaflet");
							const bounds = L.latLngBounds(
								places.map((p: AdminMapPlace) => [p.latitude ?? 0, p.longitude ?? 0]),
							);
							map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
						}}
						className="leaflet-control"
						style={{
							position: "absolute",
							top: 80,
							left: 10,
							zIndex: 1000,
							background: "#fff",
							border: "1px solid #f2eae0",
							borderRadius: "8px",
							width: 32,
							height: 32,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
						}}
						title="Fit all places"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#4a2c2a"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							role="img"
							aria-label="Fit all"
						>
							<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
						</svg>
					</button>
				);
			}

			function MapComponent({
				places,
				selectedId,
				flyToLat,
				flyToLng,
				onSelect,
				onBoundsChange,
			}: {
				places: AdminMapPlace[];
				selectedId: string | null;
				flyToLat: number | null;
				flyToLng: number | null;
				onSelect: (place: AdminMapPlace) => void;
				onBoundsChange?: (bounds: MapBounds) => void;
			}) {
				const L = require("leaflet");

				const defaultIcon = L.divIcon({
					html: '<div style="width:10px;height:10px;border-radius:50%;background:#c97b3a;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>',
					className: "",
					iconSize: [10, 10],
					iconAnchor: [5, 5],
				});

				const selectedIcon = L.divIcon({
					html: '<div style="width:14px;height:14px;border-radius:50%;background:#1e1710;border:2px solid #c97b3a;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
					className: "",
					iconSize: [14, 14],
					iconAnchor: [7, 7],
				});

				return (
					<MapContainer
						center={[48.856, 2.352]}
						zoom={3}
						scrollWheelZoom
						className="h-full w-full"
						style={{ height: "100%", width: "100%", position: "relative" }}
					>
						<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
							url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
						/>
						{places.length > 0 && <FitBounds places={places} />}
						{onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}
						<FlyToSelected lat={flyToLat} lng={flyToLng} />
						<FitAllButton places={places} />
						<MarkerClusterGroup
							chunkedLoading
							maxClusterRadius={50}
							spiderfyOnMaxZoom
							showCoverageOnHover={false}
						>
							{places.map((place) => (
								<Marker
									key={place.id}
									position={[place.latitude ?? 0, place.longitude ?? 0]}
									icon={place.id === selectedId ? selectedIcon : defaultIcon}
									eventHandlers={{
										click: () => onSelect(place),
									}}
								>
									<Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
										<span
											style={{
												fontFamily: "DM Sans, sans-serif",
												fontSize: "12px",
												fontWeight: 500,
											}}
										>
											{place.name}
										</span>
									</Tooltip>
									<Popup>
										<div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px" }}>
											<strong>{place.name}</strong>
											{place.city && (
												<div style={{ color: "#6b5e53", marginTop: "2px" }}>
													{place.city}
													{place.country ? `, ${place.country}` : ""}
												</div>
											)}
											<div style={{ color: "#a89585", marginTop: "4px", fontSize: "11px" }}>
												{place.pastry_count} pastries &middot; {place.checkin_count} check-ins
											</div>
										</div>
									</Popup>
								</Marker>
							))}
						</MarkerClusterGroup>
					</MapContainer>
				);
			}

			return MapComponent;
		}),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full w-full items-center justify-center bg-parchment/30">
				<Loader2 size={20} className="animate-spin text-sesame" />
			</div>
		),
	},
);

export function PlacesMap({
	places,
	selectedId,
	flyToLat,
	flyToLng,
	onSelect,
	onBoundsChange,
}: {
	places: AdminMapPlace[];
	selectedId: string | null;
	flyToLat?: number | null;
	flyToLng?: number | null;
	onSelect: (place: AdminMapPlace) => void;
	onBoundsChange?: (bounds: MapBounds) => void;
}) {
	return (
		<div className="h-full w-full">
			<PlacesMapInner
				places={places}
				selectedId={selectedId}
				flyToLat={flyToLat ?? null}
				flyToLng={flyToLng ?? null}
				onSelect={onSelect}
				onBoundsChange={onBoundsChange}
			/>
		</div>
	);
}
