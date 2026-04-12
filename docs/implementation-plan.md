# Implementation Plan

## Purpose

このドキュメントは、AI が repo の状態を見て次の一手を決めやすくするための work package 一覧だ。
設計書と実装の間を埋めるのが役割で、実行順、変更対象、完了条件を明示する。

## Default Execution Rule

- 上から順に着手する
- `Blocked By` が未解決でも、`Proceed With Assumption` があるものは暫定実装で進める
- 各 work package が終わったら、関連 docs と `docs/TASKS.md` を同期する
- `Validation` が通ったら次の package へ進む

## Work Packages

### WP-001 App Scaffold

- Status: Completed
- Objective: Node.js / TypeScript の実行基盤を作る
- Inputs: `docs/TECH-STACK.md`, `docs/ARCHITECTURE.md`
- Files To Touch: `package.json`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `.gitignore`
- Output: `npm run dev`, `npm run build`, `npm run lint`, `npm run test` の入口が揃う
- Validation: `npm run lint`, `npm run test`
- Blocked By: なし
- Done Condition: 最小サーバとテストを実行できる

### WP-002 Config And Env

- Status: Completed
- Objective: 起動に必要な env を型付きで検証する
- Inputs: `docs/requirements.md`, `docs/setup.md`
- Files To Touch: `.env.example`, `app/src/config/env.ts`, `app/test/env.test.ts`
- Output: 必須 env 欠落時に安全に失敗する
- Validation: `npm run test -- --runInBand` 相当の env test
- Blocked By: なし
- Proceed With Assumption: `LINE_ALLOWED_USER_IDS` は CSV で受ける
- Done Condition: env parser が必須値と数値項目を検証し、失敗系テストがある

### WP-003 Webhook Entry

- Status: Completed
- Objective: LINE Webhook を受ける HTTP endpoint を作る
- Inputs: `docs/requirements.md`, `docs/setup.md`
- Files To Touch: `app/src/server/create-app.ts`, `app/src/line/webhook.ts`, `app/test/webhook.test.ts`
- Output: `POST /webhook` が raw body を受けて handler に渡す
- Validation: webhook request test
- Blocked By: WP-001, WP-002
- Done Condition: endpoint が追加され、署名検証前提のテスト土台がある

### WP-004 Authorization And Parser

- Status: Completed
- Objective: 許可 userId 判定と command parser を実装する
- Inputs: `docs/requirements.md`
- Files To Touch: `app/src/line/authorization.ts`, `app/src/commands/parser.ts`, `app/test/parser.test.ts`
- Output: `みる` `追加` `完了` `削除` `編集` を解釈できる
- Validation: parser test, authorization test
- Blocked By: WP-002, WP-003
- Proceed With Assumption: MVP は 2 名とも同権限
- Done Condition: 正常系と主要エラー系をテストでカバーする

### WP-005 Todoist Gateway

- Status: Completed
- Objective: Todoist API を隠蔽する adapter を作る
- Inputs: `docs/ARCHITECTURE.md`, `docs/requirements.md`
- Files To Touch: `app/src/todoist/client.ts`, `app/src/todoist/gateway.ts`, `app/test/todoist-gateway.test.ts`
- Output: list, add, update, close, delete を section 固定で呼べる
- Validation: adapter unit test
- Blocked By: WP-002
- Done Condition: section 外を触らない gateway interface が固まる

### WP-006 List State

- Status: Completed
- Objective: 番号付き一覧と task ID の対応を保持する
- Inputs: `docs/requirements.md`, `docs/tracking/common/QUESTIONS.md`
- Files To Touch: `app/src/state/list-state.ts`, `app/test/list-state.test.ts`
- Output: userId ごとに TTL 付き state を参照できる
- Validation: list state test
- Blocked By: WP-002
- Proceed With Assumption: TTL 付きメモリ保持
- Done Condition: `完了 2` の番号解決に必要な state API ができる

### WP-007 Command Handlers

- Status: Completed
- Objective: `みる` `追加` `完了` `削除` `編集` を Todoist と接続する
- Inputs: `docs/requirements.md`, `docs/ARCHITECTURE.md`
- Files To Touch: `app/src/commands/handlers.ts`, `app/src/line/reply.ts`, `app/test/handlers.test.ts`
- Output: 5 コマンドが期待どおりの応答文を返す
- Validation: handler integration test
- Blocked By: WP-004, WP-005, WP-006
- Done Condition: MVP コマンド一式がローカルで動く

### WP-008 Docs And Scripts Sync

- Status: In Progress
- Objective: 手順書と scripts を実装に合わせて同期する
- Inputs: 実装済みコード一式
- Files To Touch: `README.MD`, `docs/setup.md`, `docs/test-plan.md`, `scripts/lint.sh`, `scripts/test.sh`
- Output: repo ルートから検証と起動方法が追える
- Validation: `./scripts/lint.sh`, `./scripts/test.sh`
- Blocked By: WP-001 から WP-007
- Done Condition: 第三者が docs を見て起動と検証に進める

## Current Recommendation

- 今の次アクション: WP-008 を進めつつ、実 LINE / 実 Todoist の疎通確認に入る
- 理由: コード上の MVP 骨格は揃ったので、残る不確実性は外部サービスとの実接続に寄っているため

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-12 | 0.1 | 初版作成 | Q-COM-002, Q-COM-003, Q-COM-004 |
| 2026-04-12 | 0.2 | WP-001 から WP-004 完了と現在地を反映 | Q-COM-002, Q-COM-003 |
| 2026-04-12 | 0.3 | WP-005 から WP-007 完了と現在地を反映 | Q-COM-002, Q-COM-003, Q-COM-004 |
