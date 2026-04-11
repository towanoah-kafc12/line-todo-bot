# Skill Index

## Purpose

このファイルは、どの作業でどの skill を使うかを最短で引くための入口だ。
運用ルールの詳細は `docs/SKILLS.md` を見て、ここでは一覧性を優先する。

## Standard Bundled Skills

| Skill | Use When | Managed In |
| --- | --- | --- |
| `skill-creator` | 定型作業を Skill 化したいとき、既存 Skill を更新したいとき | `skills/skill-creator/` |

## Project Skills

| Skill | Use When | Path |
| --- | --- | --- |
| `project-bootstrap` | PJ の初期方向性、技術候補、未確定事項を整理するとき | `skills/project-bootstrap/SKILL.md` |
| `aws-infra-change` | AWS / IaC の変更を進めるとき | `skills/aws-infra-change/SKILL.md` |
| `app-feature` | アプリ機能を追加または変更するとき | `skills/app-feature/SKILL.md` |
| `incident-investigation` | 不具合や想定外挙動を調査するとき | `skills/incident-investigation/SKILL.md` |

## Skillization Trigger

次のどれかに当てはまるなら、Skill 化候補として扱う。

- 同じ説明や手順を 2 回以上繰り返した
- 4 手順以上の定型フローになっている
- 失敗コストが高く、毎回ガードレールが必要
- 参照ドキュメントや確認観点が毎回ほぼ同じ

## Maintenance Rules

- Skill を新規作成、更新、廃止したら `AGENTS.md` を同じ変更で更新する
- Skill を新規作成、更新、廃止したらこのファイルも同じ変更で更新する
- 詳細ルールは `docs/SKILLS.md` に集約する
