# Simple Vercel Deploy

Vercel にデプロイする GitHub Action。

## 使い方

```
name: CI
on: [pull_request]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: kik4/simple-vercel-deploy@v2.8.0
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 入力

| 名前              | 必須 | デフォルト | 説明                                                                    |
| ----------------- | ---- | ---------- | ----------------------------------------------------------------------- |
| vercel-token      | ✅   |            | Vercel のトークン。                                                     |
| github-token      | ✅   |            | GitHub のトークン。`${{ secrets.GITHUB_TOKEN }}` を指定するだけでよい。 |
| vercel-org-id     | ✅   |            | Vercel の team / personal ID。                                          |
| vercel-project-id | ✅   |            | Vercel の project ID。                                                  |
| is-production     |      | false      | true / false。true の場合は production デプロイ。                       |
