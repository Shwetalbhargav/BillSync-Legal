import { expect, test } from "@playwright/test";

const credentials = {
  name: process.env.SMOKE_LOGIN_NAME || "Nisha Sterling",
  mobile: process.env.SMOKE_LOGIN_MOBILE || "9100001001",
  password: process.env.SMOKE_LOGIN_PASSWORD || "Demo@12345",
};

const coreRoutes = [
  { path: "/app/dashboard", text: /Dashboard/i },
  { path: "/app/clients", text: /Client/i },
  { path: "/app/matters", text: /Matter/i },
  { path: "/app/invoices", text: /Invoice/i },
  { path: "/app/reports", text: /Report/i },
  { path: "/app/settings", text: /Settings|Workspace/i },
  { path: "/app/integrations/zoho", text: /Zoho|This area needs a different role/i },
];

function monitorRuntimeErrors(page) {
  const runtimeErrors = [];
  const serverErrors = [];
  page.on("pageerror", (error) => {
    runtimeErrors.push(error.message);
  });
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) {
      runtimeErrors.push(text);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  return { runtimeErrors, serverErrors };
}

async function expectUsablePage(page, expectedText) {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.locator("body")).toContainText(expectedText);
}

test("login and core app pages render without browser crashes", async ({ page }) => {
  const { runtimeErrors, serverErrors } = monitorRuntimeErrors(page);

  await page.goto("/login");
  await expectUsablePage(page, /Welcome/i);

  await page.getByPlaceholder("Your full name").fill(credentials.name);
  await page.getByPlaceholder("Registered mobile number").fill(credentials.mobile);
  await page.getByPlaceholder("Password").fill(credentials.password);
  await page.getByRole("button", { name: /Sign in to workspace/i }).click();

  try {
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15000 });
  } catch (error) {
    const visibleBodyText = await page.locator("body").innerText();
    throw new Error(`Login did not reach dashboard. Current page text:\n${visibleBodyText}`, {
      cause: error,
    });
  }
  await expectUsablePage(page, /Dashboard/i);
  await expect(page.getByRole("navigation").first()).toBeVisible();

  for (const route of coreRoutes) {
    await page.goto(route.path);
    await expectUsablePage(page, route.text);
  }

  expect(runtimeErrors, "browser console/page errors").toEqual([]);
  expect(serverErrors, "unexpected 5xx API responses").toEqual([]);
});
