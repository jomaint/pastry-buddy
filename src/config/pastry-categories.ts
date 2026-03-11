export interface PastryCategory {
	name: string;
	icon: string;
}

export type CategoryGroup = "pastries" | "coffee" | "bread" | "savory";

export interface PastryCategoryWithGroup extends PastryCategory {
	group: CategoryGroup;
}

export const CATEGORY_GROUPS: { key: CategoryGroup; label: string; emoji: string }[] = [
	{ key: "pastries", label: "Pastries", emoji: "🥐" },
	{ key: "coffee", label: "Coffee", emoji: "☕" },
	{ key: "bread", label: "Bread", emoji: "🍞" },
	{ key: "savory", label: "Savory", emoji: "🥪" },
];

export const PASTRY_CATEGORIES: PastryCategoryWithGroup[] = [
	// Pastries
	{ name: "Croissants", icon: "Croissant", group: "pastries" },
	{ name: "Cookies", icon: "Cookie", group: "pastries" },
	{ name: "Cakes", icon: "CakeSlice", group: "pastries" },
	{ name: "Tarts", icon: "Cherry", group: "pastries" },
	{ name: "Donuts", icon: "Circle", group: "pastries" },
	{ name: "Pies", icon: "PieChart", group: "pastries" },
	{ name: "Macarons", icon: "Circle", group: "pastries" },
	{ name: "Mochi", icon: "Circle", group: "pastries" },
	{ name: "Muffins", icon: "CupSoda", group: "pastries" },
	{ name: "Scones", icon: "Triangle", group: "pastries" },
	{ name: "Brownies", icon: "Square", group: "pastries" },
	{ name: "Eclairs & Choux", icon: "Droplet", group: "pastries" },
	{ name: "Kouign-amann", icon: "Flame", group: "pastries" },
	{ name: "Conchas", icon: "Shell", group: "pastries" },
	{ name: "Danish", icon: "Flower", group: "pastries" },
	{ name: "Cinnamon Rolls", icon: "RefreshCw", group: "pastries" },
	{ name: "Brioche", icon: "Egg", group: "pastries" },
	// Coffee
	{ name: "Espresso", icon: "Coffee", group: "coffee" },
	{ name: "Latte", icon: "Coffee", group: "coffee" },
	{ name: "Cappuccino", icon: "Coffee", group: "coffee" },
	{ name: "Pour Over", icon: "Coffee", group: "coffee" },
	{ name: "Cold Brew", icon: "Coffee", group: "coffee" },
	{ name: "Matcha Latte", icon: "Coffee", group: "coffee" },
	{ name: "Chai", icon: "Coffee", group: "coffee" },
	{ name: "Hot Chocolate", icon: "Coffee", group: "coffee" },
	// Bread
	{ name: "Sourdough", icon: "Wheat", group: "bread" },
	{ name: "Baguette", icon: "Wheat", group: "bread" },
	{ name: "Focaccia", icon: "Wheat", group: "bread" },
	{ name: "Ciabatta", icon: "Wheat", group: "bread" },
	{ name: "Rye", icon: "Wheat", group: "bread" },
	{ name: "Challah", icon: "Wheat", group: "bread" },
	{ name: "Milk Bread", icon: "Wheat", group: "bread" },
	// Savory
	{ name: "Quiche", icon: "Sandwich", group: "savory" },
	{ name: "Tartine", icon: "Sandwich", group: "savory" },
	{ name: "Empanadas", icon: "Sandwich", group: "savory" },
	{ name: "Sausage Roll", icon: "Sandwich", group: "savory" },
	{ name: "Sandwich", icon: "Sandwich", group: "savory" },
	{ name: "Savory Scone", icon: "Triangle", group: "savory" },
];

export const FLAVOR_TAGS = [
	"Butter",
	"Almond",
	"Chocolate",
	"Pistachio",
	"Matcha",
	"Ube",
	"Brown Butter",
	"Sourdough",
	"Black Sesame",
	"Hojicha",
	"Earl Grey",
	"Guava",
	"Yuzu",
	"Miso Caramel",
	"Passionfruit",
	"Tahini",
	"Cinnamon",
	"Vanilla",
	"Lemon",
	"Raspberry",
	"Strawberry",
	"Coconut",
	"Corn Masa",
	"Dulce de Leche",
	"Olive Oil",
	"Honey",
	"Cardamom",
	"Fig",
] as const;

export const TEXTURE_TAGS = [
	"Flaky",
	"Crispy",
	"Gooey",
	"Chewy",
	"Pillowy",
	"Buttery",
	"Crunchy",
	"Creamy",
	"Tender",
	"Caramelized",
	"Underbaked",
	"Sticky",
	"Crackly",
	"Pull-apart",
	"Layered",
] as const;
