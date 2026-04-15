# Test Plan

## Purpose

このドキュメントは、MVP を「動いた気がする」で終わらせないための確認項目を定義する。
特に、番号付き一覧と権限周りは事故りやすいので先に固定する。

## Test Levels

### Unit Test

- command parser が `みる` `追加` `完了` `削除` `編集` を正しく解釈する
- 不正入力で適切なエラーを返す
- env validator が必須値不足を検知する
- authorization が allowlist を正しく判定する
- list state resolver が番号から task ID を正しく引ける

### Integration Test

- Webhook handler が署名検証を通した request だけを処理する
- `source.userId` による認可が効く
- Todoist client を mock して `みる` `追加` `完了` `削除` `編集` の handler 分岐を確認する
- Todoist API 失敗時に短く具体的なエラーへ変換できる

### Manual Test

- 実 LINE account から `みる` で section ごとの一覧取得ができる
- `追加` で Todoist 対象 section を選んで task が追加される
- `完了` が正しい task にだけ作用する
- `削除` が正しい task にだけ作用する
- `編集` が正しい task にだけ作用する
- 許可外 userId が拒否される
- 環境変数不足で安全に起動失敗する

## Test Matrix

| ID | Case | Type | Expected Result |
| --- | --- | --- | --- |
| TP-001 | `みる` | Unit / Integration / Manual | 対象 section 群の未完了 task が番号付きで返る |
| TP-002 | `追加する` -> section 選択 -> タイトル送信 | Integration / Manual | task が選んだ section に追加され成功文が返る |
| TP-003 | `追加 {内容}` | Unit / Integration | 複数 section 時は `追加ボタンからセクションを選んでね` が返る |
| TP-004 | `完了 2` | Unit / Integration / Manual | 対応 task が close される |
| TP-005 | `削除 2` | Unit / Integration / Manual | 対応 task が delete される |
| TP-006 | `編集 2 牛乳` | Unit / Integration / Manual | 対応 task の content が更新される |
| TP-007 | `完了 x` | Unit / Integration | 番号エラーが返る |
| TP-008 | state 未作成で `完了 1` | Integration / Manual | 番号未解決エラーが返る |
| TP-009 | allowlist 外 userId | Integration / Manual | `この操作は許可されていないよ` を返すか処理しない |
| TP-010 | 署名不正 | Integration | 400 か 401 系で終了し Todoist を呼ばない |
| TP-011 | 必須 env 欠落 | Unit / Manual | 起動時に失敗し、どの env が不足か分かる |

## Acceptance Criteria

- 5 つの基本コマンドがテストでカバーされている
- 認可と署名検証の失敗系がテストされている
- 手順書どおりにローカル再現できる
- 既知の未確定事項は `QUESTIONS.md` に逃がしてあり、隠れた仮定が残っていない

## Risks To Watch

- メモリ state の TTL が短すぎると UX が悪化する
- TTL が長すぎると番号ずれリスクが上がる
- Todoist API の一時失敗を user error と混同すると切り分けしにくい

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-12 | 0.1 | 初版作成 | Q-COM-002, Q-COM-003 |
