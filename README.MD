# line-todo-bot

## Overview

`line-todo-bot` は、LINE Bot を UI にして Todoist の特定 section を家の共有 TODO として扱うためのアプリだ。
同居人は LINE だけを使い、管理者は Todoist も LINE も使える前提で、データの正本は Todoist に固定する。

## Current Status

いま実装できているのは、MVP の土台部分だよ。

- Node.js / TypeScript の実行基盤
- env 検証
- `GET /` と `GET /health`
- `POST /webhook`
- LINE Webhook 署名検証
- allowlist による userId 認可
- `みる` `追加` `完了` `削除` `編集` の command parser
- Todoist gateway
- 番号付き一覧 state
- command handler
- Reply API 送信の配線

まだ未実装のもの:

- ローカル HTTPS 公開手順の確定
- 実 LINE / 実 Todoist を使った疎通確認

## Target Users

- 管理者: Todoist と LINE の両方で共有 TODO を管理する
- 同居人 A: LINE Bot だけで共有 TODO を扱う

## Main Commands

- `みる`
- `追加 {内容}`
- `完了 {番号}`
- `削除 {番号}`
- `編集 {番号} {新しい内容}`

## Environment Variables

`.env.example` を元に `.env` を作る。

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_ALLOWED_USER_IDS`
- `TODOIST_API_TOKEN`
- `TODOIST_PROJECT_ID`
- `TODOIST_SECTION_ID`
- `PORT`
- `LIST_STATE_TTL_SECONDS`

## Local Development

```bash
npm install
npm run dev
```

デフォルトでは次の endpoint が立つ。

- `GET /`
- `GET /health`
- `POST /webhook`

## Validation

```bash
./scripts/lint.sh
./scripts/test.sh
```

または直接:

```bash
npm run build
npm run lint
npm run test
```

## LINE / Todoist Setup

セットアップの詳細は次を見る。

- `docs/setup.md`
- `docs/requirements.md`
- `docs/ARCHITECTURE.md`

## Common Troubles

- `Invalid environment variables`: `.env` の必須値が不足している
- `Invalid LINE webhook signature`: channel secret と webhook 署名が一致していない
- `この操作は許可されていないよ`: `LINE_ALLOWED_USER_IDS` に userId が入っていない
- LINE から疎通できない: ローカル URL が HTTPS で公開されていない
- `./scripts/*.sh` が動かない: Bash がない環境では `npm run lint` と `npm run test` を直接使う
