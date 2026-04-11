# SKILLS

## Purpose

このドキュメントは、標準で使う skill と project 固有の skill を一覧化して、どの作業で何を使うかをすぐ分かるようにする。
特に、定型作業が発生したときに Skill 化を見逃さないための基準もここで管理する。
素早く引く一覧は `skills/INDEX.md` を使い、このファイルでは作成条件と運用ルールを管理する。

## Standard Bundled Skills

このリポジトリで標準として扱う skill は、別環境でも再利用できるよう必要に応じて repo に同梱する。
配布元がある skill は、由来が分かるようにしつつ repo 内から参照する。

| Skill | Status | Use When | Notes |
| --- | --- | --- | --- |
| `skill-creator` | Bundled | 定型作業を Skill 化したいとき、既存 Skill を更新したいとき | `skills/skill-creator/` に同梱。配布元は Codex system skill |

## Project Skills

| Skill | Status | Use When | Path |
| --- | --- | --- | --- |
| `project-bootstrap` | Active | PJ の初期方向性、技術候補、未確定事項を整理するとき | `skills/project-bootstrap/SKILL.md` |
| `aws-infra-change` | Active | AWS / IaC の変更を進めるとき | `skills/aws-infra-change/SKILL.md` |
| `app-feature` | Active | アプリ機能を追加または変更するとき | `skills/app-feature/SKILL.md` |
| `incident-investigation` | Active | 不具合や想定外挙動を調査するとき | `skills/incident-investigation/SKILL.md` |

## Skillization Rules

次のどれかに当てはまる作業は、Skill 化候補として扱う。

- 同じ説明や手順を 2 回以上繰り返した
- 4 手順以上の定型フローになっている
- 失敗すると影響が大きく、毎回ガードレールが必要
- 参照ドキュメントや確認観点が毎回ほぼ同じ
- 人間から見ても「この作業は毎回同じだね」と判断できる

## Creation Flow

1. 定型作業を見つけたら、まず Skill 化候補として整理する
2. `skills/skill-creator/` を使って新規 Skill または既存 Skill 更新の方針を作る
3. project 固有なら `skills/` 配下へ追加する
4. `skills/INDEX.md`、`AGENTS.md`、このファイルへ登録する
5. 必要なら関連 docs と tracking を更新する

## Mandatory Updates

Skill を新規作成、更新、廃止するときは、次を同じ変更で更新する。

- `skills/INDEX.md`
- `AGENTS.md`
- 必要に応じてこのファイル
- 関連する `docs/` と `tracking/`

## Non-Goals

- 一度しか使わない作業を何でも Skill 化すること
- 実装対象ごとに細かく Skill を乱立させること
- 配布元との対応関係が分からない形で bundled skill を増やすこと

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | skill 一覧と Skill 化ルールを追加 | - |
| 2026-04-11 | 0.2 | `skills/INDEX.md` と AGENTS 更新必須ルールを追加 | - |
| 2026-04-11 | 0.3 | `skill-creator` を repo 同梱前提に変更 | - |
