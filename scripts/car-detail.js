import { mountPartials } from "./ui.js";
import { fmtPrice, fmtKm } from "./format.js";

function getId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

const API_BASE = "https://rotbaanchamp-api.onrender.com";

async function loadCar(id) {
  const res = await fetch(`${API_BASE}/cars/${id}`);
  if (!res.ok) throw new Error("Car not found");
  return res.json();
}

function splitDescription(desc) {
  if (!desc) return [];
  const parts = desc
    .split(/\r?\n|•|;| - /g)
    .map(s => s.replace(/^[\-–•\s]+/, "").trim())
    .filter(Boolean);
  return parts.length ? parts : [desc.trim()];
}

const $ = (sel) => document.querySelector(sel);
const byId = (id) => document.getElementById(id);

function renderSpecs(car) {
  const titleEl = byId("car-title");
  if (titleEl) titleEl.textContent = `${car.make} ${car.model} ${car.year}`;

  const priceEl = byId("car-price");
  if (priceEl) priceEl.textContent = fmtPrice(car.price, "THB");

  const put = (id, val) => { const el = byId(id); if (el) el.textContent = val; };
  put("spec-make", car.make);
  put("spec-model", car.model);
  put("spec-year", car.year);
  put("spec-price", fmtPrice(car.price, "THB"));
  put("spec-mileage", fmtKm(car.mileage));
  put("spec-trans", car.transmission || "-");
}

function renderGallery(images = []) {
  const placeholder = "/assets/placeholder.jpg";
  const list = (Array.isArray(images) && images.length) ? images : [placeholder];

  // Build sources: hero[0] + 5 thumbs [1..5]; pad to 6 total
  const sources = [list[0] || placeholder, ...list.slice(1, 6)];
  while (sources.length < 6) sources.push(placeholder);

  // 1) Build Swiper slides for hero
  const wrap = document.querySelector("#hero-swiper .swiper-wrapper");
  if (!wrap) return;
  wrap.innerHTML = "";

  // tune per-image: background, scale, and inner padding (no layout shift)
  function tuneFit(boxEl, imgEl) {
    if (!boxEl || !imgEl || !imgEl.naturalWidth) return;

    // On small screens, don't zoom at all (prevents “collapse”/cropping)
    const isSmall = window.matchMedia("(max-width: 640px)").matches;
    if (isSmall) {
      imgEl.style.transform = "scale(1)";
      return;
    }

    // Desktop/tablet: gentle zoom only when aspect ratios differ a lot
    const cw = boxEl.clientWidth, ch = boxEl.clientHeight;
    if (!cw || !ch) return;

    const containerRatio = cw / ch;
    const imageRatio = imgEl.naturalWidth / imgEl.naturalHeight;
    const diff = Math.abs(imageRatio - containerRatio);

    let scale = 1;
    if (diff >= 0.40) scale = 1.12;
    else if (diff >= 0.22) scale = 1.08;
    else if (diff >= 0.10) scale = 1.04;

    imgEl.style.transform = `scale(${scale})`;
  }

  sources.forEach((src) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.innerHTML = `
    <div class="slide-box w-full h-full flex items-center justify-center bg-[color:var(--dark-charcoal)]">
      <img src="${src}" loading="lazy"
           class="w-full h-full object-contain select-none transition-transform duration-300 ease-out"
           onerror="this.src='${placeholder}'" />
    </div>
  `;
    wrap.appendChild(slide);

    const box = slide.querySelector(".slide-box");
    const img = slide.querySelector("img");
    if (img.complete && img.naturalWidth) tuneFit(box, img);
    else img.addEventListener("load", () => tuneFit(box, img));
  });

  // 2) Init/update Swiper with loop + correct index handling
  if (window.heroSwiper) {
    window.heroSwiper.update();
    window.heroSwiper.slideToLoop(0, 0);
  } else {
    window.heroSwiper = new Swiper("#hero-swiper", {
      speed: 300,
      loop: true,
      navigation: {
        nextEl: "#hero-swiper .swiper-button-next",
        prevEl: "#hero-swiper .swiper-button-prev",
      },
      allowTouchMove: true,
      simulateTouch: true,
      grabCursor: true,
    });

    // Highlight on slide change (use realIndex in loop mode)
    window.heroSwiper.on("slideChange", () => {
      const idx = window.heroSwiper.realIndex || 0; // 0..5
      highlightThumb(idx);
    });
  }

  // 3) Thumbnails (static 5 imgs)
  const thumbImgs = [
    document.getElementById("thumb-1"),
    document.getElementById("thumb-2"),
    document.getElementById("thumb-3"),
    document.getElementById("thumb-4"),
    document.getElementById("thumb-5"),
  ].filter(Boolean);

  // We will apply highlight styles to the **container** (parent) so it isn't clipped
  const thumbBoxes = thumbImgs.map(img => img?.parentElement || img);

  // Set src + click
  thumbImgs.forEach((imgEl, i) => {
    const src = sources[i + 1]; // thumbs represent slides 1..5
    imgEl.src = src;
    imgEl.onerror = () => { imgEl.src = placeholder; };

    (imgEl.parentElement || imgEl).addEventListener("click", (e) => {
      e.preventDefault?.();
      window.heroSwiper?.slideToLoop(i + 1, 300);
      highlightThumb(i + 1); // reflect selection
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // 4) Highlight helpers — style the parent boxes, not the <img>, with NO layout shift
  function clearHighlight() {
    thumbBoxes.forEach(box => {
      if (!box) return;
      // Reset only what we set
      box.style.outline = "none";
      box.style.outlineOffset = "";
      box.style.boxShadow = "";
    });
  }

  function highlightThumb(heroIndex) {
    // heroIndex: 0..5 ; thumbs correspond to 1..5
    clearHighlight();
    if (heroIndex >= 1 && heroIndex <= 5) {
      const box = thumbBoxes[heroIndex - 1];
      if (box) {
        // OPTION A — Outline (no layout shift)
        box.style.outline = "3px solid #6a826d";   // deep-olive
        box.style.outlineOffset = "-2px";          // pull slightly inward to follow rounded corners

        // OPTIONAL soft elevation without size change:
        box.style.boxShadow = "0 1px 2px rgba(0,0,0,0.06)";
      }
    }
  }

  // initial state (hero is slide 0 => no thumb highlighted)
  highlightThumb(0);
}

function renderDescription(car) {
  const p = byId("car-desc");
  if (p) p.textContent = `${car.make} ${car.model} ${car.year}`;

  const ul = byId("desc-list");
  if (!ul) return;
  ul.innerHTML = "";

  splitDescription(car.description).forEach(txt => {
    const li = document.createElement("li");
    li.textContent = txt;
    ul.appendChild(li);
  });
}

(async () => {
  await mountPartials();

  const id = getId();
  if (!id) {
    alert("Missing car id");
    return;
  }

  try {
    const car = await loadCar(id);
    renderSpecs(car);
    renderGallery(car.images);
    renderDescription(car);
  } catch (err) {
    console.error(err);
    alert("ไม่พบข้อมูลรถคันนี้ (Car not found).");
  }
})();