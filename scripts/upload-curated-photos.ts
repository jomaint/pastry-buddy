/**
 * Step 2: Upload curated photos to Supabase Storage and update pastry photo_urls.
 *
 * Reads .photos/manifest.json, uploads photos with assign_to_pastry set,
 * and updates the corresponding pastry's photo_url in the database.
 *
 * Usage: npx tsx scripts/upload-curated-photos.ts
 */

import { existsSync, readFileSync } from "node:fs";
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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
});

const PHOTOS_DIR = resolve(__dirname, "../.photos");
const MANIFEST_PATH = join(PHOTOS_DIR, "manifest.json");
const BUCKET_NAME = "pastry-photos";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ManifestPhoto = {
	filename: string;
	photo_reference: string;
	width: number;
	height: number;
	attributions: string[];
	assign_to_pastry?: string;
};

type ManifestEntry = {
	place_id: string;
	place_name: string;
	place_slug: string;
	google_place_id: string;
	photos: ManifestPhoto[];
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log("=== Upload Curated Photos to Supabase Storage ===\n");

	// Read manifest
	if (!existsSync(MANIFEST_PATH)) {
		console.error("No manifest found. Run fetch-google-photos.ts first.");
		process.exit(1);
	}

	const manifest: ManifestEntry[] = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));

	// Collect all photos with assignments
	const assignments: { entry: ManifestEntry; photo: ManifestPhoto }[] = [];
	for (const entry of manifest) {
		for (const photo of entry.photos) {
			if (photo.assign_to_pastry) {
				assignments.push({ entry, photo });
			}
		}
	}

	if (assignments.length === 0) {
		console.error("No photos have assign_to_pastry set in manifest.json.");
		console.error('Edit .photos/manifest.json and set "assign_to_pastry" to pastry slugs.');
		process.exit(1);
	}

	console.log(`Found ${assignments.length} photo assignments.\n`);

	// Ensure bucket exists
	console.log("Ensuring storage bucket exists...");
	const { error: bucketErr } = await supabase.storage.createBucket(BUCKET_NAME, {
		public: true,
		fileSizeLimit: 5 * 1024 * 1024, // 5MB
		allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
	});

	if (bucketErr && !bucketErr.message.includes("already exists")) {
		console.error("Failed to create bucket:", bucketErr.message);
		process.exit(1);
	}
	console.log(`Bucket "${BUCKET_NAME}" ready.\n`);

	// Upload each assigned photo
	let uploaded = 0;
	let failed = 0;

	for (const { entry, photo } of assignments) {
		const pastrySlug = photo.assign_to_pastry as string;
		const localPath = join(PHOTOS_DIR, entry.place_slug, photo.filename);

		if (!existsSync(localPath)) {
			console.warn(`  File not found: ${localPath} — skipping`);
			failed++;
			continue;
		}

		const fileBuffer = readFileSync(localPath);
		const storagePath = `${entry.place_slug}/${pastrySlug}.jpg`;

		console.log(`  Uploading: ${storagePath}`);

		const { error: uploadErr } = await supabase.storage
			.from(BUCKET_NAME)
			.upload(storagePath, fileBuffer, {
				contentType: "image/jpeg",
				upsert: true,
			});

		if (uploadErr) {
			console.error(`    Upload failed: ${uploadErr.message}`);
			failed++;
			continue;
		}

		// Get public URL
		const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
		const publicUrl = urlData.publicUrl;

		// Update pastry photo_url
		const { data: pastry, error: updateErr } = await supabase
			.from("pastries")
			.update({ photo_url: publicUrl })
			.eq("slug", pastrySlug)
			.select("id, name")
			.single();

		if (updateErr || !pastry) {
			console.warn(`    Pastry "${pastrySlug}" not found in DB — photo uploaded but not linked`);
		} else {
			console.log(`    Linked to: ${pastry.name}`);
		}

		uploaded++;
	}

	// Also update place photo_url for any place-level photos
	// (photos without assign_to_pastry but with a special "_place" assignment)
	for (const entry of manifest) {
		for (const photo of entry.photos) {
			if (photo.assign_to_pastry === "_place") {
				const localPath = join(PHOTOS_DIR, entry.place_slug, photo.filename);
				if (!existsSync(localPath)) continue;

				const fileBuffer = readFileSync(localPath);
				const storagePath = `${entry.place_slug}/_storefront.jpg`;

				console.log(`  Uploading place photo: ${storagePath}`);

				const { error: uploadErr } = await supabase.storage
					.from(BUCKET_NAME)
					.upload(storagePath, fileBuffer, {
						contentType: "image/jpeg",
						upsert: true,
					});

				if (uploadErr) {
					console.error(`    Upload failed: ${uploadErr.message}`);
					continue;
				}

				const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

				await supabase
					.from("places")
					.update({ photo_url: urlData.publicUrl })
					.eq("id", entry.place_id);

				console.log(`    Linked to place: ${entry.place_name}`);
				uploaded++;
			}
		}
	}

	console.log(`\n✅ Done: ${uploaded} uploaded, ${failed} failed`);
}

main().catch((err) => {
	console.error("Failed:", err);
	process.exit(1);
});
