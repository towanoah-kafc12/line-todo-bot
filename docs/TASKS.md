# TASKS

## Working Units

このファイルでは、repo 全体をひと塊で管理せず、作業単位を `common`、`app`、`infra` に分けて扱う。
細かい不具合と不明点は `docs/tracking/` 側で管理し、ここでは進行中のまとまりだけを見る。

## Now

### common

- [x] テンプレートの骨組みを作る
- [x] 初期ビルド運用の枠を追加する
- [x] PJ の目的、スコープ、成功条件を埋める
- [x] 技術スタック候補を決める
- [x] 実装前ドキュメントを作成する
- [ ] 未確定事項 Q-COM-002 から Q-COM-004 を潰す

### app

- [x] アプリの種類と責務を定義する
- [x] 最低限の検証方法を定義する
- [x] Node.js / TypeScript のアプリ雛形を作る
- [x] Todoist gateway を実装する
- [x] Webhook 署名検証と認可を実装する
- [x] LINE command parser を実装する
- [x] 単体テストと疑似結合テストの土台を追加する
- [x] 番号付き一覧 state を実装する
- [x] Reply API と command handler を実装する
- [ ] 実 LINE / 実 Todoist を使った疎通確認を行う

### infra

- [ ] ローカル webhook 公開手段を確定する
- [ ] AWS 移行を見据えた最小構成メモを残す

## Next

- [ ] 実 LINE / 実 Todoist を使って `みる` `追加` `完了` `削除` `編集` を確認する
- [ ] ローカル webhook 疎通手順を `docs/setup.md` に反映する
- [ ] 実機の webhook 疎通を確認する
- [ ] 失敗時のログ方針を実装に反映する

## Blocked

- [ ] 番号付き一覧の state 永続性要件が未確定
- [ ] ローカルで使う HTTPS 公開経路が未確定

## Done

- [x] テンプレート構成の基本方針を決定した
- [x] 課題管理と設計改訂の連携ルールを追加した
- [x] LINE Todoist 共有 TODO Bot の要件整理と設計ドキュメントを作成した
- [x] 実装順を固定する `docs/implementation-plan.md` を追加した
- [x] app scaffold、env 検証、Webhook 入口、署名検証、認可、command parser を実装した
- [x] Todoist gateway、番号付き一覧 state、command handler、Reply API 配線を実装した
