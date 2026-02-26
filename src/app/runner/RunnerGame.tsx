'use client';

import { useEffect, useRef } from 'react';
import { RunnerEvent } from '@/lib/game/ArsenalRunnerScene';

interface RunnerGameProps {
    onEvent: (e: RunnerEvent) => void;
    gameRef: React.MutableRefObject<any>;
}

export default function RunnerGame({ onEvent, gameRef }: RunnerGameProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const phaserRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || phaserRef.current) return;

        let game: any;

        const init = async () => {
            const Phaser = (await import('phaser')).default;
            const { ArsenalRunnerScene } = await import('@/lib/game/ArsenalRunnerScene');

            const width = Math.min(containerRef.current!.clientWidth, 480);
            const height = Math.floor(width * 1.65);

            containerRef.current!.style.height = `${height}px`;

            (window as any).__runnerData = { onEvent };

            const scene = new ArsenalRunnerScene();

            game = new Phaser.Game({
                type: Phaser.AUTO,
                width,
                height,
                backgroundColor: '#1a0a0a',
                parent: containerRef.current!,
                scene: scene,
                scale: { mode: Phaser.Scale.NONE },
            });

            phaserRef.current = game;
            gameRef.current = scene;
        };

        init();

        return () => {
            game?.destroy(true);
            phaserRef.current = null;
            delete (window as any).__runnerData;
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}
        />
    );
}