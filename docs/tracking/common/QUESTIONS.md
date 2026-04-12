# Common Questions

## Entries

| ID | Title | Status | Needed By | Decision Driver | Related Docs | Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| Q-COM-001 | 技術スタックが未確定 | Open | 実装開始前 | app / infra の検証方法を決めるため | `docs/TECH-STACK.md` | Hono + TypeScript + official SDK を仮採用 |
| Q-COM-002 | 番号付き一覧の参照状態をどこまで保持するか | Open | `完了` `削除` `編集` 実装前 | 誤操作防止と永続化要否が変わるため | `docs/requirements.md`, `docs/ARCHITECTURE.md` | 暫定でメモリ保持 + TTL を採用 |
| Q-COM-003 | MVP の利用者 2 名に同じ CRUD 権限を与えてよいか | Open | 認可実装前 | role 設計の要否が変わるため | `docs/requirements.md`, `docs/PROJECT.md` | 暫定で両者とも同権限 |
| Q-COM-004 | ローカル webhook 用の HTTPS 公開手段を何にするか | Open | LINE 疎通確認前 | セットアップ手順と運用負荷が変わるため | `docs/setup.md`, `docs/TECH-STACK.md` | 暫定でトンネル系サービスを利用 |
