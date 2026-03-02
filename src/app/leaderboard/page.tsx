'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLeaderboard, getScoreBreakdown, LeaderboardEntry } from '@/lib/fanScore';

const CLUBS = [
  { id: 'volleyverse', name: 'VolleyVerse', emoji: '🏐', primary: '#8E11FF', prize: 'VIP VolleyVerse Meet & Greet' },
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
    <div style={{ minHeight: '100vh', background: '#220C2D', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#1a0822', borderBottom: '1px solid #8E11FF30', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: '#ffffff50', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>🏆 Fan Leaderboard</div>
        <div style={{ marginLeft: 'auto', color: '#C385F9', fontSize: 12, fontWeight: 700 }}>VolleyVerse</div>
      </div>

      {/* Monthly prize banner */}
      <div style={{
        margin: '16px 16px 0',
        background: 'linear-gradient(135deg, #8E11FF33 0%, #630CB322 100%)',
        border: '1px solid #8E11FF55',
        borderRadius: 16, padding: '14px 16px',
      }}>
        <p style={{ color: '#ffffff60', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 4px' }}>Monthly Competition</p>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 15, margin: '0 0 2px' }}>🎁 Prize: {club.prize}</p>
        <p style={{ color: '#ffffff55', fontSize: 11, margin: 0 }}>Top fan wins · Deadline: {getDeadline()}</p>
      </div>

      {/* How to earn pts strip */}
      <div style={{ margin: '10px 16px 0', background: '#ffffff06', border: '1px solid #ffffff10', borderRadius: 12, padding: '10px 14px' }}>
        <p style={{ color: '#ffffff40', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>Earn fan points</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Crush set', pts: '200–800' },
            { label: 'Volley Flapper', pts: '10–300' },
            { label: 'Serve Ace', pts: '100–1000' },
            { label: 'Leaderboard boost', pts: '+800' },
          ].map(item => (
            <div key={item.label} style={{ background: '#8E11FF22', borderRadius: 8, padding: '4px 10px' }}>
              <span style={{ color: '#C385F9', fontSize: 11, fontWeight: 700 }}>{item.label} </span>
              <span style={{ color: '#DFF86C', fontSize: 11, fontWeight: 900 }}>{item.pts} pts</span>
            </div>
          ))}
        </div>
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
