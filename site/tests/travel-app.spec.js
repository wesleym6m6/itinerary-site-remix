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

  test("keeps an overnight merged schedule on the prior operational day", async ({ page }) => {
    await useFixedDate(page, "2026-07-24T01:00:00+09:00");
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(dayHeading(page, "東京集合・前往苗場")).toBeVisible();
    await expect(page.locator(".date-pill.active")).toContainText("23");
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
    await expect(view).toContainText(/Konica Minolta[\s\S]*Planetarium Tenku/);
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
    await expect(booking).toContainText("20:00–翌日 00:00");
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

  test("renders both merged-cell Yorushika dates and the new Frieren concert", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "演出", exact: true }).click();

    const yorushika = page.locator("article").filter({ hasText: "Yorushika「一人称」" });
    await expect(yorushika).toHaveCount(2);
    await expect(yorushika.nth(0)).toContainText("7月29日");
    await expect(yorushika.nth(0)).toContainText("Day1組: 鍾+鄭、陳弟+陳、芳宜+A");
    await expect(yorushika.nth(0)).not.toContainText("Day2組");
    await expect(yorushika.nth(1)).toContainText("7月30日");
    await expect(yorushika.nth(1)).toContainText("Day2組: 鍾+B、陳弟+C");
    await expect(yorushika.nth(1)).not.toContainText("Day1組");
    await expect(yorushika.nth(1).getByRole("link", { name: /演出與票券/ })).toBeVisible();

    const frieren = page.locator("article").filter({ hasText: "葬送のフリーレン音樂會" });
    await expect(frieren).toContainText("8月1日");
    await expect(frieren).toContainText("11:30 Open 13:00 Start");
    await expect(frieren.getByRole("link", { name: /國立大廳/ })).toBeVisible();
  });

  test("uses merged spreadsheet ranges instead of one-hour Fuji placeholders", async ({ page }) => {
    await openApp(page, "/#2026-07-24");

    const festival = page.locator("article").filter({ hasText: "富搖D1" });
    await expect(festival).toContainText("全日");
    await expect(festival).toContainText("藝人周邊 & 官方周邊 8:00 開賣");
    await expect(festival).toContainText("Fujii Kaze × Fuji Rock 聯名周邊 10:00 開賣");
    await expect(festival).not.toContainText("07:00–08:00");
    await expect(festival.getByRole("link", { name: /官方商品資訊/ })).toBeVisible();
  });

  test("shows owner-confirmed palace and Miyoshi states without conflicting instructions", async ({ page }) => {
    await openApp(page, "/#2026-07-28");
    const palace = page.locator("article").filter({ hasText: "皇居參觀" });
    await expect(palace).toContainText("陳：當日9點發整理券");

    await page.goto("/#2026-08-01", { waitUntil: "networkidle" });
    const miyoshi = page.locator("article").filter({ hasText: "11:00 Miyoshi Rug" });
    await expect(miyoshi).toContainText("已預約");
    await expect(miyoshi.getByRole("link", { name: /來店資訊/ })).toBeVisible();
    await expect(miyoshi).not.toContainText("來店預約");

    await page.getByRole("button", { name: "票券與訂位", exact: true }).click();
    const booking = page.locator("article").filter({ hasText: "11:00 Miyoshi Rug" });
    await expect(booking).toContainText("已預約");
  });

  test("uses the confirmed MM627 summer time and earlier Narita departure", async ({ page }) => {
    await openApp(page, "/#2026-08-01");

    const airport = page.locator("article").filter({ hasText: "前往成田機場哭著回家" });
    await expect(airport).toContainText("19:00–22:00");

    const flight = page.locator("article").filter({ hasText: "MM627" });
    await expect(flight).toContainText("22:15 NRT - 8/2 01:00 TPE");
    await expect(flight).not.toContainText("22:10");
  });

  test("marks every simultaneous branch as the current schedule", async ({ page }) => {
    await useFixedDate(page, "2026-08-01T13:30:00+09:00");
    await page.goto("/#2026-08-01", { waitUntil: "networkidle" });

    const frieren = page.locator("article").filter({ hasText: "葬送のフリーレン音樂會" });
    const freeTime = page.locator("article").filter({ hasText: "進城逛街" }).filter({ hasText: "12:00–17:00" });
    await expect(frieren).toContainText("目前排程");
    await expect(freeTime).toContainText("目前排程");
  });

  test("keeps the corrected Zushi-Hayama station name from regressing", async ({ page }) => {
    await openApp(page);

    await expect(page.getByText("京急本線到逗子・葉山站 (~1hr)")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("逗子•業山站");
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

    const route = page.locator("article").filter({ hasText: "Toyota Rent-A-Car 租車與越後妻有藝術祭路線" });
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
