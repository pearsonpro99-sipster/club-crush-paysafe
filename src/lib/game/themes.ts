export interface ClubTheme {
  clubId: string;
  clubName: string;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  backgroundColour: string;
  tiles: TileConfig[];
  levelLabel: string; // e.g. "Match" for football, "Leg" for darts
  seasonLabel: string; // e.g. "Season" / "Tournament"
  totalLevels: number;
}

export interface TileConfig {
  id: number;
  label: string; // e.g. "Badge", "Home Kit", "Away Kit", "GK Kit", "Star Player"
  colour: string; // fallback colour if no asset
  emoji: string;  // used in POC before real assets
}

// ─── CLUB CONFIGS ────────────────────────────────────────────────────────────

export const THEMES: Record<string, ClubTheme> = {

  arsenal: {
    clubId: 'arsenal',
    clubName: 'Arsenal FC',
    primaryColour: '#EF0107',
    secondaryColour: '#FFFFFF',
    accentColour: '#9C824A',
    backgroundColour: '#1a0a0a',
    levelLabel: 'Match',
    seasonLabel: 'Season',
    totalLevels: 38,
    tiles: [
      { id: 0, label: 'Badge',     colour: '#EF0107', emoji: '🔴' },
      { id: 1, label: 'Home Kit',  colour: '#EF0107', emoji: '👕' },
      { id: 2, label: 'Away Kit',  colour: '#FFFFFF', emoji: '🤍' },
      { id: 3, label: 'Gold',      colour: '#9C824A', emoji: '🏆' },
      { id: 4, label: 'GK Kit',    colour: '#FFD700', emoji: '🟡' },
    ],
  },

  aston_villa: {
    clubId: 'aston_villa',
    clubName: 'Aston Villa',
    primaryColour: '#670E36',
    secondaryColour: '#95BFE5',
    accentColour: '#FFD700',
    backgroundColour: '#1a0a12',
    levelLabel: 'Match',
    seasonLabel: 'Season',
    totalLevels: 38,
    tiles: [
      { id: 0, label: 'Badge',     colour: '#670E36', emoji: '🟣' },
      { id: 1, label: 'Home Kit',  colour: '#670E36', emoji: '👕' },
      { id: 2, label: 'Sky Blue',  colour: '#95BFE5', emoji: '🩵' },
      { id: 3, label: 'Gold',      colour: '#FFD700', emoji: '🏆' },
      { id: 4, label: 'GK Kit',    colour: '#FF6B00', emoji: '🟠' },
    ],
  },

  liverpool: {
    clubId: 'liverpool',
    clubName: 'Liverpool FC',
    primaryColour: '#C8102E',
    secondaryColour: '#F6EB61',
    accentColour: '#00B2A9',
    backgroundColour: '#1a0a0a',
    levelLabel: 'Match',
    seasonLabel: 'Season',
    totalLevels: 38,
    tiles: [
      { id: 0, label: 'Badge',     colour: '#C8102E', emoji: '🔴' },
      { id: 1, label: 'Home Kit',  colour: '#C8102E', emoji: '👕' },
      { id: 2, label: 'Gold',      colour: '#F6EB61', emoji: '🟡' },
      { id: 3, label: 'Teal',      colour: '#00B2A9', emoji: '🩵' },
      { id: 4, label: 'Away Kit',  colour: '#FFFFFF', emoji: '🤍' },
    ],
  },

  pdc: {
    clubId: 'pdc',
    clubName: 'PDC Darts',
    primaryColour: '#00A651',
    secondaryColour: '#FFD700',
    accentColour: '#FFFFFF',
    backgroundColour: '#0a1a0a',
    levelLabel: 'Leg',
    seasonLabel: 'Tournament',
    totalLevels: 16,
    tiles: [
      { id: 0, label: 'Bullseye',  colour: '#C8102E', emoji: '🎯' },
      { id: 1, label: 'Green',     colour: '#00A651', emoji: '🟢' },
      { id: 2, label: 'Gold',      colour: '#FFD700', emoji: '🟡' },
      { id: 3, label: 'Black',     colour: '#1a1a1a', emoji: '⚫' },
      { id: 4, label: 'White',     colour: '#FFFFFF', emoji: '⚪' },
    ],
  },

  sky_sports: {
    clubId: 'sky_sports',
    clubName: 'Sky Sports',
    primaryColour: '#0072CE',
    secondaryColour: '#FFFFFF',
    accentColour: '#E8003D',
    backgroundColour: '#000d1a',
    levelLabel: 'Round',
    seasonLabel: 'Series',
    totalLevels: 20,
    tiles: [
      { id: 0, label: 'Sky Blue',  colour: '#0072CE', emoji: '🔵' },
      { id: 1, label: 'White',     colour: '#FFFFFF', emoji: '⚪' },
      { id: 2, label: 'Red',       colour: '#E8003D', emoji: '🔴' },
      { id: 3, label: 'Dark',      colour: '#001f3f', emoji: '🟤' },
      { id: 4, label: 'Gold',      colour: '#FFD700', emoji: '🟡' },
    ],
  },
};

export const DEFAULT_THEME = THEMES.arsenal;
