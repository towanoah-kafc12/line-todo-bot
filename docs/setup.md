# Setup

## Purpose

このドキュメントは、LINE と Todoist とアプリを最短で接続するための手順書だ。
推測を避けるため、LINE と Todoist は公式情報を先に確認している。

## Official Sources

- LINE: Get started with the Messaging API
  `https://developers.line.biz/en/docs/messaging-api/getting-started/`
- LINE: Build a bot
  `https://developers.line.biz/en/docs/messaging-api/building-bot/`
- LINE: Verify webhook signature
  `https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/`
- LINE: Receive messages (webhook)
  `https://developers.line.biz/en/docs/messaging-api/receiving-messages/`
- LINE: Get user IDs
  `https://developers.line.biz/en/docs/messaging-api/getting-user-ids/`
- Todoist: API docs
  `https://developer.todoist.com/api/v1/`
- Todoist: REST API reference
  `https://developer.todoist.com/rest/v1/`

## Before You Start

- LINE account またはメールアドレス
- Business ID を作成できること
- Todoist account
- Node.js 20 系
- ローカル PC で待受できること
- HTTPS で外部公開できる一時 URL または固定 URL

## LINE Side

### 1. Create a LINE Official Account

LINE 公式 docs では、まず Business ID を登録し、その後 entry form から LINE Official Account を作る流れになっている。
2026-04-12 時点でも、Messaging API channel は LINE Developers Console から直接新規作成できず、Official Account を作ってから Messaging API を有効化する手順が正式だ。

控えるもの:

- LINE Official Account 名
- 管理する provider

### 2. Enable the Messaging API

LINE Official Account Manager で Messaging API を有効化する。
このとき provider を選ぶが、provider を後から変えられないので、将来の channel 連携単位を意識して選ぶ必要がある。

控えるもの:

- provider 名
- Messaging API channel が作成されたこと

### 3. Get the channel secret

Webhook 署名検証には channel secret が必要だ。
LINE 公式 docs では、LINE Developers Console の Basic settings タブで channel secret を確認するよう案内している。

環境変数:

- `LINE_CHANNEL_SECRET`

### 4. Choose a channel access token strategy

LINE 公式 docs は channel access token v2.1 を推奨している。
ただし、v2.1 は assertion signing key 登録と JWT 発行が必要で、MVP のローカル運用には少し重い。

ベスト案:

- MVP は long-lived channel access token を手動発行して `.env` に入れる
- 理由: 個人利用の 2 名向けで、初期セットアップを最小化できるため

代替案:

- v2.1 を使う
- 理由: LINE 公式推奨で、将来のトークン運用が堅い

環境変数:

- `LINE_CHANNEL_ACCESS_TOKEN`

### 5. Set the webhook URL

LINE 公式 docs では Messaging API タブから Webhook URL を設定し、`Verify` の成功後に `Use webhook` を有効化するよう案内している。
Webhook URL は HTTPS 必須で、一般的なブラウザが信頼する認証局の証明書が必要だ。自己署名証明書は不可だ。

入力する値:

- `https://<public-host>/webhook`

確認すること:

- `Verify` が Success になる
- `Use webhook` が Enabled になる

### 6. Disable built-in greeting and auto-reply

LINE 公式 docs では、Messaging API で応答を制御するなら Greeting messages と Auto-reply messages を Disabled にすることを推奨している。
この設定を切らないと、Bot 実装の応答と管理画面の自動応答が混ざって挙動が読みにくくなる。

### 7. Add the account as a friend

Messaging API タブの QR code から LINE Official Account を友だち追加する。
その後、Bot へ何か 1 通送る。

### 8. Collect authorized user IDs

LINE 公式 docs では、Webhook の `source.userId` から相手 userId を取得できる。
Bot 自身の userId は Basic settings で確認できるが、利用者 userId の確定には、実際に友だち追加してメッセージを送ってもらうのが早い。

控えるもの:

- 管理者の `source.userId`
- 同居人 A の `source.userId`

環境変数:

- `LINE_ALLOWED_USER_IDS`

## Todoist Side

### 1. Get a personal API token

Todoist 公式 docs では、個人 token は integrations settings から取得する案内になっている。
今回の MVP は 1 つの Todoist account を正本として使うため、OAuth ではなく personal API token で十分だ。

環境変数:

- `TODOIST_API_TOKEN`

### 2. Prepare the target project and sections

Todoist 上で共有用 project を 1 つ決め、その中に共有用 section を必要数だけ作る。
現在の実装は `共有` project 配下の `買うもの` と `やること` の 2 section を前提にしているよ。

控えるもの:

- project 名
- section 名の一覧

### 3. Confirm `project_id`

Todoist 公式 docs の例では、認証付きで projects 一覧を取得すると `id` を確認できる。

例:

```bash
curl -X GET https://api.todoist.com/api/v1/projects \
  -H "Authorization: Bearer $TODOIST_API_TOKEN"
```

環境変数:

- `TODOIST_PROJECT_ID`

注意点:

- Todoist の current docs は `https://developer.todoist.com/api/v1/` に集約されていて、`/rest/v1` は deprecated warning が出ることがある
- 実装では公式 TypeScript SDK `@doist/todoist-sdk` を優先し、上の curl は ID 確認用の補助手順として扱う

### 4. Confirm `section_id`

Todoist 公式 docs の例では、project_id を指定して sections 一覧を取得すると `section_id` を確認できる。

例:

```bash
curl -s -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  "https://api.todoist.com/api/v1/sections?project_id=$TODOIST_PROJECT_ID"
```

環境変数:

- `TODOIST_SECTION_IDS`
- `TODOIST_SECTION_NAMES`

## App Side

### 1. Create `.env`

最低限この値を入れる。

```dotenv
LINE_CHANNEL_SECRET=your-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_ALLOWED_USER_IDS=Uxxxxxxxxxxxxxxxx,Uyyyyyyyyyyyyyyyy
TODOIST_API_TOKEN=your-todoist-token
TODOIST_PROJECT_ID=1234567890
TODOIST_SECTION_IDS=2345678901,3456789012
TODOIST_SECTION_NAMES=買うもの,やること
PORT=3000
LIST_STATE_TTL_SECONDS=900
```

### 2. Start the local server

実装後の想定コマンド:

```bash
npm install
npm run dev
```

### 3. Expose the local server over HTTPS

LINE は HTTPS と公開 URL を要求するので、ローカル待受のままでは Webhook を受けられない。
そのため、PC で動かす段階でも HTTPS トンネルか公開 reverse proxy が必要だ。

Cloudflare Quick Tunnel を使う場合の例:

```bash
npx wrangler tunnel quick-start http://localhost:3000
```

注意点:

- `wrangler tunnel --url http://localhost:3000` は現行版では `Unknown argument: url` になる
- 公開 URL が表示されたら、その `https://...trycloudflare.com` を Webhook URL のベースに使う

未確定事項:

- どの公開手段を標準とするかは Q-COM-004 で確定する

### 4. Verify the webhook

- LINE Developers Console の `Verify` が Success になる
- 友だち追加またはメッセージ送信でサーバに event が届く
- 認可された userId だけが通る

### 5. Verify Todoist integration

- `みる` で対象 2 section の active tasks が section ごとに返る
- `追加する` で section を選んで task を追加できる
- `完了する` `削除する` `編集する` で対象 task にだけ作用する

## Rich Menu Side

### 1. Use rich menus managed by Messaging API

今回は LINE Official Account Manager ではなく Messaging API で、default main menu と会話中の per-user rich menu を管理する。
理由は、設定をコード化して再現しやすくするのと、会話 state に応じて `キャンセル` 中心の menu へ切り替えたいからだよ。

注意:

- 同じ rich menu を Manager と Messaging API の両方から編集しない
- デスクトップ版 LINE では rich menu は表示されない

### 2. Generate and apply the rich menu set

この repo には、main menu と state menu 群の定義と画像を置いてある。
`一覧を見る` は `message action` で `みる` を即送信する。
`追加する` `完了する` `削除する` `編集する` は `postback action` で会話を始める。
会話中は、user ごとに `追加中` `編集中` `完了中` `削除中` menu に切り替わる。
状態別 menu では `キャンセル` と `一覧を見る` を出す。
理由は、複数 section と番号付き操作では会話型の方が自然で、入力ミスや番号確認漏れを減らせるからだよ。

実行コマンド:

```bash
npm run rich-menu:images
npm run rich-menu:apply
```

このコマンドがやること:

1. `assets/line/*.json` と `assets/line/*.png` を使って main / add / edit / complete / delete の rich menu を作る
2. それぞれの画像を upload する
3. `todo-main` `todo-add` `todo-edit` `todo-complete` `todo-delete` の alias を更新する
4. main rich menu を default rich menu に設定する

補助コマンド:

```bash
npm run rich-menu:list
npm run rich-menu:clear
npm run rich-menu:delete -- <richMenuId>
```

### 3. Verify the rich menu behavior

- スマホ版 LINE の個人チャットで rich menu が見える
- グループでも rich menu が見える
- `一覧を見る` を押すと `みる` が送られる
- `追加する` を押すと section 選択とタスク名入力の会話が始まる
- `完了する` を押すと、一覧と `完了したい番号を送って` が返る
- `削除する` を押すと、一覧と `削除したい番号を送って` が返る
- `編集する` を押すと、一覧と `編集したい番号を送って` が返る
- 会話中は `追加中` `編集中` `完了中` `削除中` の menu に切り替わる
- `キャンセル` を押すと default main menu に戻る
- `一覧を見る` を押しても会話 state は保たれる
- Bot が Reply API で一覧を返す

## Common Failure Points

- Webhook URL が HTTPS でない
- channel secret と access token を取り違えている
- Greeting / Auto-reply が有効のままで応答が二重になる
- `LINE_ALLOWED_USER_IDS` に userId ではなく LINE ID を入れてしまう
- Todoist token は正しいが `project_id` と `section_ids` が対象とずれている

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-12 | 0.1 | LINE と Todoist の公式調査に基づく初版作成 | Q-COM-004 |
| 2026-04-14 | 0.2 | Messaging API で default rich menu を適用する手順を追加 | - |
| 2026-04-15 | 0.3 | 会話 state ごとの per-user rich menu と生成手順を追加 | Q-APP-004 |
