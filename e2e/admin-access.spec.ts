import { expect, test } from "@playwright/test";

test.describe("Admin access control", () => {
	test("unauthenticated user is redirected from /admin to /sign-in", async ({ page }) => {
		await page.goto("/admin");
		// Should redirect to sign-in (middleware guard)
		await page.waitForURL(/\/sign-in/);
		await expect(page).toHaveURL(/\/sign-in/);
	});

	test("unauthenticated user is redirected from /admin/users", async ({ page }) => {
		await page.goto("/admin/users");
		await page.waitForURL(/\/sign-in/);
		await expect(page).toHaveURL(/\/sign-in/);
	});

	test("unauthenticated user is redirected from /admin/pastries", async ({ page }) => {
		await page.goto("/admin/pastries");
		await page.waitForURL(/\/sign-in/);
		await expect(page).toHaveURL(/\/sign-in/);
	});
});
