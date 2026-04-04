import React from 'react';
import { generateLevel } from '@/lib/levelGenerator';
import { GameState } from '@/lib/gameState';

interface LevelSelectorProps {
  onSelectLevel: (level: number) => void;
  gameState: GameState;
}

const LEVEL_COLORS = [
  'hsl(160, 100%, 50%)', 'hsl(280, 100%, 60%)', 'hsl(40, 100%, 55%)',
  'hsl(320, 100%, 60%)', 'hsl(180, 100%, 50%)', 'hsl(220, 100%, 60%)',
  'hsl(0, 100%, 55%)', 'hsl(120, 100%, 45%)', 'hsl(50, 100%, 55%)',
  'hsl(200, 100%, 55%)',
];

const StarDisplay: React.FC<{ stars: number; small?: boolean }> = ({ stars, small }) => {
  const size = small ? 'text-[8px]' : 'text-xs';
  return (
    <span className={size}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ color: i <= stars ? 'hsl(45,100%,55%)' : 'hsla(0,0%,100%,0.15)' }}>★</span>
      ))}
    </span>
  );
};

const LevelSelector: React.FC<LevelSelectorProps> = ({ onSelectLevel, gameState }) => {
  return (
    <div className="w-full max-w-4xl">
      <h2 className="font-display text-2xl text-foreground text-glow-primary mb-6 text-center">
        Selecciona Nivel
      </h2>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto p-2">
        {Array.from({ length: 100 }, (_, i) => {
          const lvl = i + 1;
          const unlocked = lvl <= gameState.maxUnlocked;
          const progress = gameState.levelProgress[lvl];
          const stars = progress?.stars || 0;
          const color = LEVEL_COLORS[i % LEVEL_COLORS.length];
          const levelData = generateLevel(lvl);
          
          return (
            <button
              key={lvl}
              onClick={() => unlocked && onSelectLevel(lvl)}
              disabled={!unlocked}
              className="relative aspect-square rounded-md flex flex-col items-center justify-center font-display text-sm font-bold transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed gap-0.5"
              style={{
                backgroundColor: unlocked ? color.replace(')', ', 0.15)').replace('hsl(', 'hsla(') : 'hsla(0,0%,100%,0.03)',
                border: `1px solid ${unlocked ? color.replace(')', ', 0.5)').replace('hsl(', 'hsla(') : 'hsla(0,0%,100%,0.1)'}`,
                color: unlocked ? color : 'hsla(0,0%,100%,0.2)',
                boxShadow: unlocked ? `0 0 10px ${color.replace(')', ', 0.3)').replace('hsl(', 'hsla(')}` : 'none',
              }}
              title={levelData.name}
            >
              {!unlocked && <span className="text-[10px]">🔒</span>}
              {unlocked && <span>{lvl}</span>}
              {unlocked && stars > 0 && <StarDisplay stars={stars} small />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
