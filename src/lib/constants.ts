export const LEVELS = [
	"Curious Nibbler",
	"Sweet Tooth",
	"Dough Explorer",
	"Crumb Chaser",
	"Pastry Enthusiast",
	"Connoisseur",
	"Artisan Taster",
	"Master Baker's Judge",
	"Golden Palate",
	"Pastry Legend",
] as const;

export const XP_SOURCES = {
	LOG_PASTRY: 10,
	RANK_COMPARISON: 5,
	TAG_FLAVORS: 2,
	NEW_PLACE: 15,
	BADGE_UNLOCK: 20,
	WEEKLY_STREAK: 25,
} as const;

export const TASTE_AXES = ["Sweet", "Buttery", "Fruity", "Chocolatey", "Nutty", "Savory"] as const;

export const NAV_ITEMS = [
	{ label: "Feed", href: "/", icon: "Home" },
	{ label: "Discover", href: "/discover", icon: "Search" },
	{ label: "Log", href: "/log", icon: "PlusCircle" },
	{ label: "Lists", href: "/lists", icon: "Bookmark" },
	{ label: "Profile", href: "/profile", icon: "User" },
] as const;
