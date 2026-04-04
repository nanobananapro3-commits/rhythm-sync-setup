// Persistent game state manager

export interface LevelProgress {
  stars: number; // 0-3
  completed: boolean;
}

export interface SkinData {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  color: string;
  glowColor: string;
  innerColor: string;
  eyeColor: string;
  shape: 'square' | 'diamond' | 'circle' | 'triangle' | 'star' | 'hexagon';
}

export interface GameState {
  maxUnlocked: number;
  coins: number;
  levelProgress: Record<number, LevelProgress>;
  ownedSkins: string[];
  activeSkin: string;
}

export const SKINS: SkinData[] = [
  // COMMON (5-15 coins)
  { id: 'default', name: 'Clásico', rarity: 'common', price: 0, color: 'hsl(160,100%,50%)', glowColor: 'hsl(160,100%,50%)', innerColor: 'hsla(0,0%,100%,0.3)', eyeColor: 'hsla(0,0%,100%,0.8)', shape: 'square' },
  { id: 'blue', name: 'Azul Neón', rarity: 'common', price: 5, color: 'hsl(220,100%,60%)', glowColor: 'hsl(220,100%,70%)', innerColor: 'hsla(220,100%,80%,0.3)', eyeColor: 'hsl(220,100%,90%)', shape: 'square' },
  { id: 'red', name: 'Rojo Fuego', rarity: 'common', price: 5, color: 'hsl(0,100%,55%)', glowColor: 'hsl(0,100%,65%)', innerColor: 'hsla(0,100%,70%,0.3)', eyeColor: 'hsl(40,100%,80%)', shape: 'square' },
  { id: 'yellow', name: 'Amarillo Sol', rarity: 'common', price: 8, color: 'hsl(50,100%,55%)', glowColor: 'hsl(50,100%,65%)', innerColor: 'hsla(50,100%,80%,0.3)', eyeColor: 'hsl(0,0%,20%)', shape: 'square' },
  { id: 'pink', name: 'Rosa Chicle', rarity: 'common', price: 8, color: 'hsl(320,100%,60%)', glowColor: 'hsl(320,100%,70%)', innerColor: 'hsla(320,100%,80%,0.3)', eyeColor: 'hsl(320,100%,90%)', shape: 'square' },
  { id: 'lime', name: 'Lima Ácido', rarity: 'common', price: 10, color: 'hsl(80,100%,50%)', glowColor: 'hsl(80,100%,60%)', innerColor: 'hsla(80,100%,70%,0.3)', eyeColor: 'hsl(0,0%,15%)', shape: 'square' },
  { id: 'orange', name: 'Naranja Eléctrico', rarity: 'common', price: 10, color: 'hsl(30,100%,50%)', glowColor: 'hsl(30,100%,60%)', innerColor: 'hsla(30,100%,70%,0.3)', eyeColor: 'hsl(0,0%,100%)', shape: 'square' },
  { id: 'white', name: 'Blanco Puro', rarity: 'common', price: 12, color: 'hsl(0,0%,90%)', glowColor: 'hsl(0,0%,100%)', innerColor: 'hsla(0,0%,100%,0.5)', eyeColor: 'hsl(0,0%,20%)', shape: 'square' },

  // RARE (20-40 coins)
  { id: 'diamond_blue', name: 'Diamante Azul', rarity: 'rare', price: 20, color: 'hsl(200,100%,55%)', glowColor: 'hsl(200,100%,70%)', innerColor: 'hsla(200,100%,80%,0.4)', eyeColor: 'hsl(200,100%,95%)', shape: 'diamond' },
  { id: 'diamond_red', name: 'Diamante Rojo', rarity: 'rare', price: 20, color: 'hsl(350,100%,55%)', glowColor: 'hsl(350,100%,65%)', innerColor: 'hsla(350,100%,70%,0.4)', eyeColor: 'hsl(40,100%,90%)', shape: 'diamond' },
  { id: 'circle_cyan', name: 'Esfera Cyan', rarity: 'rare', price: 25, color: 'hsl(180,100%,50%)', glowColor: 'hsl(180,100%,65%)', innerColor: 'hsla(180,100%,80%,0.4)', eyeColor: 'hsl(0,0%,100%)', shape: 'circle' },
  { id: 'circle_purple', name: 'Esfera Púrpura', rarity: 'rare', price: 25, color: 'hsl(270,100%,60%)', glowColor: 'hsl(270,100%,75%)', innerColor: 'hsla(270,100%,80%,0.4)', eyeColor: 'hsl(270,100%,95%)', shape: 'circle' },
  { id: 'tri_green', name: 'Triángulo Esmeralda', rarity: 'rare', price: 30, color: 'hsl(150,100%,45%)', glowColor: 'hsl(150,100%,60%)', innerColor: 'hsla(150,100%,70%,0.4)', eyeColor: 'hsl(0,0%,100%)', shape: 'triangle' },
  { id: 'tri_gold', name: 'Triángulo Dorado', rarity: 'rare', price: 35, color: 'hsl(45,100%,50%)', glowColor: 'hsl(45,100%,65%)', innerColor: 'hsla(45,100%,80%,0.5)', eyeColor: 'hsl(0,0%,15%)', shape: 'triangle' },
  { id: 'hex_teal', name: 'Hexágono Teal', rarity: 'rare', price: 40, color: 'hsl(175,100%,40%)', glowColor: 'hsl(175,100%,55%)', innerColor: 'hsla(175,100%,70%,0.4)', eyeColor: 'hsl(0,0%,100%)', shape: 'hexagon' },

  // EPIC (60-120 coins)
  { id: 'star_gold', name: 'Estrella Dorada', rarity: 'epic', price: 60, color: 'hsl(45,100%,55%)', glowColor: 'hsl(45,100%,70%)', innerColor: 'hsla(45,100%,85%,0.5)', eyeColor: 'hsl(0,0%,15%)', shape: 'star' },
  { id: 'star_cosmic', name: 'Estrella Cósmica', rarity: 'epic', price: 75, color: 'hsl(260,100%,65%)', glowColor: 'hsl(280,100%,80%)', innerColor: 'hsla(260,100%,85%,0.5)', eyeColor: 'hsl(0,0%,100%)', shape: 'star' },
  { id: 'hex_inferno', name: 'Hexágono Inferno', rarity: 'epic', price: 80, color: 'hsl(15,100%,50%)', glowColor: 'hsl(30,100%,60%)', innerColor: 'hsla(0,100%,70%,0.5)', eyeColor: 'hsl(45,100%,80%)', shape: 'hexagon' },
  { id: 'diamond_neon', name: 'Diamante Neón', rarity: 'epic', price: 90, color: 'hsl(160,100%,50%)', glowColor: 'hsl(300,100%,60%)', innerColor: 'hsla(200,100%,80%,0.5)', eyeColor: 'hsl(160,100%,90%)', shape: 'diamond' },
  { id: 'circle_plasma', name: 'Esfera Plasma', rarity: 'epic', price: 100, color: 'hsl(280,100%,55%)', glowColor: 'hsl(320,100%,65%)', innerColor: 'hsla(300,100%,80%,0.5)', eyeColor: 'hsl(45,100%,80%)', shape: 'circle' },
  { id: 'tri_void', name: 'Triángulo Vacío', rarity: 'epic', price: 120, color: 'hsl(240,50%,30%)', glowColor: 'hsl(260,100%,50%)', innerColor: 'hsla(240,100%,60%,0.5)', eyeColor: 'hsl(0,100%,60%)', shape: 'triangle' },

  // LEGENDARY (200-500 coins)
  { id: 'galaxy', name: 'Galaxia', rarity: 'legendary', price: 200, color: 'hsl(270,100%,60%)', glowColor: 'hsl(200,100%,70%)', innerColor: 'hsla(300,100%,80%,0.6)', eyeColor: 'hsl(45,100%,90%)', shape: 'circle' },
  { id: 'supernova', name: 'Supernova', rarity: 'legendary', price: 250, color: 'hsl(30,100%,60%)', glowColor: 'hsl(45,100%,80%)', innerColor: 'hsla(0,100%,70%,0.6)', eyeColor: 'hsl(0,0%,100%)', shape: 'star' },
  { id: 'phantom', name: 'Fantasma', rarity: 'legendary', price: 300, color: 'hsl(200,30%,70%)', glowColor: 'hsl(200,50%,85%)', innerColor: 'hsla(200,50%,90%,0.3)', eyeColor: 'hsl(0,100%,50%)', shape: 'hexagon' },
  { id: 'dragon', name: 'Dragón', rarity: 'legendary', price: 400, color: 'hsl(0,100%,45%)', glowColor: 'hsl(30,100%,55%)', innerColor: 'hsla(15,100%,60%,0.6)', eyeColor: 'hsl(45,100%,50%)', shape: 'diamond' },
  { id: 'rainbow', name: 'Arcoíris', rarity: 'legendary', price: 500, color: 'hsl(0,100%,60%)', glowColor: 'hsl(120,100%,60%)', innerColor: 'hsla(240,100%,70%,0.5)', eyeColor: 'hsl(0,0%,100%)', shape: 'star' },
];

const STORAGE_KEY = 'gd_game_state';

export function getDefaultGameState(): GameState {
}

function getDefaultState(): GameState {
  return getDefaultGameState();
  return {
    maxUnlocked: 1,
    coins: 0,
    levelProgress: {},
    ownedSkins: ['default'],
    activeSkin: 'default',
  };
}

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    return { ...getDefaultState(), ...parsed };
  } catch {
    return getDefaultState();
  }
}

export function saveGameState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Calculate coins earned for completing a level.
 * Returns 0 if the player already has equal or more stars.
 */
export function calculateCoinsEarned(
  levelNum: number,
  newStars: number,
  previousStars: number,
): number {
  if (newStars <= previousStars) return 0;
  // Each star = levelNum coins (level 1: 1 coin/star, level 2: 2 coins/star, etc.)
  return newStars * levelNum;
}

/**
 * Calculate stars from lives remaining (MAX_CONTINUES = 3).
 * 3 lives left = 3 stars, 2 = 2, 1 = 1, 0 = completed but 1 star minimum
 */
export function calculateStars(livesRemaining: number): number {
  return Math.max(1, Math.min(3, livesRemaining));
}

export function getActiveSkin(state: GameState): SkinData {
  return SKINS.find(s => s.id === state.activeSkin) || SKINS[0];
}

export function getRarityColor(rarity: SkinData['rarity']): string {
  switch (rarity) {
    case 'common': return 'hsl(0,0%,70%)';
    case 'rare': return 'hsl(220,100%,60%)';
    case 'epic': return 'hsl(280,100%,60%)';
    case 'legendary': return 'hsl(45,100%,55%)';
  }
}

export function getRarityLabel(rarity: SkinData['rarity']): string {
  switch (rarity) {
    case 'common': return 'Común';
    case 'rare': return 'Rara';
    case 'epic': return 'Épica';
    case 'legendary': return 'Legendaria';
  }
}
