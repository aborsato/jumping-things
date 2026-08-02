const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelLabel = document.getElementById('levelLabel');
const statusLabel = document.getElementById('statusLabel');
const restartBtn = document.getElementById('restartBtn');
const controlButtons = document.querySelectorAll('.control-btn');

const WORLD_WIDTH = canvas.width;
const WORLD_HEIGHT = canvas.height;
const GRAVITY = 1080;
const MOVE_SPEED = 240;
const JUMP_SPEED = 520;

const input = {
  left: false,
  right: false,
  jumpPressed: false,
};

let currentLevel = 0;
let lastTime = 0;
let player = null;
let levelComplete = false;

const levels = [
  {
    name: 'Easy',
    start: { x: 28, y: 566 },
    goal: { x: 320, y: 340, w: 22, h: 32 },
    floorY: 600,
    blocks: [
      { x: 0, y: 600, w: 360, h: 40, color: '#6d4fcb' },
      { x: 78, y: 500, w: 92, h: 22, color: '#2cb1c4' },
      { x: 196, y: 442, w: 86, h: 22, color: '#2cb1c4' },
      { x: 278, y: 382, w: 60, h: 22, color: '#2cb1c4' },
      { x: 148, y: 532, w: 54, h: 14, color: '#4d81ff', half: true },
    ],
    spikes: [
      { x: 154, y: 576, w: 24, h: 24 },
      { x: 252, y: 576, w: 24, h: 24 },
    ],
    decorations: [
      { x: 40, y: 562, type: 'star' },
      { x: 320, y: 560, type: 'flower' },
    ],
  },
  {
    name: 'Mid',
    start: { x: 26, y: 566 },
    goal: { x: 320, y: 332, w: 22, h: 32 },
    floorY: 600,
    blocks: [
      { x: 0, y: 600, w: 360, h: 40, color: '#7a5cff' },
      { x: 72, y: 530, w: 70, h: 18, color: '#e8785f', half: true },
      { x: 156, y: 468, w: 80, h: 20, color: '#2ec4b6' },
      { x: 244, y: 530, w: 56, h: 14, color: '#4d81ff', half: true },
      { x: 276, y: 412, w: 72, h: 20, color: '#2ec4b6' },
    ],
    spikes: [
      { x: 214, y: 576, w: 24, h: 24 },
    ],
    decorations: [
      { x: 48, y: 560, type: 'cloud' },
      { x: 300, y: 550, type: 'star' },
      { x: 176, y: 560, type: 'flower' },
    ],
  },
  {
    name: 'Extreme',
    start: { x: 24, y: 566 },
    goal: { x: 318, y: 328, w: 22, h: 32 },
    floorY: 600,
    blocks: [
      { x: 0, y: 600, w: 360, h: 40, color: '#5330d5' },
      { x: 74, y: 520, w: 60, h: 18, color: '#f29d4b' },
      { x: 156, y: 458, w: 56, h: 18, color: '#f29d4b' },
      { x: 240, y: 392, w: 56, h: 18, color: '#f29d4b' },
      { x: 104, y: 392, w: 54, h: 14, color: '#4d81ff', half: true },
      { x: 208, y: 520, w: 54, h: 14, color: '#4d81ff', half: true },
    ],
    spikes: [
      { x: 90, y: 576, w: 22, h: 24 },
      { x: 140, y: 576, w: 22, h: 24 },
      { x: 190, y: 576, w: 22, h: 24 },
      { x: 240, y: 576, w: 22, h: 24 },
      { x: 290, y: 576, w: 22, h: 24 },
    ],
    decorations: [
      { x: 38, y: 556, type: 'star' },
      { x: 196, y: 560, type: 'cloud' },
      { x: 312, y: 548, type: 'flower' },
    ],
  },
];

function resetLevel() {
  const level = levels[currentLevel];
  player = {
    x: level.start.x,
    y: level.start.y,
    w: 22,
    h: 34,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
  };
  levelComplete = false;
  input.left = false;
  input.right = false;
  input.jumpPressed = false;
  levelLabel.textContent = `Level ${currentLevel + 1} • ${level.name}`;
  statusLabel.textContent = 'Run, jump, and reach the flag.';
}

function loadNextLevel() {
  currentLevel += 1;
  if (currentLevel >= levels.length) {
    currentLevel = 0;
    statusLabel.textContent = 'You beat every level! Press restart to play again.';
    levelComplete = true;
    return;
  }
  resetLevel();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  if (!player) {
    resetLevel();
    return;
  }

  if (levelComplete) {
    return;
  }

  const level = levels[currentLevel];

  const axis = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  player.vx = axis * MOVE_SPEED;
  if (axis !== 0) {
    player.facing = axis > 0 ? 1 : -1;
  }

  if (player.onGround && input.jumpPressed) {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
  }

  input.jumpPressed = false;
  player.vy += GRAVITY * dt;

  const prevX = player.x;
  player.x += player.vx * dt;
  for (const block of level.blocks) {
    if (rectsOverlap(player, block)) {
      if (player.vx > 0) {
        player.x = block.x - player.w;
      } else if (player.vx < 0) {
        player.x = block.x + block.w;
      }
      player.vx = 0;
    }
  }

  const prevY = player.y;
  player.y += player.vy * dt;
  player.onGround = false;

  for (const block of level.blocks) {
    if (rectsOverlap(player, block)) {
      const topLimit = block.half ? block.y + block.h / 2 : block.y;
      if (player.vy >= 0 && prevY + player.h <= topLimit + 2) {
        player.y = topLimit - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = block.y + block.h;
        player.vy = 0;
      }
    }
  }

  if (player.y + player.h > level.floorY) {
    player.y = level.floorY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  if (player.x < -player.w) {
    player.x = -player.w;
  }
  if (player.x + player.w > WORLD_WIDTH) {
    player.x = WORLD_WIDTH - player.w;
  }

  for (const spike of level.spikes) {
    if (rectsOverlap(player, spike)) {
      statusLabel.textContent = 'Ouch! Try again.';
      resetLevel();
      return;
    }
  }

  if (rectsOverlap(player, level.goal)) {
    levelComplete = true;
    statusLabel.textContent = `Nice work! ${level.name} complete.`;
    setTimeout(loadNextLevel, 600);
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  sky.addColorStop(0, '#112442');
  sky.addColorStop(1, '#2d536e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 6; i += 1) {
    const x = 24 + i * 58;
    const y = 58 + (i % 2) * 20;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBlock(block) {
  ctx.fillStyle = block.color;
  ctx.fillRect(block.x, block.y, block.w, block.h);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(block.x, block.y, block.w, 5);
}

function drawSpike(spike) {
  ctx.fillStyle = '#ef476f';
  ctx.beginPath();
  ctx.moveTo(spike.x, spike.y + spike.h);
  ctx.lineTo(spike.x + spike.w / 2, spike.y);
  ctx.lineTo(spike.x + spike.w, spike.y + spike.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8a5b';
  ctx.fillRect(spike.x + 8, spike.y + spike.h - 8, spike.w - 16, 6);
}

function drawDecoration(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.type === 'star') {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const outer = 8;
      const inner = 4;
      const angle = (Math.PI / 5) * i * 2;
      const x = i % 2 === 0 ? outer * Math.cos(angle) : inner * Math.cos(angle);
      const y = i % 2 === 0 ? outer * Math.sin(angle) : inner * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (item.type === 'flower') {
    ctx.fillStyle = '#ff7aa2';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.arc(-6, 0, 4, 0, Math.PI * 2);
    ctx.arc(6, 0, 4, 0, Math.PI * 2);
    ctx.arc(0, -6, 4, 0, Math.PI * 2);
    ctx.arc(0, 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8bc34a';
    ctx.fillRect(-2, -2, 4, 4);
  } else if (item.type === 'cloud') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.arc(8, -3, 8, 0, Math.PI * 2);
    ctx.arc(16, 0, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#ffdb70';
  ctx.fillRect(0, 0, player.w, player.h);
  ctx.fillStyle = '#1c2230';
  ctx.fillRect(5, 8, 5, 5);
  ctx.fillRect(player.w - 10, 8, 5, 5);
  ctx.fillStyle = '#ff7a59';
  ctx.fillRect(4, 18, player.w - 8, 7);
  ctx.restore();
}

function drawGoal(goal) {
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  ctx.fillStyle = '#ffec59';
  ctx.fillRect(goal.x + 8, goal.y - 20, 4, 24);
  ctx.fillRect(goal.x + 8, goal.y - 20, 16, 6);
}

function render() {
  drawBackground();
  const level = levels[currentLevel];

  level.decorations.forEach(drawDecoration);
  level.blocks.forEach(drawBlock);
  level.spikes.forEach(drawSpike);
  drawGoal(level.goal);
  drawPlayer();
}

function loop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }
  const dt = Math.min(0.032, (timestamp - lastTime) / 1000);
  lastTime = timestamp;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function bindInput() {
  window.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      input.left = true;
      event.preventDefault();
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      input.right = true;
      event.preventDefault();
    } else if (event.code === 'ArrowUp' || event.code === 'Space' || event.code === 'KeyW') {
      input.jumpPressed = true;
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      input.left = false;
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      input.right = false;
    }
  });

  window.addEventListener('blur', () => {
    input.left = false;
    input.right = false;
    input.jumpPressed = false;
  });

  controlButtons.forEach((button) => {
    const action = button.dataset.action;
    const press = () => {
      button.classList.add('active');
      if (action === 'left') input.left = true;
      if (action === 'right') input.right = true;
      if (action === 'jump') input.jumpPressed = true;
    };
    const release = () => {
      button.classList.remove('active');
      if (action === 'left') input.left = false;
      if (action === 'right') input.right = false;
    };

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      press();
    });
    button.addEventListener('pointerup', (event) => {
      event.preventDefault();
      release();
    });
    button.addEventListener('pointerleave', () => release());
    button.addEventListener('pointercancel', () => release());
  });

  restartBtn.addEventListener('click', () => {
    resetLevel();
  });
}

bindInput();
resetLevel();
requestAnimationFrame(loop);
