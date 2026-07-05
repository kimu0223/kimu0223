# ⚽ PitchNote

**サッカー指導者のためのプラットフォーム**

AIが指導案(練習メニュー)づくりを手伝い、現場で得た知見は Zenn/Qiita のように記事として共有する。指導者専用のコミュニティ。

> 「練習を考える時間」を減らし、「選手と向き合う時間」を増やす。

## 主な機能

| 機能 | 説明 |
|---|---|
| 🤖 **AI指導案アシスタント** | 年代・人数・時間・テーマを入力すると、W-UP → TR1 → TR2 → GAME 構成の指導案をAI(Claude)が提案。チャットで修正相談も可能 |
| ✍️ **知見共有ブログ** | Markdownで記事を執筆・公開。タグ・いいね・フィード(Zenn/Qiitaライク) |
| 🔁 **指導案 → 記事化** | AIと作った指導案を、実践の振り返りと合わせてそのまま記事として公開できる |
| 🎓 **指導者プロフィール** | 指導カテゴリ・担当年代・ライセンスを登録。誰の知見かが一目で分かる |

## 設計ドキュメント

| ドキュメント | 内容 |
|---|---|
| [01_requirements.md](docs/01_requirements.md) | 要件定義(ペルソナ / 機能 / MVPスコープ) |
| [02_architecture.md](docs/02_architecture.md) | システム構成 / 技術スタック / ディレクトリ構成 |
| [03_database.md](docs/03_database.md) | DB設計(ER図 / RLS方針) |
| [04_api.md](docs/04_api.md) | API設計 |
| [05_screens.md](docs/05_screens.md) | 画面設計・遷移図 |
| [06_ai_design.md](docs/06_ai_design.md) | AI機能設計(プロンプト / コスト / レート制限) |
| [07_roadmap.md](docs/07_roadmap.md) | 開発ロードマップ |

## 技術スタック

- **Next.js 15** (App Router) + TypeScript + React 19
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL / Auth / Storage) + **Prisma**
- **Claude API** (`claude-opus-4-8`, ストリーミング + adaptive thinking)
- **Vercel** (ホスティング)

## セットアップ

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数の設定
cp .env.example .env
# .env に Supabase / Anthropic のキーを記入

# 3. DBマイグレーション
npx prisma migrate dev

# 4. 開発サーバー起動
npm run dev
```

http://localhost:3000 で起動します。

## 現在の状態

設計フェーズ完了 + 雛形実装済み:

- ✅ 設計ドキュメント一式(`docs/`)
- ✅ DBスキーマ(`prisma/schema.prisma`)
- ✅ AI指導案生成API の雛形(`src/app/api/ai/training-plan/route.ts`)
- ✅ AIプロンプト設計(`src/lib/anthropic.ts`)
- ⬜ 認証・プロフィール(フェーズ1a)
- ⬜ AI生成UI(フェーズ1b)
- ⬜ 記事エディタ・フィード(フェーズ1c)

詳細は [ロードマップ](docs/07_roadmap.md) を参照。
