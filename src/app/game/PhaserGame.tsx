'use client';

import { useEffect, useRef } from 'react';
import { ClubTheme } from '@/lib/game/themes';

interface PhaserGameProps {
  theme: ClubTheme;
  onGameEvent: (data: {
    score?: number;
    moves?: number;
    coinsEarned?: number;
    levelComplete?: boolean;
    outOfMoves?: boolean;
  }) => void;
  gameRef: React.MutableRefObject<any>;
}

export default function PhaserGame({ theme, onGameEvent, gameRef }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || phaserRef.current) return;

    let game: any;

    const initPhaser = async () => {
      const Phaser = (await import('phaser')).default;
      const { ClubCrushScene } = await import('@/lib/game/ClubCrushScene');

      const containerWidth = containerRef.current!.clientWidth || 380;
      const width = Math.min(containerWidth, 420);
      const height = Math.floor(width * 1.5);

      // Set container height explicitly so page doesn't jump
      containerRef.current!.style.height = `${height}px`;

      (window as any).__clubCrushData = { theme, onGameEvent };

      const scene = new ClubCrushScene();

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width,
        height,
        backgroundColor: theme.backgroundColour,
        parent: containerRef.current!,
        scene: scene,
        scale: {
          mode: Phaser.Scale.NONE,
        },
      });

      phaserRef.current = game;
      gameRef.current = scene;
    };

    initPhaser();

    return () => {
      game?.destroy(true);
      phaserRef.current = null;
      delete (window as any).__clubCrushData;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', maxWidth: 420, margin: '0 auto', overflow: 'hidden' }}
    />
  );
}