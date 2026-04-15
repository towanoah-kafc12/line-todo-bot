# Requirements

## Purpose

このドキュメントは、`docs/my/plan.md` を実装可能な要件に落とし込むための整理票だ。
実装前に、何を作るか、何を作らないか、どこが未確定かを一枚で分かるようにする。

## Goal

LINE Bot を通じて、Todoist の特定 project 配下の共有 section 群にある active tasks を家の共有 TODO として扱えるようにする。
Todoist を正本に保ち、同じ対象を LINE と Todoist の両方から操作できることが必須要件だ。

## Actors

- 管理者: Todoist と LINE を使える。設定と保守を担当する
- 同居人 A: LINE Bot だけを使う。共有 TODO の日常操作を担当する

## Functional Requirements

### FR-01 一覧表示

- コマンド: `みる`
- 振る舞い: 対象 section 群の未完了 task を section ごとにまとめて取得し、1 始まりの番号付き一覧で返す
- 理由: その後の `完了 2` `削除 2` `編集 2 ...` を番号で扱うため

### FR-02 追加

- コマンド: `追加 {内容}`
- 振る舞い: section を選んだうえで内容が空でなければ、対象 section に task を追加する
- 理由: 同居人が Todoist を開かずに TODO を起票できる必要があるため

### FR-03 完了

- コマンド: `完了 {番号}`
- 振る舞い: 現在の番号付き一覧に対応する task を完了にする
- 理由: task 名の打ち間違いより番号指定の方が非 IT 利用者に向くため

### FR-04 削除

- コマンド: `削除 {番号}`
- 振る舞い: 現在の番号付き一覧に対応する task を削除する
- 理由: 不要 task を LINE 側で片付けられる必要があるため

### FR-05 編集

- コマンド: `編集 {番号} {新しい内容}`
- 振る舞い: 対応する task の content を更新する
- 理由: 打ち直しより簡単に修正できる必要があるため

### FR-06 認可

- 振る舞い: 許可された LINE userId だけが Bot を操作できる
- 理由: 家の共有 project / section 以外は見せず、不正操作を避けるため

### FR-07 対象制限

- 振る舞い: 対象 project_id と section_id 群を設定で固定し、他 project / section は操作しない
- 理由: Todoist の個人領域まで誤って触らないため

### FR-08 Reply API 中心

- 振る舞い: 通常応答は Reply API を使い、不要な Push を送らない
- 理由: 余計な通知を避け、MVP の実装と運用を簡潔に保つため

## Non-Functional Requirements

- NFR-01: Webhook 署名を必ず検証する
- NFR-02: 環境変数不足時は安全に起動失敗する
- NFR-03: token や署名などの秘密情報をログに出さない
- NFR-04: エラー文は短く具体的に返す
- NFR-05: ローカル PC で再現可能なセットアップ手順を残す

## Command Contract

| Command | Input Rule | Success Shape | Error Shape |
| --- | --- | --- | --- |
| `みる` | 追加引数なし | 番号付き一覧 | `使い方が違うよ` |
| `追加 {内容}` | 単一 section 時のみ直接追加可 | `追加したよ: {task}` | `追加ボタンからセクションを選んでね` |
| `完了 {番号}` | 正の整数必須 | `完了したよ: {task}` | `番号が見つからないよ` |
| `削除 {番号}` | 正の整数必須 | `削除したよ: {task}` | `番号が見つからないよ` |
| `編集 {番号} {内容}` | 番号と内容が必須 | `更新したよ: {task}` | `新しい内容が空だよ` |

## State Strategy

- 仮説: `完了` `削除` `編集` は、直前の `みる` 結果に紐づく番号を使う
- 暫定採用: `LINE userId -> task ID 配列` をメモリ保持し、TTL を設ける
- 限界: プロセス再起動で失われる。複数端末同時操作や長時間放置では番号の意味がずれる可能性がある
- 反証条件: ユーザーが再起動後も番号を維持したい、または誤操作許容度が低い場合は SQLite などの永続化が必要

## Security Requirements

- SR-01: `x-line-signature` を raw body に対して検証する
- SR-02: allowlist 外 userId は処理前に拒否する
- SR-03: Todoist write 操作には request id を付けて重複送信リスクを下げる
- SR-04: `.env.example` にはダミー値だけを書く

## Open Questions

| ID | Question | Impact | Current Hypothesis |
| --- | --- | --- | --- |
| Q-COM-002 | 番号付き一覧の state をメモリ保持でよいか | 永続化要否が変わる | TTL 付きメモリ保持 |
| Q-COM-003 | 2 名の権限差を MVP で持つか | role 設計が変わる | 両者とも CRUD 可 |
| Q-COM-004 | ローカル webhook の公開手段を何にするか | setup 手順が変わる | HTTPS トンネルを使う |

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-12 | 0.1 | 初版作成 | Q-COM-002, Q-COM-003, Q-COM-004 |
