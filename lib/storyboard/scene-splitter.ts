import type { SemanticScene } from "../renderer/semantic-scenes";

export type StoryboardScene = {
  id: number;

  narration: string;

  sceneType:
    | "hook"
    | "introduction"
    | "explanation"
    | "call_to_action"
    | "general";

  subject: string;

  action: string;

  location: string;

  keywords: readonly string[];
};

function detectSceneType(text: string): StoryboardScene["sceneType"] {
  const t = text.toLowerCase();

  if (
    t.includes("did you know") ||
    t.includes("imagine") ||
    t.includes("hook")
  ) {
    return "hook";
  }

  if (
    t.includes("today") ||
    t.includes("welcome") ||
    t.includes("exploring")
  ) {
    return "introduction";
  }

  if (
    t.includes("because") ||
    t.includes("important") ||
    t.includes("experts")
  ) {
    return "explanation";
  }

  if (
    t.includes("follow") ||
    t.includes("subscribe") ||
    t.includes("comment") ||
    t.includes("like")
  ) {
    return "call_to_action";
  }

  return "general";
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          "this",
          "that",
          "with",
          "from",
          "your",
          "have",
          "will",
          "they",
          "them",
          "their",
          "about",
          "because",
          "today",
        ].includes(w)
    );
}

function inferSubject(
  text: string,
  keywords: string[]
): string {
  const t = text.toLowerCase();

  if (t.includes("developer")) return "software developer";

  if (t.includes("ai")) return "artificial intelligence";

  if (t.includes("robot")) return "robot";

  if (t.includes("business")) return "business professional";

  if (keywords.length > 0) return keywords[0];

  return "main subject";
}

function inferAction(text: string): string {
  const t = text.toLowerCase();

  if (t.includes("using")) return "using technology";

  if (t.includes("creating")) return "creating";

  if (t.includes("building")) return "building";

  if (t.includes("explaining")) return "explaining";

  if (t.includes("working")) return "working";

  return "performing the described action";
}

function inferLocation(text: string): string {
  const t = text.toLowerCase();

  if (
    t.includes("office") ||
    t.includes("developer")
  )
    return "modern technology office";

  if (t.includes("factory"))
    return "industrial factory";

  if (t.includes("hospital"))
    return "modern hospital";

  if (t.includes("space"))
    return "outer space";

  if (t.includes("city"))
    return "modern futuristic city";

  return "cinematic environment";
}

export function splitStoryboard(
  scenes: SemanticScene[]
): StoryboardScene[] {
  return scenes.map((scene, index) => {
    const keywords = extractKeywords(scene.text);

    return {
      id: index,

      narration: scene.text,

      sceneType: detectSceneType(scene.text),

      subject: inferSubject(
        scene.text,
        keywords
      ),

      action: inferAction(scene.text),

      location: inferLocation(scene.text),

      keywords,
    };
  });
}