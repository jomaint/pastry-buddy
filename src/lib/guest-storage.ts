/**
 * Guest check-in storage — persists up to 2 check-ins in localStorage
 * before the user creates an account. On signup, these migrate to Supabase.
 */

const GUEST_KEY = "pb_guest_checkins";
const GUEST_MAX = 2;

export type GuestCheckIn = {
	id: string;
	pastry_name: string;
	pastry_category: string;
	place_name: string;
	place_city: string | null;
	rating: number;
	notes: string | null;
	flavor_tags: string[];
	created_at: string;
	// IDs for migration (may be temporary/custom)
	pastry_id: string;
	place_id: string;
};

function isBrowser(): boolean {
	return typeof window !== "undefined";
}

export function getGuestCheckIns(): GuestCheckIn[] {
	if (!isBrowser()) return [];
	try {
		const raw = localStorage.getItem(GUEST_KEY);
		return raw ? (JSON.parse(raw) as GuestCheckIn[]) : [];
	} catch {
		return [];
	}
}

export function addGuestCheckIn(checkin: GuestCheckIn): {
	success: boolean;
	atLimit: boolean;
} {
	const existing = getGuestCheckIns();
	if (existing.length >= GUEST_MAX) {
		return { success: false, atLimit: true };
	}
	existing.push(checkin);
	localStorage.setItem(GUEST_KEY, JSON.stringify(existing));
	return { success: true, atLimit: existing.length >= GUEST_MAX };
}

export function getGuestCheckInCount(): number {
	return getGuestCheckIns().length;
}

export function isGuestAtLimit(): boolean {
	return getGuestCheckIns().length >= GUEST_MAX;
}

export function clearGuestCheckIns(): void {
	if (!isBrowser()) return;
	localStorage.removeItem(GUEST_KEY);
}

export { GUEST_MAX };
