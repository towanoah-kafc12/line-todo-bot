# Rich Menu Section Flow Handoff

## Purpose

このメモは、`操作選択 -> section 選択` 型のリッチメニュー導線へ切り替える途中状態を、次の作業者がそのまま引き継げるように残す。

## Goal

- 最初のメニューは `表示する / 追加する / 編集する / 完了する / 削除する`
- 各操作を押したあと、操作ごとの section 選択メニューへ切り替える
- 2 section 前提で `買うもの` と `やること` を固定表示する
- `編集 / 完了 / 削除` は、選んだ section の一覧だけを返し、その番号だけを有効にする

## Files Changed So Far

- `app/src/state/conversation-state.ts`
- `app/src/line/conversation-rich-menu.ts`
- `app/src/commands/handlers.ts`
- `app/src/server/create-app.ts`
- `app/src/todoist/gateway.ts`
- `app/test/conversation-rich-menu.test.ts`
- `app/test/rich-menu-config.test.ts`
- `app/test/webhook.test.ts`
- `assets/line/default-rich-menu.json`
- `assets/line/list-rich-menu.json`
- `assets/line/add-rich-menu.json`
- `assets/line/edit-rich-menu.json`
- `assets/line/complete-rich-menu.json`
- `assets/line/delete-rich-menu.json`
- `scripts/line-rich-menu.mjs`

## What Was Implemented

- 会話 state に `awaiting-list-section` と、各操作の `awaiting-*-section` を追加した
- `edit / complete / delete` の index 系 state に `sectionId` を持たせた
- `showTaskList()` と Todoist gateway に section filter を追加した
- `continueAddConversationWithSection()` など、section 選択後に次段へ進める helper を追加した
- `create-app.ts` で `menu=<operation>:section:<sectionId>` の postback を解釈する処理を追加した
- `menu=list-preview` は、state に `sectionId` があればその section の一覧だけを返すように変えた
- リッチメニュー JSON を section 選択型に差し替えた
- `todo-list` alias 用に `assets/line/list-rich-menu.json` を追加した

## Known Gaps

- まだ lint / test は未実行
- `scripts/generate-rich-menu-images.ps1` は未更新
  理由: JSON の導線は変えたが、PNG の説明文と見た目は旧導線のまま
- docs 本体は未更新
  理由: 途中で中断したので `README.MD`, `docs/ARCHITECTURE.md`, `docs/setup.md`, `docs/TASKS.md`, `docs/tracking/app/QUESTIONS.md` への反映が残っている
- `app/test/webhook.test.ts` は新導線に合わせて大きく書き換えたが、未実行なので型や期待値の取りこぼしが残っている可能性がある
- `assets/line/*.json` は 2 section 固定で書いてある
  理由: 今回は「いったん 2 つ想定」の指示に合わせて固定値で進めたため

## High-Risk Points To Check First

1. `app/src/commands/handlers.ts`
理由: section 選択後の state 遷移を増やしたので、分岐抜けや state の消し忘れがあると会話が壊れる

2. `app/src/server/create-app.ts`
理由: postback data の分岐が増えたので、`menu=list:all` や `menu=list-preview` の扱いに漏れがあると想定外の null 応答になる

3. `app/test/rich-menu-config.test.ts`
理由: 置換で作り直したため、構文ミスや matcher の崩れがあると test 自体が落ちる

4. `assets/line/*.png`
理由: apply すると見た目と実際の action がずれる可能性がある

## Recommended Resume Order

1. `npm run test`
2. `npm run lint`
3. failing test / type error を潰す
4. `scripts/generate-rich-menu-images.ps1` を新導線向けに更新して PNG を再生成する
5. `README.MD`, `docs/ARCHITECTURE.md`, `docs/setup.md`, `docs/TASKS.md`, `docs/tracking/app/QUESTIONS.md` を更新する
6. 必要なら `npm run rich-menu:images` を再実行して assets を揃える

## Expected Behavior After Completion

- main menu の `表示する` を押すと `どのセクションを表示する？` が返り、`todo-list` が表示される
- `買うもの` か `やること` を押すと、その section だけの一覧が返る
- `追加する` を押すと add menu へ移り、section を押すと `◯◯ に追加したいタスク名を送って` が返る
- `編集する / 完了する / 削除する` も同様に section 選択後、その section だけの一覧と番号入力待ちへ進む
- `一覧を見る` は、選択済み section が state に残っていればその section だけを再表示する

## Validation Status

- Code: 未検証
- Tests: 未実行
- Docs: 未更新
- Rich menu images: 未更新
