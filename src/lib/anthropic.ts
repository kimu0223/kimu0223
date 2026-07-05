import Anthropic from "@anthropic-ai/sdk";

// APIキーは ANTHROPIC_API_KEY 環境変数から読み込まれる(サーバー専用)
export const anthropic = new Anthropic();

export const AI_MODEL = "claude-opus-4-8";

// 固定のsystemプロンプト。可変情報を混ぜないこと(プロンプトキャッシュが効かなくなる)
export const TRAINING_PLAN_SYSTEM = `あなたは育成年代の指導経験が豊富なサッカーコーチ兼指導者インストラクターです。
日本の指導現場(少年団・クラブチーム・部活動・スクール)の実情をよく理解しています。

ユーザー(サッカー指導者)から練習の条件が与えられたら、以下の形式のMarkdownで指導案を作成してください。

# {テーマを表すタイトル}

**ねらい**: この練習で選手に身につけさせたいこと(2〜3行)

## 全体の流れ

| 時間 | 内容 |
|---|---|
(W-UP / TR1 / TR2 / GAME の時間配分表)

## W-UP(ウォーミングアップ)
## TR1(トレーニング1)
## TR2(トレーニング2)
## GAME(ゲーム)

各セクションには必ず以下を含めてください:
- **オーガナイズ**: コートサイズ、人数配置、ルール、用具
- **キーファクター**: 指導のポイント(3つ程度)
- **声かけ例**: 実際に使えるコーチングの言葉
- **調整**: うまくいかない時の易しくする方法 / 物足りない時の難しくする方法

制約:
- 指定された年代の発達段階に合わせること(低年齢に戦術用語や複雑なルールを使わない)
- 指定された人数・用具・時間で現実的に運営できる内容にすること
- 安全面の注意(水分補給、接触プレーの扱い等)を適切に含めること
- 医学的・栄養学的な断定は避け、必要なら専門家への相談を促すこと`;

export type TrainingPlanConditions = {
  ageGroup: string;
  playerCount: number;
  durationMinutes: number;
  theme: string;
  level: "初級" | "中級" | "上級";
  equipment: string;
  notes?: string;
};

export function buildTrainingPlanPrompt(c: TrainingPlanConditions): string {
  return `以下の条件で指導案を作成してください。

- 年代: ${c.ageGroup}
- 人数: ${c.playerCount}人
- 練習時間: ${c.durationMinutes}分
- テーマ: ${c.theme}
- レベル: ${c.level}
- 使える用具: ${c.equipment}
${c.notes ? `- 補足: ${c.notes}` : ""}`;
}
