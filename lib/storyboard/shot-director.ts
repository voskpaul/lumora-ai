import type { StoryboardScene } from './scene-splitter';

export type ShotPlan = {
  shot:
    | 'extreme close-up'
    | 'close-up'
    | 'medium shot'
    | 'wide shot'
    | 'aerial shot'
    | 'over-the-shoulder'
    | 'POV shot'
    | 'macro shot';

  angle:
    | 'low angle'
    | 'high angle'
    | 'eye level'
    | 'dutch angle'
    | 'top down';

  lens:
    | '24mm lens'
    | '35mm lens'
    | '50mm lens'
    | '85mm lens'
    | '100mm macro lens';

  movement:
    | 'slow cinematic push in'
    | 'slow dolly forward'
    | 'slow pan left'
    | 'slow pan right'
    | 'slow tilt up'
    | 'slow tilt down'
    | 'static cinematic frame'
    | 'handheld cinematic motion';

  framing: string;
};

export function buildShotPlan(
  scene: StoryboardScene
): ShotPlan {

  //--------------------------------------------------
  // HOOK
  //--------------------------------------------------

  if (scene.sceneType === 'hook') {
    return {
      shot: 'extreme close-up',
      angle: 'low angle',
      lens: '85mm lens',
      movement: 'slow cinematic push in',
      framing:
        'subject dominates the frame with dramatic foreground separation',
    };
  }

  //--------------------------------------------------
  // INTRODUCTION
  //--------------------------------------------------

  if (scene.sceneType === 'introduction') {
    return {
      shot: 'wide shot',
      angle: 'eye level',
      lens: '24mm lens',
      movement: 'slow dolly forward',
      framing:
        'environment and subject are both clearly visible in a cinematic establishing composition',
    };
  }

  //--------------------------------------------------
  // EXPLANATION
  //--------------------------------------------------

  if (scene.sceneType === 'explanation') {
    return {
      shot: 'medium shot',
      angle: 'eye level',
      lens: '50mm lens',
      movement: 'slow pan right',
      framing:
        'balanced composition with the subject centered naturally and space for visual storytelling',
    };
  }

  //--------------------------------------------------
  // CALL TO ACTION
  //--------------------------------------------------

  if (scene.sceneType === 'call_to_action') {
    return {
      shot: 'wide shot',
      angle: 'low angle',
      lens: '35mm lens',
      movement: 'slow tilt up',
      framing:
        'heroic cinematic framing with uplifting energy and strong background depth',
    };
  }

  //--------------------------------------------------
  // SPECIAL KEYWORDS
  //--------------------------------------------------

  const keywords = scene.keywords.join(' ');

  if (
    keywords.includes('circuit') ||
    keywords.includes('chip') ||
    keywords.includes('code') ||
    keywords.includes('keyboard')
  ) {
    return {
      shot: 'macro shot',
      angle: 'top down',
      lens: '100mm macro lens',
      movement: 'static cinematic frame',
      framing:
        'extreme detail of technology elements with shallow depth of field',
    };
  }

  if (
    keywords.includes('city') ||
    keywords.includes('datacenter') ||
    keywords.includes('server')
  ) {
    return {
      shot: 'aerial shot',
      angle: 'high angle',
      lens: '24mm lens',
      movement: 'slow pan left',
      framing:
        'large scale cinematic environment emphasizing scale and depth',
    };
  }

  //--------------------------------------------------
  // DEFAULT
  //--------------------------------------------------

  return {
    shot: 'medium shot',
    angle: 'eye level',
    lens: '35mm lens',
    movement: 'slow pan left',
    framing:
      'cinematic balanced composition with natural subject placement',
  };
}