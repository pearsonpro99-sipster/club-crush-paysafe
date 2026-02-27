'use client';

import { useParams, useRouter } from 'next/navigation';

const CLIENT_DATA: Record<string, {
  name: string; primary: string; secondary: string; bg: string;
  emoji: string; tagline: string; hasRunner?: boolean; hasVillaFlap?: boolean;
}> = {
  arsenal:     { name: 'Arsenal FC',      primary: '#EF0107', secondary: '#FFD700', bg: '#1a0505', emoji: '🔴', tagline: 'The Gunners', hasRunner: true },
  aston_villa: { name: 'Aston Villa',     primary: '#670E36', secondary: '#95BFE5', bg: '#1a0512', emoji: '🟣', tagline: 'Villa Till I Die', hasVillaFlap: true },
  liverpool:   { name: 'Liverpool FC',    primary: '#C8102E', secondary: '#F6EB61', bg: '#1a0a0a', emoji: '🔴', tagline: 'You\'ll Never Walk Alone' },
  sky_sports:  { name: 'Sky Sports',      primary: '#0072CE', secondary: '#FFFFFF', bg: '#000d1a', emoji: '🔵', tagline: 'Where The Action Is' },
  pdc:         { name: 'PDC Darts',       primary: '#00A651', secondary: '#FFD700', bg: '#0a1a0a', emoji: '🎯', tagline: 'The Premier League of Darts' },
  nascar:      { name: 'NASCAR',          primary: '#FF6B00', secondary: '#FFD700', bg: '#1a0a00', emoji: '🏎️', tagline: 'Go Fast, Turn Left' },
  daily_mail:  { name: 'Daily Mail',      primary: '#CC0000', secondary: '#FFFFFF', bg: '#1a0505', emoji: '📰', tagline: 'Daily Mail Sport' },
  leicester:   { name: 'Leicester City',  primary: '#003090', secondary: '#FDBE11', bg: '#000a1a', emoji: '🦊', tagline: 'The Foxes' },
  itv:         { name: 'ITV',             primary: '#F5A623', secondary: '#FFFFFF', bg: '#1a1000', emoji: '📺', tagline: 'ITV Sport' },
  channel4:    { name: 'Channel 4',       primary: '#6ABF4B', secondary: '#FFFFFF', bg: '#0a1a05', emoji: '4️⃣', tagline: 'Channel 4 Sport' },
  psa:         { name: 'PSA World Tour',  primary: '#1E90FF', secondary: '#FFD700', bg: '#000d1a', emoji: '🎾', tagline: 'World Squash' },
  volleyball:  { name: 'Volleyball World',primary: '#FF4500', secondary: '#FFD700', bg: '#1a0800', emoji: '🏐', tagline: 'Volleyball World' },
};

export default function ClientHubPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const client = CLIENT_DATA[clientId] || { name: clientId, primary: '#666', secondary: '#fff', bg: '#111', emoji: '🎮', tagline: '' };

  return (
    <div style={{ minHeight: '100vh', background: client.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header - mirrors web app */}
      <div style={{
        background: client.primary,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Wallet - top left */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '6px 12px',
          color: '#FFD700', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 0 2 2h16v4z"/><path d="M22 12H18a2 2 0 0 0 0 4h4"/>
          </svg>
          <span>200</span>
        </button>

        {/* Club name */}
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 0.5 }}>
          {client.emoji} {client.name}
        </div>

        {/* Account - top right */}
        <button style={{
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '6px 10px', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>

      {/* Back nav */}
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => router.push('/')} style={{
          background: 'transparent', border: 'none', color: '#ffffff50',
          fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ← All Clients
        </button>
      </div>

      {/* Club hero */}
      <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{client.emoji}</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>{client.name}</h1>
        <p style={{ color: '#ffffff50', fontSize: 12, margin: 0 }}>{client.tagline}</p>
      </div>

      {/* Games */}
      <div style={{ padding: '20px 16px 32px' }}>
        <p style={{ color: '#ffffff40', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
          Fan Games
        </p>

        {/* Club Crush - always available */}
        <GameCard
          title="Club Crush"
          description="Match-3 puzzle game. Earn coins, beat levels, climb the table."
          emoji="💎"
          label="MATCH-3"
          primary={client.primary}
          onClick={() => router.push(`/game?client=${clientId}`)}
        />

        {/* Arsenal Runner - Arsenal only */}
        {client.hasRunner && (
          <GameCard
            title="Shirt Number Sprint"
            description="Flappy Bird-style runner through the Emirates. Collect shirt numbers, dodge the goalposts!"
            emoji="🦕"
            label="RUNNER"
            primary={client.primary}
            accent={client.secondary}
            badge="ARSENAL EXCLUSIVE"
            onClick={() => router.push('/runner')}
          />
        )}

        {/* Villa Flap - Aston Villa only */}
        {client.hasVillaFlap && (
          <GameCard
            title="McGinn Goggles"
            description="John McGinn's iconic goggles celebration goes Flappy Bird! Fly through Villa Park."
            emoji="🥽"
            label="FLAPPY"
            primary={client.primary}
            accent={client.secondary}
            badge="VILLA EXCLUSIVE"
            onClick={() => router.push('/villa-flap')}
          />
        )}

        {/* Coming soon for others */}
        <div style={{
          background: '#ffffff05', border: '1px dashed #ffffff15',
          borderRadius: 16, padding: '16px', marginTop: 8, textAlign: 'center',
        }}>
          <p style={{ color: '#ffffff25', fontSize: 12, margin: 0 }}>
            ✦ More games coming soon for {client.name}
          </p>
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
