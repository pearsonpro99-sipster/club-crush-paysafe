'use client';

import { useEffect, useRef } from 'react';
import { FlapperEvent } from '@/lib/game/AstionVillaFlapperScene';

interface Props {
  onEvent: (e: FlapperEvent) => void;
  gameRef: React.MutableRefObject<any>;
}

export default function VillaFlapperGame({ onEvent, gameRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || phaserRef.current) return;
    let game: any;

    const init = async () => {
      const Phaser = (await import('phaser')).default;
      const { AstionVillaFlapperScene } = await import('@/lib/game/AstionVillaFlapperScene');

      const width = Math.min(containerRef.current!.clientWidth, 480);
      const height = Math.floor(width * 1.65);
      containerRef.current!.style.height = `${height}px`;

      (window as any).__villaData = { onEvent };

      const scene = new AstionVillaFlapperScene();
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width, height,
        backgroundColor: '#1a0010',
        parent: containerRef.current!,
        scene,
        scale: { mode: Phaser.Scale.NONE },
      });

      phaserRef.current = game;
      gameRef.current = scene;
    };

    init();

    return () => {
      game?.destroy(true);
      phaserRef.current = null;
      delete (window as any).__villaData;
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }} />;
}
