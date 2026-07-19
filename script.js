document.getElementById("year")?.append(String(new Date().getFullYear()));

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const backdrop = document.getElementById("nav-backdrop");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    if (backdrop) {
      backdrop.hidden = !open;
    }
    document.body.classList.toggle("nav-open", open);
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  backdrop?.addEventListener("click", () => setOpen(false));

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 860) setOpen(false);
    },
    { passive: true }
  );
}

initMobileNav();

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ---------- Scroll progress + sticky header ---------- */
const header = document.querySelector(".site-header");
const progressBar = document.getElementById("scroll-progress");

function updateScrollChrome() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

  header?.classList.toggle("is-scrolled", scrollTop > 8);
  if (progressBar) {
    progressBar.style.transform = `scaleX(${progress})`;
  }
}

updateScrollChrome();
window.addEventListener("scroll", updateScrollChrome, { passive: true });

/* ---------- Reveal on scroll ---------- */
const revealItems = document.querySelectorAll(".reveal");
if (revealItems.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

/* ---------- Split brand / headline into staggered chars ---------- */
function splitText(el) {
  if (!el || prefersReducedMotion) return;
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.textContent = "";
  el.classList.add("split-text");

  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "split-char";
    span.style.animationDelay = `${index * 28}ms`;
    span.textContent = char === " " ? "\u00A0" : char;
    el.appendChild(span);
  });
}

splitText(document.querySelector(".hero-copy .brand-mark"));
splitText(document.querySelector(".contact-intro .brand-mark"));

/* ---------- Magnetic buttons ---------- */
function initMagneticButtons() {
  if (prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.classList.add("btn-magnetic");

    btn.addEventListener("pointermove", (event) => {
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
    });

    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
}

initMagneticButtons();

/* ---------- Nav scroll spy (home page) ---------- */
function initScrollSpy() {
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  if (!links.length) return;

  const sections = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const match = sections.find((item) => item.section === entry.target);
        if (!match) return;
        match.link.classList.toggle("is-active", entry.isIntersecting);
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 }
  );

  sections.forEach(({ section }) => spy.observe(section));
}

initScrollSpy();

/* ---------- Hero: canvas network + mouse tilt + spotlight ---------- */
function initHeroEffects() {
  const visual = document.querySelector(".hero-visual");
  const canvas = document.getElementById("hero-canvas");
  const spotlight = document.getElementById("hero-spotlight");
  const orbit = document.getElementById("hero-orbit");
  if (!visual || !canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let nodes = [];
  let rafId = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let running = !prefersReducedMotion;

  function resize() {
    const rect = visual.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.floor((width * height) / 14000);
    nodes = Array.from({ length: Math.max(18, Math.min(42, count)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 1.8,
    }));
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    const pullX = (mouseX - 0.5) * 26;
    const pullY = (mouseY - 0.5) * 26;

    nodes.forEach((node) => {
      node.x += node.vx + pullX * 0.002;
      node.y += node.vy + pullY * 0.002;

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));
    });

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.35;
          ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((node) => {
      ctx.fillStyle = "rgba(191, 219, 254, 0.85)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    });

    rafId = requestAnimationFrame(draw);
  }

  function onPointerMove(event) {
    const rect = visual.getBoundingClientRect();
    mouseX = (event.clientX - rect.left) / rect.width;
    mouseY = (event.clientY - rect.top) / rect.height;

    if (spotlight) {
      spotlight.style.setProperty("--x", `${mouseX * 100}%`);
      spotlight.style.setProperty("--y", `${mouseY * 100}%`);
      spotlight.classList.add("is-active");
    }

    if (!prefersReducedMotion && orbit) {
      const tiltX = (mouseY - 0.5) * -10;
      const tiltY = (mouseX - 0.5) * 12;
      orbit.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    }
  }

  function onPointerLeave() {
    spotlight?.classList.remove("is-active");
    if (orbit) orbit.style.transform = "";
    mouseX = 0.5;
    mouseY = 0.5;
  }

  resize();
  window.addEventListener("resize", resize);
  visual.addEventListener("pointermove", onPointerMove);
  visual.addEventListener("pointerleave", onPointerLeave);

  if (running) {
    draw();
  } else {
    // Static dotted field when motion is reduced
    ctx.clearRect(0, 0, width, height);
    nodes.forEach((node) => {
      ctx.fillStyle = "rgba(191, 219, 254, 0.55)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(rafId);
    } else if (!prefersReducedMotion) {
      running = true;
      draw();
    }
  });
}

initHeroEffects();

/* ---------- Contact form polish ---------- */
function initFormPolish() {
  const formEl = document.getElementById("contact-form");
  if (!formEl) return;

  formEl.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("focus", () => {
      field.closest("label")?.classList.add("is-focused");
    });
    field.addEventListener("blur", () => {
      field.closest("label")?.classList.remove("is-focused");
    });
  });
}

initFormPolish();

/* ---------- Web3Forms ---------- */
const WEB3FORMS_ACCESS_KEY = "cc60a9c9-bcc3-4c77-a3a3-5483183ca55e";
const CONTACT_EMAIL = "mailz4irfi@gmail.com";
const SEND_TIMEOUT_MS = 8000;

const form = document.getElementById("contact-form");
const formFields = document.getElementById("form-fields");
const formSuccess = document.getElementById("form-success");
const sendAnotherBtn = document.getElementById("send-another");
const statusEl = document.getElementById("form-status");
const submitBtn = form?.querySelector('button[type="submit"]');

function setStatus(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `form-status${type ? ` form-status--${type}` : ""}`;
}

function showSuccessState() {
  form?.reset();
  form?.classList.add("is-sent");
  if (formFields) formFields.hidden = true;
  if (formSuccess) {
    formSuccess.hidden = false;
    formSuccess.focus?.();
  }
  setStatus("");
}

function showFormState() {
  form?.classList.remove("is-sent");
  if (formSuccess) formSuccess.hidden = true;
  if (formFields) formFields.hidden = false;
  setStatus("");
}

sendAnotherBtn?.addEventListener("click", () => {
  showFormState();
  form?.querySelector('input[name="name"]')?.focus();
});

function hasWeb3Key() {
  return Boolean(
    WEB3FORMS_ACCESS_KEY && WEB3FORMS_ACCESS_KEY !== "YOUR_ACCESS_KEY_HERE"
  );
}

function openMailtoDraft({ name, email, interests, message }) {
  const subject = encodeURIComponent(`VexaCore inquiry from ${name}`);
  const body = encodeURIComponent(
    [
      `Name: ${name}`,
      `Email: ${email}`,
      `Interested in: ${interests || "Not specified"}`,
      "",
      message,
    ].join("\n")
  );
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function readForm(formEl) {
  const data = new FormData(formEl);
  return {
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    message: String(data.get("message") || "").trim(),
    interests: data
      .getAll("interest")
      .map(String)
      .filter(Boolean)
      .join(", "),
    botcheck: data.get("botcheck") || "",
  };
}

async function sendWithWeb3Forms(fields) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `VexaCore inquiry from ${fields.name}`,
        from_name: "VexaCore website",
        name: fields.name,
        email: fields.email,
        interested_in: fields.interests || "Not specified",
        message: fields.message,
        botcheck: fields.botcheck,
      }),
      signal: controller.signal,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Send failed.");
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fields = readForm(form);
  if (!fields.name || !fields.email || !fields.message) {
    form.classList.add("is-shake");
    window.setTimeout(() => form.classList.remove("is-shake"), 450);
    form.reportValidity();
    return;
  }

  if (!hasWeb3Key() || !navigator.onLine) {
    setStatus("Opening your email app with a draft…");
    openMailtoDraft(fields);
    return;
  }

  const originalLabel = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
  }
  setStatus("Sending your message…");

  try {
    await sendWithWeb3Forms(fields);
    showSuccessState();
  } catch {
    setStatus("Network is slow — opening an email draft instead…");
    openMailtoDraft(fields);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel || "Send message";
    }
  }
});
