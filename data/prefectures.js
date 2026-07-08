// 47都道府県警察本部の一覧データ。
// 座標は OpenStreetMap Nominatim のジオコーディング結果を基にしている
// (長野県・宮崎県は OSM に単独POIがなく、公式住所に基づく近傍座標で近似)。
// Google Distance Matrix / Routes API へは座標を渡し、Google Maps 経路リンクの
// destination には都道府県名+正式名称の文字列を渡す。
const PREFECTURE_POLICE_HQ = [
  { prefecture: "北海道", name: "北海道警察本部", lat: 43.0631372, lng: 141.3461534 },
  { prefecture: "青森県", name: "青森県警察本部", lat: 40.8254461, lng: 140.740356 },
  { prefecture: "岩手県", name: "岩手県警察本部", lat: 39.7028166, lng: 141.1506701 },
  { prefecture: "宮城県", name: "宮城県警察本部", lat: 38.2688152, lng: 140.8729764 },
  { prefecture: "秋田県", name: "秋田県警察本部", lat: 39.7174747, lng: 140.1031744 },
  { prefecture: "山形県", name: "山形県警察本部", lat: 38.2404441, lng: 140.3651031 },
  { prefecture: "福島県", name: "福島県警察本部", lat: 37.7514654, lng: 140.4710522 },
  { prefecture: "茨城県", name: "茨城県警察本部", lat: 36.3408874, lng: 140.4454599 },
  { prefecture: "栃木県", name: "栃木県警察本部", lat: 36.5666649, lng: 139.8830286 },
  { prefecture: "群馬県", name: "群馬県警察本部", lat: 36.3919231, lng: 139.0612545 },
  { prefecture: "埼玉県", name: "埼玉県警察本部", lat: 35.8586071, lng: 139.6488818 },
  { prefecture: "千葉県", name: "千葉県警察本部", lat: 35.6029606, lng: 140.1232854 },
  { prefecture: "東京都", name: "警視庁本部庁舎", lat: 35.6767506, lng: 139.7521194 },
  { prefecture: "神奈川県", name: "神奈川県警察本部", lat: 35.4499244, lng: 139.6410419 },
  { prefecture: "新潟県", name: "新潟県警察本部", lat: 37.901704, lng: 139.0228266 },
  { prefecture: "富山県", name: "富山県警察本部", lat: 36.69483, lng: 137.2104479 },
  { prefecture: "石川県", name: "石川県警察本部", lat: 36.5938696, lng: 136.6264145 },
  { prefecture: "福井県", name: "福井県警察本部", lat: 36.0649239, lng: 136.2211157 },
  { prefecture: "山梨県", name: "山梨県警察本部", lat: 35.6636318, lng: 138.5685125 },
  { prefecture: "長野県", name: "長野県警察本部", lat: 36.6513887, lng: 138.1809208 },
  { prefecture: "岐阜県", name: "岐阜県警察本部", lat: 35.391143, lng: 136.7207347 },
  { prefecture: "静岡県", name: "静岡県警察本部", lat: 34.9768723, lng: 138.3837294 },
  { prefecture: "愛知県", name: "愛知県警察本部", lat: 35.1807719, lng: 136.9015029 },
  { prefecture: "三重県", name: "三重県警察本部", lat: 34.7264611, lng: 136.5084691 },
  { prefecture: "滋賀県", name: "滋賀県警察本部", lat: 35.0074614, lng: 135.8730565 },
  { prefecture: "京都府", name: "京都府警察本部", lat: 35.0222202, lng: 135.7559236 },
  { prefecture: "大阪府", name: "大阪府警察本部", lat: 34.683921, lng: 135.5207869 },
  { prefecture: "兵庫県", name: "兵庫県警察本部", lat: 34.6900256, lng: 135.1838606 },
  { prefecture: "奈良県", name: "奈良県警察本部", lat: 34.6859123, lng: 135.8336952 },
  { prefecture: "和歌山県", name: "和歌山県警察本部", lat: 34.226009, lng: 135.1667649 },
  { prefecture: "鳥取県", name: "鳥取県警察本部", lat: 35.5031213, lng: 134.2392317 },
  { prefecture: "島根県", name: "島根県警察本部", lat: 35.4706032, lng: 133.0505097 },
  { prefecture: "岡山県", name: "岡山県警察本部", lat: 34.6609653, lng: 133.9342 },
  { prefecture: "広島県", name: "広島県警察本部", lat: 34.3961413, lng: 132.4612598 },
  { prefecture: "山口県", name: "山口県警察本部", lat: 34.1857381, lng: 131.469571 },
  { prefecture: "徳島県", name: "徳島県警察本部", lat: 34.0648951, lng: 134.5601022 },
  { prefecture: "香川県", name: "香川県警察本部", lat: 34.34014, lng: 134.0424614 },
  { prefecture: "愛媛県", name: "愛媛県警察本部", lat: 33.839012, lng: 132.7628867 },
  { prefecture: "高知県", name: "高知県警察本部", lat: 33.5633706, lng: 133.5319005 },
  { prefecture: "福岡県", name: "福岡県警察本部", lat: 33.6076865, lng: 130.4195588 },
  { prefecture: "佐賀県", name: "佐賀県警察本部", lat: 33.2510888, lng: 130.2979641 },
  { prefecture: "長崎県", name: "長崎県警察本部", lat: 32.7498361, lng: 129.8697217 },
  { prefecture: "熊本県", name: "熊本県警察本部", lat: 32.790354, lng: 130.7409326 },
  { prefecture: "大分県", name: "大分県警察本部", lat: 33.2389022, lng: 131.6124687 },
  { prefecture: "宮崎県", name: "宮崎県警察本部", lat: 31.9091359, lng: 131.4259323 },
  { prefecture: "鹿児島県", name: "鹿児島県警察本部", lat: 31.5592647, lng: 130.558247 },
  { prefecture: "沖縄県", name: "沖縄県警察本部", lat: 26.2115255, lng: 127.6810893 },
];

// 経路リンク・表示用の検索クエリ文字列
function toSearchQuery(entry) {
  return `${entry.prefecture} ${entry.name}`;
}
