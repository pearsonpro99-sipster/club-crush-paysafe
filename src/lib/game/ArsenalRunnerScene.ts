import Phaser from 'phaser';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GROUND_Y_RATIO = 0.78;
const LANE_COUNT = 3;
const INITIAL_SPEED = 280;
const SPEED_INCREMENT = 18; // per 500 pts
const GRAVITY = 1800;
const JUMP_VELOCITY = -700;
const PLAYER_X = 90;

// Arsenal palette
const ARSENAL_RED = 0xDB0007;
const ARSENAL_WHITE = 0xFFFFFF;
const ARSENAL_GOLD = 0xFFD700;
const ARSENAL_DARK = 0x1a0a0a;
const CROWD_BG = 0x8B0000;

// Shirt numbers to collect (Arsenal squad)
const SHIRT_NUMBERS = ['1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '15', '19', '29', '35', '41'];
const POWER_UP_TYPES = ['INVINCIBLES', 'CANNON', 'GOLD'];

export type RunnerEvent =
    | { type: 'score'; score: number; coins: number }
    | { type: 'died'; score: number; coins: number }
    | { type: 'powerup'; kind: string };

export class ArsenalRunnerScene extends Phaser.Scene {
    // Player
    private playerGfx!: Phaser.GameObjects.Container;
    private playerBody!: Phaser.GameObjects.Graphics;
    private playerVY = 0;
    private playerY = 0;
    private groundY = 0;
    private isJumping = false;
    private isDead = false;
    private isShielded = false;
    private shieldTimer = 0;
    private invincibleTimer = 0; // Invincibles burst

    // Lane system
    private currentLane = 1; // 0=left, 1=center, 2=right
    private laneX: number[] = [];
    private isChangingLane = false;

    // Game state
    private score = 0;
    private coins = 0;
    private speed = INITIAL_SPEED;
    private distance = 0;
    private gameStarted = false;
    private gameOver = false;

    // Obstacles & collectibles
    private obstacles: Phaser.GameObjects.Container[] = [];
    private collectibles: Phaser.GameObjects.Container[] = [];
    private powerups: Phaser.GameObjects.Container[] = [];
    private spawnTimer = 0;
    private collectTimer = 0;
    private powerupTimer = 0;

    // Scroll layers
    private groundTiles: Phaser.GameObjects.Graphics[] = [];
    private bgLayers: Phaser.GameObjects.Graphics[] = [];
    private crowdGraphics: Phaser.GameObjects.Graphics[] = [];

    // HUD
    private scoreText!: Phaser.GameObjects.Text;
    private coinsText!: Phaser.GameObjects.Text;
    private speedText!: Phaser.GameObjects.Text;
    private shieldBar!: Phaser.GameObjects.Graphics;
    private comboText!: Phaser.GameObjects.Text;
    private combo = 0;

    // Particles
    private particles: Array<{
        gfx: Phaser.GameObjects.Graphics;
        vx: number; vy: number; life: number; maxLife: number;
    }> = [];

    // Callback
    private onEvent!: (e: RunnerEvent) => void;

    constructor() {
        super({ key: 'ArsenalRunnerScene' });
    }

    init() {
        const data = (typeof window !== 'undefined' && (window as any).__runnerData) || {};
        this.onEvent = data.onEvent || (() => { });
        // Reset all state
        this.score = 0; this.coins = 0; this.speed = INITIAL_SPEED;
        this.distance = 0; this.isDead = false; this.isShielded = false;
        this.isJumping = false; this.gameStarted = false; this.gameOver = false;
        this.currentLane = 1; this.isChangingLane = false;
        this.combo = 0; this.invincibleTimer = 0; this.shieldTimer = 0;
        this.spawnTimer = 0; this.collectTimer = 0; this.powerupTimer = 0;
        this.obstacles = []; this.collectibles = []; this.powerups = [];
        this.groundTiles = []; this.bgLayers = []; this.crowdGraphics = [];
        this.particles = [];
    }

    create() {
        const { width, height } = this.scale;
        this.groundY = height * GROUND_Y_RATIO;

        // Lane positions
        const laneSpacing = width / (LANE_COUNT + 1);
        this.laneX = [laneSpacing, laneSpacing * 2, laneSpacing * 3];

        this.buildBackground();
        this.buildGround();
        this.buildPlayer();
        this.buildHUD();
        this.buildTapToStart();

        // Input
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (!this.gameStarted) { this.startGame(); return; }
            if (this.gameOver) return;
            // Left half = move left, right half = move right, top third = jump
            if (p.y < height * 0.35) {
                this.jump();
            } else if (p.x < width / 2) {
                this.changeLane(-1);
            } else {
                this.changeLane(1);
            }
        });

        // Keyboard
        this.input.keyboard?.on('keydown-SPACE', () => {
            if (!this.gameStarted) { this.startGame(); return; }
            this.jump();
        });
        this.input.keyboard?.on('keydown-LEFT', () => this.changeLane(-1));
        this.input.keyboard?.on('keydown-RIGHT', () => this.changeLane(1));
        this.input.keyboard?.on('keydown-UP', () => this.jump());
    }

    // ─── BACKGROUND ────────────────────────────────────────────────────────────

    private buildBackground() {
        const { width, height } = this.scale;

        // Sky gradient
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4a0a0a, 0x4a0a0a, 1);
        sky.fillRect(0, 0, width, height * 0.5);

        // Crowd stands — two parallax layers
        for (let layer = 0; layer < 2; layer++) {
            const g = this.add.graphics();
            this.drawCrowdLayer(g, layer);
            this.crowdGraphics.push(g);
        }

        // Stadium roof/arch suggestion
        const arch = this.add.graphics();
        arch.lineStyle(6, ARSENAL_RED, 0.7);
        arch.beginPath();
        arch.arc(width / 2, -20, width * 0.55, 0.1, Math.PI - 0.1);
        arch.strokePath();
    }

    private drawCrowdLayer(g: Phaser.GameObjects.Graphics, layer: number) {
        const { width, height } = this.scale;
        const baseY = height * (layer === 0 ? 0.28 : 0.38);
        const standH = height * (layer === 0 ? 0.12 : 0.16);

        // Stand background
        g.fillStyle(layer === 0 ? CROWD_BG : 0x6B0000, 1);
        g.fillRect(0, baseY, width, standH);

        // Crowd dots — red and white alternating
        for (let i = 0; i < 60; i++) {
            const cx = (i / 60) * width * 1.1 - 5;
            const cy = baseY + Phaser.Math.Between(4, standH - 6);
            const col = Math.random() > 0.5 ? ARSENAL_RED : ARSENAL_WHITE;
            g.fillStyle(col, 0.8);
            g.fillCircle(cx, cy, layer === 0 ? 3 : 4);
        }

        // Advertising boards
        g.fillStyle(ARSENAL_RED, 1);
        g.fillRect(0, baseY + standH - 8, width, 8);
        // Advertising board text strips
        for (let i = 0; i < 5; i++) {
            const adText = this.add.text((i / 5) * width + 10, baseY + standH - 8, 'ARSENAL FC', { fontSize: '7px', color: '#ffffff', fontStyle: 'bold' });
        }
    }

    // ─── GROUND ────────────────────────────────────────────────────────────────

    private buildGround() {
        const { width, height } = this.scale;

        // Pitch surface
        const pitch = this.add.graphics();
        pitch.fillStyle(0x2d8a2d, 1);
        pitch.fillRect(0, this.groundY, width, height - this.groundY);

        // Darker stripe pattern
        for (let i = 0; i < 8; i++) {
            if (i % 2 === 0) {
                const tileG = this.add.graphics();
                tileG.fillStyle(0x267a26, 1);
                tileG.fillRect(0, this.groundY, width, height - this.groundY);
                this.groundTiles.push(tileG);
            }
        }

        // Ground line
        const line = this.add.graphics();
        line.lineStyle(3, ARSENAL_WHITE, 0.8);
        line.lineBetween(0, this.groundY, width, this.groundY);

        // Lane guide lines (faint)
        const laneG = this.add.graphics();
        laneG.lineStyle(1, ARSENAL_WHITE, 0.15);
        this.laneX.forEach(x => {
            laneG.lineBetween(x, this.groundY, x, height);
        });
    }

    // ─── PLAYER ────────────────────────────────────────────────────────────────

    private buildPlayer() {
        this.playerY = this.groundY;
        const container = this.add.container(PLAYER_X, this.playerY);

        const body = this.add.graphics();
        this.drawPlayer(body, false);

        container.add(body);
        this.playerBody = body;
        this.playerGfx = container;
        this.playerGfx.setDepth(10);
    }

    private drawPlayer(g: Phaser.GameObjects.Graphics, shielded: boolean) {
        g.clear();

        // Shield aura
        if (shielded) {
            g.fillStyle(ARSENAL_GOLD, 0.3);
            g.fillCircle(0, -22, 26);
            g.lineStyle(2, ARSENAL_GOLD, 0.9);
            g.strokeCircle(0, -22, 26);
        }

        // Body — Arsenal red kit
        g.fillStyle(ARSENAL_RED, 1);
        g.fillRoundedRect(-10, -38, 20, 24, 4); // torso

        // White chest stripe
        g.fillStyle(ARSENAL_WHITE, 0.9);
        g.fillRect(-3, -36, 6, 20);

        // Head
        g.fillStyle(0xf4a460, 1); // skin
        g.fillCircle(0, -46, 10);

        // Hair
        g.fillStyle(0x3a2000, 1);
        g.fillRoundedRect(-10, -56, 20, 12, { tl: 8, tr: 8, bl: 0, br: 0 });

        // Shorts — white
        g.fillStyle(ARSENAL_WHITE, 1);
        g.fillRect(-11, -14, 22, 12);

        // Socks — red
        g.fillStyle(ARSENAL_RED, 1);
        g.fillRect(-10, 2, 8, 14);
        g.fillRect(2, 2, 8, 14);

        // Boots
        g.fillStyle(0x111111, 1);
        g.fillRoundedRect(-12, 14, 10, 7, 3);
        g.fillRoundedRect(2, 14, 10, 7, 3);

        // Number on back
        g.fillStyle(ARSENAL_WHITE, 1);
    }

    // ─── HUD ───────────────────────────────────────────────────────────────────

    private buildHUD() {
        const { width } = this.scale;

        // Top bar
        const hud = this.add.graphics();
        hud.fillStyle(ARSENAL_RED, 0.92);
        hud.fillRect(0, 0, width, 52);
        hud.fillStyle(ARSENAL_GOLD, 1);
        hud.fillRect(0, 50, width, 2);
        hud.setDepth(20);

        // Score
        this.add.text(12, 8, 'SCORE', {
            fontSize: '9px', color: '#ffffff88', fontStyle: 'bold', letterSpacing: 2,
        }).setDepth(21);
        this.scoreText = this.add.text(12, 20, '0', {
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
        }).setDepth(21);

        // Coins
        this.add.text(width / 2, 8, '🪙 COINS', {
            fontSize: '9px', color: '#ffffff88', fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(21);
        this.coinsText = this.add.text(width / 2, 20, '0', {
            fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(21);

        // Speed
        this.speedText = this.add.text(width - 12, 8, 'SPEED', {
            fontSize: '9px', color: '#ffffff88', fontStyle: 'bold', align: 'right',
        }).setOrigin(1, 0).setDepth(21);
        this.add.text(width - 12, 20, '1x', {
            fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(1, 0).setDepth(21);

        // Shield bar (hidden until active)
        this.shieldBar = this.add.graphics().setDepth(22);

        // Combo text
        this.comboText = this.add.text(width / 2, 80, '', {
            fontSize: '18px', color: '#FFD700', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(22).setAlpha(0);
    }

    private buildTapToStart() {
        const { width, height } = this.scale;

        // Trophy celebration overlay
        const overlay = this.add.graphics().setDepth(30);
        overlay.fillStyle(0x000000, 0.65);
        overlay.fillRect(0, 0, width, height);

        // Trophy emoji big
        const trophy = this.add.text(width / 2, height * 0.2, '🏆', {
            fontSize: '72px',
        }).setOrigin(0.5).setDepth(31);

        this.tweens.add({
            targets: trophy,
            y: height * 0.2 - 12,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.add.text(width / 2, height * 0.38, 'ARSENAL', {
            fontSize: '28px', color: '#DB0007', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(31);

        this.add.text(width / 2, height * 0.46, 'CHAMPIONS', {
            fontSize: '22px', color: '#FFD700', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(31);

        this.add.text(width / 2, height * 0.54, '2024/25 Season', {
            fontSize: '13px', color: '#ffffff88',
        }).setOrigin(0.5).setDepth(31);

        // Animated tap button
        const btn = this.add.graphics().setDepth(31);
        btn.fillStyle(ARSENAL_RED, 1);
        btn.fillRoundedRect(-100, -24, 200, 48, 24);
        btn.lineStyle(2, ARSENAL_GOLD, 1);
        btn.strokeRoundedRect(-100, -24, 200, 48, 24);
        btn.setPosition(width / 2, height * 0.67);

        const btnText = this.add.text(width / 2, height * 0.67, '▶  START THE RUN', {
            fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(32);

        this.tweens.add({
            targets: [btn, btnText],
            scaleX: 1.05, scaleY: 1.05,
            duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        // Controls hint
        this.add.text(width / 2, height * 0.78, 'TAP LEFT / RIGHT to change lane\nTAP TOP to jump', {
            fontSize: '11px', color: '#ffffff66', align: 'center', lineSpacing: 4,
        }).setOrigin(0.5).setDepth(31);

        // Store refs to destroy on start
        (this as any)._startOverlay = [overlay, trophy, btn, btnText];
        (this as any)._startTexts = this.children.list.filter(
            (c: any) => c.type === 'Text' && c.depth === 31
        );
    }

    private startGame() {
        this.gameStarted = true;

        // Destroy start screen
        const items = [...((this as any)._startOverlay || []), ...((this as any)._startTexts || [])];
        items.forEach((o: any) => { try { o.destroy(); } catch (_) { } });
    }

    // ─── PHYSICS ───────────────────────────────────────────────────────────────

    private jump() {
        if (this.isDead || !this.gameStarted) return;
        if (!this.isJumping) {
            this.playerVY = JUMP_VELOCITY;
            this.isJumping = true;
        } else if (this.playerVY > -200) {
            // Double jump
            this.playerVY = JUMP_VELOCITY * 0.65;
        }
    }

    private changeLane(dir: -1 | 1) {
        if (this.isDead || this.isChangingLane || !this.gameStarted) return;
        const newLane = Phaser.Math.Clamp(this.currentLane + dir, 0, LANE_COUNT - 1);
        if (newLane === this.currentLane) return;
        this.currentLane = newLane;
        this.isChangingLane = true;

        const targetX = this.laneX[this.currentLane];
        this.tweens.add({
            targets: this.playerGfx,
            x: targetX,
            duration: 120,
            ease: 'Quad.easeOut',
            onComplete: () => { this.isChangingLane = false; },
        });
    }

    // ─── SPAWNING ──────────────────────────────────────────────────────────────

    private spawnObstacle() {
        const { width } = this.scale;
        const lane = Phaser.Math.Between(0, LANE_COUNT - 1);
        const x = this.laneX[lane];
        const type = Phaser.Math.Between(0, 2);

        const container = this.add.container(width + 60, this.groundY);
        const g = this.add.graphics();

        if (type === 0) {
            // Referee flag obstacle
            g.fillStyle(0xFFFF00, 1);
            g.fillRect(-4, -50, 8, 50);
            g.fillStyle(0xFF0000, 1);
            g.fillTriangle(4, -50, 30, -38, 4, -26);
            const t = this.add.text(0, 8, 'REF', { fontSize: '9px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
            container.add([g, t]);
        } else if (type === 1) {
            // Rival kit — blue (Chelsea/Man City style)
            g.fillStyle(0x034694, 1);
            g.fillRoundedRect(-14, -46, 28, 30, 4);
            g.fillStyle(0xffffff, 1);
            g.fillRect(-2, -44, 4, 26);
            g.fillStyle(0xf4a460, 1);
            g.fillCircle(0, -54, 10);
            g.fillStyle(0x034694, 1);
            g.fillRect(-12, -16, 24, 14);
            g.fillStyle(0xffffff, 1);
            g.fillRect(-11, 2, 8, 14);
            g.fillRect(3, 2, 8, 14);
            g.fillStyle(0x111111, 1);
            g.fillRoundedRect(-12, 14, 10, 7, 3);
            g.fillRoundedRect(2, 14, 10, 7, 3);
            const t = this.add.text(0, 8, '👊', { fontSize: '12px' }).setOrigin(0.5);
            container.add([g, t]);
        } else {
            // VAR screen obstacle
            g.fillStyle(0x111111, 1);
            g.fillRoundedRect(-28, -55, 56, 40, 6);
            g.fillStyle(0x0000ff, 0.7);
            g.fillRoundedRect(-24, -51, 48, 32, 4);
            const t = this.add.text(0, -35, 'VAR\nREVIEW', {
                fontSize: '10px', color: '#ffffff', fontStyle: 'bold', align: 'center', lineSpacing: 2,
            }).setOrigin(0.5);
            container.add([g, t]);
        }

        container.setData('lane', lane);
        container.setData('type', 'obstacle');
        container.setDepth(8);
        this.obstacles.push(container);
    }

    private spawnCollectible() {
        const { width } = this.scale;
        const lane = Phaser.Math.Between(0, LANE_COUNT - 1);
        const num = SHIRT_NUMBERS[Phaser.Math.Between(0, SHIRT_NUMBERS.length - 1)];
        const floatY = this.groundY - Phaser.Math.Between(20, 90);

        const container = this.add.container(width + 40, floatY);
        const g = this.add.graphics();

        // Shirt number token
        g.fillStyle(ARSENAL_RED, 1);
        g.fillCircle(0, 0, 18);
        g.lineStyle(2, ARSENAL_GOLD, 1);
        g.strokeCircle(0, 0, 18);
        g.fillStyle(ARSENAL_WHITE, 1);

        const t = this.add.text(0, 0, num, {
            fontSize: num.length > 1 ? '13px' : '16px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        container.add([g, t]);

        // Bob up/down
        this.tweens.add({
            targets: container, y: floatY - 8,
            duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        container.setData('lane', lane);
        container.setData('type', 'collectible');
        container.setData('value', parseInt(num) || 5);
        container.setDepth(9);
        this.collectibles.push(container);
    }

    private spawnPowerUp() {
        const { width } = this.scale;
        const lane = Phaser.Math.Between(0, LANE_COUNT - 1);
        const kind = POWER_UP_TYPES[Phaser.Math.Between(0, POWER_UP_TYPES.length - 1)];
        const floatY = this.groundY - 60;

        const container = this.add.container(width + 40, floatY);
        const g = this.add.graphics();

        let emoji = '⭐';
        let colour = ARSENAL_GOLD;

        if (kind === 'INVINCIBLES') { emoji = '🛡️'; colour = 0xFF6B6B; }
        else if (kind === 'CANNON') { emoji = '💣'; colour = 0xFF4500; }
        else if (kind === 'GOLD') { emoji = '🏆'; colour = ARSENAL_GOLD; }

        g.fillStyle(colour, 0.25);
        g.fillCircle(0, 0, 22);
        g.lineStyle(3, colour, 1);
        g.strokeCircle(0, 0, 22);

        const t = this.add.text(0, 0, emoji, { fontSize: '20px' }).setOrigin(0.5);
        container.add([g, t]);

        // Pulse
        this.tweens.add({
            targets: container,
            scaleX: 1.2, scaleY: 1.2,
            duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        container.setData('kind', kind);
        container.setData('lane', lane);
        container.setData('type', 'powerup');
        container.setDepth(9);
        this.powerups.push(container);
    }

    // ─── COLLISION ─────────────────────────────────────────────────────────────

    private checkCollisions() {
        const px = this.playerGfx.x;
        const py = this.playerGfx.y;
        const pRadius = 20;

        // Obstacles
        this.obstacles.forEach(obs => {
            const dx = Math.abs(obs.x - px);
            const dy = Math.abs(obs.y - py);
            if (dx < 28 && dy < 48) {
                if (this.isShielded || this.invincibleTimer > 0) {
                    this.breakShield(obs);
                } else {
                    this.die();
                }
            }
        });

        // Collectibles
        this.collectibles = this.collectibles.filter(col => {
            const dx = Math.abs(col.x - px);
            const dy = Math.abs(col.y - py);
            if (dx < 30 && dy < 40) {
                const val = col.getData('value') || 5;
                this.coins += val;
                this.score += val * 10;
                this.combo++;
                this.showCombo();
                this.spawnPickupParticles(col.x, col.y, ARSENAL_GOLD);
                col.destroy();
                return false;
            }
            return true;
        });

        // Power-ups
        this.powerups = this.powerups.filter(pu => {
            const dx = Math.abs(pu.x - px);
            const dy = Math.abs(pu.y - py);
            if (dx < 32 && dy < 42) {
                const kind = pu.getData('kind');
                this.activatePowerUp(kind);
                this.spawnPickupParticles(pu.x, pu.y, ARSENAL_RED);
                pu.destroy();
                this.onEvent({ type: 'powerup', kind });
                return false;
            }
            return true;
        });
    }

    private activatePowerUp(kind: string) {
        if (kind === 'INVINCIBLES') {
            this.invincibleTimer = 5000;
            this.isShielded = true;
            this.drawPlayer(this.playerBody, true);
            this.showFloatingText('INVINCIBLES! 🛡️', ARSENAL_GOLD);
        } else if (kind === 'CANNON') {
            // Cannon fires — destroys all on-screen obstacles
            this.obstacles.forEach(obs => {
                this.spawnPickupParticles(obs.x, obs.y, ARSENAL_RED);
                obs.destroy();
            });
            this.obstacles = [];
            this.showFloatingText('CANNON FIRE! 💣', 0xFF4500);
        } else if (kind === 'GOLD') {
            this.coins += 50;
            this.score += 500;
            this.showFloatingText('+50 COINS 🏆', ARSENAL_GOLD);
        }
    }

    private breakShield(obs: Phaser.GameObjects.Container) {
        this.isShielded = false;
        this.invincibleTimer = 0;
        this.drawPlayer(this.playerBody, false);
        this.spawnPickupParticles(obs.x, obs.y, ARSENAL_GOLD);
        obs.destroy();
        this.obstacles = this.obstacles.filter(o => o !== obs);
        this.showFloatingText('SHIELD BROKEN!', 0xFF6B6B);

        // Brief invincibility after shield break
        this.time.delayedCall(1500, () => { });
    }

    private die() {
        if (this.isDead) return;
        this.isDead = true;
        this.gameOver = true;

        // Death animation
        this.tweens.add({
            targets: this.playerGfx,
            y: this.playerGfx.y - 60,
            angle: 360,
            alpha: 0,
            duration: 600,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.onEvent({ type: 'died', score: this.score, coins: this.coins });
            },
        });
    }

    // ─── PARTICLES ─────────────────────────────────────────────────────────────

    private spawnPickupParticles(x: number, y: number, colour: number) {
        for (let i = 0; i < 8; i++) {
            const g = this.add.graphics().setDepth(15);
            g.fillStyle(colour, 1);
            g.fillCircle(0, 0, Phaser.Math.Between(3, 7));
            g.setPosition(x, y);
            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(60, 140);
            this.particles.push({
                gfx: g, life: 400, maxLife: 400,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
            });
        }
    }

    private showCombo() {
        if (this.combo < 3) return;
        this.comboText.setText(`${this.combo}x COMBO! 🔥`);
        this.comboText.setAlpha(1);
        this.tweens.killTweensOf(this.comboText);
        this.tweens.add({
            targets: this.comboText, alpha: 0,
            duration: 900, delay: 600, ease: 'Quad.easeIn',
        });
    }

    private showFloatingText(msg: string, colour: number) {
        const { width } = this.scale;
        const colStr = '#' + colour.toString(16).padStart(6, '0');
        const t = this.add.text(width / 2, this.scale.height * 0.45, msg, {
            fontSize: '17px', color: colStr, fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
            targets: t, y: t.y - 40, alpha: 0, duration: 1200,
            onComplete: () => t.destroy(),
        });
    }

    // ─── UPDATE ────────────────────────────────────────────────────────────────

    update(time: number, delta: number) {
        if (!this.gameStarted || this.gameOver) return;

        const dt = delta / 1000;
        this.distance += this.speed * dt;

        // Speed ramp
        this.speed = INITIAL_SPEED + Math.floor(this.score / 500) * SPEED_INCREMENT;

        // Player gravity
        this.playerVY += GRAVITY * dt;
        this.playerY += this.playerVY * dt;

        if (this.playerY >= this.groundY) {
            this.playerY = this.groundY;
            this.playerVY = 0;
            this.isJumping = false;
        }
        this.playerGfx.y = this.playerY;

        // Shield timers
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= delta;
            if (this.invincibleTimer <= 0) {
                this.invincibleTimer = 0;
                this.isShielded = false;
                this.drawPlayer(this.playerBody, false);
            }
        }

        // Move obstacles
        const scrollX = this.speed * dt;
        this.obstacles = this.obstacles.filter(o => {
            o.x -= scrollX;
            if (o.x < -80) { o.destroy(); return false; }
            return true;
        });
        this.collectibles = this.collectibles.filter(c => {
            c.x -= scrollX;
            if (c.x < -50) { c.destroy(); return false; }
            return true;
        });
        this.powerups = this.powerups.filter(p => {
            p.x -= scrollX;
            if (p.x < -50) { p.destroy(); return false; }
            return true;
        });

        // Spawn timers
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
            this.spawnObstacle();
            this.spawnTimer = Phaser.Math.Between(1200, 2200) * (INITIAL_SPEED / this.speed);
        }

        this.collectTimer -= delta;
        if (this.collectTimer <= 0) {
            this.spawnCollectible();
            this.collectTimer = Phaser.Math.Between(600, 1200);
        }

        this.powerupTimer -= delta;
        if (this.powerupTimer <= 0) {
            this.spawnPowerUp();
            this.powerupTimer = Phaser.Math.Between(6000, 12000);
        }

        // Collision
        this.checkCollisions();

        // Update particles
        this.particles = this.particles.filter(p => {
            p.life -= delta;
            p.vy += 200 * dt;
            p.gfx.x += p.vx * dt;
            p.gfx.y += p.vy * dt;
            p.gfx.setAlpha(p.life / p.maxLife);
            if (p.life <= 0) { p.gfx.destroy(); return false; }
            return true;
        });

        // Running animation — bob player
        if (!this.isJumping) {
            this.playerGfx.y = this.playerY - Math.abs(Math.sin(this.distance * 0.05)) * 6;
        }

        // Update HUD
        this.scoreText.setText(this.score.toLocaleString());
        this.coinsText.setText(`${this.coins}`);

        // Emit score periodically
        if (Math.floor(this.distance) % 200 === 0) {
            this.onEvent({ type: 'score', score: this.score, coins: this.coins });
        }
    }
}