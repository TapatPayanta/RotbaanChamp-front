import { getCarsData, renderCars, carsReady } from "./cars.js";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("search-input");

// --- filters state
const filters = {
    q: "",
    make: null,
    model: null,
    transmission: null,
    year: null,
    priceBand: null,
};

// --- utils
function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

// --- dropdown wiring (unchanged)
function toggleMenu(menu) {
    document.querySelectorAll(".dropdown").forEach((m) => {
        if (m !== menu) m.classList.add("hidden");
    });
    menu.classList.toggle("hidden");
}
function closeAllMenus() {
    document.querySelectorAll(".dropdown").forEach((m) => m.classList.add("hidden"));
}

document.querySelectorAll(".dropdown-btn").forEach((btn) => {
    const menuId = btn.getAttribute("data-dropdown");
    const menu = document.getElementById(menuId);
    if (!menu) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMenu(menu);
    });

    menu.querySelectorAll("button").forEach((opt) => {
        opt.addEventListener("click", () => {
            const value = opt.dataset.value || opt.textContent.trim();
            const display = opt.textContent.trim();

            const caret = btn.querySelector("svg");
            btn.innerHTML = `${display} `;
            if (caret) btn.appendChild(caret);

            menu.classList.add("hidden");

            switch (menuId) {
                case "dropdown1":
                    filters.make = value === "all" ? null : value;
                    break;
                case "dropdown2":
                    filters.model = value === "all" ? null : value;
                    break;
                case "dropdown3":
                    filters.transmission = value === "all" ? null : value;
                    break;
                case "dropdown4":
                    filters.year = value === "all" ? null : value; // keep as string like "2020-2015" or "1997"
                    break;
                case "dropdown5":
                    filters.priceBand = value === "all" ? null : value;
                    break;
            }

            applyFilters();
        });
    });
});

document.addEventListener("click", closeAllMenus);

// --- live search
const onType = debounce(() => {
    filters.q = (searchInput?.value || "").trim();
    applyFilters();
}, 200);
searchInput?.addEventListener("input", onType);

// --- helpers
function priceInBand(price, band) {
    if (!band) return true;
    if (band === "300k-200k") return price >= 200000 && price <= 300000;
    if (band === "200k-100k") return price >= 100000 && price <= 200000;
    if (band === "100k-50k") return price >= 50000 && price <= 100000;
    return true;
}

function yearInRange(year, filter) {
    if (!filter) return true;
    const carYear = Number(year);
    if (isNaN(carYear)) return false;

    // support ranges "2020-2015" or single year "1997"
    if (filter.includes("-")) {
        const [a, b] = filter.split("-").map((x) => Number(x.trim())).filter(v => !isNaN(v));
        if (a == null || b == null) return false;
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        return carYear >= min && carYear <= max;
    }

    const f = Number(filter);
    if (!isNaN(f)) return carYear === f;
    return true;
}

// core search match function (simpler and predictable)
// - if query is digits only -> treat as year search (match year exactly)
// - otherwise do case-insensitive substring match on make, model, combined name, and year
function matchesQuery(car, query) {
    if (!query) return true;

    const q = query.trim().toLowerCase();
    const isDigits = /^[0-9]+$/.test(q);

    const make = String(car.make || "").toLowerCase();
    const model = String(car.model || "").toLowerCase();
    const combined = `${make} ${model}`.trim();
    const yearStr = String(car.year || "").toLowerCase();
    const priceStr = String(car.price || "").toLowerCase();

    if (isDigits) {
        // numeric query -> match year exactly OR appear inside price (if user types e.g., "350000" or "350k")
        const n = Number(q);
        if (!isNaN(n) && Number(car.year) === n) return true;
        if (priceStr.includes(q)) return true;
        // also allow matching last two digits (e.g., user types '20' to find '2020')
        if (q.length <= 2 && yearStr.endsWith(q)) return true;
        return false;
    }

    // text query -> partial case-insensitive match on combined name, make, model, year (so typing "vigo" or "2020" works)
    if (combined.includes(q)) return true;
    if (make.includes(q)) return true;
    if (model.includes(q)) return true;
    if (yearStr.includes(q)) return true;
    if (priceStr.includes(q)) return true;

    // fuzzy-ish fallback: allow small typo by checking each token of car name for substring match
    const tokens = combined.split(/\s+/);
    for (const t of tokens) {
        if (t && t.includes(q)) return true;
    }

    return false;
}

// --- main filter
function applyFilters() {
    const cars = getCarsData();
    if (!cars || !cars.length) {
        renderCars([]);
        showNoResultsMessage();
        return;
    }

    const out = cars.filter((car) => {
        const byQ = matchesQuery(car, filters.q);
        const byMake = !filters.make || String(car.make) === String(filters.make);
        const byModel = !filters.model || String(car.model) === String(filters.model);
        const byTrans = !filters.transmission || String(car.transmission) === String(filters.transmission);
        const byYear = !filters.year || yearInRange(car.year, filters.year);
        const byPrice = priceInBand(Number(car.price), filters.priceBand);

        return byQ && byMake && byModel && byTrans && byYear && byPrice;
    });

    if (out.length === 0) {
        renderCars([]); // clear existing grid
        showNoResultsMessage();
    } else {
        hideNoResultsMessage();
        renderCars(out);
    }
}

function showNoResultsMessage() {
    let container = document.getElementById("no-results-msg");
    if (!container) {
        container = document.createElement("div");
        container.id = "no-results-msg";
        container.className =
            "text-center py-16 bg-[color:var(--light-cream)] text-[color:var(--dark-charcoal)] mt-6";
        container.innerHTML = `
        <p class="text-4xl font-semibold mb-2">ไม่พบรถที่ตรงกับการค้นหา</p>
        <p class="text-2xl text-gray-600">ลองเปลี่ยนคำค้นหาหรือปรับตัวกรองใหม่อีกครั้ง</p>
      `;
        const main = document.querySelector("main") || document.body;
        main.appendChild(container);
    }
    container.style.display = "block";
}

function hideNoResultsMessage() {
    const container = document.getElementById("no-results-msg");
    if (container) container.style.display = "none";
}

// draw when data ready
carsReady.then(applyFilters);