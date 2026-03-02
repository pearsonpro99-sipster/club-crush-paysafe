import Phaser from 'phaser';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ARSENAL_RED   = 0xEF0107;
const ARSENAL_WHITE = 0xFFFFFF;
const ARSENAL_GOLD  = 0xFFD700;
const ARSENAL_DARK  = 0x0a0505;
const ARSENAL_GREEN = 0x22781F; // pitch

const GRAVITY        = 1400;
const FLAP_VELOCITY  = -520;
const PIPE_SPEED     = 165;
const PIPE_GAP       = 132;
const PIPE_GAP_MIN   = 92;
const PIPE_SPEED_MAX = 285;
const PIPE_WIDTH     = 52;
const PIPE_INTERVAL  = 1900;
const PLAYER_X       = 90;
const GROUND_RATIO   = 0.88;

export type ArsenalFlapperEvent =
  | { type: 'score'; score: number }
  | { type: 'died'; score: number };

export type ArsenalCharacter = 'gunnersaurus' | 'saka' | 'odegaard' | 'henry';

interface Pipe {
  top: Phaser.GameObjects.Graphics;
  bottom: Phaser.GameObjects.Graphics;
  scored: boolean;
  x: number;
  gapTopY: number;
  gapBottomY: number;
}

interface Collectible {
  obj: Phaser.GameObjects.Text;
  x: number;
  y: number;
  bonus: number;
  collected: boolean;
}

export class ArsenalFlapperScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerY = 0;
  private playerVY = 0;
  private isDead = false;
  private gameStarted = false;
  private score = 0;
  private pipes: Pipe[] = [];
  private collectibles: Collectible[] = [];
  private pipeTimer = 0;
  private groundY = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private onEvent!: (e: ArsenalFlapperEvent) => void;
  private character: ArsenalCharacter = 'gunnersaurus';
  private groundGfx!: Phaser.GameObjects.Graphics;
  private currentPipeSpeed = PIPE_SPEED;
  private currentPipeGap   = PIPE_GAP;

  constructor() {
    super({ key: 'ArsenalFlapperScene' });
  }

  init() {
    const data = (typeof window !== 'undefined' && (window as any).__arsenalData) || {};
    this.onEvent  = data.onEvent || (() => {});
    this.character = data.character || 'gunnersaurus';
    this.score = 0;
    this.isDead = false;
    this.gameStarted = false;
    this.playerVY = 0;
    this.pipes = [];
    this.collectibles = [];
    this.pipeTimer = 0;
    this.currentPipeSpeed = PIPE_SPEED;
    this.currentPipeGap   = PIPE_GAP;
  }

  create() {
    const { width, height } = this.scale;
    this.groundY = height * GROUND_RATIO;
    this.playerY = height * 0.42;

    this.buildBackground();
    this.buildGround();
    this.buildPlayer();
    this.buildHUD();
    this.buildTapToStart();

    this.input.on('pointerdown', () => {
      if (!this.gameStarted) { this.startGame(); return; }
      if (this.isDead) return;
      this.flap();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.gameStarted) { this.startGame(); return; }
      if (this.isDead) return;
      this.flap();
    });
  }

  // ─── BACKGROUND ────────────────────────────────────────────────────────────

  private buildBackground() {
    const { width, height } = this.scale;

    // Dark sky — Emirates night atmosphere
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x05000a, 0x05000a, 0x1a0505, 0x1a0505, 1);
    sky.fillRect(0, 0, width, height * 0.55);

    // Stadium stands — red and white Arsenal sections
    const stands = this.add.graphics();
    stands.fillStyle(0x8B0000, 1);
    stands.fillRect(0, height * 0.09, width, height * 0.29);

    // Crowd dots
    for (let i = 0; i < 130; i++) {
      const cx = Math.random() * width;
      const cy = height * 0.09 + Math.random() * (height * 0.26);
      const isWhite = Math.random() > 0.55;
      stands.fillStyle(isWhite ? 0xFFFFFF : ARSENAL_RED, 0.6);
      stands.fillCircle(cx, cy, 2 + Math.random() * 2.5);
    }

    // Advertising board — Arsenal red
    stands.fillStyle(ARSENAL_RED, 1);
    stands.fillRect(0, height * 0.37, width, 10);
    for (let i = 0; i < 4; i++) {
      this.add.text(
        (i / 4) * width + 10, height * 0.37 + 1,
        'ARSENAL FC · EMIRATES',
        { fontSize: '7px', color: '#FFD700', fontStyle: 'bold' }
      ).setDepth(2);
    }

    // Stand text
    this.add.text(width * 0.5, height * 0.17, 'ARSENAL', {
      fontSize: '26px', color: '#EF0107', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.38).setDepth(2);
    this.add.text(width * 0.25, height * 0.28, 'NORTH\nBANK', {
      fontSize: '10px', color: '#FFD700', fontStyle: 'bold', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.3).setDepth(2);
    this.add.text(width * 0.75, height * 0.22, 'CLOCK\nEND', {
      fontSize: '10px', color: '#FFFFFF', fontStyle: 'bold', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.25).setDepth(2);

    // Pitch
    const pitch = this.add.graphics();
    pitch.fillStyle(ARSENAL_GREEN, 1);
    pitch.fillRect(0, height * 0.42, width, height * 0.46);
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        pitch.fillStyle(0x1e6b1e, 0.5);
        pitch.fillRect(0, height * 0.42 + i * (height * 0.065), width, height * 0.032);
      }
    }
  }

  private buildGround() {
    const { width, height } = this.scale;
    this.groundGfx = this.add.graphics();
    this.groundGfx.fillStyle(0x1a5c00, 1);
    this.groundGfx.fillRect(0, this.groundY, width, height - this.groundY);
    this.groundGfx.lineStyle(3, 0xFFFFFF, 0.65);
    this.groundGfx.lineBetween(0, this.groundY, width, this.groundY);
    for (let x = 0; x < width; x += 30) {
      this.groundGfx.fillStyle(0xFFFFFF, 0.25);
      this.groundGfx.fillRect(x, this.groundY + 12, 16, 3);
    }
    this.groundGfx.setDepth(6);
  }

  // ─── PLAYER CHARACTER ──────────────────────────────────────────────────────

  private buildPlayer() {
    const container = this.add.container(PLAYER_X, this.playerY);
    const gfx = this.add.graphics();
    this.drawCharacter(gfx);
    container.add(gfx);
    this.player = container;
    this.player.setDepth(10);
  }

  private drawCharacter(g: Phaser.GameObjects.Graphics) {
    g.clear();
    switch (this.character) {
      case 'gunnersaurus': this.drawGunnersaurus(g); break;
      case 'saka':         this.drawSaka(g); break;
      case 'odegaard':     this.drawOdegaard(g); break;
      case 'henry':        this.drawHenry(g); break;
    }
  }

  /** Gunnersaurus — iconic green dinosaur mascot */
  private drawGunnersaurus(g: Phaser.GameObjects.Graphics) {
    // Body — chunky green dino shape
    g.fillStyle(0x2ECC40, 1);
    g.fillEllipse(0, 2, 38, 34);

    // Belly — lighter green
    g.fillStyle(0x7FE57F, 1);
    g.fillEllipse(0, 6, 22, 22);

    // Arsenal red scarf/jersey stripe
    g.fillStyle(ARSENAL_RED, 1);
    g.fillRect(-19, -4, 38, 8);

    // White stripe on jersey
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRect(-19, 0, 38, 2);

    // Spikes on back (top of body)
    g.fillStyle(0x27AE60, 1);
    for (let i = -2; i <= 2; i++) {
      const sx = i * 7;
      g.fillTriangle(sx - 4, -12, sx + 4, -12, sx, -26 + Math.abs(i) * 3);
    }

    // Head — big round
    g.fillStyle(0x2ECC40, 1);
    g.fillCircle(4, -20, 14);

    // Snout
    g.fillStyle(0x27AE60, 1);
    g.fillEllipse(14, -18, 16, 10);

    // Big eye
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillCircle(-2, -24, 7);
    g.fillStyle(0x111111, 1);
    g.fillCircle(0, -24, 4);
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillCircle(1, -26, 1.5);

    // Teeth (friendly, showing)
    g.fillStyle(ARSENAL_WHITE, 1);
    for (let t = 0; t < 3; t++) {
      g.fillRect(8 + t * 4, -15, 3, 5);
    }

    // Tiny arms
    g.fillStyle(0x2ECC40, 1);
    g.fillRoundedRect(-18, -2, 8, 5, 2);
    g.fillRoundedRect(10, -2, 8, 5, 2);

    // Legs
    g.fillStyle(0x27AE60, 1);
    g.fillRoundedRect(-10, 16, 9, 12, 3);
    g.fillRoundedRect(1, 16, 9, 12, 3);
    g.fillStyle(0x1a7a30, 1);
    g.fillRoundedRect(-11, 26, 11, 5, 3);
    g.fillRoundedRect(0, 26, 11, 5, 3);
  }

  /** Bukayo Saka — Arsenal No. 7, lightning celebration */
  private drawSaka(g: Phaser.GameObjects.Graphics) {
    // Body — Arsenal red kit
    g.fillStyle(ARSENAL_RED, 1);
    g.fillEllipse(0, 0, 34, 30);

    // White kit detail (sleeves)
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRoundedRect(-20, -8, 10, 7, 3);
    g.fillRoundedRect(10, -8, 10, 7, 3);

    // Red shorts
    g.fillStyle(ARSENAL_RED, 1);
    g.fillRect(-10, 12, 20, 10);

    // White socks
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRect(-10, 22, 8, 9);
    g.fillRect(2, 22, 8, 9);

    // Dark boots
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-11, 29, 10, 5, 3);
    g.fillRoundedRect(1, 29, 10, 5, 3);

    // No. 7 on chest
    g.fillStyle(ARSENAL_WHITE, 1);
    // Number 7 — simplified
    g.fillRect(-4, -6, 8, 2);
    g.fillRect(2, -6, 2, 12);
    g.fillRect(-4, -6, 2, 5);

    // Head — darker skin tone
    g.fillStyle(0x8B5C2A, 1);
    g.fillCircle(0, -19, 12);

    // Short black hair
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-12, -31, 24, 14, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Eyes
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillCircle(-4, -20, 3.5);
    g.fillCircle(4, -20, 3.5);
    g.fillStyle(0x222222, 1);
    g.fillCircle(-3, -20, 2);
    g.fillCircle(5, -20, 2);

    // Smile
    g.fillStyle(0x5a3010, 1);
    g.fillRect(-4, -13, 8, 2);

    // Lightning bolt accent (Saka's iconic celebration)
    g.fillStyle(ARSENAL_GOLD, 1);
    g.fillTriangle(6, -4, 3, 2, 8, 2);
    g.fillTriangle(8, 2, 4, 2, 7, 8);
  }

  /** Martin Ødegaard — Captain No. 8, captain's armband */
  private drawOdegaard(g: Phaser.GameObjects.Graphics) {
    // Body — Arsenal red kit
    g.fillStyle(ARSENAL_RED, 1);
    g.fillEllipse(0, 0, 34, 30);

    // White sleeves
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRoundedRect(-20, -8, 10, 7, 3);
    g.fillRoundedRect(10, -8, 10, 7, 3);

    // Red shorts
    g.fillStyle(ARSENAL_RED, 1);
    g.fillRect(-10, 12, 20, 10);

    // White socks
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRect(-10, 22, 8, 9);
    g.fillRect(2, 22, 8, 9);

    // Dark boots
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-11, 29, 10, 5, 3);
    g.fillRoundedRect(1, 29, 10, 5, 3);

    // Captain's armband (gold on left arm)
    g.fillStyle(ARSENAL_GOLD, 1);
    g.fillRect(-22, -9, 12, 4);

    // No. 8 on chest — simplified figure-8
    g.fillStyle(ARSENAL_WHITE, 1);
    g.lineStyle(2, ARSENAL_WHITE, 1);
    g.strokeCircle(0, -7, 3.5);
    g.strokeCircle(0, -1, 3.5);

    // Head — pale Nordic skin
    g.fillStyle(0xF5CBA7, 1);
    g.fillCircle(0, -19, 12);

    // Light brown hair — wavy
    g.fillStyle(0xB8860B, 1);
    g.fillRoundedRect(-12, -31, 24, 15, { tl: 10, tr: 10, bl: 2, br: 2 });
    // Hair sweep
    g.fillStyle(0xA0780A, 1);
    g.fillEllipse(-8, -28, 10, 6);
    g.fillEllipse(8, -26, 10, 5);

    // Eyes
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillCircle(-4, -20, 3.5);
    g.fillCircle(4, -20, 3.5);
    g.fillStyle(0x2244AA, 1); // blue eyes
    g.fillCircle(-3, -20, 2);
    g.fillCircle(5, -20, 2);

    // Binoculars hands (Ødegaard's iconic celebration)
    g.lineStyle(2.5, 0xF5CBA7, 1);
    g.strokeCircle(-5, -19, 4);
    g.strokeCircle(5, -19, 4);
    g.lineStyle(2, 0xF5CBA7, 1);
    g.lineBetween(-1, -19, 1, -19);
  }

  /** Thierry Henry — Legend No. 14, iconic Spidey celebration */
  private drawHenry(g: Phaser.GameObjects.Graphics) {
    // Body — classic Arsenal Invincibles red/white kit
    g.fillStyle(ARSENAL_RED, 1);
    g.fillEllipse(0, 0, 34, 32);

    // White vertical stripe (classic 2003-04 kit style)
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRect(-4, -14, 8, 28);

    // Arms — wide wingspan (Spidey pose)
    g.fillStyle(ARSENAL_RED, 1);
    g.fillRoundedRect(-24, -10, 16, 6, 3);
    g.fillRoundedRect(8, -10, 16, 6, 3);

    // White sleeves
    g.fillStyle(ARSENAL_WHITE, 0.6);
    g.fillRoundedRect(-24, -10, 7, 6, 3);
    g.fillRoundedRect(17, -10, 7, 6, 3);

    // Red shorts
    g.fillStyle(ARSENAL_RED, 1);
    g.fillRect(-10, 12, 20, 10);

    // White socks
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillRect(-10, 22, 8, 9);
    g.fillRect(2, 22, 8, 9);

    // Dark boots
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-11, 29, 10, 5, 3);
    g.fillRoundedRect(1, 29, 10, 5, 3);

    // No. 14 on chest
    g.fillStyle(ARSENAL_GOLD, 0.85);
    // "1" — simple vertical bar
    g.fillRect(-7, -8, 2, 10);
    // "4" — simplified
    g.fillRect(-2, -8, 2, 6);
    g.fillRect(-2, -8, 6, 2);
    g.fillRect(2, -8, 2, 10);

    // Head — dark skin tone
    g.fillStyle(0x4A2506, 1);
    g.fillCircle(0, -20, 12);

    // Short close-cropped hair
    g.fillStyle(0x1A0A00, 1);
    g.fillRoundedRect(-12, -32, 24, 14, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Eyes
    g.fillStyle(ARSENAL_WHITE, 1);
    g.fillCircle(-4, -21, 3.5);
    g.fillCircle(4, -21, 3.5);
    g.fillStyle(0x111111, 1);
    g.fillCircle(-3, -21, 2);
    g.fillCircle(5, -21, 2);

    // Iconic chin/jaw
    g.fillStyle(0x3A1A00, 1);
    g.fillEllipse(0, -12, 14, 5);

    // Spidey web hands hint
    g.lineStyle(1.5, 0x6A3A00, 0.8);
    g.lineBetween(-24, -7, -18, -7);
    g.lineBetween(18, -7, 24, -7);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  private buildHUD() {
    const { width } = this.scale;
    const hud = this.add.graphics();
    hud.fillStyle(ARSENAL_RED, 0.92);
    hud.fillRect(0, 0, width, 50);
    hud.fillStyle(ARSENAL_WHITE, 1);
    hud.fillRect(0, 48, width, 2);
    hud.setDepth(20);

    this.add.text(12, 8, 'SCORE', { fontSize: '9px', color: '#ffffff88', fontStyle: 'bold', letterSpacing: 2 }).setDepth(21);
    this.scoreText = this.add.text(12, 20, '0', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setDepth(21);

    this.add.text(width - 12, 8, '⚽+1  🪙+2  🏆+3', {
      fontSize: '9px', color: '#FFD70088', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(21);

    const charLabel = {
      gunnersaurus: '🦖 Gunnersaurus',
      saka: '⚡ Saka',
      odegaard: '🔭 Ødegaard',
      henry: '🕷 Henry',
    }[this.character];
    this.add.text(width / 2, 14, charLabel, {
      fontSize: '12px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(21);
  }

  // ─── START SCREEN ──────────────────────────────────────────────────────────

  private buildTapToStart() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);

    const charEmoji = { gunnersaurus: '🦖', saka: '⚡', odegaard: '🔭', henry: '🕷' }[this.character];

    const charIcon = this.add.text(width / 2, height * 0.2, charEmoji, {
      fontSize: '68px',
    }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: charIcon, y: height * 0.2 - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const charName = {
      gunnersaurus: 'Gunnersaurus',
      saka: 'Bukayo Saka',
      odegaard: 'Martin Ødegaard',
      henry: 'Thierry Henry',
    }[this.character];

    this.add.text(width / 2, height * 0.38, charName, {
      fontSize: '22px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.45, 'GUNNERS FLAP', {
      fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.52, 'Arsenal FC', {
      fontSize: '12px', color: '#ffffff55',
    }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.59, 'Grab ⚽ 🪙 🏆 for bonus points!', {
      fontSize: '11px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(31);

    const btn = this.add.graphics().setDepth(31);
    btn.fillStyle(ARSENAL_RED, 1);
    btn.fillRoundedRect(-100, -24, 200, 48, 24);
    btn.lineStyle(2, ARSENAL_WHITE, 1);
    btn.strokeRoundedRect(-100, -24, 200, 48, 24);
    btn.setPosition(width / 2, height * 0.72);

    const btnText = this.add.text(width / 2, height * 0.72, '▶  TAP TO FLY', {
      fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: [btn, btnText], scaleX: 1.05, scaleY: 1.05, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.82, 'TAP anywhere to flap', {
      fontSize: '11px', color: '#ffffff55',
    }).setOrigin(0.5).setDepth(31);

    (this as any)._startOverlay = [overlay, charIcon, btn, btnText];
    (this as any)._startTexts = this.children.list.filter((c: any) => c.type === 'Text' && c.depth === 31);
  }

  private startGame() {
    this.gameStarted = true;
    const items = [...((this as any)._startOverlay || []), ...((this as any)._startTexts || [])];
    items.forEach((o: any) => { try { o.destroy(); } catch (_) {} });
  }

  // ─── PHYSICS ───────────────────────────────────────────────────────────────

  private flap() {
    this.playerVY = FLAP_VELOCITY;
    this.tweens.add({
      targets: this.player, angle: -20, duration: 100,
      onComplete: () => {
        if (!this.isDead) {
          this.tweens.add({ targets: this.player, angle: 30, duration: 380, ease: 'Quad.easeIn' });
        }
      },
    });
  }

  // ─── COLLECTIBLES ──────────────────────────────────────────────────────────

  private maybeSpawnCollectible(gapTopY: number, gapBottomY: number, pipeX: number) {
    if (Math.random() > 0.65) return;

    const centerY = (gapTopY + gapBottomY) / 2;
    const roll = Math.random();
    let emoji: string;
    let bonus: number;

    if (roll < 0.5) {
      emoji = '⚽'; bonus = 1;
    } else if (roll < 0.8) {
      emoji = '🪙'; bonus = 2;
    } else {
      emoji = '🏆'; bonus = 3;
    }

    const obj = this.add.text(pipeX + PIPE_WIDTH / 2, centerY, emoji, {
      fontSize: '22px',
    }).setOrigin(0.5).setDepth(9);

    this.tweens.add({
      targets: obj, y: centerY - 8,
      duration: 700 + Math.random() * 300,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.collectibles.push({
      obj, x: pipeX + PIPE_WIDTH / 2, y: centerY, bonus, collected: false,
    });
  }

  private collectItem(c: Collectible) {
    c.collected = true;
    this.tweens.killTweensOf(c.obj);
    c.obj.destroy();

    this.score += c.bonus;
    this.scoreText.setText(this.score.toString());
    this.onEvent({ type: 'score', score: this.score });

    const emoji = c.bonus === 1 ? '⚽' : c.bonus === 2 ? '🪙' : '🏆';
    const pop = this.add.text(PLAYER_X + 10, this.playerY - 25, `${emoji} +${c.bonus}`, {
      fontSize: '17px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: pop, y: pop.y - 50, alpha: 0, duration: 700,
      ease: 'Quad.easeOut', onComplete: () => pop.destroy(),
    });

    this.tweens.add({ targets: this.scoreText, scaleX: 1.4, scaleY: 1.4, duration: 80, yoyo: true });
  }

  // ─── PIPES ─────────────────────────────────────────────────────────────────

  private spawnPipe() {
    const { width } = this.scale;
    const gap = this.currentPipeGap;
    const minGapTop = 80;
    const maxGapTop = this.groundY - gap - 60;
    const gapTopY = Phaser.Math.Between(minGapTop, maxGapTop);

    // Top pipe — white Arsenal kit with red stripe
    const top = this.add.graphics();
    top.fillStyle(ARSENAL_WHITE, 1);
    top.fillRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    top.fillStyle(ARSENAL_RED, 1);
    top.fillRect(0, Math.max(0, gapTopY - 80), PIPE_WIDTH, 15);
    top.fillRoundedRect(-6, gapTopY - 66, PIPE_WIDTH + 12, 18, 4);
    top.lineStyle(2, ARSENAL_RED, 0.8);
    top.strokeRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    top.setX(width + PIPE_WIDTH);
    top.setDepth(8);

    const bottomY = gapTopY + gap;
    const bottom = this.add.graphics();
    bottom.fillStyle(ARSENAL_WHITE, 1);
    bottom.fillRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    bottom.fillStyle(ARSENAL_RED, 1);
    bottom.fillRect(0, 0, PIPE_WIDTH + 12, 18);
    bottom.fillRoundedRect(-6, 0, PIPE_WIDTH + 12, 18, 4);
    bottom.lineStyle(2, ARSENAL_RED, 0.8);
    bottom.strokeRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    bottom.setX(width + PIPE_WIDTH);
    bottom.setY(bottomY);
    bottom.setDepth(8);

    this.pipes.push({
      top, bottom, scored: false,
      x: width + PIPE_WIDTH,
      gapTopY: gapTopY - 50,
      gapBottomY: bottomY,
    });

    this.maybeSpawnCollectible(gapTopY - 50, bottomY, width + PIPE_WIDTH);
  }

  private die() {
    if (this.isDead) return;
    this.isDead = true;

    this.collectibles.forEach(c => {
      if (!c.collected) {
        this.tweens.killTweensOf(c.obj);
        c.obj.destroy();
      }
    });
    this.collectibles = [];

    this.tweens.add({
      targets: this.player, y: this.player.y + 80, angle: 90, alpha: 0,
      duration: 500, ease: 'Quad.easeIn',
      onComplete: () => this.onEvent({ type: 'died', score: this.score }),
    });
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.gameStarted || this.isDead) return;

    const dt = delta / 1000;

    this.currentPipeSpeed = Math.min(PIPE_SPEED + this.score * 3, PIPE_SPEED_MAX);
    this.currentPipeGap   = Math.max(PIPE_GAP   - this.score * 2.5, PIPE_GAP_MIN);

    // Gravity
    this.playerVY += GRAVITY * dt;
    this.playerY  += this.playerVY * dt;
    this.player.y = this.playerY;

    // Pipe timer
    this.pipeTimer -= delta;
    if (this.pipeTimer <= 0) {
      this.spawnPipe();
      this.pipeTimer = PIPE_INTERVAL;
    }

    // Move pipes + score
    this.pipes = this.pipes.filter(pipe => {
      pipe.x -= this.currentPipeSpeed * dt;
      pipe.top.setX(pipe.x);
      pipe.bottom.setX(pipe.x);

      if (!pipe.scored && pipe.x + PIPE_WIDTH < PLAYER_X) {
        pipe.scored = true;
        this.score++;
        this.scoreText.setText(this.score.toString());
        this.onEvent({ type: 'score', score: this.score });

        const pop = this.add.text(PLAYER_X + 20, this.playerY - 30, '+1', {
          fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
        }).setDepth(15);
        this.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 600, onComplete: () => pop.destroy() });
      }

      if (pipe.x < -PIPE_WIDTH - 20) {
        pipe.top.destroy();
        pipe.bottom.destroy();
        return false;
      }
      return true;
    });

    // Move collectibles + collect
    this.collectibles = this.collectibles.filter(c => {
      if (c.collected) return false;

      c.x -= this.currentPipeSpeed * dt;
      c.obj.setX(c.x);

      const dx = PLAYER_X - c.x;
      const dy = this.playerY - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        this.collectItem(c);
        return false;
      }

      if (c.x < -40) {
        this.tweens.killTweensOf(c.obj);
        c.obj.destroy();
        return false;
      }
      return true;
    });

    // Collision detection
    const px = PLAYER_X;
    const py = this.playerY;
    const collR = 13;

    if (py + collR >= this.groundY || py - collR <= 50) { this.die(); return; }

    for (const pipe of this.pipes) {
      if (px + collR > pipe.x + 4 && px - collR < pipe.x + PIPE_WIDTH - 4) {
        if (py - collR < pipe.gapTopY || py + collR > pipe.gapBottomY) {
          this.die(); return;
        }
      }
    }
  }
}
