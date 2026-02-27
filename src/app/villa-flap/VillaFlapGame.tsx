'use client';

import { useEffect, useRef } from 'react';
import type { VillaFlapEvent } from '@/lib/game/VillaFlapScene';

interface Props { onEvent: (e: VillaFlapEvent) => void; }

export default function VillaFlapGame({ onEvent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    (window as any).__villaData = { onEvent };
    let game: any;
    import('phaser').then(Phaser => {
      import('@/lib/game/VillaFlapScene').then(({ VillaFlapScene }) => {
        const w = Math.min(window.innerWidth, 430);
        const h = window.innerHeight - 56;
        game = new Phaser.default.Game({
          type: Phaser.default.AUTO,
          width: w, height: h,
          backgroundColor: '#1a0512',
          scene: [VillaFlapScene],
          parent: containerRef.current!,
          scale: { mode: Phaser.default.Scale.FIT, autoCenter: Phaser.default.Scale.CENTER_BOTH },
        });
        gameRef.current = game;
      });
    });
    return () => { if (game) game.destroy(true); gameRef.current = null; };
  }, [onEvent]);

  return <div ref={containerRef} style={{ width: '100%' }} />;
}
