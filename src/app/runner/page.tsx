'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { RunnerEvent } from '@/lib/game/ArsenalRunnerScene';

const RunnerGame = dynamic(() => import('./RunnerGame'), { ssr: false });

export default function RunnerPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<'game' | 'dead'>('game');
    const [finalScore, setFinalScore] = useState(0);
    const [finalCoins, setFinalCoins] = useState(0);
    const [liveCoins, setLiveCoins] = useState(0);
    const [gameKey, setGameKey] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const sceneRef = useRef<any>(null);

    const handleEvent = useCallback((e: RunnerEvent) => {
        if (e.type === 'score') {
            setLiveCoins(e.coins);
        }
        if (e.type === 'died') {
            setFinalScore(e.score);
            setFinalCoins(e.coins);
            setBestScore(prev => Math.max(prev, e.score));
            setPhase('dead');
        }
    }, []);

    const restart = () => {
        setPhase('game');
        setLiveCoins(0);
        setGameKey(k => k + 1);
    };

    return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>

            {/* Top coin bar — visible during game */}
            {phase === 'game' && (
                <div style={{
                    position: 'fixed', top: 0, right: 0, zIndex: 50,
                    padding: '6px 12px',
                    background: 'rgba(0,0,0,0.5)',
                    borderBottomLeftRadius: 12,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <span style={{ fontSize: 16 }}>🪙</span>
                    <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>{liveCoins}</span>
                </div>
            )}

            {/* Phaser game */}
            {phase === 'game' && (
                <RunnerGame key={gameKey} onEvent={handleEvent} gameRef={sceneRef} />
            )}

            {/* Game Over screen */}
            {phase === 'dead' && (
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(180deg, #1a0000 0%, #0a0a0a 100%)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '24px 16px',
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ fontSize: 64, marginBottom: 8 }}>
                            {finalScore > 1000 ? '🏆' : finalScore > 500 ? '⚽' : '😤'}
                        </div>
                        <h1 style={{ color: '#DB0007', fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: 2 }}>
                            {finalScore > 1000 ? 'YOU MADE IT!' : finalScore > 500 ? 'ALMOST THERE!' : 'MISSED THE BUS!'}
                        </h1>
                        <p style={{ color: '#ffffff66', fontSize: 13, margin: '4px 0 0' }}>
                            Chase the Team Bus 🚌
                        </p>
                    </div>

                    {/* Score cards */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, width: '100%', maxWidth: 340 }}>
                        <div style={{
                            flex: 1, background: '#DB0007', borderRadius: 16,
                            padding: '16px 12px', textAlign: 'center',
                        }}>
                            <p style={{ color: '#ffffff88', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>SCORE</p>
                            <p style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '4px 0 0' }}>
                                {finalScore.toLocaleString()}
                            </p>
                        </div>
                        <div style={{
                            flex: 1, background: '#1a1a1a', border: '2px solid #FFD700',
                            borderRadius: 16, padding: '16px 12px', textAlign: 'center',
                        }}>
                            <p style={{ color: '#FFD70088', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>COINS</p>
                            <p style={{ color: '#FFD700', fontSize: 28, fontWeight: 900, margin: '4px 0 0' }}>
                                🪙 {finalCoins}
                            </p>
                        </div>
                    </div>

                    {/* Best score */}
                    {bestScore > 0 && (
                        <div style={{
                            background: '#111', borderRadius: 12, padding: '10px 20px',
                            marginBottom: 20, textAlign: 'center',
                            border: '1px solid #ffffff15',
                        }}>
                            <p style={{ color: '#ffffff44', fontSize: 10, letterSpacing: 2, margin: 0 }}>BEST SCORE</p>
                            <p style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', margin: '2px 0 0' }}>
                                {bestScore.toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Power-up upsell */}
                    <div style={{
                        background: '#1a0a00', border: '2px solid #FF6B35',
                        borderRadius: 16, padding: '16px', marginBottom: 20,
                        width: '100%', maxWidth: 340, textAlign: 'center',
                    }}>
                        <p style={{ color: '#FF6B35', fontSize: 13, fontWeight: 'bold', margin: '0 0 8px' }}>
                            🛡️ Want a Shield for your next run?
                        </p>
                        <p style={{ color: '#ffffff66', fontSize: 11, margin: '0 0 12px' }}>
                            Start with the Invincibles shield — survive your first obstacle automatically
                        </p>
                        <button
                            onClick={() => alert('Stripe integration coming — £0.99 for Shield Pack')}
                            style={{
                                background: '#FF6B35', color: '#fff',
                                border: 'none', borderRadius: 10,
                                padding: '10px 24px', fontSize: 14,
                                fontWeight: 'bold', cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            🛡️ Get Shield — 50 Coins
                        </button>
                    </div>

                    {/* Action buttons */}
                    <button
                        onClick={restart}
                        style={{
                            background: '#DB0007', color: '#fff',
                            border: 'none', borderRadius: 14,
                            padding: '16px 0', fontSize: 17,
                            fontWeight: 900, cursor: 'pointer',
                            width: '100%', maxWidth: 340,
                            marginBottom: 12, letterSpacing: 1,
                        }}
                    >
                        ▶ RUN AGAIN
                    </button>

                    <button
                        onClick={() => router.push('/client/arsenal')}
                        style={{
                            background: 'transparent', color: '#ffffff44',
                            border: '1px solid #ffffff15', borderRadius: 14,
                            padding: '12px 0', fontSize: 13,
                            cursor: 'pointer', width: '100%', maxWidth: 340,
                        }}
                    >
                        ← Back to Arsenal Hub
                    </button>

                    <p style={{ color: '#ffffff22', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
                        Coins earned go to your Arsenal Fan Score 🏆
                    </p>
                </div>
            )}
        </div>
    );
}
