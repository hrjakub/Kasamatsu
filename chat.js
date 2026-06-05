const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_HISTORY_ITEMS = 12;
const MAX_MESSAGE_LENGTH = 1600;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const tools = [
  {
    type: "function",
    name: "check_availability",
    description:
      "Check whether Kasamatsu has suitable tables available for a requested date, time, guest count, and optional table preference.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        date: {
          type: "string",
          description: "Reservation date in YYYY-MM-DD format.",
        },
        time: {
          type: "string",
          description: "Reservation time in 24-hour HH:MM format.",
        },
        guests: {
          type: "integer",
          minimum: 1,
          maximum: 12,
          description: "Number of guests.",
        },
        preferred_zone: {
          type: "string",
          description:
            "Optional table preference such as terrace, garden, chef counter, private alcove, quiet, romantic, or best table.",
        },
      },
      required: ["date", "time", "guests"],
    },
  },
  {
    type: "function",
    name: "create_reservation",
    description:
      "Create a confirmed reservation after the guest has provided name, email, date, time, guest count, and any special requests.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        date: {
          type: "string",
          description: "Reservation date in YYYY-MM-DD format.",
        },
        time: {
          type: "string",
          description: "Reservation time in 24-hour HH:MM format.",
        },
        guests: {
          type: "integer",
          minimum: 1,
          maximum: 12,
          description: "Number of guests.",
        },
        guest_name: {
          type: "string",
          description: "Full name of the guest making the booking.",
        },
        email: {
          type: "string",
          description: "Guest email address.",
        },
        phone: {
          type: "string",
          description: "Optional guest phone number.",
        },
        special_requests: {
          type: "string",
          description:
            "Special requests such as cake, birthday surprise, champagne, allergies, preferred wine, accessibility, or table preference.",
        },
        preferred_zone: {
          type: "string",
          description:
            "Optional table preference such as terrace, garden, chef counter, private alcove, quiet, romantic, or best table.",
        },
      },
      required: ["date", "time", "guests", "guest_name", "email"],
    },
  },
];

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for the booking assistant." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(200).json({
      reply:
        "The Kasamatsu assistant is installed, but the OpenAI key is not connected in Vercel yet. Add OPENAI_API_KEY, then I can check tables and help book reservations.",
    });
    return;
  }

  const messages = normalizeMessages(req.body?.messages);

  if (!messages.length) {
    res.status(400).json({ error: "Please send at least one message." });
    return;
  }

  try {
    let response = await createOpenAIResponse({
      input: messages,
      instructions: buildInstructions(),
      tools,
    });

    const calls = getFunctionCalls(response);

    if (calls.length) {
      const outputs = [];

      for (const call of calls) {
        outputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(await runTool(call)),
        });
      }

      response = await createOpenAIResponse({
        previous_response_id: response.id,
        input: outputs,
        instructions: buildInstructions(),
        tools,
      });
    }

    res.status(200).json({
      reply: extractOutputText(response),
    });
  } catch (error) {
    console.error("Kasamatsu assistant error:", error);
    res.status(500).json({
      error:
        "The booking assistant could not finish this request. Check the Vercel function logs for details.",
    });
  }
};

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function buildInstructions() {
  return `
You are the Kasamatsu AI booking assistant for a premium Japanese restaurant concept near Ramatuelle and Saint-Tropez.

Tone:
- Calm, precise, warm, and natural.
- Never sound like a generic support bot.
- Keep replies short unless the guest asks for detail.

Restaurant facts:
- Cuisine: Japanese dining with Mediterranean light.
- Menu preview: omakase, robata, seasonal fish, sake, cocktails, and wine.
- The full public address is not finalized in this prototype.
- Prototype dinner service is Tuesday to Saturday.
- Prototype seating times are between 18:30 and 21:30.
- Maximum online party size is 12 guests.

Booking rules:
- Ask for missing date, time, guest count, guest name, and email before creating a reservation.
- Use check_availability before discussing table options.
- Use create_reservation only after the guest has provided the required details.
- Never say a reservation is confirmed unless create_reservation returns success: true.
- If a guest asks for cake, champagne, flowers, surprise, allergies, or a preferred table, include it in special_requests.
- Say special requests are recorded for the team, not guaranteed, unless the database confirms a normal reservation.

Current server date and time: ${new Date().toISOString()}.
`.trim();
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.trim())
    .slice(-MAX_HISTORY_ITEMS);
}

async function createOpenAIResponse(payload) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      ...payload,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI request failed.");
  }

  return data;
}

function getFunctionCalls(response) {
  return (response.output || []).filter((item) => item.type === "function_call");
}

async function runTool(call) {
  const args = safeJsonParse(call.arguments);

  if (call.name === "check_availability") {
    return checkAvailability(args);
  }

  if (call.name === "create_reservation") {
    return createReservation(args);
  }

  return {
    success: false,
    reason: `Unknown tool: ${call.name}`,
  };
}

async function checkAvailability(args) {
  const serviceCheck = validateServiceRequest(args);

  if (!serviceCheck.ok) {
    return serviceCheck;
  }

  const tables = await callSupabaseRpc("find_available_tables", {
    p_date: args.date,
    p_time: args.time,
    p_guests: Number(args.guests),
    p_preferred_zone: args.preferred_zone || null,
  });

  if (tables?.configured === false) return tables;

  return {
    success: true,
    available: Array.isArray(tables) && tables.length > 0,
    requested: {
      date: args.date,
      time: args.time,
      guests: Number(args.guests),
      preferred_zone: args.preferred_zone || null,
    },
    tables,
  };
}

async function createReservation(args) {
  const serviceCheck = validateServiceRequest(args);

  if (!serviceCheck.ok) {
    return serviceCheck;
  }

  if (!args.guest_name || !args.email) {
    return {
      success: false,
      reason: "Guest name and email are required before creating a reservation.",
    };
  }

  return callSupabaseRpc("create_reservation_if_available", {
    p_date: args.date,
    p_time: args.time,
    p_guests: Number(args.guests),
    p_guest_name: args.guest_name,
    p_email: args.email,
    p_phone: args.phone || null,
    p_special_requests: args.special_requests || null,
    p_preferred_zone: args.preferred_zone || null,
  });
}

function validateServiceRequest(args) {
  const guests = Number(args.guests);
  const timeParts = String(args.time || "").split(":").map(Number);
  const dateParts = String(args.date || "").split("-").map(Number);

  if (dateParts.length !== 3 || timeParts.length < 2) {
    return {
      ok: false,
      success: false,
      reason: "Date must be YYYY-MM-DD and time must be HH:MM.",
    };
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
    return {
      ok: false,
      success: false,
      reason: "Online reservations support 1 to 12 guests.",
    };
  }

  const requestedDay = new Date(
    Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])
  ).getUTCDay();

  if (requestedDay === 0 || requestedDay === 1) {
    return {
      ok: false,
      success: false,
      reason: "Kasamatsu prototype dinner service is Tuesday to Saturday.",
    };
  }

  const minutes = timeParts[0] * 60 + timeParts[1];
  const opens = 18 * 60 + 30;
  const lastSeating = 21 * 60 + 30;

  if (minutes < opens || minutes > lastSeating) {
    return {
      ok: false,
      success: false,
      reason: "Prototype seating times are between 18:30 and 21:30.",
    };
  }

  return { ok: true };
}

async function callSupabaseRpc(functionName, payload) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      configured: false,
      success: false,
      reason:
        "Supabase is not connected yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.",
    };
  }

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
    throw new Error(data.message || `Supabase RPC failed: ${functionName}`);
  }

  return data;
}

function extractOutputText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .filter(Boolean)
      .join("\n")
      .trim() ||
    "I received that. Please share the reservation date, time, guest count, name, and email."
  );
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}
