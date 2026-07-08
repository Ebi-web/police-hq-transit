# police-hq-transit

任意の出発地点から47都道府県の警察本部までの、電車・新幹線（公共交通機関）での所要時間を一覧できる Web アプリ。

ビルド不要のプレーン HTML/JS。GitHub Pages でホストする。

## 使い方

1. [GitHub Pages の公開URL](https://ebi-web.github.io/police-hq-transit/) にアクセスする
2. Google Maps API キーを入力して保存する（下記「API キーの発行」を参照）
3. 出発地点と出発日時を入力し、「所要時間を検索」を押す
4. 47都道府県の警察本部への所要時間・距離が一覧表示される。列見出しをクリックすると並び替えできる

API キーはブラウザの `localStorage` にのみ保存され、外部サーバーには送信されない。

## API キーの発行

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成し、課金を有効化する
2. 以下の API を有効化する
   - Maps JavaScript API
   - Places API (New)
   - Routes API
3. 「認証情報」から API キーを新規作成する
4. キーに以下の制限をかける（推奨）
   - アプリケーションの制限: **ウェブサイト**、リファラに `https://ebi-web.github.io/*` （ローカル確認時は `http://localhost:*/*` も追加）
   - API の制限: 上記3つの API のみに限定する

個人利用の呼び出し回数であれば、Google Maps Platform の無料枠内に収まる見込みだが、念のため [Google Cloud Console の予算アラート](https://cloud.google.com/billing/docs/how-to/budgets) を設定することを推奨する。

> **注意**: 2025年3月1日以降に作成した Google Cloud プロジェクトでは、レガシー版の Places API（`google.maps.places.Autocomplete`）や Distance Matrix API は利用できない。本アプリは新しい `PlaceAutocompleteElement`（Places API (New)）と `RouteMatrix`（Routes API）を使用している。

## 技術仕様

- Routes API の `computeRouteMatrix`（`travelMode: TRANSIT`）で所要時間を取得する
- destinations は47件（上限100件）のため1リクエストで送信する
- 出発地点は `PlaceAutocompleteElement` の候補一覧から選択する（テキスト入力のみでは検索できない）
- 各都道府県警察本部は正式名称のみを Google 側の解決に渡す（住所は保持していない）

## ローカルでの動作確認

```bash
python3 -m http.server 8000
```

`http://localhost:8000` にアクセスする。
