/**
 * Mini Snake Game
 * Features:
 * - Fluid grid movement with input buffering
 * - Normal & Golden Bonus Food with countdown timer
 * - Procedural 8-bit sound synthesis via Web Audio API
 * - Particle explosion effects
 * - Responsive mobile touch swipe + Virtual D-pad
 * - LocalStorage high-score persistence
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const GRID_SIZE = 20; // 20x20 grid
  const CELL_SIZE = 20; // 20px per cell = 400x400 canvas
  const STORAGE_KEY = 'mini_snake_high_score';

  const SPEEDS = {
    easy: 125,
    medium: 90,
    hard: 60,
  };

  // --- Audio Synthesizer (Web Audio API) ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    playEat() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
      } catch (e) {}
    }

    playBonus() {
      if (this.muted || !this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const now = this.ctx.currentTime + idx * 0.05;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.08);
        });
      } catch (e) {}
    }

    playGameOver() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      } catch (e) {}
    }

    playTurn() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
      } catch (e) {}
    }
  }

  // --- Particle FX ---
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = Math.random() * 4 + 2;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 1.0;
      this.decay = Math.random() * 0.04 + 0.03;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- Game State & Logic ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // DOM Elements
  const currentScoreEl = document.getElementById('currentScore');
  const highScoreEl = document.getElementById('highScore');
  const applesCountEl = document.getElementById('applesCount');
  const speedBadgeEl = document.getElementById('speedBadge');
  const difficultySelect = document.getElementById('difficultySelect');
  const pauseBtn = document.getElementById('pauseBtn');
  const muteBtn = document.getElementById('muteBtn');
  const restartBtn = document.getElementById('restartBtn');

  // Overlay Elements
  const gameOverlay = document.getElementById('gameOverlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMessage = document.getElementById('overlayMessage');
  const overlayBtn = document.getElementById('overlayBtn');
  const overlayIcon = document.getElementById('overlayIcon');
  const overlayStats = document.getElementById('overlayStats');
  const finalScoreVal = document.getElementById('finalScoreVal');
  const newHighNotice = document.getElementById('newHighNotice');

  // Audio & State
  const sounds = new SoundManager();
  let gameState = 'ready'; // 'ready', 'running', 'paused', 'gameover'
  let score = 0;
  let applesEaten = 0;
  let highScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  let difficulty = 'medium';

  let snake = [];
  let dir = { x: 1, y: 0 };
  let inputQueue = [];

  let food = { x: 15, y: 10 };
  let bonusFood = null; // { x, y, spawnTime, duration: 8000 }
  let bonusSpawnCounter = 0;

  let particles = [];
  let lastTick = 0;
  let animationFrameId = null;

  // Initialize display
  highScoreEl.textContent = highScore;

  function resetGame() {
    snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ];
    dir = { x: 1, y: 0 };
    inputQueue = [];
    score = 0;
    applesEaten = 0;
    bonusFood = null;
    bonusSpawnCounter = 0;
    particles = [];

    currentScoreEl.textContent = '0';
    applesCountEl.textContent = '0';
    updateSpeedBadge();

    spawnFood();
  }

  function getBaseTickRate() {
    let base = SPEEDS[difficulty] || 90;
    // Slight speedup every 5 apples
    const speedBoost = Math.min(30, Math.floor(applesEaten / 5) * 4);
    return Math.max(45, base - speedBoost);
  }

  function updateSpeedBadge() {
    const base = SPEEDS[difficulty] || 90;
    const current = getBaseTickRate();
    const multiplier = (base / current).toFixed(1);
    speedBadgeEl.textContent = `Speed: ${multiplier}x`;
  }

  function spawnFood() {
    let attempts = 0;
    while (attempts < 500) {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);

      const onSnake = snake.some(seg => seg.x === rx && seg.y === ry);
      const onBonus = bonusFood && bonusFood.x === rx && bonusFood.y === ry;

      if (!onSnake && !onBonus) {
        food = { x: rx, y: ry };
        break;
      }
      attempts++;
    }
  }

  function spawnBonusFood() {
    let attempts = 0;
    while (attempts < 500) {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);

      const onSnake = snake.some(seg => seg.x === rx && seg.y === ry);
      const onFood = food.x === rx && food.y === ry;

      if (!onSnake && !onFood) {
        bonusFood = {
          x: rx,
          y: ry,
          spawnTime: Date.now(),
          duration: 7500 // 7.5 seconds
        };
        break;
      }
      attempts++;
    }
  }

  function createParticles(cellX, cellY, color, count = 14) {
    const px = cellX * CELL_SIZE + CELL_SIZE / 2;
    const py = cellY * CELL_SIZE + CELL_SIZE / 2;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(px, py, color));
    }
  }

  // --- Input Handlers ---
  function changeDirection(newDir) {
    sounds.init();
    if (gameState === 'ready' || gameState === 'gameover') {
      startGame();
      return;
    }
    if (gameState === 'paused') {
      togglePause();
      return;
    }

    // Determine what last scheduled direction is
    const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : dir;

    // Disallow 180-degree immediate turns
    if (newDir.x + lastDir.x === 0 && newDir.y + lastDir.y === 0) return;
    if (newDir.x === lastDir.x && newDir.y === lastDir.y) return;

    if (inputQueue.length < 3) {
      inputQueue.push(newDir);
      sounds.playTurn();
    }
  }

  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        changeDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        changeDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        changeDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        changeDirection({ x: 1, y: 0 });
        break;
      case ' ':
        e.preventDefault();
        togglePause();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        restartGame();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        toggleMute();
        break;
    }
  });

  // Mobile D-Pad Buttons
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    const handlePress = (e) => {
      e.preventDefault();
      const dirKey = btn.getAttribute('data-dir');
      if (dirKey === 'ArrowUp') changeDirection({ x: 0, y: -1 });
      if (dirKey === 'ArrowDown') changeDirection({ x: 0, y: 1 });
      if (dirKey === 'ArrowLeft') changeDirection({ x: -1, y: 0 });
      if (dirKey === 'ArrowRight') changeDirection({ x: 1, y: 0 });
    };
    btn.addEventListener('touchstart', handlePress, { passive: false });
    btn.addEventListener('mousedown', handlePress);
  });

  // Touch Swipe on Canvas
  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 25) {
      if (absDx > absDy) {
        changeDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
      } else {
        changeDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
      }
    }
  }, { passive: true });

  // --- Buttons ---
  function startGame() {
    sounds.init();
    resetGame();
    gameState = 'running';
    gameOverlay.classList.add('hidden');
    lastTick = performance.now();
  }

  function togglePause() {
    if (gameState === 'running') {
      gameState = 'paused';
      pauseBtn.textContent = '▶️';
      overlayTitle.textContent = 'Paused';
      overlayIcon.textContent = '⏸️';
      overlayMessage.textContent = 'Take a breather. Press Resume to continue!';
      overlayStats.style.display = 'none';
      overlayBtn.textContent = 'Resume';
      gameOverlay.classList.remove('hidden');
    } else if (gameState === 'paused') {
      gameState = 'running';
      pauseBtn.textContent = '⏸️';
      gameOverlay.classList.add('hidden');
      lastTick = performance.now();
    }
  }

  function restartGame() {
    sounds.init();
    startGame();
  }

  function toggleMute() {
    sounds.init();
    const isMuted = sounds.toggleMute();
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
  }

  overlayBtn.addEventListener('click', () => {
    if (gameState === 'paused') {
      togglePause();
    } else {
      startGame();
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (gameState === 'running' || gameState === 'paused') {
      togglePause();
    }
  });

  muteBtn.addEventListener('click', toggleMute);
  restartBtn.addEventListener('click', restartGame);

  difficultySelect.addEventListener('change', (e) => {
    difficulty = e.target.value;
    updateSpeedBadge();
  });

  // --- Game Over ---
  function gameOver() {
    gameState = 'gameover';
    sounds.playGameOver();
    createParticles(snake[0].x, snake[0].y, '#ef4444', 24);

    let isNewHigh = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(STORAGE_KEY, highScore.toString());
      highScoreEl.textContent = highScore;
      isNewHigh = true;
    }

    finalScoreVal.textContent = score;
    newHighNotice.style.display = isNewHigh ? 'block' : 'none';
    overlayStats.style.display = 'block';

    overlayTitle.textContent = 'Game Over';
    overlayIcon.textContent = isNewHigh ? '🏆' : '💀';
    overlayMessage.textContent = isNewHigh
      ? 'Outstanding run! You set a new personal record!'
      : 'You collided! Give it another shot.';
    overlayBtn.textContent = 'Play Again';

    gameOverlay.classList.remove('hidden');
  }

  // --- Game Tick / Physics ---
  function update() {
    if (inputQueue.length > 0) {
      dir = inputQueue.shift();
    }

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      gameOver();
      return;
    }

    // Self collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    // Check normal food
    let ateFood = false;
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      applesEaten++;
      currentScoreEl.textContent = score;
      applesCountEl.textContent = applesEaten;
      sounds.playEat();
      createParticles(food.x, food.y, '#ef4444', 12);
      updateSpeedBadge();
      spawnFood();
      ateFood = true;

      // Spawn bonus food every 4 apples
      bonusSpawnCounter++;
      if (bonusSpawnCounter >= 4 && !bonusFood) {
        bonusSpawnCounter = 0;
        spawnBonusFood();
      }
    }

    // Check golden bonus food
    if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
      score += 50;
      currentScoreEl.textContent = score;
      sounds.playBonus();
      createParticles(bonusFood.x, bonusFood.y, '#f59e0b', 20);
      bonusFood = null;
      ateFood = true;
    }

    // Tail management
    if (!ateFood) {
      snake.pop();
    }

    // Bonus food timeout
    if (bonusFood) {
      const elapsed = Date.now() - bonusFood.spawnTime;
      if (elapsed >= bonusFood.duration) {
        bonusFood = null;
      }
    }
  }

  // --- Rendering ---
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle Grid Background
    drawGrid();

    // Draw Bonus Food (Golden Apple with countdown ring)
    if (bonusFood) {
      drawBonusFood(bonusFood);
    }

    // Draw Normal Food
    drawFood(food);

    // Draw Snake
    drawSnake();

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawFood(f) {
    const cx = f.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = f.y * CELL_SIZE + CELL_SIZE / 2;
    const r = CELL_SIZE / 2 - 2;

    // Glow
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;

    // Body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Leaf stem
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy - r + 1, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawBonusFood(bf) {
    const cx = bf.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = bf.y * CELL_SIZE + CELL_SIZE / 2;
    const r = CELL_SIZE / 2 - 2;

    const elapsed = Date.now() - bf.spawnTime;
    const remainingRatio = Math.max(0, 1 - elapsed / bf.duration);

    ctx.save();
    // Pulse
    const pulse = 1 + Math.sin(Date.now() / 120) * 0.1;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 18;

    // Golden Body
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Countdown Ring around bonus food
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remainingRatio);
    ctx.stroke();

    ctx.restore();
  }

  function drawSnake() {
    snake.forEach((seg, index) => {
      const x = seg.x * CELL_SIZE;
      const y = seg.y * CELL_SIZE;
      const pad = 1.5;

      ctx.save();

      if (index === 0) {
        // Head
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 6);
        ctx.fill();

        // Eyes
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0f172a';

        const eyeOffset = 4;
        let eye1 = { x: x + 5, y: y + 5 };
        let eye2 = { x: x + 15, y: y + 5 };

        if (dir.x === 1) { // Right
          eye1 = { x: x + 14, y: y + 5 };
          eye2 = { x: x + 14, y: y + 15 };
        } else if (dir.x === -1) { // Left
          eye1 = { x: x + 6, y: y + 5 };
          eye2 = { x: x + 6, y: y + 15 };
        } else if (dir.y === 1) { // Down
          eye1 = { x: x + 5, y: y + 14 };
          eye2 = { x: x + 15, y: y + 14 };
        } else if (dir.y === -1) { // Up
          eye1 = { x: x + 5, y: y + 6 };
          eye2 = { x: x + 15, y: y + 6 };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, 2, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, 2, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Body segments
        const alpha = Math.max(0.4, 1 - (index / snake.length) * 0.6);
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;

        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 4);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // --- Main Animation Loop ---
  function loop(timestamp) {
    if (gameState === 'running') {
      const tickInterval = getBaseTickRate();
      if (timestamp - lastTick >= tickInterval) {
        update();
        lastTick = timestamp;
      }
    }

    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  // Initial draw & loop start
  resetGame();
  draw();
  animationFrameId = requestAnimationFrame(loop);

})();
