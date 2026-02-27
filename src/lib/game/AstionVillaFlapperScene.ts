import Phaser from 'phaser';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VILLA_CLARET  = 0x95003B;
const VILLA_BLUE    = 0x95BFE5;
const VILLA_GOLD    = 0xFFD700;
const VILLA_DARK    = 0x1a0010;

const GRAVITY          = 1400;
const FLAP_VELOCITY    = -530;
const PIPE_SPEED       = 170;   // starting speed (px/s)
const PIPE_GAP         = 130;   // starting gap (smaller = harder from the start)
const PIPE_GAP_MIN     = 90;    // floor gap — never shrinks below this
const PIPE_SPEED_MAX   = 290;   // cap so it stays playable
const PIPE_WIDTH       = 54;
const PIPE_INTERVAL    = 1950;  // ms between pipe spawns
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
  gapTopY: number;    // Y where the top pipe ends (gap starts)
  gapBottomY: number; // Y where the bottom pipe starts (gap ends)
}

export class AstionVillaFlapperScene extends Phaser.Scene {
  private mcginn!: Phaser.GameObjects.Container;
  private mcginnBody!: Phaser.GameObjects.Graphics;
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
    super({ key: 'AstionVillaFlapperScene' });
  }

  init() {
    const data = (typeof window !== 'undefined' && (window as any).__villaData) || {};
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
    this.buildMcGinn();
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

    // Sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a0010, 0x1a0010, VILLA_CLARET, VILLA_CLARET, 1);
    sky.fillRect(0, 0, width, height * 0.55);

    // Crowd stands
    const crowd = this.add.graphics();
    crowd.fillStyle(0x6B0030, 1);
    crowd.fillRect(0, height * 0.1, width, height * 0.28);

    for (let i = 0; i < 120; i++) {
      const cx = Math.random() * width;
      const cy = height * 0.1 + Math.random() * (height * 0.25);
      crowd.fillStyle(Math.random() > 0.5 ? VILLA_CLARET : VILLA_BLUE, 0.65);
      crowd.fillCircle(cx, cy, 2.5 + Math.random() * 2);
    }

    // Fan chant words in crowd stands
    this.add.text(width * 0.5, height * 0.175, 'UTV', {
      fontSize: '28px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.38).setDepth(2);
    this.add.text(width * 0.22, height * 0.27, 'HOLTE\nEND', {
      fontSize: '11px', color: '#95BFE5', fontStyle: 'bold', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.32).setDepth(2);
    this.add.text(width * 0.75, height * 0.20, 'UTV', {
      fontSize: '13px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.25).setDepth(2);
    this.add.text(width * 0.5, height * 0.305, 'HOLTE END', {
      fontSize: '12px', color: '#95BFE5', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0.22).setDepth(2);

    // Advertising board
    crowd.fillStyle(VILLA_CLARET, 1);
    crowd.fillRect(0, height * 0.36, width, 10);
    for (let i = 0; i < 4; i++) {
      const adText = this.add.text(
        (i / 4) * width + 10, height * 0.36 + 1,
        'ASTON VILLA FC',
        { fontSize: '7px', color: '#95BFE5', fontStyle: 'bold' }
      );
      adText.setDepth(2);
    }

    // Pitch
    const pitch = this.add.graphics();
    pitch.fillStyle(0x2d7d2d, 1);
    pitch.fillRect(0, height * 0.42, width, height * 0.46);

    // Pitch stripes
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        pitch.fillStyle(0x257a25, 0.45);
        pitch.fillRect(0, height * 0.42 + i * (height * 0.065), width, height * 0.032);
      }
    }
  }

  private buildGround() {
    const { width, height } = this.scale;
    this.groundGfx = this.add.graphics();
    this.groundGfx.fillStyle(0x2d6e00, 1);
    this.groundGfx.fillRect(0, this.groundY, width, height - this.groundY);
    this.groundGfx.lineStyle(3, 0xFFFFFF, 0.7);
    this.groundGfx.lineBetween(0, this.groundY, width, this.groundY);

    // Dashed white line pattern on ground
    for (let x = 0; x < width; x += 30) {
      this.groundGfx.fillStyle(0xFFFFFF, 0.3);
      this.groundGfx.fillRect(x, this.groundY + 12, 16, 3);
    }
    this.groundGfx.setDepth(6);
  }

  // ─── MCGINN CHARACTER ──────────────────────────────────────────────────────

  private buildMcGinn() {
    const container = this.add.container(PLAYER_X, this.playerY);
    const gfx = this.add.graphics();
    this.drawMcGinn(gfx);
    container.add(gfx);
    this.mcginnBody = gfx;
    this.mcginn = container;
    this.mcginn.setDepth(10);
  }

  private drawMcGinn(g: Phaser.GameObjects.Graphics) {
    g.clear();

    // Body — claret Villa kit
    g.fillStyle(VILLA_CLARET, 1);
    g.fillEllipse(0, 0, 36, 30);

    // Blue shorts
    g.fillStyle(VILLA_BLUE, 1);
    g.fillRect(-10, 10, 20, 11);

    // Arms outstretched (flying celebration pose)
    g.fillStyle(VILLA_CLARET, 1);
    g.fillRoundedRect(-22, -6, 14, 6, 3);  // left arm
    g.fillRoundedRect(8, -6, 14, 6, 3);    // right arm

    // White socks & dark boots
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(-10, 20, 8, 10);
    g.fillRect(2, 20, 8, 10);
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-11, 28, 10, 6, 3);
    g.fillRoundedRect(1, 28, 10, 6, 3);

    // Head
    g.fillStyle(0xf4a460, 1);
    g.fillCircle(0, -18, 11);

    // Hair (dark brown)
    g.fillStyle(0x3a1500, 1);
    g.fillRoundedRect(-11, -29, 22, 13, { tl: 9, tr: 9, bl: 0, br: 0 });

    // ── GOGGLES ── (iconic McGinn Champions League celebration)
    // Goggle lenses
    g.fillStyle(VILLA_GOLD, 0.35);
    g.fillCircle(-6, -18, 6);
    g.fillCircle(6, -18, 6);
    // Goggle frames
    g.lineStyle(3, VILLA_GOLD, 1);
    g.strokeCircle(-6, -18, 6);
    g.strokeCircle(6, -18, 6);
    // Bridge
    g.fillStyle(VILLA_GOLD, 1);
    g.fillRect(-1, -20, 2, 4);
    // Strap
    g.lineStyle(2, VILLA_GOLD, 0.8);
    g.lineBetween(-12, -18, -15, -14);
    g.lineBetween(12, -18, 15, -14);

    // Villa badge hint — small diamond on chest
    g.fillStyle(VILLA_GOLD, 0.7);
    g.fillTriangle(0, -8, -4, -2, 0, 4);
    g.fillTriangle(0, -8, 4, -2, 0, 4);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  private buildHUD() {
    const { width } = this.scale;
    const hud = this.add.graphics();
    hud.fillStyle(VILLA_CLARET, 0.92);
    hud.fillRect(0, 0, width, 50);
    hud.fillStyle(VILLA_BLUE, 1);
    hud.fillRect(0, 48, width, 2);
    hud.setDepth(20);

    this.add.text(12, 8, 'SCORE', { fontSize: '9px', color: '#ffffff88', fontStyle: 'bold', letterSpacing: 2 }).setDepth(21);
    this.scoreText = this.add.text(12, 20, '0', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setDepth(21);

    this.add.text(width / 2, 14, '🦁 AVF', { fontSize: '13px', color: '#95BFE5', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(21);
  }

  // ─── START SCREEN ──────────────────────────────────────────────────────────

  private buildTapToStart() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);

    const goggles = this.add.text(width / 2, height * 0.2, '🥽', { fontSize: '72px' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: goggles, y: height * 0.2 - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(width / 2, height * 0.38, 'McGinn\'s', { fontSize: '28px', color: '#95BFE5', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.46, 'GOGGLE DASH', { fontSize: '24px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.add.text(width / 2, height * 0.53, 'Aston Villa FC', { fontSize: '13px', color: '#ffffff55' }).setOrigin(0.5).setDepth(31);

    const btn = this.add.graphics().setDepth(31);
    btn.fillStyle(VILLA_CLARET, 1);
    btn.fillRoundedRect(-100, -24, 200, 48, 24);
    btn.lineStyle(2, VILLA_BLUE, 1);
    btn.strokeRoundedRect(-100, -24, 200, 48, 24);
    btn.setPosition(width / 2, height * 0.66);

    const btnText = this.add.text(width / 2, height * 0.66, '▶  TAP TO FLY', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: [btn, btnText], scaleX: 1.05, scaleY: 1.05, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.77, 'TAP anywhere to flap', { fontSize: '11px', color: '#ffffff55' }).setOrigin(0.5).setDepth(31);

    (this as any)._startOverlay = [overlay, goggles, btn, btnText];
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
      targets: this.mcginn, angle: -22,
      duration: 100,
      onComplete: () => {
        if (!this.isDead) {
          this.tweens.add({ targets: this.mcginn, angle: 30, duration: 400, ease: 'Quad.easeIn' });
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

    // Top pipe (hangs from top)
    const top = this.add.graphics();
    top.fillStyle(VILLA_CLARET, 1);
    top.fillRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    top.fillStyle(0x6B0030, 1);
    top.fillRoundedRect(-6, gapTopY - 66, PIPE_WIDTH + 12, 18, 4); // cap
    top.lineStyle(2, VILLA_BLUE, 0.6);
    top.strokeRect(0, 0, PIPE_WIDTH, gapTopY - 50);
    top.setX(width + PIPE_WIDTH);
    top.setDepth(8);

    // Bottom pipe (rises from ground)
    const bottomY = gapTopY + gap;
    const bottom = this.add.graphics();
    bottom.fillStyle(VILLA_CLARET, 1);
    bottom.fillRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    bottom.fillStyle(0x6B0030, 1);
    bottom.fillRoundedRect(-6, 0, PIPE_WIDTH + 12, 18, 4); // cap
    bottom.lineStyle(2, VILLA_BLUE, 0.6);
    bottom.strokeRect(0, 0, PIPE_WIDTH, this.groundY - bottomY);
    bottom.setX(width + PIPE_WIDTH);
    bottom.setY(bottomY);
    bottom.setDepth(8);

    this.pipes.push({ top, bottom, scored: false, x: width + PIPE_WIDTH, gapTopY: gapTopY - 50, gapBottomY: bottomY });
  }

  private die() {
    if (this.isDead) return;
    this.isDead = true;

    this.tweens.add({
      targets: this.mcginn, y: this.mcginn.y + 80, angle: 90, alpha: 0,
      duration: 500, ease: 'Quad.easeIn',
      onComplete: () => this.onEvent({ type: 'died', score: this.score }),
    });
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.gameStarted || this.isDead) return;

    const dt = delta / 1000;

    // Ramp up speed and tighten gap based on score
    this.currentPipeSpeed = Math.min(PIPE_SPEED + this.score * 3,   PIPE_SPEED_MAX);
    this.currentPipeGap   = Math.max(PIPE_GAP   - this.score * 2.5, PIPE_GAP_MIN);

    // Gravity
    this.playerVY += GRAVITY * dt;
    this.playerY += this.playerVY * dt;
    this.mcginn.y = this.playerY;

    // Scroll ground
    this.groundOffset = (this.groundOffset + this.currentPipeSpeed * dt) % 30;

    // Pipe timer
    this.pipeTimer -= delta;
    if (this.pipeTimer <= 0) {
      this.spawnPipe();
      this.pipeTimer = PIPE_INTERVAL;
    }

    // Move pipes
    this.pipes = this.pipes.filter(pipe => {
      pipe.x -= this.currentPipeSpeed * dt;
      pipe.top.setX(pipe.x);
      pipe.bottom.setX(pipe.x);

      // Score when passed
      if (!pipe.scored && pipe.x + PIPE_WIDTH < PLAYER_X) {
        pipe.scored = true;
        this.score++;
        this.scoreText.setText(this.score.toString());
        this.onEvent({ type: 'score', score: this.score });

        // Score pop
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

    // Collisions — simplified AABB check
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
