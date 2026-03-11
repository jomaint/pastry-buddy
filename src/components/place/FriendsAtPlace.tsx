"use client";

import { useAuth } from "@/api/auth";
import { useFriendsAtPlace } from "@/api/social";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";

export function FriendsAtPlace({ placeId }: { placeId: string }) {
	const { data: auth } = useAuth();
	const isAuthenticated = auth?.isAuthenticated ?? false;
	const { data: friends } = useFriendsAtPlace(placeId);

	// Not authenticated: show CTA
	if (!isAuthenticated) {
		return (
			<div className="rounded-card bg-parchment/40 px-4 py-3">
				<p className="text-sm text-sesame">
					<Link href="/sign-up" className="font-medium text-brioche hover:text-brioche/80">
						Sign up
					</Link>{" "}
					to see what friends think
				</p>
			</div>
		);
	}

	// No friends visited — hide entirely
	if (!friends || friends.length === 0) return null;

	// Build copy
	const names = friends.map((f) => f.display_name || `@${f.username}`);
	let copy: string;
	if (names.length === 1) {
		copy = `${names[0]} has been here`;
	} else if (names.length === 2) {
		copy = `${names[0]} and ${names[1]} have been here`;
	} else {
		copy = `${names[0]} and ${names.length - 1} others have been here`;
	}

	return (
		<div className="flex items-center gap-3 rounded-card bg-parchment/40 px-4 py-3">
			{/* Stacked avatars */}
			<div className="flex -space-x-2">
				{friends.slice(0, 3).map((friend) => (
					<Avatar
						key={friend.user_id}
						src={friend.avatar_url}
						name={friend.display_name || friend.username}
						size="sm"
						className="ring-2 ring-creme"
					/>
				))}
			</div>
			<p className="text-sm text-espresso">{copy}</p>
		</div>
	);
}
