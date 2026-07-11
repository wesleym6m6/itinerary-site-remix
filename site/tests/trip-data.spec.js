import { expect, test } from "@playwright/test";
import { getEventActions } from "../src/data/eventActions.js";
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
  test("preserves merged Sheet ranges and owner-confirmed corrections", () => {
    const mergedEvents = [
      ["2026-07-22", "桃園機場第一航廈集合", "18:00–20:00"],
      ["2026-07-22", "MM860", "20:00–24:00"],
      ["2026-07-23", "早餐@Keikyu Ex Inn", "08:00–10:00"],
      ["2026-07-23", "東京駅集合寄物 & 支線任務：跟曼達快閃見面 (約在八重洲Public)", "10:00–12:00"],
      ["2026-07-23", "12:40~13:56 Toki321号 ¥6700", "12:00–14:00"],
      ["2026-07-23", "前往苗場：公車 (15:30湯澤~16:07苗場線 ¥700) or 官方接駁車 (¥2000)", "15:00–17:00"],
      ["2026-07-23", "前夜祭", "18:00–25:00"],
      ["2026-07-24", "富搖D1", "全日"],
      ["2026-07-25", "富搖D2", "全日"],
      ["2026-07-26", "富搖D3", "全日"],
      ["2026-07-27", "接駁車前往越後湯沢駅", "07:00–09:00"],
      ["2026-07-27", "Toyota Rent-A-Car 租車與越後妻有藝術祭路線", "09:00–19:00"],
      ["2026-07-27", "19:05~20:12 Toki338 ¥6700", "19:00–21:00"],
      ["2026-07-27", "check in NESTo KAMATA", "22:00–24:00"],
      ["2026-07-28", "皇居慢跑 & 加油打氣組旁邊喝咖啡", "08:00–10:00"],
      ["2026-07-28", "10:00~11:15 皇居參觀 @桔梗門", "10:00–12:00"],
      ["2026-07-28", "東京國立近代美術館", "14:00–16:00"],
      ["2026-07-29", "京急本線到逗子・葉山站 (~1hr)", "08:00–10:00"],
      ["2026-07-29", "逗子海水浴場玩水", "10:00–13:00"],
      ["2026-07-29", "散步拍照：森戶神社/真名瀨海岸/一色海岸", "13:00–15:00"],
      ["2026-07-29", "Day1組出發橫濱體育館", "15:00–18:00"],
      ["2026-07-29", "Yorushika「一人称」at 橫濱體育館", "18:00–22:00"],
      ["2026-07-30", "起床", "07:00–09:00"],
      ["2026-07-30", "進城逛街", "09:00–16:00"],
      ["2026-07-30", "Day2組出發橫濱體育館", "16:00–18:00"],
      ["2026-07-30", "Yorushika「一人称」at 橫濱體育館", "18:00–22:00"],
      ["2026-07-31", "進城逛街", "09:00–18:00"],
      ["2026-07-31", "晚餐 & 彭温前往晴空塔", "18:00–20:00"],
      ["2026-07-31", "Regal Lily \"LIVE in the DARK\" at Konica Minolta Planetarium Tenku", "20:00–23:00"],
      ["2026-08-01", "進城逛街", "09:00–11:00"],
      ["2026-08-01", "葬送のフリーレン音樂會 at パシフィコ横浜 国立大ホール (鍾鄭)", "12:00–17:00"],
      ["2026-08-01", "彭温最後的晚餐 (?)", "17:00–19:00"],
      ["2026-08-01", "前往成田機場哭著回家", "19:00–22:00"],
      ["2026-08-01", "MM627", "22:00–25:00"],
    ];

    for (const [date, title, time] of mergedEvents) {
      expect(getEvent(date, title).time, `${date} ${title}`).toBe(time);
    }

    expect(getEvent("2026-08-01", "MM627").desc).toBe("22:15 NRT - 8/2 01:00 TPE");

    const miyoshi = getEvent("2026-08-01", "11:00 Miyoshi Rug");
    expect(miyoshi.badges.some((badge) => badge.text === "已預約")).toBe(true);
  });

  test("keeps verified corrections out of stale or typo forms", () => {
    const serialized = JSON.stringify(itineraryDays);
    expect(serialized).not.toContain("22:10 NRT");
    expect(serialized).not.toContain("逗子•業山站");
    expect(serialized).not.toContain("Yorushika\\\"一人稱");
    expect(serialized).not.toContain("Konica Minolta 天文館");
  });

  test("resolves actions for every changed operational event", () => {
    const eventsWithActions = [
      ["2026-07-23", "東京駅集合寄物 & 支線任務：跟曼達快閃見面 (約在八重洲Public)"],
      ["2026-07-23", "補給@越後湯沢駅"],
      ["2026-07-23", "前往苗場：公車 (15:30湯澤~16:07苗場線 ¥700) or 官方接駁車 (¥2000)"],
      ["2026-07-27", "接駁車前往越後湯沢駅"],
      ["2026-07-27", "Toyota Rent-A-Car 租車與越後妻有藝術祭路線"],
      ["2026-07-27", "check in NESTo KAMATA"],
      ["2026-07-28", "前往ASICS RUN (~35min)"],
      ["2026-07-28", "皇居慢跑 & 加油打氣組旁邊喝咖啡"],
      ["2026-07-29", "Yorushika「一人称」at 橫濱體育館"],
      ["2026-07-30", "Yorushika「一人称」at 橫濱體育館"],
      ["2026-07-31", "晚餐 & 彭温前往晴空塔"],
      ["2026-07-31", "Regal Lily \"LIVE in the DARK\" at Konica Minolta Planetarium Tenku"],
      ["2026-08-01", "11:00 Miyoshi Rug"],
      ["2026-08-01", "葬送のフリーレン音樂會 at パシフィコ横浜 国立大ホール (鍾鄭)"],
      ["2026-08-01", "前往成田機場哭著回家"],
      ["2026-08-01", "MM627"],
    ];

    for (const [date, title] of eventsWithActions) {
      getEvent(date, title);
      expect(getEventActions(date, title), `${date} ${title}`).not.toHaveLength(0);
    }
  });
});
