export type ProductionDesign = {
  environment: string;
  architecture: string;
  props: string;
  atmosphere: string;
  textures: string;
  realism: string;
};

export function buildProductionDesign(
  narration: string
): ProductionDesign {

  const text = narration.toLowerCase();

  //--------------------------------------------------
  // AI
  //--------------------------------------------------

  if (
    text.includes("ai") ||
    text.includes("artificial intelligence")
  ) {
    return {
      environment:
        "futuristic AI research laboratory",

      architecture:
        "minimalist glass architecture with holographic displays",

      props:
        "transparent holographic interfaces, floating data visualization, advanced computers",

      atmosphere:
        "soft blue volumetric atmosphere",

      textures:
        "glass, brushed aluminum, OLED lighting",

      realism:
        "ultra photorealistic cinematic production design",
    };
  }

  //--------------------------------------------------
  // OFFICE
  //--------------------------------------------------

  if (
    text.includes("developer") ||
    text.includes("office")
  ) {
    return {
      environment:
        "premium modern software engineering workspace",

      architecture:
        "Scandinavian minimalist architecture",

      props:
        "ultrawide monitors, mechanical keyboard, Apple workstation, modern desk",

      atmosphere:
        "warm practical lighting with cinematic window light",

      textures:
        "wood, aluminum, matte black surfaces",

      realism:
        "Hollywood office realism",
    };
  }

  //--------------------------------------------------
  // SPACE
  //--------------------------------------------------

  if (text.includes("space")) {
    return {
      environment:
        "advanced space station",

      architecture:
        "NASA-inspired futuristic engineering",

      props:
        "spacecraft controls, holograms, floating displays",

      atmosphere:
        "deep cinematic space lighting",

      textures:
        "carbon fiber, titanium, LED lighting",

      realism:
        "AAA sci-fi blockbuster realism",
    };
  }

  //--------------------------------------------------
  // CITY
  //--------------------------------------------------

  if (text.includes("city")) {
    return {
      environment:
        "futuristic megacity",

      architecture:
        "cyberpunk skyscrapers",

      props:
        "flying vehicles, holographic billboards, glass towers",

      atmosphere:
        "cinematic atmospheric haze",

      textures:
        "glass, steel, neon reflections",

      realism:
        "ultra realistic city environment",
    };
  }

  //--------------------------------------------------
  // DEFAULT
  //--------------------------------------------------

  return {
    environment:
      "cinematic realistic environment",

    architecture:
      "modern realistic architecture",

    props:
      "natural high-end cinematic props",

    atmosphere:
      "volumetric cinematic atmosphere",

    textures:
      "high-resolution physically based materials",

    realism:
      "Oscar-quality production design",
  };
}