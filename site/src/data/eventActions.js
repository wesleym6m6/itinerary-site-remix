const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1&query=";

const officialLinks = {
  crystalInn: "https://crystalinn-naeba.sakura.ne.jp/index.html",
  echigoDrive: "https://www.echigo-tsumari.jp/visit/satoyamasyokudo_daytrip/",
  echigoPass: "https://www.echigo-tsumari.jp/event/20260425_1108/",
  fujiAccess: "https://fujirockfestival.com/access/index",
  fujiGoods: "https://www.greenonred.jp/frfgoods_26/index.html",
  fujiInfo: "https://www.fujirockfestival.com/info/index",
  fujiTimetable24: "https://fujirockfestival.com/artist/timetable/24",
  fujiTimetable25: "https://fujirockfestival.com/artist/timetable/25",
  fujiTimetable26: "https://fujirockfestival.com/artist/timetable/26",
  hayamaTicket: "https://www.keikyu.co.jp/visit/otoku/otoku_hayamagirl/",
  imperialPalace: "https://sankan.kunaicho.go.jp/guide/koukyo.html",
  keikyuHaneda: "https://www.keikyu-exinn.co.jp/en/hotel/haneda/access.html",
  miyoshiStore: "https://miyoshirug.store/pages/dealer",
  momatExhibition: "https://www.momat.go.jp/exhibitions/569",
  naritaAccess: "https://www.narita-airport.jp/en/access/",
  planetariumTenku: "https://planetarium.konicaminolta.jp/livedark/takahashihonoka/",
  asicsRun: "https://www.asics.com/jp/ja-jp/mk/store/asicsruntokyo-marunouchi",
  frierenConcert: "https://frieren-filmconcert.com/",
  yorushika: "https://yorushika.com/feature/livetour2026_ichininsho",
  yokohamaArenaAccess: "https://www.yokohama-arena.co.jp/access/index.html",
};

function mapsAction(label, query) {
  return {
    type: "map",
    label,
    href: `${GOOGLE_MAPS_SEARCH_URL}${encodeURIComponent(query)}`,
  };
}

function officialAction(label, href) {
  return { type: "official", label, href };
}

function copyAction(label, copyText) {
  return { type: "copy", label, copyText };
}

const actionsByEvent = new Map();

function register(date, title, actions) {
  actionsByEvent.set(`${date}\u0000${title}`, actions);
}

function registerMany(events, actions) {
  events.forEach(([date, title]) => register(date, title, actions));
}

const keikyuHanedaActions = [
  mapsAction("住宿地圖", "京急 EXイン 羽田"),
  officialAction("住宿交通", officialLinks.keikyuHaneda),
];

registerMany(
  [
    ["2026-07-22", "住宿：Keikyu Ex Inn Haneda"],
    ["2026-07-22", "計程車前往check in"],
    ["2026-07-23", "早餐@Keikyu Ex Inn"],
  ],
  keikyuHanedaActions,
);

register("2026-07-22", "桃園機場第一航廈集合", [
  mapsAction("第一航廈", "桃園國際機場 第一航廈"),
]);

register("2026-07-22", "MM860", [
  copyAction("複製航班", "MM860 · TPE → HND"),
  mapsAction("羽田第三航廈", "羽田空港 第3ターミナル"),
]);

const crystalInnActions = [
  mapsAction("住宿地圖", "クリスタルイン苗場"),
  officialAction("住宿官網", officialLinks.crystalInn),
];

registerMany(
  [
    ["2026-07-23", "住宿：Crystal Inn Naeba"],
    ["2026-07-23", "步行至住宿check in"],
    ["2026-07-24", "住宿：Crystal Inn Naeba"],
    ["2026-07-25", "住宿：Crystal Inn Naeba"],
    ["2026-07-26", "住宿：Crystal Inn Naeba"],
  ],
  crystalInnActions,
);

register("2026-07-23", "東京駅集合寄物 & 支線任務：跟曼達快閃見面 (約在八重洲Public)", [
  mapsAction("東京車站", "東京駅"),
]);

register("2026-07-23", "12:40~13:56 Toki321号 ¥6700", [
  copyAction("複製車次", "Toki 321 · 12:40–13:56"),
  mapsAction("越後湯澤站", "越後湯沢駅"),
]);

register("2026-07-23", "補給@越後湯沢駅", [
  mapsAction("越後湯澤站", "越後湯沢駅"),
]);

register("2026-07-23", "前往苗場：公車 (15:30湯澤~16:07苗場線 ¥700) or 官方接駁車 (¥2000)", [
  mapsAction("巴士乘車處", "越後湯沢駅 東口 バス乗り場"),
  officialAction("官方接駁", officialLinks.fujiAccess),
]);

register("2026-07-23", "前夜祭", [
  mapsAction("苗場會場", "苗場スキー場"),
  officialAction("活動資訊", officialLinks.fujiInfo),
]);

[
  ["2026-07-24", "富搖D1", officialLinks.fujiTimetable24],
  ["2026-07-25", "富搖D2", officialLinks.fujiTimetable25],
  ["2026-07-26", "富搖D3", officialLinks.fujiTimetable26],
].forEach(([date, title, timetable]) => {
  register(date, title, [
    mapsAction("苗場會場", "苗場スキー場"),
    officialAction("官方時刻表", timetable),
    ...(date === "2026-07-24" ? [officialAction("官方商品資訊", officialLinks.fujiGoods)] : []),
  ]);
});

const nestoKamataActions = [
  mapsAction("住宿地圖", "NESTo KAMATA"),
];

registerMany(
  [
    ["2026-07-27", "住宿：NESTo KAMATA"],
    ["2026-07-27", "check in NESTo KAMATA"],
    ["2026-07-28", "住宿：NESTo KAMATA"],
    ["2026-07-29", "住宿：NESTo KAMATA"],
    ["2026-07-30", "住宿：NESTo KAMATA"],
    ["2026-07-31", "住宿：NESTo KAMATA"],
    ["2026-07-31", "回蒲田"],
  ],
  nestoKamataActions,
);

register("2026-07-27", "接駁車前往越後湯沢駅", [
  mapsAction("越後湯澤站", "越後湯沢駅"),
  officialAction("接駁資訊", officialLinks.fujiAccess),
]);

register("2026-07-27", "Toyota Rent-A-Car 租車與越後妻有藝術祭路線", [
  mapsAction("Toyota 租車", "トヨタレンタカー 越後湯沢駅前店"),
  officialAction("官方一日自駕範例", officialLinks.echigoDrive),
  officialAction("2026 共通票", officialLinks.echigoPass),
]);

register("2026-07-27", "19:05~20:12 Toki338 ¥6700", [
  copyAction("複製車次", "Toki 338 · 19:05–20:12"),
  mapsAction("越後湯澤站", "越後湯沢駅"),
]);

register("2026-07-27", "轉京濱東北線到蒲田 or", [
  mapsAction("蒲田站", "蒲田駅"),
  mapsAction("京急蒲田站", "京急蒲田駅"),
]);

register("2026-07-28", "前往ASICS RUN (~35min)", [
  mapsAction("ASICS RUN", "ASICS RUN TOKYO MARUNOUCHI"),
  officialAction("官方資訊", officialLinks.asicsRun),
]);

register("2026-07-28", "皇居慢跑 & 加油打氣組旁邊喝咖啡", [
  mapsAction("皇居外苑", "皇居外苑"),
]);

register("2026-07-28", "10:00~11:15 皇居參觀 @桔梗門", [
  mapsAction("桔梗門", "皇居 桔梗門"),
  officialAction("參觀規則", officialLinks.imperialPalace),
]);

register("2026-07-28", "東京國立近代美術館", [
  mapsAction("美術館地圖", "東京国立近代美術館"),
  officialAction("展覽資訊", officialLinks.momatExhibition),
]);

register("2026-07-29", "京急本線到逗子・葉山站 (~1hr)", [
  mapsAction("逗子・葉山站", "逗子・葉山駅"),
  officialAction("女子旅套票", officialLinks.hayamaTicket),
]);

register("2026-07-29", "逗子海水浴場玩水", [
  mapsAction("海水浴場", "逗子海水浴場"),
  officialAction("套票內容", officialLinks.hayamaTicket),
]);

register("2026-07-29", "散步拍照：森戶神社/真名瀨海岸/一色海岸", [
  mapsAction("森戶神社", "森戸大明神"),
  mapsAction("真名瀨海岸", "真名瀬海岸"),
  mapsAction("一色海岸", "一色海岸"),
]);

const yokohamaArenaActions = [
  mapsAction("橫濱體育館", "横浜アリーナ"),
  officialAction("場館交通", officialLinks.yokohamaArenaAccess),
];

register("2026-07-29", "Day1組出發橫濱體育館", [
  mapsAction("逗子站", "逗子駅"),
  ...yokohamaArenaActions,
]);

registerMany([
  ["2026-07-29", "Yorushika「一人称」at 橫濱體育館"],
  ["2026-07-30", "Yorushika「一人称」at 橫濱體育館"],
], [
  mapsAction("橫濱體育館", "横浜アリーナ"),
  officialAction("演出與票券", officialLinks.yorushika),
  officialAction("場館交通", officialLinks.yokohamaArenaAccess),
]);

register("2026-07-30", "Day2組出發橫濱體育館", yokohamaArenaActions);

register("2026-07-31", "晚餐 & 彭温前往晴空塔", [
  mapsAction("東京晴空塔", "東京スカイツリー"),
]);

register("2026-07-31", "Regal Lily \"LIVE in the DARK\" at Konica Minolta Planetarium Tenku", [
  mapsAction("天文館地圖", "コニカミノルタプラネタリウム天空"),
  officialAction("官方演出資訊", officialLinks.planetariumTenku),
]);

register("2026-08-01", "11:00 Miyoshi Rug", [
  mapsAction("EVANS 白金台", "EVANS 白金台 MIYOSHI RUG"),
  officialAction("來店資訊", officialLinks.miyoshiStore),
]);

register("2026-08-01", "葬送のフリーレン音樂會 at パシフィコ横浜 国立大ホール (鍾鄭)", [
  mapsAction("國立大廳", "パシフィコ横浜 国立大ホール"),
  officialAction("官方演出資訊", officialLinks.frierenConcert),
]);

register("2026-08-01", "前往成田機場哭著回家", [
  mapsAction("成田第一航廈", "成田国際空港 第1ターミナル"),
  officialAction("機場交通", officialLinks.naritaAccess),
]);

register("2026-08-01", "MM627", [
  copyAction("複製航班", "MM627 · 8/1 22:15 NRT → 8/2 01:00 TPE"),
  mapsAction("成田第一航廈", "成田国際空港 第1ターミナル"),
]);

export function getEventActions(date, title) {
  if (typeof date !== "string" || typeof title !== "string") return [];
  return actionsByEvent.get(`${date}\u0000${title}`) || [];
}
