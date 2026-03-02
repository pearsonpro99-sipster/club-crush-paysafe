'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStreak } from '@/lib/streak';
import { getFanScore } from '@/lib/fanScore';

const CLIENT_DATA: Record<string, {
  name: string; primary: string; secondary: string; bg: string;
  emoji: string; tagline: string; hasVillaFlap?: boolean; hasTinyMovesFlap?: boolean; hasTinyMovesSurge?: boolean;
}> = {
  arsenal:     { name: 'Arsenal FC',         primary: '#EF0107', secondary: '#FFD700', bg: '#1a0505', emoji: '🔴', tagline: 'The Gunners' },
  aston_villa: { name: 'Aston Villa',         primary: '#670E36', secondary: '#95BFE5', bg: '#1a0512', emoji: '🟣', tagline: 'Villa Till I Die',  hasVillaFlap: true },
  tiny_moves:  { name: 'Tiny Moves Run Club', primary: '#4FC3F7', secondary: '#0288D1', bg: '#060e18', emoji: '🏃', tagline: 'Every Run Counts', hasTinyMovesFlap: true, hasTinyMovesSurge: true },
};

export default function ClientHubPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const client = CLIENT_DATA[clientId] || { name: clientId, primary: '#666', secondary: '#fff', bg: '#111', emoji: '🎮', tagline: '' };

  const [streak, setStreak]     = useState(0);
  const [fanScore, setFanScore] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
    setFanScore(getFanScore(clientId));
  }, [clientId]);

  return (
    <div style={{ minHeight: '100vh', background: client.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: client.primary, padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '6px 12px',
          color: '#FFD700', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 0 2 2h16v4z"/><path d="M22 12H18a2 2 0 0 0 0 4h4"/>
          </svg>
          <span>🪙 200</span>
        </button>

        <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 0.5 }}>
          {client.emoji} {client.name}
        </div>

        <button onClick={() => router.push('/leaderboard')} style={{
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '6px 10px', cursor: 'pointer',
          color: '#FFD700', fontSize: 12, fontWeight: 700,
        }}>
          🏆
        </button>
      </div>

      {/* Back nav */}
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => router.push('/')} style={{
          background: 'transparent', border: 'none', color: '#ffffff50',
          fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ← All Clubs
        </button>
      </div>

      {/* Club hero */}
      <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{client.emoji}</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>{client.name}</h1>
        <p style={{ color: '#ffffff50', fontSize: 12, margin: '0 0 10px' }}>{client.tagline}</p>

        {/* Streak + fan score pills */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {streak > 0 && (
            <div style={{
              background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.4)',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#FF8C00',
            }}>
              🔥 {streak} day streak
            </div>
          )}
          {fanScore > 0 && (
            <div style={{
              background: `${client.primary}22`, border: `1px solid ${client.primary}44`,
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: client.primary,
            }}>
              ⭐ {fanScore.toLocaleString()} fan pts
            </div>
          )}
        </div>
      </div>

      {/* Games */}
      <div style={{ padding: '20px 16px 32px' }}>
        <p style={{ color: '#ffffff40', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
          Fan Games
        </p>

        {/* Club Crush - always */}
        <GameCard
          title="Club Crush"
          description="Match-3 puzzle game. Earn fan points, beat levels, climb the leaderboard."
          emoji="💎"
          label="MATCH-3"
          primary={client.primary}
          onClick={() => router.push(`/game?client=${clientId}`)}
        />

        {/* McGinn's Goggle Dash - Aston Villa only */}
        {client.hasVillaFlap && (
          <GameCard
            title="McGinn's Goggle Dash"
            description="John McGinn's iconic goggles celebration goes Flappy Bird! Fly through Villa Park."
            emoji="🥽"
            label="FLAPPY"
            primary={client.primary}
            accent={client.secondary}
            badge="VILLA EXCLUSIVE"
            onClick={() => router.push('/villa-runner')}
          />
        )}

        {/* Tiny Moves Dash - Tiny Moves only */}
        {client.hasTinyMovesFlap && (
          <GameCard
            title="Tiny Moves Run Club Dash"
            description="Dodge the cones, collect pizzas, and keep running! How far can you go?"
            emoji="🏃"
            label="FLAPPY"
            primary={client.primary}
            accent={client.secondary}
            badge="TINY MOVES EXCLUSIVE"
            onClick={() => router.push('/tiny-moves')}
          />
        )}

        {/* 5K Surge - Tiny Moves only */}
        {client.hasTinyMovesSurge && (
          <GameCard
            title="5K Surge"
            description="React fast when the sprint signal fires! Tap in time to surge ahead."
            emoji="⚡"
            label="REACTION"
            primary={client.primary}
            accent={client.secondary}
            badge="TINY MOVES EXCLUSIVE"
            onClick={() => router.push('/tiny-moves-surge')}
          />
        )}

        {/* Leaderboard CTA */}
        <div
          onClick={() => router.push('/leaderboard')}
          style={{
            background: `${client.primary}12`, border: `1px solid ${client.primary}30`,
            borderRadius: 16, padding: '14px 16px', marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>🏆 Fan Leaderboard</p>
            <p style={{ color: '#ffffff44', fontSize: 11, margin: '2px 0 0' }}>See your rank · Monthly prize draws</p>
          </div>
          <span style={{ color: '#ffffff30', fontSize: 22 }}>›</span>
        </div>
      </div>
    </div>
  );
}

function GameCard({
  title, description, emoji, label, primary, accent, badge, onClick,
}: {
  title: string; description: string; emoji: string; label: string;
  primary: string; accent?: string; badge?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', gap: 14, alignItems: 'flex-start',
      background: primary + '18', border: `1px solid ${primary}40`,
      borderRadius: 16, padding: '16px', marginBottom: 10,
      cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: primary + '30', border: `2px solid ${primary}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
      }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{title}</span>
          <span style={{
            background: accent ? accent + '33' : primary + '33',
            color: accent || primary,
            fontSize: 8, fontWeight: 800, letterSpacing: 1.5,
            padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase',
          }}>{label}</span>
        </div>
        {badge && (
          <div style={{
            background: (accent || primary) + '22', color: accent || primary,
            fontSize: 8, fontWeight: 800, letterSpacing: 1.5,
            padding: '2px 8px', borderRadius: 5, display: 'inline-block',
            textTransform: 'uppercase', marginBottom: 5,
          }}>{badge}</div>
        )}
        <p style={{ color: '#ffffff60', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{description}</p>
      </div>
      <span style={{ color: '#ffffff30', fontSize: 22, alignSelf: 'center' }}>›</span>
    </button>
  );
}
