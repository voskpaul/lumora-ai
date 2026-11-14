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
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const response =
      await openai.chat.completions.create({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "user",
            content: "Say hello",
          },
        ],
      });

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
}
