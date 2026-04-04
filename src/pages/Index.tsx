import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import GameCanvas from '@/components/GameCanvas';
import MusicSearch from '@/components/MusicSearch';
import AudioPlayer, { AudioPlayerHandle } from '@/components/AudioPlayer';
import LevelSelector from '@/components/LevelSelector';
import { generateLevel, LevelData } from '@/lib/levelGenerator';
import { LyricsResult, SyncedLyricLine } from '@/lib/lrclib';

type GameScreen = 'menu' | 'levels' | 'music' | 'playing';

const Index: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [selectedLevel, setSelectedLevel] = useState<LevelData | null>(null);
  const [lyrics, setLyrics] = useState<SyncedLyricLine[]>([]);
  const [lyricsInfo, setLyricsInfo] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicTime, setMusicTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const [maxUnlocked, setMaxUnlocked] = useState(() => {
    const saved = localStorage.getItem('gd_max_level');
    return saved ? parseInt(saved) : 100;
  });
  const [attempts, setAttempts] = useState(0);
  const [songName, setSongName] = useState('');
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);

  const handleSelectLevel = (levelNum: number) => {
    const level = generateLevel(levelNum);
    setSelectedLevel(level);
    setScreen('music');
    setAttempts(0);
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

  const handleDeath = useCallback(() => setAttempts(prev => prev + 1), []);

  const handleComplete = useCallback(() => {
    if (selectedLevel) {
      const nextLevel = selectedLevel.id + 1;
      if (nextLevel > maxUnlocked) {
        setMaxUnlocked(nextLevel);
        localStorage.setItem('gd_max_level', String(nextLevel));
      }
    }
  }, [selectedLevel, maxUnlocked]);

  const handleRestart = useCallback(() => {
    audioPlayerRef.current?.restart();
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
  const handleResumeMusic = useCallback(() => {
    audioPlayerRef.current?.resume();
    setIsPlaying(true);
  }, []);

  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center gap-8 p-4">
        <div className="text-center">
          <h1 className="font-display text-5xl sm:text-7xl font-black text-primary text-glow-primary tracking-wider">GEOMETRY</h1>
          <h1 className="font-display text-5xl sm:text-7xl font-black text-secondary text-glow-secondary tracking-wider -mt-2">DASH</h1>
          <p className="font-body text-muted-foreground mt-4 text-lg">100 niveles · Tu MP3 · Letras sincronizadas</p>
        </div>
        <div className="flex flex-col gap-3 w-64">
          <Button variant="neon" size="lg" onClick={() => setScreen('levels')}>▶ JUGAR</Button>
          <Button variant="neon-outline" size="lg" onClick={() => handleSelectLevel(1)}>NIVEL 1</Button>
        </div>
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
        <Button variant="neon-outline" size="sm" onClick={() => setScreen('menu')} className="self-start">← Menú</Button>
        <LevelSelector onSelectLevel={handleSelectLevel} maxUnlocked={maxUnlocked} />
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
        <Button variant="neon-outline" size="sm" onClick={() => { setScreen('music'); setIsPlaying(false); }}>
          ← Cambiar canción
        </Button>
        <div className="text-right">
          <span className="font-display text-sm text-primary">{selectedLevel?.name}</span>
          <span className="font-body text-xs text-muted-foreground ml-3">Intentos: {attempts}</span>
        </div>
      </div>

      {songName && <p className="font-body text-sm text-muted-foreground">🎵 {songName}</p>}
      {lyricsInfo && <p className="font-body text-xs text-muted-foreground">{lyricsInfo}</p>}

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
