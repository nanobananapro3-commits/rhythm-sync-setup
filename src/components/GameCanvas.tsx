import React, { useRef, useEffect, useCallback, useState } from 'react';
import { LevelData, Obstacle } from '@/lib/levelGenerator';
import { SyncedLyricLine } from '@/lib/lrclib';

interface GameCanvasProps {
  level: LevelData;
  lyrics: SyncedLyricLine[];
  isPlaying: boolean;
  musicTime: number;
  songDuration: number;
  onDeath: () => void;
  onComplete: () => void;
  onProgressChange: (progress: number) => void;
  onRestart?: () => void;
  onPauseMusic?: () => void;
  onResumeMusic?: (time?: number) => void;
  skinColor?: string;
  skinGlowColor?: string;
  skinInnerColor?: string;
  skinEyeColor?: string;
  skinShape?: 'square' | 'diamond' | 'circle' | 'triangle' | 'star' | 'hexagon';
}

interface PlayerState {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  isGrounded: boolean;
  isDead: boolean;
  mode: 'normal' | 'ball' | 'airplane';
  isImmortal: boolean;
  immortalTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'death' | 'trail' | 'confetti' | 'ground' | 'ambient';
}

const PLAYER_SIZE = 28;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const MAX_CONTINUES = 3;
const FPS = 60;
const BASE_DURATION = 300;

const GameCanvas: React.FC<GameCanvasProps> = ({
  level, lyrics, isPlaying, musicTime, songDuration, onDeath, onComplete, onProgressChange, onRestart, onPauseMusic, onResumeMusic,
  skinColor, skinGlowColor, skinInnerColor, skinEyeColor, skinShape = 'square',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<PlayerState>({
    x: 100, y: level.groundY - PLAYER_SIZE, vy: 0, rotation: 0,
    isGrounded: true, isDead: false, mode: 'normal', isImmortal: false, immortalTimer: 0,
  });
  const cameraXRef = useRef(0);
  const jumpingRef = useRef(false);
  const animFrameRef = useRef(0);
  const continuesUsedRef = useRef(0);
  const gameOverRef = useRef(false);
  const completedRef = useRef(false);
  const sawRotationRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const [currentLyric, setCurrentLyric] = useState('');
  const [uiState, setUiState] = useState<'playing' | 'dead' | 'gameover' | 'complete'>('playing');

  const effectiveDuration = songDuration > 0 ? songDuration : BASE_DURATION;
  const scaleFactor = effectiveDuration / BASE_DURATION;
  
  const scaledObstacles = useRef<Obstacle[]>([]);
  const scaledLength = useRef(level.length);
  
  useEffect(() => {
    scaledObstacles.current = level.obstacles.map(obs => ({
      ...obs, x: obs.x * scaleFactor,
    }));
    scaledLength.current = effectiveDuration * level.speed * FPS;
  }, [level, scaleFactor, effectiveDuration]);

  useEffect(() => {
    if (lyrics.length === 0) return;
    let current = '';
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (musicTime >= lyrics[i].time) { current = lyrics[i].text; break; }
    }
    setCurrentLyric(current);
  }, [musicTime, lyrics]);

  const handleInput = useCallback((pressed: boolean) => { jumpingRef.current = pressed; }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') { e.preventDefault(); handleInput(true); }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') handleInput(false);
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [handleInput]);

  useEffect(() => {
    const p = playerRef.current;
    p.x = 100; p.y = level.groundY - PLAYER_SIZE; p.vy = 0; p.rotation = 0;
    p.isGrounded = true; p.isDead = false; p.mode = 'normal'; p.isImmortal = false; p.immortalTimer = 0;
    cameraXRef.current = 0; continuesUsedRef.current = 0;
    gameOverRef.current = false; completedRef.current = false;
    particlesRef.current = [];
    setUiState('playing');
  }, [level]);

  // Get interpolated color based on progress through level (color zones)
  const getZoneColors = (progress: number) => {
    const zones = level.colorZones;
    if (!zones || zones.length === 0) {
      return { color: level.color, bgColor: level.bgColor, accentColor: level.accentColor, pulseColor: level.pulseColor };
    }
    // Find current zone
    for (let i = zones.length - 1; i >= 0; i--) {
      if (progress >= zones[i].start) {
        return {
          color: zones[i].color,
          bgColor: zones[i].bgColor,
          accentColor: zones[i].accentColor,
          pulseColor: zones[i].pulseColor,
        };
      }
    }
    return { color: level.color, bgColor: level.bgColor, accentColor: level.accentColor, pulseColor: level.pulseColor };
  };

  // Particle helpers
  const spawnDeathParticles = (px: number, py: number, color: string, accent: string, pulse: string) => {
    const colors = [color, accent, pulse, 'hsl(0,100%,65%)'];
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 6;
      particlesRef.current.push({
        x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        life: 1, maxLife: 40 + Math.random() * 30, size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)], type: 'death',
      });
    }
  };

  const spawnConfetti = (color: string, accent: string, pulse: string) => {
    const colors = [color, accent, pulse, 'hsl(45,100%,70%)', 'hsl(280,100%,65%)'];
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push({
        x: Math.random() * CANVAS_WIDTH, y: -10 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 4, vy: 1 + Math.random() * 3,
        life: 1, maxLife: 120 + Math.random() * 60, size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)], type: 'confetti',
      });
    }
  };

  const spawnTrailParticle = (px: number, py: number, color: string) => {
    particlesRef.current.push({
      x: px - 5, y: py + PLAYER_SIZE / 2 + (Math.random() - 0.5) * 10,
      vx: -1 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.5,
      life: 1, maxLife: 15 + Math.random() * 10, size: 2 + Math.random() * 3,
      color, type: 'trail',
    });
  };

  const spawnGroundParticle = (px: number, py: number, color: string) => {
    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        x: px + Math.random() * PLAYER_SIZE, y: py + PLAYER_SIZE,
        vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2,
        life: 1, maxLife: 12 + Math.random() * 8, size: 1.5 + Math.random() * 2,
        color, type: 'ground',
      });
    }
  };

  const spawnAmbientParticle = (color: string, pulse: string) => {
    const colors = [color, pulse];
    particlesRef.current.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * (level.groundY - 40),
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.2 - Math.random() * 0.5,
      life: 1, maxLife: 80 + Math.random() * 120,
      size: 1 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: 'ambient',
    });
  };

  const updateParticles = () => {
    const ps = particlesRef.current;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= 1 / p.maxLife;
      if (p.type === 'death') p.vy += 0.15;
      if (p.type === 'confetti') { p.vy += 0.02; p.vx *= 0.99; }
      if (p.type === 'ambient') { p.vx += (Math.random() - 0.5) * 0.05; }
      if (p.life <= 0) ps.splice(i, 1);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawSpike = (x: number, y: number, w: number, h: number, color?: string) => {
      ctx.fillStyle = color || ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(x, y + h); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + h);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'hsla(0,0%,100%,0.15)';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y + h); ctx.lineTo(x + w / 2, y + h * 0.3); ctx.lineTo(x + w * 0.5, y + h);
      ctx.closePath(); ctx.fill();
    };

    const drawSaw = (cx: number, cy: number, r: number, rotation: number) => {
      const teeth = 8;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const angle = (i / (teeth * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? r : r * 0.65;
        const px = Math.cos(angle) * rad, py = Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = level.bgColor; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = level.accentColor || level.color; ctx.fill();
      ctx.restore();
    };

    const checkCollision = (px: number, py: number, obs: Obstacle): boolean => {
      if (obs.type === 'gap') {
        return px + PLAYER_SIZE > obs.x && px < obs.x + obs.width && py + PLAYER_SIZE >= level.groundY;
      }
      if (obs.type === 'platform' || obs.type === 'orb' || obs.type === 'solid-platform' ||
          obs.type === 'mushroom' || obs.type === 'mode-ball' || obs.type === 'mode-airplane' || obs.type === 'mode-normal') return false;

      let obsY: number;
      if (obs.type === 'laser' || obs.type === 'pulse-laser') {
        obsY = level.groundY + (obs.y || -60);
      } else if (obs.type === 'ceiling-spike') {
        obsY = obs.y !== undefined ? level.groundY + obs.y : 0;
      } else if (obs.type === 'vertical-saw') {
        const sawY = obs.y !== undefined ? level.groundY + obs.y + obs.height / 2 : level.groundY - obs.height / 2;
        const cx = obs.x + obs.width / 2, cy = sawY;
        const dist = Math.sqrt((px + PLAYER_SIZE / 2 - cx) ** 2 + (py + PLAYER_SIZE / 2 - cy) ** 2);
        return dist < obs.width / 2 + PLAYER_SIZE / 2 - 4;
      } else if (obs.type === 'hammer') {
        obsY = level.groundY - obs.height;
      } else {
        obsY = obs.y !== undefined ? level.groundY + obs.y : level.groundY - obs.height;
      }

      if (obs.type === 'spike' || obs.type === 'tall-spike' || obs.type === 'double-spike' ||
          obs.type === 'triple-spike' || obs.type === 'wave-spike' || obs.type === 'ceiling-spike') {
        const m = 6;
        return px + PLAYER_SIZE - m > obs.x + m && px + m < obs.x + obs.width - m &&
               py + PLAYER_SIZE - m > obsY + m && py + m < obsY + obs.height - m;
      }
      if (obs.type === 'saw') {
        const sawY = obs.y !== undefined ? level.groundY + obs.y + obs.height / 2 : level.groundY - obs.height / 2;
        const cx = obs.x + obs.width / 2, cy = sawY;
        const dist = Math.sqrt((px + PLAYER_SIZE / 2 - cx) ** 2 + (py + PLAYER_SIZE / 2 - cy) ** 2);
        return dist < obs.width / 2 + PLAYER_SIZE / 2 - 4;
      }
      if (obs.type === 'laser' || obs.type === 'pulse-laser') {
        return px + PLAYER_SIZE > obs.x && px < obs.x + obs.width &&
               py + PLAYER_SIZE > obsY && py < obsY + obs.height + 6;
      }
      if (obs.type === 'hammer') {
        return px + PLAYER_SIZE > obs.x && px < obs.x + obs.width &&
               py + PLAYER_SIZE > obsY && py < obsY + obs.height;
      }
      if (obs.type === 'vanishing-block') {
        return false; // Handled separately as a landing platform
      }
      if (obs.type === 'pillar') {
        return px + PLAYER_SIZE > obs.x && px < obs.x + obs.width &&
               py + PLAYER_SIZE > level.groundY - obs.height && py < level.groundY;
      }
      return px + PLAYER_SIZE > obs.x && px < obs.x + obs.width &&
             py + PLAYER_SIZE > obsY && py < obsY + obs.height;
    };

    const handlePlayerDeath = () => {
      const p = playerRef.current;
      const cam = cameraXRef.current;
      const levelLen = scaledLength.current;
      const progress = Math.min(cam / levelLen, 1);
      const zc = getZoneColors(progress);
      const screenX = p.x - cam;
      spawnDeathParticles(screenX + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2, zc.color, zc.accentColor, zc.pulseColor);
      onDeath();
      onPauseMusic?.();
      if (continuesUsedRef.current >= MAX_CONTINUES) {
        gameOverRef.current = true; setUiState('gameover');
      } else {
        setUiState('dead');
      }
    };

    const gameLoop = () => {
      const player = playerRef.current;
      const obstacles = scaledObstacles.current;
      const levelLen = scaledLength.current;
      frameCountRef.current++;
      sawRotationRef.current += 0.08;

      updateParticles();

      const progress = Math.min(cameraXRef.current / levelLen, 1);
      const zc = getZoneColors(progress);

      // Ambient particles
      if (frameCountRef.current % 8 === 0) {
        spawnAmbientParticle(zc.color, zc.pulseColor);
      }

      if (!isPlaying || player.isDead || gameOverRef.current || completedRef.current) {
        if (completedRef.current && frameCountRef.current % 5 === 0) spawnConfetti(zc.color, zc.accentColor, zc.pulseColor);
        render();
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Immortality timer
      if (player.isImmortal) {
        player.immortalTimer--;
        if (player.immortalTimer <= 0) {
          player.isImmortal = false;
        }
      }

      // Mode switches
      for (const obs of obstacles) {
        if (Math.abs(obs.x - player.x) > 50) continue;
        if (obs.type === 'mode-ball') player.mode = 'ball';
        else if (obs.type === 'mode-airplane') player.mode = 'airplane';
        else if (obs.type === 'mode-normal') player.mode = 'normal';
        else if (obs.type === 'mushroom' && !player.isImmortal) {
          player.isImmortal = true;
          player.immortalTimer = 300; // 5 seconds at 60fps
        }
      }

      // Physics based on mode
      if (player.mode === 'airplane') {
        // Airplane: hold to go up, release to go down
        if (jumpingRef.current) {
          player.vy = Math.max(player.vy - 0.8, -5);
        } else {
          player.vy = Math.min(player.vy + 0.4, 4);
        }
        player.y += player.vy;
        player.isGrounded = false;
        // Clamp to screen
        if (player.y < 10) { player.y = 10; player.vy = 0; }
        if (player.y >= level.groundY - PLAYER_SIZE) {
          player.y = level.groundY - PLAYER_SIZE; player.vy = 0;
        }
        player.rotation += 2;
      } else if (player.mode === 'ball') {
        // Ball: click to flip gravity
        if (jumpingRef.current && player.isGrounded) {
          player.vy = level.jumpForce * 0.8;
          player.isGrounded = false;
        }
        player.vy += level.gravity; player.y += player.vy;
        player.rotation += 8;
      } else {
        // Normal mode
        if (jumpingRef.current && player.isGrounded) {
          player.vy = level.jumpForce; player.isGrounded = false;
        }
        player.vy += level.gravity; player.y += player.vy;
        if (!player.isGrounded) player.rotation += 5;
        else player.rotation = Math.round(player.rotation / 90) * 90;
      }

      const wasInAir = !player.isGrounded;
      if (player.y >= level.groundY - PLAYER_SIZE) {
        player.y = level.groundY - PLAYER_SIZE; player.vy = 0; player.isGrounded = true;
      }
      if (player.y < 0) { player.y = 0; player.vy = 0; }

      if (wasInAir && player.isGrounded && player.mode !== 'airplane') {
        spawnGroundParticle(player.x - cameraXRef.current, player.y, zc.accentColor);
      }

      cameraXRef.current += level.speed;
      player.x = cameraXRef.current + 100;

      onProgressChange(progress);

      if (cameraXRef.current >= levelLen) {
        completedRef.current = true; setUiState('complete');
        spawnConfetti(zc.color, zc.accentColor, zc.pulseColor); onComplete(); return;
      }

      // Trail particles
      if (frameCountRef.current % 2 === 0) {
        spawnTrailParticle(player.x - cameraXRef.current, player.y, player.isImmortal ? 'hsl(45,100%,60%)' : zc.color);
      }

      // Platform & solid-platform landings + ceiling collisions
      for (const obs of obstacles) {
        if (obs.type !== 'platform' && obs.type !== 'solid-platform' && obs.type !== 'block' && obs.type !== 'moving-block' && obs.type !== 'pillar' && obs.type !== 'vanishing-block') continue;
        if (Math.abs(obs.x - player.x) > 200) continue;
        
        if (obs.type === 'platform' || obs.type === 'solid-platform' || obs.type === 'vanishing-block') {
          const platY = level.groundY + (obs.y || -80);
          // Landing on top
          if (player.x + PLAYER_SIZE > obs.x && player.x < obs.x + obs.width &&
              player.vy >= 0 && player.y + PLAYER_SIZE <= platY + 8 && player.y + PLAYER_SIZE + player.vy >= platY) {
            player.y = platY - PLAYER_SIZE; player.vy = 0; player.isGrounded = true;
          }
          // Ceiling collision (solid platform only - can't pass through from below)
          if (obs.type === 'solid-platform' && player.x + PLAYER_SIZE > obs.x && player.x < obs.x + obs.width &&
              player.vy < 0 && player.y >= platY + obs.height - 5 && player.y + player.vy <= platY + obs.height) {
            player.y = platY + obs.height; player.vy = 0;
          }
        }
      }

      // Collision
      for (const obs of obstacles) {
        if (Math.abs(obs.x - player.x) > 200) continue;
        if (obs.type === 'gap') {
          if (player.x + PLAYER_SIZE > obs.x && player.x < obs.x + obs.width && player.y + PLAYER_SIZE >= level.groundY) {
            if (player.isImmortal) continue;
            player.isDead = true; handlePlayerDeath(); return;
          }
          continue;
        }
        if (obs.type === 'platform' || obs.type === 'orb' || obs.type === 'solid-platform' ||
            obs.type === 'mushroom' || obs.type === 'mode-ball' || obs.type === 'mode-airplane' ||
            obs.type === 'mode-normal' || obs.type === 'vanishing-block') continue;
        if (checkCollision(player.x, player.y, obs)) {
          if ((obs.type === 'block' || obs.type === 'moving-block' || obs.type === 'pillar') && player.vy >= 0) {
            const obsTop = level.groundY - obs.height;
            if (player.y + PLAYER_SIZE <= obsTop + 10) {
              player.y = obsTop - PLAYER_SIZE; player.vy = 0; player.isGrounded = true; continue;
            }
          }
          if (player.isImmortal) continue;
          player.isDead = true; handlePlayerDeath(); return;
        }
      }

      render();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    const render = () => {
      const player = playerRef.current;
      const obstacles = scaledObstacles.current;
      const levelLen = scaledLength.current;
      const cam = cameraXRef.current;
      const fc = frameCountRef.current;
      const progress = Math.min(cam / levelLen, 1);
      const zc = getZoneColors(progress);
      
      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, zc.bgColor);
      bgGrad.addColorStop(1, zc.bgColor.replace('5%', '8%'));
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Animated background pulse
      const pulseAlpha = 0.03 + Math.sin(fc * 0.02) * 0.015;
      ctx.fillStyle = zc.pulseColor.replace(')', `, ${pulseAlpha})`).replace('hsl(', 'hsla(');
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid
      ctx.strokeStyle = zc.color.replace(')', ', 0.05)').replace('hsl(', 'hsla(');
      ctx.lineWidth = 1;
      const gs = 50, ox = cam % gs;
      for (let x = -ox; x < CANVAS_WIDTH; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
      }

      // Parallax dots
      ctx.fillStyle = zc.color.replace(')', ', 0.04)').replace('hsl(', 'hsla(');
      for (let i = 0; i < 15; i++) {
        const bx = ((i * 137 + 50) % CANVAS_WIDTH) - (cam * 0.1) % CANVAS_WIDTH;
        const by = (i * 89 + 30) % (level.groundY - 40);
        ctx.beginPath(); ctx.arc((bx + CANVAS_WIDTH) % CANVAS_WIDTH, by, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }

      // Lyrics
      if (currentLyric) {
        ctx.save();
        ctx.font = 'bold 28px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = zc.color.replace(')', ', 0.7)').replace('hsl(', 'hsla(');
        ctx.shadowColor = zc.color; ctx.shadowBlur = 15;
        ctx.fillText(currentLyric, CANVAS_WIDTH / 2, 80);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Ground
      const groundGrad = ctx.createLinearGradient(0, level.groundY, 0, CANVAS_HEIGHT);
      groundGrad.addColorStop(0, zc.color.replace(')', ', 0.2)').replace('hsl(', 'hsla('));
      groundGrad.addColorStop(1, zc.color.replace(')', ', 0.05)').replace('hsl(', 'hsla('));
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, level.groundY, CANVAS_WIDTH, CANVAS_HEIGHT - level.groundY);
      
      ctx.strokeStyle = zc.color; ctx.lineWidth = 2;
      ctx.shadowColor = zc.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(0, level.groundY); ctx.lineTo(CANVAS_WIDTH, level.groundY); ctx.stroke();
      ctx.strokeStyle = zc.accentColor.replace(')', ', 0.3)').replace('hsl(', 'hsla(');
      ctx.lineWidth = 1; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(0, level.groundY + 3); ctx.lineTo(CANVAS_WIDTH, level.groundY + 3); ctx.stroke();
      ctx.shadowBlur = 0;

      // Obstacles
      for (const obs of obstacles) {
        const sx = obs.x - cam;
        if (sx < -200 || sx > CANVAS_WIDTH + 200) continue;
        
        // Use per-obstacle color or zone color
        const obsColor = obs.color || zc.color;
        const accentCol = zc.accentColor;
        ctx.fillStyle = obsColor.replace(')', ', 0.85)').replace('hsl(', 'hsla(');
        ctx.strokeStyle = obsColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = obsColor; ctx.shadowBlur = 8;

        switch (obs.type) {
          case 'spike':
          case 'tall-spike': {
            const spikeY = obs.y !== undefined ? level.groundY + obs.y : level.groundY - obs.height;
            drawSpike(sx, spikeY, obs.width, obs.height);
            break;
          }
          case 'wave-spike': {
            const waveY = obs.y !== undefined ? level.groundY + obs.y : level.groundY - obs.height;
            ctx.fillStyle = accentCol.replace(')', ', 0.9)').replace('hsl(', 'hsla(');
            ctx.strokeStyle = accentCol;
            drawSpike(sx, waveY, obs.width, obs.height, accentCol.replace(')', ', 0.9)').replace('hsl(', 'hsla('));
            break;
          }
          case 'double-spike': {
            const spikeY = obs.y !== undefined ? level.groundY + obs.y : level.groundY - obs.height;
            drawSpike(sx, spikeY, 30, obs.height);
            drawSpike(sx + 30, spikeY, 30, obs.height);
            break;
          }
          case 'triple-spike': {
            const spikeY = obs.y !== undefined ? level.groundY + obs.y : level.groundY - obs.height;
            for (let i = 0; i < 3; i++) drawSpike(sx + i * 30, spikeY, 30, obs.height);
            break;
          }
          case 'block': case 'moving-block': {
            const by = level.groundY - obs.height;
            const bGrad = ctx.createLinearGradient(sx, by, sx, by + obs.height);
            bGrad.addColorStop(0, obsColor.replace(')', ', 0.9)').replace('hsl(', 'hsla('));
            bGrad.addColorStop(1, obsColor.replace(')', ', 0.5)').replace('hsl(', 'hsla('));
            ctx.fillStyle = bGrad;
            ctx.fillRect(sx, by, obs.width, obs.height);
            ctx.strokeRect(sx, by, obs.width, obs.height);
            ctx.strokeStyle = obsColor.replace(')', ', 0.3)').replace('hsl(', 'hsla(');
            ctx.strokeRect(sx + 3, by + 3, obs.width - 6, obs.height - 6);
            if (obs.width > 35) {
              ctx.beginPath();
              ctx.moveTo(sx + 3, by + 3); ctx.lineTo(sx + obs.width - 3, by + obs.height - 3);
              ctx.moveTo(sx + obs.width - 3, by + 3); ctx.lineTo(sx + 3, by + obs.height - 3);
              ctx.strokeStyle = obsColor.replace(')', ', 0.15)').replace('hsl(', 'hsla(');
              ctx.stroke();
            }
            break;
          }
          case 'pillar': {
            const py = level.groundY - obs.height;
            const pGrad = ctx.createLinearGradient(sx, py, sx + obs.width, py);
            pGrad.addColorStop(0, accentCol.replace(')', ', 0.7)').replace('hsl(', 'hsla('));
            pGrad.addColorStop(0.5, obsColor.replace(')', ', 0.9)').replace('hsl(', 'hsla('));
            pGrad.addColorStop(1, accentCol.replace(')', ', 0.7)').replace('hsl(', 'hsla('));
            ctx.fillStyle = pGrad;
            ctx.fillRect(sx, py, obs.width, obs.height);
            ctx.strokeRect(sx, py, obs.width, obs.height);
            ctx.fillStyle = 'hsla(0, 100%, 50%, 0.3)';
            for (let sy = py; sy < level.groundY; sy += 15) {
              ctx.fillRect(sx, sy, obs.width, 2);
            }
            break;
          }
          case 'saw': {
            const sawY = obs.y !== undefined ? level.groundY + obs.y + obs.height / 2 : level.groundY - obs.height / 2;
            ctx.fillStyle = accentCol.replace(')', ', 0.9)').replace('hsl(', 'hsla(');
            ctx.shadowColor = accentCol; ctx.shadowBlur = 12;
            drawSaw(sx + obs.width / 2, sawY, obs.width / 2, sawRotationRef.current);
            break;
          }
          case 'platform':
          case 'solid-platform': {
            const platY = level.groundY + (obs.y || -80);
            const platformGrad = ctx.createLinearGradient(sx, platY, sx, platY + obs.height);
            platformGrad.addColorStop(0, obsColor.replace(')', ', 0.95)').replace('hsl(', 'hsla('));
            platformGrad.addColorStop(1, accentCol.replace(')', ', 0.65)').replace('hsl(', 'hsla('));
            ctx.fillStyle = platformGrad;
            ctx.fillRect(sx, platY, obs.width, obs.height);
            ctx.strokeStyle = obsColor;
            ctx.strokeRect(sx, platY, obs.width, obs.height);
            ctx.fillStyle = zc.pulseColor.replace(')', ', 0.9)').replace('hsl(', 'hsla(');
            ctx.fillRect(sx + 4, platY + 2, Math.max(obs.width - 8, 0), 2);
            ctx.fillStyle = zc.bgColor.replace(')', ', 0.35)').replace('hsl(', 'hsla(');
            ctx.fillRect(sx + 6, platY + obs.height - 3, Math.max(obs.width - 12, 0), 1);
            break;
          }
          case 'gap':
            ctx.fillStyle = zc.bgColor;
            ctx.fillRect(sx, level.groundY, obs.width, CANVAS_HEIGHT - level.groundY);
            ctx.fillStyle = 'hsla(0, 100%, 50%, 0.6)';
            ctx.fillRect(sx, level.groundY - 4, 4, 4);
            ctx.fillRect(sx + obs.width - 4, level.groundY - 4, 4, 4);
            ctx.fillStyle = 'hsla(0, 0%, 0%, 0.5)';
            ctx.fillRect(sx + 2, level.groundY + 2, obs.width - 4, 20);
            break;
          case 'laser': {
            const ly = level.groundY + (obs.y || -60);
            const laserAlpha = 0.6 + Math.sin(fc * 0.15) * 0.3;
            ctx.fillStyle = `hsla(0, 100%, 55%, ${laserAlpha})`;
            ctx.shadowColor = 'hsl(0, 100%, 55%)'; ctx.shadowBlur = 15;
            ctx.fillRect(sx, ly, obs.width, obs.height);
            ctx.fillStyle = `hsla(0, 100%, 70%, ${laserAlpha * 0.5})`;
            ctx.fillRect(sx, ly - 3, obs.width, obs.height + 6);
            ctx.fillStyle = 'hsl(0, 100%, 70%)';
            ctx.beginPath(); ctx.arc(sx, ly + obs.height / 2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + obs.width, ly + obs.height / 2, 4, 0, Math.PI * 2); ctx.fill();
            break;
          }
          case 'orb': {
            const orbY = level.groundY + (obs.y || -50);
            const orbPulse = 0.8 + Math.sin(fc * 0.1) * 0.2;
            ctx.fillStyle = zc.pulseColor.replace(')', `, ${orbPulse})`).replace('hsl(', 'hsla(');
            ctx.shadowColor = zc.pulseColor;
            ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(sx + obs.width / 2, orbY + obs.height / 2, obs.width / 2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'hsla(0,0%,100%,0.5)';
            ctx.beginPath(); ctx.arc(sx + obs.width / 2, orbY + obs.height / 2, obs.width / 2 - 3, 0, Math.PI * 2); ctx.stroke();
            break;
          }
          case 'ceiling-spike': {
            const csY = obs.y !== undefined ? level.groundY + obs.y : 0;
            ctx.fillStyle = 'hsla(0, 100%, 55%, 0.85)';
            ctx.strokeStyle = 'hsl(0, 100%, 55%)';
            // Draw upside-down spike
            ctx.beginPath();
            ctx.moveTo(sx, csY); ctx.lineTo(sx + obs.width / 2, csY + obs.height); ctx.lineTo(sx + obs.width, csY);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            break;
          }
          case 'mushroom': {
            const mY = obs.y !== undefined ? level.groundY + obs.y : level.groundY - obs.height;
            const pulse = 0.7 + Math.sin(fc * 0.08) * 0.3;
            ctx.fillStyle = `hsla(120, 100%, 50%, ${pulse})`;
            ctx.shadowColor = 'hsl(120, 100%, 50%)'; ctx.shadowBlur = 15;
            // Stem
            ctx.fillRect(sx + obs.width / 2 - 3, mY + obs.height / 2, 6, obs.height / 2);
            // Cap
            ctx.beginPath(); ctx.arc(sx + obs.width / 2, mY + obs.height / 2, obs.width / 2, Math.PI, 0); ctx.fill();
            // Dots
            ctx.fillStyle = 'hsla(0, 0%, 100%, 0.8)';
            ctx.beginPath(); ctx.arc(sx + obs.width / 2 - 4, mY + obs.height / 2 - 3, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + obs.width / 2 + 4, mY + obs.height / 2 - 5, 2, 0, Math.PI * 2); ctx.fill();
            break;
          }
          case 'pulse-laser': {
            const plY = level.groundY + (obs.y || -60);
            const plAlpha = Math.abs(Math.sin(fc * 0.05)) > 0.5 ? 0.8 : 0.1;
            ctx.fillStyle = `hsla(0, 100%, 55%, ${plAlpha})`;
            ctx.shadowColor = 'hsl(0, 100%, 55%)'; ctx.shadowBlur = plAlpha * 15;
            ctx.fillRect(sx, plY, obs.width, obs.height);
            break;
          }
          case 'hammer': {
            const hmY = level.groundY - obs.height;
            const swing = Math.sin(fc * 0.06) * 0.4;
            ctx.save(); ctx.translate(sx + obs.width / 2, hmY); ctx.rotate(swing);
            ctx.fillStyle = accentCol.replace(')', ', 0.9)').replace('hsl(', 'hsla(');
            ctx.fillRect(-3, 0, 6, obs.height * 0.7);
            ctx.fillStyle = obsColor;
            ctx.fillRect(-obs.width / 2, -10, obs.width, 20);
            ctx.restore();
            break;
          }
          case 'vertical-saw': {
            const vsY = obs.y !== undefined ? level.groundY + obs.y + obs.height / 2 : level.groundY - obs.height / 2;
            const bounce = Math.sin(fc * 0.04) * 40;
            ctx.fillStyle = accentCol.replace(')', ', 0.9)').replace('hsl(', 'hsla(');
            ctx.shadowColor = accentCol; ctx.shadowBlur = 10;
            drawSaw(sx + obs.width / 2, vsY + bounce, obs.width / 2, sawRotationRef.current);
            break;
          }
          case 'vanishing-block': {
            const vbY = level.groundY - obs.height;
            const vbAlpha = 0.3 + Math.abs(Math.sin(fc * 0.03)) * 0.6;
            ctx.fillStyle = obsColor.replace(')', `, ${vbAlpha})`).replace('hsl(', 'hsla(');
            ctx.fillRect(sx, vbY, obs.width, obs.height);
            ctx.strokeStyle = obsColor.replace(')', `, ${vbAlpha * 0.7})`).replace('hsl(', 'hsla(');
            ctx.setLineDash([4, 4]); ctx.strokeRect(sx, vbY, obs.width, obs.height); ctx.setLineDash([]);
            break;
          }
          case 'mode-ball': case 'mode-airplane': case 'mode-normal': {
            const portalY = level.groundY - 60;
            const portalPulse = 0.5 + Math.sin(fc * 0.1) * 0.3;
            const portalColor = obs.type === 'mode-ball' ? 'hsl(280, 100%, 60%)' : obs.type === 'mode-airplane' ? 'hsl(180, 100%, 50%)' : 'hsl(120, 100%, 50%)';
            ctx.fillStyle = portalColor.replace(')', `, ${portalPulse})`).replace('hsl(', 'hsla(');
            ctx.shadowColor = portalColor; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(sx + 15, portalY + 30, 18, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'hsla(0,0%,100%,0.6)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(sx + 15, portalY + 30, 18, 0, Math.PI * 2); ctx.stroke();
            const label = obs.type === 'mode-ball' ? '⚽' : obs.type === 'mode-airplane' ? '✈' : '■';
            ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText(label, sx + 15, portalY + 35);
            break;
          }
          default:
            ctx.fillRect(sx, level.groundY - obs.height, obs.width, obs.height);
            break;
        }
        ctx.shadowBlur = 0;
      }

      // Finish line
      const finSx = levelLen - cam;
      if (finSx > -50 && finSx < CANVAS_WIDTH + 50) {
        const sq = 10;
        for (let r = 0; r < Math.ceil(level.groundY / sq); r++) {
          for (let c = 0; c < 4; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? 'hsla(0,0%,100%,0.8)' : 'hsla(0,0%,0%,0.8)';
            ctx.fillRect(finSx + c * sq, r * sq, sq, sq);
          }
        }
        ctx.strokeStyle = zc.color; ctx.lineWidth = 3;
        ctx.shadowColor = zc.color; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.moveTo(finSx, 0); ctx.lineTo(finSx, level.groundY); ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Particles
      const ps = particlesRef.current;
      for (const p of ps) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.type === 'confetti') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.x * 0.1 + fc * 0.05);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else if (p.type === 'trail') {
          ctx.shadowColor = p.color; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else if (p.type === 'ambient') {
          ctx.shadowColor = p.color; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.shadowColor = p.color; ctx.shadowBlur = 4;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;

      // Player
      const spx = player.x - cam;
      const pColor = player.isDead ? 'hsl(0,100%,55%)' : (skinColor || zc.color);
      const pGlow = player.isDead ? 'hsl(0,100%,55%)' : (skinGlowColor || zc.color);
      const pInner = player.isDead ? 'hsl(0,100%,70%)' : (skinInnerColor || 'hsla(0,0%,100%,0.3)');
      const pEye = skinEyeColor || 'hsla(0,0%,100%,0.8)';
      const half = PLAYER_SIZE / 2;
      ctx.save();
      ctx.translate(spx + half, player.y + half);
      ctx.rotate((player.rotation * Math.PI) / 180);
      ctx.shadowColor = pGlow;
      ctx.shadowBlur = 18;
      // Glow outline
      ctx.fillStyle = pColor.replace(')', ', 0.2)').replace('hsl(', 'hsla(');
      ctx.fillRect(-half - 3, -half - 3, PLAYER_SIZE + 6, PLAYER_SIZE + 6);
      // Main shape
      ctx.fillStyle = pColor;
      if (skinShape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, half, 0, Math.PI * 2); ctx.fill();
      } else if (skinShape === 'diamond') {
        ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(half, 0); ctx.lineTo(0, half); ctx.lineTo(-half, 0); ctx.closePath(); ctx.fill();
      } else if (skinShape === 'triangle') {
        ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(half, half); ctx.lineTo(-half, half); ctx.closePath(); ctx.fill();
      } else if (skinShape === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? half : half * 0.45;
          if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
          else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
        ctx.closePath(); ctx.fill();
      } else if (skinShape === 'hexagon') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          if (i === 0) ctx.moveTo(half * Math.cos(angle), half * Math.sin(angle));
          else ctx.lineTo(half * Math.cos(angle), half * Math.sin(angle));
        }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillRect(-half, -half, PLAYER_SIZE, PLAYER_SIZE);
      }
      // Inner detail
      ctx.fillStyle = pInner;
      ctx.fillRect(-half + 4, -half + 4, PLAYER_SIZE - 8, PLAYER_SIZE - 8);
      // Eye
      ctx.fillStyle = zc.bgColor;
      ctx.fillRect(2, -4, 7, 7);
      ctx.fillStyle = pEye;
      ctx.fillRect(4, -2, 3, 3);
      ctx.shadowBlur = 0;
      ctx.restore();

      // UI Overlays
      if (uiState === 'dead') {
        ctx.fillStyle = 'hsla(0,100%,55%,0.25)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Orbitron", sans-serif';
        ctx.fillStyle = 'hsl(0,100%,65%)';
        ctx.shadowColor = 'hsl(0,100%,55%)'; ctx.shadowBlur = 20;
        ctx.fillText('¡CRASH!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.shadowBlur = 0;
        ctx.font = '16px "Exo 2", sans-serif';
        ctx.fillStyle = 'hsl(0,0%,80%)';
        ctx.fillText(`Continúas restantes: ${MAX_CONTINUES - continuesUsedRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillStyle = 'hsl(160,100%,60%)';
        ctx.font = '14px "Exo 2", sans-serif';
        ctx.fillText('[ESPACIO] Continuar desde aquí', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        ctx.fillStyle = 'hsl(0,100%,60%)';
        ctx.fillText('[R] Reiniciar desde el principio', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
      }
      if (uiState === 'gameover') {
        ctx.fillStyle = 'hsla(0,0%,0%,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px "Orbitron", sans-serif';
        ctx.fillStyle = 'hsl(0,100%,60%)';
        ctx.shadowColor = 'hsl(0,100%,55%)'; ctx.shadowBlur = 25;
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        ctx.shadowBlur = 0;
        ctx.font = '16px "Exo 2", sans-serif';
        ctx.fillStyle = 'hsl(0,0%,70%)';
        ctx.fillText('Sin continúas restantes', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillStyle = 'hsl(40,100%,60%)';
        ctx.fillText('[ESPACIO] Reiniciar nivel', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
      }
      if (uiState === 'complete') {
        ctx.fillStyle = 'hsla(0,0%,0%,0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px "Orbitron", sans-serif';
        ctx.fillStyle = zc.color;
        ctx.shadowColor = zc.color; ctx.shadowBlur = 25;
        ctx.fillText('¡NIVEL COMPLETADO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.font = '16px "Exo 2", sans-serif';
        ctx.fillStyle = 'hsl(0,0%,80%)';
        ctx.fillText('Siguiente nivel desbloqueado 🔓', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.fillStyle = 'hsl(160,100%,60%)';
        ctx.fillText('[ESPACIO] Continuar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      }

      // Progress bar
      ctx.fillStyle = 'hsla(0,0%,100%,0.1)';
      ctx.fillRect(20, 15, CANVAS_WIDTH - 40, 6);
      const progGrad = ctx.createLinearGradient(20, 0, 20 + (CANVAS_WIDTH - 40) * progress, 0);
      progGrad.addColorStop(0, zc.color);
      progGrad.addColorStop(1, zc.accentColor);
      ctx.fillStyle = progGrad;
      ctx.shadowColor = zc.color; ctx.shadowBlur = 8;
      ctx.fillRect(20, 15, (CANVAS_WIDTH - 40) * progress, 6);
      ctx.shadowBlur = 0;
      ctx.font = '12px "Orbitron", sans-serif';
      ctx.fillStyle = 'hsla(0,0%,100%,0.5)';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(progress * 100)}%`, CANVAS_WIDTH - 20, 38);
      ctx.textAlign = 'left';
      ctx.fillText(`❤ ${MAX_CONTINUES - continuesUsedRef.current}`, 20, 38);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [level, isPlaying, currentLyric, uiState, onDeath, onComplete, onProgressChange, scaleFactor, effectiveDuration, skinColor, skinGlowColor, skinInnerColor, skinEyeColor, skinShape]);

  const findSafeRespawnCamera = useCallback((cam: number) => {
    const obstacles = scaledObstacles.current;
    const nonFatalTypes = new Set<Obstacle['type']>([
      'platform',
      'solid-platform',
      'orb',
      'mushroom',
      'mode-ball',
      'mode-airplane',
      'mode-normal',
      'vanishing-block',
    ]);
    const SAFE_MARGIN = 350;
    const RETREAT_STEP = 100;
    const MAX_RETREATS = 12;
    let testCam = cam;
    for (let attempt = 0; attempt < MAX_RETREATS; attempt++) {
      const playerX = testCam + 100;
      const hasDanger = obstacles.some(obs => {
        if (nonFatalTypes.has(obs.type)) return false;
        const obsEnd = obs.x + obs.width;
        return obsEnd >= playerX && obs.x <= playerX + SAFE_MARGIN;
      });
      if (!hasDanger) return testCam;
      testCam = Math.max(0, testCam - RETREAT_STEP);
    }
    return testCam;
  }, []);

  const resetPlayer = useCallback((fromStart: boolean) => {
    const player = playerRef.current;
    if (fromStart) {
      cameraXRef.current = 0; continuesUsedRef.current = 0; gameOverRef.current = false;
      onRestart?.();
    } else {
      continuesUsedRef.current++;
      const respawnCamera = findSafeRespawnCamera(cameraXRef.current);
      cameraXRef.current = respawnCamera;
      const respawnTime = scaledLength.current > 0
        ? Math.min((respawnCamera / scaledLength.current) * effectiveDuration, Math.max(effectiveDuration - 0.05, 0))
        : 0;
      onResumeMusic?.(respawnTime);
    }
    player.x = cameraXRef.current + 100;
    player.y = level.groundY - PLAYER_SIZE;
    player.vy = 0; player.rotation = 0; player.isGrounded = true; player.isDead = false;
    player.mode = 'normal'; player.isImmortal = false; player.immortalTimer = 0;
    particlesRef.current = [];
    setUiState('playing');
  }, [level, onRestart, findSafeRespawnCamera, onResumeMusic, effectiveDuration]);

  const handleCanvasInteraction = useCallback((down: boolean) => {
    if (!down) { jumpingRef.current = false; return; }
    if (uiState === 'dead') { resetPlayer(false); return; }
    if (uiState === 'gameover') { resetPlayer(true); return; }
    if (uiState === 'complete') return;
    jumpingRef.current = true;
  }, [uiState, resetPlayer]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (uiState === 'dead') {
        if (e.key === 'r' || e.key === 'R') { e.preventDefault(); resetPlayer(true); }
        else if (e.code === 'Space') { e.preventDefault(); resetPlayer(false); }
      } else if (uiState === 'gameover' && e.code === 'Space') {
        e.preventDefault(); resetPlayer(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [uiState, resetPlayer]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full max-w-[800px] rounded-lg neon-border cursor-pointer"
      style={{ imageRendering: 'pixelated' }}
      onMouseDown={() => handleCanvasInteraction(true)}
      onMouseUp={() => handleCanvasInteraction(false)}
      onTouchStart={(e) => { e.preventDefault(); handleCanvasInteraction(true); }}
      onTouchEnd={() => handleCanvasInteraction(false)}
    />
  );
};

export default GameCanvas;
