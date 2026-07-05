# 03. データベース設計

実装は [`prisma/schema.prisma`](../prisma/schema.prisma) を正とする。ここでは意図を説明する。

## 1. ER図

```mermaid
erDiagram
    User ||--o| CoachProfile : "1:1"
    User ||--o{ Article : "投稿"
    User ||--o{ TrainingPlan : "生成・保存"
    User ||--o{ Like : ""
    User ||--o{ Comment : ""
    User ||--o{ Follow : "follower"
    User ||--o{ AiUsage : ""
    Article ||--o{ Like : ""
    Article ||--o{ Comment : ""
    Article }o--o{ Tag : "ArticleTag"
    TrainingPlan |o--o| Article : "記事化"

    User {
        uuid id PK "Supabase Auth と同一ID"
        string username UK
        string displayName
        string avatarUrl
        datetime createdAt
    }
    CoachProfile {
        uuid userId PK_FK
        enum category "少年団/クラブ/部活/スクール/プロ"
        string ageGroups "U-6〜社会人(複数)"
        string license "JFA D級 など"
        int experienceYears
        text bio
    }
    Article {
        uuid id PK
        uuid authorId FK
        string slug UK
        string title
        text bodyMd "Markdown本文"
        enum status "DRAFT/PUBLISHED"
        int likesCount "非正規化カウント"
        datetime publishedAt
    }
    TrainingPlan {
        uuid id PK
        uuid userId FK
        string title
        json conditions "生成条件(年代/人数/時間/テーマ)"
        text bodyMd "指導案本文(Markdown)"
        uuid articleId FK "記事化した場合"
    }
    Tag {
        uuid id PK
        string name UK
    }
    Like {
        uuid userId PK_FK
        uuid articleId PK_FK
    }
    Comment {
        uuid id PK
        uuid articleId FK
        uuid authorId FK
        text body
    }
    Follow {
        uuid followerId PK_FK
        uuid followeeId PK_FK
    }
    AiUsage {
        uuid id PK
        uuid userId FK
        date usedOn "日次レート制限用"
        int count
    }
```

## 2. 設計上の判断

| 判断 | 理由 |
|---|---|
| `User.id` = Supabase Auth の `auth.users.id` | 認証とアプリデータをJOINしやすくする定石 |
| `CoachProfile` を分離 | 「指導者のみ」の要件。プロフィール完了で書き込み権限を付与する判定に使う |
| 記事本文は `bodyMd`(Markdown)で保持 | Zenn/Qiita方式。レンダリングは表示時。編集も差分もシンプル |
| `likesCount` を非正規化 | フィードで毎回COUNTしない。Like作成/削除時にトランザクションで増減 |
| `TrainingPlan.conditions` は JSON | 生成条件のスキーマは今後変わりやすい。柔軟に持つ |
| `TrainingPlan.articleId` | AI指導案 → 記事化の導線(コア体験)を1カラムで表現 |
| `AiUsage(userId, usedOn)` にユニーク制約 | 「1ユーザー1日1行」でカウンタをUPSERTする |
| タグは中間テーブル `ArticleTag` | 多対多の標準形。タグ別一覧・人気タグ集計に使う |

## 3. インデックス方針

- `Article(status, publishedAt desc)` — 新着フィード
- `Article(authorId)` — ユーザーページ
- `ArticleTag(tagId)` — タグ別一覧
- `TrainingPlan(userId, createdAt desc)` — マイ指導案一覧
- 全文検索はフェーズ2で `bodyMd` に pg_trgm / tsvector を追加

## 4. RLS(Row Level Security)方針

| テーブル | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| Article(PUBLISHED) | 全員 | 著者のみ |
| Article(DRAFT) | 著者のみ | 著者のみ |
| TrainingPlan | 本人のみ | 本人のみ |
| CoachProfile | 全員(公開プロフィール) | 本人のみ |
| Like / Comment / Follow | 全員 | 本人のみ作成・削除 |
