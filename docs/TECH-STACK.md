# TECH-STACK

## Purpose

このドキュメントは、使う技術と、その技術に対して AI が何を検証してから完了扱いにするかを管理する。
未確定の技術は仮説として残してよく、決まっていないこと自体を見える化する。

## Current Status

- App Stack: Trial
- Infra Stack: Proposed
- CI/CD: Proposed
- Deployment Target: Trial

## Decision Table

| Area | Decision | Status | Rationale | Validation Entry Point |
| --- | --- | --- | --- | --- |
| App Runtime | Node.js 20.18.1 以上 | Trial | `@line/bot-sdk` と `@doist/todoist-sdk` の要求を満たしつつ、ローカル実行と将来の AWS 移行の両方に寄せやすい | `./scripts/lint.sh`, `./scripts/test.sh` |
| App Language | TypeScript 5.x | Trial | ユーザー希望に一致し、外部 API の型安全性を確保しやすい | `./scripts/lint.sh`, `./scripts/test.sh` |
| Web Framework | Hono + `@hono/node-server` | Trial | 軽量で、Webhook 1 本の API に十分。将来のランタイム移行にも寄せやすい | `./scripts/test.sh` |
| LINE SDK | `@line/bot-sdk` | Trial | LINE 公式 SDK を使うことで署名検証と Reply API の実装リスクを下げる | `./scripts/test.sh` |
| Todoist Client | `@doist/todoist-sdk` | Trial | Todoist 公式 TypeScript SDK で project / section / task 操作をまとめられる | `./scripts/test.sh` |
| Config Validation | `dotenv` + `zod` | Proposed | 環境変数不足時に安全に失敗させたい | `./scripts/test.sh` |
| Test | Vitest | Proposed | 軽量で TypeScript 相性がよく、Webhook ハンドラの単体 / 疑似結合テストに向く | `./scripts/test.sh` |
| Infra | ローカル PC ホストのみ | Trial | MVP では AWS を考えない、という要件を守るため | `./scripts/lint.sh` |
| CI/CD | ローカル検証のみ。CI は後回し | Proposed | まずは手元で再現可能な MVP を優先するため | `./scripts/test.sh` |
| Deploy | ローカル HTTP サーバ + 公開 HTTPS 経路 | Trial | LINE Webhook は HTTPS 必須なので、PC ホストでも公開経路が必要 | `./scripts/deploy.sh` |

`Status` は `Proposed`, `Trial`, `Adopted`, `Rejected` を使う。

## Validation Mapping

### App

- lint: `npm run lint`
- test: `npm run test`
- build: `npm run build`
- dev: `npm run dev`

### Infra

- lint: 現時点では設定ファイルと shell entry point の整合確認のみ
- validate: 公開 HTTPS 経路と Webhook 設定の疎通確認
- plan: AWS へ移る段階で別定義

## Open Questions

技術未確定の論点は、ここに書きっぱなしにせず `docs/tracking/common/QUESTIONS.md` に ID 付きで記録する。

- Q-COM-002: 番号付き一覧の参照状態をメモリ保持で十分か
- Q-COM-003: MVP の権限を 2 名とも CRUD 可で固定してよいか
- Q-COM-004: ローカル Webhook 公開手段を何にするか

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | 技術選定と検証入口の管理テンプレートを追加 | - |
| 2026-04-12 | 0.2 | LINE Bot と Todoist 連携の仮技術選定を追加 | Q-COM-002, Q-COM-003, Q-COM-004 |
