document.addEventListener("DOMContentLoaded", () => {
  /* ========== Header & mobile menu ========== */
  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 60);
  window.addEventListener("scroll", onScroll);
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", open);
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("no-scroll", open);
  };

  navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

  /* ========== Image fallback ========== */
  // If a remote photo fails to load, swap in a placeholder so the layout never breaks.
  document.querySelectorAll(".gallery__item img").forEach((img, i) => {
    img.addEventListener("error", function handler() {
      img.removeEventListener("error", handler);
      img.src = `https://picsum.photos/seed/photo${i + 1}/1200/1500`;
    });
  });

  /* ========== Portfolio filter ========== */
  const filterButtons = document.querySelectorAll(".filter");
  const items = Array.from(document.querySelectorAll(".gallery__item"));

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));

      items.forEach((item) => {
        const show = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("is-hidden", !show);
        item.classList.remove("is-appearing");
        if (show) {
          void item.offsetWidth; // restart animation
          item.classList.add("is-appearing");
        }
      });
    });
  });

  /* ========== Lightbox ========== */
  const lightbox = document.getElementById("lightbox");
  const lbImage = document.getElementById("lbImage");
  const lbCaption = document.getElementById("lbCaption");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");

  let visibleItems = [];
  let currentIndex = 0;
  let lastFocused = null;

  const showImage = (index) => {
    // Loop around at both ends
    currentIndex = (index + visibleItems.length) % visibleItems.length;
    const img = visibleItems[currentIndex].querySelector("img");
    const caption = visibleItems[currentIndex].querySelector("figcaption");

    lbImage.classList.add("is-loading");
    lbImage.onload = () => lbImage.classList.remove("is-loading");
    lbImage.src = img.currentSrc || img.src;
    lbImage.alt = img.alt;
    lbCaption.textContent = `${caption ? caption.textContent : ""}  ·  ${currentIndex + 1} / ${visibleItems.length}`;
  };

  const openLightbox = (item) => {
    // Navigate only through photos of the currently selected category
    visibleItems = items.filter((el) => !el.classList.contains("is-hidden"));
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("no-scroll");
    showImage(visibleItems.indexOf(item));
    lbClose.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocused) lastFocused.focus();
  };

  items.forEach((item) => {
    item.tabIndex = 0;
    item.addEventListener("click", () => openLightbox(item));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(item);
      }
    });
  });

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => showImage(currentIndex - 1));
  lbNext.addEventListener("click", () => showImage(currentIndex + 1));

  // Close when clicking the dark backdrop
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showImage(currentIndex - 1);
    if (e.key === "ArrowRight") showImage(currentIndex + 1);
  });

  // Swipe support on touch devices
  let touchStartX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) showImage(currentIndex + (diff < 0 ? 1 : -1));
  });

  /* ========== Package selection ========== */
  const packageNote = document.getElementById("packageNote");
  let selectedPackage = "";

  document.querySelectorAll("[data-package]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPackage = btn.dataset.package;
      packageNote.textContent = `Selected package: ${selectedPackage}`;
      packageNote.hidden = false;
    });
  });

  /* ========== Booking form validation ========== */
  const form = document.getElementById("bookingForm");
  const success = document.getElementById("successMessage");
  const newRequest = document.getElementById("newRequest");
  const dateInput = form.elements.date;

  // Shoot date can't be in the past
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const todayStr = today.toISOString().split("T")[0];
  dateInput.min = todayStr;

  const validators = {
    name(value) {
      if (!value) return "Please enter your name";
      if (value.length < 2) return "Name must be at least 2 characters";
      if (!/^[\p{L}\s'-]+$/u.test(value)) return "Name can contain only letters";
      return "";
    },
    phone(value) {
      if (!value) return "Please enter your phone number";
      const digits = value.replace(/\D/g, "");
      if (!/^\+?[\d\s()-]+$/.test(value) || digits.length < 10 || digits.length > 15) {
        return "Enter a valid phone number (10–15 digits)";
      }
      return "";
    },
    date(value) {
      if (!value) return "Please choose a shoot date";
      if (value < todayStr) return "The date can't be in the past";
      return "";
    },
    type(value) {
      return value ? "" : "Please choose a shoot type";
    },
  };

  const validateField = (input) => {
    const field = input.closest(".form__field");
    const error = validators[input.name](input.value.trim());
    field.querySelector(".form__error").textContent = error;
    field.classList.toggle("is-invalid", Boolean(error));
    field.classList.toggle("is-valid", !error);
    input.setAttribute("aria-invalid", Boolean(error));
    return !error;
  };

  Object.keys(validators).forEach((name) => {
    const input = form.elements[name];
    // Validate on leaving a field, then re-check live once it has been touched
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.closest(".form__field").classList.contains("is-invalid")) validateField(input);
    });
    input.addEventListener("change", () => validateField(input));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const inputs = Object.keys(validators).map((name) => form.elements[name]);
    const results = inputs.map(validateField);
    const firstInvalid = inputs[results.indexOf(false)];

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Here the data would be sent to a server
    form.hidden = true;
    success.hidden = false;
  });

  newRequest.addEventListener("click", () => {
    form.reset();
    form.querySelectorAll(".form__field").forEach((f) => f.classList.remove("is-valid", "is-invalid"));
    selectedPackage = "";
    packageNote.hidden = true;
    success.hidden = true;
    form.hidden = false;
  });

  /* ========== Footer year ========== */
  document.getElementById("year").textContent = new Date().getFullYear();
});
