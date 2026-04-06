import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import GameCanvas from '@/components/GameCanvas';
import MusicSearch from '@/components/MusicSearch';
import AudioPlayer, { AudioPlayerHandle } from '@/components/AudioPlayer';
import LevelSelector from '@/components/LevelSelector';
import SkinShop from '@/components/SkinShop';
import { generateLevel, LevelData } from '@/lib/levelGenerator';
import { LyricsResult, SyncedLyricLine } from '@/lib/lrclib';
import { GameState, calculateStars, calculateCoinsEarned, getActiveSkin } from '@/lib/gameState';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

type GameScreen = 'platform-select' | 'menu' | 'levels' | 'music' | 'playing' | 'shop';
type PlatformMode = 'pc' | 'mobile';

const MAX_CONTINUES = 3;

const Index: React.FC = () => {
  const { user, signOut } = useAuth();
  const { gameState, setGameState: saveGameState, loading: profileLoading } = useProfile(user?.id);
  const [screen, setScreen] = useState<GameScreen>('platform-select');
  const [platformMode, setPlatformMode] = useState<PlatformMode>('pc');
  const [selectedLevel, setSelectedLevel] = useState<LevelData | null>(null);
  const [lyrics, setLyrics] = useState<SyncedLyricLine[]>([]);
  const [lyricsInfo, setLyricsInfo] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicTime, setMusicTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [songName, setSongName] = useState('');
  const [completionInfo, setCompletionInfo] = useState<{ stars: number; coins: number } | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const livesRemainingRef = useRef(MAX_CONTINUES);

  const handleSelectLevel = (levelNum: number) => {
    const level = generateLevel(levelNum);
    setSelectedLevel(level);
    setScreen('music');
    setAttempts(0);
    livesRemainingRef.current = MAX_CONTINUES;
    setCompletionInfo(null);
  };

  const handleSongSelect = (artist: string, title: string, result: LyricsResult, url: string) => {
    setLyrics(result.syncedLyrics);
    setAudioUrl(url);
    setSongName(`${artist} - ${title}`);
    setLyricsInfo(
      result.found
        ? result.syncedLyrics.length > 0
          ? `✅ Letras sincronizadas (${result.syncedLyrics.length} líneas)`
          : '⚠️ Letras sin sincronización temporal'
        : '❌ No se encontraron letras'
    );
    setScreen('playing');
  };

  const handleDeath = useCallback(() => {
    setAttempts(prev => prev + 1);
    livesRemainingRef.current = Math.max(0, livesRemainingRef.current - 1);
  }, []);

  const handleComplete = useCallback(() => {
    if (!selectedLevel) return;
    const levelNum = selectedLevel.id;
    const lives = livesRemainingRef.current;
    const stars = calculateStars(lives);
    const previousStars = gameState.levelProgress[levelNum]?.stars || 0;
    const coinsEarned = calculateCoinsEarned(levelNum, stars, previousStars);

    const newState: GameState = { ...gameState };

    // Update level progress (only if better)
    if (stars > previousStars) {
      newState.levelProgress = {
        ...newState.levelProgress,
        [levelNum]: { stars, completed: true },
      };
    } else if (!newState.levelProgress[levelNum]?.completed) {
      newState.levelProgress = {
        ...newState.levelProgress,
        [levelNum]: { stars: Math.max(stars, previousStars), completed: true },
      };
    }

    // Unlock next level
    const nextLevel = levelNum + 1;
    if (nextLevel > newState.maxUnlocked && nextLevel <= 100) {
      newState.maxUnlocked = nextLevel;
    }

    // Add coins
    newState.coins += coinsEarned;

    saveGameState(newState);
    setCompletionInfo({ stars, coins: coinsEarned });
  }, [selectedLevel, gameState]);

  const handleRestart = useCallback(() => {
    audioPlayerRef.current?.restart();
    livesRemainingRef.current = MAX_CONTINUES;
    setMusicTime(0);
    setCompletionInfo(null);
  }, []);

  const handleProgressChange = useCallback((p: number) => void p, []);
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleTimeUpdate = useCallback((time: number) => setMusicTime(time), []);
  const handleDurationLoaded = useCallback((dur: number) => setSongDuration(dur), []);
  const handlePauseMusic = useCallback(() => {
    audioPlayerRef.current?.pause();
    setIsPlaying(false);
  }, []);
  const handleResumeMusic = useCallback((time?: number) => {
    if (typeof time === 'number') {
      audioPlayerRef.current?.seekTo(time);
      setMusicTime(time);
    }
    audioPlayerRef.current?.resume();
    setIsPlaying(true);
  }, []);

  const activeSkin = getActiveSkin(gameState);

  if (screen === 'shop') {
    return (
      <SkinShop
        gameState={gameState}
        onStateChange={saveGameState}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'platform-select') {
    return (
      <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center gap-8 p-4">
        <div className="text-center">
          <h1 className="font-display text-5xl sm:text-7xl font-black text-primary text-glow-primary tracking-wider">GEOMETRY</h1>
          <h1 className="font-display text-5xl sm:text-7xl font-black text-accent tracking-wider -mt-2">MUSIC</h1>
          <h1 className="font-display text-5xl sm:text-7xl font-black text-secondary text-glow-secondary tracking-wider -mt-2">DASH</h1>
          <p className="font-body text-muted-foreground mt-6 text-lg">¿Cómo vas a jugar?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-72 sm:w-auto">
          <Button variant="neon" size="lg" className="text-xl px-8 py-6" onClick={() => { setPlatformMode('pc'); setScreen('menu'); }}>
            🖥️ PC
          </Button>
          <Button variant="neon-secondary" size="lg" className="text-xl px-8 py-6" onClick={() => { setPlatformMode('mobile'); setScreen('menu'); }}>
            📱 Móvil
          </Button>
        </div>
      </div>
    );
  }

  if (screen === 'menu') {
      <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center gap-8 p-4">
        <div className="text-center">
          <h1 className="font-display text-5xl sm:text-7xl font-black text-primary text-glow-primary tracking-wider">GEOMETRY</h1>
          <h1 className="font-display text-5xl sm:text-7xl font-black text-accent tracking-wider -mt-2">MUSIC</h1>
          <h1 className="font-display text-5xl sm:text-7xl font-black text-secondary text-glow-secondary tracking-wider -mt-2">DASH</h1>
          <p className="font-body text-muted-foreground mt-4 text-lg">100 niveles · Tu MP3 · Letras sincronizadas</p>
          <p className="font-display text-accent mt-2">🪙 {gameState.coins} monedas</p>
          <p className="font-body text-muted-foreground text-xs mt-1">{user ? user.email : '👤 Modo invitado'}</p>
        </div>
        <div className="flex flex-col gap-3 w-64">
          <Button variant="neon" size="lg" onClick={() => setScreen('levels')}>▶ JUGAR</Button>
          <Button variant="neon-outline" size="lg" onClick={() => handleSelectLevel(1)}>NIVEL 1</Button>
          <Button variant="neon-secondary" size="lg" onClick={() => setScreen('shop')}>🛒 TIENDA</Button>
          {user && <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">Cerrar sesión</Button>}
          {!user && (
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/auth'} className="text-accent">
              Registrarse / Iniciar sesión
            </Button>
          )}
        </div>
        {!user && (
          <p className="text-xs text-destructive font-body animate-pulse max-w-xs text-center">
            ⚠️ Tu progreso no se guardará si sales. ¡Regístrate para guardar!
          </p>
        )}
        <div className="text-center text-muted-foreground text-sm font-body mt-8 max-w-md">
          <p>Espacio / Click / Toque para saltar</p>
          <p className="mt-1">Sube tu MP3 (2-5 min) y juega al ritmo 🎵</p>
        </div>
      </div>
    );
  }

  if (screen === 'levels') {
    return (
      <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-full max-w-4xl flex items-center justify-between">
          <Button variant="neon-outline" size="sm" onClick={() => setScreen('menu')}>← Menú</Button>
          <span className="font-display text-sm text-accent">🪙 {gameState.coins}</span>
        </div>
        <LevelSelector onSelectLevel={handleSelectLevel} gameState={gameState} />
      </div>
    );
  }

  if (screen === 'music') {
    return (
      <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center gap-6 p-4">
        <Button variant="neon-outline" size="sm" onClick={() => setScreen('levels')} className="self-start">← Niveles</Button>
        <div className="text-center">
          <h2 className="font-display text-2xl text-primary text-glow-primary">{selectedLevel?.name}</h2>
          <p className="font-body text-muted-foreground mt-1">Nivel {selectedLevel?.id}</p>
        </div>
        <div className="text-center">
          <h3 className="font-display text-lg text-foreground mb-4">Sube tu MP3 y busca las letras</h3>
          <MusicSearch onSongSelect={handleSongSelect} />
        </div>
        <Button
          variant="neon-secondary"
          onClick={() => {
            setLyrics([]);
            setAudioUrl('');
            setSongName('Sin música');
            setSongDuration(300);
            setLyricsInfo('');
            setScreen('playing');
          }}
        >
          Jugar sin música
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-[800px] flex items-center justify-between">
        <Button variant="neon-outline" size="sm" onClick={() => { setScreen('music'); setIsPlaying(false); setCompletionInfo(null); }}>
          ← Cambiar canción
        </Button>
        <div className="text-right flex items-center gap-3">
          <span className="font-display text-xs text-accent">🪙 {gameState.coins}</span>
          <span className="font-display text-sm text-primary">{selectedLevel?.name}</span>
          <span className="font-body text-xs text-muted-foreground">Intentos: {attempts}</span>
        </div>
      </div>

      {songName && <p className="font-body text-sm text-muted-foreground">🎵 {songName}</p>}
      {lyricsInfo && <p className="font-body text-xs text-muted-foreground">{lyricsInfo}</p>}

      {completionInfo && (
        <div className="text-center p-3 rounded-lg neon-border">
          <p className="font-display text-lg text-primary">
            {[1, 2, 3].map(i => (
              <span key={i} style={{ color: i <= completionInfo.stars ? 'hsl(45,100%,55%)' : 'hsla(0,0%,100%,0.15)', fontSize: '24px' }}>★</span>
            ))}
          </p>
          {completionInfo.coins > 0 && (
            <p className="font-display text-sm text-accent mt-1">+{completionInfo.coins} 🪙</p>
          )}
          {completionInfo.coins === 0 && (
            <p className="font-body text-xs text-muted-foreground mt-1">Ya obtuviste estas estrellas</p>
          )}
        </div>
      )}

      {selectedLevel && (
        <GameCanvas
          level={selectedLevel}
          lyrics={lyrics}
          isPlaying={isPlaying || !audioUrl}
          musicTime={musicTime}
          songDuration={songDuration}
          onDeath={handleDeath}
          onComplete={handleComplete}
          onProgressChange={handleProgressChange}
          onRestart={handleRestart}
          onPauseMusic={handlePauseMusic}
          onResumeMusic={handleResumeMusic}
          skinColor={activeSkin.color}
          skinGlowColor={activeSkin.glowColor}
          skinInnerColor={activeSkin.innerColor}
          skinEyeColor={activeSkin.eyeColor}
          skinShape={activeSkin.shape}
        />
      )}

      {audioUrl && (
        <AudioPlayer
          ref={audioPlayerRef}
          audioUrl={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onDurationLoaded={handleDurationLoaded}
          shouldPlay={isPlaying}
        />
      )}

      {!audioUrl && (
        <p className="text-muted-foreground font-body text-sm">Modo sin música — Click o Espacio para saltar</p>
      )}
    </div>
  );
};

export default Index;
