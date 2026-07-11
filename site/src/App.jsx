import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Hotel,
  JapaneseYen,
  Leaf,
  Luggage,
  MapPin,
  Music2,
  Navigation,
  Plane,
  ReceiptText,
  RotateCcw,
  Route,
  ShoppingBag,
  TicketCheck,
  Train,
  Utensils,
} from "lucide-react";
import sakuraPetal from "./assets/sakura-petal.png";
import { getEventActions } from "./data/eventActions.js";
import { itineraryDays, tripCollections, tripMeta } from "./data/tripData.js";

const TOKYO_TIME_ZONE = "Asia/Tokyo";
const dayStorageKey = "itinerary-site-remix:last-day:v1";
const packingStorageKey = "itinerary-site-remix:packing:v1";

const tabs = [
  { id: "itinerary", label: "行程", icon: CalendarDays },
  { id: "bookings", label: "票券與訂位", icon: TicketCheck },
  { id: "shows", label: "演出", icon: Music2 },
  { id: "luggage", label: "行前", icon: Luggage },
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
  flight: Plane,
  hotel: Hotel,
  show: Music2,
  food: Utensils,
  buy: ShoppingBag,
  transport: Train,
  sight: Camera,
  story: Leaf,
  booking: ReceiptText,
  tip: Info,
};

const legacyIcons = {
  "fa-plane": Plane,
  "fa-hotel": Hotel,
  "fa-music": Music2,
  "fa-utensils": Utensils,
  "fa-shopping-bag": ShoppingBag,
  "fa-train": Train,
  "fa-camera": Camera,
  "fa-leaf": Leaf,
  "fa-receipt": ReceiptText,
  "fa-circle-info": Info,
  "fa-location-dot": MapPin,
  "fa-bed": BedDouble,
  "fa-yen-sign": JapaneseYen,
  "fa-route": Route,
};

const packingCategories = [
  {
    id: "docs",
    title: "證件與票券",
    icon: TicketCheck,
    items: ["護照", "機票與住宿確認資料", "Fuji Rock 票券", "Yorushika 電子票", "天文館電子票", "租車與皇居確認截圖"],
  },
  {
    id: "festival",
    title: "音樂祭隨身",
    icon: Music2,
    items: ["輕量雨衣", "防水袋", "備用襪子", "小毛巾", "可補水水瓶", "耳塞"],
  },
  {
    id: "electronics",
    title: "電子用品",
    icon: ClipboardCheck,
    items: ["手機充電線", "行動電源", "日本轉接頭", "耳機", "eSIM／網卡", "備用充電線"],
  },
  {
    id: "return",
    title: "返台前確認",
    icon: Luggage,
    items: ["液體放托運", "行動電源放手提", "護照與登機資料", "退房前檢查充電器", "確認成田航廈"],
  },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function AppIcon({ name, type, size = 18, strokeWidth = 2, className }) {
  const Icon = legacyIcons[name] || typeIcons[type] || Info;
  return <Icon aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
}

function getTokyoParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function shiftDate(date, amount) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function parseEventSlot(time) {
  const match = String(time).match(/^(\d{2}):(\d{2})[–~](\d{2}):(\d{2})$/);
  if (!match) return null;
  return {
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
  };
}

function getOperationalDay(now = new Date()) {
  const parts = getTokyoParts(now);
  if (parts.hour >= 5) return parts.date;
  const previousDate = shiftDate(parts.date, -1);
  const previousDay = itineraryDays.find((day) => day.date === previousDate);
  const hasLateEvent = previousDay?.events.some((event) => (parseEventSlot(event.time)?.end || 0) > 24 * 60);
  return hasLateEvent ? previousDate : parts.date;
}

function findDayIndex(date) {
  return itineraryDays.findIndex((day) => day.date === date);
}

function getHashDate() {
  if (typeof window === "undefined") return null;
  try {
    const value = decodeURIComponent(window.location.hash.slice(1));
    return findDayIndex(value) >= 0 ? value : null;
  } catch {
    return null;
  }
}

function getInitialDayIndex() {
  if (typeof window === "undefined") return 0;
  const hashDate = getHashDate();
  if (hashDate) return findDayIndex(hashDate);

  const operationalDay = getOperationalDay();
  const todayIndex = findDayIndex(operationalDay);
  if (todayIndex >= 0) return todayIndex;

  try {
    const storedDate = window.localStorage.getItem(dayStorageKey);
    const storedIndex = findDayIndex(storedDate);
    if (storedIndex >= 0) return storedIndex;
  } catch {
    // The date still falls back to the trip boundary when storage is unavailable.
  }

  if (operationalDay > itineraryDays.at(-1).date) return itineraryDays.length - 1;
  return 0;
}

function formatEventTime(time) {
  const slot = parseEventSlot(time);
  if (!slot) return time;
  const display = (minutes) => {
    const normalized = minutes - 24 * 60;
    return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
  };
  if (slot.start < 24 * 60 && slot.end >= 24 * 60) {
    return `時段 ${time.slice(0, 5)}–翌日 ${display(slot.end)}`;
  }
  if (slot.start < 24 * 60) return `時段 ${time}`;
  return `翌日 ${display(slot.start)}–${display(slot.end)}`;
}

function formatDateLabel(date) {
  const day = itineraryDays.find((item) => item.date === date || item.dateLabel === date);
  return day ? `${day.dateLabel} · ${day.weekdayLabel}` : date;
}

function resolveItemDate(item) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.date || "")) return item.date;
  return itineraryDays.find((day) => day.dateLabel === item.date)?.date || "";
}

function TextWithEmphasis({ text }) {
  if (!text) return null;
  const parts = String(text).split(/(\*[^*]+\*)/g);
  return parts.map((part, index) =>
    part.startsWith("*") && part.endsWith("*") ? <strong key={index}>{part.slice(1, -1)}</strong> : part,
  );
}

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // Fall through to the selection-based copy used by older iOS PWAs.
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
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
        <Plane aria-hidden="true" size={14} />
        {tripMeta.kicker}
      </p>
      <h1>{tripMeta.title}</h1>
      <p className="trip-subtitle">
        <MapPin aria-hidden="true" size={15} />
        {tripMeta.subtitle}
      </p>
      <p className="trip-range">{tripMeta.range}</p>

      <nav className="tab-shell" aria-label="旅行資訊分類">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              aria-pressed={activeTab === tab.id}
              aria-controls="trip-view"
              className={cx("tab-button", activeTab === tab.id && "active")}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              type="button"
            >
              <Icon aria-hidden="true" size={17} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function DateNav({ currentIndex, onChange, todayIndex }) {
  const navRef = useRef(null);
  const buttonRefs = useRef([]);

  useEffect(() => {
    buttonRefs.current[currentIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  function scrollNav(direction) {
    navRef.current?.scrollBy({ left: direction === "left" ? -150 : 150, behavior: "smooth" });
  }

  return (
    <div className="date-nav-frame">
      <button aria-label="往前捲動日期" className="date-arrow" onClick={() => scrollNav("left")} type="button">
        <ChevronLeft aria-hidden="true" size={20} />
      </button>
      <div className="date-nav no-scrollbar" ref={navRef}>
        {itineraryDays.map((day, index) => {
          const [, month, date] = day.date.split("-");
          return (
            <button
              aria-current={currentIndex === index ? "date" : undefined}
              aria-label={`${day.dateLabel} ${day.weekdayLabel} ${day.title}`}
              className={cx("date-pill", currentIndex === index && "active", todayIndex === index && "today")}
              key={day.date}
              onClick={() => onChange(index)}
              ref={(node) => { buttonRefs.current[index] = node; }}
              type="button"
            >
              <span>{Number(month)}月</span>
              <strong>{Number(date)}</strong>
            </button>
          );
        })}
      </div>
      {todayIndex >= 0 && currentIndex !== todayIndex ? (
        <button className="today-button" onClick={() => onChange(todayIndex)} type="button">
          <CalendarDays aria-hidden="true" size={16} />
          今天
        </button>
      ) : (
        <button aria-label="往後捲動日期" className="date-arrow" onClick={() => scrollNav("right")} type="button">
          <ChevronRight aria-hidden="true" size={20} />
        </button>
      )}
    </div>
  );
}

function Badge({ badge }) {
  const cls = badge.cls || "story";
  return (
    <span className={cx("badge-pill", `badge-${cls}`)}>
      <AppIcon name={badge.icon} type={cls} size={13} />
      {badge.text || typeLabels[cls]}
    </span>
  );
}

function ActionButtons({ actions, title }) {
  const [copyStatus, setCopyStatus] = useState("idle");
  const resetTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  async function handleCopy(value) {
    window.clearTimeout(resetTimerRef.current);
    try {
      await copyText(value);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    resetTimerRef.current = window.setTimeout(() => setCopyStatus("idle"), 1800);
  }

  if (!actions?.length) return null;

  return (
    <div className="event-actions">
      {actions.map((action) => {
        if (action.type === "copy") {
          return (
            <button
              className="action-button"
              key={`${action.type}-${action.label}`}
              onClick={() => handleCopy(action.copyText)}
              aria-label={`${action.label}：${title}`}
              title={`複製${title}`}
              type="button"
            >
              {copyStatus === "copied" ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
              {copyStatus === "copied" ? "已複製" : copyStatus === "failed" ? "複製失敗" : action.label}
            </button>
          );
        }
        const Icon = action.type === "map" ? Navigation : ExternalLink;
        return (
          <a aria-label={`${action.label}：${title}`} className="action-button" href={action.href} key={`${action.type}-${action.label}`} rel="noreferrer" target="_blank">
            <Icon aria-hidden="true" size={15} />
            {action.label}
          </a>
        );
      })}
      <span aria-live="polite" className="sr-only">
        {copyStatus === "copied" ? `${title}已複製` : copyStatus === "failed" ? `${title}無法複製` : ""}
      </span>
    </div>
  );
}

function EventCard({ date, event, status, index }) {
  const [isOpen, setIsOpen] = useState(false);
  const type = event.type || "story";
  const extraBadges = event.badges?.filter((badge) => badge.cls !== type && badge.text !== typeLabels[type]);
  const actions = getEventActions(date, event.title);
  const tipId = `tip-${date}-${index}`;

  return (
    <article className={cx("event-card", `card-${type}`, status && "event-highlight")}>
      <div className="event-main">
        <div className={cx("event-icon", `text-${type}`)}>
          <AppIcon name={event.icon} type={type} size={19} />
        </div>
        <div className="event-copy">
          <div className="event-meta">
            <span className={cx("event-time", `text-${type}`)}>{formatEventTime(event.time)}</span>
            <span className={cx("badge-pill", `badge-${type}`)}>{typeLabels[type] || "行程"}</span>
            {status ? <span className="status-badge">{status}</span> : null}
          </div>
          <h3>{event.title}</h3>
          {event.desc ? <p className="event-desc"><TextWithEmphasis text={event.desc} /></p> : null}
          {extraBadges?.length ? <div className="badge-row">{extraBadges.map((badge, badgeIndex) => <Badge badge={badge} key={`${badge.text}-${badgeIndex}`} />)}</div> : null}
          <ActionButtons actions={actions} title={event.title} />
        </div>
      </div>

      {event.tip ? (
        <div className="tip-panel">
          <button
            aria-controls={tipId}
            aria-expanded={isOpen}
            className="tip-toggle"
            onClick={() => setIsOpen((value) => !value)}
            type="button"
          >
            <Info aria-hidden="true" size={16} />
            <span>{event.tip.title}</span>
            <ChevronDown aria-hidden="true" className={isOpen ? "rotated" : undefined} size={15} />
          </button>
          <div className={cx("tip-body", isOpen && "open")} hidden={!isOpen} id={tipId}>
            <p>{event.tip.content}</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DayCard({ currentIndex, now, onChange }) {
  const day = itineraryDays[currentIndex];
  const date = new Date(`${day.date}T12:00:00`);
  const events = day.events.filter((event) => !(event.time === "住宿" && event.title.includes(day.accommodation)));
  const accommodationActions = day.accommodation && day.accommodation !== "--"
    ? getEventActions(day.date, `住宿：${day.accommodation}`)
    : [];
  const operationalDay = getOperationalDay(new Date(now));
  const tokyo = getTokyoParts(new Date(now));
  const operationalMinutes = tokyo.hour < 5 && operationalDay !== tokyo.date
    ? (tokyo.hour + 24) * 60 + tokyo.minute
    : tokyo.hour * 60 + tokyo.minute;

  const activeIndexes = new Set();
  const nextIndexes = new Set();
  if (day.date === operationalDay) {
    const slots = events.map((event) => parseEventSlot(event.time));
    slots.forEach((slot, index) => {
      if (slot && slot.start <= operationalMinutes && operationalMinutes < slot.end) {
        activeIndexes.add(index);
      }
    });

    if (!activeIndexes.size) {
      const nextStart = Math.min(
        ...slots
          .map((slot) => slot?.start)
          .filter((start) => Number.isFinite(start) && start > operationalMinutes),
      );
      slots.forEach((slot, index) => {
        if (slot?.start === nextStart) nextIndexes.add(index);
      });
    }
  }

  return (
    <section className="main-card fade-in" key={day.date}>
      <div className="day-heading" tabIndex={-1}>
        <div className="date-tile">
          <strong>{date.getDate()}</strong>
          <span>{day.weekdayLabel}</span>
          <small>{day.dateLabel} · {date.getFullYear()}</small>
        </div>
        <div className="day-title-block">
          <div className="day-badges">
            <span className="dark-badge">{day.tag}</span>
            <span className="weather-badge"><MapPin aria-hidden="true" size={13} />{day.city}</span>
            {day.accommodation && day.accommodation !== "--" ? (
              <span className="weather-badge"><BedDouble aria-hidden="true" size={13} />{day.accommodation}</span>
            ) : null}
          </div>
          <h2>{day.title}</h2>
          <ActionButtons actions={accommodationActions} title={day.accommodation} />
        </div>
      </div>

      {day.notes.length ? (
        <div className="day-note">
          <Info aria-hidden="true" size={17} />
          <div>{day.notes.map((note) => <p key={note}>{note}</p>)}</div>
        </div>
      ) : null}

      <div className="event-list">
        {events.map((event, index) => (
          <EventCard
            date={day.date}
            event={event}
            index={index}
            key={`${event.time}-${event.title}`}
            status={activeIndexes.has(index) ? "目前排程" : nextIndexes.has(index) ? "接下來" : null}
          />
        ))}
      </div>

      <div className="day-controls">
        <button className="outline-button" disabled={currentIndex === 0} onClick={() => onChange(currentIndex - 1)} type="button">
          <ArrowLeft aria-hidden="true" size={17} />上一天
        </button>
        <button className="outline-button" disabled={currentIndex === itineraryDays.length - 1} onClick={() => onChange(currentIndex + 1)} type="button">
          下一天<ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </section>
  );
}

function ItineraryView({ currentIndex, now, onChange, todayIndex }) {
  return (
    <section className="view itinerary-view" id="trip-view">
      <DateNav currentIndex={currentIndex} onChange={onChange} todayIndex={todayIndex} />
      <DayCard currentIndex={currentIndex} now={now} onChange={onChange} />
    </section>
  );
}

function SummaryItem({ item, onJumpToDay }) {
  const date = resolveItemDate(item);
  const actions = date
    ? getEventActions(date, item.title).length
      ? getEventActions(date, item.title)
      : item.type === "hotel"
        ? getEventActions(date, `住宿：${item.title}`)
        : []
    : [];
  const Icon = typeIcons[item.type] || ReceiptText;
  const detail = item.desc || item.meta;

  return (
    <article className={cx("summary-item", `card-${item.type || "story"}`)}>
      <div className={cx("summary-icon", `text-${item.type || "story"}`)}><Icon aria-hidden="true" size={19} /></div>
      <div className="summary-copy">
        <p className="summary-date">{item.dateDisplay || formatDateLabel(date || item.date)}{item.time ? ` · ${formatEventTime(item.time)}` : ""}</p>
        <h3>{item.title}</h3>
        {detail ? <p><TextWithEmphasis text={detail} /></p> : null}
        <div className="summary-actions">
          {date ? (
            <button aria-label={`查看${formatDateLabel(date)}的${item.title}行程`} className="link-button" onClick={() => onJumpToDay(date)} type="button">
              查看當日行程<ArrowRight aria-hidden="true" size={15} />
            </button>
          ) : null}
          <ActionButtons actions={actions} title={item.title} />
        </div>
      </div>
    </article>
  );
}

function getCollectionItems(type) {
  const showItems = itineraryDays.flatMap((day) => day.events
    .filter((event) => event.type === "show")
    .map((event) => ({ ...event, date: day.date, dayTitle: day.title, dateLabel: day.dateLabel })));
  const eventBookings = itineraryDays.flatMap((day) => day.events
    .filter((event) => event.badges?.some((badge) => badge.cls === "booking"))
    .map((event) => ({
      ...event,
      date: day.date,
      dayTitle: day.title,
      dateLabel: day.dateLabel,
      meta: event.badges.find((badge) => badge.cls === "booking")?.text,
    })));
  const source = type === "shows"
    ? showItems
    : [...tripCollections.bookings, ...eventBookings, ...showItems];
  const seen = new Set();
  const items = source
    .map((item) => {
      const resolvedDate = resolveItemDate(item);
      const day = itineraryDays.find((candidate) => candidate.date === resolvedDate);
      const expectedTitles = item.type === "hotel" ? [item.title, `住宿：${item.title}`] : [item.title];
      const event = day?.events.find((candidate) => expectedTitles.includes(candidate.title));
      return {
        ...item,
        resolvedDate,
        time: item.time || event?.time,
        desc: item.desc || event?.desc,
      };
    })
    .filter((item) => {
      const key = `${item.resolvedDate}-${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => `${a.resolvedDate}-${a.time || ""}`.localeCompare(`${b.resolvedDate}-${b.time || ""}`));

  if (type === "shows") return items;

  const grouped = [];
  const hotels = new Map();
  items.forEach((item) => {
    if (item.type !== "hotel") {
      grouped.push(item);
      return;
    }

    const existing = hotels.get(item.title);
    if (!existing) {
      const hotel = { ...item, stayDates: [item.resolvedDate] };
      hotels.set(item.title, hotel);
      grouped.push(hotel);
      return;
    }
    existing.stayDates.push(item.resolvedDate);
  });

  return grouped.map((item) => {
    if (!item.stayDates || item.stayDates.length === 1) return item;
    const firstDay = itineraryDays.find((day) => day.date === item.stayDates[0]);
    const lastDay = itineraryDays.find((day) => day.date === item.stayDates.at(-1));
    return {
      ...item,
      dateDisplay: `${firstDay.dateLabel}–${lastDay.dateLabel}`,
      desc: "",
      meta: "",
    };
  });
}

function CollectionView({ type, onJumpToDay }) {
  const isShows = type === "shows";
  const items = useMemo(() => getCollectionItems(type), [type]);
  return (
    <section className="view info-view" id="trip-view">
      <div className="info-card">
        <div className="section-title">
          <p>{isShows ? "依日期整理的實際演出" : "住宿、車票、航班與已記錄的預約"}</p>
          <h2>{isShows ? "演出" : "票券與訂位"}</h2>
        </div>
        <div className="summary-grid">
          {items.map((item, index) => <SummaryItem item={item} key={`${item.resolvedDate}-${item.title}-${index}`} onJumpToDay={onJumpToDay} />)}
        </div>
      </div>
    </section>
  );
}

function PackingView() {
  const allItems = useMemo(() => packingCategories.flatMap((category) => category.items.map((item) => ({ id: `${category.id}:${item}`, item }))), []);
  const [checked, setChecked] = useState(() => {
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
      // The checklist still works in memory when storage is unavailable.
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

  return (
    <section className="view info-view" id="trip-view">
      <div className="info-card">
        <div className="section-title with-action">
          <div><p>只保留這趟旅行會實際核對的項目</p><h2>行前清單</h2></div>
          <button className="outline-button" onClick={() => setChecked(new Set())} type="button"><RotateCcw aria-hidden="true" size={16} />清除</button>
        </div>
        <div className="packing-progress">
          <div><strong>{checked.size}</strong><span>/ {allItems.length} 已完成</span></div>
          <progress aria-label="行前清單完成進度" max={allItems.length} value={checked.size} />
        </div>
        <div className="packing-grid">
          {packingCategories.map((category) => {
            const Icon = category.icon;
            return (
              <section className="packing-section" key={category.id}>
                <div className="mini-heading"><Icon aria-hidden="true" size={18} />{category.title}</div>
                <div className="checklist">
                  {category.items.map((item) => {
                    const id = `${category.id}:${item}`;
                    const isChecked = checked.has(id);
                    return (
                      <label className={cx("check-item", isChecked && "checked")} key={id}>
                        <input checked={isChecked} onChange={() => toggleItem(id)} type="checkbox" />
                        <span className="fake-check"><Check aria-hidden="true" size={14} /></span>
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [currentIndex, setCurrentIndex] = useState(getInitialDayIndex);
  const [now, setNow] = useState(() => Date.now());
  const shouldScrollRef = useRef(false);
  const todayIndex = findDayIndex(getOperationalDay(new Date(now)));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const date = itineraryDays[currentIndex].date;
    try {
      window.localStorage.setItem(dayStorageKey, date);
    } catch {
      // The URL remains the durable state when storage is unavailable.
    }
    if (window.location.hash !== `#${date}`) window.history.replaceState(null, "", `#${date}`);
  }, [currentIndex]);

  useEffect(() => {
    function handleHashChange() {
      const date = getHashDate();
      const index = date ? findDayIndex(date) : -1;
      if (index < 0) {
        window.history.replaceState(null, "", `#${itineraryDays[currentIndex].date}`);
        return;
      }
      shouldScrollRef.current = true;
      setCurrentIndex(index);
      setActiveTab("itinerary");
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [currentIndex]);

  useEffect(() => {
    if (activeTab !== "itinerary" || !shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    window.requestAnimationFrame(() => {
      const toolbar = document.querySelector(".date-nav-frame");
      const heading = document.querySelector(".day-heading");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      toolbar?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      heading?.focus({ preventScroll: true });
    });
  }, [activeTab, currentIndex]);

  function selectDay(index) {
    if (index < 0 || index >= itineraryDays.length) return;
    shouldScrollRef.current = true;
    setCurrentIndex(index);
    if (activeTab !== "itinerary") setActiveTab("itinerary");
  }

  function jumpToDay(date) {
    selectDay(findDayIndex(date));
  }

  const currentView = useMemo(() => {
    if (activeTab === "itinerary") return <ItineraryView currentIndex={currentIndex} now={now} onChange={selectDay} todayIndex={todayIndex} />;
    if (activeTab === "bookings") return <CollectionView onJumpToDay={jumpToDay} type="bookings" />;
    if (activeTab === "shows") return <CollectionView onJumpToDay={jumpToDay} type="shows" />;
    return <PackingView />;
  }, [activeTab, currentIndex, now, todayIndex]);

  return (
    <main className="trip-app">
      <Petals />
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {currentView}
    </main>
  );
}
