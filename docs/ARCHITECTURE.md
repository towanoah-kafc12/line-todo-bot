# ARCHITECTURE

## System Context

- Frontend: 独立した画面はなし。利用者 UI は LINE の 1 対 1 チャット、グループ、デフォルト rich menu、状態別の per-user rich menu
- Backend/API: Node.js + TypeScript の小さな Webhook サーバ
- Database: MVP では永続 DB なし。番号付き一覧の対応表はメモリ保持を暫定採用
- AWS: 対象外。ローカル PC ホストのみ
- External Services: LINE Messaging API、Todoist API

## Design Principles

- 疎結合を保つ
- 最小権限を意識する
- 再現可能なデプロイを目指す
- 障害時に原因を追いやすい構成にする
- 正本は Todoist に限定し、LINE 側に業務データを持ちすぎない
- 署名検証と認可を先に通し、その後で command 処理に入る

## Main Components

### app

LINE Webhook を受ける HTTP サーバを置く。
主な責務は `署名検証` `認可` `コマンド解釈` `Todoist 呼び出し` `応答文生成` だ。
不具合と不明点は `docs/tracking/app/` で管理する。

### infra

MVP では本格的な IaC は置かない。
ただし、将来 AWS に載せ替えやすいように、アプリ側は stateless に寄せる。
不具合と不明点は `docs/tracking/infra/` で管理する。

### scripts

セットアップ、検証、デプロイなどの入口を置く。
エージェントが迷わないように、入口名は安定させる。

### docs

初期ビルド、技術選定、タスク、課題管理、設計改訂をまとめる。
実装だけ進んで文書が置いていかれないよう、更新責務をここで持つ。

## Request Flow

1. LINE Platform が Webhook URL に HTTPS POST を送る
2. サーバが `x-line-signature` と raw body を使って署名検証する
3. `source.userId` が許可 userId に含まれるか確認する
4. text message を明示コマンドとして parse する
5. Todoist client が対象 `project_id` 配下の設定済み `section_id` 群だけ読む / 書く
6. 操作結果を短い日本語メッセージに整形して Reply API で返す

リッチメニューは、通常時の main menu で操作種別を選び、その後は `postback action` で section 選択へ進める方針にする。
`表示する` は `todo-list` メニュー (`買うもの` / `やること` / `キャンセル` / `全部見る`) を表示し、CRUD は section を選んだあとに会話 state へ移る。
通常時は default main menu を出し、会話 state がある間だけ per-user rich menu を user 単位で上書きする。
理由は、2 section 前提の操作では「操作 -> section」の順に固定した方が誤操作を減らせるうえ、会話中だけ `キャンセル` を大きく出した方が迷いにくいからだよ。
section 選択メニューのラベルと postback に使う `section_id` は、rich menu 適用時に `.env` の `TODOIST_SECTION_IDS` / `TODOIST_SECTION_NAMES` から組み立てる。
ただしレイアウト自体は 2 section 前提のまま固定し、3 個以上へ広げる議論は `Q-APP-003` で分けて扱う。

## Data Flow

### `みる`

- Todoist の active tasks を設定済み `section_id` 群で絞って取得する
- section 順と task 順で並べ、表示順に番号を振る
- `LINE userId -> 表示中 task ID 配列` をメモリに保存する
- 一覧本文を Reply API で返す

### `完了 {番号}` `削除 {番号}` `編集 {番号} {内容}`

- 直前の一覧 state から番号に対応する task ID を引く
- task ID が見つからなければ短いエラーを返す
- Todoist の close / delete / update を実行する
- 必要なら更新後一覧を返す

### `追加`

- rich menu から入った場合は、先に section を選ばせる
- そのあと内容を受け取って、選ばれた `section_id` に task を追加する
- 追加後の task と section 名を元に成功メッセージを返す

## Rich Menu State Model

- `todo-main`: 通常時の default main menu
- `todo-add`: `awaiting-add-section` と `awaiting-add-content` の間だけ user に link する
- `todo-edit`: `awaiting-edit-index` と `awaiting-edit-content` の間だけ user に link する
- `todo-complete`: `awaiting-complete-index` の間だけ user に link する
- `todo-delete`: `awaiting-delete-index` の間だけ user に link する

会話 state が消えたら user の per-user rich menu を unlink して、default main menu に戻す。
この切替は Webhook ごとに state を再評価して同期する。

制約もあるよ。
per-user rich menu は user 単位なので、同じ user が個人チャットとグループの両方で同時進行すると、見た目の menu 状態は共有される。
ここは LINE の room 単位スコープが無いことによる仕様上の限界として扱う。

## Configuration Model

- `LINE_CHANNEL_SECRET`: Webhook 署名検証に使う
- `LINE_CHANNEL_ACCESS_TOKEN`: Reply API 呼び出しに使う
- `LINE_ALLOWED_USER_IDS`: 操作を許可する LINE userId の CSV
- `TODOIST_API_TOKEN`: Todoist API 認証に使う
- `TODOIST_PROJECT_ID`: 操作対象 project
- `TODOIST_SECTION_IDS`: 操作対象 section ID の CSV
- `TODOIST_SECTION_NAMES`: 操作対象 section 名の CSV
- `PORT`: ローカル待受ポート
- `LIST_STATE_TTL_SECONDS`: 番号付き一覧の有効期限

## Security Notes

- 署名検証前に request body を加工しない
- IP 制限ではなく署名検証を信頼の起点にする
- 許可 userId 外の操作は即時拒否する
- Todoist 側は必ず固定 `project_id` と設定済み `section_id` 群で絞り、他 project / section を触らない
- 秘密情報は `.env` から読む。ログには token や署名を出さない
- Long-lived token を使う場合は、MVP の簡便性と引き換えに漏えい対策を強く意識する
- 破壊操作の重複実行に備えて、Todoist write API は request id を付ける方針を採る

## Operational Considerations

- ログ出力方針: command 種別、認可結果、Todoist API 成否、trace ID だけを残す
- 監視対象: Webhook 200 率、署名不正件数、Todoist API 失敗率
- アラート方針: MVP では人手確認。将来 AWS 移行時に追加
- デプロイ方針: ローカル常駐プロセス + HTTPS 公開経路
- ロールバック方針: コードを前版に戻し、Webhook URL を安定 endpoint のまま維持する

リッチメニュー運用では、LINE Official Account Manager で作るか Messaging API で作るかを混在させない。
理由は、LINE 公式で同一リッチメニューを両方のツールから編集できないとされているからだよ。

## Change Management

- 設計変更が発生したら、関連する `BUG-*` または `Q-*` の ID を改訂履歴へ残す
- 変更理由が暫定対応か恒久対応かを区別して書く
- 技術選定変更時は `docs/TECH-STACK.md` と一緒に更新する

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | 初期テンプレート作成 | - |
| 2026-04-11 | 0.2 | 課題管理と設計改訂の連動ルールを追加 | - |
| 2026-04-12 | 0.3 | LINE Webhook と Todoist section 連携の想定構成を追加 | Q-COM-002, Q-COM-003, Q-COM-004 |
| 2026-04-14 | 0.4 | デフォルトのリッチメニューを既存テキストコマンドへつなぐ方針を追加 | - |
| 2026-04-15 | 0.5 | 会話 state に応じて per-user rich menu を切り替える構成を追加 | Q-APP-004 |
| 2026-04-15 | 0.6 | 操作選択の次に section を選ぶ rich menu 導線へ更新 | Q-APP-004 |
| 2026-04-16 | 0.7 | rich menu 適用時に section 名と section ID を env から組み立てる方針を追加 | Q-APP-003 |
