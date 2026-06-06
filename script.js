const logo = document.querySelector("[data-logo-breeze]");
const form = document.querySelector("[data-reservation-form]");
const formStatus = document.querySelector("[data-form-status]");
const chatForm = document.querySelector("[data-chat-form]");
const chatInput = document.querySelector("#assistant-input");
const chatMessages = document.querySelector("[data-chat-messages]");
const chatConnection = document.querySelector("[data-chat-connection]");
const chatLauncher = document.querySelector("[data-chat-launcher]");
const chatReset = document.querySelector("[data-chat-reset]");
const promptButtons = [...document.querySelectorAll("[data-chat-prompt]")];

const chatHistory = [];
const initialChatMessage =
  "Good evening. I can help with live table availability, menu and allergy questions, or a reservation. What would you like?";

if (logo) {
  const canAnimate =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canAnimate) {
    const clusters = [...logo.querySelectorAll(".needle-cluster")];
    const state = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      frame: 0,
    };

    const moveNeedles = (time) => {
      state.currentX += (state.targetX - state.currentX) * 0.13;
      state.currentY += (state.targetY - state.currentY) * 0.13;

      clusters.forEach((cluster) => {
        const depth = Number(cluster.dataset.depth || 1);
        const phase = Number(cluster.dataset.phase || 0);
        const pulse = Math.sin(time * 0.0014 + phase * Math.PI) * 0.28;
        const tx = state.currentX * 3.2 * depth + pulse;
        const ty = state.currentY * 1.5 * depth - Math.abs(state.currentX) * 0.32;
        const rotate = state.currentX * 2.2 * depth + state.currentY * 0.58 + pulse;

        cluster.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rotate}deg)`;
      });

      state.frame = requestAnimationFrame(moveNeedles);
    };

    const start = () => {
      logo.classList.add("is-active");
      if (!state.frame) {
        state.frame = requestAnimationFrame(moveNeedles);
      }
    };

    const updateTarget = (event) => {
      const rect = logo.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      state.targetX = Math.max(-1, Math.min(1, (x - 0.5) * 2));
      state.targetY = Math.max(-1, Math.min(1, (y - 0.5) * 2));
    };

    const rest = () => {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.targetX = 0;
      state.targetY = 0;
      state.currentX = 0;
      state.currentY = 0;
      logo.classList.remove("is-active");
      clusters.forEach((cluster) => {
        cluster.style.transform = "translate3d(0px, 0px, 0) rotate(0deg)";
      });
    };

    logo.addEventListener("pointerenter", start);
    logo.addEventListener("pointermove", updateTarget);
    logo.addEventListener("pointerleave", rest);
  }
}

const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Europe/Paris",
});
const dateInput = document.querySelector("#date");

if (dateInput) {
  dateInput.min = today;
}

const setChatBusy = (isBusy) => {
  if (chatInput) {
    chatInput.disabled = isBusy;
  }

  promptButtons.forEach((button) => {
    button.disabled = isBusy;
  });

  if (chatConnection) {
    chatConnection.textContent = isBusy ? "Thinking" : "Ready";
  }
};

const scrollChatToBottom = () => {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
};

const addChatMessage = (role, content) => {
  if (!chatMessages || !content) return;

  const message = document.createElement("div");
  message.className = `assistant-message assistant-message-${role}`;
  message.textContent = content;
  chatMessages.appendChild(message);
  scrollChatToBottom();
};

const openAssistant = () => {
  const assistant = document.querySelector("#assistant");

  if (assistant) {
    assistant.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  window.setTimeout(() => {
    chatInput?.focus();
  }, 420);
};

const sendChatMessage = async (content) => {
  const message = content.trim();
  if (!message) return;

  addChatMessage("user", message);
  chatHistory.push({ role: "user", content: message });
  setChatBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory.slice(-12),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "The assistant could not respond.");
    }

    const reply =
      data.reply ||
      "I received that. Please share the date, time, guest count, and any special request.";

    addChatMessage("bot", reply);
    chatHistory.push({ role: "assistant", content: reply });
  } catch (error) {
    addChatMessage(
      "system",
      window.location.protocol === "file:"
        ? "The real assistant works after the site is deployed on Vercel, because it needs the /api/chat backend."
        : "I’m sorry, I could not complete that request just now. Please try again."
    );
  } finally {
    setChatBusy(false);
  }
};

if (chatForm && chatInput) {
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value;
    chatInput.value = "";
    sendChatMessage(message);
  });
}

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openAssistant();
    sendChatMessage(button.dataset.chatPrompt || "");
  });
});

if (chatLauncher) {
  chatLauncher.addEventListener("click", openAssistant);
}

if (chatReset) {
  chatReset.addEventListener("click", () => {
    chatHistory.length = 0;
    chatMessages?.replaceChildren();
    addChatMessage("bot", initialChatMessage);
    chatInput?.focus();
  });
}

if (form && formStatus) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const details = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      date: formData.get("date"),
      time: formData.get("time"),
      guests: formData.get("guests"),
      message: formData.get("message"),
    };

    const prompt = [
      "I would like to request a reservation.",
      `Name: ${details.name || "Not provided"}.`,
      `Email: ${details.email || "Not provided"}.`,
      details.phone ? `Phone: ${details.phone}.` : "",
      `Date: ${details.date || "Not provided"}.`,
      `Time: ${details.time || "Not provided"}.`,
      `Guests: ${details.guests || "Not provided"}.`,
      details.message ? `Special request: ${details.message}.` : "",
      "If there is availability, please create the reservation and tell me the table details.",
    ]
      .filter(Boolean)
      .join(" ");

    formStatus.textContent = "Opening the booking assistant with your request.";
    openAssistant();
    sendChatMessage(prompt);
  });
}
