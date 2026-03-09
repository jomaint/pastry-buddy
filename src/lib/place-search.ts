export interface PlaceResult {
	id: string;
	name: string;
	address: string;
	city: string;
	country: string;
	latitude: number;
	longitude: number;
	source: "local" | "nominatim";
}

/**
 * Search for bakeries/cafes via OpenStreetMap Nominatim API.
 * Free, no API key required. Rate limit: 1 req/sec.
 * https://nominatim.org/release-docs/develop/api/Search/
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
	if (query.length < 3) return [];

	const params = new URLSearchParams({
		q: `${query} bakery cafe pastry`,
		format: "jsonv2",
		addressdetails: "1",
		limit: "8",
		countrycodes: "us",
		// Bias toward California
		viewbox: "-124.48,42.01,-114.13,32.53",
		bounded: "0",
	});

	let res: Response;
	try {
		res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
			headers: {
				"User-Agent": "PastryBuddy/1.0 (pastry-buddy app)",
			},
		});
	} catch {
		return [];
	}

	if (!res.ok) return [];

	let data: NominatimResult[];
	try {
		data = await res.json();
	} catch {
		return [];
	}

	return data
		.filter((place: NominatimResult) => place.address)
		.map((place: NominatimResult) => ({
			id: `osm-${place.osm_id}`,
			name: place.name || extractName(place),
			address: formatAddress(place.address),
			city:
				place.address.city ||
				place.address.town ||
				place.address.village ||
				place.address.county ||
				"",
			country: place.address.country_code?.toUpperCase() || "US",
			latitude: Number.parseFloat(place.lat),
			longitude: Number.parseFloat(place.lon),
			source: "nominatim" as const,
		}));
}

interface NominatimAddress {
	road?: string;
	house_number?: string;
	city?: string;
	town?: string;
	village?: string;
	county?: string;
	state?: string;
	country?: string;
	country_code?: string;
	postcode?: string;
	shop?: string;
	amenity?: string;
}

interface NominatimResult {
	osm_id: number;
	name: string;
	display_name: string;
	lat: string;
	lon: string;
	address: NominatimAddress;
}

function extractName(place: NominatimResult): string {
	return (
		place.address.shop || place.address.amenity || place.display_name.split(",")[0] || "Unknown"
	);
}

function formatAddress(addr: NominatimAddress): string {
	const parts: string[] = [];
	if (addr.house_number && addr.road) {
		parts.push(`${addr.house_number} ${addr.road}`);
	} else if (addr.road) {
		parts.push(addr.road);
	}
	return parts.join(", ") || "";
}
