import Phaser from 'phaser';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ARSENAL_RED   = 0xDB0007;
const ARSENAL_WHITE = 0xFFFFFF;
const ARSENAL_GOLD  = 0xFFD700;

// Perspective layout (as ratios of canvas size)
const HORIZON_Y_RATIO   = 0.38;   // where lanes converge
const PLAYER_Y_RATIO    = 0.80;   // player's ground level
const HUD_H             = 54;
const LANE_X_RATIOS     = [0.20, 0.50, 0.80]; // ground-level lane X

// Obstacle depth: 0 = far (horizon), 1 = at player
const BASE_DEPTH_SPEED  = 0.75;   // depth units/sec
const JUMP_VELOCITY     = 420;    // px/s upward
const JUMP_GRAVITY      = 900;    // px/s² downward
const LANE_LERP_SPEED   = 8;      // lane change smoothness

// Obstacle clear height threshold: player must jump at least this
// fraction of the obstacle's scaled height
const JUMP_CLEAR_FRAC   = 0.55;

// Obstacle types
const OBS_BALL    = 0;
const OBS_COACH   = 1;
const OBS_BUS     = 2;
const OBS_TRAIN   = 3;

// Height of each obstacle at full scale (depth=1)
const OBS_HEIGHTS: Record<number, number> = {
  [OBS_BALL]:  38,
  [OBS_COACH]: 72,
  [OBS_BUS]:   52,
  [OBS_TRAIN]: 58,
};

export type RunnerEvent =
  | { type: 'score'; score: number; coins: number }
  | { type: 'died'; score: number; coins: number }
  | { type: 'powerup'; kind: string };

interface Obstacle {
  container: Phaser.GameObjects.Container;
  gfx: Phaser.GameObjects.Graphics;
  depth: number;
  lane: number;
  type: number;
  checked: boolean;
}

interface Collectible {
  container: Phaser.GameObjects.Container;
  depth: number;
  lane: number;
  floatPhase: number;
}

export class ArsenalRunnerScene extends Phaser.Scene {
  // Player
  private playerLane   = 1;
  private playerX      = 0;
  private playerTargetX = 0;
  private playerGndY   = 0;
  private jumpOffset   = 0;   // how far above ground (positive = higher up on screen)
  private jumpVY       = 0;   // positive = moving upward
  private isJumping    = false;
  private playerGfx!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Graphics;

  // Perspective helpers
  private horizonY  = 0;
  private horizonX  = 0;
  private gndLaneX: number[] = [];

  // Game objects
  private obstacles:   Obstacle[]    = [];
  private collectibles: Collectible[] = [];
  private particles: Array<{ gfx: Phaser.GameObjects.Graphics; vx: number; vy: number; life: number; maxLife: number }> = [];

  // Game state
  private score       = 0;
  private coins       = 0;
  private depthSpeed  = BASE_DEPTH_SPEED;
  private isDead      = false;
  private gameStarted = false;
  private gameOver    = false;
  private isShielded  = false;
  private invincTimer = 0;

  // Timers
  private spawnTimer  = 0;
  private coinTimer   = 0;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private combo       = 0;

  // Callback
  private onEvent!: (e: RunnerEvent) => void;

  constructor() {
    super({ key: 'ArsenalRunnerScene' });
  }

  init() {
    const data = (typeof window !== 'undefined' && (window as any).__runnerData) || {};
    this.onEvent     = data.onEvent || (() => {});
    this.score       = 0; this.coins      = 0; this.depthSpeed = BASE_DEPTH_SPEED;
    this.isDead      = false; this.isShielded = false; this.gameOver = false;
    this.gameStarted = false; this.isJumping  = false; this.invincTimer = 0;
    this.playerLane  = 1; this.jumpOffset = 0; this.jumpVY = 0;
    this.spawnTimer  = 0; this.coinTimer  = 0; this.combo = 0;
    this.obstacles   = []; this.collectibles = []; this.particles = [];
  }

  create() {
    const { width, height } = this.scale;

    this.horizonY  = HUD_H + (height - HUD_H) * HORIZON_Y_RATIO;
    this.playerGndY = HUD_H + (height - HUD_H) * PLAYER_Y_RATIO;
    this.horizonX  = width * 0.5;
    this.gndLaneX  = LANE_X_RATIOS.map(r => width * r);
    this.playerX   = this.gndLaneX[1];
    this.playerTargetX = this.playerX;

    this.buildBackground();
    this.buildPlayer();
    this.buildHUD();
    this.buildTapToStart();

    // Input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.gameStarted) { this.startGame(); return; }
      if (this.gameOver) return;
      const third = this.scale.width / 3;
      if (p.x < third)       this.changeLane(-1);
      else if (p.x > third * 2) this.changeLane(1);
      else                   this.jump();
    });

    this.input.keyboard?.on('keydown-SPACE', () => { if (!this.gameStarted) { this.startGame(); return; } this.jump(); });
    this.input.keyboard?.on('keydown-UP',    () => this.jump());
    this.input.keyboard?.on('keydown-LEFT',  () => this.changeLane(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changeLane(1));
  }

  // ─── BACKGROUND ────────────────────────────────────────────────────────────

  private buildBackground() {
    const { width, height } = this.scale;

    // Sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x050a1a, 0x050a1a, 0x2a0a0a, 0x2a0a0a, 1);
    sky.fillRect(0, HUD_H, width, this.horizonY - HUD_H);

    // Crowd stands — triangular wedges on each side
    const crowd = this.add.graphics();
    crowd.fillStyle(0x5a0000, 1);
    // Left stand
    crowd.fillTriangle(0, HUD_H, this.horizonX - 10, this.horizonY, 0, this.horizonY);
    // Right stand
    crowd.fillTriangle(width, HUD_H, this.horizonX + 10, this.horizonY, width, this.horizonY);

    // Crowd dots
    for (let i = 0; i < 100; i++) {
      const side = i < 50;
      const cx = side
        ? Math.random() * (this.horizonX * 0.6)
        : width - Math.random() * (this.horizonX * 0.6);
      const cy = HUD_H + Math.random() * (this.horizonY - HUD_H - 4);
      crowd.fillStyle(Math.random() > 0.5 ? ARSENAL_RED : ARSENAL_WHITE, 0.55);
      crowd.fillCircle(cx, cy, 2 + Math.random() * 2);
    }

    // Fan chant words tucked into the crowd stand triangles
    // Left stand
    this.add.text(width * 0.07, HUD_H + (this.horizonY - HUD_H) * 0.25, 'COYG', {
      fontSize: '9px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.38).setDepth(2);
    this.add.text(width * 0.09, HUD_H + (this.horizonY - HUD_H) * 0.55, 'NORTH\nLONDON', {
      fontSize: '8px', color: '#FFD700', fontStyle: 'bold', align: 'center', lineSpacing: 1,
    }).setOrigin(0.5).setAlpha(0.32).setDepth(2);
    this.add.text(width * 0.06, HUD_H + (this.horizonY - HUD_H) * 0.82, 'FOREVER', {
      fontSize: '7px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0.28).setDepth(2);
    // Right stand
    this.add.text(width * 0.93, HUD_H + (this.horizonY - HUD_H) * 0.28, 'MIKEL', {
      fontSize: '9px', color: '#FFD700', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0.38).setDepth(2);
    this.add.text(width * 0.91, HUD_H + (this.horizonY - HUD_H) * 0.50, 'ARTETA', {
      fontSize: '9px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0.32).setDepth(2);
    this.add.text(width * 0.93, HUD_H + (this.horizonY - HUD_H) * 0.76, 'INVINCIBLES', {
      fontSize: '7px', color: '#FFD700', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0.25).setDepth(2);

    // Advertising boards at horizon edge
    const adBar = this.add.graphics();
    adBar.fillStyle(ARSENAL_RED, 1);
    adBar.fillRect(0, this.horizonY - 10, width, 10);
    for (let i = 0; i < 5; i++) {
      this.add.text((i / 5) * width + 6, this.horizonY - 10, 'ARSENAL FC', {
        fontSize: '7px', color: '#ffffff', fontStyle: 'bold',
      }).setDepth(3);
    }

    // Pitch — perspective trapezoid
    const pitch = this.add.graphics();
    pitch.fillStyle(0x1f6b1f, 1);
    pitch.fillPoints([
      { x: this.horizonX - 12, y: this.horizonY },
      { x: this.horizonX + 12, y: this.horizonY },
      { x: width * 1.1,        y: height },
      { x: -width * 0.1,       y: height },
    ], true);

    // Pitch stripes (perspective bands)
    const stripeG = this.add.graphics();
    stripeG.fillStyle(0x177a17, 0.5);
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        const t0 = i / 7, t1 = (i + 0.5) / 7;
        const y0 = Phaser.Math.Linear(this.horizonY, height, t0);
        const y1 = Phaser.Math.Linear(this.horizonY, height, t1);
        const xLeft0  = Phaser.Math.Linear(this.horizonX, -width * 0.1,  t0);
        const xRight0 = Phaser.Math.Linear(this.horizonX,  width * 1.1,  t0);
        const xLeft1  = Phaser.Math.Linear(this.horizonX, -width * 0.1,  t1);
        const xRight1 = Phaser.Math.Linear(this.horizonX,  width * 1.1,  t1);
        stripeG.fillPoints([{ x: xLeft0, y: y0 }, { x: xRight0, y: y0 }, { x: xRight1, y: y1 }, { x: xLeft1, y: y1 }], true);
      }
    }

    // Lane dividers — converging lines from horizon to bottom
    const laneG = this.add.graphics();
    laneG.lineStyle(2, ARSENAL_WHITE, 0.2);
    // Outer edges
    laneG.lineBetween(this.horizonX, this.horizonY, -width * 0.05, height);
    laneG.lineBetween(this.horizonX, this.horizonY, width * 1.05,  height);
    // Inner dividers
    laneG.lineStyle(1, ARSENAL_WHITE, 0.12);
    const ldiv1 = Phaser.Math.Linear(this.gndLaneX[0], this.gndLaneX[1], 0.5);
    const ldiv2 = Phaser.Math.Linear(this.gndLaneX[1], this.gndLaneX[2], 0.5);
    laneG.lineBetween(this.horizonX, this.horizonY, ldiv1, height);
    laneG.lineBetween(this.horizonX, this.horizonY, ldiv2, height);
  }

  // ─── PLAYER ────────────────────────────────────────────────────────────────

  private buildPlayer() {
    const container = this.add.container(this.gndLaneX[1], this.playerGndY);
    const body = this.add.graphics();
    this.drawPlayerBack(body);
    container.add(body);
    this.playerBody = body;
    this.playerGfx  = container;
    this.playerGfx.setDepth(12);
  }

  private drawPlayerBack(g: Phaser.GameObjects.Graphics, shielded = false) {
    g.clear();

    if (shielded) {
      g.fillStyle(ARSENAL_GOLD, 0.25); g.fillCircle(0, -30, 38);
      g.lineStyle(2, ARSENAL_GOLD, 0.8); g.strokeCircle(0, -30, 38);
    }

    // Boots
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-14, 2, 11, 8, 3);
    g.fillRoundedRect(3,   2, 11, 8, 3);

    // Socks — red
    g.fillStyle(ARSENAL_RED, 1);
    g.fillRect(-13, -12, 10, 14);
    g.fillRect(3,   -12, 10, 14);

    // Shorts — white
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRect(-14, -26, 28, 14);

    // Jersey back — Arsenal red
    g.fillStyle(ARSENAL_RED, 1);
    g.fillRoundedRect(-13, -54, 26, 30, 4);

    // White collar strip
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRect(-7, -54, 14, 5);

    // Squad number "9" on back
    this.drawNumber9(g, 0, -40);

    // Head
    g.fillStyle(0xf4a460, 1);
    g.fillCircle(0, -62, 11);

    // Hair
    g.fillStyle(0x2a1200, 1);
    g.fillRoundedRect(-11, -73, 22, 13, { tl: 9, tr: 9, bl: 0, br: 0 });
  }

  private drawNumber9(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    // Simplified "9" drawn with rectangles
    g.fillStyle(ARSENAL_WHITE, 0.85);
    g.fillRect(cx - 5, cy,     10, 2); // top
    g.fillRect(cx - 5, cy + 6, 10, 2); // mid
    g.fillRect(cx - 5, cy,      2, 8); // left upper
    g.fillRect(cx + 3, cy,      2, 16); // right full
    g.fillRect(cx - 5, cy + 14, 10, 2); // bottom
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  private buildHUD() {
    const { width } = this.scale;

    const hud = this.add.graphics();
    hud.fillStyle(ARSENAL_RED, 0.93);
    hud.fillRect(0, 0, width, HUD_H);
    hud.fillStyle(ARSENAL_GOLD, 1);
    hud.fillRect(0, HUD_H - 2, width, 2);
    hud.setDepth(20);

    this.add.text(12, 8, 'SCORE', { fontSize: '9px', color: '#ffffff88', fontStyle: 'bold', letterSpacing: 2 }).setDepth(21);
    this.scoreText = this.add.text(12, 20, '0', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setDepth(21);

    this.add.text(width / 2, 8, '🪙 COINS', { fontSize: '9px', color: '#ffffff88', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(21);
    this.coinsText = this.add.text(width / 2, 20, '0', { fontSize: '20px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(21);

    this.add.text(width - 12, 8, 'RUN', { fontSize: '9px', color: '#ffffff88', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(21);
    this.add.text(width - 12, 20, '⚽', { fontSize: '18px' }).setOrigin(1, 0).setDepth(21);

    this.comboText = this.add.text(width / 2, 90, '', { fontSize: '18px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5).setDepth(22).setAlpha(0);
  }

  // ─── START SCREEN ──────────────────────────────────────────────────────────

  private buildTapToStart() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);

    const trophy = this.add.text(width / 2, height * 0.18, '🏆', { fontSize: '72px' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: trophy, y: height * 0.18 - 12, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(width / 2, height * 0.36, 'ARSENAL', { fontSize: '28px', color: '#DB0007', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.44, 'CHASE THE TEAM BUS 🚌', { fontSize: '19px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.52, '2024/25 Season', { fontSize: '13px', color: '#ffffff55' }).setOrigin(0.5).setDepth(31);

    const btn = this.add.graphics().setDepth(31);
    btn.fillStyle(ARSENAL_RED, 1);
    btn.fillRoundedRect(-100, -24, 200, 48, 24);
    btn.lineStyle(2, ARSENAL_GOLD, 1);
    btn.strokeRoundedRect(-100, -24, 200, 48, 24);
    btn.setPosition(width / 2, height * 0.65);

    const btnText = this.add.text(width / 2, height * 0.65, '▶  START THE RUN', { fontSize: '15px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: [btn, btnText], scaleX: 1.05, scaleY: 1.05, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.76, 'TAP LEFT / RIGHT to dodge\nTAP CENTRE to jump', {
      fontSize: '11px', color: '#ffffff55', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(31);

    (this as any)._startOverlay = [overlay, trophy, btn, btnText];
    (this as any)._startTexts   = this.children.list.filter((c: any) => c.type === 'Text' && c.depth === 31);
  }

  private startGame() {
    this.gameStarted = true;
    const items = [...((this as any)._startOverlay || []), ...((this as any)._startTexts || [])];
    items.forEach((o: any) => { try { o.destroy(); } catch (_) {} });
  }

  // ─── PERSPECTIVE HELPERS ───────────────────────────────────────────────────

  private perspX(lane: number, depth: number): number {
    return Phaser.Math.Linear(this.horizonX, this.gndLaneX[lane], depth);
  }

  private perspY(depth: number): number {
    return Phaser.Math.Linear(this.horizonY, this.playerGndY, depth);
  }

  private perspScale(depth: number): number {
    // Non-linear scale for a more realistic perspective feel
    return Math.pow(Math.max(depth, 0), 0.65);
  }

  // ─── SPAWNING ──────────────────────────────────────────────────────────────

  private spawnObstacle() {
    const lane = Phaser.Math.Between(0, 2);
    const type = Phaser.Math.Between(0, 3);

    const container = this.add.container(this.horizonX, this.horizonY);
    const gfx = this.add.graphics();
    this.drawObstacle(gfx, type);
    container.add(gfx);
    container.setScale(0.05);
    container.setDepth(5);

    this.obstacles.push({ container, gfx, depth: 0, lane, type, checked: false });
  }

  private drawObstacle(g: Phaser.GameObjects.Graphics, type: number) {
    g.clear();
    if (type === OBS_BALL) {
      // Football
      g.fillStyle(0xEEEEEE, 1);
      g.fillCircle(0, -20, 19);
      g.fillStyle(0x111111, 1);
      // Hex patches
      g.fillCircle(0, -20, 7);
      g.fillCircle(-12, -26, 5);
      g.fillCircle(12, -26, 5);
      g.fillCircle(-12, -14, 5);
      g.fillCircle(12, -14, 5);
    } else if (type === OBS_COACH) {
      // Manager/coach (suit figure)
      g.fillStyle(0x1a1a2a, 1);
      g.fillRoundedRect(-12, -64, 24, 30, 3); // jacket body
      g.fillStyle(0xEEEEE0, 1);
      g.fillRect(-2, -62, 4, 26); // shirt/tie
      g.fillStyle(0xf4a460, 1);
      g.fillCircle(0, -72, 10);   // head
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(-12, -34, 10, 14); // left leg
      g.fillRect(2, -34, 10, 14);   // right leg
      g.fillRoundedRect(-13, -22, 10, 7, 2); // left shoe
      g.fillRoundedRect(3, -22, 10, 7, 2);   // right shoe
      g.fillStyle(0x1a1a2a, 1);
      g.fillRect(-20, -58, 10, 6); // left arm
      g.fillRect(10, -58, 10, 6);  // right arm
      // Clipboard
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(10, -58, 16, 20, 2);
      g.fillStyle(0x0000ff, 0.5);
      g.fillRect(12, -55, 12, 2);
      g.fillRect(12, -50, 12, 2);
    } else if (type === OBS_BUS) {
      // Team bus
      g.fillStyle(ARSENAL_RED, 1);
      g.fillRoundedRect(-40, -46, 80, 46, 6);
      g.fillStyle(0x111111, 0.4);
      g.fillRoundedRect(-35, -42, 22, 14, 3); // window 1
      g.fillRoundedRect(-8,  -42, 22, 14, 3); // window 2
      g.fillRoundedRect(19,  -42, 16, 14, 3); // window 3
      g.fillStyle(ARSENAL_GOLD, 1);
      g.fillRect(-38, -50, 76, 4);            // gold stripe
      g.fillStyle(0x222222, 1);
      g.fillCircle(-25, 2, 8); // wheel
      g.fillCircle(25, 2, 8);  // wheel
      // Arsenal badge hint
      this.add; // can't use add.text inside drawObstacle — skip text
    } else {
      // Train (tube/underground)
      g.fillStyle(0xCC0000, 1);
      g.fillRoundedRect(-50, -52, 100, 52, 8);
      g.fillStyle(0x111111, 0.35);
      g.fillRoundedRect(-44, -46, 24, 16, 3);
      g.fillRoundedRect(-14, -46, 24, 16, 3);
      g.fillRoundedRect(16,  -46, 24, 16, 3);
      g.fillStyle(ARSENAL_RED, 1);
      g.fillRect(-48, -56, 96, 4);  // top stripe
      g.fillStyle(0xFFD700, 0.9);
      g.fillRect(-48, -32, 96, 3);  // mid stripe
      g.fillStyle(0x222222, 1);
      g.fillCircle(-32, 2, 9); // wheel
      g.fillCircle(0,  2, 9);
      g.fillCircle(32, 2, 9);
    }
  }

  private spawnCoin() {
    const lane = Phaser.Math.Between(0, 2);
    const container = this.add.container(this.horizonX, this.horizonY);

    const gfx = this.add.graphics();
    gfx.fillStyle(ARSENAL_GOLD, 1);
    gfx.fillCircle(0, -15, 12);
    gfx.lineStyle(2, 0xCC9900, 1);
    gfx.strokeCircle(0, -15, 12);
    gfx.fillStyle(ARSENAL_RED, 1);
    // "A" letter inside the coin
    gfx.fillTriangle(-5, -8, 5, -8, 0, -22);
    gfx.fillStyle(ARSENAL_GOLD, 1);
    gfx.fillTriangle(-3, -11, 3, -11, 0, -19);
    container.add(gfx);
    container.setScale(0.05);
    container.setDepth(5);

    this.collectibles.push({ container, depth: 0, lane, floatPhase: Math.random() * Math.PI * 2 });
  }

  // ─── CONTROLS ──────────────────────────────────────────────────────────────

  private jump() {
    if (this.isDead || !this.gameStarted) return;
    if (!this.isJumping) {
      this.jumpVY = JUMP_VELOCITY;
      this.isJumping = true;
    } else if (this.jumpVY < 100) {
      // Double jump
      this.jumpVY = JUMP_VELOCITY * 0.6;
    }
  }

  private changeLane(dir: -1 | 1) {
    if (this.isDead || !this.gameStarted) return;
    const newLane = Phaser.Math.Clamp(this.playerLane + dir, 0, 2);
    if (newLane === this.playerLane) return;
    this.playerLane = newLane;
    this.playerTargetX = this.gndLaneX[newLane];
  }

  // ─── DEATH ─────────────────────────────────────────────────────────────────

  private die() {
    if (this.isDead) return;
    this.isDead = true;
    this.gameOver = true;
    this.tweens.add({
      targets: this.playerGfx, y: this.playerGfx.y - 80, angle: 360, alpha: 0,
      duration: 600, ease: 'Quad.easeOut',
      onComplete: () => this.onEvent({ type: 'died', score: this.score, coins: this.coins }),
    });
  }

  // ─── PARTICLES ─────────────────────────────────────────────────────────────

  private spawnParticles(x: number, y: number, colour: number) {
    for (let i = 0; i < 6; i++) {
      const g = this.add.graphics().setDepth(15);
      g.fillStyle(colour, 1); g.fillCircle(0, 0, Phaser.Math.Between(3, 7));
      g.setPosition(x, y);
      const angle = Math.random() * Math.PI * 2;
      const spd   = Phaser.Math.Between(60, 130);
      this.particles.push({ gfx: g, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 350, maxLife: 350 });
    }
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.gameStarted || this.gameOver) return;
    const dt = delta / 1000;

    // Score ticks up continuously
    this.score += Math.floor(this.depthSpeed * 60);

    // Speed ramp
    this.depthSpeed = BASE_DEPTH_SPEED + Math.floor(this.score / 2000) * 0.06;

    // ── Player physics ──────────────────────────────────────────────────────
    if (this.isJumping) {
      this.jumpVY     -= JUMP_GRAVITY * dt;
      this.jumpOffset += this.jumpVY * dt;
      if (this.jumpOffset <= 0) {
        this.jumpOffset = 0;
        this.jumpVY     = 0;
        this.isJumping  = false;
      }
    }

    // Smooth lane change
    this.playerX = Phaser.Math.Linear(this.playerX, this.playerTargetX, LANE_LERP_SPEED * dt);
    this.playerGfx.x = this.playerX;
    this.playerGfx.y = this.playerGndY - this.jumpOffset;

    // Running bob when on ground
    if (!this.isJumping) {
      this.playerGfx.y = this.playerGndY - Math.abs(Math.sin(Date.now() * 0.008)) * 5;
    }

    // Invincibility timer
    if (this.invincTimer > 0) {
      this.invincTimer -= delta;
      if (this.invincTimer <= 0) { this.invincTimer = 0; this.isShielded = false; this.drawPlayerBack(this.playerBody, false); }
    }

    // ── Obstacles ───────────────────────────────────────────────────────────
    this.obstacles = this.obstacles.filter(o => {
      o.depth += this.depthSpeed * dt;

      const scale = this.perspScale(o.depth);
      const px    = this.perspX(o.lane, o.depth);
      const py    = this.perspY(o.depth);

      o.container.setPosition(px, py);
      o.container.setScale(scale);
      o.container.setDepth(4 + o.depth * 8);

      // Collision zone: when obstacle is in the lower 30% of its travel
      if (o.depth >= 0.85 && !o.checked) {
        o.checked = true;
        if (o.lane === this.playerLane) {
          const clearNeeded = OBS_HEIGHTS[o.type] * JUMP_CLEAR_FRAC;
          if (this.jumpOffset < clearNeeded) {
            if (this.isShielded || this.invincTimer > 0) {
              this.isShielded = false;
              this.invincTimer = 0;
              this.drawPlayerBack(this.playerBody, false);
              this.spawnParticles(px, py, ARSENAL_GOLD);
            } else {
              this.die();
            }
          } else {
            // Jumped over! Score bonus
            this.score += 250;
            this.combo++;
            if (this.combo >= 3) {
              this.comboText.setText(`${this.combo}x COMBO! 🔥`);
              this.comboText.setAlpha(1);
              this.tweens.killTweensOf(this.comboText);
              this.tweens.add({ targets: this.comboText, alpha: 0, duration: 900, delay: 500 });
            }
          }
        }
      }

      if (o.depth > 1.25) { o.container.destroy(); return false; }
      return true;
    });

    // ── Collectibles ────────────────────────────────────────────────────────
    this.collectibles = this.collectibles.filter(c => {
      c.depth += this.depthSpeed * dt;
      c.floatPhase += dt * 3;

      const scale = this.perspScale(c.depth);
      const px    = this.perspX(c.lane, c.depth);
      const py    = this.perspY(c.depth) - Math.sin(c.floatPhase) * 5 * scale;

      c.container.setPosition(px, py);
      c.container.setScale(scale);
      c.container.setDepth(4 + c.depth * 8);

      // Collect
      if (c.depth >= 0.85) {
        if (c.lane === this.playerLane) {
          this.coins++;
          this.score += 100;
          this.spawnParticles(px, py, ARSENAL_GOLD);
          c.container.destroy();
          return false;
        }
      }

      if (c.depth > 1.2) { c.container.destroy(); return false; }
      return true;
    });

    // ── Spawn timers ─────────────────────────────────────────────────────────
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = Phaser.Math.Between(900, 1800) / (this.depthSpeed / BASE_DEPTH_SPEED);
    }

    this.coinTimer -= delta;
    if (this.coinTimer <= 0) {
      this.spawnCoin();
      this.coinTimer = Phaser.Math.Between(700, 1400);
    }

    // ── Particles ────────────────────────────────────────────────────────────
    this.particles = this.particles.filter(p => {
      p.life -= delta;
      p.vy   += 180 * dt;
      p.gfx.x += p.vx * dt;
      p.gfx.y += p.vy * dt;
      p.gfx.setAlpha(p.life / p.maxLife);
      if (p.life <= 0) { p.gfx.destroy(); return false; }
      return true;
    });

    // ── HUD update ───────────────────────────────────────────────────────────
    this.scoreText.setText(this.score.toLocaleString());
    this.coinsText.setText(`${this.coins}`);

    if (Math.floor(Date.now() / 1000) % 5 === 0) {
      this.onEvent({ type: 'score', score: this.score, coins: this.coins });
    }
  }
}
