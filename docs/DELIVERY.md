# DELIVERY

## Purpose

このドキュメントは、AI がどこまで自律的に進めてよいか、どの時点で完了扱いにするかを定義する。
デプロイは実装と検証の後段に分け、明示されない限り自動では進めない。

## Default Rule

AI は、対象範囲が明確で、必要な技術と検証方法が定義されている限り、完了条件を満たすところまで自律的に進める。
不明点が完了条件や安全性に影響するなら、実装を止めて `QUESTIONS.md` に記録する。

## Done Definition by Work Type

| Work Type | Done Definition | Out of Scope by Default |
| --- | --- | --- |
| App Change | 実装、関連 docs 更新、lint/test 実行、結果記録まで | 本番デプロイ |
| Infra Change | IaC 修正、関連 docs 更新、lint/validate/plan まで | 本番反映 |
| Incident Investigation | 再現条件、仮説、切り分け結果、暫定 / 恒久対応案の記録まで | 恒久対応の自動実装 |
| Project Build | Goal、Scope、Tech 候補、未確定事項、停止条件の定義まで | 詳細実装 |

## Stop Conditions

次のどれかに当てはまるときは、いったん停止して確認する。

- 本番影響のある操作が必要
- 未確定事項が安全性や完了条件に直接影響する
- 技術選定が未確定で検証方法を定義できない
- 依存追加や構成変更の影響範囲が大きい

## Tracking Rules

- 実装中の不具合は `BUGS.md` に記録する
- 仕様や方針の不明点は `QUESTIONS.md` に記録する
- 設計変更が入ったら、関連 ID を `PROJECT.md` または `ARCHITECTURE.md` の改訂履歴へ残す

## Git Rules

- AI は、意味のある作業単位が閉じたらコミットまで進める
- 1 つのコミットには、原則として 1 つの目的だけを入れる
- 実装コミットには、関連する docs 更新と検証結果を含める
- リモート共有や端末切替で作業継続性が必要な節目では push まで行う
- 一時ログや生成物はコミット対象に含めない
- 途中状態でも、切り戻しやレビューに価値があるなら保存コミットを許容する
- コミット前には、何を保存するかを `git status` で確認する
- push は、認証や保護ルールで止まらない限りコミット直後に実施する

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | AI の完了条件と停止条件のテンプレートを追加 | - |
| 2026-04-15 | 0.2 | Git のコミット / push 基準を追加 | - |
