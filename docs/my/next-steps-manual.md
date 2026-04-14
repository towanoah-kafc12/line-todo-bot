# 次にやること

## 結論

次にやることは、LINE と Todoist の実環境をつないで、この PC 上のアプリで実機疎通確認をすることだよ。
理由は、コード上の MVP 骨格は揃っていて、残る不確実性が `LINE 設定` `Todoist 実データ` `HTTPS 公開` に寄っているからだね。

## 事前に必要なもの

- LINE Official Account
- LINE Messaging API channel
- Todoist アカウント
- このリポジトリのローカル環境
- `npm`
- ローカルサーバを一時的に HTTPS 公開する手段

## 手順

### 1. LINE Official Account と Messaging API channel を準備する

理由は、Webhook と Reply API の両方に必要だからだよ。

手順:

1. LINE Official Account を作る
2. Messaging API を有効化する
3. LINE Developers Console で対象 channel を開く

控える値:

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

公式:

- https://developers.line.biz/en/docs/messaging-api/getting-started/
- https://developers.line.biz/en/docs/basics/channel-access-token/

### 2. 自分の LINE userId を取る

理由は、今の実装が allowlist 前提だからだよ。

手順:

1. LINE Developers Console を開く
2. 対象 channel の `Basic settings` を開く
3. `Your user ID` を控える

入れる値:

- `LINE_ALLOWED_USER_IDS`

注意:

- `LINE ID` じゃなくて `U` で始まる userId を入れること

公式:

- https://developers.line.biz/en/docs/messaging-api/getting-user-ids/

### 3. Todoist の token と対象 project / section を決める

理由は、この bot が特定 project / section しか触らない設計だからだよ。

手順:

1. Todoist integrations settings で personal API token を取る
2. 共有用 project を決める
3. その中の共有用 section を決める

控える値:

- `TODOIST_API_TOKEN`
- `TODOIST_PROJECT_ID`
- `TODOIST_SECTION_ID`

公式:

- https://developer.todoist.com/api/v1/
- https://developer.todoist.com/rest/v2/

### 4. `project_id` と `section_id` を確認する

理由は、UI 上の見た目だけだと ID を env に入れられないからだね。

PowerShell:

```powershell
$env:TODOIST_API_TOKEN="あなたのTodoistトークン"
curl.exe -X GET https://api.todoist.com/api/v1/projects `
  -H "Authorization: Bearer $env:TODOIST_API_TOKEN"
```

対象 project の `id` を控える。

次に:

```powershell
$env:TODOIST_PROJECT_ID="さっき控えたproject_id"
curl.exe -X GET "https://api.todoist.com/api/v1/sections?project_id=$env:TODOIST_PROJECT_ID" `
  -H "Authorization: Bearer $env:TODOIST_API_TOKEN"
```

対象 section の `id` を控える。

### 5. `.env` を作る

理由は、今のアプリは env が揃わないと起動しないからだよ。

PowerShell:

```powershell
Copy-Item .env.example .env
```

`.env` に入れる値:

```dotenv
LINE_CHANNEL_SECRET=ここにchannel secret
LINE_CHANNEL_ACCESS_TOKEN=ここにchannel access token
LINE_ALLOWED_USER_IDS=ここに自分のUから始まるuserId
TODOIST_API_TOKEN=ここにTodoist token
TODOIST_PROJECT_ID=ここにproject_id
TODOIST_SECTION_ID=ここにsection_id
PORT=3000
LIST_STATE_TTL_SECONDS=900
```

### 6. ローカルで起動する

理由は、まず localhost で正常起動するか確認した方が切り分けしやすいからだよ。

PowerShell:

```powershell
npm install
npm run dev
```

別ターミナルで確認:

```powershell
curl.exe http://localhost:3000/health
```

期待結果:

```json
{"status":"ok"}
```

### 7. ローカルサーバを HTTPS 公開する

理由は、LINE Webhook が HTTPS 必須だからだね。

Cloudflare Quick Tunnel を使う場合:

```powershell
npx wrangler tunnel quick-start http://localhost:3000
```

補足:

- `wrangler tunnel --url ...` は現行版では通らない
- `Unknown argument: url` が出たら、サブコマンドを `quick-start` にする
- エラー直後の `Assertion failed` は wrangler 側の不安定な後処理で、主原因はコマンドミスだよ

控える値:

- `https://xxxx.trycloudflare.com` のような公開 URL

公式:

- https://developers.cloudflare.com/tunnel/setup/
- https://developers.cloudflare.com/workers/wrangler/commands/tunnel/

### 8. LINE に Webhook URL を設定する

理由は、LINE からアプリにイベントを送るためだよ。

手順:

1. LINE Developers Console
2. 対象 channel の `Messaging API`
3. Webhook URL に次を入れる  
   `https://xxxx.trycloudflare.com/webhook`
4. `Verify` を押す
5. `Use webhook` を有効化する

公式:

- https://developers.line.biz/en/docs/messaging-api/verify-webhook-url/
- https://developers.line.biz/en/docs/messaging-api/receiving-messages/

### 9. LINE Official Account を友だち追加する

理由は、実際にメッセージを送らないと webhook が飛ばないからだよ。

手順:

1. Messaging API タブの QR code などから bot を友だち追加する
2. 自分の LINE から bot にメッセージを送る

### 10. 実機確認をこの順でやる

理由は、番号付き一覧 state を作ってから操作系を試す必要があるからだね。

送るメッセージ:

1. `みる`
2. `追加 牛乳を買う`
3. `みる`
4. `編集 1 牛乳を2本買う`
5. `みる`
6. `完了 1`
7. `みる`
8. `追加 トイレットペーパー`
9. `みる`
10. `削除 1`
11. `みる`

期待する結果:

- `みる` で番号付き一覧が返る
- `追加` で Todoist の対象 section に task が追加される
- `編集` `完了` `削除` が、直前の一覧の番号に対応した task にだけ作用する

### 11. 失敗したらこの順で確認する

理由は、原因の当たりを最短で絞れるからだよ。

確認順:

1. `npm run dev` のターミナルでサーバが落ちていないか
2. `curl.exe http://localhost:3000/health` が通るか
3. tunnel がまだ生きているか
4. LINE Console の `Verify` が成功するか
5. `LINE_CHANNEL_SECRET` と `LINE_CHANNEL_ACCESS_TOKEN` を取り違えていないか
6. `LINE_ALLOWED_USER_IDS` が `U...` 形式の userId か
7. `TODOIST_PROJECT_ID` と `TODOIST_SECTION_ID` が対象と一致しているか

## 補足

- 現時点では、まず自分 1 人での疎通確認を先にやるのが安全だよ
- 同居人 A の userId 登録や運用調整は、そのあとで十分だね
- `scripts/lint.sh` と `scripts/test.sh` は更新済みだけど、この Windows 環境に Bash がなければ `npm run lint` と `npm run test` を直接使う方が確実だよ
- Todoist の `https://api.todoist.com/rest/v1/...` は deprecated warning が出ることがあるから、手動確認は `https://api.todoist.com/api/v1/...` を使うこと
