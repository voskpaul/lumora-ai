export type SubtitleStyle = {
  fontSize: number;
  animation: string;
  color: string;
  outline: number;
};

export function styleSubtitle(
  text: string
): SubtitleStyle {

  const t = text.toLowerCase();

  if (
    t.includes("did you know") ||
    t.includes("hook") ||
    t.includes("imagine")
  ) {
    return {
      fontSize: 72,
      animation: "\\t(0,250,\\fscx125\\fscy125)",
      color: "00FFFF",
      outline: 5,
    };
  }

  if (
    t.includes("today") ||
    t.includes("welcome")
  ) {
    return {
      fontSize: 64,
      animation: "\\fad(120,120)",
      color: "FFFFFF",
      outline: 4,
    };
  }

  if (
    t.includes("important") ||
    t.includes("because") ||
    t.includes("experts")
  ) {
    return {
      fontSize: 60,
      animation: "\\t(0,400,\\blur1)",
      color: "FFFFFF",
      outline: 4,
    };
  }

  if (
    t.includes("follow") ||
    t.includes("subscribe") ||
    t.includes("like")
  ) {
    return {
      fontSize: 70,
      animation: "\\t(0,300,\\fscx120\\fscy120)",
      color: "00FF00",
      outline: 5,
    };
  }

  return {
    fontSize: 58,
    animation: "",
    color: "FFFFFF",
    outline: 3,
  };
}