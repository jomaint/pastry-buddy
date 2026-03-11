/**
 * Seed script: creates staff accounts, check-ins, featured pastries, and follows.
 *
 * Usage:  npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
 * in env vars or .env.local.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	} catch {
		// .env.local is optional if vars are already set
	}
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error(
		"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local or env vars.",
	);
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Staff accounts
// ---------------------------------------------------------------------------

const STAFF_USERS = [
	{
		username: "pastrybuddy",
		display_name: "Pastry Buddy",
		email: "staff+pastrybuddy@pastrybuddy.app",
		password: "staff-seed-password-001!",
		bio: "Official staff account. We find the best pastries so you don't have to.",
		level: 5,
		xp: 480,
		favorite_categories: ["Croissants", "Kouign-amann", "Tarts", "Mochi"],
	},
	{
		username: "bakerscout",
		display_name: "Baker Scout",
		email: "staff+bakerscout@pastrybuddy.app",
		password: "staff-seed-password-002!",
		bio: "Scouting California's best bakeries one croissant at a time.",
		level: 4,
		xp: 360,
		favorite_categories: ["Croissants", "Bread", "Brioche"],
	},
	{
		username: "crumbtrail",
		display_name: "Crumb Trail",
		email: "staff+crumbtrail@pastrybuddy.app",
		password: "staff-seed-password-003!",
		bio: "Following the crumbs to hidden gems.",
		level: 3,
		xp: 250,
		favorite_categories: ["Cookies", "Cakes", "Tarts"],
	},
	{
		username: "flourpower",
		display_name: "Flour Power",
		email: "staff+flourpower@pastrybuddy.app",
		password: "staff-seed-password-004!",
		bio: "Powered by butter, sugar, and curiosity.",
		level: 4,
		xp: 310,
		favorite_categories: ["Donuts", "Mochi", "Empanadas", "Cakes"],
	},
];

// ---------------------------------------------------------------------------
// Check-in data
// ---------------------------------------------------------------------------

/** Days ago → ISO timestamp */
function daysAgo(days: number, hour = 9): string {
	const d = new Date();
	d.setDate(d.getDate() - days);
	d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
	return d.toISOString();
}

// Each entry: [staffIndex, pastrySlug, rating, notes, flavorTags, daysAgo, hour]
const CHECKIN_DATA: [number, string, number, string, string[], number, number][] = [
	// pastrybuddy
	[
		0,
		"arsicault-butter-croissant",
		5,
		"The GOAT. Every layer shatters into buttery perfection.",
		["Butter", "Flaky"],
		1,
		8,
	],
	[
		0,
		"republique-kouign-amann",
		5,
		"Caramelized crust that cracks like cr\u00e8me br\u00fbl\u00e9e. James Beard-worthy.",
		["Butter", "Caramelized"],
		2,
		9,
	],
	[
		0,
		"tartine-morning-bun",
		5,
		"Cinnamon-sugar with a lemon twist. Tartine's signature for a reason.",
		["Cinnamon", "Lemon"],
		3,
		7,
	],
	[
		0,
		"og-mochi-muffin",
		4,
		"Crunchy shell, impossibly chewy inside. Third Culture started something.",
		["Chewy", "Crunchy"],
		4,
		10,
	],
	[
		0,
		"pistachio-cardamom-croissant",
		5,
		"The pistachio trend done right. Cardamom makes it sing.",
		["Pistachio", "Cardamom"],
		5,
		9,
	],
	[
		0,
		"fondry-kouign-amann",
		5,
		"Pulls apart like yarn. Fondry might have the best in LA.",
		["Butter", "Caramelized"],
		6,
		8,
	],
	[
		0,
		"golden-gate-egg-tart",
		5,
		"Worth gambling on whether they're open. Silky custard, flaky shell.",
		["Vanilla", "Butter"],
		8,
		11,
	],
	[
		0,
		"cream-pan-strawberry-croissant",
		4,
		"Japanese-French precision. Fresh strawberries and custard cream.",
		["Strawberry", "Creamy"],
		10,
		9,
	],
	[
		0,
		"b-patisserie-kouign-amann",
		5,
		"The definitive California kouign-amann. Thick caramelized crust.",
		["Butter", "Caramelized"],
		12,
		8,
	],
	[
		0,
		"refugiado-guava-cheese",
		5,
		"The thing people stock up on. Guava-to-cheese ratio is always perfect.",
		["Guava", "Butter"],
		13,
		10,
	],

	// bakerscout
	[
		1,
		"arsicault-butter-croissant",
		5,
		"Bon App\u00e9tit was right. Best croissant in America.",
		["Butter", "Flaky"],
		1,
		7,
	],
	[
		1,
		"fondry-butter-croissant",
		5,
		"Serious butter game. Deeply caramelized and perfectly laminated.",
		["Butter", "Flaky", "Caramelized"],
		2,
		8,
	],
	[
		1,
		"lou-almond-croissant",
		5,
		"Pre-order only and worth every minute of planning.",
		["Almond", "Butter"],
		3,
		9,
	],
	[
		1,
		"tartine-pain-au-chocolat",
		4,
		"Double the chocolate, extra brown. Sells out by noon for a reason.",
		["Chocolate", "Butter"],
		4,
		7,
	],
	[
		1,
		"sourdough-croissant-61",
		5,
		"OC's answer to Tartine. The sourdough tang with that lamination.",
		["Sourdough", "Butter", "Flaky"],
		5,
		10,
	],
	[
		1,
		"pain-suisse",
		4,
		"Swiss-French classic done beautifully at B Patisserie.",
		["Chocolate", "Creamy"],
		7,
		9,
	],
	[
		1,
		"arsicault-morning-bun",
		4,
		"Orange zest and cinnamon sugar. Caramelized and addictive.",
		["Cinnamon", "Butter"],
		9,
		8,
	],
	[
		1,
		"coconut-scroll",
		5,
		"Peak SF. Chinese cocktail bun meets French lamination. Genius.",
		["Coconut", "Butter", "Layered"],
		11,
		9,
	],
	[
		1,
		"miso-almond-croissant",
		5,
		"Sweet-savory umami in a croissant. R\u00e9publique is on another level.",
		["Almond", "Miso Caramel"],
		13,
		8,
	],

	// crumbtrail
	[
		2,
		"golden-gate-egg-tart",
		5,
		"Chinatown legend. The custard is impossibly silky.",
		["Vanilla", "Butter"],
		1,
		10,
	],
	[
		2,
		"dulce-de-leche-besito",
		4,
		"Shortbread + dulce de leche = dangerous combo.",
		["Dulce de Leche", "Butter"],
		2,
		14,
	],
	[
		2,
		"tartine-lemon-tart",
		4,
		"Bright, tangy, perfectly balanced. Classic Tartine.",
		["Lemon", "Butter"],
		3,
		11,
	],
	[
		2,
		"republique-caneles",
		5,
		"Crispy caramelized shell, soft rum-vanilla center. Bordeaux in LA.",
		["Vanilla", "Caramelized"],
		5,
		15,
	],
	[
		2,
		"miso-brown-butter-cookie",
		4,
		"Sweet-savory with those caramelized edges. Modu does cookies right.",
		["Brown Butter", "Miso Caramel"],
		6,
		13,
	],
	[
		2,
		"black-sesame-choc-cookie",
		4,
		"Korean-California fusion at its best. Spongy and totally unique.",
		["Black Sesame", "Chocolate"],
		8,
		14,
	],
	[
		2,
		"perilla-lime-tart",
		5,
		"Herbaceous and refreshing. Nothing else like it.",
		["Lemon", "Butter"],
		10,
		11,
	],
	[
		2,
		"b-patisserie-bostock",
		4,
		"Twice-baked brioche with orange blossom. Subtle and lovely.",
		["Almond", "Honey"],
		12,
		10,
	],
	[
		2,
		"brown-butter-financier",
		4,
		"Nutty brown butter, crispy edges. Simple and perfect.",
		["Brown Butter", "Almond"],
		13,
		15,
	],

	// flourpower
	[
		3,
		"refugiado-guava-cheese",
		5,
		"Picked up two dozen. Zero regrets.",
		["Guava", "Butter"],
		1,
		11,
	],
	[
		3,
		"potato-ball",
		5,
		"Crispy panko, seasoned picadillo. Savory perfection.",
		["Crunchy", "Butter"],
		2,
		12,
	],
	[
		3,
		"tu-cha-mango",
		5,
		"Almost too pretty to eat. The mango mousse inside is absurdly good.",
		["Passionfruit", "Chocolate"],
		3,
		14,
	],
	[
		3,
		"tu-cha-strawberry",
		4,
		"The realistic strawberry shape! And the mousse is incredible.",
		["Strawberry", "Creamy"],
		4,
		15,
	],
	[
		3,
		"ube-mochi-muffin",
		5,
		"Purple yam magic. Same legendary chew, vibrant color.",
		["Ube", "Chewy"],
		6,
		10,
	],
	[
		3,
		"og-mochi-muffin",
		5,
		"The OG since 2016. Crunchy outside, impossibly chewy inside.",
		["Chewy", "Crunchy"],
		7,
		10,
	],
	[
		3,
		"republique-bomboloni",
		4,
		"Pillowy Italian doughnuts. The pastry cream filling is on point.",
		["Vanilla", "Creamy"],
		8,
		9,
	],
	[
		3,
		"milk-n-berries-cake",
		4,
		"Light sponge, fresh berries, whipped cream. Porto's bestseller for a reason.",
		["Strawberry", "Creamy"],
		10,
		13,
	],
	[
		3,
		"cheese-roll",
		5,
		"Cream cheese puff pastry with caramelized sugar crust. Addictive.",
		["Butter", "Caramelized"],
		11,
		11,
	],
	[
		3,
		"butter-mochi",
		4,
		"Hawaiian-French crossover. Chewy, buttery, crispy edge.",
		["Butter", "Chewy"],
		13,
		10,
	],
	[
		3,
		"chocolate-cornet",
		4,
		"Horn-shaped bread with rich chocolate cream. Worth the drive to Tustin.",
		["Chocolate", "Creamy"],
		14,
		9,
	],
];

// ---------------------------------------------------------------------------
// Featured pastry slugs
// ---------------------------------------------------------------------------

const FEATURED_SLUGS = [
	"arsicault-butter-croissant",
	"republique-kouign-amann",
	"fondry-kouign-amann",
	"tartine-morning-bun",
	"og-mochi-muffin",
	"refugiado-guava-cheese",
	"cream-pan-strawberry-croissant",
	"golden-gate-egg-tart",
	"b-patisserie-kouign-amann",
	"pistachio-cardamom-croissant",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log("--- Pastry Buddy Seed Script ---\n");

	// Idempotency check
	const { data: existingStaff } = await supabase
		.from("profiles")
		.select("username")
		.eq("username", "pastrybuddy")
		.maybeSingle();

	if (existingStaff) {
		console.log("Staff user @pastrybuddy already exists. Skipping seed (idempotent).");
		return;
	}

	// Step 1: Create staff auth users
	console.log("Step 1: Creating staff auth users...");
	const staffUserIds: string[] = [];

	for (const staff of STAFF_USERS) {
		const { data, error } = await supabase.auth.admin.createUser({
			email: staff.email,
			password: staff.password,
			email_confirm: true,
			user_metadata: {
				username: staff.username,
				display_name: staff.display_name,
			},
		});

		if (error) {
			console.error(`  Failed to create ${staff.username}:`, error.message);
			process.exit(1);
		}

		const userId = data.user.id;
		staffUserIds.push(userId);

		// Update auto-created profile
		const { error: profileErr } = await supabase
			.from("profiles")
			.update({
				role: "staff",
				bio: staff.bio,
				level: staff.level,
				xp: staff.xp,
				favorite_categories: staff.favorite_categories,
				onboarding_completed: true,
				onboarding_step: "done",
			})
			.eq("id", userId);

		if (profileErr) {
			console.error(`  Failed to update profile for ${staff.username}:`, profileErr.message);
			process.exit(1);
		}

		console.log(`  Created @${staff.username} (${userId})`);
	}

	// Step 2: Look up pastry IDs by slug
	console.log("\nStep 2: Inserting check-ins...");

	const slugsNeeded = [...new Set(CHECKIN_DATA.map(([, slug]) => slug))];
	const { data: pastryRows, error: pastryErr } = await supabase
		.from("pastries")
		.select("id, slug, place_id")
		.in("slug", slugsNeeded);

	if (pastryErr || !pastryRows) {
		console.error("  Failed to look up pastries:", pastryErr?.message);
		process.exit(1);
	}

	const pastryBySlug = new Map(pastryRows.map((p) => [p.slug, p]));

	// Insert check-ins
	const checkInsToInsert = [];
	for (const [staffIdx, slug, rating, notes, flavorTags, days, hour] of CHECKIN_DATA) {
		const pastry = pastryBySlug.get(slug);
		if (!pastry) {
			console.warn(`  Pastry not found: ${slug} — skipping`);
			continue;
		}

		checkInsToInsert.push({
			user_id: staffUserIds[staffIdx],
			pastry_id: pastry.id,
			place_id: pastry.place_id,
			rating,
			notes,
			flavor_tags: flavorTags,
			created_at: daysAgo(days, hour),
		});
	}

	const { error: checkinErr } = await supabase.from("check_ins").insert(checkInsToInsert);

	if (checkinErr) {
		console.error("  Failed to insert check-ins:", checkinErr.message);
		process.exit(1);
	}

	console.log(`  Inserted ${checkInsToInsert.length} check-ins`);

	// Step 3: Set featured pastries
	console.log("\nStep 3: Setting featured pastries...");

	const { error: featuredErr } = await supabase
		.from("pastries")
		.update({ featured: true })
		.in("slug", FEATURED_SLUGS);

	if (featuredErr) {
		console.error("  Failed to set featured:", featuredErr.message);
		process.exit(1);
	}

	console.log(`  Marked ${FEATURED_SLUGS.length} pastries as featured`);

	// Step 4: Create follows between staff users
	console.log("\nStep 4: Creating staff follows...");

	const followsToInsert = [];
	for (let i = 0; i < staffUserIds.length; i++) {
		for (let j = 0; j < staffUserIds.length; j++) {
			if (i !== j) {
				followsToInsert.push({
					follower_id: staffUserIds[i],
					following_id: staffUserIds[j],
				});
			}
		}
	}

	const { error: followErr } = await supabase.from("follows").insert(followsToInsert);

	if (followErr) {
		console.error("  Failed to create follows:", followErr.message);
		process.exit(1);
	}

	console.log(`  Created ${followsToInsert.length} follow relationships`);

	console.log("\n--- Seed complete! ---");
	console.log(`  ${staffUserIds.length} staff users`);
	console.log(`  ${checkInsToInsert.length} check-ins`);
	console.log(`  ${FEATURED_SLUGS.length} featured pastries`);
	console.log(`  ${followsToInsert.length} follows`);
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
