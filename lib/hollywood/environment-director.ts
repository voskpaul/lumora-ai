export function getEnvironment(narration: string) {

  const text = narration.toLowerCase();

  if (
    text.includes("developer") ||
    text.includes("coding")
  ) {

    return "luxurious futuristic AI workspace with holographic interfaces";

  }

  if (text.includes("forest")) {

    return "lush forest with cinematic sunlight";

  }

  if (text.includes("space")) {

    return "deep space with futuristic spacecraft";

  }

  return "modern cinematic environment";

}