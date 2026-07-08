// 47都道府県警察本部の一覧データ。
// Google Distance Matrix / Geocoding には「都道府県名 + 警察本部の正式名称」を
// クエリとして渡し、Google 側のジオコーディングで所在地を解決する。
// (手打ちの住所は誤りのリスクがあるため保持しない)
const PREFECTURE_POLICE_HQ = [
  { prefecture: "北海道", name: "北海道警察本部" },
  { prefecture: "青森県", name: "青森県警察本部" },
  { prefecture: "岩手県", name: "岩手県警察本部" },
  { prefecture: "宮城県", name: "宮城県警察本部" },
  { prefecture: "秋田県", name: "秋田県警察本部" },
  { prefecture: "山形県", name: "山形県警察本部" },
  { prefecture: "福島県", name: "福島県警察本部" },
  { prefecture: "茨城県", name: "茨城県警察本部" },
  { prefecture: "栃木県", name: "栃木県警察本部" },
  { prefecture: "群馬県", name: "群馬県警察本部" },
  { prefecture: "埼玉県", name: "埼玉県警察本部" },
  { prefecture: "千葉県", name: "千葉県警察本部" },
  { prefecture: "東京都", name: "警視庁本部庁舎" },
  { prefecture: "神奈川県", name: "神奈川県警察本部" },
  { prefecture: "新潟県", name: "新潟県警察本部" },
  { prefecture: "富山県", name: "富山県警察本部" },
  { prefecture: "石川県", name: "石川県警察本部" },
  { prefecture: "福井県", name: "福井県警察本部" },
  { prefecture: "山梨県", name: "山梨県警察本部" },
  { prefecture: "長野県", name: "長野県警察本部" },
  { prefecture: "岐阜県", name: "岐阜県警察本部" },
  { prefecture: "静岡県", name: "静岡県警察本部" },
  { prefecture: "愛知県", name: "愛知県警察本部" },
  { prefecture: "三重県", name: "三重県警察本部" },
  { prefecture: "滋賀県", name: "滋賀県警察本部" },
  { prefecture: "京都府", name: "京都府警察本部" },
  { prefecture: "大阪府", name: "大阪府警察本部" },
  { prefecture: "兵庫県", name: "兵庫県警察本部" },
  { prefecture: "奈良県", name: "奈良県警察本部" },
  { prefecture: "和歌山県", name: "和歌山県警察本部" },
  { prefecture: "鳥取県", name: "鳥取県警察本部" },
  { prefecture: "島根県", name: "島根県警察本部" },
  { prefecture: "岡山県", name: "岡山県警察本部" },
  { prefecture: "広島県", name: "広島県警察本部" },
  { prefecture: "山口県", name: "山口県警察本部" },
  { prefecture: "徳島県", name: "徳島県警察本部" },
  { prefecture: "香川県", name: "香川県警察本部" },
  { prefecture: "愛媛県", name: "愛媛県警察本部" },
  { prefecture: "高知県", name: "高知県警察本部" },
  { prefecture: "福岡県", name: "福岡県警察本部" },
  { prefecture: "佐賀県", name: "佐賀県警察本部" },
  { prefecture: "長崎県", name: "長崎県警察本部" },
  { prefecture: "熊本県", name: "熊本県警察本部" },
  { prefecture: "大分県", name: "大分県警察本部" },
  { prefecture: "宮崎県", name: "宮崎県警察本部" },
  { prefecture: "鹿児島県", name: "鹿児島県警察本部" },
  { prefecture: "沖縄県", name: "沖縄県警察本部" },
];

// Google へ渡す検索クエリ（同名施設との混同を避けるため都道府県名を付与）
function toSearchQuery(entry) {
  return `${entry.prefecture} ${entry.name}`;
}
