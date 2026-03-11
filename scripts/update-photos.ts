/**
 * Updates pastry photo_url fields in the database with Unsplash images.
 *
 * Usage: npx tsx scripts/update-photos.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

// All URLs verified 200 via Unsplash napi search
const CROISSANT =
	"https://images.unsplash.com/photo-1623334044303-241021148842?w=800&h=800&fit=crop";
const ALMOND_CROISSANT =
	"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop";
const KOUIGN_AMANN =
	"https://images.unsplash.com/photo-1647544301386-8a2be03750b0?w=800&h=800&fit=crop";
const PAIN_AU_CHOCOLAT =
	"https://images.unsplash.com/photo-1681218424681-b4f8228ecea9?w=800&h=800&fit=crop";
const EGG_TART =
	"https://plus.unsplash.com/premium_photo-1677661619803-a15ee927654c?w=800&h=800&fit=crop";
const MOCHI =
	"https://plus.unsplash.com/premium_photo-1725467480477-9c108edf3337?w=800&h=800&fit=crop";
const GUAVA_PASTRY =
	"https://plus.unsplash.com/premium_photo-1679934231486-e41d6db1e14c?w=800&h=800&fit=crop";
const PISTACHIO_CROISSANT =
	"https://plus.unsplash.com/premium_photo-1675807060462-f813f13adf3e?w=800&h=800&fit=crop";
const COOKIE = "https://images.unsplash.com/photo-1520736362510-dda15d2c3086?w=800&h=800&fit=crop";
const LEMON_TART = "https://images.unsplash.com/photo-1543508185-225c92847541?w=800&h=800&fit=crop";
const MANGO_DESSERT =
	"https://plus.unsplash.com/premium_photo-1671559021800-6b9162ec628e?w=800&h=800&fit=crop";
const MORNING_BUN =
	"https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=800&h=800&fit=crop";
const DONUT = "https://images.unsplash.com/photo-1587912001191-0cd4f14fd89e?w=800&h=800&fit=crop";
const BREAD = "https://images.unsplash.com/photo-1600521853186-93b88b3a07b0?w=800&h=800&fit=crop";
const STRAWBERRY_CROISSANT =
	"https://images.unsplash.com/photo-1612366747681-e4ca6992b1e9?w=800&h=800&fit=crop";
const CAKE = "https://images.unsplash.com/photo-1599940778173-e276d4acb2bb?w=800&h=800&fit=crop";
const CANELE = "https://images.unsplash.com/photo-1724879703317-a2686a97f767?w=800&h=800&fit=crop";
const FINANCIER =
	"https://images.unsplash.com/photo-1693399991519-bef70bed19a2?w=800&h=800&fit=crop";
const SAVORY_PASTRY =
	"https://images.unsplash.com/photo-1555931951-18914f6692ae?w=800&h=800&fit=crop";
const COCONUT_PASTRY =
	"https://images.unsplash.com/photo-1703168080814-3cd5ba68343d?w=800&h=800&fit=crop";

// slug → verified Unsplash URL
const PASTRY_PHOTOS: Record<string, string> = {
	// Croissants
	"arsicault-butter-croissant": CROISSANT,
	"fondry-butter-croissant": CROISSANT,
	"arsicault-almond-croissant": ALMOND_CROISSANT,
	"lou-almond-croissant": ALMOND_CROISSANT,
	"miso-almond-croissant": ALMOND_CROISSANT,
	"pistachio-cardamom-croissant": PISTACHIO_CROISSANT,
	"cream-pan-strawberry-croissant": STRAWBERRY_CROISSANT,
	"tartine-pain-au-chocolat": PAIN_AU_CHOCOLAT,
	"pain-suisse": PAIN_AU_CHOCOLAT,
	"sourdough-croissant-61": BREAD,
	"coconut-scroll": COCONUT_PASTRY,

	// Morning buns
	"arsicault-morning-bun": MORNING_BUN,
	"tartine-morning-bun": MORNING_BUN,

	// Kouign-amann
	"republique-kouign-amann": KOUIGN_AMANN,
	"fondry-kouign-amann": KOUIGN_AMANN,
	"b-patisserie-kouign-amann": KOUIGN_AMANN,

	// Egg tart
	"golden-gate-egg-tart": EGG_TART,

	// Mochi
	"og-mochi-muffin": MOCHI,
	"ube-mochi-muffin": MOCHI,
	"butter-mochi": MOCHI,

	// Porto's
	"refugiado-guava-cheese": GUAVA_PASTRY,
	"cheese-roll": GUAVA_PASTRY,
	"potato-ball": SAVORY_PASTRY,
	"dulce-de-leche-besito": COOKIE,
	"milk-n-berries-cake": CAKE,

	// Donuts & pastries
	"republique-bomboloni": DONUT,
	"republique-caneles": CANELE,

	// Tarts
	"tartine-lemon-tart": LEMON_TART,
	"perilla-lime-tart": LEMON_TART,

	// Cookies
	"black-sesame-choc-cookie": COOKIE,
	"miso-brown-butter-cookie": COOKIE,

	// Tu Cha desserts
	"tu-cha-mango": MANGO_DESSERT,
	"tu-cha-strawberry": CAKE,

	// Brioche & financier
	"b-patisserie-bostock": FINANCIER,
	"brown-butter-financier": FINANCIER,

	// Cream Pan
	"chocolate-cornet": PAIN_AU_CHOCOLAT,
};

async function main() {
	console.log("Updating pastry photos...\n");

	let updated = 0;
	let notFound = 0;

	for (const [slug, photoUrl] of Object.entries(PASTRY_PHOTOS)) {
		const { data, error } = await supabase
			.from("pastries")
			.update({ photo_url: photoUrl })
			.eq("slug", slug)
			.select("id, name")
			.single();

		if (error || !data) {
			console.warn(`  Not found: ${slug}`);
			notFound++;
		} else {
			console.log(`  Updated: ${data.name}`);
			updated++;
		}
	}

	console.log(`\nDone: ${updated} updated, ${notFound} not found`);
}

main().catch((err) => {
	console.error("Failed:", err);
	process.exit(1);
});
