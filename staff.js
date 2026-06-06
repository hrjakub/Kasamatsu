const loginPanel = document.querySelector("[data-login-panel]");
const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const dashboard = document.querySelector("[data-dashboard]");
const dateInput = document.querySelector("[data-schedule-date]");
const refreshButton = document.querySelector("[data-refresh]");
const logoutButton = document.querySelector("[data-logout]");
const dashboardStatus = document.querySelector("[data-dashboard-status]");
const scheduleTitle = document.querySelector("[data-schedule-title]");
const floorPlan = document.querySelector("[data-floor-plan]");
const reservationList = document.querySelector("[data-reservation-list]");
const reservationCount = document.querySelector("[data-reservation-count]");
const guestCount = document.querySelector("[data-guest-count]");
const bookedCount = document.querySelector("[data-booked-count]");

let staffPassword = sessionStorage.getItem("kasamatsuStaffPassword") || "";

const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Europe/Paris",
});
dateInput.value = today;

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

dateInput.addEventListener("change", loadSchedule);
refreshButton.addEventListener("click", loadSchedule);
logoutButton.addEventListener("click", () => {
  staffPassword = "";
  sessionStorage.removeItem("kasamatsuStaffPassword");
  dashboard.hidden = true;
  loginPanel.hidden = false;
  loginForm.reset();
  loginStatus.textContent = "Schedule locked.";
});

async function openDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;

  const loaded = await loadSchedule();

  if (!loaded) {
    dashboard.hidden = true;
    loginPanel.hidden = false;
  }
}

async function loadSchedule() {
  dashboardStatus.textContent = "Loading...";
  refreshButton.disabled = true;

  try {
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: staffPassword,
        date: dateInput.value,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Could not load schedule.");
    }

    renderSchedule(data);
    dashboardStatus.textContent = `Updated ${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    return true;
  } catch (error) {
    loginStatus.textContent = error.message;
    dashboardStatus.textContent = error.message;
    return false;
  } finally {
    refreshButton.disabled = false;
  }
}

function renderSchedule(data) {
  const tables = [...(data.tables || [])].sort(
    (a, b) => tableNumber(a.table_code) - tableNumber(b.table_code)
  );
  const reservations = data.reservations || [];
  const reservationsByTable = new Map();

  reservations.forEach((reservation) => {
    const current = reservationsByTable.get(reservation.table_id) || [];
    current.push(reservation);
    reservationsByTable.set(reservation.table_id, current);
  });

  scheduleTitle.textContent = new Date(`${data.date}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );
  reservationCount.textContent = String(reservations.length);
  guestCount.textContent = String(
    reservations.reduce((total, reservation) => total + Number(reservation.guests), 0)
  );
  bookedCount.textContent = String(reservationsByTable.size);

  floorPlan.replaceChildren(
    ...tables.map((table) => createTableCard(table, reservationsByTable.get(table.id) || []))
  );

  if (!reservations.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No confirmed or requested reservations for this date.";
    reservationList.replaceChildren(empty);
    return;
  }

  reservationList.replaceChildren(
    ...reservations.map((reservation) => createReservationRow(reservation))
  );
}

function createTableCard(table, bookings) {
  const card = document.createElement("article");
  card.className = `table-card ${bookings.length ? "is-booked" : "is-available"}`;

  const heading = document.createElement("div");
  heading.className = "table-card-heading";
  heading.innerHTML = `<strong>${escapeText(table.table_code)}</strong><span>${
    bookings.length ? "Booked" : "Available"
  }</span>`;

  const details = document.createElement("p");
  details.textContent = `${table.zone} · ${table.seats} seats`;

  const times = document.createElement("div");
  times.className = "table-times";

  if (!bookings.length) {
    times.textContent = "No bookings";
  } else {
    bookings.forEach((booking) => {
      const line = document.createElement("span");
      line.textContent = `${shortTime(booking.reservation_start)}-${shortTime(
        booking.reservation_end
      )} · ${booking.guest_name}`;
      times.appendChild(line);
    });
  }

  card.append(heading, details, times);
  return card;
}

function createReservationRow(reservation) {
  const row = document.createElement("article");
  row.className = "reservation-row";

  const main = document.createElement("div");
  main.innerHTML = `
    <strong>${shortTime(reservation.reservation_start)} · ${escapeText(
      reservation.guest_name
    )}</strong>
    <span>${escapeText(reservation.table_code)} · ${reservation.guests} guests · ${
      reservation.confirmation_code
    }</span>
  `;

  const contact = document.createElement("div");
  contact.innerHTML = `
    <span>${escapeText(reservation.email)}</span>
    <span>${escapeText(reservation.phone || "No phone")}</span>
  `;

  const request = document.createElement("p");
  request.textContent = reservation.special_requests || "No special requests";

  row.append(main, contact, request);
  return row;
}

function shortTime(value) {
  return String(value || "").slice(11, 16);
}

function tableNumber(code) {
  return Number(String(code || "").replace(/\D/g, "")) || 0;
}

function escapeText(value) {
  const span = document.createElement("span");
  span.textContent = String(value || "");
  return span.innerHTML;
}
