import { expect, test } from "@playwright/test";

const TOKYO_NOW = "2026-07-29T12:00:00+09:00";

async function useFixedDate(page, isoDate = TOKYO_NOW) {
  await page.addInitScript(({ isoDate }) => {
    const NativeDate = Date;
    const fixedTime = new NativeDate(isoDate).valueOf();

    class FixedDate extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedTime]));
      }

      static now() {
        return fixedTime;
      }
    }

    window.Date = FixedDate;
  }, { isoDate });
}

async function openApp(page, path = "/") {
  await useFixedDate(page);
  await page.goto(path, { waitUntil: "networkidle" });
}

function dayHeading(page, name) {
  return page.getByRole("heading", { level: 2, name });
}

test.describe("travel-first mobile itinerary", () => {
  test("opens the current Tokyo trip day", async ({ page }) => {
    await openApp(page);

    await expect(dayHeading(page, "Yorushika 橫濱演出日")).toBeVisible();
    await expect(page.locator(".date-pill.active")).toContainText("29");
  });

  test("a valid date hash overrides the current Tokyo date", async ({ page }) => {
    await openApp(page, "/#2026-07-31");

    await expect(dayHeading(page, "東京最後採買與夜間演出")).toBeVisible();
    await expect(page.locator(".date-pill.active")).toContainText("31");
  });

  test("selecting a date updates the shareable hash", async ({ page }) => {
    await openApp(page);

    await page.locator(".date-pill").filter({ hasText: "31" }).click();

    await expect(page).toHaveURL(/#2026-07-31$/);
    await expect(dayHeading(page, "東京最後採買與夜間演出")).toBeVisible();
  });

  test("keeps the four primary tabs inside the mobile viewport", async ({ page }) => {
    await openApp(page);
    const navigation = page.getByRole("navigation", { name: "旅行資訊分類" });
    const buttons = navigation.getByRole("button");

    await expect(buttons).toHaveCount(4);
    await expect(buttons).toHaveText(["行程", "票券與訂位", "演出", "行前"]);

    const layout = await navigation.evaluate((element) => {
      const container = element.getBoundingClientRect();
      const children = Array.from(element.querySelectorAll("button"));
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        allButtonsInside: children.every((button) => {
          const bounds = button.getBoundingClientRect();
          return bounds.left >= container.left - 1 && bounds.right <= container.right + 1;
        }),
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.allButtonsInside).toBe(true);
  });

  test("shows the complete 7/31 planetarium performance without generic festival copy", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "演出", exact: true }).click();
    const view = page.locator(".info-card");

    await expect(view).toContainText("7月31日");
    await expect(view).toContainText(/Regal Lily[\s\S]*LIVE in the DARK/);
    await expect(view).toContainText(/Konica Minolta[\s\S]*天文館/);
    await expect(view).not.toContainText("Naeba Ready");
    await expect(view).not.toContainText("雨天預案");
    await expect(view).not.toContainText("苗場山區天氣變化快");
  });

  test("jumping from a performance leaves the destination day heading visible", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "演出", exact: true }).click();

    const performance = page.locator("article").filter({ hasText: "Regal Lily" }).first();
    await performance.scrollIntoViewIfNeeded();
    await performance.getByRole("button", { name: /查看.*Regal Lily.*行程/ }).click();

    const heading = dayHeading(page, "東京最後採買與夜間演出");
    await expect(heading).toBeVisible();
    await expect(heading).toBeInViewport({ ratio: 1 });
  });

  test("booking summary retains the MM860 schedule and flight description", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "票券與訂位", exact: true }).click();

    const booking = page.locator("article").filter({ hasText: "MM860" }).first();
    await expect(booking).toContainText("20:00–21:00");
    await expect(booking).toContainText("20:25 TPE - 00:45 HND");
  });

  test("groups consecutive hotel nights into compact stay ranges", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "票券與訂位", exact: true }).click();

    const crystalInn = page.locator("article").filter({ hasText: "Crystal Inn Naeba" });
    const nesto = page.locator("article").filter({ hasText: "NESTo KAMATA" });
    await expect(crystalInn).toHaveCount(1);
    await expect(crystalInn).toContainText("7月23日–7月26日");
    await expect(nesto).toHaveCount(1);
    await expect(nesto).toContainText("7月27日–7月31日");
  });

  test("does not request Google Fonts or Font Awesome", async ({ page }) => {
    const forbiddenRequests = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("fonts.googleapis.com") ||
        url.includes("fonts.gstatic.com") ||
        url.includes("font-awesome") ||
        url.includes("fontawesome")
      ) {
        forbiddenRequests.push(url);
      }
    });

    await openApp(page);

    expect(forbiddenRequests).toEqual([]);
  });

  test("recovers from a malformed shared-date hash", async ({ page }) => {
    await openApp(page, "/#%");

    await expect(dayHeading(page, "Yorushika 橫濱演出日")).toBeVisible();
    await expect(page).toHaveURL(/#2026-07-29$/);
  });

  test("keeps the accommodation map available after removing duplicate hotel cards", async ({ page }) => {
    await openApp(page);

    const hotelMap = page.getByRole("link", { name: /住宿地圖：NESTo KAMATA/ });
    await expect(hotelMap).toBeVisible();
    await expect(hotelMap).toHaveAttribute("href", /google\.com\/maps\/search/);
  });

  test("opens authored reservation details", async ({ page }) => {
    await openApp(page, "/#2026-07-27");

    const route = page.locator("article").filter({ hasText: "Toyota 租車與越後妻有藝術祭路線" });
    const toggle = route.getByRole("button", { name: "訂單與確認資訊" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(route.locator(".tip-body")).toBeVisible();
  });

  test("persists the travel checklist locally", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "行前", exact: true }).click();

    const passport = page.getByRole("checkbox", { name: "護照", exact: true });
    await passport.locator("..").click();
    await expect(passport).toBeChecked();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "行前", exact: true }).click();

    await expect(page.getByRole("checkbox", { name: "護照", exact: true })).toBeChecked();
  });
});
