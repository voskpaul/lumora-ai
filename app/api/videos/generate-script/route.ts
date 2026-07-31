import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
try {
const session = await auth();


if (!session?.user?.email) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

const {
  prompt,
  category,
  projectId,
  format,
  voiceType,
} = await req.json();
console.log("VOICE RECEIVED:", voiceType);

if (!prompt?.trim()) {
  return NextResponse.json(
    { error: "Prompt is required" },
    { status: 400 }
  );
}

const user = await prisma.user.findUnique({
  where: {
    email: session.user.email,
  },
});

if (!user) {
  return NextResponse.json(
    { error: "User not found" },
    { status: 404 }
  );
}

const script = generateScriptFromPrompt(
  prompt,
  category
);
console.log("VOICE RECEIVED:", voiceType);

const video = await prisma.video.create({
  data: {
    title: prompt.slice(0, 80),
    prompt,
    script,
    status: "draft",
    format: format || "shorts",
    voiceType:
      voiceType || "en-US-AriaNeural",
    userId: user.id,
    projectId: projectId || null,
  },
});
console.log("VOICE SAVED:", video.voiceType);

return NextResponse.json({
  success: true,
  video,
});


} catch (error: any) {
console.error(
"Generate script error:",
error
);

return NextResponse.json(
  {
    error:
      error.message ||
      "Failed to generate script",
  },
  {
    status: 500,
  }
);

}
}

function generateScriptFromPrompt(
prompt: string,
category: string
) {
return `
Hook:
Did you know that ${prompt}?

Main Content:
Today we're exploring ${prompt}.
This topic is becoming increasingly important in the ${category} space.

Many experts believe it will have a significant impact in the coming years.

Call To Action:
Follow for more AI-generated content and insights.
`.trim();
}
