/**
 * Category-specific flavor tag ordering.
 * Tags listed here get promoted to the top when a pastry in that category is selected.
 */
export const CATEGORY_FLAVOR_PRIORITY: Record<string, string[]> = {
	Croissants: ["Butter", "Almond", "Chocolate", "Pistachio", "Brown Butter", "Vanilla"],
	Cookies: ["Chocolate", "Vanilla", "Brown Butter", "Cinnamon", "Lemon", "Matcha"],
	Cakes: ["Chocolate", "Vanilla", "Strawberry", "Lemon", "Raspberry", "Coconut"],
	Tarts: ["Lemon", "Raspberry", "Pistachio", "Vanilla", "Fig", "Passionfruit"],
	Bread: ["Sourdough", "Olive Oil", "Honey", "Cinnamon", "Butter", "Corn Masa"],
	Donuts: ["Chocolate", "Vanilla", "Cinnamon", "Matcha", "Ube", "Dulce de Leche"],
	Pies: ["Cinnamon", "Vanilla", "Lemon", "Strawberry", "Honey", "Brown Butter"],
	Macarons: ["Pistachio", "Raspberry", "Matcha", "Earl Grey", "Yuzu", "Passionfruit"],
	Mochi: ["Matcha", "Ube", "Black Sesame", "Strawberry", "Hojicha", "Coconut"],
	Muffins: ["Lemon", "Chocolate", "Vanilla", "Cinnamon", "Honey", "Raspberry"],
	Scones: ["Lemon", "Earl Grey", "Vanilla", "Honey", "Cardamom", "Fig"],
	Brownies: ["Chocolate", "Brown Butter", "Tahini", "Miso Caramel", "Vanilla", "Pistachio"],
	"Eclairs & Choux": ["Vanilla", "Chocolate", "Pistachio", "Matcha", "Passionfruit", "Earl Grey"],
	"Kouign-amann": ["Butter", "Brown Butter", "Vanilla", "Almond", "Honey", "Cinnamon"],
	Conchas: ["Vanilla", "Chocolate", "Cinnamon", "Coconut", "Corn Masa", "Dulce de Leche"],
	Empanadas: ["Guava", "Dulce de Leche", "Cinnamon", "Coconut", "Corn Masa", "Vanilla"],
	Danish: ["Almond", "Vanilla", "Lemon", "Raspberry", "Butter", "Cardamom"],
	"Cinnamon Rolls": ["Cinnamon", "Brown Butter", "Vanilla", "Cardamom", "Honey", "Dulce de Leche"],
	Brioche: ["Butter", "Vanilla", "Chocolate", "Brown Butter", "Honey", "Almond"],
};

/**
 * Returns FLAVOR_TAGS reordered with category-relevant tags first.
 */
export function getContextualFlavors(allFlavors: readonly string[], category?: string): string[] {
	if (!category) return [...allFlavors];

	const prioritized = CATEGORY_FLAVOR_PRIORITY[category] ?? [];
	const prioritizedSet = new Set(prioritized);
	const rest = allFlavors.filter((f) => !prioritizedSet.has(f));

	return [...prioritized, ...rest];
}
