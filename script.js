const logo = document.querySelector("[data-logo-breeze]");
const form = document.querySelector("[data-reservation-form]");
const formStatus = document.querySelector("[data-form-status]");

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

if (form && formStatus) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent = "Thank you. Your request has been received.";
    form.reset();
  });
}
