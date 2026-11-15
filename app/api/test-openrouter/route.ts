import { NextResponse } from "next/server";
import OpenAI from "openai";
import { authorizeDevelopmentDiagnostic } from "@/lib/diagnostics";

export async function GET() {
  const accessResponse = await authorizeDevelopmentDiagnostic();

  if (accessResponse) {
    return accessResponse;
  }

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
  } catch (error) {
    console.error("OpenRouter diagnostic failed:", error);

    return NextResponse.json(
      { error: "OpenRouter diagnostic failed" },
      { status: 500 }
    );
  }
}
