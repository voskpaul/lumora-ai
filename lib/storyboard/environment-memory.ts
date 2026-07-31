export type EnvironmentMemory = {
  primaryLocation: string;
  architecture: string;
  atmosphere: string;
  weather: string;
  timeOfDay: string;
  consistencyNote: string;
};

function detectArchitecture(location: string): string {
  const l = location.toLowerCase();

  if (l.includes("office"))
    return "modern glass architecture";

  if (l.includes("laboratory"))
    return "high-tech research laboratory";

  if (l.includes("city"))
    return "futuristic skyline";

  if (l.includes("factory"))
    return "industrial architecture";

  if (l.includes("hospital"))
    return "clean modern medical facility";

  if (l.includes("space"))
    return "advanced sci-fi space station";

  return "cinematic realistic architecture";
}

function detectAtmosphere(location: string): string {
  const l = location.toLowerCase();

  if (
    l.includes("office") ||
    l.includes("laboratory")
  )
    return "clean cinematic atmosphere";

  if (l.includes("city"))
    return "epic futuristic atmosphere";

  if (l.includes("space"))
    return "vast cinematic atmosphere";

  return "professional cinematic atmosphere";
}

function detectTime(location: string): string {
  const l = location.toLowerCase();

  if (l.includes("city"))
    return "blue hour";

  if (l.includes("office"))
    return "daytime";

  if (l.includes("laboratory"))
    return "interior controlled lighting";

  return "golden hour";
}

export function buildEnvironmentMemory(
  location: string
): EnvironmentMemory {

  return {
    primaryLocation: location,

    architecture: detectArchitecture(location),

    atmosphere: detectAtmosphere(location),

    weather: "clear",

    timeOfDay: detectTime(location),

    consistencyNote:
      "Keep the same environment, architecture, atmosphere, lighting conditions and world style across every scene unless explicitly changed by the script.",
  };
}