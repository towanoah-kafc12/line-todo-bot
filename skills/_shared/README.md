# Skills Conventions

## Naming

- skill 名は作業ベースで付ける
- 1 skill 1責務を基本とする
- 実装対象ではなく、再利用したい作業単位で切る

## Writing Rules

- 概要、利用場面、手順、チェックリストを含める
- `AGENTS.md` の原則を上書きしない
- 長い参考情報は別ファイルへ切り出す
- 未確定事項の扱いと、更新すべき tracking / docs を明記する
- 追加または更新した skill は `docs/SKILLS.md` に必ず登録する
- 追加または更新した skill は `skills/INDEX.md` に必ず登録する
- 追加または更新した skill は `AGENTS.md` の Skills 節も必ず更新する
- 新しい skill を作るときは、repo 同梱の `skills/skill-creator/` を使う前提で進める

## Good Examples

- `project-bootstrap`
- `aws-infra-change`
- `app-feature`
- `incident-investigation`

## Avoid

- 細かすぎるサービス単位の乱立
- 再利用しづらい個別案件専用の手順

## Registration

- repo 標準 skill は `skills/` 配下に同梱し、由来がある場合は配布元を分かるようにする
- project skill は `skills/` 配下に作成し、`skills/INDEX.md`、`AGENTS.md`、`docs/SKILLS.md` の3か所から辿れるようにする
