import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

type GameState = 'idle' | 'running' | 'game-over';

interface Obstacle {
  id: number;
  x: number;
  size: number;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly cloudStyles = [
    { top: '8%', left: '6%', delay: '0s', duration: '19s' },
    { top: '20%', left: '72%', delay: '2s', duration: '23s' },
    { top: '36%', left: '18%', delay: '5s', duration: '17s' }
  ];

  readonly hypeList = [
    'Nuages barbapapa en roue libre',
    'Paillettes hors budget',
    'Arc-en-ciel fiscalement douteux',
    'Design responsablement hideux'
  ];

  readonly compliments = [
    'Licorne turbo cosmique',
    'Reine des paillettes aerobiques',
    'Icone VHS du royaume sucre',
    'Championne intergalactique du saut'
  ];

  gameState: GameState = 'idle';
  score = 0;
  bestScore = 0;
  unicornY = 0;
  isJumping = false;
  flashMessage = 'Appuie sur espace pour lancer la catastrophe.';
  obstacles: Obstacle[] = [];

  private readonly gravity = 0.8;
  private readonly jumpVelocity = -14;
  private readonly groundY = 0;
  private readonly obstacleSpeed = 8;
  private readonly spawnMin = 950;
  private readonly spawnMax = 1650;
  private readonly unicornLeft = 120;
  private readonly unicornWidth = 94;
  private readonly unicornHeight = 86;
  private readonly obstacleBaseWidth = 42;
  private readonly obstacleHeight = 46;
  private readonly collisionPadding = 12;

  private frameHandle = 0;
  private spawnTimer?: number;
  private velocityY = 0;
  private obstacleId = 0;
  private lastFrameTime = 0;
  private scoreAccumulator = 0;

  ngOnInit(): void {
    this.loadBestScore();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    this.clearSpawnTimer();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.code !== 'Space') {
      return;
    }

    event.preventDefault();

    if (this.gameState !== 'running') {
      this.startGame();
      return;
    }

    this.jump();
  }

  startGame(): void {
    this.resetGame();
    this.gameState = 'running';
    this.flashMessage = 'La licorne est lancee. Fuis les cacas.';
    this.jump();
    this.scheduleNextObstacle();
    this.lastFrameTime = performance.now();
    this.frameHandle = window.requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  jump(): void {
    if (this.isJumping) {
      return;
    }

    this.isJumping = true;
    this.velocityY = this.jumpVelocity;
  }

  trackObstacle(_: number, obstacle: Obstacle): number {
    return obstacle.id;
  }

  private tick(timestamp: number): void {
    if (this.gameState !== 'running') {
      return;
    }

    const delta = Math.min((timestamp - this.lastFrameTime) / 16.67, 1.35);
    this.lastFrameTime = timestamp;

    this.updateUnicorn(delta);
    this.updateObstacles(delta);
    this.updateScore(delta);

    if (this.detectCollision()) {
      this.endGame();
      return;
    }

    this.frameHandle = window.requestAnimationFrame((nextTimestamp) => this.tick(nextTimestamp));
  }

  private updateUnicorn(delta: number): void {
    this.velocityY += this.gravity * delta;
    this.unicornY -= this.velocityY * delta;

    if (this.unicornY <= this.groundY) {
      this.unicornY = this.groundY;
      this.velocityY = 0;
      this.isJumping = false;
    }
  }

  private updateObstacles(delta: number): void {
    this.obstacles = this.obstacles
      .map((obstacle) => ({
        ...obstacle,
        x: obstacle.x - this.obstacleSpeed * delta
      }))
      .filter((obstacle) => obstacle.x > -120);
  }

  private updateScore(delta: number): void {
    this.scoreAccumulator += delta;

    if (this.scoreAccumulator >= 4) {
      this.score += 1;
      this.scoreAccumulator = 0;
    }
  }

  private detectCollision(): boolean {
    const unicornBottom = this.unicornY;
    const unicornTop = this.unicornY + this.unicornHeight;
    const unicornRight = this.unicornLeft + this.unicornWidth - this.collisionPadding;
    const unicornLeft = this.unicornLeft + this.collisionPadding;

    return this.obstacles.some((obstacle) => {
      const obstacleLeft = obstacle.x + 8;
      const obstacleRight = obstacle.x + this.obstacleBaseWidth + obstacle.size - 8;
      const obstacleTop = this.obstacleHeight + obstacle.size * 0.35;

      const horizontalHit = unicornRight > obstacleLeft && unicornLeft < obstacleRight;
      const verticalHit = unicornBottom < obstacleTop && unicornTop > 2;

      return horizontalHit && verticalHit;
    });
  }

  private endGame(): void {
    this.gameState = 'game-over';
    this.stopLoop();
    this.clearSpawnTimer();
    this.bestScore = Math.max(this.bestScore, this.score);
    window.localStorage.setItem('unicorn-best-score', String(this.bestScore));
    const compliment = this.compliments[this.score % this.compliments.length];
    this.flashMessage = `${compliment}, score ${this.score}. Espace pour recommencer.`;
  }

  private spawnObstacle(): void {
    if (this.gameState !== 'running') {
      return;
    }

    this.obstacles = [
      ...this.obstacles,
      {
        id: this.obstacleId++,
        x: 840,
        size: Math.floor(Math.random() * 18)
      }
    ];

    this.scheduleNextObstacle();
  }

  private scheduleNextObstacle(): void {
    this.clearSpawnTimer();
    const delay = this.randomBetween(this.spawnMin, this.spawnMax);
    this.spawnTimer = window.setTimeout(() => this.spawnObstacle(), delay);
  }

  private stopLoop(): void {
    if (this.frameHandle) {
      window.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = 0;
    }
  }

  private clearSpawnTimer(): void {
    if (this.spawnTimer !== undefined) {
      window.clearTimeout(this.spawnTimer);
      this.spawnTimer = undefined;
    }
  }

  private resetGame(): void {
    this.stopLoop();
    this.clearSpawnTimer();
    this.score = 0;
    this.unicornY = 0;
    this.velocityY = 0;
    this.scoreAccumulator = 0;
    this.isJumping = false;
    this.obstacles = [];
  }

  private loadBestScore(): void {
    const stored = window.localStorage.getItem('unicorn-best-score');
    this.bestScore = stored ? Number(stored) || 0 : 0;
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
