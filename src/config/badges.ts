export interface BadgeDefinition {
	name: string;
	description: string;
	category: "explorer" | "category" | "social" | "streak" | "special";
	icon: string;
	criteria: Record<string, unknown>;
}

export const BADGES: BadgeDefinition[] = [
	// Explorer badges
	{
		name: "First Bite",
		description: "Log your first pastry",
		category: "explorer",
		icon: "Cookie",
		criteria: { type: "checkins", count: 1 },
	},
	{
		name: "Dozen Devotee",
		description: "Log 12 pastries",
		category: "explorer",
		icon: "Package",
		criteria: { type: "checkins", count: 12 },
	},
	{
		name: "Century Club",
		description: "Log 100 pastries",
		category: "explorer",
		icon: "Award",
		criteria: { type: "checkins", count: 100 },
	},
	{
		name: "Place Hopper",
		description: "Visit 5 different places",
		category: "explorer",
		icon: "MapPin",
		criteria: { type: "places_visited", count: 5 },
	},
	{
		name: "World Traveler",
		description: "Log pastries from 3 different countries",
		category: "explorer",
		icon: "Globe",
		criteria: { type: "countries", count: 3 },
	},

	// Category badges
	{
		name: "Croissant Connoisseur",
		description: "Log 10 croissants",
		category: "category",
		icon: "Croissant",
		criteria: { type: "category_checkins", category: "Croissants", count: 10 },
	},
	{
		name: "Cookie Monster",
		description: "Log 10 cookies",
		category: "category",
		icon: "Cookie",
		criteria: { type: "category_checkins", category: "Cookies", count: 10 },
	},
	{
		name: "Cake Boss",
		description: "Log 10 cakes",
		category: "category",
		icon: "CakeSlice",
		criteria: { type: "category_checkins", category: "Cakes", count: 10 },
	},
	{
		name: "Tart Aficionado",
		description: "Log 10 tarts",
		category: "category",
		icon: "Cherry",
		criteria: { type: "category_checkins", category: "Tarts", count: 10 },
	},

	// Social badges
	{
		name: "Social Butterfly",
		description: "Follow 5 other tasters",
		category: "social",
		icon: "Users",
		criteria: { type: "following", count: 5 },
	},
	{
		name: "Trendsetter",
		description: "Get 10 followers",
		category: "social",
		icon: "Star",
		criteria: { type: "followers", count: 10 },
	},
	{
		name: "List Maker",
		description: "Create your first list",
		category: "social",
		icon: "ListOrdered",
		criteria: { type: "lists_created", count: 1 },
	},

	// Streak badges
	{
		name: "Weekly Regular",
		description: "Log pastries 7 days in a row",
		category: "streak",
		icon: "Flame",
		criteria: { type: "streak_days", count: 7 },
	},
	{
		name: "Monthly Devotion",
		description: "Log pastries 30 days in a row",
		category: "streak",
		icon: "Zap",
		criteria: { type: "streak_days", count: 30 },
	},

	// Special badges
	{
		name: "Flavor Scholar",
		description: "Use all 6 taste axes in a single review",
		category: "special",
		icon: "Palette",
		criteria: { type: "all_taste_axes" },
	},
	{
		name: "Early Riser",
		description: "Log a pastry before 7 AM",
		category: "special",
		icon: "Sunrise",
		criteria: { type: "time_before", hour: 7 },
	},
	{
		name: "Perfectionist",
		description: "Give a pastry a perfect 5-star rating",
		category: "special",
		icon: "Sparkles",
		criteria: { type: "rating", value: 5 },
	},
];
