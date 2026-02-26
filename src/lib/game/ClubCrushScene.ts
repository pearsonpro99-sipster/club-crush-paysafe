import Phaser from 'phaser';
import { ClubTheme } from '@/lib/game/themes';

const COLS = 7;
const ROWS = 9;
const TILE_TYPES = 5;
const STARTING_MOVES = 20;
const TARGET_SCORE = 1500;

interface Tile {
  type: number;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  row: number;
  col: number;
}

type GameEventCallback = (data: {
  score?: number;
  moves?: number;
  coinsEarned?: number;
  levelComplete?: boolean;
  outOfMoves?: boolean;
}) => void;

export class ClubCrushScene extends Phaser.Scene {
  private grid: (Tile | null)[][] = [];
  private tileSize: number = 50;
  private offsetX: number = 0;
  private offsetY: number = 85;
  private selectedTile: Tile | null = null;
  private score: number = 0;
  private moves: number = STARTING_MOVES;
  private isProcessing: boolean = false;
  private theme!: ClubTheme;
  private onGameEvent!: GameEventCallback;
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ClubCrushScene' });
  }

  init(_data?: any) {
    const data = (typeof window !== 'undefined' && (window as any).__clubCrushData) || _data || {};
    this.theme = data.theme;
    this.onGameEvent = data.onGameEvent || (() => { });
    this.score = 0;
    this.moves = STARTING_MOVES;
    this.grid = [];
    this.selectedTile = null;
    this.isProcessing = false;
  }

  create() {
    const { width, height } = this.scale;

    // Tile size fills width across COLS with small margin
    this.tileSize = Math.floor((width - 16) / COLS);
    this.offsetX = 8;

    // Background
    this.add.rectangle(0, 0, width, height,
      parseInt(this.theme.backgroundColour.replace('#', ''), 16)).setOrigin(0, 0);

    // Header
    this.add.rectangle(0, 0, width, 80,
      parseInt(this.theme.primaryColour.replace('#', ''), 16), 1).setOrigin(0, 0);

    // HUD
    this.scoreText = this.add.text(12, 10, 'SCORE\n0', {
      fontSize: '13px', color: '#fff', fontStyle: 'bold', lineSpacing: 2,
    });

    this.movesText = this.add.text(width / 2, 10, `MOVES\n${this.moves}`, {
      fontSize: '13px', color: '#fff', fontStyle: 'bold',
      align: 'center', lineSpacing: 2,
    }).setOrigin(0.5, 0);

    this.add.text(width - 12, 10, `TARGET\n${TARGET_SCORE}`, {
      fontSize: '13px', color: '#fff', fontStyle: 'bold',
      align: 'right', lineSpacing: 2,
    }).setOrigin(1, 0);

    this.buildGrid();
    this.fixInitialMatches();

    // Global pointer down for input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });
  }

  // ─── INPUT ─────────────────────────────────────────────────────────────────

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.isProcessing) return;

    const tile = this.getTileAtPointer(pointer.x, pointer.y);
    if (!tile) {
      // Clicked empty space — deselect
      if (this.selectedTile) {
        this.setHighlight(this.selectedTile, false);
        this.selectedTile = null;
      }
      return;
    }

    if (!this.selectedTile) {
      this.selectedTile = tile;
      this.setHighlight(tile, true);
    } else if (this.selectedTile === tile) {
      this.setHighlight(tile, false);
      this.selectedTile = null;
    } else if (this.isAdjacent(this.selectedTile, tile)) {
      this.trySwap(this.selectedTile, tile);
    } else {
      this.setHighlight(this.selectedTile, false);
      this.selectedTile = tile;
      this.setHighlight(tile, true);
    }
  }

  private getTileAtPointer(px: number, py: number): Tile | null {
    // Convert screen coords to grid position
    const col = Math.floor((px - this.offsetX) / this.tileSize);
    const row = Math.floor((py - this.offsetY) / this.tileSize);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return this.grid[row]?.[col] ?? null;
  }

  private isAdjacent(a: Tile, b: Tile): boolean {
    return (Math.abs(a.row - b.row) === 1 && a.col === b.col) ||
      (Math.abs(a.col - b.col) === 1 && a.row === b.row);
  }

  private setHighlight(tile: Tile, on: boolean) {
    tile.bg.setStrokeStyle(on ? 3 : 1, on ? 0xffffff : 0xffffff, on ? 1 : 0.2);
    const scale = on ? 1.1 : 1;
    this.tweens.add({ targets: [tile.bg, tile.label], scaleX: scale, scaleY: scale, duration: 80 });
  }

  // ─── GRID ──────────────────────────────────────────────────────────────────

  private buildGrid() {
    for (let row = 0; row < ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < COLS; col++) {
        const type = this.safeType(row, col);
        this.grid[row][col] = this.makeTile(row, col, type);
      }
    }
  }

  private safeType(row: number, col: number): number {
    const forbidden = new Set<number>();
    if (col >= 2) {
      const a = this.grid[row]?.[col - 1], b = this.grid[row]?.[col - 2];
      if (a && b && a.type === b.type) forbidden.add(a.type);
    }
    if (row >= 2) {
      const a = this.grid[row - 1]?.[col], b = this.grid[row - 2]?.[col];
      if (a && b && a.type === b.type) forbidden.add(a.type);
    }
    let t: number, attempts = 0;
    do { t = Phaser.Math.Between(0, TILE_TYPES - 1); attempts++; }
    while (forbidden.has(t) && attempts < 20);
    return t;
  }

  private tileX(col: number) { return this.offsetX + col * this.tileSize + this.tileSize / 2; }
  private tileY(row: number) { return this.offsetY + row * this.tileSize + this.tileSize / 2; }

  private makeTile(row: number, col: number, type: number, startY?: number): Tile {
    const x = this.tileX(col);
    const y = startY ?? this.tileY(row);
    const cfg = this.theme.tiles[type];
    const colour = parseInt(cfg.colour.replace('#', ''), 16);
    const s = this.tileSize - 4;

    const bg = this.add.rectangle(x, y, s, s, colour, 1)
      .setStrokeStyle(1, 0xffffff, 0.2);

    const label = this.add.text(x, y, cfg.emoji, {
      fontSize: `${Math.floor(s * 0.52)}px`,
    }).setOrigin(0.5, 0.5);

    return { type, bg, label, row, col };
  }

  private fixInitialMatches() {
    let changed = true;
    while (changed) {
      changed = false;
      const matches = this.findMatches();
      if (matches.size > 0) {
        changed = true;
        matches.forEach(tile => {
          let newType: number;
          do { newType = Phaser.Math.Between(0, TILE_TYPES - 1); }
          while (newType === tile.type);
          tile.type = newType;
          const cfg = this.theme.tiles[newType];
          tile.bg.fillColor = parseInt(cfg.colour.replace('#', ''), 16);
          tile.label.setText(cfg.emoji);
        });
      }
    }
  }

  // ─── SWAP ──────────────────────────────────────────────────────────────────

  private trySwap(a: Tile, b: Tile) {
    if (this.isProcessing) return;
    this.setHighlight(a, false);
    this.selectedTile = null;
    this.isProcessing = true;

    this.animateSwap(a, b, () => {
      this.swapInGrid(a, b);
      const matches = this.findMatches();
      if (matches.size > 0) {
        this.moves--;
        this.updateHUD();
        this.resolveMatches(matches);
      } else {
        // Invalid — swap back
        this.animateSwap(b, a, () => {
          this.swapInGrid(b, a);
          this.isProcessing = false;
        });
      }
    });
  }

  private animateSwap(a: Tile, b: Tile, onComplete: () => void) {
    const ax = this.tileX(a.col), ay = this.tileY(a.row);
    const bx = this.tileX(b.col), by = this.tileY(b.row);
    let done = 0;
    const check = () => { if (++done === 4) onComplete(); };

    this.tweens.add({ targets: a.bg, x: bx, y: by, duration: 140, ease: 'Quad.easeInOut', onComplete: check });
    this.tweens.add({ targets: a.label, x: bx, y: by, duration: 140, ease: 'Quad.easeInOut', onComplete: check });
    this.tweens.add({ targets: b.bg, x: ax, y: ay, duration: 140, ease: 'Quad.easeInOut', onComplete: check });
    this.tweens.add({ targets: b.label, x: ax, y: ay, duration: 140, ease: 'Quad.easeInOut', onComplete: check });
  }

  private swapInGrid(a: Tile, b: Tile) {
    const ar = a.row, ac = a.col;
    a.row = b.row; a.col = b.col;
    b.row = ar; b.col = ac;
    this.grid[a.row][a.col] = a;
    this.grid[b.row][b.col] = b;
  }

  // ─── MATCH DETECTION ───────────────────────────────────────────────────────

  private findMatches(): Set<Tile> {
    const matched = new Set<Tile>();

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        const a = this.grid[r][c], b = this.grid[r][c + 1], cc = this.grid[r][c + 2];
        if (a && b && cc && a.type === b.type && b.type === cc.type) {
          matched.add(a); matched.add(b); matched.add(cc);
          let i = c + 3;
          while (i < COLS && this.grid[r][i]?.type === a.type) { matched.add(this.grid[r][i]!); i++; }
        }
      }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 2; r++) {
        const a = this.grid[r][c], b = this.grid[r + 1][c], cc = this.grid[r + 2][c];
        if (a && b && cc && a.type === b.type && b.type === cc.type) {
          matched.add(a); matched.add(b); matched.add(cc);
          let i = r + 3;
          while (i < ROWS && this.grid[i]?.[c]?.type === a.type) { matched.add(this.grid[i]![c]!); i++; }
        }
      }
    }

    return matched;
  }

  // ─── RESOLVE ───────────────────────────────────────────────────────────────

  private resolveMatches(matches: Set<Tile>) {
    this.score += matches.size * 100;
    this.updateHUD();

    matches.forEach(t => this.destroyTile(t));

    this.time.delayedCall(220, () => {
      this.dropTiles();
      this.time.delayedCall(350, () => {
        this.spawnTiles();
        this.time.delayedCall(350, () => {
          const next = this.findMatches();
          if (next.size > 0) {
            this.resolveMatches(next);
          } else {
            this.isProcessing = false;
            this.checkState();
          }
        });
      });
    });
  }

  private destroyTile(tile: Tile) {
    this.grid[tile.row][tile.col] = null;

    // Score pop
    const pop = this.add.text(tile.bg.x, tile.bg.y, '+100', {
      fontSize: '14px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: pop, y: tile.bg.y - 35, alpha: 0, duration: 500, onComplete: () => pop.destroy() });

    // Destroy animation
    this.tweens.add({
      targets: [tile.bg, tile.label],
      scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 180,
      onComplete: () => { tile.bg.destroy(); tile.label.destroy(); }
    });
  }

  private dropTiles() {
    for (let col = 0; col < COLS; col++) {
      let empty = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row--) {
        const tile = this.grid[row][col];
        if (tile) {
          if (empty !== row) {
            this.grid[empty][col] = tile;
            this.grid[row][col] = null;
            tile.row = empty;
            const targetY = this.tileY(empty);
            this.tweens.add({ targets: [tile.bg, tile.label], y: targetY, duration: 200, ease: 'Quad.easeIn' });
          }
          empty--;
        }
      }
    }
  }

  private spawnTiles() {
    for (let col = 0; col < COLS; col++) {
      let spawnOffset = 0;
      for (let row = 0; row < ROWS; row++) {
        if (!this.grid[row][col]) {
          spawnOffset++;
          const type = Phaser.Math.Between(0, TILE_TYPES - 1);
          const startY = this.offsetY - spawnOffset * this.tileSize;
          const tile = this.makeTile(row, col, type, startY);
          this.grid[row][col] = tile;
          const targetY = this.tileY(row);
          this.tweens.add({ targets: [tile.bg, tile.label], y: targetY, duration: 280, ease: 'Bounce.easeOut' });
        }
      }
    }
  }

  // ─── HUD & STATE ───────────────────────────────────────────────────────────

  private updateHUD() {
    this.scoreText.setText(`SCORE\n${this.score.toLocaleString()}`);
    this.movesText.setText(`MOVES\n${this.moves}`);
    if (this.moves <= 5) this.movesText.setColor('#FF6B6B');
  }

  private checkState() {
    if (this.score >= TARGET_SCORE) {
      const coins = 100 + Math.max(0, this.moves * 10);
      this.onGameEvent({ score: this.score, levelComplete: true, coinsEarned: coins, moves: this.moves });
    } else if (this.moves <= 0) {
      this.onGameEvent({ score: this.score, outOfMoves: true, moves: 0 });
    }
  }

  public addMoves(count: number) {
    this.moves += count;
    this.movesText.setColor('#ffffff');
    this.updateHUD();
    this.isProcessing = false;
    this.checkState();
  }
}