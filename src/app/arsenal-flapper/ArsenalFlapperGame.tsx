'use client';

import { useEffect, useRef } from 'react';
import { ArsenalFlapperEvent, ArsenalCharacter } from '@/lib/game/ArsenalFlapperScene';

interface Props {
  character: ArsenalCharacter;
  onEvent: (e: ArsenalFlapperEvent) => void;
  gameRef: React.MutableRefObject<any>;
}

export default function ArsenalFlapperGame({ character, onEvent, gameRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || phaserRef.current) return;
    let game: any;

    const init = async () => {
      const Phaser = (await import('phaser')).default;
      const { ArsenalFlapperScene } = await import('@/lib/game/ArsenalFlapperScene');

      const width = Math.min(containerRef.current!.clientWidth, 480);
      const height = Math.floor(width * 1.65);
      containerRef.current!.style.height = `${height}px`;

      (window as any).__arsenalData = { onEvent, character };

      const scene = new ArsenalFlapperScene();
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width, height,
        backgroundColor: '#0a0505',
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
      delete (window as any).__arsenalData;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}
    />
  );
}
