const loginPanel = document.querySelector("[data-login-panel]");
const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const dashboard = document.querySelector("[data-dashboard]");
const dateInput = document.querySelector("[data-schedule-date]");
const refreshButton = document.querySelector("[data-refresh]");
const logoutButton = document.querySelector("[data-logout]");
const dashboardStatus = document.querySelector("[data-dashboard-status]");
const scheduleTitle = document.querySelector("[data-schedule-title]");
const dayTableGrid = document.querySelector("[data-day-table-grid]");
const reservationList = document.querySelector("[data-reservation-list]");
const restaurantMap = document.querySelector("[data-restaurant-map]");
const waitlistList = document.querySelector("[data-waitlist-list]");
const waitingBadge = document.querySelector("[data-waiting-badge]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const calendarTitle = document.querySelector("[data-calendar-title]");
const calendarPrevious = document.querySelector("[data-calendar-previous]");
const calendarNext = document.querySelector("[data-calendar-next]");
const viewButtons = [...document.querySelectorAll("[data-view-button]")];
const views = [...document.querySelectorAll("[data-view]")];
const reservationCount = document.querySelector("[data-reservation-count]");
const guestCount = document.querySelector("[data-guest-count]");
const bookedCount = document.querySelector("[data-booked-count]");
const freeCount = document.querySelector("[data-free-count]");

const SERVICE_STARTS = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const ACTIVE_STATUSES = new Set(["confirmed", "requested", "seated"]);
const TABLE_LAYOUT = {
  T1: [12, 18, "round"],
  T2: [30, 18, "round"],
  T3: [68, 14, "round"],
  T4: [86, 18, "square"],
  T5: [16, 52, "square"],
  T6: [38, 50, "square"],
  T7: [58, 46, "counter"],
  T8: [82, 52, "square"],
  T9: [20, 82, "alcove"],
  T10: [68, 82, "group"],
};

let staffPassword = sessionStorage.getItem("kasamatsuStaffPassword") || "";
let currentData = { tables: [], reservations: [], waitlist: [] };
let activeView = "day";
let calendarCursor = new Date();
let liveTimer = 0;

const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Europe/Paris",
});
dateInput.value = today;
calendarCursor = new Date(`${today}T12:00:00`);

if (staffPassword) {
  openDashboard();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  staffPassword = String(new FormData(loginForm).get("password") || "");
  loginStatus.textContent = "Checking access...";

  const loaded = await loadSchedule();

  if (loaded) {
    sessionStorage.setItem("kasamatsuStaffPassword", staffPassword);
    loginPanel.hidden = true;
    dashboard.hidden = false;
    loginStatus.textContent = "";
  }
});

dateInput.addEventListener("change", async () => {
  calendarCursor = new Date(`${dateInput.value}T12:00:00`);
  await loadSchedule();
  if (activeView === "calendar") await loadCalendar();
});
refreshButton.addEventListener("click", refreshActiveView);
logoutButton.addEventListener("click", lockDashboard);
calendarPrevious.addEventListener("click", () => changeMonth(-1));
calendarNext.addEventListener("click", () => changeMonth(1));

viewButtons.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.viewButton));
});

async function openDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;

  const loaded = await loadSchedule();

  if (!loaded) {
    lockDashboard();
  }
}

function lockDashboard() {
  staffPassword = "";
  sessionStorage.removeItem("kasamatsuStaffPassword");
  dashboard.hidden = true;
  loginPanel.hidden = false;
  loginForm.reset();
  loginStatus.textContent = "Dashboard locked.";
  window.clearInterval(liveTimer);
}

async function switchView(viewName) {
  activeView = viewName;
  viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === viewName);
  });
  views.forEach((view) => {
    const isActive = view.dataset.view === viewName;
    view.hidden = !isActive;
    view.classList.toggle("is-active", isActive);
  });

  if (viewName === "calendar") {
    await loadCalendar();
  }

  if (viewName === "live") {
    renderLiveFloor();
    window.clearInterval(liveTimer);
    liveTimer = window.setInterval(renderLiveFloor, 30000);
  } else {
    window.clearInterval(liveTimer);
  }
}

async function refreshActiveView() {
  await loadSchedule();
  if (activeView === "calendar") await loadCalendar();
}

async function loadSchedule() {
  setStatus("Loading schedule...");
  refreshButton.disabled = true;

  try {
    currentData = await staffRequest({
      action: "schedule",
      date: dateInput.value,
    });
    renderSchedule(currentData);
    setStatus(`Updated ${timeLabel(new Date())}`);
    return true;
  } catch (error) {
    loginStatus.textContent = error.message;
    setStatus(error.message);
    return false;
  } finally {
    refreshButton.disabled = false;
  }
}

async function loadCalendar() {
  setStatus("Loading calendar...");
  const start = startOfCalendar(calendarCursor);
  const end = new Date(start);
  end.setDate(end.getDate() + 41);

  try {
    const days = await staffRequest({
      action: "calendar",
      start_date: isoDate(start),
      end_date: isoDate(end),
    });
    renderCalendar(days, start);
    setStatus(`Updated ${timeLabel(new Date())}`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function changeMonth(amount) {
  calendarCursor = new Date(
    calendarCursor.getFullYear(),
    calendarCursor.getMonth() + amount,
    1,
    12
  );
  await loadCalendar();
}

async function staffRequest(payload) {
  const response = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: staffPassword, ...payload }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    throw new Error(data.error || data.reason || "Could not load restaurant operations.");
  }

  return data;
}

function renderSchedule(data) {
  const tables = sortedTables(data.tables || []);
  const reservations = data.reservations || [];
  const waitlist = data.waitlist || [];
  const activeReservations = reservations.filter((reservation) =>
    ACTIVE_STATUSES.has(reservation.status)
  );
  const reservationsByTable = groupBy(activeReservations, "table_id");
  const freeStarts = tables.reduce(
    (total, table) => total + getFreeStarts(reservationsByTable.get(table.id) || []).length,
    0
  );

  scheduleTitle.textContent = formatLongDate(data.date);
  reservationCount.textContent = String(activeReservations.length);
  guestCount.textContent = String(
    activeReservations.reduce((total, reservation) => total + Number(reservation.guests), 0)
  );
  bookedCount.textContent = String(reservationsByTable.size);
  freeCount.textContent = String(freeStarts);
  waitingBadge.textContent = String(waitlist.length);

  dayTableGrid.replaceChildren(
    ...tables.map((table) =>
      createDayTable(table, reservationsByTable.get(table.id) || [])
    )
  );
  renderReservationList(reservations);
  renderLiveFloor();
  renderWaitlist(waitlist, tables, reservationsByTable);
}

function createDayTable(table, bookings) {
  const article = document.createElement("article");
  article.className = "day-table";
  const freeStarts = getFreeStarts(bookings);
  const heading = element("div", "table-heading");
  heading.append(
    element("strong", "", table.table_code),
    badge(bookings.length ? `${bookings.length} bookings` : "Fully open", bookings.length ? "busy" : "free")
  );
  article.append(
    heading,
    element("p", "table-meta", `${table.zone} · ${table.seats} seats`),
    element("p", "table-description", table.description)
  );

  const bookingLines = element("div", "compact-bookings");
  if (!bookings.length) {
    bookingLines.append(element("span", "", "No reservations"));
  } else {
    bookings.forEach((booking) => {
      bookingLines.append(
        element(
          "span",
          "",
          `${shortTime(booking.reservation_start)}-${shortTime(booking.reservation_end)} · ${booking.guest_name}`
        )
      );
    });
  }

  const free = element("div", "free-spots");
  free.append(element("small", "", "Free starts"));
  if (!freeStarts.length) {
    free.append(element("span", "no-free-spots", "No 2-hour starts"));
  } else {
    freeStarts.forEach((time) => free.append(badge(time, "free")));
  }
  article.append(bookingLines, free);
  return article;
}

function renderReservationList(reservations) {
  if (!reservations.length) {
    reservationList.replaceChildren(
      element("p", "empty-state", "No reservations recorded for this date.")
    );
    return;
  }

  reservationList.replaceChildren(
    ...reservations.map((reservation) => createReservationRow(reservation))
  );
}

function createReservationRow(reservation) {
  const row = element("article", `reservation-row status-${reservation.status}`);
  const main = element("div", "reservation-main");
  main.append(
    element("strong", "", `${shortTime(reservation.reservation_start)} · ${reservation.guest_name}`),
    element(
      "span",
      "",
      `${reservation.table_code} · ${reservation.guests} guests · ${reservation.confirmation_code}`
    )
  );
  const contact = element("div", "reservation-contact");
  contact.append(
    element("span", "", reservation.email),
    element("span", "", reservation.phone || "No phone")
  );
  const request = element(
    "p",
    "reservation-request",
    reservation.special_requests || "No special requests"
  );
  const actions = element("div", "row-actions");
  actions.append(badge(reservation.status.replace("_", " "), reservation.status));

  if (["confirmed", "requested"].includes(reservation.status)) {
    actions.append(actionButton("Check in", () => updateReservation(reservation.id, "seated")));
    actions.append(actionButton("No show", () => updateReservation(reservation.id, "no_show"), true));
  } else if (reservation.status === "seated") {
    actions.append(actionButton("Complete", () => updateReservation(reservation.id, "completed")));
  }

  row.append(main, contact, request, actions);
  return row;
}

function renderLiveFloor() {
  if (!restaurantMap || !currentData.tables) return;

  const activeReservations = (currentData.reservations || []).filter((reservation) =>
    ACTIVE_STATUSES.has(reservation.status)
  );
  const byTable = groupBy(activeReservations, "table_id");

  restaurantMap.replaceChildren(
    element("span", "map-label map-label-terrace", "Terrace"),
    element("span", "map-label map-label-garden", "Garden"),
    element("span", "map-label map-label-room", "Dining room"),
    element("span", "map-label map-label-counter", "Chef counter"),
    ...sortedTables(currentData.tables || []).map((table) =>
      createMapTable(table, byTable.get(table.id) || [])
    )
  );
}

function createMapTable(table, bookings) {
  const [x, y, shape] = TABLE_LAYOUT[table.table_code] || [50, 50, "square"];
  const current = getCurrentBooking(bookings);
  const next = getNextBooking(bookings);
  const state = current ? liveState(current) : next ? "upcoming" : "free";
  const node = element("article", `map-table shape-${shape} state-${state}`);
  node.style.left = `${x}%`;
  node.style.top = `${y}%`;
  node.append(element("strong", "", table.table_code), element("span", "", `${table.seats} seats`));

  if (current) {
    const elapsed = elapsedLabel(current);
    const remaining = remainingLabel(current);
    node.append(
      element("b", "", current.guest_name),
      element("small", "", `${elapsed} · ${remaining}`)
    );
  } else if (next) {
    node.append(
      element("b", "", `Next ${shortTime(next.reservation_start)}`),
      element("small", "", next.guest_name)
    );
  } else {
    node.append(element("b", "", "Free now"), element("small", "", table.zone));
  }
  return node;
}

function renderWaitlist(waitlist, tables, reservationsByTable) {
  if (!waitlist.length) {
    waitlistList.replaceChildren(
      element("p", "empty-state", "No active preferred-table requests for this date.")
    );
    return;
  }

  const firstByRequest = new Map();

  waitlist.forEach((entry) => {
    const key = waitlistRequestKey(entry);
    if (!firstByRequest.has(key)) firstByRequest.set(key, entry.id);
  });

  waitlistList.replaceChildren(
    ...waitlist.map((entry, index) =>
      createWaitlistRow(
        entry,
        index + 1,
        tables,
        reservationsByTable,
        firstByRequest.get(waitlistRequestKey(entry)) === entry.id
      )
    )
  );
}

function createWaitlistRow(entry, position, tables, reservationsByTable, isFirstForRequest) {
  const row = element("article", "waitlist-row");
  const main = element("div", "waitlist-main");
  main.append(
    element("strong", "", `#${position} · ${entry.guest_name}`),
    element(
      "span",
      "",
      `${entry.guests} guests · ${shortTime(entry.requested_time)} · wants ${entry.requested_preference}`
    ),
    element("small", "", entry.notes || "No additional notes")
  );
  const contact = element("div", "waitlist-contact");
  contact.append(element("span", "", entry.email), element("span", "", entry.phone || "No phone"));

  const controls = element("div", "waitlist-controls");
  const select = document.createElement("select");
  select.setAttribute("aria-label", `Assign table to ${entry.guest_name}`);
  select.append(new Option("Choose a free table", ""));
  getAssignableTables(entry, tables, reservationsByTable).forEach((table) => {
    select.append(new Option(`${table.table_code} · ${table.zone} · ${table.seats} seats`, table.id));
  });
  select.disabled = !isFirstForRequest;
  const assign = actionButton("Assign", () => promoteWaitlist(entry.id, select.value));
  assign.disabled = !isFirstForRequest;
  assign.title = isFirstForRequest
    ? "Assign a genuinely free table"
    : "An earlier guest is first in line for this request";
  controls.append(
    select,
    assign,
    actionButton("Notify", () => updateWaitlist(entry.id, "notified")),
    actionButton("Remove", () => updateWaitlist(entry.id, "cancelled"), true)
  );
  if (!isFirstForRequest) {
    controls.append(
      element("small", "queue-note", "An earlier guest is first for this table or area.")
    );
  }
  row.append(main, contact, controls);
  return row;
}

function renderCalendar(days, start) {
  const byDate = new Map((days || []).map((day) => [day.reservation_date, day]));
  const selectedMonth = calendarCursor.getMonth();
  calendarTitle.textContent = calendarCursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = isoDate(date);
    const data = byDate.get(key) || {
      reservation_count: 0,
      guest_count: 0,
      waiting_count: 0,
      table_bookings: [],
    };
    const cell = element(
      "button",
      `calendar-day ${date.getMonth() === selectedMonth ? "" : "outside-month"}`.trim()
    );
    cell.type = "button";
    cell.append(
      element("strong", "", String(date.getDate())),
      element(
        "span",
        "calendar-count",
        `${data.reservation_count || 0} bookings · ${data.guest_count || 0} guests`
      )
    );
    const tableLines = element("div", "calendar-table-lines");
    (data.table_bookings || []).slice(0, 4).forEach((booking) => {
      tableLines.append(
        element("small", "", `${booking.table_code} ${shortTime(booking.time)} · ${booking.guests}`)
      );
    });
    if ((data.table_bookings || []).length > 4) {
      tableLines.append(element("small", "", `+${data.table_bookings.length - 4} more`));
    }
    if (Number(data.waiting_count) > 0) {
      tableLines.append(element("small", "calendar-waiting", `${data.waiting_count} waiting`));
    }
    cell.append(tableLines);
    cell.addEventListener("click", async () => {
      dateInput.value = key;
      await loadSchedule();
      switchView("day");
    });
    cells.push(cell);
  }
  calendarGrid.replaceChildren(...cells);
}

async function updateReservation(id, status) {
  if (!window.confirm(`Change this reservation to ${status.replace("_", " ")}?`)) return;
  await runMutation({ action: "reservation_status", reservation_id: id, status });
}

async function updateWaitlist(id, status) {
  await runMutation({ action: "waitlist_status", waitlist_id: id, status });
}

async function promoteWaitlist(waitlistId, tableId) {
  if (!tableId) {
    setStatus("Choose a genuinely free table first.");
    return;
  }
  if (!window.confirm("Assign this table to the first waiting guest?")) return;
  await runMutation({ action: "promote_waitlist", waitlist_id: waitlistId, table_id: tableId });
}

async function runMutation(payload) {
  setStatus("Saving...");
  try {
    await staffRequest(payload);
    await loadSchedule();
  } catch (error) {
    setStatus(error.message);
  }
}

function getFreeStarts(bookings) {
  return SERVICE_STARTS.filter((start) => {
    const startMinutes = minutesFromTime(start);
    const endMinutes = startMinutes + 120;
    return !bookings.some((booking) => {
      const bookingStart = minutesFromTime(shortTime(booking.reservation_start));
      const bookingEnd = minutesFromTime(shortTime(booking.reservation_end));
      return startMinutes < bookingEnd && endMinutes > bookingStart;
    });
  });
}

function getAssignableTables(entry, tables, reservationsByTable) {
  const requestedStart = minutesFromTime(shortTime(entry.requested_time));
  const requestedEnd = requestedStart + Number(entry.duration_minutes || 120);
  return sortedTables(tables).filter((table) => {
    if (Number(table.seats) < Number(entry.guests)) return false;
    return !(reservationsByTable.get(table.id) || []).some((booking) => {
      const bookingStart = minutesFromTime(shortTime(booking.reservation_start));
      const bookingEnd = minutesFromTime(shortTime(booking.reservation_end));
      return requestedStart < bookingEnd && requestedEnd > bookingStart;
    });
  });
}

function getCurrentBooking(bookings) {
  const now = new Date();
  return bookings.find((booking) => {
    const start = localDateTime(booking.reservation_start);
    const end = localDateTime(booking.reservation_end);
    return now >= start && (now < end || booking.status === "seated");
  });
}

function getNextBooking(bookings) {
  const now = new Date();
  return bookings
    .filter((booking) => localDateTime(booking.reservation_start) > now)
    .sort((a, b) => localDateTime(a.reservation_start) - localDateTime(b.reservation_start))[0];
}

function liveState(booking) {
  return new Date() > localDateTime(booking.reservation_end) ? "overtime" : "seated";
}

function elapsedLabel(booking) {
  const start = booking.checked_in_at
    ? new Date(booking.checked_in_at)
    : localDateTime(booking.reservation_start);
  const minutes = Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000));
  return `${minutes}m elapsed`;
}

function remainingLabel(booking) {
  const minutes = Math.floor((localDateTime(booking.reservation_end).getTime() - Date.now()) / 60000);
  return minutes >= 0 ? `${minutes}m left` : `${Math.abs(minutes)}m over`;
}

function localDateTime(value) {
  return new Date(String(value || "").replace(" ", "T"));
}

function startOfCalendar(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - mondayOffset);
  return first;
}

function sortedTables(tables) {
  return [...tables].sort((a, b) => tableNumber(a.table_code) - tableNumber(b.table_code));
}

function groupBy(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const current = map.get(item[key]) || [];
    current.push(item);
    map.set(item[key], current);
  });
  return map;
}

function waitlistRequestKey(entry) {
  return [
    entry.requested_date,
    shortTime(entry.requested_time),
    String(entry.requested_preference || "").trim().toLowerCase(),
  ].join("|");
}

function actionButton(label, action, secondary = false) {
  const button = element("button", secondary ? "small-action secondary" : "small-action", label);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

function badge(label, tone) {
  return element("span", `badge badge-${tone}`, label);
}

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function setStatus(message) {
  dashboardStatus.textContent = message;
}

function shortTime(value) {
  const text = String(value || "");
  const match = text.match(/(\d{2}:\d{2})/);
  return match ? match[1] : text.slice(0, 5);
}

function minutesFromTime(value) {
  const [hours, minutes] = String(value || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function tableNumber(code) {
  return Number(String(code || "").replace(/\D/g, "")) || 0;
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function timeLabel(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
