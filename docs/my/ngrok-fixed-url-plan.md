# `ngrok` で無料の固定 URL を使う方針メモ

## 結論

固定 URL を無料で確保したいなら、当面は `Cloudflare Tunnel` ではなく `ngrok` 無料プランを使う方針にするよ。
理由は、`Cloudflare Tunnel` で固定 hostname を使うには自分のドメインが必要だけど、`ngrok` は独自ドメインなしでも HTTPS の公開 URL を持てるからだね。

この方針は、`PC 使用中だけ公開できればよい` という条件とも合っているよ。

## 前提

- 自分の独自ドメインは持っていない
- 追加コストはかけない
- ローカル PC でアプリを動かし、その間だけ LINE Webhook を受けられればよい

## 方針

`ngrok` の無料プランを使って、ローカルの `http://localhost:3000` を HTTPS 公開する。
LINE Developers Console の Webhook URL には、その公開 URL の `/webhook` を設定する。

## 理由

### `Cloudflare Tunnel` を使わない理由

`Cloudflare Tunnel` の named tunnel で固定 hostname を作るには、Cloudflare 管理下のドメインが必要だよ。
今回は独自ドメインが無いので、この前提を満たせないね。

### `ngrok` を使う理由

`ngrok` は無料プランでも HTTPS 公開 URL を持てるからだよ。
ローカル開発と Webhook 検証に向いていて、LINE Bot の試験運用とも相性がいいね。

## 手順

### 1. `ngrok` をインストールする

PowerShell:

```powershell
winget install --id Ngrok.Ngrok
```

補足:

- インストール後は新しい PowerShell を開く
- 理由は PATH 反映のためだよ

### 2. `ngrok` アカウントを作る

公式サイト:

- https://ngrok.com/

### 3. authtoken を設定する

`ngrok` ダッシュボードで `Your Authtoken` を確認して、これを設定する。

```powershell
ngrok config add-authtoken <YOUR_AUTHTOKEN>
```

### 4. アプリを起動する

この repo のルートで実行する。

```powershell
npm run dev
```

確認:

```powershell
curl.exe http://localhost:3000/health
```

期待値:

- HTTP 200
- `{"status":"ok"}`

### 5. `ngrok` で `localhost:3000` を公開する

別ターミナルで実行する。

```powershell
ngrok http 3000
```

表示される HTTPS URL の例:

```text
https://xxxxx.ngrok-free.app
```

### 6. LINE の Webhook URL を設定する

LINE Developers Console の `Messaging API` で、Webhook URL を次の形にする。

```text
https://xxxxx.ngrok-free.app/webhook
```

そのあとで:

1. `Verify` を押す
2. `Use webhook` を ON にする

### 7. LINE で実機確認する

bot にメッセージを送って、アプリ側ログと LINE の返信を確認する。

## 運用上の注意

- PC が止まっている間は公開されない
- `npm run dev` が止まると Webhook は失敗する
- `ngrok` プロセスが止まると Webhook は失敗する
- LINE Developers Console の URL は、使う公開 URL に合わせて更新が必要だよ

## 現時点の進捗

アプリ側は、少なくとも `LINE で応答するところまでは確認済み` という状態だよ。
つまり、次の主な確認対象は `固定 URL の運用` と `Todoist を含めた実機疎通` になるね。

## 参考

- https://ngrok.com/docs/getting-started/
- https://ngrok.com/docs/universal-gateway/domains/
- https://ngrok.com/docs/pricing-limits/free-plan-limits
- https://developers.cloudflare.com/tunnel/advanced/local-management/create-local-tunnel/
