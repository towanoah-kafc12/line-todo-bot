# AWS Infra Change

## When to Use

- `infra/` 配下を変更するとき
- IAM、Network、Compute、Logging、Monitoring に触るとき

## Steps

1. 変更対象の環境を確認する
2. 関連ドキュメントを確認する
3. 影響範囲を列挙する
4. 差分確認を行う
5. ロールバック可否を確認する
6. 必要なら `docs/ARCHITECTURE.md` を更新する

## Checklist

- [ ] 本番影響の有無を整理した
- [ ] IAM 権限が過剰でない
- [ ] ネットワーク設定変更の意図を説明できる
- [ ] ログと監視の抜けがない
- [ ] 戻し方がある
