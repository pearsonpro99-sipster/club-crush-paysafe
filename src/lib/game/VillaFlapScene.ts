import Phaser from 'phaser';

const GRAVITY = 1300;
const FLAP_VELOCITY = -500;
const PIPE_SPEED = 210;
const PIPE_GAP = 160;
const PIPE_INTERVAL = 2000;
const PLAYER_X = 90;

const VILLA_CLARET = 0x670E36;
const VILLA_SKY    = 0x95BFE5;
const VILLA_GOLD   = 0xFFD700;
const PITCH_GREEN  = 0x2a7a2a;
const DARK_GREEN   = 0x1a5c1a;

export type VillaFlapEvent =
  | { type: 'score'; score: number; coins: number }
  | { type: 'died'; score: number; coins: number };

interface Post {
  top: Phaser.GameObjects.Container;
  bottom: Phaser.GameObjects.Container;
  x: number;
  gapTopY: number;
  gapBottomY: number;
  passed: boolean;
}

export class VillaFlapScene extends Phaser.Scene {
  private playerGfx!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Graphics;
  private playerVY = 0;
  private playerY = 0;
  private isDead = false;
  private gameStarted = false;
  private gameOver = false;
  private score = 0;
  private coins = 0;
  private pipeTimer = 0;
  private posts: Post[] = [];
  private collectibles: Phaser.GameObjects.Container[] = [];
  private collectTimer = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private particles: Array<{ gfx: Phaser.GameObjects.Graphics; vx: number; vy: number; life: number; maxLife: number }> = [];
  private onEvent!: (e: VillaFlapEvent) => void;
  private groundLayers: Array<{ gfx: Phaser.GameObjects.Graphics; x: number }> = [];

  constructor() { super({ key: 'VillaFlapScene' }); }

  init() {
    const data = (typeof window !== 'undefined' && (window as any).__villaData) || {};
    this.onEvent = data.onEvent || (() => {});
    this.score = 0; this.coins = 0;
    this.isDead = false; this.gameStarted = false; this.gameOver = false;
    this.playerVY = 0; this.posts = []; this.collectibles = []; this.particles = [];
    this.groundLayers = []; this.pipeTimer = 0; this.collectTimer = 0;
  }

  create() {
    const { width, height } = this.scale;
    this.playerY = height * 0.45;
    this.buildBackground();
    this.buildPitch();
    this.buildPlayer();
    this.buildHUD();
    this.buildStartScreen();
    this.input.on('pointerdown', () => this.handleInput());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleInput());
    this.input.keyboard?.on('keydown-UP', () => this.handleInput());
  }

  private handleInput() {
    if (!this.gameStarted) { this.startGame(); return; }
    if (this.gameOver) return;
    this.flap();
  }

  private buildBackground() {
    const { width, height } = this.scale;
    const groundY = height * 0.82;

    // Claret sky (Villa Park evening)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a0510, 0x1a0510, 0x2d0a20, 0x2d0a20, 1);
    sky.fillRect(0, 0, width, groundY);

    // Stars
    for (let i = 0; i < 40; i++) {
      const s = this.add.graphics();
      s.fillStyle(0xffffff, Math.random() * 0.5 + 0.1);
      s.fillCircle(Math.random() * width, Math.random() * groundY * 0.4, Math.random() * 1.2 + 0.3);
    }

    // Villa Park silhouette - Holte End style curved stand
    const stadium = this.add.graphics();
    stadium.fillStyle(0x0d0008, 1);
    // Left stand
    stadium.fillRect(0, groundY * 0.38, width * 0.25, groundY * 0.65);
    // Right stand
    stadium.fillRect(width * 0.75, groundY * 0.38, width * 0.25, groundY * 0.65);
    // Holte End hint at bottom
    stadium.fillRect(0, groundY * 0.7, width * 0.12, groundY * 0.32);
    stadium.fillRect(width * 0.88, groundY * 0.7, width * 0.12, groundY * 0.32);

    // Claret trim on stands
    stadium.lineStyle(3, VILLA_CLARET, 0.8);
    stadium.lineBetween(0, groundY * 0.42, width * 0.25, groundY * 0.42);
    stadium.lineBetween(width * 0.75, groundY * 0.42, width, groundY * 0.42);

    // Sky blue roof trim
    stadium.lineStyle(2, VILLA_SKY, 0.6);
    stadium.lineBetween(0, groundY * 0.39, width * 0.25, groundY * 0.39);
    stadium.lineBetween(width * 0.75, groundY * 0.39, width, groundY * 0.39);

    // Crowd dots
    const crowd = this.add.graphics();
    for (let i = 0; i < 100; i++) {
      const side = i < 50 ? 0 : 1;
      const baseX = side === 0 ? (i / 50) * width * 0.22 : width * 0.78 + ((i - 50) / 50) * width * 0.22;
      const cy = groundY * 0.44 + (i % 5) * 6;
      const col = i % 3 === 0 ? VILLA_CLARET : i % 3 === 1 ? VILLA_SKY : 0x111111;
      crowd.fillStyle(col, 0.85);
      crowd.fillRect(baseX, cy, 3, 3);
    }

    // Advertising boards
    const ads = this.add.graphics();
    ads.fillStyle(0x111111, 1);
    ads.fillRect(0, groundY * 0.78, width, 12);
    ads.fillStyle(VILLA_CLARET, 1);
    ads.fillRect(0, groundY * 0.78, width, 3);
    ['VILLA PARK', 'AVFC', '🦁', 'HOLTE END', '🏆', 'UTV'].forEach((txt, i) => {
      this.add.text((i / 6) * width + 8, groundY * 0.781, txt, { fontSize: '7px', color: '#ffffffaa', fontStyle: 'bold' });
    });
  }

  private buildPitch() {
    const { width, height } = this.scale;
    const groundY = height * 0.82;
    const pitchH = height - groundY;
    for (let l = 0; l < 3; l++) {
      const g = this.add.graphics();
      const ox = l * width;
      const sw = width / 7;
      for (let i = 0; i < 8; i++) {
        g.fillStyle(i % 2 === 0 ? PITCH_GREEN : DARK_GREEN, 1);
        g.fillRect(ox + i * sw, groundY, sw + 2, pitchH);
      }
      this.groundLayers.push({ gfx: g, x: ox });
    }
    const gl = this.add.graphics();
    gl.lineStyle(2, 0xffffff, 0.4); gl.lineBetween(0, groundY, width, groundY); gl.setDepth(5);
  }

  private buildPlayer() {
    const container = this.add.container(PLAYER_X, this.playerY);
    const body = this.add.graphics();
    this.drawPlayer(body, false);
    container.add(body);
    this.playerBody = body;
    this.playerGfx = container;
    this.playerGfx.setDepth(10);
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics, dead = false) {
    g.clear();
    if (dead) { g.fillStyle(0xff4444, 0.3); g.fillCircle(0, -20, 32); }

    // McGinn in Villa claret kit
    g.fillStyle(VILLA_CLARET, 1);
    g.fillRoundedRect(-12, -40, 24, 26, 5);
    // Sky blue sleeves
    g.fillStyle(VILLA_SKY, 1);
    g.fillRect(-18, -40, 8, 18);
    g.fillRect(10, -40, 8, 18);
    // Head
    g.fillStyle(0xd4956a, 1);
    g.fillCircle(0, -50, 11);
    // Dark hair
    g.fillStyle(0x2a1800, 1);
    g.fillRoundedRect(-11, -62, 22, 14, { tl: 10, tr: 10, bl: 0, br: 0 });

    // THE GOGGLES - McGinn's celebration (fingers over eyes)
    g.lineStyle(3, 0xFFD700, 1);
    // Left goggle circle
    g.strokeCircle(-6, -52, 6);
    // Right goggle circle
    g.strokeCircle(6, -52, 6);
    // Bridge of goggles
    g.lineBetween(-2, -52, 2, -52);
    // Arms (hands up making goggles)
    g.lineStyle(3, 0xd4956a, 1);
    g.lineBetween(-18, -38, -12, -52);
    g.lineBetween(18, -38, 12, -52);

    // Shorts
    g.fillStyle(0xffffff, 1);
    g.fillRect(-12, -14, 24, 14);
    // Socks claret
    g.fillStyle(VILLA_CLARET, 1);
    g.fillRect(-10, 0, 8, 14);
    g.fillRect(2, 0, 8, 14);
    // Boots
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(-12, 12, 10, 7, 2);
    g.fillRoundedRect(2, 12, 10, 7, 2);
  }

  private buildHUD() {
    const { width } = this.scale;
    const hud = this.add.graphics().setDepth(20);
    hud.fillStyle(VILLA_CLARET, 0.92);
    hud.fillRect(0, 0, width, 50);
    hud.fillStyle(VILLA_SKY, 1);
    hud.fillRect(0, 48, width, 2);

    this.add.text(12, 5, 'SCORE', { fontSize: '8px', color: '#ffffff80', fontStyle: 'bold', letterSpacing: 2 }).setDepth(21);
    this.scoreText = this.add.text(12, 16, '0', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setDepth(21);
    this.add.text(width / 2, 5, '🪙 COINS', { fontSize: '8px', color: '#ffffff80', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(21);
    this.coinsText = this.add.text(width / 2, 18, '0', { fontSize: '18px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(21);
    this.add.text(width - 12, 25, 'TAP TO FLAP 🥽', { fontSize: '9px', color: '#ffffff55' }).setOrigin(1, 0.5).setDepth(21);
  }

  private buildStartScreen() {
    const { width, height } = this.scale;
    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, width, height);

    // McGinn emoji big
    const mcg = this.add.text(width / 2, height * 0.16, '🥽', { fontSize: '72px' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: mcg, y: height * 0.16 - 10, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.33, 'MCGINN GOGGLES', {
      fontSize: '10px', color: '#95BFE588', fontStyle: 'bold', letterSpacing: 4,
    }).setOrigin(0.5).setDepth(31);

    this.add.text(width / 2, height * 0.4, 'FLAPPY\nFLAPPY', {
      fontSize: '30px', color: '#fff', fontStyle: 'bold', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5).setDepth(31);

    this.add.text(width / 2, height * 0.52, 'Villa Park · Aston Villa FC', {
      fontSize: '11px', color: '#ffffff50',
    }).setOrigin(0.5).setDepth(31);

    const emojis = ['🦁', '🏆', '🥽', '💜', '👕', '⚽', '🎉', '🦁'];
    emojis.forEach((e, i) => {
      const angle = (i / emojis.length) * Math.PI * 2;
      const ex = width / 2 + Math.cos(angle) * 90;
      const ey = height * 0.24 + Math.sin(angle) * 55;
      const em = this.add.text(ex, ey, e, { fontSize: '16px' }).setOrigin(0.5).setDepth(31).setAlpha(0.6);
      this.tweens.add({ targets: em, y: ey - 6, duration: 1000 + i * 130, yoyo: true, repeat: -1 });
    });

    const btn = this.add.graphics().setDepth(31);
    btn.fillStyle(VILLA_CLARET, 1);
    btn.fillRoundedRect(width / 2 - 115, height * 0.63, 230, 52, 26);
    btn.lineStyle(2, VILLA_SKY, 1);
    btn.strokeRoundedRect(width / 2 - 115, height * 0.63, 230, 52, 26);
    const btnText = this.add.text(width / 2, height * 0.63 + 26, '🥽  START GOGGLES RUN', {
      fontSize: '14px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: [btn, btnText], alpha: 0.6, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.79, 'TAP to flap · Dodge goalposts above AND below', {
      fontSize: '10px', color: '#ffffff45', align: 'center',
    }).setOrigin(0.5).setDepth(31);
  }

  private startGame() {
    this.gameStarted = true;
    this.children.list.filter((c: any) => c.depth >= 30).forEach((c: any) => { try { c.destroy(); } catch (_) {} });
  }

  private flap() {
    if (this.isDead) return;
    this.playerVY = FLAP_VELOCITY;
    this.spawnParticles(this.playerGfx.x, this.playerGfx.y, VILLA_SKY);
  }

  private spawnPost() {
    const { width, height } = this.scale;
    const groundY = height * 0.82;
    const playArea = groundY - 52;
    const gapCentre = 52 + Phaser.Math.Between(playArea * 0.28, playArea * 0.72);
    const topH = gapCentre - PIPE_GAP / 2 - 52;
    const bottomY = gapCentre + PIPE_GAP / 2;
    const bottomH = groundY - bottomY - 2;
    const x = width + 50;

    const topC = this.add.container(x, 52);
    const topG = this.add.graphics();
    topG.fillStyle(0xffffff, 1);
    topG.fillRect(-14, 0, 28, topH - 16);
    topG.fillStyle(VILLA_CLARET, 1);
    topG.fillRect(-22, topH - 20, 44, 15);
    topG.lineStyle(2, VILLA_SKY, 1);
    topG.strokeRect(-22, topH - 20, 44, 15);
    topG.lineStyle(1, 0xffffff, 0.12);
    for (let ny = 0; ny < topH - 20; ny += 9) topG.lineBetween(-14, ny, 14, ny);
    topC.add(topG); topC.setDepth(7);

    const botC = this.add.container(x, bottomY);
    const botG = this.add.graphics();
    botG.fillStyle(VILLA_CLARET, 1);
    botG.fillRect(-22, 0, 44, 15);
    botG.lineStyle(2, VILLA_SKY, 1);
    botG.strokeRect(-22, 0, 44, 15);
    botG.fillStyle(0xffffff, 1);
    botG.fillRect(-14, 15, 28, bottomH);
    botG.lineStyle(1, 0xffffff, 0.12);
    for (let ny = 15; ny < bottomH; ny += 9) botG.lineBetween(-14, ny, 14, ny);
    botC.add(botG); botC.setDepth(7);

    this.posts.push({ top: topC, bottom: botC, x, gapTopY: gapCentre - PIPE_GAP / 2, gapBottomY: gapCentre + PIPE_GAP / 2, passed: false });
  }

  private spawnCollectible() {
    const { width, height } = this.scale;
    const groundY = height * 0.82;
    const labels = ['7', '🦁', '10', '🥅', '🏆', '4', '🎉'];
    const label = labels[Phaser.Math.Between(0, labels.length - 1)];
    const y = 65 + Phaser.Math.Between(20, groundY - 100);
    const c = this.add.container(width + 30, y);
    const g = this.add.graphics();
    g.fillStyle(VILLA_GOLD, 1); g.fillCircle(0, 0, 15);
    g.lineStyle(2, VILLA_CLARET, 1); g.strokeCircle(0, 0, 15);
    const t = this.add.text(0, 0, label, { fontSize: '11px', color: '#111', fontStyle: 'bold' }).setOrigin(0.5);
    c.add([g, t]);
    this.tweens.add({ targets: c, y: y - 7, duration: 650, yoyo: true, repeat: -1 });
    c.setDepth(8);
    this.collectibles.push(c);
  }

  private checkCollisions() {
    const { height } = this.scale;
    const groundY = height * 0.82;
    const px = this.playerGfx.x; const py = this.playerGfx.y;
    if (py >= groundY - 18 || py <= 54) { this.die(); return; }
    for (const post of this.posts) {
      const dx = Math.abs(post.top.x - px);
      if (dx < 28) {
        if (py < post.gapTopY + 8 || py > post.gapBottomY - 22) { this.die(); return; }
      }
      if (!post.passed && post.top.x < px - 20) {
        post.passed = true; this.score += 10;
        this.showFloatingText('+10 🦁', VILLA_GOLD);
        this.onEvent({ type: 'score', score: this.score, coins: this.coins });
      }
    }
    this.collectibles = this.collectibles.filter(col => {
      if (Math.abs(col.x - px) < 28 && Math.abs(col.y - py) < 28) {
        this.coins += 5; this.score += 5;
        this.spawnParticles(col.x, col.y, VILLA_GOLD);
        col.destroy(); return false;
      }
      return true;
    });
  }

  private die() {
    if (this.isDead) return;
    this.isDead = true; this.gameOver = true;
    this.drawPlayer(this.playerBody, true);
    this.tweens.add({
      targets: this.playerGfx, angle: 180, y: this.playerGfx.y + 90, alpha: 0,
      duration: 700, ease: 'Quad.easeIn',
      onComplete: () => this.onEvent({ type: 'died', score: this.score, coins: this.coins }),
    });
  }

  private spawnParticles(x: number, y: number, colour: number) {
    for (let i = 0; i < 6; i++) {
      const g = this.add.graphics().setDepth(15);
      g.fillStyle(colour, 1); g.fillCircle(0, 0, Phaser.Math.Between(2, 5)); g.setPosition(x, y);
      const angle = Math.random() * Math.PI * 2; const spd = Phaser.Math.Between(50, 130);
      this.particles.push({ gfx: g, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 400, maxLife: 400 });
    }
  }

  private showFloatingText(msg: string, colour: number) {
    const { width } = this.scale;
    const col = '#' + colour.toString(16).padStart(6, '0');
    const t = this.add.text(width / 2, 130, msg, { fontSize: '20px', color: col, fontStyle: 'bold' }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: t, y: 85, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  update(_time: number, delta: number) {
    if (!this.gameStarted || this.gameOver) return;
    const dt = delta / 1000;
    this.playerVY += GRAVITY * dt;
    this.playerY += this.playerVY * dt;
    this.playerGfx.y = this.playerY;
    this.playerGfx.setAngle(Phaser.Math.Clamp(this.playerVY * 0.05, -28, 80));
    this.groundLayers.forEach(l => {
      l.x -= PIPE_SPEED * dt;
      if (l.x < -this.scale.width) l.x += this.scale.width * 2;
      l.gfx.x = l.x;
    });
    this.pipeTimer -= delta;
    if (this.pipeTimer <= 0) { this.spawnPost(); this.pipeTimer = PIPE_INTERVAL; }
    this.collectTimer -= delta;
    if (this.collectTimer <= 0) { this.spawnCollectible(); this.collectTimer = Phaser.Math.Between(1500, 3000); }
    this.posts = this.posts.filter(p => {
      p.top.x -= PIPE_SPEED * dt; p.bottom.x -= PIPE_SPEED * dt; p.x = p.top.x;
      if (p.top.x < -70) { p.top.destroy(); p.bottom.destroy(); return false; }
      return true;
    });
    this.collectibles = this.collectibles.filter(c => {
      c.x -= PIPE_SPEED * dt; if (c.x < -40) { c.destroy(); return false; } return true;
    });
    this.checkCollisions();
    this.particles = this.particles.filter(p => {
      p.life -= delta; p.vy += 300 * dt;
      p.gfx.x += p.vx * dt; p.gfx.y += p.vy * dt;
      p.gfx.setAlpha(p.life / p.maxLife);
      if (p.life <= 0) { p.gfx.destroy(); return false; }
      return true;
    });
    this.scoreText.setText(this.score.toLocaleString());
    this.coinsText.setText(`${this.coins}`);
  }
}
