/**
 * Step 1: Fetch Google Places photos for each place.
 *
 * Downloads photos to .photos/<place-slug>/ for manual curation.
 * Generates .photos/manifest.json mapping place → photos.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=xxx npx tsx scripts/fetch-google-photos.ts
 *
 * Requires: Google Maps API key with Places API (New) enabled.
 * Cost: ~$2 one-time for 15 places × 10 photos each.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv() {
	try {
		const envPath = resolve(__dirname, "../.env.local");
		const content = readFileSync(envPath, "utf-8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const eqIdx = trimmed.indexOf("=");
			if (eqIdx === -1) continue;
			const key = trimmed.slice(0, eqIdx).trim();
			const value = trimmed.slice(eqIdx + 1).trim();
			if (!process.env[key]) process.env[key] = value;
		}
	} catch {}
}

loadEnv();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY) {
	console.error("Missing GOOGLE_MAPS_API_KEY. Set it in .env.local or as an env var.");
	process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
});

const PHOTOS_DIR = resolve(__dirname, "../.photos");
const MANIFEST_PATH = join(PHOTOS_DIR, "manifest.json");
const PHOTOS_PER_PLACE = 10;

// ---------------------------------------------------------------------------
// Google Places API helpers
// ---------------------------------------------------------------------------

async function searchPlace(name: string, city: string): Promise<string | null> {
	const query = `${name}, ${city}`;
	const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

	const res = await fetch(url);
	const data = await res.json();

	if (data.status !== "OK" || !data.results?.length) {
		console.warn(`    No place found for "${query}"`);
		return null;
	}

	return data.results[0].place_id;
}

async function getPlacePhotos(
	placeId: string,
): Promise<{ photo_reference: string; width: number; height: number; attributions: string[] }[]> {
	const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`;

	const res = await fetch(url);
	const data = await res.json();

	if (data.status !== "OK" || !data.result?.photos) {
		return [];
	}

	return data.result.photos.slice(0, PHOTOS_PER_PLACE).map(
		(p: {
			photo_reference: string;
			width: number;
			height: number;
			html_attributions: string[];
		}) => ({
			photo_reference: p.photo_reference,
			width: p.width,
			height: p.height,
			attributions: p.html_attributions ?? [],
		}),
	);
}

async function downloadPhoto(photoReference: string, outputPath: string): Promise<boolean> {
	const url = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photoReference}&maxwidth=800&key=${GOOGLE_API_KEY}`;

	const res = await fetch(url);
	if (!res.ok) {
		console.warn(`    Failed to download photo: ${res.status}`);
		return false;
	}

	const buffer = Buffer.from(await res.arrayBuffer());
	writeFileSync(outputPath, buffer);
	return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type ManifestEntry = {
	place_id: string;
	place_name: string;
	place_slug: string;
	google_place_id: string;
	photos: {
		filename: string;
		photo_reference: string;
		width: number;
		height: number;
		attributions: string[];
		/** Set to a pastry slug during curation to assign this photo to that pastry */
		assign_to_pastry?: string;
	}[];
};

async function main() {
	console.log("=== Google Places Photo Fetcher ===\n");

	// Fetch all places from DB
	const { data: places, error } = await supabase
		.from("places")
		.select("id, name, slug, city, google_place_id")
		.order("name");

	if (error || !places) {
		console.error("Failed to fetch places:", error?.message);
		process.exit(1);
	}

	// Also fetch pastries for reference
	const { data: pastries } = await supabase
		.from("pastries")
		.select("id, name, slug, place_id")
		.order("place_id, name");

	// Create output directory
	mkdirSync(PHOTOS_DIR, { recursive: true });

	const manifest: ManifestEntry[] = [];

	for (const place of places) {
		console.log(`\n📍 ${place.name} (${place.city})`);

		// Get or find google_place_id
		let googlePlaceId = place.google_place_id;
		if (!googlePlaceId) {
			console.log("  Searching for place...");
			googlePlaceId = await searchPlace(place.name, place.city ?? "California");
			if (!googlePlaceId) {
				console.warn("  Skipped (no place found)");
				continue;
			}

			// Save google_place_id back to DB
			await supabase.from("places").update({ google_place_id: googlePlaceId }).eq("id", place.id);
			console.log(`  Found: ${googlePlaceId}`);
		} else {
			console.log(`  Place ID: ${googlePlaceId}`);
		}

		// Fetch photos
		console.log("  Fetching photos...");
		const photos = await getPlacePhotos(googlePlaceId);
		if (photos.length === 0) {
			console.warn("  No photos available");
			continue;
		}

		// Create place directory
		const placeDir = join(PHOTOS_DIR, place.slug);
		mkdirSync(placeDir, { recursive: true });

		// Download photos
		const entry: ManifestEntry = {
			place_id: place.id,
			place_name: place.name,
			place_slug: place.slug,
			google_place_id: googlePlaceId,
			photos: [],
		};

		for (let i = 0; i < photos.length; i++) {
			const photo = photos[i];
			const filename = `${i + 1}.jpg`;
			const outputPath = join(placeDir, filename);

			if (existsSync(outputPath)) {
				console.log(`  [${i + 1}/${photos.length}] Already downloaded: ${filename}`);
			} else {
				const ok = await downloadPhoto(photo.photo_reference, outputPath);
				if (!ok) continue;
				console.log(`  [${i + 1}/${photos.length}] Downloaded: ${filename}`);
			}

			entry.photos.push({
				filename,
				photo_reference: photo.photo_reference,
				width: photo.width,
				height: photo.height,
				attributions: photo.attributions,
			});
		}

		manifest.push(entry);
		console.log(`  ${entry.photos.length} photos saved`);
	}

	// Write manifest
	writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
	console.log(`\n✅ Manifest written to ${MANIFEST_PATH}`);

	// Print pastry list for reference during curation
	console.log("\n=== Pastries by place (for curation reference) ===\n");
	for (const entry of manifest) {
		const placePastries = (pastries ?? []).filter((p) => p.place_id === entry.place_id);
		console.log(`${entry.place_name}:`);
		for (const p of placePastries) {
			console.log(`  - ${p.slug}  →  "${p.name}"`);
		}
		console.log(`  Photos: ${entry.photos.map((p) => p.filename).join(", ")}`);
		console.log();
	}

	console.log("=== Next steps ===");
	console.log("1. Open .photos/<place>/ folders and review the downloaded images");
	console.log("2. Edit .photos/manifest.json — set 'assign_to_pastry' on each photo");
	console.log('   to the pastry slug it best represents (e.g. "arsicault-butter-croissant")');
	console.log("3. Run: npx tsx scripts/upload-curated-photos.ts");
}

main().catch((err) => {
	console.error("Failed:", err);
	process.exit(1);
});
