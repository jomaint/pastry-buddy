import { expect, test } from "@playwright/test";

test.describe("Navigation guards", () => {
	test("protected route /lists redirects to sign-in", async ({ page }) => {
		await page.goto("/lists");
		await page.waitForURL(/\/sign-in/, { timeout: 10000 });
		await expect(page).toHaveURL(/\/sign-in/);
	});

	test("/log page loads for guests", async ({ page }) => {
		const response = await page.goto("/log");
		expect(response?.status()).toBeLessThan(500);
	});
});
