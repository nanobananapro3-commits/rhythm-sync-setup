import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onDurationLoaded: (duration: number) => void;
  shouldPlay: boolean;
}

export interface AudioPlayerHandle {
  restart: () => void;
  pause: () => void;
  resume: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(({
  audioUrl, onTimeUpdate, onPlay, onPause, onDurationLoaded, shouldPlay,
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    restart: () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    },
    pause: () => {
      if (audioRef.current) audioRef.current.pause();
    },
    resume: () => {
      if (audioRef.current) audioRef.current.play().catch(() => {});
    },
  }));

  const startTracking = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (audioRef.current) {
        onTimeUpdate(audioRef.current.currentTime);
      }
    }, 100);
  }, [onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => { onPlay(); startTracking(); };
    const handlePause = () => { onPause(); clearInterval(intervalRef.current); };
    const handleEnded = () => { onPause(); clearInterval(intervalRef.current); };
    const handleMeta = () => {
      if (audio.duration && isFinite(audio.duration)) {
        onDurationLoaded(audio.duration);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleMeta);
    audio.addEventListener('durationchange', handleMeta);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleMeta);
      audio.removeEventListener('durationchange', handleMeta);
      clearInterval(intervalRef.current);
    };
  }, [onPlay, onPause, startTracking, onDurationLoaded]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (shouldPlay) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [shouldPlay]);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md">
      <audio
        ref={audioRef}
        src={audioUrl}
        controls
        className="w-full rounded-lg"
      />
      <p className="text-muted-foreground text-xs font-body">
        Dale play para empezar 🎮
      </p>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
