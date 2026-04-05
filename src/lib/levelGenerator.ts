export interface Obstacle {
  x: number;
  type: 'spike' | 'block' | 'tall-spike' | 'double-spike' | 'triple-spike' |
        'moving-block' | 'gap' | 'pillar' | 'saw' | 'platform' |
        'spike-block' | 'orb' | 'portal' | 'laser' | 'wave-spike' |
        'mini-saw-row' | 'spike-pit' | 'solid-platform' | 'mushroom' |
        'vertical-saw' | 'vanishing-block' | 'pulse-laser' | 'hammer' |
        'ceiling-spike' | 'mode-ball' | 'mode-airplane' | 'mode-normal';
  width: number;
  height: number;
  y?: number;
  color?: string;
}

export interface ColorZone {
  start: number;
  color: string;
  bgColor: string;
  accentColor: string;
  pulseColor: string;
}

export interface LevelData {
  id: number;
  name: string;
  speed: number;
  gravity: number;
  jumpForce: number;
  obstacles: Obstacle[];
  groundY: number;
  color: string;
  bgColor: string;
  accentColor: string;
  pulseColor: string;
  length: number;
  colorZones: ColorZone[];
  hasBallMode: boolean;
  hasAirplaneMode: boolean;
  hasMushroom: boolean;
}

const THEMES = [
  { color: 'hsl(160, 100%, 50%)', bg: 'hsl(240, 15%, 5%)', accent: 'hsl(120, 100%, 60%)', pulse: 'hsl(180, 100%, 70%)' },
  { color: 'hsl(280, 100%, 60%)', bg: 'hsl(260, 20%, 6%)', accent: 'hsl(320, 100%, 65%)', pulse: 'hsl(260, 100%, 80%)' },
  { color: 'hsl(40, 100%, 55%)', bg: 'hsl(20, 15%, 5%)', accent: 'hsl(25, 100%, 60%)', pulse: 'hsl(50, 100%, 75%)' },
  { color: 'hsl(320, 100%, 60%)', bg: 'hsl(340, 15%, 5%)', accent: 'hsl(350, 100%, 65%)', pulse: 'hsl(310, 100%, 80%)' },
  { color: 'hsl(180, 100%, 50%)', bg: 'hsl(200, 20%, 5%)', accent: 'hsl(160, 100%, 55%)', pulse: 'hsl(190, 100%, 70%)' },
  { color: 'hsl(220, 100%, 60%)', bg: 'hsl(230, 20%, 5%)', accent: 'hsl(200, 100%, 65%)', pulse: 'hsl(240, 100%, 80%)' },
  { color: 'hsl(0, 100%, 55%)', bg: 'hsl(0, 15%, 5%)', accent: 'hsl(15, 100%, 60%)', pulse: 'hsl(350, 100%, 75%)' },
  { color: 'hsl(120, 100%, 45%)', bg: 'hsl(140, 15%, 5%)', accent: 'hsl(90, 100%, 55%)', pulse: 'hsl(130, 100%, 70%)' },
  { color: 'hsl(50, 100%, 55%)', bg: 'hsl(40, 20%, 5%)', accent: 'hsl(30, 100%, 60%)', pulse: 'hsl(60, 100%, 75%)' },
  { color: 'hsl(200, 100%, 55%)', bg: 'hsl(210, 20%, 5%)', accent: 'hsl(220, 100%, 65%)', pulse: 'hsl(195, 100%, 80%)' },
  { color: 'hsl(270, 100%, 65%)', bg: 'hsl(280, 25%, 4%)', accent: 'hsl(300, 100%, 60%)', pulse: 'hsl(260, 100%, 85%)' },
  { color: 'hsl(10, 100%, 55%)', bg: 'hsl(5, 20%, 4%)', accent: 'hsl(30, 100%, 55%)', pulse: 'hsl(0, 100%, 75%)' },
  { color: 'hsl(150, 100%, 50%)', bg: 'hsl(170, 25%, 4%)', accent: 'hsl(130, 100%, 55%)', pulse: 'hsl(160, 100%, 75%)' },
  { color: 'hsl(340, 100%, 55%)', bg: 'hsl(350, 20%, 4%)', accent: 'hsl(320, 100%, 60%)', pulse: 'hsl(0, 100%, 70%)' },
  { color: 'hsl(60, 100%, 50%)', bg: 'hsl(70, 20%, 4%)', accent: 'hsl(45, 100%, 55%)', pulse: 'hsl(55, 100%, 80%)' },
  { color: 'hsl(190, 100%, 55%)', bg: 'hsl(210, 25%, 3%)', accent: 'hsl(170, 100%, 50%)', pulse: 'hsl(200, 100%, 75%)' },
  { color: 'hsl(30, 100%, 50%)', bg: 'hsl(15, 20%, 4%)', accent: 'hsl(45, 100%, 60%)', pulse: 'hsl(20, 100%, 70%)' },
  { color: 'hsl(300, 100%, 55%)', bg: 'hsl(310, 20%, 4%)', accent: 'hsl(280, 100%, 60%)', pulse: 'hsl(330, 100%, 75%)' },
  { color: 'hsl(80, 100%, 50%)', bg: 'hsl(100, 20%, 4%)', accent: 'hsl(60, 100%, 55%)', pulse: 'hsl(90, 100%, 75%)' },
  { color: 'hsl(240, 100%, 65%)', bg: 'hsl(250, 30%, 3%)', accent: 'hsl(260, 100%, 70%)', pulse: 'hsl(220, 100%, 80%)' },
];

const LEVEL_NAMES = [
  "Stereo Madness", "Back On Track", "Polargeist", "Dry Out", "Base After Base",
  "Can't Let Go", "Jumper", "Time Machine", "Cycles", "xStep",
  "Clutterfunk", "Theory of Everything", "Electroman Adventures", "Clubstep", "Electrodynamix",
  "Hexagon Force", "Blast Processing", "Theory of Everything 2", "Geometrical Dominator", "Deadlocked",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function addSpikeRow(obs: Obstacle[], x: number, count: number, spacing: number): number {
  for (let i = 0; i < count; i++) {
    obs.push({ x: x + i * spacing, type: 'spike', width: 30, height: 30 });
  }
  return x + count * spacing;
}

// Staircase: platforms go up/down, each step reachable from the previous one
// First step at y=-55 (one jump from ground), each next step +35 higher
function addStaircase(obs: Obstacle[], x: number, steps: number, up: boolean, rand: () => number): number {
  const baseY = -55; // reachable with one jump
  const stepGap = 35; // each step 35px higher, reachable from previous
  for (let i = 0; i < steps; i++) {
    const si = up ? i : (steps - 1 - i);
    const stepY = baseY - si * stepGap;
    const w = 55 + rand() * 25;
    obs.push({ x: x + i * 70, type: 'solid-platform', width: w, height: 12, y: stepY });
  }
  // Ground spikes below the staircase (reason to climb)
  const spikeCount = Math.max(1, steps - 1);
  for (let i = 0; i < spikeCount; i++) {
    obs.push({ x: x + 20 + i * 70, type: 'spike', width: 30, height: 30 });
  }
  return x + steps * 70;
}

type PatternFn = (obs: Obstacle[], x: number, diff: number, rand: () => number) => number;

const PATTERNS: PatternFn[] = [
  // 0: Single spike
  (obs, x) => { obs.push({ x, type: 'spike', width: 30, height: 30 }); return x + 30; },
  // 1: Double spike
  (obs, x) => { obs.push({ x, type: 'double-spike', width: 60, height: 30 }); return x + 60; },
  // 2: Triple spike
  (obs, x) => { obs.push({ x, type: 'triple-spike', width: 90, height: 30 }); return x + 90; },
  // 3: Tall spike
  (obs, x) => { obs.push({ x, type: 'tall-spike', width: 30, height: 60 }); return x + 30; },
  // 4: Platform over spikes (escape route up)
  (obs, x, _d, rand) => {
    const w = 60 + rand() * 50;
    // Ground spikes that you avoid by jumping onto the platform
    obs.push({ x: x + 5, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 40, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 75, type: 'spike', width: 30, height: 30 });
    // Platform reachable with one jump (y=-55)
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: -55 });
    return x + w + 20;
  },
  // 5: Gap
  (obs, x, diff) => {
    const w = 50 + diff * 50;
    obs.push({ x, type: 'gap', width: w, height: 200 }); return x + w;
  },
  // 6: Spike row
  (obs, x, diff, rand) => {
    const count = 3 + Math.floor(rand() * (1 + diff * 3));
    return addSpikeRow(obs, x, count, 32);
  },
  // 7: Staircase up
  (obs, x, diff, rand) => addStaircase(obs, x, 2 + Math.floor(rand() * (2 + diff * 3)), true, rand),
  // 8: Staircase down
  (obs, x, diff, rand) => addStaircase(obs, x, 2 + Math.floor(rand() * (2 + diff * 3)), false, rand),
  // 9: Platform bridge over spike pit
  (obs, x, _d, rand) => {
    const pw = 70 + rand() * 40;
    // Spike row on ground
    for (let i = 0; i < 3; i++) {
      obs.push({ x: x + 10 + i * 32, type: 'spike', width: 30, height: 30 });
    }
    // Platform above to jump onto and cross safely
    obs.push({ x, type: 'solid-platform', width: pw, height: 12, y: -55 });
    return x + pw + 15;
  },
  // 10: Two-step platform (ground spike → step 1 → step 2)
  (obs, x, _d, rand) => {
    const w1 = 50 + rand() * 20;
    const w2 = 45 + rand() * 20;
    obs.push({ x: x + 10, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 45, type: 'spike', width: 30, height: 30 });
    obs.push({ x, type: 'solid-platform', width: w1, height: 12, y: -55 });
    obs.push({ x: x + w1 + 15, type: 'solid-platform', width: w2, height: 12, y: -90 });
    return x + w1 + w2 + 35;
  },
  // 11: Saw blade
  (obs, x) => { obs.push({ x, type: 'saw', width: 35, height: 35 }); return x + 35; },
  // 12: Platform with spike
  (obs, x, _d, rand) => {
    const w = 60 + rand() * 40;
    obs.push({ x, type: 'platform', width: w, height: 15, y: -80 });
    obs.push({ x: x + w / 2 - 15, type: 'spike', width: 30, height: 30 });
    return x + w;
  },
  // 13: Moving block
  (obs, x) => { obs.push({ x, type: 'moving-block', width: 40, height: 40 }); return x + 40; },
  // 14: Gap with rescue platform
  (obs, x, diff) => {
    const gw = 50 + diff * 30;
    obs.push({ x, type: 'gap', width: gw, height: 200 });
    // Platform over the gap so you can land safely
    obs.push({ x: x + 5, type: 'solid-platform', width: gw - 10, height: 12, y: -55 });
    return x + gw + 10;
  },
  // 15: Spike field with overhead escape platform
  (obs, x, _d, rand) => {
    const len = 120 + rand() * 60;
    // Many spikes on ground
    const count = Math.floor(len / 35);
    for (let i = 0; i < count; i++) {
      obs.push({ x: x + i * 35, type: 'spike', width: 30, height: 30 });
    }
    // Long platform above to cross safely
    obs.push({ x: x - 10, type: 'solid-platform', width: len + 20, height: 12, y: -55 });
    return x + len + 15;
  },
  // 16: Spike wall
  (obs, x) => {
    obs.push({ x, type: 'tall-spike', width: 30, height: 60 });
    obs.push({ x: x + 35, type: 'spike', width: 30, height: 30 });
    return x + 65;
  },
  // 17: Platform hop (each platform has spikes below, must jump between them)
  (obs, x, _d, rand) => {
    const n = 2 + Math.floor(rand() * 2);
    let cx = x;
    for (let i = 0; i < n; i++) {
      const w = 50 + rand() * 30;
      obs.push({ x: cx, type: 'solid-platform', width: w, height: 12, y: -55 });
      // Spikes below each platform
      obs.push({ x: cx + 10, type: 'spike', width: 30, height: 30 });
      if (w > 60) obs.push({ x: cx + 45, type: 'spike', width: 30, height: 30 });
      cx += w + 40;
    }
    return cx;
  },
  // 18: Laser beam
  (obs, x, _d, rand) => {
    const w = 80 + rand() * 60;
    obs.push({ x, type: 'laser', width: w, height: 8, y: -40 - rand() * 40 });
    return x + w;
  },
  // 19: Wave spikes
  (obs, x, _d, rand) => {
    const count = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const h = i % 2 === 0 ? 30 : 50;
      obs.push({ x: x + i * 35, type: 'wave-spike', width: 28, height: h });
    }
    return x + count * 35;
  },
  // 20: Mini saw row
  (obs, x, _d, rand) => {
    const count = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      obs.push({ x: x + i * 50, type: 'saw', width: 28, height: 28 });
    }
    return x + count * 50;
  },
  // 21: Spike pit
  (obs, x, diff) => {
    const w = 60 + diff * 40;
    obs.push({ x, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 35, type: 'gap', width: w, height: 200 });
    obs.push({ x: x + 35 + w + 5, type: 'spike', width: 30, height: 30 });
    return x + 70 + w;
  },
  // 22: Platform with saw below (must stay on platform)
  (obs, x, _d, rand) => {
    const w = 60 + rand() * 50;
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: -55 });
    // Saw on ground level - must stay on platform
    obs.push({ x: x + w / 2 - 18, type: 'saw', width: 36, height: 36 });
    return x + w + 20;
  },
  // 23: Zigzag spikes
  (obs, x) => {
    obs.push({ x, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 60, type: 'tall-spike', width: 30, height: 55 });
    obs.push({ x: x + 120, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 180, type: 'tall-spike', width: 30, height: 55 });
    return x + 210;
  },
  // 24: Orb + spike
  (obs, x) => {
    obs.push({ x, type: 'orb', width: 24, height: 24, y: -50 });
    obs.push({ x: x + 50, type: 'spike', width: 30, height: 30 });
    return x + 80;
  },
  // 25: Saw corridor (hard)
  (obs, x, _d, rand) => {
    const n = 3 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      obs.push({ x: x + i * 60, type: 'saw', width: 32, height: 32 });
      if (i < n - 1) obs.push({ x: x + i * 60 + 30, type: 'spike', width: 25, height: 25 });
    }
    return x + n * 60;
  },
  // 26: Platform + laser below (stay on platform to dodge laser)
  (obs, x, _d, rand) => {
    const pw = 70 + rand() * 40;
    obs.push({ x, type: 'solid-platform', width: pw, height: 12, y: -55 });
    // Laser at ground level - you die if you don't jump onto the platform
    obs.push({ x: x - 5, type: 'laser', width: pw + 10, height: 8, y: -25 });
    obs.push({ x: x + pw + 10, type: 'spike', width: 30, height: 30 });
    return x + pw + 40;
  },
  // 27: Triple gap gauntlet (very hard)
  (obs, x, diff) => {
    const gw = 35 + diff * 20;
    for (let i = 0; i < 3; i++) {
      obs.push({ x: x + i * (gw + 55), type: 'gap', width: gw, height: 200 });
      if (i < 2) obs.push({ x: x + i * (gw + 55) + gw + 5, type: 'solid-platform', width: 45, height: 12, y: -55 });
    }
    return x + 3 * (gw + 55);
  },
  // 28: Platform maze (very hard)
  (obs, x, diff, rand) => {
    const n = 3 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const w = 35 + rand() * 25;
      obs.push({ x: x + i * 60, type: 'solid-platform', width: w, height: 12, y: -60 - rand() * (60 + diff * 60) });
      if (rand() > 0.5) obs.push({ x: x + i * 60 + 15, type: 'spike', width: 22, height: 22 });
    }
    return x + n * 60;
  },
  // 29: Nightmare combo (extreme)
  (obs, x, _d, rand) => {
    obs.push({ x, type: 'saw', width: 35, height: 35 });
    obs.push({ x: x + 40, type: 'tall-spike', width: 30, height: 60 });
    obs.push({ x: x + 75, type: 'gap', width: 50, height: 200 });
    obs.push({ x: x + 130, type: 'saw', width: 35, height: 35 });
    obs.push({ x: x + 170, type: 'triple-spike', width: 90, height: 30 });
    if (rand() > 0.3) obs.push({ x: x + 80, type: 'laser', width: 80, height: 8, y: -70 });
    return x + 260;
  },
  // 30: Floating platform (short)
  (obs, x, _d, rand) => {
    const w = 50 + rand() * 40;
    const h = -60 - rand() * 80;
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: h });
    return x + w + 20;
  },
  // 31: Floating platform staircase (ascending)
  (obs, x, _d, rand) => {
    const steps = 2 + Math.floor(rand() * 3);
    let cx = x;
    for (let i = 0; i < steps; i++) {
      const w = 45 + rand() * 35;
      obs.push({ x: cx, type: 'solid-platform', width: w, height: 12, y: -60 - i * 45 });
      cx += w + 25 + rand() * 20;
    }
    return cx;
  },
  // 32: Vertical saw (lvl 10+)
  (obs, x) => {
    obs.push({ x, type: 'vertical-saw', width: 35, height: 35 });
    return x + 35;
  },
  // 33: Vanishing block (lvl 20+)
  (obs, x, _d, rand) => {
    const w = 40 + rand() * 30;
    obs.push({ x, type: 'vanishing-block', width: w, height: 30 });
    obs.push({ x: x + w + 20, type: 'spike', width: 30, height: 30 });
    return x + w + 50;
  },
  // 34: Pulse laser (lvl 40+)
  (obs, x, _d, rand) => {
    const w = 100 + rand() * 80;
    obs.push({ x, type: 'pulse-laser', width: w, height: 12, y: -50 - rand() * 40 });
    return x + w;
  },
  // 35: Hammer (lvl 50+)
  (obs, x) => {
    obs.push({ x, type: 'hammer', width: 40, height: 60 });
    return x + 60;
  },
  // 36: Ceiling spike with platform
  (obs, x, _d, rand) => {
    const w = 80 + rand() * 40;
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: -100 });
    obs.push({ x: x + 10, type: 'ceiling-spike', width: 30, height: 30, y: -100 });
    obs.push({ x: x + w - 40, type: 'ceiling-spike', width: 30, height: 30, y: -100 });
    return x + w;
  },
  // 37: Platform corridor with ceiling
  (obs, x, _d, rand) => {
    const w = 120 + rand() * 60;
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: -60 });
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: -130 });
    obs.push({ x: x + 30, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + w - 60, type: 'spike', width: 30, height: 30 });
    return x + w;
  },
  // 38: Mushroom placement (lvl 30+)
  (obs, x) => {
    obs.push({ x, type: 'mushroom', width: 24, height: 24, y: -40 });
    return x + 30;
  },
  // 39: Long floating platform with spikes below
  (obs, x, _d, rand) => {
    const w = 100 + rand() * 80;
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: -80 });
    const spikeCount = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < spikeCount; i++) {
      obs.push({ x: x + 15 + i * 35, type: 'spike', width: 30, height: 30 });
    }
    return x + w + 20;
  },
  // 40: Branching path (easy top / hard bottom)
  (obs, x, _d, rand) => {
    const len = 200 + rand() * 100;
    // Top path: floating platforms (easier)
    obs.push({ x, type: 'solid-platform', width: 60, height: 12, y: -100 });
    obs.push({ x: x + 80, type: 'solid-platform', width: 80, height: 12, y: -110 });
    obs.push({ x: x + 180, type: 'solid-platform', width: 60, height: 12, y: -95 });
    // Bottom path: ground with spikes (harder)
    obs.push({ x: x + 30, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 90, type: 'spike', width: 30, height: 30 });
    obs.push({ x: x + 130, type: 'tall-spike', width: 30, height: 55 });
    obs.push({ x: x + 190, type: 'spike', width: 30, height: 30 });
    return x + len;
  },
  // 41: Descending floating staircase
  (obs, x, _d, rand) => {
    const steps = 3 + Math.floor(rand() * 2);
    let cx = x;
    for (let i = 0; i < steps; i++) {
      const w = 40 + rand() * 30;
      obs.push({ x: cx, type: 'solid-platform', width: w, height: 12, y: -140 + i * 35 });
      cx += w + 20 + rand() * 15;
    }
    return cx;
  },
  // 42: Floating platform with spike on top
  (obs, x, _d, rand) => {
    const w = 60 + rand() * 50;
    obs.push({ x, type: 'solid-platform', width: w, height: 12, y: -75 });
    obs.push({ x: x + w / 2 - 15, type: 'spike', width: 30, height: 30, y: -75 - 30 });
    return x + w + 20;
  },
  // 43: Branching path v2 (hard top / easy bottom)
  (obs, x, _d, rand) => {
    const len = 220 + rand() * 80;
    // Top path: platforms with ceiling spikes (harder)
    obs.push({ x, type: 'solid-platform', width: 70, height: 12, y: -90 });
    obs.push({ x: x + 20, type: 'ceiling-spike', width: 25, height: 25, y: -160 });
    obs.push({ x: x + 90, type: 'solid-platform', width: 70, height: 12, y: -100 });
    obs.push({ x: x + 110, type: 'ceiling-spike', width: 25, height: 25, y: -170 });
    obs.push({ x: x + 180, type: 'solid-platform', width: 50, height: 12, y: -85 });
    // Bottom: single spike
    obs.push({ x: x + 80, type: 'spike', width: 30, height: 30 });
    return x + len;
  },
];

function getAvailablePatterns(difficulty: number, levelNum: number): number[] {
  const base: number[] = [];
  // Always available: basic patterns + floating platforms + branching paths
  if (difficulty < 0.1) { base.push(0, 0, 0, 4, 4, 1, 30, 30, 31, 39, 40); }
  else if (difficulty < 0.2) { base.push(0, 1, 3, 4, 6, 9, 19, 30, 31, 39, 40, 41); }
  else if (difficulty < 0.3) { base.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 24, 30, 31, 37, 39, 40, 41, 42); }
  else if (difficulty < 0.4) { base.push(1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 18, 19, 20, 30, 31, 36, 37, 39, 40, 41, 42, 43); }
  else if (difficulty < 0.5) { base.push(2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 30, 31, 36, 37, 39, 40, 41, 42, 43); }
  else if (difficulty < 0.6) { base.push(2, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 30, 31, 36, 37, 39, 40, 41, 42, 43); }
  else if (difficulty < 0.7) { base.push(5, 6, 7, 8, 10, 11, 14, 15, 16, 17, 18, 20, 21, 22, 23, 25, 26, 30, 31, 36, 37, 39, 40, 41, 42, 43); }
  else if (difficulty < 0.8) { base.push(5, 6, 10, 11, 14, 16, 17, 18, 20, 21, 22, 23, 25, 26, 27, 28, 30, 31, 36, 37, 39, 40, 41, 42, 43); }
  else if (difficulty < 0.9) { base.push(5, 10, 11, 14, 16, 18, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 36, 37, 39, 40, 41, 42, 43); }
  else { base.push(5, 10, 11, 14, 18, 20, 21, 22, 23, 25, 26, 27, 28, 29, 29, 29, 30, 31, 36, 37, 39, 40, 41, 42, 43); }

  // New traps every 10 levels
  if (levelNum >= 10) base.push(32, 32); // vertical saw
  if (levelNum >= 20) base.push(33, 33); // vanishing block
  if (levelNum >= 30) base.push(38); // mushroom
  if (levelNum >= 40) base.push(34, 34); // pulse laser
  if (levelNum >= 50) base.push(35, 35); // hammer

  return base;
}

const FPS_CONST = 60;
const BASE_DURATION_SECS = 300;

export function generateLevel(levelNum: number): LevelData {
  const rand = seededRandom(levelNum * 7919 + 31);
  const difficulty = Math.min(levelNum / 100, 1);
  const speed = 3 + difficulty * 5;
  const gravity = 0.5 + difficulty * 0.3;
  const jumpForce = -(9 + difficulty * 3);
  const baseLevelLength = speed * FPS_CONST * BASE_DURATION_SECS;

  const obstacles: Obstacle[] = [];
  let currentX = 600;
  const availablePatterns = getAvailablePatterns(difficulty, levelNum);
  
  const minGap = Math.max(50, 220 - difficulty * 180);
  const maxGap = Math.max(100, 350 - difficulty * 260);
  
  const totalSections = 14 + Math.floor(difficulty * 18);
  const sectionLength = (baseLevelLength - 1200) / totalSections;

  // Ball mode: some levels from 50+, not all
  const hasBallMode = levelNum >= 50 && (levelNum % 3 === 0);
  // Airplane mode: some levels from 70+
  const hasAirplaneMode = levelNum >= 70 && (levelNum % 4 === 1);
  // Mushroom: available from level 30
  const hasMushroom = levelNum >= 30;
  
  for (let section = 0; section < totalSections; section++) {
    const sectionStart = 600 + section * sectionLength;
    const sectionEnd = sectionStart + sectionLength;
    
    const isIntense = section % 5 !== 0;
    const densityMultiplier = isIntense ? 1.0 : 0.5;
    
    if (currentX < sectionStart) currentX = sectionStart;

    // Add mode switches for ball/airplane levels
    if (hasBallMode && section === Math.floor(totalSections * 0.3)) {
      obstacles.push({ x: currentX, type: 'mode-ball', width: 30, height: 30 });
      currentX += 200;
    }
    if (hasBallMode && section === Math.floor(totalSections * 0.5)) {
      obstacles.push({ x: currentX, type: 'mode-normal', width: 30, height: 30 });
      currentX += 100;
    }
    if (hasAirplaneMode && section === Math.floor(totalSections * 0.4)) {
      obstacles.push({ x: currentX, type: 'mode-airplane', width: 30, height: 30 });
      currentX += 200;
      // Add ceiling spikes for airplane sections
      for (let i = 0; i < 5; i++) {
        obstacles.push({ x: currentX + i * 120, type: 'ceiling-spike', width: 30, height: 30, y: -280 });
        obstacles.push({ x: currentX + i * 120 + 60, type: 'spike', width: 30, height: 30 });
      }
      currentX += 600;
    }
    if (hasAirplaneMode && section === Math.floor(totalSections * 0.65)) {
      obstacles.push({ x: currentX, type: 'mode-normal', width: 30, height: 30 });
      currentX += 100;
    }
    
    while (currentX < sectionEnd - 100) {
      const gap = (minGap + rand() * (maxGap - minGap)) / densityMultiplier;
      currentX += gap;
      if (currentX >= sectionEnd - 100) break;
      
      const patternIdx = availablePatterns[Math.floor(rand() * availablePatterns.length)];
      currentX = PATTERNS[patternIdx](obstacles, currentX, difficulty, rand);
    }
  }

  const primaryTheme = THEMES[levelNum % THEMES.length];
  
  const numZones = 2 + Math.floor(rand() * (1 + difficulty * 3));
  const colorZones: ColorZone[] = [];
  for (let i = 0; i < numZones; i++) {
    const zoneTheme = THEMES[(levelNum + i * 7 + Math.floor(rand() * 5)) % THEMES.length];
    colorZones.push({
      start: i / numZones,
      color: zoneTheme.color,
      bgColor: zoneTheme.bg,
      accentColor: zoneTheme.accent,
      pulseColor: zoneTheme.pulse,
    });
  }

  const name = levelNum <= 20 ? LEVEL_NAMES[levelNum - 1] : `Level ${levelNum}`;
  
  return {
    id: levelNum, name, speed, gravity, jumpForce, obstacles,
    groundY: 350,
    color: primaryTheme.color,
    bgColor: primaryTheme.bg,
    accentColor: primaryTheme.accent,
    pulseColor: primaryTheme.pulse,
    length: baseLevelLength,
    colorZones,
    hasBallMode,
    hasAirplaneMode,
    hasMushroom,
  };
}
