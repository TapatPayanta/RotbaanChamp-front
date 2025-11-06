// frontend/scripts/cars.js
import { fmtPrice, fmtKm } from "./format.js";
import { mountPartials } from "./ui.js";

let _cars = [];
let _container = null;

// Promise that resolves after the initial list has been loaded
let _resolveReady;
export const carsReady = new Promise(r => (_resolveReady = r));

export function getCarsData() {
  return _cars;
}

export function renderCars(list) {
  if (!_container) _container = document.getElementById("cars");
  if (!_container) return;

  _container.innerHTML = "";
  list.forEach(car => {
    const imgUrl = (car.images && car.images[0]) || "/assets/placeholder.jpg";
    const href = `./car_detail.html?id=${car._id}`;
    const card = document.createElement("a");
    card.href = href;
    card.className =
      "block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition";
    card.innerHTML = `
      <img src="${imgUrl}" alt="${car.make} ${car.model}"
           class="w-full h-48 object-cover"
           onerror="this.src='/assets/placeholder.jpg'">
      <div class="p-4">
        <h2 class="text-lg font-semibold">${car.make} ${car.model} ${car.year}</h2>
        <p class="text-gray-800 font-bold">${fmtPrice(car.price)}</p>
        <p class="text-gray-500 text-sm">เลขไมล์: ${fmtKm(car.mileage)}</p>
      </div>
    `;
    _container.appendChild(card);
  });
}

const API_BASE = "https://rotbaanchamp-api.onrender.com";

async function loadCars() {
  const res = await fetch(`${API_BASE}/cars`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to load cars: ${res.status}`);
  _cars = await res.json();
  renderCars(_cars);
  _resolveReady?.();
}

(async () => {
  await mountPartials();
  await loadCars();
})();