# ARCHITECTURE

## System Context

- Frontend: TBD
- Backend/API: TBD
- Database: TBD
- AWS: TBD
- External Services: TBD

## Design Principles

- 疎結合を保つ
- 最小権限を意識する
- 再現可能なデプロイを目指す
- 障害時に原因を追いやすい構成にする

## Main Components

### app

アプリケーション実装を置く。
画面、API、バッチなどの責務はここで整理する。
不具合と不明点は `docs/tracking/app/` で管理する。

### infra

インフラコードを置く。
環境差分やデプロイ方針も合わせて整理する。
不具合と不明点は `docs/tracking/infra/` で管理する。

### scripts

セットアップ、検証、デプロイなどの入口を置く。
エージェントが迷わないように、入口名は安定させる。

### docs

初期ビルド、技術選定、タスク、課題管理、設計改訂をまとめる。
実装だけ進んで文書が置いていかれないよう、更新責務をここで持つ。

## Operational Considerations

- ログ出力方針: TBD
- 監視対象: TBD
- アラート方針: TBD
- デプロイ方針: TBD
- ロールバック方針: TBD

## Change Management

- 設計変更が発生したら、関連する `BUG-*` または `Q-*` の ID を改訂履歴へ残す
- 変更理由が暫定対応か恒久対応かを区別して書く
- 技術選定変更時は `docs/TECH-STACK.md` と一緒に更新する

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | 初期テンプレート作成 | - |
| 2026-04-11 | 0.2 | 課題管理と設計改訂の連動ルールを追加 | - |
