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

  psa_world_tour: {
    clubId: 'psa_world_tour',
    clubName: 'PSA World Tour',
    primaryColour: '#002D74',
    secondaryColour: '#FF6B35',
    accentColour: '#FFFFFF',
    backgroundColour: '#00112a',
    levelLabel: 'Match',
    seasonLabel: 'Tour',
    totalLevels: 32,
    tiles: [
      { id: 0, label: 'Ball',      colour: '#FF6B35', emoji: '🎾' },
      { id: 1, label: 'Navy',      colour: '#002D74', emoji: '🔵' },
      { id: 2, label: 'Orange',    colour: '#FF6B35', emoji: '🟠' },
      { id: 3, label: 'Trophy',    colour: '#FFD700', emoji: '🏆' },
      { id: 4, label: 'White',     colour: '#FFFFFF', emoji: '⚪' },
    ],
  },

  volley_verse: {
    clubId: 'volley_verse',
    clubName: 'Volley Verse',
    primaryColour: '#0057A8',
    secondaryColour: '#FFD700',
    accentColour: '#FF4444',
    backgroundColour: '#001a3a',
    levelLabel: 'Set',
    seasonLabel: 'Tournament',
    totalLevels: 25,
    tiles: [
      { id: 0, label: 'Ball',      colour: '#0057A8', emoji: '🏐' },
      { id: 1, label: 'Blue',      colour: '#0057A8', emoji: '🔵' },
      { id: 2, label: 'Gold',      colour: '#FFD700', emoji: '🟡' },
      { id: 3, label: 'Red',       colour: '#FF4444', emoji: '🔴' },
      { id: 4, label: 'Trophy',    colour: '#FFD700', emoji: '🏆' },
    ],
  },

  tiny_moves: {
    clubId: 'tiny_moves',
    clubName: 'Tiny Moves Run Club',
    primaryColour: '#4FC3F7',
    secondaryColour: '#0288D1',
    accentColour: '#FFFFFF',
    backgroundColour: '#060e18',
    levelLabel: 'Run',
    seasonLabel: 'Season',
    totalLevels: 20,
    tiles: [
      { id: 0, label: 'Sky Blue',  colour: '#4FC3F7', emoji: '🩵' },
      { id: 1, label: 'Blue',      colour: '#0288D1', emoji: '🔵' },
      { id: 2, label: 'Pizza',     colour: '#FF8C00', emoji: '🍕' },
      { id: 3, label: 'Trophy',    colour: '#FFD700', emoji: '🏆' },
      { id: 4, label: 'Runner',    colour: '#FFFFFF', emoji: '🏃' },
    ],
  },
};

export const DEFAULT_THEME = THEMES.arsenal;
