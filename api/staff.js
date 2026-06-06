const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STAFF_DASHBOARD_PASSWORD = process.env.STAFF_DASHBOARD_PASSWORD;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for the staff schedule." });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STAFF_DASHBOARD_PASSWORD) {
    res.status(503).json({
      error: "The staff dashboard is not fully configured in Vercel.",
    });
    return;
  }

  const password = String(req.body?.password || "");
  const date = String(req.body?.date || "");

  if (!safeCompare(password, STAFF_DASHBOARD_PASSWORD)) {
    res.status(401).json({ error: "Incorrect staff password." });
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Choose a valid schedule date." });
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_staff_schedule`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_date: date }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Could not load the staff schedule.");
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Kasamatsu staff dashboard error:", error);
    res.status(500).json({ error: "Could not load the staff schedule." });
  }
};

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
