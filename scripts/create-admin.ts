/**
 * Create or promote a user to admin role.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> [password]
 *
 * If the user already exists, promotes them to admin.
 * If not, creates a new user with the given email/password and sets role = 'admin'.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local or environment.
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
			if (!process.env[key]) process.env[key] = value;
		}
	} catch {}
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
	console.error("Set them in .env.local or as environment variables.");
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const email = process.argv[2];
	const password = process.argv[3];

	if (!email) {
		console.error("Usage: npx tsx scripts/create-admin.ts <email> [password]");
		console.error("");
		console.error("Examples:");
		console.error("  npx tsx scripts/create-admin.ts admin@pastrybuddy.com mypassword123");
		console.error("  npx tsx scripts/create-admin.ts existing@user.com   (promote existing user)");
		process.exit(1);
	}

	console.log(`\n=== Create Admin ===\n`);

	// Check if user already exists
	const { data: existingUsers } = await supabase.auth.admin.listUsers();
	const existing = existingUsers?.users?.find((u) => u.email === email);

	let userId: string;

	if (existing) {
		userId = existing.id;
		console.log(`Found existing user: ${email} (${userId})`);
	} else {
		if (!password) {
			console.error("User does not exist. Please provide a password to create a new account.");
			console.error(`  npx tsx scripts/create-admin.ts ${email} <password>`);
			process.exit(1);
		}

		console.log(`Creating new user: ${email}`);
		const username = email.split("@")[0].replace(/[^a-z0-9_]/g, "_");

		const { data, error } = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				username,
				display_name: "Admin",
			},
		});

		if (error) {
			console.error(`Failed to create user: ${error.message}`);
			process.exit(1);
		}

		userId = data.user.id;
		console.log(`Created user: ${email} (${userId})`);

		// Wait briefly for the profile trigger to fire
		await new Promise((r) => setTimeout(r, 1000));
	}

	// Set role to admin
	const { error: updateErr } = await supabase
		.from("profiles")
		.update({ role: "admin" })
		.eq("id", userId);

	if (updateErr) {
		console.error(`Failed to update profile: ${updateErr.message}`);
		process.exit(1);
	}

	console.log(`\n✅ ${email} is now an admin.\n`);

	// Verify
	const { data: profile } = await supabase
		.from("profiles")
		.select("id, username, role")
		.eq("id", userId)
		.single();

	if (profile) {
		console.log(`Profile: @${profile.username} | role: ${profile.role}`);
	}
}

main().catch((err) => {
	console.error("Failed:", err);
	process.exit(1);
});
