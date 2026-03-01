import Phaser from 'phaser';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TM_BLUE    = 0x4FC3F7;  // light blue primary
const TM_ACCENT  = 0x0288D1;  // darker blue accent
const TM_DARK    = 0x060e18;
const TM_BLACK   = 0x0a0a0a;
const TM_WHITE   = 0xFFFFFF;

const GRAVITY          = 1400;
const FLAP_VELOCITY    = -530;
const PIPE_SPEED       = 170;
const PIPE_GAP         = 130;
const PIPE_GAP_MIN     = 90;
const PIPE_SPEED_MAX   = 290;
const PIPE_WIDTH       = 54;
const PIPE_INTERVAL    = 1950;
const PLAYER_X         = 90;
const GROUND_RATIO     = 0.88;

export type FlapperEvent =
  | { type: 'score'; score: number }
  | { type: 'died'; score: number };

interface Pipe {
  top: Phaser.GameObjects.Graphics;
  bottom: Phaser.GameObjects.Graphics;
  scored: boolean;
  x: number;
  gapTopY: number;
  gapBottomY: number;
}

export class TinyMovesFlapperScene extends Phaser.Scene {
  private runner!: Phaser.GameObjects.Container;
  private runnerBody!: Phaser.GameObjects.Graphics;
  private playerY = 0;
  private playerVY = 0;
  private isDead = false;
  private gameStarted = false;
  private score = 0;
  private pipes: Pipe[] = [];
  private pipeTimer = 0;
  private groundY = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private onEvent!: (e: FlapperEvent) => void;
  private groundGfx!: Phaser.GameObjects.Graphics;
  private groundOffset = 0;
  private currentPipeSpeed = PIPE_SPEED;
  private currentPipeGap   = PIPE_GAP;

  constructor() {
    super({ key: 'TinyMovesFlapperScene' });
  }

  init() {
    const data = (typeof window !== 'undefined' && (window as any).__tinyMovesData) || {};
    this.onEvent = data.onEvent || (() => {});
    this.score = 0;
    this.isDead = false;
    this.gameStarted = false;
    this.playerVY = 0;
    this.pipes = [];
    this.pipeTimer = 0;
    this.groundOffset = 0;
    this.currentPipeSpeed = PIPE_SPEED;
    this.currentPipeGap   = PIPE_GAP;
  }

  create() {
    const { width, height } = this.scale;
    this.groundY = height * GROUND_RATIO;
    this.playerY = height * 0.42;

    this.buildBackground();
    this.buildGround();
    this.buildRunner();
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

    // Sky — dark gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(TM_DARK, TM_DARK, 0x0a1a2e, 0x0a1a2e, 1);
    sky.fillRect(0, 0, width, height * 0.55);

    // Crowd stands
    const crowd = this.add.graphics();
    crowd.fillStyle(0x081828, 1);
    crowd.fillRect(0, height * 0.10, width, height * 0.28);

    for (let i = 0; i < 120; i++) {
      const cx = Math.random() * width;
      const cy = height * 0.10 + Math.random() * (height * 0.25);
      crowd.fillStyle(Math.random() > 0.5 ? TM_BLUE : TM_ACCENT, 0.55);
      crowd.fillCircle(cx, cy, 2.5 + Math.random() * 2);
    }

    // Adidas 3-stripe motif in crowd area (decorative)
    for (let s = 0; s < 3; s++) {
      const sx = width * (0.15 + s * 0.3);
      const sy = height * 0.14;
      crowd.fillStyle(TM_WHITE, 0.07);
      for (let stripe = 0; stripe < 3; stripe++) {
        crowd.fillRect(sx + stripe * 7, sy, 4, height * 0.11);
      }
    }

    // Fan chant words
    this.add.text(width * 0.5, height * 0.175, 'TINY MOVES', {
      fontSize: '22px', color: '#4FC3F7', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.4).setDepth(2);
    this.add.text(width * 0.24, height * 0.265, 'RUN\nCLUB', {
      fontSize: '10px', color: '#0288D1', fontStyle: 'bold', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.32).setDepth(2);
    this.add.text(width * 0.76, height * 0.20, 'JUST\nRUN IT', {
      fontSize: '10px', color: '#4FC3F7', fontStyle: 'bold', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.25).setDepth(2);
    this.add.text(width * 0.5, height * 0.305, 'TINY MOVES RUN CLUB', {
      fontSize: '9px', color: '#0288D1', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0.22).setDepth(2);

    // Advertising board
    crowd.fillStyle(TM_BLUE, 1);
    crowd.fillRect(0, height * 0.36, width, 10);
    for (let i = 0; i < 4; i++) {
      const adText = this.add.text(
        (i / 4) * width + 10, height * 0.36 + 1,
        '🏃 TINY MOVES RUN CLUB',
        { fontSize: '7px', color: '#ffffff', fontStyle: 'bold' }
      );
      adText.setDepth(2);
    }

    // Road / running track
    const pitch = this.add.graphics();
    pitch.fillStyle(0x1c1c1c, 1);
    pitch.fillRect(0, height * 0.42, width, height * 0.46);

    // Track lane markings
    for (let i = 0; i < 6; i++) {
      pitch.fillStyle(TM_WHITE, 0.06);
      pitch.fillRect(0, height * 0.42 + i * (height * 0.075), width, 2);
    }

    // Orange centre line
    pitch.fillStyle(TM_BLUE, 0.15);
    pitch.fillRect(0, height * 0.42 + height * 0.20, width, 3);
  }

  private buildGround() {
    const { width, height } = this.scale;
    this.groundGfx = this.add.graphics();
    this.groundGfx.fillStyle(0x111111, 1);
    this.groundGfx.fillRect(0, this.groundY, width, height - this.groundY);
    this.groundGfx.lineStyle(3, TM_BLUE, 0.9);
    this.groundGfx.lineBetween(0, this.groundY, width, this.groundY);

    for (let x = 0; x < width; x += 30) {
      this.groundGfx.fillStyle(TM_WHITE, 0.12);
      this.groundGfx.fillRect(x, this.groundY + 10, 16, 2);
    }
    this.groundGfx.setDepth(6);
  }

  // ─── RUNNER CHARACTER ──────────────────────────────────────────────────────

  private buildRunner() {
    const container = this.add.container(PLAYER_X, this.playerY);
    const gfx = this.add.graphics();
    this.drawRunner(gfx);
    container.add(gfx);
    this.runnerBody = gfx;
    this.runner = container;
    this.runner.setDepth(10);
  }

  private drawRunner(g: Phaser.GameObjects.Graphics) {
    g.clear();

    // Body — orange running vest
    g.fillStyle(TM_BLUE, 1);
    g.fillEllipse(0, 0, 32, 26);

    // Shorts — black
    g.fillStyle(TM_BLACK, 1);
    g.fillRect(-10, 10, 20, 10);

    // Arms in running pose
    g.fillStyle(TM_BLUE, 1);
    g.fillRoundedRect(-22, -10, 14, 5, 3); // left arm back
    g.fillRoundedRect(8, -2, 14, 5, 3);    // right arm forward

    // Legs in mid-stride
    g.fillStyle(0xf4c8a0, 1);
    g.fillRoundedRect(-9, 19, 7, 14, 3);
    g.fillRoundedRect(2, 19, 7, 14, 3);

    // Shoes — white with Adidas 3 stripes
    g.fillStyle(TM_WHITE, 1);
    g.fillRoundedRect(-12, 31, 12, 6, 3);
    g.fillRoundedRect(0, 31, 12, 6, 3);
    g.fillStyle(TM_BLACK, 0.6);
    for (let s = 0; s < 3; s++) {
      g.fillRect(-10 + s * 3, 32, 1.5, 4);
      g.fillRect(2 + s * 3, 32, 1.5, 4);
    }

    // Head
    g.fillStyle(0xf4c8a0, 1);
    g.fillCircle(0, -18, 10);

    // Hair
    g.fillStyle(0x2a1500, 1);
    g.fillRoundedRect(-10, -28, 20, 12, { tl: 8, tr: 8, bl: 0, br: 0 });

    // Sweatband — orange
    g.fillStyle(TM_BLUE, 1);
    g.fillRect(-10, -24, 20, 4);

    // Eyes
    g.fillStyle(TM_WHITE, 1);
    g.fillCircle(-4, -19, 3);
    g.fillCircle(4, -19, 3);
    g.fillStyle(0x111111, 1);
    g.fillCircle(-3.5, -19, 1.8);
    g.fillCircle(4.5, -19, 1.8);

    // Tiny Moves logo dot on chest
    g.fillStyle(TM_ACCENT, 0.9);
    g.fillCircle(0, -4, 3);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  private buildHUD() {
    const { width } = this.scale;
    const hud = this.add.graphics();
    hud.fillStyle(TM_BLACK, 0.92);
    hud.fillRect(0, 0, width, 50);
    hud.fillStyle(TM_BLUE, 1);
    hud.fillRect(0, 48, width, 2);
    hud.setDepth(20);

    this.add.text(12, 8, 'SCORE', { fontSize: '9px', color: '#ffffff88', fontStyle: 'bold', letterSpacing: 2 }).setDepth(21);
    this.scoreText = this.add.text(12, 20, '0', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setDepth(21);
    this.add.text(width / 2, 14, '🏃 TINY MOVES', { fontSize: '13px', color: '#4FC3F7', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(21);
  }

  // ─── START SCREEN ──────────────────────────────────────────────────────────

  private buildTapToStart() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);

    const emoji = this.add.text(width / 2, height * 0.2, '🏃', { fontSize: '72px' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: emoji, y: height * 0.2 - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(width / 2, height * 0.38, 'Tiny Moves', { fontSize: '28px', color: '#4FC3F7', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.46, 'RUN CLUB DASH', { fontSize: '22px', color: '#0288D1', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.53, 'Dodge the cones, keep running!', { fontSize: '12px', color: '#ffffff55' }).setOrigin(0.5).setDepth(31);

    const btn = this.add.graphics().setDepth(31);
    btn.fillStyle(TM_BLUE, 1);
    btn.fillRoundedRect(-100, -24, 200, 48, 24);
    btn.setPosition(width / 2, height * 0.66);

    const btnText = this.add.text(width / 2, height * 0.66, '▶  TAP TO RUN', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: [btn, btnText], scaleX: 1.05, scaleY: 1.05, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.77, 'TAP anywhere to jump', { fontSize: '11px', color: '#ffffff55' }).setOrigin(0.5).setDepth(31);

    (this as any)._startOverlay = [overlay, emoji, btn, btnText];
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
      targets: this.runner, angle: -22,
      duration: 100,
      onComplete: () => {
        if (!this.isDead) {
          this.tweens.add({ targets: this.runner, angle: 30, duration: 400, ease: 'Quad.easeIn' });
        }
      },
    });
  }

  // ─── PIPES ─────────────────────────────────────────────────────────────────

  private spawnPipe() {
    const { width, height } = this.scale;
    const gap = this.currentPipeGap;
    const minGapTop = 80;
    const maxGapTop = this.groundY - gap - 60;
    const gapTopY = Phaser.Math.Between(minGapTop, maxGapTop);

    // Top pipe — orange cone/pillar with Adidas stripes
    const top = this.add.graphics();
    top.fillStyle(TM_BLUE, 1);
    top.fillRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    top.fillStyle(0x0277BD, 1);
    top.fillRoundedRect(-6, gapTopY - 66, PIPE_WIDTH + 12, 18, 4);
    top.lineStyle(2, TM_ACCENT, 0.4);
    top.strokeRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    // Adidas 3-stripe detail
    top.fillStyle(TM_WHITE, 0.12);
    for (let s = 0; s < 3; s++) {
      top.fillRect(10 + s * 13, 16, 5, gapTopY - 75);
    }
    top.setX(width + PIPE_WIDTH);
    top.setDepth(8);

    // Bottom pipe
    const bottomY = gapTopY + gap;
    const bottom = this.add.graphics();
    bottom.fillStyle(TM_BLUE, 1);
    bottom.fillRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    bottom.fillStyle(0x0277BD, 1);
    bottom.fillRoundedRect(-6, 0, PIPE_WIDTH + 12, 18, 4);
    bottom.lineStyle(2, TM_ACCENT, 0.4);
    bottom.strokeRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    // Adidas 3-stripe detail
    bottom.fillStyle(TM_WHITE, 0.12);
    for (let s = 0; s < 3; s++) {
      bottom.fillRect(10 + s * 13, 22, 5, this.groundY - bottomY - 20);
    }
    bottom.setX(width + PIPE_WIDTH);
    bottom.setY(bottomY);
    bottom.setDepth(8);

    this.pipes.push({ top, bottom, scored: false, x: width + PIPE_WIDTH, gapTopY: gapTopY - 50, gapBottomY: bottomY });
  }

  private die() {
    if (this.isDead) return;
    this.isDead = true;

    this.tweens.add({
      targets: this.runner, y: this.runner.y + 80, angle: 90, alpha: 0,
      duration: 500, ease: 'Quad.easeIn',
      onComplete: () => this.onEvent({ type: 'died', score: this.score }),
    });
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.gameStarted || this.isDead) return;

    const dt = delta / 1000;

    this.currentPipeSpeed = Math.min(PIPE_SPEED + this.score * 3,   PIPE_SPEED_MAX);
    this.currentPipeGap   = Math.max(PIPE_GAP   - this.score * 2.5, PIPE_GAP_MIN);

    this.playerVY += GRAVITY * dt;
    this.playerY += this.playerVY * dt;
    this.runner.y = this.playerY;

    this.groundOffset = (this.groundOffset + this.currentPipeSpeed * dt) % 30;

    this.pipeTimer -= delta;
    if (this.pipeTimer <= 0) {
      this.spawnPipe();
      this.pipeTimer = PIPE_INTERVAL;
    }

    this.pipes = this.pipes.filter(pipe => {
      pipe.x -= this.currentPipeSpeed * dt;
      pipe.top.setX(pipe.x);
      pipe.bottom.setX(pipe.x);

      if (!pipe.scored && pipe.x + PIPE_WIDTH < PLAYER_X) {
        pipe.scored = true;
        this.score++;
        this.scoreText.setText(this.score.toString());
        this.onEvent({ type: 'score', score: this.score });

        // Score pop — pizza!
        const pop = this.add.text(PLAYER_X + 20, this.playerY - 30, '🍕 +1', {
          fontSize: '18px', color: '#4FC3F7', fontStyle: 'bold',
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

    const px = PLAYER_X;
    const py = this.playerY;
    const pr = 13;

    if (py + pr >= this.groundY || py - pr <= 50) { this.die(); return; }

    for (const pipe of this.pipes) {
      if (px + pr > pipe.x + 4 && px - pr < pipe.x + PIPE_WIDTH - 4) {
        if (py - pr < pipe.gapTopY || py + pr > pipe.gapBottomY) {
          this.die(); return;
        }
      }
    }
  }
}
