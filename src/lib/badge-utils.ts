import type { BadgeDefinition } from "@/config/badges";

interface BadgeContext {
	totalCheckins: number;
	bakeriesVisited: number;
	followers: number;
	following: number;
	listsCount: number;
	streak: number;
	hasPerfectRating: boolean;
	categoryCheckins: Record<string, number>;
}

export interface BadgeStatus {
	badge: BadgeDefinition;
	unlocked: boolean;
	progress?: { current: number; target: number };
}

export function evaluateBadges(badges: BadgeDefinition[], ctx: BadgeContext): BadgeStatus[] {
	return badges.map((badge) => {
		const criteria = badge.criteria;
		const type = criteria.type as string;

		switch (type) {
			case "checkins": {
				const target = criteria.count as number;
				return {
					badge,
					unlocked: ctx.totalCheckins >= target,
					progress: { current: Math.min(ctx.totalCheckins, target), target },
				};
			}
			case "bakeries_visited": {
				const target = criteria.count as number;
				return {
					badge,
					unlocked: ctx.bakeriesVisited >= target,
					progress: { current: Math.min(ctx.bakeriesVisited, target), target },
				};
			}
			case "countries":
				// Not tracking countries yet
				return {
					badge,
					unlocked: false,
					progress: { current: 0, target: criteria.count as number },
				};
			case "category_checkins": {
				const target = criteria.count as number;
				const cat = criteria.category as string;
				const current = ctx.categoryCheckins[cat] ?? 0;
				return {
					badge,
					unlocked: current >= target,
					progress: { current: Math.min(current, target), target },
				};
			}
			case "following": {
				const target = criteria.count as number;
				return {
					badge,
					unlocked: ctx.following >= target,
					progress: { current: Math.min(ctx.following, target), target },
				};
			}
			case "followers": {
				const target = criteria.count as number;
				return {
					badge,
					unlocked: ctx.followers >= target,
					progress: { current: Math.min(ctx.followers, target), target },
				};
			}
			case "lists_created": {
				const target = criteria.count as number;
				return {
					badge,
					unlocked: ctx.listsCount >= target,
					progress: { current: Math.min(ctx.listsCount, target), target },
				};
			}
			case "streak_days": {
				const target = criteria.count as number;
				return {
					badge,
					unlocked: ctx.streak >= target,
					progress: { current: Math.min(ctx.streak, target), target },
				};
			}
			case "rating":
				return { badge, unlocked: ctx.hasPerfectRating };
			case "all_taste_axes":
				return { badge, unlocked: false };
			case "time_before":
				return { badge, unlocked: false };
			default:
				return { badge, unlocked: false };
		}
	});
}
