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
        uses: kik4/simple-vercel-deploy@v2.9.1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 入力

| 名前               | 必須 | デフォルト | 説明                                                                                                                                                  |
| ------------------ | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| vercel-token       | ✅   |            | Vercel のトークン。                                                                                                                                   |
| github-token       | ✅   |            | GitHub のトークン。`${{ secrets.GITHUB_TOKEN }}` を指定するだけでよい。                                                                               |
| vercel-org-id      | ✅   |            | Vercel の team / personal ID。                                                                                                                        |
| vercel-project-id  | ✅   |            | Vercel の project ID。                                                                                                                                |
| is-production      |      | false      | true の場合は production デプロイ。                                                                                                                   |
| github-comment     |      | true       | false の場合はデプロイ完了時に GitHub にコメントを付けない。                                                                                          |
| uses-rest-api      |      | false      | true の場合はデプロイに Vercel REST API を使用。（この際はデプロイ完了を待たない。また、Vercel のリリース処理になるたりコメントはオフにはできない。） |
| no-wait-deployment |      | false      | true の場合はデプロイ完了を待たない。コメントを付けない。REST では無効。                                                                              |
