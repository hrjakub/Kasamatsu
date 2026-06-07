const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STAFF_DASHBOARD_PASSWORD = process.env.STAFF_DASHBOARD_PASSWORD;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for the staff operations dashboard." });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STAFF_DASHBOARD_PASSWORD) {
    res.status(503).json({
      error: "The staff dashboard is not fully configured in Vercel.",
    });
    return;
  }

  const password = String(req.body?.password || "");

  if (!safeCompare(password, STAFF_DASHBOARD_PASSWORD)) {
    res.status(401).json({ error: "Incorrect staff password." });
    return;
  }

  try {
    const action = String(req.body?.action || "schedule");
    const result = await runAction(action, req.body || {});
    res.status(200).json(result);
  } catch (error) {
    console.error("Kasamatsu staff dashboard error:", error);
    res.status(500).json({
      error: error.message || "Could not complete the staff dashboard request.",
    });
  }
};

async function runAction(action, body) {
  if (action === "schedule") {
    requireDate(body.date);
    return callSupabaseRpc("get_staff_schedule", { p_date: body.date });
  }

  if (action === "calendar") {
    requireDate(body.start_date);
    requireDate(body.end_date);
    return callSupabaseRpc("get_staff_calendar", {
      p_start_date: body.start_date,
      p_end_date: body.end_date,
    });
  }

  if (action === "reservation_status") {
    requireUuid(body.reservation_id, "reservation");
    return callSupabaseRpc("update_reservation_status", {
      p_reservation_id: body.reservation_id,
      p_status: String(body.status || ""),
    });
  }

  if (action === "waitlist_status") {
    requireUuid(body.waitlist_id, "waiting-list entry");
    return callSupabaseRpc("update_waitlist_status", {
      p_waitlist_id: body.waitlist_id,
      p_status: String(body.status || ""),
    });
  }

  if (action === "promote_waitlist") {
    requireUuid(body.waitlist_id, "waiting-list entry");
    requireUuid(body.table_id, "table");
    return callSupabaseRpc("promote_waitlist_entry", {
      p_waitlist_id: body.waitlist_id,
      p_table_id: body.table_id,
    });
  }

  throw new Error("Unsupported staff dashboard action.");
}

async function callSupabaseRpc(functionName, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Could not run ${functionName}.`);
  }

  return data;
}

function requireDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    throw new Error("Choose a valid schedule date.");
  }
}

function requireUuid(value, label) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || "")
    )
  ) {
    throw new Error(`Choose a valid ${label}.`);
  }
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
