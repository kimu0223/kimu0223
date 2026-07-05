# 06. AI機能設計 — Claude API

## 1. 方針

| 項目 | 決定 | 理由 |
|---|---|---|
| モデル | `claude-opus-4-8` | 指導案の質がプロダクトの価値そのもの。最も賢いモデルを使う |
| thinking | `{ type: "adaptive" }` | 練習メニューの構成は多段の検討が必要。モデルに思考量を委ねる |
| 応答方式 | ストリーミング(`messages.stream`) | 生成に数十秒かかるため、リアルタイム表示で体感を担保 |
| 実行場所 | サーバー(Route Handler)のみ | APIキー保護。クライアントには `ReadableStream` を中継 |
| コスト制御 | プロンプトキャッシュ + 日次レート制限 | system プロンプトが長いためキャッシュ効果が大きい |

## 2. ユースケースとプロンプト設計

### 2.1 指導案生成(フォーム → Markdown)

**system プロンプト(要旨)** — `src/lib/anthropic.ts` に実装:

- 役割: 育成年代の指導経験が豊富なサッカーコーチ兼インストラクター
- 出力形式: Markdown固定
  - `# タイトル` / ねらい / 全体の流れ(時間配分表)
  - `## W-UP` `## TR1` `## TR2` `## GAME` の4部構成
  - 各セクション: オーガナイズ(コートサイズ・人数・ルール)/ キーファクター / 指導者の声かけ例 / うまくいかない時の調整(易化・難化)
- 制約: 指定年代の発達段階に合った内容(例: U-8に戦術用語を使わない)、安全上の注意を含める
- system は**固定文字列**にして `cache_control: { type: "ephemeral" }` を付与(プロンプトキャッシュ)。可変条件はすべて user メッセージ側に入れる

**user メッセージ**: フォーム入力をテンプレートに整形して渡す

### 2.2 指導相談チャット

- 同じ system の軽量版(相談モード)+ 会話履歴を全送信(ステートレス)
- 履歴が長くなったらクライアント側で直近N往復に制限(MVP)

### 2.3 フォローアップ修正

- 「もっと強度を上げて」等は、生成済み指導案を assistant メッセージとして履歴に含めて継続会話にする

## 3. 実装パターン(Route Handler)

```ts
// src/app/api/ai/training-plan/route.ts(実装済みの雛形あり)
import { anthropic, TRAINING_PLAN_SYSTEM, buildTrainingPlanPrompt } from "@/lib/anthropic";

export async function POST(req: Request) {
  // 1) 認証チェック → 2) レート制限チェック → 3) zodバリデーション
  const conditions = await req.json();

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 64000, // ストリーミングなので大きめに確保
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: TRAINING_PLAN_SYSTEM,
        cache_control: { type: "ephemeral" }, // プロンプトキャッシュ
      },
    ],
    messages: [{ role: "user", content: buildTrainingPlanPrompt(conditions) }],
  });

  return new Response(stream.toReadableStream(), {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

クライアント側は `@anthropic-ai/sdk` の `MessageStream.fromReadableStream()` か、素朴に `res.body` を読んで `text_delta` を連結して表示する。

## 4. レート制限設計

```
POST /api/ai/* の先頭で:
1. AiUsage を (userId, today) でUPSERT
2. count >= 上限(無料5回) なら 429 を返す
3. 生成成功時に count++
```

- 上限はENVで設定(`AI_DAILY_LIMIT=5`)。将来の有料プランで引き上げ
- 異常系: Claude API がエラーの場合はカウントをロールバック

## 5. エラーハンドリング

| ケース | 対応 |
|---|---|
| `RateLimitError`(Anthropic側 429) | ユーザーには「混み合っています」+ 自動リトライはSDK任せ(max_retries=2) |
| `APIConnectionError` | 「接続エラー。再試行してください」 |
| `stop_reason: "max_tokens"` | 末尾に注記を出し「続きを生成」ボタンを表示 |
| ストリーム途中切断 | クライアントで部分結果を保持し再生成を促す |

SDKの型付き例外(`Anthropic.RateLimitError` など)を specific → general の順で catch する。

## 6. 品質・安全ガイドライン

- 年代別の負荷・安全配慮(水分補給、接触プレーの扱い)を system に明記
- 医学的・栄養学的な断定を避ける指示(「専門家に相談を」への誘導)
- 生成物には「AIによる提案です。現場の状況に合わせて調整してください」の注記をUI側で常時表示

## 7. コスト試算(概算)

- 1回の生成: 入力 ~2K tokens(大半はキャッシュヒット)+ 出力 ~3K tokens
- `claude-opus-4-8`: $5/1M入力・$25/1M出力 → **1生成 ≒ $0.08前後**、キャッシュヒット時はさらに低下
- 無料枠 5回/日 × MAU 100人 × 20%利用 → 月 ~3,000回 ≒ **$240/月** が上限の目安
