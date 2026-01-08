/* ===============================
   Global Currency Converter
   API: https://open.er-api.com
   Pure HTML + CSS + Vanilla JS
   =============================== */

const API_BASE = "https://open.er-api.com/v6/latest";

const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("fromCurrency");
const toSelect = document.getElementById("toCurrency");
const resultEl = document.getElementById("convertedAmount");
const rateInfo = document.getElementById("rateInfo");
const lastUpdate = document.getElementById("lastUpdate");
const errorMsg = document.getElementById("errorMsg");
const swapBtn = document.getElementById("swap");
const themeToggle = document.getElementById("themeToggle");

/* ---------- Cache ---------- */
const CACHE_KEY = "currency_rates_cache";
const CACHE_TIME = 60 * 60 * 1000; // 1 hour

/* ---------- Theme ---------- */
themeToggle.onclick = () => {
  document.body.dataset.theme =
    document.body.dataset.theme === "dark" ? "" : "dark";
};

/* ---------- Fetch Rates ---------- */
async function fetchRates(base) {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY));

  if (cached && cached.base === base && Date.now() - cached.time < CACHE_TIME) {
    return cached.data;
  }

  const res = await fetch(`${API_BASE}/${base}`);
  const data = await res.json();

  if (data.result !== "success") {
    throw new Error("API error");
  }

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      base,
      time: Date.now(),
      data
    })
  );

  return data;
}

/* ---------- Load Currencies ---------- */
async function loadCurrencies() {
  try {
    const res = await fetch(`${API_BASE}/USD`);
    const data = await res.json();

    const currencies = Object.keys(data.rates).sort();

    currencies.forEach(code => {
      fromSelect.add(new Option(code, code));
      toSelect.add(new Option(code, code));
    });

    fromSelect.value = "USD";
    toSelect.value = "BDT"; // 🇧🇩 DEFAULT

    convert();
  } catch {
    errorMsg.textContent = "❌ Failed to load currencies.";
  }
}

/* ---------- Convert ---------- */
async function convert() {
  errorMsg.textContent = "";

  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    resultEl.textContent = "0.00";
    return;
  }

  const from = fromSelect.value;
  const to = toSelect.value;

  try {
    const data = await fetchRates(from);
    const rate = data.rates[to];
    const converted = amount * rate;

    animateNumber(resultEl, converted);

    rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    lastUpdate.textContent = `Last update: ${new Date(
      data.time_last_update_utc
    ).toLocaleString()}`;
  } catch {
    errorMsg.textContent = "⚠ Unable to fetch exchange rates.";
  }
}

/* ---------- Swap ---------- */
swapBtn.onclick = () => {
  [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
  convert();
};

/* ---------- Number Animation ---------- */
function animateNumber(element, target) {
  const start = Number(element.textContent.replace(/,/g, "")) || 0;
  const duration = 300;
  const startTime = performance.now();

  function update(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const value = start + (target - start) * progress;
    element.textContent = value.toFixed(2);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ---------- Events ---------- */
amountInput.addEventListener("input", convert);
fromSelect.addEventListener("change", convert);
toSelect.addEventListener("change", convert);

/* ---------- Init ---------- */
loadCurrencies();
