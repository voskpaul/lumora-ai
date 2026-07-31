import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Lumora AI",
  },
});

export async function GET() {
  try {
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
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message,
        details: err,
      },
      {
        status: 500,
      }
    );
  }
}