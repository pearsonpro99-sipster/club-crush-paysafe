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

  volleyverse: {
    clubId: 'volleyverse',
    clubName: 'VolleyVerse',
    primaryColour: '#8E11FF',
    secondaryColour: '#C385F9',
    accentColour: '#DFF86C',
    backgroundColour: '#220C2D',
    levelLabel: 'Set',
    seasonLabel: 'Tournament',
    totalLevels: 25,
    tiles: [
      { id: 0, label: 'Ball',      colour: '#8E11FF', emoji: '🏐' },
      { id: 1, label: 'Violet',    colour: '#8E11FF', emoji: '🟣' },
      { id: 2, label: 'Lilac',     colour: '#C385F9', emoji: '🪻' },
      { id: 3, label: 'Lime',      colour: '#DFF86C', emoji: '🍋' },
      { id: 4, label: 'Trophy',    colour: '#DFF86C', emoji: '🏆' },
    ],
  },

};

export const DEFAULT_THEME = THEMES.volleyverse;
