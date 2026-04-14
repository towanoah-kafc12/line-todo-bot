# PROJECT

## Goal

LINE Bot を家の共有 TODO の唯一の UI として扱い、Todoist の特定 project / section を正本にしたまま、非 IT 利用者でも迷わず TODO を見て更新できる状態を作る。

## Non-Goals

今回は次を対象外にする。

- 自然言語の自由入力解釈
- 複数 project / section の横断管理
- Push 通知中心の UX
- AWS への本番デプロイ
- 複数世帯や不特定多数向けの一般公開

## Problem Statement

Todoist は管理者には便利でも、同居人にとっては利用ハードルが高い。
そのため、家の TODO が管理者の個人ツールに閉じて、共有運用が続きにくい。
LINE Bot を入口にすれば、同居人は普段の LINE だけで操作できる一方、管理者は Todoist をそのまま使える。
重要なのは、LINE と Todoist が別々の TODO を持つことではなく、同じ section を同じ対象として扱い続けることだ。

## Users

- 管理者: Todoist と LINE の両方を使える。設定と保守を担当する
- 同居人 A: LINE Bot だけを使う。共有 TODO の日常操作を担当する

## Scope

今回やることと、今回やらないことを分けて書く。

### In Scope

- LINE Bot で `みる` `追加 {内容}` `完了 {番号}` `削除 {番号}` `編集 {番号} {新しい内容}` を実行できる
- デフォルトのリッチメニューを使って、個人チャットとグループの両方で主要操作の入口を出せる
- Todoist の特定 project / section の active tasks を一覧取得できる
- LINE の許可 userId だけが Bot を操作できる
- Webhook 署名検証と環境変数検証を行う
- ローカル PC での MVP 動作確認と、必要なセットアップ手順の文書化を行う

### Out of Scope

- LINE の自然言語理解
- 添付ファイル、期限、優先度、ラベル、サブタスクの編集
- Todoist 以外のデータストアを正本にすること
- AWS インフラ構築
- 同居人ごとの細かな権限差分の完成実装

## Success Criteria

- [x] 必須機能が定義されている
- [x] AWS / アプリの責務分離が明確になっている
- [x] 最低限の検証方針が決まっている
- [x] 運用や保守に必要な情報が残っている
- [ ] LINE からの 5 コマンドが対象 section に対して正しく作用する
- [ ] 権限外 userId と署名不正 request を拒否できる
- [ ] セットアップ手順だけで第三者がローカル再現できる

## Milestones

- M1: 要件整理、公式調査、技術選定、未確定事項 tracking が完了している
- M2: ローカルで動く MVP と自動テストが揃っている
- M3: AWS への最小コスト移行方針が比較できている

## Constraints

- 予算: 個人利用前提。MVP 段階では外部有料 SaaS 追加を避ける
- 納期: 未確定。ただし 80/20 で MVP を先行する
- 既存システム制約: Todoist を正本にし、対象 section 以外は操作対象にしない
- 利用可能なサービスやランタイム: Node.js / TypeScript 優先、ローカル PC ホスト優先

## Risks

- 番号付き一覧と後続操作の対応がずれると、誤った task を更新する
- LINE webhook は HTTPS 必須のため、ローカル確認でも公開経路の選定が必要になる
- Todoist API と SDK の仕様変更に追従しないと、手順書と実装がずれる
- トークン漏えいやログ出力ミスがあると個人利用でも被害が大きい

## Related Tracking

- 未確定事項: `docs/tracking/common/QUESTIONS.md`
- 共通不具合: `docs/tracking/common/BUGS.md`

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | 初期テンプレート作成 | - |
| 2026-04-11 | 0.2 | 初期ビルド運用と課題管理連携の前提を追加 | - |
| 2026-04-12 | 0.3 | LINE Todoist 共有 TODO Bot の目的、範囲、成功条件を定義 | Q-COM-002, Q-COM-003, Q-COM-004 |
| 2026-04-14 | 0.4 | デフォルトのリッチメニューを個人チャットとグループで使う方針を追加 | - |
