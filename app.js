// 都道府県警察本部 所要時間一覧アプリ
// Google Maps JavaScript API (Places + Distance Matrix) を使用する。
// API キーはユーザーがブラウザ上で入力し、localStorage にのみ保存する。

const STORAGE_KEY = "police-hq-transit.google-maps-api-key";
const DESTINATION_CHUNK_SIZE = 24; // Distance Matrix の destinations 上限(25)未満に収める

const apiKeyPanel = document.getElementById("api-key-panel");
const apiKeyInput = document.getElementById("api-key-input");
const apiKeyStatus = document.getElementById("api-key-status");
const saveApiKeyButton = document.getElementById("save-api-key");
const clearApiKeyButton = document.getElementById("clear-api-key");

const searchPanel = document.getElementById("search-panel");
const originInput = document.getElementById("origin-input");
const departureInput = document.getElementById("departure-input");
const searchButton = document.getElementById("search-button");
const searchStatus = document.getElementById("search-status");

const resultPanel = document.getElementById("result-panel");
const resultBody = document.getElementById("result-body");
const resultTable = document.getElementById("result-table");

let autocomplete = null;
let selectedPlace = null;
let latestRows = [];
let sortState = { key: "durationValue", asc: true };

function initDefaultDepartureTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  departureInput.value = now.toISOString().slice(0, 16);
}

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    window.__onGoogleMapsLoaded = () => resolve();
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(apiKey) +
      "&libraries=places&callback=__onGoogleMapsLoaded";
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps API の読み込みに失敗しました。キーを確認してください。"));
    document.head.appendChild(script);
  });
}

async function activateWithApiKey(apiKey) {
  apiKeyStatus.textContent = "Google Maps API を読み込んでいます...";
  try {
    await loadGoogleMapsScript(apiKey);
  } catch (err) {
    apiKeyStatus.textContent = err.message;
    return;
  }
  apiKeyStatus.textContent = "読み込み完了。";
  searchPanel.hidden = false;
  setupAutocomplete();
  initDefaultDepartureTime();
}

function setupAutocomplete() {
  autocomplete = new google.maps.places.Autocomplete(originInput, {
    fields: ["formatted_address", "geometry", "name"],
  });
  autocomplete.addListener("place_changed", () => {
    selectedPlace = autocomplete.getPlace();
  });
  originInput.addEventListener("input", () => {
    selectedPlace = null;
  });
}

saveApiKeyButton.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyStatus.textContent = "API キーを入力してください。";
    return;
  }
  localStorage.setItem(STORAGE_KEY, key);
  activateWithApiKey(key);
});

clearApiKeyButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  apiKeyInput.value = "";
  apiKeyStatus.textContent = "API キーを削除しました。ページを再読み込みします。";
  setTimeout(() => location.reload(), 500);
});

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function getOriginForRequest() {
  if (selectedPlace && selectedPlace.geometry) {
    return selectedPlace.geometry.location;
  }
  const text = originInput.value.trim();
  return text || null;
}

function getOriginQueryForLink() {
  if (selectedPlace && selectedPlace.geometry) {
    const loc = selectedPlace.geometry.location;
    return `${loc.lat()},${loc.lng()}`;
  }
  return originInput.value.trim();
}

function runDistanceMatrixBatch(service, origin, destinations, departureTime) {
  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: destinations,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: { departureTime: departureTime },
      },
      (response, status) => {
        if (status !== "OK") {
          reject(new Error(`Distance Matrix リクエストに失敗しました (status: ${status})`));
          return;
        }
        resolve(response.rows[0].elements);
      }
    );
  });
}

async function searchAllDurations() {
  const origin = getOriginForRequest();
  if (!origin) {
    searchStatus.textContent = "出発地点を入力してください。";
    return;
  }
  const departureDate = departureInput.value ? new Date(departureInput.value) : new Date();

  searchButton.disabled = true;
  searchStatus.textContent = `${PREFECTURE_POLICE_HQ.length}件の警察本部への経路を検索中...`;
  resultPanel.hidden = true;

  const chunks = chunkArray(PREFECTURE_POLICE_HQ, DESTINATION_CHUNK_SIZE);
  const service = new google.maps.DistanceMatrixService();
  const rows = [];

  try {
    for (const chunk of chunks) {
      const destinations = chunk.map(toSearchQuery);
      const elements = await runDistanceMatrixBatch(service, origin, destinations, departureDate);
      chunk.forEach((entry, i) => {
        const el = elements[i];
        const ok = el.status === "OK";
        rows.push({
          prefecture: entry.prefecture,
          name: entry.name,
          status: el.status,
          durationText: ok ? el.duration.text : "経路なし",
          durationValue: ok ? el.duration.value : Number.POSITIVE_INFINITY,
          distanceText: ok ? el.distance.text : "-",
          distanceValue: ok ? el.distance.value : Number.POSITIVE_INFINITY,
          destinationQuery: toSearchQuery(entry),
        });
      });
    }
  } catch (err) {
    searchStatus.textContent = err.message;
    searchButton.disabled = false;
    return;
  }

  latestRows = rows;
  searchStatus.textContent = `検索完了（${rows.filter((r) => r.status === "OK").length}/${rows.length}件で経路が見つかりました）`;
  searchButton.disabled = false;
  renderTable();
}

function renderTable() {
  const sorted = [...latestRows].sort((a, b) => {
    const dir = sortState.asc ? 1 : -1;
    const va = a[sortState.key];
    const vb = b[sortState.key];
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  resultBody.innerHTML = "";
  const originQuery = getOriginQueryForLink();

  sorted.forEach((row) => {
    const tr = document.createElement("tr");

    const tdPref = document.createElement("td");
    tdPref.textContent = row.prefecture;
    tr.appendChild(tdPref);

    const tdName = document.createElement("td");
    tdName.textContent = row.name;
    tr.appendChild(tdName);

    const tdDuration = document.createElement("td");
    tdDuration.textContent = row.durationText;
    if (row.status !== "OK") tdDuration.classList.add("unreachable");
    tr.appendChild(tdDuration);

    const tdDistance = document.createElement("td");
    tdDistance.textContent = row.distanceText;
    if (row.status !== "OK") tdDistance.classList.add("unreachable");
    tr.appendChild(tdDistance);

    const tdLink = document.createElement("td");
    if (row.status === "OK" && originQuery) {
      const a = document.createElement("a");
      const url = new URL("https://www.google.com/maps/dir/");
      url.searchParams.set("api", "1");
      url.searchParams.set("origin", originQuery);
      url.searchParams.set("destination", row.destinationQuery);
      url.searchParams.set("travelmode", "transit");
      a.href = url.toString();
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "経路を見る";
      tdLink.appendChild(a);
    } else {
      tdLink.textContent = "-";
    }
    tr.appendChild(tdLink);

    resultBody.appendChild(tr);
  });

  resultPanel.hidden = false;
}

resultTable.querySelectorAll("th.sortable").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortState.key === key) {
      sortState.asc = !sortState.asc;
    } else {
      sortState = { key, asc: true };
    }
    renderTable();
  });
});

searchButton.addEventListener("click", searchAllDurations);

// 起動時: 保存済みキーがあれば自動読み込み
const savedKey = localStorage.getItem(STORAGE_KEY);
if (savedKey) {
  apiKeyInput.value = savedKey;
  activateWithApiKey(savedKey);
}
