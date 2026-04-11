# Project Name

## Overview

このリポジトリは、AI 駆動で AWS インフラ開発とアプリケーション開発を進めるためのテンプレートだ。
骨組みだけで終わらせず、PJ 開始時に方向性を決めてテンプレートから実プロジェクトへ育てるフェーズまで含めている。

## Goal

- AI エージェントが迷わず作業を始められる状態を作る
- PJ の方向性、技術、完了条件を最初に固める導線を持たせる
- 不具合、不明点、設計変更の関係を追える状態を保つ
- 人間が見ても構造と運用ルールがすぐ分かる状態を保つ

## Project Build Flow

最初の流れは次の順を想定している。

1. `docs/BOOTSTRAP.md` でゴール、スコープ、未確定事項を整理する
2. `docs/TECH-STACK.md` で技術選定と検証方法を決める
3. `docs/DELIVERY.md` で AI の完了条件と停止条件を明確にする
4. 未確定事項は `docs/tracking/common/QUESTIONS.md` に記録する
5. 実装や設計変更が入ったら `docs/PROJECT.md` と `docs/ARCHITECTURE.md` の改訂履歴を更新する

全部を最初から完璧に決めなくてもよくて、足りない部分は「仮説」か「未確定」として管理する前提だ。

## Quick Start

```bash
./scripts/project-build.sh
./scripts/bootstrap.sh
./scripts/lint.sh
./scripts/test.sh
```

## Directory

- `AGENTS.md`: エージェント向けの常設ルール
- `docs/BOOTSTRAP.md`: PJ 方向性を決める初期ビルドフェーズ
- `docs/TECH-STACK.md`: 技術選定と検証方針
- `docs/DELIVERY.md`: AI の作業完了条件と停止条件
- `docs/SKILLS.md`: 標準 skill と project skill の一覧、追加ルール
- `docs/PROJECT.md`: 目的、スコープ、成功条件
- `docs/ARCHITECTURE.md`: 構成、責務、運用観点
- `docs/TASKS.md`: 直近タスクの管理
- `docs/tracking/`: 不具合と不明点の一覧管理
- `skills/`: 長い手順や専門知識の置き場
- `skills/INDEX.md`: 作業と skill の対応をすぐ引くための索引
- `skills/skill-creator/`: repo 標準搭載の Skill 作成用 skill
- `infra/`: インフラコードの置き場
- `app/`: アプリケーションコードの置き場
- `scripts/`: セットアップや検証などの実行入口

## Notes

このテンプレートは、実装そのものより運用の型を先に作る設計だ。
技術が確定したら、`scripts/` の中身と `docs/TECH-STACK.md` の検証定義を一致させていく。
定型作業が見えてきたら、repo に同梱した `skill-creator` を使って Skill 化し、`docs/SKILLS.md` に登録する前提にしている。
そのときは `skills/INDEX.md` と `AGENTS.md` も同じ変更で更新する。
