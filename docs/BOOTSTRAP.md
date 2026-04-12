# BOOTSTRAP

## Purpose

このドキュメントは、テンプレートから実プロジェクトへ入る最初のフェーズを管理する。
ここで方向性、優先事項、未確定事項を整理して、後続の設計と実装の土台を作る。

## Current Snapshot

- Goal: LINE Bot を UI にして、Todoist の特定 project / section を家の共有 TODO として扱う
- Primary Users: Todoist を使う管理者 1 名と、LINE だけ使う同居人 1 名
- In Scope: LINE での `みる` `追加` `完了` `削除` `編集`、Todoist 対象 section との整合
- Out of Scope: 自然言語理解、不要な Push 通知、AWS 本番運用、複数 section 対応
- Delivery Order: app 先行。infra はローカル PC ホストで十分なため後回し
- Candidate Stack: Node.js 20 系、TypeScript、軽量 HTTP フレームワーク、Todoist TypeScript SDK
- Open Questions: 番号付き一覧の状態保持、権限粒度、ローカル webhook 公開手段

## Input Modes

PJ 開始時の入力は次の 2 パターンを想定する。

1. 一括入力
要件、技術、制約を最初にまとめて入れる。

2. 対話入力
不明点を会話しながら埋めていく。
即決できない項目は `docs/tracking/common/QUESTIONS.md` に逃がす。

## Minimum Definition

最初に全部を確定しなくてもよいが、次は最低限ほしい。

- 何を作るか
- 誰のためか
- 何を今回はやらないか
- app / infra のどちらが先行か
- 仮の技術候補
- いま未確定な項目

## Bootstrap Checklist

- [x] Goal が一文で説明できる
- [x] In Scope / Out of Scope が書かれている
- [x] 利用者または利用シーンが書かれている
- [x] 仮の技術候補が `docs/TECH-STACK.md` にある
- [x] 未確定事項が `docs/tracking/common/QUESTIONS.md` に登録されている
- [x] AI の停止条件が `docs/DELIVERY.md` に定義されている

## Decisions to Make Early

| Area | What to Decide | Minimum | Where to Record |
| --- | --- | --- | --- |
| Common | Goal / Scope / Constraints | 必須 | `docs/PROJECT.md` |
| App | LINE command の責務、番号付き state、テスト方針 | 仮説でも可 | `docs/requirements.md`, `docs/TECH-STACK.md` |
| Infra | ローカル webhook 公開手段、将来の AWS 移行前提 | 仮説でも可 | `docs/setup.md`, `docs/TECH-STACK.md` |
| Delivery | 完了条件、デプロイ有無 | 必須 | `docs/DELIVERY.md` |

## Exit Criteria

このフェーズは次を満たしたらいったん完了扱いにする。

- 実装に入る最低限の方向性がある
- 未確定事項が列挙されている
- 仮の検証方法が定義されている
- 追跡先のドキュメントが決まっている

## Bootstrap Output

- 要件整理: `docs/requirements.md`
- 想定アーキテクチャ: `docs/ARCHITECTURE.md`
- セットアップ手順: `docs/setup.md`
- テスト計画: `docs/test-plan.md`
- 未確定事項: `docs/tracking/common/QUESTIONS.md`

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | 初期ビルドフェーズの追加 | - |
| 2026-04-12 | 0.2 | LINE Todoist 共有 TODO Bot 向けの初期定義を追加 | Q-COM-002, Q-COM-003, Q-COM-004 |
