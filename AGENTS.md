# AGENTS.md

## Purpose

このリポジトリは、AWS インフラ開発とアプリケーション開発を AI と人間が協調して進めるためのテンプレートだ。
変更では、安全性、再現性、レビューしやすさを優先すること。
特に、PJ 初期の方向性決定、実装中の課題管理、設計変更の追跡が分断されないことを重視する。

## Read Order

作業開始時は次の順で確認すること。

1. `README.MD`
2. `docs/BOOTSTRAP.md`
3. `docs/TECH-STACK.md`
4. `docs/DELIVERY.md`
5. `docs/SKILLS.md`
6. `skills/INDEX.md`
7. `docs/PROJECT.md`
8. `docs/ARCHITECTURE.md`
9. `docs/TASKS.md`

変更対象に応じて `docs/tracking/` と関連する `skills/` も確認すること。

## Working Rules

- 変更前に対象範囲と方針を短く整理する
- 未確定事項が残るなら、推測で埋めず `docs/tracking/*/QUESTIONS.md` に記録する
- 不要な大規模リファクタや無関係な整形はしない
- 既存の命名規則と責務分離を尊重する
- 依存関係の追加は最小限にする
- 破壊的変更は明示する
- 指示がない限り、構造全体を作り直さない
- 不具合を直したら、必要に応じて設計書と課題管理を同時に更新する
- 同じ種類の作業説明や手順が繰り返されるなら、Skill 化候補として扱う
- Skill を新規作成または更新するときは、repo 標準搭載の `skills/skill-creator/SKILL.md` を使う前提で進める
- Skill を新規作成、更新、廃止するときは `AGENTS.md` の Skills 節も同じ変更で更新する

## Validation Rules

- コード変更時は `./scripts/lint.sh` と `./scripts/test.sh` を基準に関連確認を行う
- インフラ変更時は差分確認と、定義された lint / validate / plan を行う
- デプロイは別フェーズとして扱い、明示要求があるときだけ `./scripts/deploy.sh` を使う
- 失敗した検証は原因と再現条件を記録する
- 技術未確定で実行できない確認は、想定コマンドを `docs/TECH-STACK.md` に残す

## Documentation Rules

- PJ 開始時の要件整理は `docs/BOOTSTRAP.md` に残す
- 技術選定と検証入口は `docs/TECH-STACK.md` を更新する
- AI の完了条件が変わったら `docs/DELIVERY.md` を更新する
- Skill の追加、更新、廃止があったら `docs/SKILLS.md` と `skills/INDEX.md` を更新する
- 仕様変更時は `docs/PROJECT.md` を更新する
- 構成変更時は `docs/ARCHITECTURE.md` を更新する
- タスク状況が変わったら `docs/TASKS.md` を更新する
- 設計書を更新したら、各ドキュメントの改訂履歴に日付、要約、関連 ID を残す
- 不具合は `BUGS.md`、不明点は `QUESTIONS.md` に分けて管理する

## Skills

作業に入る前に `skills/INDEX.md` で対応 skill を確認すること。

以下の作業では対応する skill を参照すること。

### Standard System Skills

### Standard Bundled Skills

- Skill 作成 / 更新: `skills/skill-creator/SKILL.md`

### Project Skills

- PJ 初期ビルド: `skills/project-bootstrap/SKILL.md`
- AWS インフラ変更: `skills/aws-infra-change/SKILL.md`
- アプリ機能追加: `skills/app-feature/SKILL.md`
- 障害調査: `skills/incident-investigation/SKILL.md`

## Guardrails

- 秘密情報を新規に埋め込まない
- 本番影響がある変更は慎重に扱う
- 説明できる変更だけを行う
- 常設ルールと一時的なタスクを同じ場所に混ぜない
- 課題管理の ID と設計改訂の関連を切らない
