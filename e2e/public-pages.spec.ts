import { expect, test } from "@playwright/test";

test.describe("Public pages load without crashing", () => {
	test("home page responds without 500", async ({ page }) => {
		const response = await page.goto("/");
		// Allow 200 (healthy) or client-side rendered states
		// 500 indicates a server-side crash we want to catch
		expect(response?.status()).not.toBe(500);
	});

	test("discover page responds without 500", async ({ page }) => {
		const response = await page.goto("/discover");
		expect(response?.status()).not.toBe(500);
	});

	test("leaderboard page responds without 500", async ({ page }) => {
		const response = await page.goto("/leaderboard");
		expect(response?.status()).not.toBe(500);
	});

	test("sign-in page renders", async ({ page }) => {
		await page.goto("/sign-in");
		await expect(page.locator("text=Sign In").first()).toBeVisible();
	});

	test("sign-up page renders", async ({ page }) => {
		await page.goto("/sign-up");
		await expect(page.locator("text=Sign Up").first()).toBeVisible();
	});
});
