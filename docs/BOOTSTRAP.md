# BOOTSTRAP

## Purpose

このドキュメントは、テンプレートから実プロジェクトへ入る最初のフェーズを管理する。
ここで方向性、優先事項、未確定事項を整理して、後続の設計と実装の土台を作る。

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

- [ ] Goal が一文で説明できる
- [ ] In Scope / Out of Scope が書かれている
- [ ] 利用者または利用シーンが書かれている
- [ ] 仮の技術候補が `docs/TECH-STACK.md` にある
- [ ] 未確定事項が `docs/tracking/common/QUESTIONS.md` に登録されている
- [ ] AI の停止条件が `docs/DELIVERY.md` に定義されている

## Decisions to Make Early

| Area | What to Decide | Minimum | Where to Record |
| --- | --- | --- | --- |
| Common | Goal / Scope / Constraints | 必須 | `docs/PROJECT.md` |
| App | アプリの種別、責務、テスト方針 | 仮説でも可 | `docs/TECH-STACK.md` |
| Infra | IaC、環境、検証方針 | 仮説でも可 | `docs/TECH-STACK.md` |
| Delivery | 完了条件、デプロイ有無 | 必須 | `docs/DELIVERY.md` |

## Exit Criteria

このフェーズは次を満たしたらいったん完了扱いにする。

- 実装に入る最低限の方向性がある
- 未確定事項が列挙されている
- 仮の検証方法が定義されている
- 追跡先のドキュメントが決まっている

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | 初期ビルドフェーズの追加 | - |
