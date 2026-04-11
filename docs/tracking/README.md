# Tracking Guide

## Purpose

このディレクトリでは、不具合と不明点を分けて管理する。
repo 全体で 1 ファイルに詰めず、`common`、`app`、`infra` の単位で分割する。

## File Rules

- 不具合は `BUGS.md`
- 不明点は `QUESTIONS.md`
- 解決したら `Status` と `Resolution` を更新する
- 設計変更につながったら、関連する設計書の改訂履歴にも ID を残す

## ID Rules

- Common Bug: `BUG-COM-001`
- App Bug: `BUG-APP-001`
- Infra Bug: `BUG-INF-001`
- Common Question: `Q-COM-001`
- App Question: `Q-APP-001`
- Infra Question: `Q-INF-001`

## Status Rules

`Open`, `In Progress`, `Blocked`, `Resolved`, `Closed` を使う。

## Suggested Unit

管理単位は次のどれかで切ると扱いやすい。

- 機能単位
- AWS リソース群単位
- 調査テーマ単位
