export type SubjectMemory = {
  mainSubject: string;
  appearance: string;
  clothing: string;
  age: string;
  gender: string;
  consistencyNote: string;
};

function detectAppearance(subject: string): string {
  const s = subject.toLowerCase();

  if (s.includes("developer"))
    return "clean modern appearance, focused expression";

  if (s.includes("scientist"))
    return "professional laboratory appearance";

  if (s.includes("doctor"))
    return "professional medical appearance";

  if (s.includes("robot"))
    return "sleek futuristic metallic design";

  if (s.includes("artificial intelligence"))
    return "glowing holographic AI interface";

  return "consistent cinematic appearance";
}

function detectClothing(subject: string): string {
  const s = subject.toLowerCase();

  if (s.includes("developer"))
    return "black hoodie, modern casual clothing";

  if (s.includes("scientist"))
    return "white laboratory coat";

  if (s.includes("doctor"))
    return "medical uniform";

  if (s.includes("business"))
    return "formal business suit";

  return "appropriate professional clothing";
}

export function buildSubjectMemory(
  subject: string
): SubjectMemory {

  return {
    mainSubject: subject,

    appearance: detectAppearance(subject),

    clothing: detectClothing(subject),

    age: "adult",

    gender: "unspecified",

    consistencyNote:
      "Maintain identical facial features, hairstyle, clothing, proportions, colors and identity across every scene. Never change the character.",
  };
}