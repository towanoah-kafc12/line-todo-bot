# App Questions

## Entries

| ID | Title | Status | Needed By | Decision Driver | Related Docs | Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| Q-APP-001 | アプリの種類が未確定 | Open | app 雛形作成前 | ディレクトリとテスト方針を決めるため | `docs/PROJECT.md`, `docs/TECH-STACK.md` | 未決 |
| Q-APP-002 | 共有運用向けに Todoist project を切り替え可能にするか | Open | 複数共有面を扱う機能に着手する前 | project 固定の前提を崩すと env、認可、UI 文言、誤操作リスクが変わるため | `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/TASKS.md` | 将来候補。共有用 project へ切り替える案がある |
| Q-APP-003 | 複数 section を 2 から 4 個まで扱うか | Open | リッチメニュー拡張と状態管理の実装前 | command 設計、表示形式、state の持ち方、誤操作防止策が変わるため | `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/TASKS.md` | 将来候補。section 数は 2 から 4 個を仮説とする |
| Q-APP-004 | リッチメニューから section ごとの表示、追加、削除、編集をどう出し分けるか | Open | 高機能リッチメニュー設計前 | action 数の制限、操作導線、誤タップ率、実装複雑度のバランスを決める必要があるため | `docs/ARCHITECTURE.md`, `docs/TASKS.md` | 将来候補。section 切替と CRUD 導線をメニューから提供したい |
| Q-APP-005 | リッチメニューの情報設計とビジュアル品質をどこまで作り込むか | Open | リッチメニュー画像と導線を再設計する前 | UI 資産の作成コストと日常利用時の分かりやすさがトレードオフになるため | `docs/TASKS.md` | 将来候補。操作頻度に合わせたメニュー再設計を検討する |
| Q-APP-006 | Bot の出力文面と一覧表現をどこまで改善するか | Open | 応答文生成ロジックを拡張する前 | section 切替時の文脈表示、一覧可読性、成功失敗メッセージの統一方針が必要になるため | `docs/ARCHITECTURE.md`, `docs/TASKS.md` | 将来候補。出力の見やすさと案内文の品質向上を検討する |
