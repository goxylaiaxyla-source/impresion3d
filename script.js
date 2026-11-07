"use strict";

document.documentElement.classList.add("js-ready");

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle instanceof HTMLButtonElement && siteNav instanceof HTMLElement) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
    siteNav.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
    siteNav.classList.toggle("is-open", !isExpanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const createGalaxy = (canvas) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const colors = ["#b6ff6a", "#3ddc97", "#f2b84b", "#ff9f43", "#fff3d0"];
  const stars = Array.from({ length: 760 }, (_, index) => {
    const arm = index % 3;
    const radius = Math.pow(Math.random(), 0.72);
    const angle =
      radius * 7 +
      arm * ((Math.PI * 2) / 3) +
      (Math.random() - 0.5) * 0.7 * (1.2 - radius);

    return {
      angle,
      radius,
      size: Math.random() * 1.65 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.48 + 0.42,
    };
  });

  let animationFrame = 0;
  let rotation = 0;
  let width = 0;
  let height = 0;

  const resize = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (reducedMotion.matches || document.hidden) {
      draw();
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    const centerX = width * (width <= 620 ? 0.73 : 0.72);
    const centerY = height * (width <= 620 ? 0.39 : 0.39);
    const radius = Math.min(width, height) * (width <= 620 ? 0.72 : 0.65);
    const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.52);
    glow.addColorStop(0, "rgba(255, 229, 163, .32)");
    glow.addColorStop(0.38, "rgba(61, 220, 151, .14)");
    glow.addColorStop(1, "rgba(5, 7, 10, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    stars.forEach((star) => {
      const angle = star.angle + rotation * (1 - star.radius * 0.65);
      const x = centerX + Math.cos(angle) * star.radius * radius;
      const y = centerY + Math.sin(angle) * star.radius * radius * 0.56;
      context.globalAlpha = star.opacity;
      context.fillStyle = star.color;
      context.fillRect(x, y, star.size, star.size);
    });

    context.globalAlpha = 1;
  };

  const animate = () => {
    draw();
    rotation += 0.0015;

    if (!reducedMotion.matches && !document.hidden) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  };

  const start = () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }

    animate();
  };

  resize();
  start();

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", start);
  reducedMotion.addEventListener("change", start);
};

document.querySelectorAll("[data-galaxy]").forEach(createGalaxy);

const revealItems = document.querySelectorAll("[data-reveal]");

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  let revealCheckFrame = 0;
  const revealVisibleItems = () => {
    const viewportHeight = window.innerHeight;
    revealItems.forEach((item) => {
      const bounds = item.getBoundingClientRect();
      if (bounds.top < viewportHeight * 0.9 && bounds.bottom > 32) {
        item.classList.add("is-visible");
      }
    });
  };
  const scheduleRevealCheck = () => {
    if (!revealCheckFrame) {
      revealCheckFrame = window.requestAnimationFrame(() => {
        revealCheckFrame = 0;
        revealVisibleItems();
      });
    }
  };

  scheduleRevealCheck();
  window.addEventListener("scroll", scheduleRevealCheck, { passive: true });
  window.addEventListener("resize", scheduleRevealCheck, { passive: true });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const yearElement = document.querySelector("[data-year]");

if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

const shareStatus = document.querySelector("[data-share-status]");

const setShareStatus = (message) => {
  if (shareStatus) {
    shareStatus.textContent = message;
  }
};

const getShareUrl = () => {
  const shareUrl = new URL(window.location.href);
  shareUrl.hash = "";
  return shareUrl.href;
};

const copyPageLink = async () => {
  try {
    const shareUrl = getShareUrl();

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = shareUrl;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();

      if (!copied) {
        throw new Error("El navegador no permitió copiar el enlace.");
      }
    }

    setShareStatus("Enlace copiado. Ya puedes usarlo en un QR o en una etiqueta NFC.");
  } catch (error) {
    console.error("No se pudo copiar el enlace del perfil.", error);
    setShareStatus("No se pudo copiar. Puedes copiar el enlace desde la barra del navegador.");
  }
};

document.querySelector("[data-copy]")?.addEventListener("click", copyPageLink);

document.querySelector("[data-share]")?.addEventListener("click", async () => {
  if (!navigator.share) {
    await copyPageLink();
    return;
  }

  try {
    await navigator.share({
      title: document.title,
      text: "Mira esta página de ideas de impresión 3D.",
      url: getShareUrl(),
    });
    setShareStatus("Gracias por compartir.");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    console.error("No se pudo compartir el perfil.", error);
    setShareStatus("No se pudo abrir la opción para compartir.");
  }
});

document.querySelector("[data-facebook-share]")?.addEventListener("click", (event) => {
  const link = event.currentTarget;
  if (link instanceof HTMLAnchorElement) {
    link.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
  }
});

const cookieNotice = document.querySelector("[data-cookie-notice]");
const cookiePreferenceKey = "impresiones-3d-cookie-notice";

if (cookieNotice instanceof HTMLElement) {
  try {
    cookieNotice.hidden = sessionStorage.getItem(cookiePreferenceKey) !== null;
  } catch (error) {
    console.error("No se pudo leer el estado del aviso de cookies.", error);
    cookieNotice.hidden = false;
  }

  const dismissCookieNotice = (choice) => {
    try {
      sessionStorage.setItem(cookiePreferenceKey, choice);
    } catch (error) {
      console.error("No se pudo guardar el estado del aviso de cookies.", error);
    }

    cookieNotice.hidden = true;
  };

  document.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
    dismissCookieNotice("accepted-notice");
  });

  document.querySelector("[data-cookie-reject]")?.addEventListener("click", () => {
    dismissCookieNotice("rejected-optional-cookies");
  });

  document.querySelector("[data-open-cookies]")?.addEventListener("click", () => {
    try {
      sessionStorage.removeItem(cookiePreferenceKey);
    } catch (error) {
      console.error("No se pudo restablecer el aviso de cookies.", error);
    }

    cookieNotice.hidden = false;
    cookieNotice.querySelector("button")?.focus();
  });
}
