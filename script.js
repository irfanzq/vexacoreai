document.getElementById("year")?.append(String(new Date().getFullYear()));

const header = document.querySelector(".site-header");
const onScrollHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};
onScrollHeader();
window.addEventListener("scroll", onScrollHeader, { passive: true });

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

const WEB3FORMS_ACCESS_KEY = "ae5f3bdc-51a8-41d6-9f77-c8af7f30fe2d";

const CONTACT_EMAIL = "mailz4irfi@gmail.com";
const SEND_TIMEOUT_MS = 8000;

const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = form?.querySelector('button[type="submit"]');

function setStatus(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `form-status${type ? ` form-status--${type}` : ""}`;
}

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
    form.reset();
    setStatus("Thanks — your message was sent. We’ll get back to you soon.", "success");
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
