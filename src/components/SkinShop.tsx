import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GameState, SkinData, SKINS, getRarityColor, getRarityLabel, saveGameState } from '@/lib/gameState';

interface SkinShopProps {
  gameState: GameState;
  onStateChange: (state: GameState) => void;
  onBack: () => void;
}

const RARITY_ORDER: SkinData['rarity'][] = ['common', 'rare', 'epic', 'legendary'];

const SkinShop: React.FC<SkinShopProps> = ({ gameState, onStateChange, onBack }) => {
  const [selectedRarity, setSelectedRarity] = useState<SkinData['rarity']>('common');
  const [message, setMessage] = useState('');

  const filteredSkins = SKINS.filter(s => s.rarity === selectedRarity);

  const handleBuy = (skin: SkinData) => {
    if (gameState.coins < skin.price) {
      setMessage('❌ No tienes suficientes monedas');
      return;
    }
    const newState: GameState = {
      ...gameState,
      coins: gameState.coins - skin.price,
      ownedSkins: [...gameState.ownedSkins, skin.id],
    };
    saveGameState(newState);
    onStateChange(newState);
    setMessage(`✅ ¡${skin.name} comprada!`);
  };

  const handleEquip = (skin: SkinData) => {
    const newState: GameState = { ...gameState, activeSkin: skin.id };
    saveGameState(newState);
    onStateChange(newState);
    setMessage(`🎮 ${skin.name} equipada`);
  };

  const drawSkinPreview = (skin: SkinData, size: number) => {
    const half = size / 2;
    switch (skin.shape) {
      case 'diamond':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <polygon points={`${half},2 ${size-2},${half} ${half},${size-2} 2,${half}`} fill={skin.color} stroke={skin.glowColor} strokeWidth="2" />
            <circle cx={half + 4} cy={half - 2} r={3} fill={skin.eyeColor} />
          </svg>
        );
      case 'circle':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={half} cy={half} r={half - 3} fill={skin.color} stroke={skin.glowColor} strokeWidth="2" />
            <circle cx={half + 4} cy={half - 2} r={3} fill={skin.eyeColor} />
          </svg>
        );
      case 'triangle':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <polygon points={`${half},3 ${size-3},${size-3} 3,${size-3}`} fill={skin.color} stroke={skin.glowColor} strokeWidth="2" />
            <circle cx={half + 3} cy={half + 2} r={3} fill={skin.eyeColor} />
          </svg>
        );
      case 'star':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <polygon points={starPoints(half, half, half - 4, (half - 4) * 0.45, 5)} fill={skin.color} stroke={skin.glowColor} strokeWidth="2" />
            <circle cx={half + 2} cy={half - 1} r={2.5} fill={skin.eyeColor} />
          </svg>
        );
      case 'hexagon':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <polygon points={hexPoints(half, half, half - 3)} fill={skin.color} stroke={skin.glowColor} strokeWidth="2" />
            <circle cx={half + 3} cy={half - 1} r={3} fill={skin.eyeColor} />
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x="3" y="3" width={size - 6} height={size - 6} rx="2" fill={skin.color} stroke={skin.glowColor} strokeWidth="2" />
            <rect x={half} y={half - 6} width={8} height={8} rx="1" fill={skin.innerColor} />
            <circle cx={half + 5} cy={half - 3} r={2.5} fill={skin.eyeColor} />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center gap-6 p-4">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <Button variant="neon-outline" size="sm" onClick={onBack}>← Menú</Button>
        <div className="font-display text-lg text-accent">🪙 {gameState.coins}</div>
      </div>

      <h2 className="font-display text-3xl text-primary text-glow-primary">TIENDA DE SKINS</h2>

      {message && <p className="font-body text-sm text-foreground">{message}</p>}

      {/* Rarity tabs */}
      <div className="flex gap-2 flex-wrap justify-center">
        {RARITY_ORDER.map(r => (
          <button
            key={r}
            onClick={() => setSelectedRarity(r)}
            className="px-4 py-2 rounded-md font-display text-xs uppercase tracking-wider transition-all"
            style={{
              backgroundColor: selectedRarity === r ? getRarityColor(r).replace(')', ', 0.2)').replace('hsl(', 'hsla(') : 'transparent',
              border: `1px solid ${getRarityColor(r).replace(')', ', 0.6)').replace('hsl(', 'hsla(')}`,
              color: getRarityColor(r),
              boxShadow: selectedRarity === r ? `0 0 12px ${getRarityColor(r).replace(')', ', 0.3)').replace('hsl(', 'hsla(')}` : 'none',
            }}
          >
            {getRarityLabel(r)}
          </button>
        ))}
      </div>

      {/* Skin grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {filteredSkins.map(skin => {
          const owned = gameState.ownedSkins.includes(skin.id);
          const equipped = gameState.activeSkin === skin.id;
          const canAfford = gameState.coins >= skin.price;

          return (
            <div
              key={skin.id}
              className="rounded-lg p-4 flex flex-col items-center gap-2 transition-all hover:scale-105"
              style={{
                backgroundColor: 'hsla(240,10%,12%,0.8)',
                border: `1px solid ${equipped ? skin.glowColor : getRarityColor(skin.rarity).replace(')', ', 0.3)').replace('hsl(', 'hsla(')}`,
                boxShadow: equipped ? `0 0 20px ${skin.glowColor.replace(')', ', 0.4)').replace('hsl(', 'hsla(')}` : 'none',
              }}
            >
              <div className="w-16 h-16 flex items-center justify-center">
                {drawSkinPreview(skin, 56)}
              </div>
              <p className="font-display text-xs text-center" style={{ color: getRarityColor(skin.rarity) }}>
                {skin.name}
              </p>
              
              {equipped ? (
                <span className="font-body text-xs text-primary">✅ Equipada</span>
              ) : owned ? (
                <Button variant="neon-outline" size="sm" onClick={() => handleEquip(skin)} className="text-xs w-full">
                  Equipar
                </Button>
              ) : (
                <Button
                  variant="neon" size="sm"
                  onClick={() => handleBuy(skin)}
                  disabled={!canAfford}
                  className="text-xs w-full"
                >
                  🪙 {skin.price}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

export default SkinShop;
