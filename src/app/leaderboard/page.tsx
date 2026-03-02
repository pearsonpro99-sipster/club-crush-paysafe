'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLeaderboard, getScoreBreakdown, LeaderboardEntry } from '@/lib/fanScore';

const CLUBS = [
  { id: 'arsenal',     name: 'Arsenal',     emoji: '🔴', primary: '#EF0107', prize: 'Emirates Stadium Tour' },
  { id: 'aston_villa', name: 'Aston Villa', emoji: '🟣', primary: '#670E36', prize: 'Watch First-Team Training' },
];

// Deadline: last day of current month
function getDeadline(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeClub, setActiveClub] = useState(CLUBS[0].id);
  const [entries, setEntries]       = useState<LeaderboardEntry[]>([]);
  const [breakdown, setBreakdown]   = useState<Record<string, number>>({});

  useEffect(() => {
    setEntries(getLeaderboard(activeClub));
    setBreakdown(getScoreBreakdown(activeClub));
  }, [activeClub]);

  const club     = CLUBS.find(c => c.id === activeClub)!;
  const youEntry = entries.find(e => e.isYou);
  const top10    = entries.slice(0, 10);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#111118', borderBottom: '1px solid #ffffff10', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: '#ffffff50', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>🏆 Fan Leaderboard</div>
      </div>

      {/* Monthly prize banner */}
      <div style={{
        margin: '16px 16px 0',
        background: `linear-gradient(135deg, ${club.primary}44 0%, ${club.primary}22 100%)`,
        border: `1px solid ${club.primary}55`,
        borderRadius: 16, padding: '14px 16px',
      }}>
        <p style={{ color: '#ffffff60', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 4px' }}>Monthly Competition</p>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 15, margin: '0 0 2px' }}>🎁 Prize: {club.prize}</p>
        <p style={{ color: '#ffffff55', fontSize: 11, margin: 0 }}>Top fan wins · Deadline: {getDeadline()}</p>
      </div>

      {/* Club tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 8px' }}>
        {CLUBS.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveClub(c.id)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
              background: activeClub === c.id ? c.primary : '#ffffff0a',
              color: activeClub === c.id ? '#fff' : '#ffffff44',
              fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5,
            }}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {/* Your score card (if played) */}
      {youEntry && (
        <div style={{ margin: '8px 16px', background: `${club.primary}22`, border: `1px solid ${club.primary}55`, borderRadius: 14, padding: '12px 16px' }}>
          <p style={{ color: '#ffffff55', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>Your ranking</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: club.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 14,
            }}>#{youEntry.rank}</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: 0 }}>You 🫵</p>
              {Object.keys(breakdown).length > 0 && (
                <p style={{ color: '#ffffff44', fontSize: 10, margin: '2px 0 0' }}>
                  {Object.entries(breakdown).map(([g, s]) => `${g}: ${s.toLocaleString()}`).join(' · ')}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: club.primary, fontWeight: 900, fontSize: 18, margin: 0 }}>{youEntry.score.toLocaleString()}</p>
              <p style={{ color: '#ffffff33', fontSize: 10, margin: 0 }}>fan pts</p>
            </div>
          </div>
        </div>
      )}

      {!youEntry && (
        <div style={{ margin: '8px 16px', background: '#ffffff06', border: '1px dashed #ffffff18', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ color: '#ffffff44', fontSize: 13, margin: 0 }}>Play games to earn fan points and appear on this leaderboard!</p>
        </div>
      )}

      {/* Top 10 */}
      <div style={{ padding: '12px 16px 32px' }}>
        <p style={{ color: '#ffffff30', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Top 10</p>
        {top10.map((entry, idx) => (
          <div
            key={entry.rank}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: entry.isYou ? `${club.primary}22` : idx % 2 === 0 ? '#ffffff05' : 'transparent',
              border: entry.isYou ? `1px solid ${club.primary}44` : '1px solid transparent',
              borderRadius: 12, padding: '10px 12px', marginBottom: 6,
            }}
          >
            {/* Rank */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: entry.rank <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][entry.rank - 1] + '33' : '#ffffff0a',
              border: `2px solid ${entry.rank <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][entry.rank - 1] : '#ffffff15'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: entry.rank <= 3 ? 14 : 11,
              color: entry.rank <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][entry.rank - 1] : '#ffffff44',
              fontWeight: 900,
            }}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
            </div>

            {/* Avatar */}
            <div style={{ fontSize: 22 }}>{entry.emoji}</div>

            {/* Name */}
            <div style={{ flex: 1 }}>
              <p style={{ color: entry.isYou ? '#fff' : '#ffffffcc', fontWeight: entry.isYou ? 900 : 600, fontSize: 14, margin: 0 }}>
                {entry.name}{entry.isYou ? ' 🫵' : ''}
              </p>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: entry.isYou ? club.primary : '#ffffffaa', fontWeight: 800, fontSize: 14, margin: 0 }}>
                {entry.score.toLocaleString()}
              </p>
              <p style={{ color: '#ffffff25', fontSize: 9, margin: 0 }}>pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
