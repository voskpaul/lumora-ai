export type ColorGrade =
  | "cinematic"
  | "corporate"
  | "horror"
  | "luxury"
  | "travel"
  | "ai"
  | "documentary";

export function getColorGradeFilter(
  grade: ColorGrade = "cinematic"
): string {

  switch (grade) {

    case "corporate":
      return [
        "eq=contrast=1.05:brightness=0.01:saturation=1.02",
        "colorbalance=bs=0.03",
      ].join(",");

    case "horror":
      return [
        "eq=contrast=1.18:brightness=-0.03:saturation=0.75",
        "colorbalance=gs=-0.05:bs=0.08",
      ].join(",");

    case "luxury":
      return [
        "eq=contrast=1.12:brightness=0.02:saturation=1.18",
        "colorbalance=rs=0.05:gs=0.01:bs=-0.02",
      ].join(",");

    case "travel":
      return [
        "eq=contrast=1.08:brightness=0.02:saturation=1.25",
      ].join(",");

    case "ai":
      return [
        "eq=contrast=1.08:brightness=0.01:saturation=1.10",
        "colorbalance=bs=0.05:gs=0.02",
      ].join(",");

    case "documentary":
      return [
        "eq=contrast=1.02:brightness=0.01:saturation=0.95",
      ].join(",");

    case "cinematic":
    default:
      return [
        "eq=contrast=1.10:brightness=0.01:saturation=1.12",
        "colorbalance=rs=0.02:gs=0.01:bs=-0.015",
      ].join(",");
  }

}