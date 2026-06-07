const logo = document.querySelector("[data-logo-breeze]");
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
    const canopyLayers = [...logo.querySelectorAll(".tree-canopy")];
    const state = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      frame: 0,
      lastPointerMove: 0,
    };

    const moveCanopy = (time) => {
      const idleFor = time - state.lastPointerMove;

      if (idleFor > 550) {
        state.targetX = 0;
        state.targetY = 0;
      }

      state.currentX += (state.targetX - state.currentX) * 0.055;
      state.currentY += (state.targetY - state.currentY) * 0.055;
      const breezeStrength = Math.max(0, 1 - idleFor / 1800);

      canopyLayers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 1);
        const phase = Number(layer.dataset.phase || 0);
        const breeze = Math.sin(time * 0.00075 + phase * Math.PI * 2) * breezeStrength;
        const lift = Math.cos(time * 0.00058 + phase * Math.PI) * 0.45 * breezeStrength;
        const tx = state.currentX * 4.4 * depth + breeze * 0.8 * depth;
        const ty = state.currentY * 1.7 * depth + lift - Math.abs(state.currentX) * 0.18;
        const rotate = state.currentX * 0.55 * depth + breeze * 0.18;

        layer.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rotate}deg)`;
      });

      if (
        idleFor > 1900 &&
        Math.abs(state.currentX) < 0.003 &&
        Math.abs(state.currentY) < 0.003
      ) {
        state.frame = 0;
        logo.classList.remove("is-active");
        canopyLayers.forEach((layer) => {
          layer.style.transform = "translate3d(0, 0, 0) rotate(0deg)";
        });
        return;
      }

      state.frame = requestAnimationFrame(moveCanopy);
    };

    const start = () => {
      logo.classList.add("is-active");
      if (!state.frame) {
        state.frame = requestAnimationFrame(moveCanopy);
      }
    };

    const updateTarget = (event) => {
      state.targetX = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth - 0.5) * 2));
      state.targetY = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight - 0.5) * 2));
      state.lastPointerMove = performance.now();
      start();
    };

    const rest = () => {
      state.targetX = 0;
      state.targetY = 0;
      state.lastPointerMove = performance.now() - 700;
      logo.classList.remove("is-active");
    };

    window.addEventListener("pointermove", updateTarget, { passive: true });
    window.addEventListener("blur", rest);
    document.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) {
        rest();
      }
    });
  }
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
