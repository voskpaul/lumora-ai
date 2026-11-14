import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI is not configured" },
        { status: 503 }
      );
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Lumora AI",
      },
    });

    const completion =
      await openai.chat.completions.create({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "user",
            content: "Say hello",
          },
        ],
      });

    return NextResponse.json(completion);
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "OpenRouter request failed",
      },
      {
        status: 500,
      }
    );
  }
}
