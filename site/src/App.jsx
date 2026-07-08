import { useEffect, useMemo, useRef, useState } from "react";
import sakuraPetal from "./assets/sakura-petal.png";
import { itineraryDays, tripCollections, tripMeta } from "./data/tripData.js";

const tabs = [
  { id: "itinerary", label: "行程", icon: "fa-calendar-alt" },
  { id: "bookings", label: "訂單資訊", icon: "fa-file-invoice" },
  { id: "transport", label: "交通", icon: "fa-train" },
  { id: "shows", label: "演出", icon: "fa-music" },
  { id: "shopping", label: "購物", icon: "fa-shopping-bag" },
  { id: "luggage", label: "行李", icon: "fa-suitcase" },
  { id: "notes", label: "注意事項", icon: "fa-bullhorn" },
];

const typeLabels = {
  flight: "航班",
  hotel: "住宿",
  show: "演出",
  food: "餐飲",
  buy: "購物",
  transport: "交通",
  sight: "景點",
  story: "行程",
  booking: "預訂",
  tip: "備忘",
};

const typeIcons = {
  flight: "fa-plane",
  hotel: "fa-hotel",
  show: "fa-music",
  food: "fa-utensils",
  buy: "fa-shopping-bag",
  transport: "fa-train",
  sight: "fa-camera",
  story: "fa-leaf",
  booking: "fa-receipt",
  tip: "fa-circle-info",
};

const packingStorageKey = "itinerary-site-remix:packing:v1";

const packingCategories = [
  {
    id: "docs",
    title: "證件與票券",
    icon: "fa-passport",
    items: ["護照", "機票與訂位截圖", "住宿確認資料", "演唱會/音樂節票券", "海外旅遊保險", "信用卡與日幣現金"],
  },
  {
    id: "clothes",
    title: "衣物",
    icon: "fa-shirt",
    items: ["快乾上衣", "短褲或輕便長褲", "薄外套", "襪子與內衣", "睡衣", "舒適走路鞋"],
  },
  {
    id: "rain",
    title: "雨具",
    icon: "fa-cloud-rain",
    items: ["輕量雨衣", "防水帽或鴨舌帽", "防水袋", "備用襪子", "折疊傘", "鞋子防水噴霧"],
  },
  {
    id: "festival",
    title: "音樂節裝備",
    icon: "fa-music",
    items: ["小毛巾", "防曬乳", "濕紙巾", "隨身垃圾袋", "輕便坐墊", "可補水水瓶", "耳塞"],
  },
  {
    id: "electronics",
    title: "電子用品",
    icon: "fa-bolt",
    items: ["手機充電線", "行動電源", "日本轉接頭", "耳機", "eSIM/網卡", "備用充電線"],
  },
  {
    id: "care",
    title: "藥品與保養",
    icon: "fa-kit-medical",
    items: ["常備藥", "腸胃藥", "止痛藥", "OK 繃", "防蚊液", "個人保養品"],
  },
  {
    id: "return",
    title: "返台整理",
    icon: "fa-box-open",
    items: ["戰利品分袋", "液體放托運", "行動電源放手提", "護照與登機證", "退房前檢查充電器", "伴手禮保護包裝"],
  },
];

const festivalMemos = [
  { icon: "fa-cloud-rain", title: "雨天預案", text: "苗場山區天氣變化快，雨衣、防水袋、備用襪子要放在容易拿的位置。" },
  { icon: "fa-battery-full", title: "電力管理", text: "白天拍照、查路線和聯絡會耗電，行動電源和短線優先放隨身包。" },
  { icon: "fa-yen-sign", title: "現金與補給", text: "音樂節現場和移動途中保留現金，進場前先補水、毛巾、簡單食物。" },
  { icon: "fa-route", title: "回住宿節奏", text: "散場後不要把回程安排得太緊，先約好集合點和走散後的聯絡方式。" },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Petals() {
  const petals = [
    { left: "5%", duration: "9s", delay: "-1s", size: 24 },
    { left: "14%", duration: "12s", delay: "1s", size: 18 },
    { left: "28%", duration: "10s", delay: "4s", size: 22 },
    { left: "52%", duration: "13s", delay: "0s", size: 20 },
    { left: "68%", duration: "11s", delay: "3s", size: 25 },
    { left: "83%", duration: "8s", delay: "2s", size: 19 },
    { left: "94%", duration: "14s", delay: "5s", size: 21 },
  ];

  return (
    <div className="petal-layer" aria-hidden="true">
      {petals.map((petal, index) => (
        <img
          alt=""
          className="petal"
          key={index}
          src={sakuraPetal}
          style={{
            left: petal.left,
            animationDuration: petal.duration,
            animationDelay: petal.delay,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
          }}
        />
      ))}
    </div>
  );
}

function Header({ activeTab, onTabChange }) {
  return (
    <header className="trip-header">
      <p className="trip-kicker">
        <i className="fa-solid fa-plane-departure" aria-hidden="true" />
        {tripMeta.kicker}
      </p>
      <h1>
        <span>東京・苗場・越後妻有</span>
        <span>11 日自由行</span>
      </h1>
      <p className="trip-subtitle">
        <i className="fa-solid fa-map-location-dot" aria-hidden="true" />
        {tripMeta.subtitle}
      </p>
      <p className="trip-range">{tripMeta.range}</p>

      <nav className="tab-shell" aria-label="旅行資訊分類">
        {tabs.map((tab) => (
          <button
            aria-pressed={activeTab === tab.id}
            className={cx("tab-button", activeTab === tab.id && "active")}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <i className={`fa-solid ${tab.icon}`} aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function DateNav({ currentIndex, onChange }) {
  const navRef = useRef(null);

  function scrollNav(direction) {
    navRef.current?.scrollBy({
      left: direction === "left" ? -150 : 150,
      behavior: "smooth",
    });
  }

  return (
    <div className="date-nav-frame">
      <button
        aria-label="往前捲動日期"
        className="date-arrow"
        onClick={() => scrollNav("left")}
        type="button"
      >
        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>
      <div className="date-nav no-scrollbar" ref={navRef}>
        {itineraryDays.map((day, index) => (
          <button
            className={cx("date-pill", currentIndex === index && "active")}
            key={day.date}
            onClick={() => onChange(index)}
            type="button"
          >
            <span>{day.weekdayShort}</span>
            <strong>{new Date(`${day.date}T12:00:00`).getDate()}</strong>
          </button>
        ))}
      </div>
      <button
        aria-label="往後捲動日期"
        className="date-arrow"
        onClick={() => scrollNav("right")}
        type="button"
      >
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}

function DayCard({ currentIndex, onChange }) {
  const [openTip, setOpenTip] = useState(null);
  const day = itineraryDays[currentIndex];
  const date = new Date(`${day.date}T12:00:00`);

  function changeDay(index) {
    if (index < 0 || index >= itineraryDays.length) return;
    setOpenTip(null);
    onChange(index);
  }

  return (
    <section className="main-card fade-in" key={day.date}>
      <div className="day-heading">
        <div className="date-tile">
          <strong>{date.getDate()}</strong>
          <span>{day.weekdayShort}</span>
          <small>{day.dateLabel} · {date.getFullYear()}</small>
        </div>
        <div className="day-title-block">
          <div className="day-badges">
            <span className="dark-badge">{day.tag}</span>
            <span className="weather-badge">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              {day.city}
            </span>
            {day.accommodation && day.accommodation !== "--" ? (
              <span className="weather-badge">
                <i className="fa-solid fa-bed" aria-hidden="true" />
                {day.accommodation}
              </span>
            ) : null}
          </div>
          <h2>{day.title}</h2>
        </div>
      </div>

      {day.notes.length ? (
        <div className="day-note">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <div>
            {day.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="event-list">
        {day.events.map((event, index) => (
          <EventCard
            event={event}
            isOpen={openTip === `${currentIndex}-${index}`}
            key={`${event.time}-${event.title}`}
            onToggle={() =>
              setOpenTip((value) =>
                value === `${currentIndex}-${index}` ? null : `${currentIndex}-${index}`,
              )
            }
          />
        ))}
      </div>

      <div className="day-controls">
        <button
          className="outline-button"
          disabled={currentIndex === 0}
          onClick={() => changeDay(currentIndex - 1)}
          type="button"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          上一天
        </button>
        <button
          className="outline-button"
          disabled={currentIndex === itineraryDays.length - 1}
          onClick={() => changeDay(currentIndex + 1)}
          type="button"
        >
          下一天
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function Badge({ badge }) {
  const cls = badge.cls || "story";
  const icon = badge.icon || typeIcons[cls] || "fa-circle-info";

  return (
    <span className={cx("badge-pill", `badge-${cls}`)}>
      <i className={`fa-solid ${icon}`} aria-hidden="true" />
      {badge.text || typeLabels[cls]}
    </span>
  );
}

function EventCard({ event, isOpen, onToggle }) {
  const type = event.type || "story";
  const icon = event.icon || typeIcons[type] || "fa-leaf";

  return (
    <article className={cx("event-card", `card-${type}`)}>
      <div className="event-main">
        <div className={cx("event-icon", `text-${type}`)}>
          <i className={`fa-solid ${icon}`} aria-hidden="true" />
        </div>
        <div className="event-copy">
          <div className="event-meta">
            <span className={cx("event-time", `text-${type}`)}>{event.time}</span>
            <span className={cx("badge-pill", `badge-${type}`)}>
              {typeLabels[type] || "行程"}
            </span>
          </div>
          <h3>{event.title}</h3>
          {event.desc ? <p className="event-desc">{event.desc}</p> : null}
        </div>
      </div>

      {event.badges?.length ? (
        <div className="badge-row">
          {event.badges.map((badge, index) => (
            <Badge badge={badge} key={`${badge.text}-${index}`} />
          ))}
        </div>
      ) : null}

      {event.tip ? (
        <div className="tip-panel">
          <button className="tip-toggle" onClick={onToggle} type="button">
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
            <span>{event.tip.title}</span>
            <i
              className={cx("fa-solid fa-chevron-down", isOpen && "rotated")}
              aria-hidden="true"
            />
          </button>
          <div className={cx("tip-body", isOpen && "open")}>
            <p>{event.tip.content}</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ItineraryView({ currentIndex, setCurrentIndex }) {
  return (
    <div className="view itinerary-view">
      <DateNav currentIndex={currentIndex} onChange={setCurrentIndex} />
      <DayCard currentIndex={currentIndex} onChange={setCurrentIndex} />
    </div>
  );
}

function SummaryItem({ item, compact = false }) {
  const type = item.type || "story";
  const icon = item.icon || typeIcons[type] || "fa-leaf";

  return (
    <article className={cx("summary-item", compact && "compact", `card-${type}`)}>
      <div className={cx("summary-icon", `text-${type}`)}>
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </div>
      <div>
        {"date" in item ? <p className="summary-date">{item.date}</p> : null}
        <h3>{item.title}</h3>
        {item.meta ? <p>{item.meta}</p> : null}
      </div>
    </article>
  );
}

function CollectionView({ type }) {
  const config = {
    bookings: {
      title: "訂單資訊",
      eyebrow: "住宿、交通與需要確認的預約",
      items: tripCollections.bookings,
    },
    transport: {
      title: "交通動線",
      eyebrow: "航班、鐵道、接駁與市區移動",
      items: tripCollections.transport,
    },
    shows: {
      title: "演出日程",
      eyebrow: "富士搖滾、Yorushika 與夜間節目",
      items: tripCollections.shows,
    },
    shopping: {
      title: "景點與採買",
      eyebrow: "美術館、餐飲、購物與城市散步",
      items: tripCollections.shopping.slice(0, 28),
    },
  }[type];

  return (
    <section className="view info-view">
      <div className="info-card">
        <div className="section-title">
          <p>{config.eyebrow}</p>
          <h2>{config.title}</h2>
        </div>
        <div className="summary-grid">
          {config.items.map((item, index) => (
            <SummaryItem item={item} key={`${item.date || ""}-${item.title}-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FestivalView({ onJumpToDay }) {
  const fujiDays = itineraryDays.filter((day) => day.sheetLabel.startsWith("富搖"));
  const yorushikaDays = itineraryDays.filter((day) => day.sheetLabel === "Yorushika");

  return (
    <section className="view info-view">
      <div className="info-card">
        <div className="section-title">
          <p>富士搖滾、Yorushika 與現場備忘</p>
          <h2>演出日程</h2>
        </div>

        <div className="festival-hero">
          <div>
            <span className="dark-badge">Naeba Ready</span>
            <h3>三天音樂節，先把回住宿、雨具和電力顧好。</h3>
            <p>這頁先當作現場工具。正式出演時刻表之後再補，不在這一版牽動外部資料。</p>
          </div>
          <div className="festival-stat">
            <strong>3+2</strong>
            <span>富搖三日 + 橫濱兩晚</span>
          </div>
        </div>

        <div className="festival-section">
          <div className="mini-heading">
            <i className="fa-solid fa-mountain-sun" aria-hidden="true" />
            富士搖滾 D1-D3
          </div>
          <div className="festival-grid">
            {fujiDays.map((day) => (
              <article className="festival-card card-show" key={day.date}>
                <p className="summary-date">{day.dateLabel} · {day.weekdayLabel}</p>
                <h3>{day.title}</h3>
                <p>{day.accommodation}</p>
                <div className="festival-reminders">
                  <span>雨具</span>
                  <span>補給</span>
                  <span>行動電源</span>
                </div>
                <button className="link-button" onClick={() => onJumpToDay(day.date)} type="button">
                  看當日行程
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="festival-section">
          <div className="mini-heading">
            <i className="fa-solid fa-music" aria-hidden="true" />
            Yorushika 橫濱演出
          </div>
          <div className="festival-grid two">
            {yorushikaDays.map((day) => (
              <article className="festival-card card-flight" key={day.date}>
                <p className="summary-date">{day.dateLabel} · {day.weekdayLabel}</p>
                <h3>{day.title}</h3>
                <p>{day.city}</p>
                <div className="festival-reminders">
                  <span>票券</span>
                  <span>交通</span>
                  <span>周邊</span>
                </div>
                <button className="link-button" onClick={() => onJumpToDay(day.date)} type="button">
                  看當日行程
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="festival-section">
          <div className="mini-heading">
            <i className="fa-solid fa-list-check" aria-hidden="true" />
            音樂節備忘
          </div>
          <div className="memo-grid">
            {festivalMemos.map((memo) => (
              <article className="memo-card" key={memo.title}>
                <i className={`fa-solid ${memo.icon}`} aria-hidden="true" />
                <h3>{memo.title}</h3>
                <p>{memo.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PackingView() {
  const allItems = useMemo(
    () =>
      packingCategories.flatMap((category) =>
        category.items.map((item) => ({ id: `${category.id}:${item}`, item, category }))
      ),
    [],
  );
  const [checked, setChecked] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(window.localStorage.getItem(packingStorageKey) || "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(packingStorageKey, JSON.stringify(Array.from(checked)));
    } catch {
      // Local storage can be unavailable in private browsing; the checklist still works in memory.
    }
  }, [checked]);

  function toggleItem(id) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const completed = checked.size;

  return (
    <section className="view info-view">
      <div className="info-card">
        <div className="section-title with-action">
          <div>
            <p>音樂節旅行打包清單</p>
            <h2>行李</h2>
          </div>
          <button className="outline-button visible" onClick={() => setChecked(new Set())} type="button">
            <i className="fa-solid fa-rotate-left" aria-hidden="true" />
            清除勾選
          </button>
        </div>

        <div className="packing-progress">
          <div>
            <strong>{completed}</strong>
            <span>/ {allItems.length} 已完成</span>
          </div>
          <progress max={allItems.length} value={completed} />
        </div>

        <div className="packing-grid">
          {packingCategories.map((category) => (
            <section className="packing-section" key={category.id}>
              <div className="mini-heading">
                <i className={`fa-solid ${category.icon}`} aria-hidden="true" />
                {category.title}
              </div>
              <div className="checklist">
                {category.items.map((item) => {
                  const id = `${category.id}:${item}`;
                  const isChecked = checked.has(id);
                  return (
                    <label className={cx("check-item", isChecked && "checked")} key={id}>
                      <input
                        checked={isChecked}
                        onChange={() => toggleItem(id)}
                        type="checkbox"
                      />
                      <span className="fake-check">
                        <i className="fa-solid fa-check" aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function NotesView() {
  const sheetNotes = tripCollections.notes;

  return (
    <section className="view info-view">
      <div className="info-card">
        <div className="section-title">
          <p>行程表中的提醒與目前處理邊界</p>
          <h2>注意事項</h2>
        </div>

        <div className="notice-grid">
          {sheetNotes.map((note) => (
            <article className="notice-card" key={`${note.date}-${note.title}`}>
              <p className="summary-date">{note.date}</p>
              <h3>{note.title}</h3>
              {note.items.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </article>
          ))}
          <article className="notice-card source-note">
            <p className="summary-date">資料</p>
            <h3>以行程表匯出快照為主</h3>
            <p>目前沒有串接 Google 憑證或即時同步；畫面使用公開 CSV 匯出的本地快照。</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [currentIndex, setCurrentIndex] = useState(0);

  function jumpToDay(date) {
    const index = itineraryDays.findIndex((day) => day.date === date);
    if (index === -1) return;
    setCurrentIndex(index);
    setActiveTab("itinerary");
  }

  const currentView = useMemo(() => {
    if (activeTab === "itinerary") {
      return (
        <ItineraryView
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      );
    }
    if (activeTab === "shows") return <FestivalView onJumpToDay={jumpToDay} />;
    if (activeTab === "luggage") return <PackingView />;
    if (activeTab === "notes") return <NotesView />;
    return <CollectionView type={activeTab} />;
  }, [activeTab, currentIndex]);

  return (
    <main className="trip-app">
      <Petals />
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {currentView}
    </main>
  );
}
