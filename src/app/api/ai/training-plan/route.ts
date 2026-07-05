import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import {
  anthropic,
  AI_MODEL,
  TRAINING_PLAN_SYSTEM,
  buildTrainingPlanPrompt,
} from "@/lib/anthropic";

// TODO(フェーズ1): Supabaseセッション検証 + AiUsage による日次レート制限を追加する

const conditionsSchema = z.object({
  ageGroup: z.string().min(1),
  playerCount: z.number().int().min(2).max(60),
  durationMinutes: z.number().int().min(15).max(240),
  theme: z.string().min(1).max(100),
  level: z.enum(["初級", "中級", "上級"]),
  equipment: z.string().min(1).max(300),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const parsed = conditionsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "入力内容を確認してください", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const stream = anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: TRAINING_PLAN_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildTrainingPlanPrompt(parsed.data) }],
    });

    return new Response(stream.toReadableStream(), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "AIが混み合っています。しばらくしてから再試行してください" },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return Response.json({ error: "接続エラーが発生しました" }, { status: 502 });
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: "生成に失敗しました" }, { status: 502 });
    }
    throw error;
  }
}
