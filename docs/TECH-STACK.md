# TECH-STACK

## Purpose

このドキュメントは、使う技術と、その技術に対して AI が何を検証してから完了扱いにするかを管理する。
未確定の技術は仮説として残してよく、決まっていないこと自体を見える化する。

## Current Status

- App Stack: TBD
- Infra Stack: TBD
- CI/CD: TBD
- Deployment Target: TBD

## Decision Table

| Area | Decision | Status | Rationale | Validation Entry Point |
| --- | --- | --- | --- | --- |
| App | TBD | Proposed | 未確定 | `./scripts/lint.sh`, `./scripts/test.sh` |
| Infra | TBD | Proposed | 未確定 | `./scripts/lint.sh` |
| CI/CD | TBD | Proposed | 未確定 | `./scripts/test.sh` |
| Deploy | TBD | Proposed | 未確定 | `./scripts/deploy.sh` |

`Status` は `Proposed`, `Trial`, `Adopted`, `Rejected` を使う。

## Validation Mapping

### App

- lint: コード規約と静的検査
- test: 単体テストまたは統合テスト
- build: 必要ならビルド確認

### Infra

- lint: 例として `cfn-lint` や IaC 固有の linter
- validate: テンプレートや構文の妥当性確認
- plan: 差分確認

## Open Questions

技術未確定の論点は、ここに書きっぱなしにせず `docs/tracking/common/QUESTIONS.md` に ID 付きで記録する。

## Revision History

| Date | Version | Summary | Related IDs |
| --- | --- | --- | --- |
| 2026-04-11 | 0.1 | 技術選定と検証入口の管理テンプレートを追加 | - |
