import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchLyrics, LyricsResult } from '@/lib/lrclib';

interface MusicSearchProps {
  onSongSelect: (artist: string, title: string, lyrics: LyricsResult, audioUrl: string) => void;
}

const MIN_DURATION = 120; // 2 minutes
const MAX_DURATION = 300; // 5 minutes

const MusicSearch: React.FC<MusicSearchProps> = ({ onSongSelect }) => {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const validateAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const dur = audio.duration;
        if (!isFinite(dur)) {
          reject(new Error('No se pudo leer la duración del archivo'));
          return;
        }
        if (dur < MIN_DURATION) {
          reject(new Error(`La canción es muy corta (${Math.round(dur)}s). Mínimo ${MIN_DURATION / 60} minutos.`));
          return;
        }
        if (dur > MAX_DURATION) {
          reject(new Error(`La canción es muy larga (${Math.round(dur / 60)}min). Máximo ${MAX_DURATION / 60} minutos.`));
          return;
        }
        resolve(dur);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo leer el archivo de audio'));
      };
    });
  };

  const handleFileChange = async (file: File | null) => {
    setError('');
    if (!file) {
      setAudioFile(null);
      return;
    }
    try {
      await validateAudioDuration(file);
      setAudioFile(file);
    } catch (err: any) {
      setAudioFile(null);
      setError(err.message);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSearch = async () => {
    if (!artist.trim() || !title.trim()) {
      setError('Ingresa artista y título');
      return;
    }
    if (!audioFile) {
      setError('Selecciona un archivo MP3 (2-5 minutos)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const lyrics = await searchLyrics(artist.trim(), title.trim());
      const audioUrl = URL.createObjectURL(audioFile);
      onSongSelect(artist.trim(), title.trim(), lyrics, audioUrl);
    } catch {
      setError('Error buscando letras. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Artista (ej: Bad Bunny)"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-muted border-border font-body text-foreground placeholder:text-muted-foreground"
        />
        <Input
          placeholder="Título de la canción"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-muted border-border font-body text-foreground placeholder:text-muted-foreground"
        />
        
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button
            variant="neon-outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="w-full"
          >
            {audioFile ? `🎵 ${audioFile.name}` : '📁 Seleccionar MP3 (2-5 min)'}
          </Button>
          <p className="text-muted-foreground text-xs text-center font-body">Duración: mínimo 2 min, máximo 5 min</p>
        </div>
      </div>

      <Button
        variant="neon"
        onClick={handleSearch}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Buscando letras...' : '🎵 Buscar Letras y Jugar'}
      </Button>

      {error && (
        <p className="text-destructive text-sm text-center font-body">{error}</p>
      )}
    </div>
  );
};

export default MusicSearch;
