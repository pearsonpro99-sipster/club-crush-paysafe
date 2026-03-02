import Phaser from 'phaser';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VV_VIOLET   = 0x8E11FF;
const VV_LILAC    = 0xC385F9;
const VV_DARK     = 0x220C2D;
const VV_LIME     = 0xDFF86C;
const VV_DEEP     = 0x630CB3;

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
  netBar: Phaser.GameObjects.Graphics;
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
  label: string;
  collected: boolean;
}

export class VolleyFlapperScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Graphics;
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
  private onEvent!: (e: FlapperEvent) => void;
  private groundGfx!: Phaser.GameObjects.Graphics;
  private groundOffset = 0;
  private currentPipeSpeed = PIPE_SPEED;
  private currentPipeGap   = PIPE_GAP;

  constructor() {
    super({ key: 'VolleyFlapperScene' });
  }

  init() {
    const data = (typeof window !== 'undefined' && (window as any).__volleyData) || {};
    this.onEvent = data.onEvent || (() => {});
    this.score = 0;
    this.isDead = false;
    this.gameStarted = false;
    this.playerVY = 0;
    this.pipes = [];
    this.collectibles = [];
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

    // Deep space gradient sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(VV_DARK, VV_DARK, VV_DEEP, VV_DEEP, 1);
    sky.fillRect(0, 0, width, height * 0.55);

    // Crowd / stands area
    const crowd = this.add.graphics();
    crowd.fillStyle(0x3a0878, 1);
    crowd.fillRect(0, height * 0.1, width, height * 0.28);

    // Crowd dots
    for (let i = 0; i < 120; i++) {
      const cx = Math.random() * width;
      const cy = height * 0.1 + Math.random() * (height * 0.25);
      crowd.fillStyle(Math.random() > 0.5 ? VV_VIOLET : VV_LILAC, 0.6);
      crowd.fillCircle(cx, cy, 2.5 + Math.random() * 2);
    }

    // Brand text in stands
    this.add.text(width * 0.5, height * 0.175, 'VOLLEYVERSE', {
      fontSize: '22px', color: '#DFF86C', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.35).setDepth(2);
    this.add.text(width * 0.22, height * 0.27, 'THE\nVERSE', {
      fontSize: '10px', color: '#C385F9', fontStyle: 'bold', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.30).setDepth(2);
    this.add.text(width * 0.75, height * 0.20, 'VV', {
      fontSize: '14px', color: '#DFF86C', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.25).setDepth(2);

    // Ad banner
    crowd.fillStyle(VV_VIOLET, 1);
    crowd.fillRect(0, height * 0.36, width, 10);
    for (let i = 0; i < 4; i++) {
      const adText = this.add.text(
        (i / 4) * width + 10, height * 0.36 + 1,
        'VOLLEYVERSE',
        { fontSize: '7px', color: '#DFF86C', fontStyle: 'bold' }
      );
      adText.setDepth(2);
    }

    // Indoor court floor (light wood-coloured)
    const court = this.add.graphics();
    court.fillStyle(0x3a1e00, 1);
    court.fillRect(0, height * 0.42, width, height * 0.46);

    // Court stripes
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        court.fillStyle(0x321800, 0.5);
        court.fillRect(0, height * 0.42 + i * (height * 0.065), width, height * 0.032);
      }
    }

    // Court lines (white)
    court.lineStyle(2, 0xFFFFFF, 0.25);
    court.lineBetween(width * 0.5, height * 0.42, width * 0.5, this.groundY);  // centre line
    court.strokeRect(width * 0.08, height * 0.44, width * 0.84, this.groundY - height * 0.44 - 4);
  }

  private buildGround() {
    const { width, height } = this.scale;
    this.groundGfx = this.add.graphics();
    this.groundGfx.fillStyle(0x2a1200, 1);
    this.groundGfx.fillRect(0, this.groundY, width, height - this.groundY);
    this.groundGfx.lineStyle(3, 0xFFFFFF, 0.6);
    this.groundGfx.lineBetween(0, this.groundY, width, this.groundY);

    // Baseline dashes
    for (let x = 0; x < width; x += 30) {
      this.groundGfx.fillStyle(0xFFFFFF, 0.2);
      this.groundGfx.fillRect(x, this.groundY + 12, 16, 3);
    }
    this.groundGfx.setDepth(6);
  }

  // ─── PLAYER CHARACTER ──────────────────────────────────────────────────────

  private buildPlayer() {
    const container = this.add.container(PLAYER_X, this.playerY);
    const gfx = this.add.graphics();
    this.drawPlayer(gfx);
    container.add(gfx);
    this.playerBody = gfx;
    this.player = container;
    this.player.setDepth(10);
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics) {
    g.clear();

    // Body — violet VolleyVerse kit
    g.fillStyle(VV_VIOLET, 1);
    g.fillEllipse(0, 0, 36, 30);

    // White shorts
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(-10, 10, 20, 11);

    // Arms outstretched (serving pose)
    g.fillStyle(VV_VIOLET, 1);
    g.fillRoundedRect(-22, -6, 14, 6, 3);
    g.fillRoundedRect(8, -6, 14, 6, 3);

    // White socks
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(-10, 20, 8, 10);
    g.fillRect(2, 20, 8, 10);
    // Dark shoes
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-11, 28, 10, 6, 3);
    g.fillRoundedRect(1, 28, 10, 6, 3);

    // Head (skin tone)
    g.fillStyle(0xf4a460, 1);
    g.fillCircle(0, -18, 11);

    // Hair (dark)
    g.fillStyle(0x1a0a00, 1);
    g.fillRoundedRect(-11, -29, 22, 13, { tl: 9, tr: 9, bl: 0, br: 0 });

    // VV logo hint on chest (small V shape in lime)
    g.fillStyle(VV_LIME, 0.85);
    g.fillTriangle(0, -6, -5, -1, 0, 4);
    g.fillTriangle(0, -6, 5, -1, 0, 4);

    // Volleyball in right hand
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillCircle(20, -5, 8);
    g.lineStyle(1.5, VV_VIOLET, 0.8);
    g.strokeCircle(20, -5, 8);
    // Ball seam lines
    g.lineStyle(1.5, VV_DEEP, 0.6);
    g.lineBetween(14, -8, 26, -2);
    g.lineBetween(14, -2, 26, -8);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  private buildHUD() {
    const { width } = this.scale;
    const hud = this.add.graphics();
    hud.fillStyle(VV_DEEP, 0.92);
    hud.fillRect(0, 0, width, 50);
    hud.fillStyle(VV_LIME, 1);
    hud.fillRect(0, 48, width, 2);
    hud.setDepth(20);

    this.add.text(12, 8, 'SCORE', { fontSize: '9px', color: '#ffffff88', fontStyle: 'bold', letterSpacing: 2 }).setDepth(21);
    this.scoreText = this.add.text(12, 20, '0', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setDepth(21);

    this.add.text(width - 12, 8, '🪙+1  🏐+2  🏆+3', {
      fontSize: '9px', color: '#DFF86C88', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(21);

    this.add.text(width / 2, 14, '🏐 VolleyVerse', { fontSize: '13px', color: '#C385F9', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(21);
  }

  // ─── START SCREEN ──────────────────────────────────────────────────────────

  private buildTapToStart() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);

    const ball = this.add.text(width / 2, height * 0.2, '🏐', { fontSize: '72px' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: ball, y: height * 0.2 - 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(width / 2, height * 0.38, 'Volley', { fontSize: '28px', color: '#C385F9', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.46, 'FLAPPER', { fontSize: '24px', color: '#DFF86C', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.53, 'VolleyVerse', { fontSize: '13px', color: '#ffffff55' }).setOrigin(0.5).setDepth(31);

    this.add.text(width / 2, height * 0.60, 'Grab \uD83E\uDE99 \uD83C\uDFC6 \uD83E\uDEA9 for bonus points!', {
      fontSize: '12px', color: '#DFF86C', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);

    const btn = this.add.graphics().setDepth(31);
    btn.fillStyle(VV_VIOLET, 1);
    btn.fillRoundedRect(-100, -24, 200, 48, 24);
    btn.lineStyle(2, VV_LIME, 1);
    btn.strokeRoundedRect(-100, -24, 200, 48, 24);
    btn.setPosition(width / 2, height * 0.72);

    const btnText = this.add.text(width / 2, height * 0.72, '\u25B6  TAP TO FLY', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: [btn, btnText], scaleX: 1.05, scaleY: 1.05, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.82, 'TAP anywhere to flap', { fontSize: '11px', color: '#ffffff55' }).setOrigin(0.5).setDepth(31);

    (this as any)._startOverlay = [overlay, ball, btn, btnText];
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
      targets: this.player, angle: -22,
      duration: 100,
      onComplete: () => {
        if (!this.isDead) {
          this.tweens.add({ targets: this.player, angle: 30, duration: 400, ease: 'Quad.easeIn' });
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
    let label: string;

    if (roll < 0.5) {
      emoji = '\uD83E\uDE99'; bonus = 1; label = '+1';   // 🪙
    } else if (roll < 0.8) {
      emoji = '\uD83C\uDFD0'; bonus = 2; label = '+2';   // 🏐
    } else {
      emoji = '\uD83C\uDFC6'; bonus = 3; label = '+3';   // 🏆
    }

    const obj = this.add.text(pipeX + PIPE_WIDTH / 2, centerY, emoji, {
      fontSize: '22px',
    }).setOrigin(0.5).setDepth(9);

    this.tweens.add({
      targets: obj, y: centerY - 8,
      duration: 700 + Math.random() * 300,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    if (emoji === '\uD83E\uDE99') {
      this.tweens.add({ targets: obj, scaleX: 0.3, duration: 500, yoyo: true, repeat: -1 });
    }

    this.collectibles.push({
      obj, x: pipeX + PIPE_WIDTH / 2, y: centerY, bonus, label, collected: false,
    });
  }

  private collectItem(c: Collectible) {
    c.collected = true;
    this.tweens.killTweensOf(c.obj);
    c.obj.destroy();

    this.score += c.bonus;
    this.scoreText.setText(this.score.toString());
    this.onEvent({ type: 'score', score: this.score });

    const popLabel = c.bonus === 1 ? `\uD83E\uDE99 ${c.label}` : c.bonus === 2 ? `\uD83C\uDFD0 ${c.label}` : `\uD83C\uDFC6 ${c.label}`;
    const pop = this.add.text(PLAYER_X + 10, this.playerY - 25, popLabel, {
      fontSize: '18px', color: '#DFF86C', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: pop, y: pop.y - 55, alpha: 0, duration: 750,
      ease: 'Quad.easeOut',
      onComplete: () => pop.destroy(),
    });

    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.4, scaleY: 1.4, duration: 80, yoyo: true,
    });
  }

  // ─── NET POSTS (pipes) ─────────────────────────────────────────────────────

  private spawnPipe() {
    const { width } = this.scale;
    const gap = this.currentPipeGap;
    const minGapTop = 80;
    const maxGapTop = this.groundY - gap - 60;
    const gapTopY = Phaser.Math.Between(minGapTop, maxGapTop);

    // Top post
    const top = this.add.graphics();
    top.fillStyle(VV_DEEP, 1);
    top.fillRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    // Post cap
    top.fillStyle(VV_VIOLET, 1);
    top.fillRoundedRect(-6, gapTopY - 66, PIPE_WIDTH + 12, 18, 4);
    // Net texture on post
    top.lineStyle(1.5, VV_LILAC, 0.35);
    for (let y = 12; y < gapTopY - 52; y += 18) {
      top.lineBetween(6, y, PIPE_WIDTH - 6, y);
    }
    top.lineStyle(2, VV_LILAC, 0.2);
    top.strokeRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    top.setX(width + PIPE_WIDTH);
    top.setDepth(8);

    const bottomY = gapTopY + gap;
    const bottom = this.add.graphics();
    bottom.fillStyle(VV_DEEP, 1);
    bottom.fillRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    // Post cap
    bottom.fillStyle(VV_VIOLET, 1);
    bottom.fillRoundedRect(-6, 0, PIPE_WIDTH + 12, 18, 4);
    // Net texture
    bottom.lineStyle(1.5, VV_LILAC, 0.35);
    for (let y = 22; y < this.groundY - bottomY - 4; y += 18) {
      bottom.lineBetween(6, y, PIPE_WIDTH - 6, y);
    }
    bottom.lineStyle(2, VV_LILAC, 0.2);
    bottom.strokeRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    bottom.setX(width + PIPE_WIDTH);
    bottom.setY(bottomY);
    bottom.setDepth(8);

    // Volleyball net in the gap (white band)
    const netBar = this.add.graphics();
    netBar.fillStyle(0xFFFFFF, 0.85);
    netBar.fillRect(0, 0, PIPE_WIDTH, 4);
    // Net diamond pattern
    netBar.lineStyle(1, 0xdddddd, 0.5);
    for (let nx = 0; nx < PIPE_WIDTH; nx += 6) {
      netBar.lineBetween(nx, 0, nx + 3, 3);
      netBar.lineBetween(nx + 3, 0, nx, 3);
    }
    netBar.setX(width + PIPE_WIDTH);
    netBar.setY(gapTopY - 50 + (gap / 2) - 2);
    netBar.setDepth(9);

    this.pipes.push({
      top, bottom, netBar, scored: false,
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

    this.playerVY += GRAVITY * dt;
    this.playerY += this.playerVY * dt;
    this.player.y = this.playerY;

    this.groundOffset = (this.groundOffset + this.currentPipeSpeed * dt) % 30;

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
      pipe.netBar.setX(pipe.x);

      if (!pipe.scored && pipe.x + PIPE_WIDTH < PLAYER_X) {
        pipe.scored = true;
        this.score++;
        this.scoreText.setText(this.score.toString());
        this.onEvent({ type: 'score', score: this.score });

        const pop = this.add.text(PLAYER_X + 20, this.playerY - 30, '+1', {
          fontSize: '20px', color: '#DFF86C', fontStyle: 'bold',
        }).setDepth(15);
        this.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 600, onComplete: () => pop.destroy() });
      }

      if (pipe.x < -PIPE_WIDTH - 20) {
        pipe.top.destroy();
        pipe.bottom.destroy();
        pipe.netBar.destroy();
        return false;
      }
      return true;
    });

    // Move collectibles + collect
    const pr = 20;
    this.collectibles = this.collectibles.filter(c => {
      if (c.collected) return false;

      c.x -= this.currentPipeSpeed * dt;
      c.obj.setX(c.x);

      const dx = PLAYER_X - c.x;
      const dy = this.playerY - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < pr) {
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
