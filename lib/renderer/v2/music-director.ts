import { ColorGrade } from "./color-grade";

export type MusicMood =
  | "cinematic"
  | "documentary"
  | "travel"
  | "luxury"
  | "horror"
  | "ambient";

export function chooseMusicMood(
  grade: ColorGrade
): MusicMood {

  switch (grade) {

    case "travel":
      return "travel";

    case "luxury":
      return "luxury";

    case "horror":
      return "horror";

    case "documentary":
      return "documentary";

    case "corporate":
      return "ambient";

    case "ai":
      return "ambient";

    default:
      return "cinematic";
  }

}