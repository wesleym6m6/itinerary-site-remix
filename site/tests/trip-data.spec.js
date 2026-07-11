import { expect, test } from "@playwright/test";
import { getEventActionKeys, getEventActions } from "../src/data/eventActions.js";
import { itineraryDays } from "../src/data/tripData.js";

function getDay(date) {
  const day = itineraryDays.find((item) => item.date === date);
  expect(day, `Missing itinerary day ${date}`).toBeTruthy();
  return day;
}

function getEvent(date, title) {
  const event = getDay(date).events.find((item) => item.title === title);
  expect(event, `Missing ${date} event: ${title}`).toBeTruthy();
  return event;
}

test.describe("latest itinerary data", () => {
  test("keeps every registered action attached to a real itinerary event", () => {
    const keys = getEventActionKeys();
    expect(keys.length).toBeGreaterThan(0);

    for (const { date, title } of keys) {
      getEvent(date, title);
      expect(getEventActions(date, title), `${date} ${title}`).not.toHaveLength(0);
    }
  });

  test("separates Sheet occupancy from exact display and active times", () => {
    expect(getEvent("2026-07-22", "MM860")).toMatchObject({
      time: "20:25–24:45",
      slot: "20:00–24:00",
      activeTime: "20:25–24:45",
    });
    expect(getEvent("2026-07-23", "Toki321号")).toMatchObject({
      time: "12:40–13:56",
      slot: "12:00–14:00",
      activeTime: "12:40–13:56",
    });
    expect(getEvent("2026-07-23", "官方周邊開賣")).toMatchObject({
      time: "16:00",
      activeTime: null,
    });
    expect(getEvent("2026-08-01", "葬送のフリーレン音樂會 at パシフィコ横浜 国立大ホール")).toMatchObject({
      time: "11:30 Open · 13:00 Start",
      slot: "12:00–17:00",
      activeTime: "11:30–17:00",
      group: "鍾鄭",
    });
    expect(getEvent("2026-08-01", "MM627")).toMatchObject({
      time: "22:15–25:00",
      slot: "22:00–25:00",
      activeTime: "22:15–25:00",
      desc: "NRT - 8/2 01:00 TPE",
    });
  });

  test("preserves owner corrections, parallel groups, options, and statuses", () => {
    const july31Notes = getDay("2026-07-31").notes;
    expect(july31Notes).toContainEqual({
      text: "ルラ美容クリニック (プロファイロ)",
      kind: "unscheduled",
    });
    expect(JSON.stringify(getDay("2026-08-01").notes)).not.toContain("ルラ美容クリニック");

    const miyoshi = getEvent("2026-08-01", "Miyoshi Rug");
    expect(miyoshi.badges.some((badge) => badge.text === "已預約")).toBe(true);

    expect(getEvent("2026-07-28", "皇居慢跑").group).toBe("慢跑組");
    expect(getEvent("2026-07-28", "旁邊喝咖啡").group).toBe("加油打氣組");
    expect(getEvent("2026-07-28", "領皇居參觀整理券")).toMatchObject({
      time: "09:00",
      activeTime: "09:00–10:00",
      group: "陳",
    });
    expect(getEvent("2026-07-29", "Day2組看要不要看夕陽")).toMatchObject({
      group: "Day2組",
      status: "tentative",
    });
    expect(getEvent("2026-07-31", "彭・温前往晴空塔").group).toBe("彭・温");
    expect(getEvent("2026-08-01", "彭温最後的晚餐 (?)").status).toBe("tentative");

    const optionTitles = itineraryDays.flatMap((day) => day.events)
      .filter((event) => event.status === "option")
      .map((event) => event.title);
    expect(optionTitles).toEqual(expect.arrayContaining([
      "支線任務：跟曼達快閃見面",
      "前往苗場：公車",
      "前往苗場：官方接駁車",
      "轉京濱東北線到蒲田",
      "轉京急本線到京急蒲田",
      "橫濱散策",
      "自由活動戶外提案",
    ]));
  });

  test("keeps the complete numbered 1–9 driving route", () => {
    const route = getEvent("2026-07-27", "越後湯澤／十日町自駕路線");
    let previousIndex = -1;

    for (let number = 1; number <= 9; number += 1) {
      const index = route.desc.indexOf(`${number}.`);
      expect(index, `Missing route stop ${number}`).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }

    expect(route.desc).toContain("訂單: 98104656000");
    expect(route.desc).toContain("里山現代美術館 MonET ¥1200");
  });

  test("keeps verified corrections out of stale or typo forms", () => {
    const serialized = JSON.stringify(itineraryDays);
    expect(serialized).not.toContain("22:10 NRT");
    expect(serialized).not.toContain("逗子•業山站");
    expect(serialized).not.toContain("Yorushika\\\"一人稱");
    expect(serialized).not.toContain("Konica Minolta 天文館");
    expect(serialized).not.toContain("Fujii Kaze × Fuji Rock");
  });

  test("resolves actions for the renamed operational events", () => {
    const eventsWithActions = [
      ["2026-07-23", "東京駅集合、寄物"],
      ["2026-07-23", "Toki321号"],
      ["2026-07-23", "前往苗場：公車"],
      ["2026-07-23", "前往苗場：官方接駁車"],
      ["2026-07-23", "官方周邊開賣"],
      ["2026-07-27", "越後湯澤／十日町自駕路線"],
      ["2026-07-27", "Toki338"],
      ["2026-07-27", "轉京濱東北線到蒲田"],
      ["2026-07-27", "轉京急本線到京急蒲田"],
      ["2026-07-28", "前往ASICS RUN"],
      ["2026-07-28", "皇居慢跑"],
      ["2026-07-28", "旁邊喝咖啡"],
      ["2026-07-28", "領皇居參觀整理券"],
      ["2026-07-28", "皇居參觀 @桔梗門"],
      ["2026-07-28", "杉本博司－絕滅寫真"],
      ["2026-07-29", "Day1組出發橫濱體育館"],
      ["2026-07-29", "Yorushika「一人称」at 橫濱體育館"],
      ["2026-07-30", "Yorushika「一人称」at 橫濱體育館"],
      ["2026-07-31", "彭・温前往晴空塔"],
      ["2026-07-31", "Regal Lily \"LIVE in the DARK\" at Konica Minolta Planetarium Tenku"],
      ["2026-08-01", "Miyoshi Rug"],
      ["2026-08-01", "葬送のフリーレン音樂會 at パシフィコ横浜 国立大ホール"],
      ["2026-08-01", "前往成田機場哭著回家"],
      ["2026-08-01", "MM627"],
    ];

    for (const [date, title] of eventsWithActions) {
      getEvent(date, title);
      expect(getEventActions(date, title), `${date} ${title}`).not.toHaveLength(0);
    }
  });
});
