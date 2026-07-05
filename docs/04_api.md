# 04. API設計

Next.js Route Handlers(`src/app/api/`)。認証は Supabase セッション(Cookie)をサーバー側で検証する。

## 1. エンドポイント一覧

### AI

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| POST | `/api/ai/training-plan` | 指導案生成(**ストリーミング応答**) | 必須 + プロフィール完了 |
| POST | `/api/ai/chat` | 指導相談チャット(ストリーミング、履歴付き) | 必須 + プロフィール完了 |

### 指導案

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/training-plans` | 自分の保存済み指導案一覧 |
| POST | `/api/training-plans` | 指導案を保存 |
| PATCH | `/api/training-plans/:id` | 編集 |
| DELETE | `/api/training-plans/:id` | 削除 |
| POST | `/api/training-plans/:id/publish` | 記事として公開(Article作成 + 紐付け) |

### 記事

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/articles?tag=&sort=&cursor=` | フィード(新着/タグ絞り込み、カーソルページネーション) |
| POST | `/api/articles` | 記事作成(下書き) |
| GET | `/api/articles/:slug` | 記事詳細(※表示は基本RSCで直接DB参照) |
| PATCH | `/api/articles/:id` | 更新・公開切替 |
| DELETE | `/api/articles/:id` | 削除 |
| PUT | `/api/articles/:id/like` | いいね(冪等) |
| DELETE | `/api/articles/:id/like` | いいね解除 |

### ユーザー

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/users/:username` | 公開プロフィール + 投稿一覧 |
| PATCH | `/api/me/profile` | 指導者プロフィール更新 |

## 2. AI生成リクエスト仕様

`POST /api/ai/training-plan`

```jsonc
// Request
{
  "ageGroup": "U-10",          // U-6 | U-8 | ... | 高校 | 社会人
  "playerCount": 12,
  "durationMinutes": 90,
  "theme": "パス&コントロール",
  "level": "初級",              // 初級 | 中級 | 上級
  "equipment": "ボール、マーカー、ビブス、ゴール2台",
  "notes": "1stタッチが大きい選手が多い"  // 任意
}
```

```
// Response: text/event-stream 相当のストリーミング(Markdownテキスト)
HTTP 200 (ReadableStream)
```

エラー:

| ステータス | 条件 |
|---|---|
| 401 | 未ログイン |
| 403 | 指導者プロフィール未完了 |
| 429 | 日次生成上限(無料: 5回/日)超過。`Retry-After` 付き |
| 400 | バリデーションエラー(zod) |

## 3. 共通仕様

- レスポンスは `{ data, error }` 形式(ストリーミング以外)
- ページネーションはカーソル方式: `?cursor=<lastId>&limit=20`
- 書き込み系はすべて認証必須。`Article` の書き込みは加えて `CoachProfile` 完了が条件
- レート制限: AI系はDBカウンタ、その他はVercelのミドルウェアで簡易制限
