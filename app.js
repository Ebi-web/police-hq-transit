// 都道府県警察本部 所要時間一覧アプリ
// Google Maps JavaScript API の Places (New) / Routes ライブラリを使用する。
// レガシー版の Places API / Distance Matrix API は 2025-03-01 以降の
// 新規 Google Cloud プロジェクトでは利用できないため、新 API のみを使う。
// API キーはユーザーがブラウザ上で入力し、localStorage にのみ保存する。

const STORAGE_KEY = "police-hq-transit.google-maps-api-key";
const MAX_ROUTE_MATRIX_ITEMS = 100; // Routes API computeRouteMatrix の TRANSIT 要素数上限

const apiKeyInput = document.getElementById("api-key-input");
const apiKeyStatus = document.getElementById("api-key-status");
const saveApiKeyButton = document.getElementById("save-api-key");
const clearApiKeyButton = document.getElementById("clear-api-key");

const searchPanel = document.getElementById("search-panel");
const originContainer = document.getElementById("origin-container");
const departureInput = document.getElementById("departure-input");
const searchButton = document.getElementById("search-button");
const searchStatus = document.getElementById("search-status");

const resultPanel = document.getElementById("result-panel");
const resultBody = document.getElementById("result-body");
const resultTable = document.getElementById("result-table");

let placeAutocompleteEl = null;
let selectedPlace = null; // { location, formattedAddress }
let latestRows = [];
let sortState = { key: "durationValue", asc: true };

function initDefaultDepartureTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  departureInput.value = now.toISOString().slice(0, 16);
}

// 47件は destinations の要素数上限(100)以内に収まるため1リクエストで送る。
// (レガシー Distance Matrix API では destinations 上限25件だったため分割が必要だったが
//  Routes API の computeRouteMatrix では不要)
function formatDuration(durationMillis) {
  const totalMinutes = Math.round(durationMillis / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}分`;
  return `${hours}時間${minutes}分`;
}

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.importLibrary) {
      resolve();
      return;
    }
    window.gm_authFailure = () => {
      reject(
        new Error(
          "Google Maps の認証に失敗しました。API キーが無効、課金が未設定、" +
            "リファラ制限、または必要な API（Maps JavaScript API / Places API (New) / Routes API）が" +
            "未有効化の可能性があります。ブラウザのコンソールに詳細なエラーが出ています。"
        )
      );
    };
    window.__onGoogleMapsLoaded = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      callback: "__onGoogleMapsLoaded",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () =>
      reject(new Error("Google Maps API の読み込みに失敗しました。ネットワークまたはキーを確認してください。"));
    document.head.appendChild(script);
  });
}

async function activateWithApiKey(apiKey) {
  apiKeyStatus.textContent = "Google Maps API を読み込んでいます...";
  try {
    await loadGoogleMapsScript(apiKey);
    await google.maps.importLibrary("places");
    await google.maps.importLibrary("routes");
  } catch (err) {
    apiKeyStatus.textContent = err.message;
    return;
  }
  apiKeyStatus.textContent = "読み込み完了。";
  searchPanel.hidden = false;
  setupPlaceAutocomplete();
  initDefaultDepartureTime();
}

function setupPlaceAutocomplete() {
  placeAutocompleteEl = new google.maps.places.PlaceAutocompleteElement({
    locationBias: { radius: 500000, center: { lat: 36.2048, lng: 138.2529 } }, // 日本全体をおおまかにバイアス
  });
  originContainer.innerHTML = "";
  originContainer.appendChild(placeAutocompleteEl);

  placeAutocompleteEl.addEventListener("gmp-select", async ({ placePrediction }) => {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ["location", "formattedAddress"] });
    selectedPlace = {
      location: place.location,
      formattedAddress: place.formattedAddress,
    };
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

function getOriginForRequest() {
  if (selectedPlace && selectedPlace.location) {
    return selectedPlace.location;
  }
  return null;
}

function getOriginQueryForLink() {
  if (selectedPlace && selectedPlace.location) {
    return `${selectedPlace.location.lat()},${selectedPlace.location.lng()}`;
  }
  return selectedPlace && selectedPlace.formattedAddress ? selectedPlace.formattedAddress : "";
}

async function searchAllDurations() {
  const origin = getOriginForRequest();
  if (!origin) {
    searchStatus.textContent = "出発地点の候補一覧から地点を選択してください。";
    return;
  }
  if (PREFECTURE_POLICE_HQ.length > MAX_ROUTE_MATRIX_ITEMS) {
    searchStatus.textContent = "警察本部の件数が上限を超えています。実装を見直してください。";
    return;
  }
  const departureDate = departureInput.value ? new Date(departureInput.value) : new Date();

  searchButton.disabled = true;
  searchStatus.textContent = `${PREFECTURE_POLICE_HQ.length}件の警察本部への経路を検索中...`;
  resultPanel.hidden = true;

  try {
    const { RouteMatrix } = await google.maps.importLibrary("routes");
    const response = await RouteMatrix.computeRouteMatrix({
      origins: [{ waypoint: origin }],
      destinations: PREFECTURE_POLICE_HQ.map((entry) => ({ waypoint: toSearchQuery(entry) })),
      travelMode: "TRANSIT",
      departureTime: departureDate,
      fields: ["distanceMeters", "durationMillis", "condition"],
    });

    const matrix = response.matrix || response;
    const row = matrix.rows[0];
    const items = row.items || row.elements;

    latestRows = PREFECTURE_POLICE_HQ.map((entry, i) => {
      const item = items[i];
      const ok = item && item.condition === "ROUTE_EXISTS";
      return {
        prefecture: entry.prefecture,
        name: entry.name,
        status: ok ? "OK" : "NOT_FOUND",
        durationText: ok ? formatDuration(item.durationMillis) : "経路なし",
        durationValue: ok ? item.durationMillis : Number.POSITIVE_INFINITY,
        distanceText: ok ? `${(item.distanceMeters / 1000).toFixed(1)} km` : "-",
        distanceValue: ok ? item.distanceMeters : Number.POSITIVE_INFINITY,
        destinationQuery: toSearchQuery(entry),
      };
    });
  } catch (err) {
    console.error(err);
    searchStatus.textContent = `検索に失敗しました: ${err.message || err}`;
    searchButton.disabled = false;
    return;
  }

  searchStatus.textContent = `検索完了（${latestRows.filter((r) => r.status === "OK").length}/${latestRows.length}件で経路が見つかりました）`;
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
