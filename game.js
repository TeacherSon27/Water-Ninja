(() => {
  "use strict";

  const ROUND_SECONDS = 20;
  const TOTAL_ROUNDS = 3;
  const SLICE_TRAIL_MS = 420;
  const CELEBRATION_CONFETTI_COUNT = 3000;
  const CELEBRATION_STAR_COUNT = 300;
  const ACCESS_CODE = "WATER";
  const PLAYER_MODE = {
    ONE: "one",
    TWO: "two"
  };
  const CANVAS_FONT = '"UD Digi Kyokasho NP-B", "UD Digi Kyokasho N-B", "UD Digi Kyokasho NK-B", "Hiragino Maru Gothic ProN", "Yu Gothic", Arial, sans-serif';
  const CELEBRATION_COLORS = ["#ffcf4a", "#ffffff", "#5ee7ff", "#00a9a5", "#ef5b9a", "#7b61d8", "#44aa52", "#ff7a1a"];
  const TERMS = [
    { id: "rain", label: "rain", src: "assets/rain.png" },
    { id: "sea", label: "sea", src: "assets/sea.png" },
    { id: "river", label: "river", src: "assets/river.png" },
    { id: "tap", label: "tap", src: "assets/tap.png" },
    { id: "ice", label: "ice", src: "assets/ice.png" },
    { id: "liquid", label: "liquid", src: "assets/liquid.png" },
    { id: "steam", label: "steam", src: "assets/steam.png" },
    { id: "water", label: "water", src: "assets/water.png" },
    { id: "turn-off-tap", label: "turn off", src: "assets/turn-off-tap.png" },
    { id: "watering", label: "watering", src: "assets/watering.png" },
    { id: "save-water", label: "save water", src: "assets/save-water.png" },
    { id: "no-playing", label: "no playing", src: "assets/no-playing.png" },
    { id: "cooking", label: "cooking", src: "assets/cooking.png" },
    { id: "drinking", label: "drinking", src: "assets/drinking.png" },
    { id: "washing", label: "washing", src: "assets/washing.png" },
    { id: "cleaning", label: "cleaning", src: "assets/cleaning.png" }
  ];

  const CHALLENGES = [
    {
      target: "rain",
      prompt: "Water comes from ____.",
      answer: "Water comes from rain."
    },
    {
      target: "turn-off-tap",
      prompt: "____ the tap.",
      answer: "Turn off the tap."
    },
    {
      target: "sea",
      prompt: "Water comes from the ____.",
      answer: "Water comes from the sea."
    },
    {
      target: "save-water",
      prompt: "____.",
      answer: "Save water."
    },
    {
      target: "river",
      prompt: "Water is in the ____.",
      answer: "Water is in the river."
    },
    {
      target: "no-playing",
      prompt: "____ with water.",
      answer: "No playing with water."
    },
    {
      target: "tap",
      prompt: "Water comes from a ____.",
      answer: "Water comes from a tap."
    },
    {
      target: "watering",
      prompt: "We use water for ____ plants.",
      answer: "We use water for watering plants."
    },
    {
      target: "ice",
      prompt: "Water can be ____. Ice is water.",
      answer: "Water can be ice. Ice is water."
    },
    {
      target: "cooking",
      prompt: "We use water for ____.",
      answer: "We use water for cooking."
    },
    {
      target: "liquid",
      prompt: "Water can be ____. Liquid water is water.",
      answer: "Water can be liquid. Liquid water is water."
    },
    {
      target: "drinking",
      prompt: "We use water for ____.",
      answer: "We use water for drinking."
    },
    {
      target: "steam",
      prompt: "Water can be ____. Steam is water vapor.",
      answer: "Water can be steam. Steam is water vapor."
    },
    {
      target: "washing",
      prompt: "We use water for ____.",
      answer: "We use water for washing."
    },
    {
      target: "cleaning",
      prompt: "We use water for ____.",
      answer: "We use water for cleaning."
    }
  ];

  const canvas = document.getElementById("gameCanvas");
  const arena = document.getElementById("arena");
  const ctx = canvas.getContext("2d");
  const startButton = document.getElementById("startButton");
  const pauseButton = document.getElementById("pauseButton");
  const resetButton = document.getElementById("resetButton");
  const modeToggleButton = document.getElementById("modeToggleButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const endGameButton = document.getElementById("endGameButton");
  const winnerResetButton = document.getElementById("winnerResetButton");
  const winnerOverlay = document.getElementById("winnerOverlay");
  const winnerTitle = document.getElementById("winnerTitle");
  const winnerScore = document.getElementById("winnerScore");
  const celebrationCanvas = document.getElementById("celebrationCanvas");
  const celebrationCtx = celebrationCanvas.getContext("2d");
  const accessOverlay = document.getElementById("accessOverlay");
  const accessForm = document.getElementById("accessForm");
  const accessCode = document.getElementById("accessCode");
  const accessMessage = document.getElementById("accessMessage");
  const termById = Object.fromEntries(TERMS.map((term) => [term.id, term]));
  const playerPanels = [
    document.querySelector(".player-one"),
    document.querySelector(".player-two")
  ];
  const playerNames = playerPanels.map((panel) => panel && panel.querySelector(".player-name"));

  const hud = [0, 1].map((index) => ({
    score: document.getElementById(`score-${index}`),
    round: document.getElementById(`round-${index}`),
    time: document.getElementById(`time-${index}`),
    target: document.getElementById(`target-${index}`),
    pattern: document.getElementById(`pattern-${index}`),
    answer: document.getElementById(`answer-${index}`)
  }));

  const images = new Map();
  const state = {
    ready: false,
    running: false,
    paused: false,
    width: 1,
    height: 1,
    dpr: 1,
    celebrationWidth: 1,
    celebrationHeight: 1,
    lastFrame: performance.now(),
    round: 1,
    playerMode: PLAYER_MODE.TWO,
    matchOver: false,
    accessGranted: false,
    fullscreenWanted: false,
    items: [],
    particles: [],
    feedbacks: [],
    trails: new Map(),
    winnerBanner: null,
    resetButtonBounds: null,
    players: [createPlayer(0, 0), createPlayer(1, 1)]
  };

  let audioContext = null;

  function createPlayer(index, challengeIndex) {
    return {
      index,
      score: 0,
      streak: 0,
      timeLeft: ROUND_SECONDS,
      challengeIndex,
      nextSpawn: 0.15 + Math.random() * 0.35,
      answerText: "",
      answerTone: ""
    };
  }

  function isOnePlayerMode() {
    return state.playerMode === PLAYER_MODE.ONE;
  }

  function activePlayerIndexes() {
    return isOnePlayerMode() ? [0] : [0, 1];
  }

  function activePlayers() {
    return activePlayerIndexes().map((index) => state.players[index]);
  }

  function setPlayerMode(mode) {
    if (state.playerMode === mode) {
      return;
    }

    state.playerMode = mode;
    state.items = state.items.filter((item) => activePlayerIndexes().includes(item.playerIndex));
    state.trails.clear();

    if (!isOnePlayerMode() && state.players[1].timeLeft <= 0 && state.players[0].timeLeft > 0) {
      state.players[1].timeLeft = state.players[0].timeLeft;
      state.players[1].answerText = state.players[1].answerText || "Go";
      state.players[1].answerTone = "";
    }

    syncPlayerModeUi();
    updateAllHud();
    resizeCanvas();
  }

  function togglePlayerMode() {
    setPlayerMode(isOnePlayerMode() ? PLAYER_MODE.TWO : PLAYER_MODE.ONE);
  }

  function syncPlayerModeUi() {
    const onePlayer = isOnePlayerMode();
    arena.classList.toggle("one-player", onePlayer);
    arena.classList.toggle("two-player", !onePlayer);
    arena.setAttribute("aria-label", onePlayer ? "One-player game area" : "Two-player game area");
    document.documentElement.dataset.playerMode = onePlayer ? "one" : "two";
    document.body.dataset.playerMode = onePlayer ? "one" : "two";

    if (playerNames[0]) {
      playerNames[0].textContent = onePlayer ? "One Player" : "Player 1";
    }
    if (playerPanels[1]) {
      playerPanels[1].setAttribute("aria-hidden", onePlayer ? "true" : "false");
    }
    if (modeToggleButton) {
      const spans = modeToggleButton.querySelectorAll("span");
      modeToggleButton.setAttribute("aria-pressed", String(onePlayer));
      modeToggleButton.setAttribute("aria-label", onePlayer ? "Switch to split-screen mode" : "Switch to One Player Mode");
      modeToggleButton.title = onePlayer ? "Switch to split-screen mode" : "Switch to One Player Mode";
      if (spans[0]) {
        spans[0].textContent = onePlayer ? "2P" : "1P";
      }
      if (spans[1]) {
        spans[1].textContent = onePlayer ? "Two Player" : "One Player";
      }
    }
  }

  function currentChallenge(player) {
    return CHALLENGES[player.challengeIndex % CHALLENGES.length];
  }

  function loadImages() {
    return Promise.all(
      TERMS.map((term) => {
        const image = new Image();
        image.decoding = "async";
        image.src = term.src;
        images.set(term.id, image);
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })
    );
  }

  function resizeCanvas() {
    const rect = arena.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    resizeCelebrationCanvas();
  }

  function resizeCelebrationCanvas() {
    state.celebrationWidth = Math.max(1, window.innerWidth || state.width);
    state.celebrationHeight = Math.max(1, window.innerHeight || state.height);
    celebrationCanvas.width = Math.floor(state.celebrationWidth * state.dpr);
    celebrationCanvas.height = Math.floor(state.celebrationHeight * state.dpr);
    celebrationCanvas.style.width = `${state.celebrationWidth}px`;
    celebrationCanvas.style.height = `${state.celebrationHeight}px`;
    celebrationCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function resetGame() {
    const playerMode = state.playerMode;
    state.running = false;
    state.paused = false;
    state.round = 1;
    state.playerMode = playerMode;
    state.matchOver = false;
    state.items = [];
    state.particles = [];
    state.feedbacks = [];
    state.trails.clear();
    state.winnerBanner = null;
    state.resetButtonBounds = null;
    hideWinnerOverlay();
    state.players = [createPlayer(0, 0), createPlayer(1, 1)];
    setStartLabel("Start", "\\u25b6");
    setPauseLabel("Pause", "\\u275a\\u275a");
    syncPlayerModeUi();
    updateAllHud();
  }

  function startGame() {
    if (!state.ready || !state.accessGranted) {
      return;
    }

    if (state.matchOver) {
      resetGame();
    }

    state.running = true;
    state.paused = false;
    activePlayers().forEach((player) => {
      if (!player.answerText) {
        player.answerText = "Go";
        player.answerTone = "";
      }
    });
    setStartLabel("Start", "\\u25b6");
    setPauseLabel("Pause", "\\u275a\\u275a");
    updateAllHud();
  }

  function togglePause() {
    if (!state.running) {
      return;
    }
    state.paused = !state.paused;
    setPauseLabel(state.paused ? "Resume" : "Pause", state.paused ? "\\u25b6" : "\\u275a\\u275a");
  }

  function setStartLabel(label, icon) {
    const spans = startButton.querySelectorAll("span");
    spans[0].textContent = JSON.parse(`"${icon}"`);
    spans[1].textContent = label;
  }

  function setPauseLabel(label, icon) {
    const spans = pauseButton.querySelectorAll("span");
    spans[0].textContent = JSON.parse(`"${icon}"`);
    spans[1].textContent = label;
  }

  function showWinnerOverlay(text, scoreLine) {
    winnerTitle.textContent = text;
    winnerScore.textContent = scoreLine;
    winnerOverlay.hidden = false;
  }

  function hideWinnerOverlay() {
    winnerOverlay.hidden = true;
    celebrationCtx.clearRect(0, 0, state.celebrationWidth, state.celebrationHeight);
  }

  function unlockAccessCover() {
    state.accessGranted = true;
    accessOverlay.hidden = true;
    accessMessage.textContent = "";
    accessCode.value = "";
    startButton.focus({ preventScroll: true });
  }

  function showAccessError() {
    accessMessage.textContent = "Incorrect code.";
    accessCode.value = "";
    accessCode.focus();
    accessOverlay.classList.remove("shake");
    void accessOverlay.offsetWidth;
    accessOverlay.classList.add("shake");
  }

  function updateAllHud() {
    state.players.forEach((player) => updateHud(player.index));
  }

  function updateHud(playerIndex) {
    const player = state.players[playerIndex];
    const challenge = currentChallenge(player);
    const target = termById[challenge.target];
    const elements = hud[playerIndex];

    elements.score.textContent = String(player.score);
    elements.round.textContent = `${state.round}/${TOTAL_ROUNDS}`;
    elements.time.textContent = String(Math.ceil(player.timeLeft));
    elements.target.textContent = target.label;
    elements.pattern.textContent = challenge.prompt;
    elements.answer.textContent = player.answerText;
    elements.answer.classList.toggle("warn", player.answerTone === "warn");
    elements.answer.classList.toggle("done", player.answerTone === "done");
  }

  function playerBounds(playerIndex) {
    if (isOnePlayerMode()) {
      return { left: 0, right: state.width, top: 0, bottom: state.height };
    }

    const half = state.width / 2;
    return playerIndex === 0
      ? { left: 0, right: half, top: 0, bottom: state.height }
      : { left: half, right: state.width, top: 0, bottom: state.height };
  }

  function updateGame(dt) {
    if (state.running && !state.paused) {
      const players = activePlayers();

      players.forEach((player) => {
        if (player.timeLeft > 0) {
          player.timeLeft = Math.max(0, player.timeLeft - dt);
          player.nextSpawn -= dt;

          if (player.nextSpawn <= 0 && player.timeLeft > 0) {
            spawnItem(player.index);
            player.nextSpawn = randomBetween(0.42, 0.82);
          }

          if (player.timeLeft === 0) {
            player.answerText = state.round < TOTAL_ROUNDS ? `Round ${state.round} complete` : `Final score: ${player.score}`;
            player.answerTone = "done";
          }

          updateHud(player.index);
        }
      });

      if (players.every((player) => player.timeLeft <= 0)) {
        if (state.round < TOTAL_ROUNDS) {
          advanceRound();
        } else {
          finishMatch();
        }
      }
    }

    updateItems(dt);
    updateParticles(dt);
    updateFeedbacks(dt);
  }

  function advanceRound() {
    state.round += 1;
    state.items = [];
    state.trails.clear();

    state.players.forEach((player) => {
      player.timeLeft = ROUND_SECONDS;
      player.streak = 0;
      player.nextSpawn = 0.15 + Math.random() * 0.35;
      player.answerText = `Round ${state.round}`;
      player.answerTone = "";
    });

    updateAllHud();
  }

  function finishMatch() {
    state.running = false;
    state.paused = false;
    state.matchOver = true;
    state.items = [];
    state.trails.clear();

    if (isOnePlayerMode()) {
      const player = state.players[0];
      player.timeLeft = 0;
      player.answerText = `Final score: ${player.score}. Great game.`;
      player.answerTone = "done";

      setStartLabel("Restart", "\\u25b6");
      setPauseLabel("Pause", "\\u275a\\u275a");
      createWinnerCelebration("GAME COMPLETE", `Score ${player.score}`);
      updateAllHud();
      return;
    }

    const scores = state.players.map((player) => player.score);
    const highScore = Math.max(...scores);
    const winnerIndexes = scores
      .map((score, index) => (score === highScore ? index : -1))
      .filter((index) => index >= 0);
    const bannerText = winnerIndexes.length === 1 ? `WINNER: PLAYER ${winnerIndexes[0] + 1}` : "TIE GAME";

    state.players.forEach((player) => {
      const otherScore = scores[player.index === 0 ? 1 : 0];
      const result = player.score === otherScore ? "Tie game." : player.score > otherScore ? "Winner!" : "Good game.";
      player.timeLeft = 0;
      player.answerText = `Final score: ${player.score}. ${result}`;
      player.answerTone = "done";
    });

    setStartLabel("Restart", "\\u25b6");
    setPauseLabel("Pause", "\\u275a\\u275a");
    createWinnerCelebration(bannerText, `P1 ${scores[0]} - P2 ${scores[1]}`);
    updateAllHud();
  }

  function spawnItem(playerIndex) {
    const player = state.players[playerIndex];
    const challenge = currentChallenge(player);
    const bounds = playerBounds(playerIndex);
    const targetId = challenge.target;
    const decoys = TERMS.filter((term) => term.id !== targetId);
    const useTarget = Math.random() < 0.64;
    const term = useTarget ? termById[targetId] : decoys[Math.floor(Math.random() * decoys.length)];
    const sideWidth = bounds.right - bounds.left;
    const baseSize = Math.min(sideWidth, state.height);
    const onePlayer = isOnePlayerMode();
    const maxRadius = onePlayer
      ? Math.max(72, Math.min(sideWidth * 0.18, state.height * 0.24, 210))
      : Math.max(70, Math.min(sideWidth * 0.24, state.height * 0.28, 220));
    const minRadius = Math.min(maxRadius, Math.max(onePlayer ? 86 : 92, baseSize * (onePlayer ? 0.12 : 0.15), maxRadius * 0.72));
    const radius = randomBetween(minRadius, maxRadius);
    const minX = bounds.left + radius + 18;
    const maxX = bounds.right - radius - 18;
    const x = maxX > minX ? randomBetween(minX, maxX) : bounds.left + sideWidth / 2;
    const centerPull = onePlayer
      ? randomBetween(-90, 90)
      : playerIndex === 0
        ? randomBetween(30, 130)
        : randomBetween(-130, -30);
    const vx = randomBetween(-125, 125) + centerPull * 0.28;
    const vy = -randomBetween(state.height * 0.92, state.height * 1.18);

    state.items.push({
      id: `${Date.now()}-${Math.random()}`,
      playerIndex,
      termId: term.id,
      label: term.label,
      x,
      y: state.height + radius + 24,
      vx,
      vy,
      radius,
      rotation: randomBetween(-0.5, 0.5),
      spin: randomBetween(-2.2, 2.2),
      gravity: state.height * 0.95,
      sliced: false,
      wrongFlash: 0
    });
  }

  function updateItems(dt) {
    for (const item of state.items) {
      if (item.sliced) {
        continue;
      }

      const bounds = playerBounds(item.playerIndex);
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vy += item.gravity * dt;
      item.rotation += item.spin * dt;

      if (item.x < bounds.left + item.radius) {
        item.x = bounds.left + item.radius;
        item.vx = Math.abs(item.vx) * 0.86;
      }

      if (item.x > bounds.right - item.radius) {
        item.x = bounds.right - item.radius;
        item.vx = -Math.abs(item.vx) * 0.86;
      }

      item.wrongFlash = Math.max(0, item.wrongFlash - dt);
    }

    state.items = state.items.filter((item) => item.y < state.height + item.radius * 2 && !item.sliced);
  }

  function updateParticles(dt) {
    const celebrationWidth = state.celebrationWidth;
    const celebrationHeight = state.celebrationHeight;

    for (const particle of state.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 540 * dt;
      particle.rotation = (particle.rotation || 0) + (particle.spin || 0) * dt;
      particle.life -= dt;
    }

    state.particles = state.particles.filter((particle) => particle.life > 0);

    // Spawn new confetti continuously while winner banner is showing
    if (state.winnerBanner && !winnerOverlay.hidden) {
      const spawnCount = Math.floor(8 * dt * 60);
      for (let i = 0; i < spawnCount; i++) {
        const side = Math.random() < 0.5 ? 0 : 1;
        const originX = side === 0 
          ? randomBetween(0, celebrationWidth * 0.35) 
          : randomBetween(celebrationWidth * 0.65, celebrationWidth);
        state.particles.push({
          shape: Math.random() < 0.7 ? "confetti" : "star",
          x: originX,
          y: randomBetween(-50, -20),
          vx: randomBetween(-200, 200),
          vy: randomBetween(80, 350),
          width: randomBetween(5, 14),
          height: randomBetween(8, 20),
          radius: randomBetween(6, 18),
          color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
          rotation: randomBetween(0, Math.PI * 2),
          spin: randomBetween(-7, 7),
          life: randomBetween(4, 8),
          maxLife: 8
        });
      }
    }
  }

  function updateFeedbacks(dt) {
    for (const feedback of state.feedbacks) {
      feedback.y += feedback.vy * dt;
      feedback.scale += feedback.grow * dt;
      feedback.life -= dt;
    }

    state.feedbacks = state.feedbacks.filter((feedback) => feedback.life > 0);
  }

  function createHitFeedback(x, y, correct) {
    state.feedbacks.push({
      text: correct ? "CORRECT!" : "INCORRECT!",
      x,
      y: y - 16,
      vy: correct ? -96 : -72,
      scale: correct ? 1.08 : 1,
      grow: correct ? 0.35 : 0.16,
      life: correct ? 1.08 : 1.18,
      maxLife: correct ? 1.08 : 1.18,
      fill: correct ? "#fff7bf" : "#ff4f86",
      stroke: correct ? "#9d6a00" : "#7d1738",
      shadow: correct ? "rgba(255, 207, 74, 0.95)" : "rgba(239, 91, 154, 0.82)"
    });
  }

  function createWinnerCelebration(text, scoreLine) {
    state.winnerBanner = {
      text,
      scoreLine,
      pulse: 0
    };
    resizeCelebrationCanvas();
    showWinnerOverlay(text, scoreLine);
    const celebrationWidth = state.celebrationWidth;
    const celebrationHeight = state.celebrationHeight;

    // Create initial burst
    for (let index = 0; index < CELEBRATION_CONFETTI_COUNT; index += 1) {
      const side = index % 2 === 0 ? 0 : 1;
      const originX = side === 0 ? randomBetween(0, celebrationWidth * 0.32) : randomBetween(celebrationWidth * 0.68, celebrationWidth);
      const originY = randomBetween(-celebrationHeight * 0.22, celebrationHeight * 0.42);
      state.particles.push({
        shape: "confetti",
        x: originX,
        y: originY,
        vx: randomBetween(-260, 260),
        vy: randomBetween(-70, 420),
        width: randomBetween(6, 16),
        height: randomBetween(10, 24),
        radius: randomBetween(4, 8),
        color: CELEBRATION_COLORS[index % CELEBRATION_COLORS.length],
        rotation: randomBetween(0, Math.PI * 2),
        spin: randomBetween(-9, 9),
        life: randomBetween(3.4, 6.6),
        maxLife: 6.6
      });
    }

    for (let index = 0; index < CELEBRATION_STAR_COUNT; index += 1) {
      state.particles.push({
        shape: "star",
        x: randomBetween(0, celebrationWidth),
        y: randomBetween(-celebrationHeight * 0.15, celebrationHeight * 0.7),
        vx: randomBetween(-170, 170),
        vy: randomBetween(-120, 280),
        radius: randomBetween(8, 22),
        color: CELEBRATION_COLORS[(index * 3) % CELEBRATION_COLORS.length],
        rotation: randomBetween(0, Math.PI * 2),
        spin: randomBetween(-5, 5),
        life: randomBetween(3.8, 7.2),
        maxLife: 7.2
      });
    }
  }

  function sliceItem(item) {
    const player = state.players[item.playerIndex];
    const challenge = currentChallenge(player);
    const correct = item.termId === challenge.target;

    item.sliced = true;
    createSplash(item.x, item.y, correct ? "good" : "miss");
    createHitFeedback(item.x, item.y, correct);
    playSliceSound(correct);

    if (correct) {
      const points = 10 + Math.min(player.streak * 2, 20);
      player.score += points;
      player.streak += 1;
      player.answerText = challenge.answer;
      player.answerTone = "done";
      player.challengeIndex += 1;
      player.nextSpawn = Math.min(player.nextSpawn, 0.18);
    } else {
      player.streak = 0;
      player.answerText = `Find ${termById[challenge.target].label}.`;
      player.answerTone = "warn";
    }

    updateHud(player.index);
  }

  function createSplash(x, y, mood) {
    const palette =
      mood === "good"
        ? ["#ffffff", "#5ee7ff", "#00a9a5", "#ffcf4a"]
        : ["#ffffff", "#ff6aa8", "#7b61d8", "#ffd0e8"];

    for (let index = 0; index < 26; index += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(90, 430);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(30, 160),
        radius: randomBetween(3, 10),
        color: palette[Math.floor(Math.random() * palette.length)],
        life: randomBetween(0.34, 0.82),
        maxLife: 0.82
      });
    }
  }

  function playSliceSound(correct) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = correct ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(correct ? 660 : 220, now);
      oscillator.frequency.exponentialRampToValueAtTime(correct ? 990 : 150, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.18);
    } catch (error) {
      audioContext = null;
    }
  }

  function drawGame() {
    ctx.clearRect(0, 0, state.width, state.height);
    drawBackground();
    drawItems();
    drawParticles();
    drawFeedbacks();
    drawTrails();

    if (state.matchOver && state.winnerBanner) {
      drawWinnerBanner();
    }

    if (state.paused) {
      drawCenterBanner("Paused");
    }
  }

  function drawBackground() {
    const playerIndexes = activePlayerIndexes();

    for (const playerIndex of playerIndexes) {
      const bounds = playerBounds(playerIndex);
      const player = state.players[playerIndex];
      const challenge = currentChallenge(player);
      const image = images.get(challenge.target) || images.get("water");

      ctx.save();
      ctx.beginPath();
      ctx.rect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
      ctx.clip();

      const gradient = ctx.createLinearGradient(bounds.left, 0, bounds.right, state.height);
      if (playerIndex === 0) {
        gradient.addColorStop(0, "#a6efff");
        gradient.addColorStop(0.52, "#e9fff4");
        gradient.addColorStop(1, "#9bd7ff");
      } else {
        gradient.addColorStop(0, "#d7f1ff");
        gradient.addColorStop(0.48, "#fff5bd");
        gradient.addColorStop(1, "#ffd4eb");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(bounds.left, 0, bounds.right - bounds.left, state.height);

      if (image && image.complete && image.naturalWidth) {
        ctx.globalAlpha = 0.3;
        drawCoverImage(image, bounds.left, 0, bounds.right - bounds.left, state.height);
        ctx.globalAlpha = 1;
      }

      drawRippleField(bounds, playerIndex);
      ctx.restore();
    }
  }

  function drawRippleField(bounds, playerIndex) {
    const baseY = state.height * 0.78;
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = 3;
    ctx.strokeStyle = playerIndex === 0 ? "rgba(0, 122, 210, 0.38)" : "rgba(111, 87, 211, 0.34)";

    for (let row = 0; row < 6; row += 1) {
      const y = baseY + row * 30;
      ctx.beginPath();
      for (let x = bounds.left - 40; x <= bounds.right + 40; x += 24) {
        const wave = Math.sin((x + performance.now() * 0.05 + row * 35) * 0.024) * 9;
        if (x === bounds.left - 40) {
          ctx.moveTo(x, y + wave);
        } else {
          ctx.lineTo(x, y + wave);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawItems() {
    for (const item of state.items) {
      const image = images.get(item.termId) || images.get("water");
      drawSliceTarget(item, image);
    }
  }

  function drawSliceTarget(item, image) {
    const radius = item.radius;
    const labelHeight = clamp(radius * 0.42, 24, 36);
    const fontSize = clamp(radius * 0.24, 18, 25);

    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
    ctx.shadowColor = "rgba(21, 49, 74, 0.25)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    ctx.clip();
    if (image && image.complete && image.naturalWidth) {
      drawCoverImage(image, -radius, -radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = "#8be7ff";
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    }
    ctx.restore();

    ctx.lineWidth = item.wrongFlash > 0 ? 8 : 5;
    ctx.strokeStyle = item.wrongFlash > 0 ? "#ef5b9a" : "rgba(255, 255, 255, 0.96)";
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(-item.rotation);
    ctx.font = `900 ${fontSize}px ${CANVAS_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textWidth = ctx.measureText(item.label).width;
    const labelWidth = clamp(textWidth + 26, radius * 1.28, radius * 2.04);
    const labelY = radius * 0.5;

    roundedRect(ctx, -labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight, 7);
    ctx.fillStyle = "rgba(255, 255, 255, 0.93)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(21, 49, 74, 0.12)";
    ctx.stroke();
    ctx.fillStyle = "#15314a";
    ctx.fillText(item.label, 0, labelY + 1, labelWidth - 18);

    ctx.restore();
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);

      if (particle.shape === "confetti") {
        if (!state.winnerBanner) {
          drawConfettiParticle(particle, alpha, ctx);
        }
      } else if (particle.shape === "star") {
        if (!state.winnerBanner) {
          drawStarParticle(particle, alpha, ctx);
        }
      } else {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawCelebrationEffects() {
    celebrationCtx.clearRect(0, 0, state.celebrationWidth, state.celebrationHeight);

    if (!state.winnerBanner || winnerOverlay.hidden) {
      return;
    }

    for (const particle of state.particles) {
      if (particle.shape !== "confetti" && particle.shape !== "star") {
        continue;
      }

      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      if (particle.shape === "confetti") {
        drawConfettiParticle(particle, alpha, celebrationCtx);
      } else {
        drawStarParticle(particle, alpha, celebrationCtx);
      }
    }
  }

  function drawConfettiParticle(particle, alpha, context) {
    context.save();
    context.globalAlpha = alpha;
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation || 0);
    context.fillStyle = particle.color;
    roundedRect(context, -particle.width / 2, -particle.height / 2, particle.width, particle.height, 2);
    context.fill();
    context.restore();
  }

  function drawStarParticle(particle, alpha, context) {
    context.save();
    context.globalAlpha = alpha;
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation || 0);
    drawStarPath(context, 0, 0, particle.radius, particle.radius * 0.46, 5);
    context.fillStyle = particle.color;
    context.shadowColor = "rgba(255, 255, 255, 0.85)";
    context.shadowBlur = 8;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    context.stroke();
    context.restore();
  }

  function drawFeedbacks() {
    for (const feedback of state.feedbacks) {
      const alpha = clamp(feedback.life / feedback.maxLife, 0, 1);
      const fontSize = feedback.text === "CORRECT!" ? 46 : 38;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(feedback.x, feedback.y);
      ctx.scale(feedback.scale, feedback.scale);
      ctx.font = `900 ${fontSize}px ${CANVAS_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = feedback.shadow;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 9;
      ctx.strokeStyle = feedback.stroke;
      ctx.strokeText(feedback.text, 0, 0);
      ctx.fillStyle = feedback.fill;
      ctx.fillText(feedback.text, 0, 0);
      ctx.restore();
    }
  }

  function drawTrails() {
    const now = performance.now();

    for (const [pointerId, trail] of state.trails) {
      trail.points = trail.points.filter((point) => now - point.time <= SLICE_TRAIL_MS);

      if (trail.points.length < 2) {
        if (!trail.active) {
          state.trails.delete(pointerId);
        }
        continue;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = trail.side === 0 ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 244, 128, 0.88)";
      ctx.shadowColor = trail.side === 0 ? "rgba(0, 169, 165, 0.88)" : "rgba(239, 91, 154, 0.78)";
      ctx.shadowBlur = 18;
      ctx.lineWidth = 11;
      ctx.beginPath();
      trail.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCenterBanner(text) {
    const width = Math.min(360, state.width * 0.42);
    const height = 88;
    const x = state.width / 2 - width / 2;
    const y = state.height / 2 - height / 2;

    ctx.save();
    roundedRect(ctx, x, y, width, height, 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(21, 49, 74, 0.16)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#15314a";
    ctx.font = `900 34px ${CANVAS_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, state.width / 2, state.height / 2 + 1);
    ctx.restore();
  }

  function drawWinnerBanner() {
    const banner = state.winnerBanner;
    const width = Math.min(720, state.width * 0.58);
    const height = 210;
    const x = state.width / 2 - width / 2;
    const y = state.height * 0.42 - height / 2;
    const pulse = Math.sin(performance.now() * 0.008) * 0.04 + 1;

    ctx.save();
    ctx.translate(state.width / 2, y + height / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-state.width / 2, -(y + height / 2));

    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.78)");
    gradient.addColorStop(0.18, "rgba(255, 246, 183, 0.94)");
    gradient.addColorStop(0.5, "rgba(255, 207, 74, 0.96)");
    gradient.addColorStop(1, "rgba(198, 126, 0, 0.92)");

    roundedRect(ctx, x, y, width, height, 28);
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(157, 106, 0, 0.48)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#fff1a8";
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#9d6a00";
    ctx.stroke();

    ctx.font = `900 ${clamp(width * 0.082, 42, 72)}px ${CANVAS_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#8b5900";
    ctx.fillStyle = "#fff7bf";
    ctx.shadowColor = "rgba(255, 255, 255, 0.82)";
    ctx.shadowBlur = 12;
    ctx.strokeText(banner.text, state.width / 2, y + height * 0.44);
    ctx.fillText(banner.text, state.width / 2, y + height * 0.44);

    ctx.font = `900 ${clamp(width * 0.034, 20, 30)}px ${CANVAS_FONT}`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#8b5900";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText(banner.scoreLine, state.width / 2, y + height * 0.58);
    ctx.fillText(banner.scoreLine, state.width / 2, y + height * 0.58);

    // Draw RESET button inside banner (below score)
    const btnWidth = clamp(width * 0.35, 140, 240);
    const btnHeight = 44;
    const btnX = state.width / 2 - btnWidth / 2;
    const btnY = y + height * 0.76;
    state.resetButtonBounds = { x: btnX, y: btnY, width: btnWidth, height: btnHeight };

    // Button background - bright white
    roundedRect(ctx, btnX, btnY, btnWidth, btnHeight, 14);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Button border - thick gold
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#d69a12";
    ctx.stroke();

    // Button hover effect (slight gradient)
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
    btnGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    btnGrad.addColorStop(1, "rgba(255, 241, 168, 0.4)");
    ctx.fillStyle = btnGrad;
    ctx.fill();

    // Button text
    ctx.font = `900 ${clamp(width * 0.036, 20, 28)}px ${CANVAS_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#8b5900";
    ctx.fillStyle = "#6d4300";
    ctx.strokeText("RESET GAME", state.width / 2, btnY + btnHeight / 2 + 1);
    ctx.fillText("RESET GAME", state.width / 2, btnY + btnHeight / 2 + 1);

    ctx.restore();
  }

  function drawCoverImage(image, x, y, width, height) {
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let drawX = x;
    let drawY = y;

    if (imageRatio > boxRatio) {
      drawWidth = height * imageRatio;
      drawX = x - (drawWidth - width) / 2;
    } else {
      drawHeight = width / imageRatio;
      drawY = y - (drawHeight - height) / 2;
    }

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawStarPath(context, x, y, outerRadius, innerRadius, points) {
    const step = Math.PI / points;
    context.beginPath();
    for (let index = 0; index < points * 2; index += 1) {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + index * step;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (index === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.closePath();
  }

  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  let resetButtonPressed = false;

  function handlePointerDown(event) {
    event.preventDefault();
    const point = pointerPoint(event);

    // Check if clicking the reset button on winner banner
    if (state.matchOver && state.resetButtonBounds) {
      const b = state.resetButtonBounds;
      if (point.x >= b.x && point.x <= b.x + b.width && point.y >= b.y && point.y <= b.y + b.height) {
        resetButtonPressed = true;
        return;
      }
    }

    const side = isOnePlayerMode() ? 0 : point.x < state.width / 2 ? 0 : 1;
    const now = performance.now();

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (error) {
      // Some smart-board browsers do not expose pointer capture for all inputs.
    }

    state.trails.set(event.pointerId, {
      active: true,
      side,
      points: [{ x: point.x, y: point.y, time: now }]
    });

    checkSlice(point.x, point.y, point.x + 0.1, point.y + 0.1, side);
  }

  function handlePointerMove(event) {
    const trail = state.trails.get(event.pointerId);
    if (!trail) {
      return;
    }

    event.preventDefault();
    const point = pointerPoint(event);
    const last = trail.points[trail.points.length - 1];
    const now = performance.now();
    trail.points.push({ x: point.x, y: point.y, time: now });
    trimTrail(trail, now);
    checkSlice(last.x, last.y, point.x, point.y, trail.side);
  }

  function handlePointerEnd(event) {
    // Check if this was a reset button click
    if (resetButtonPressed && state.matchOver && state.resetButtonBounds) {
      const point = pointerPoint(event);
      const b = state.resetButtonBounds;
      if (point.x >= b.x && point.x <= b.x + b.width && point.y >= b.y && point.y <= b.y + b.height) {
        resetGame();
      }
      resetButtonPressed = false;
      return;
    }

    const trail = state.trails.get(event.pointerId);
    if (!trail) {
      return;
    }

    trail.active = false;
    trimTrail(trail, performance.now());

    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture may not have been set.
    }
  }

  function trimTrail(trail, now) {
    trail.points = trail.points.filter((point) => now - point.time <= SLICE_TRAIL_MS);
  }

  function checkSlice(x1, y1, x2, y2, side) {
    const player = state.players[side];
    if (!state.running || state.paused || !player || player.timeLeft <= 0 || (isOnePlayerMode() && side !== 0)) {
      return;
    }

    for (let index = state.items.length - 1; index >= 0; index -= 1) {
      const item = state.items[index];
      if (item.sliced || item.playerIndex !== side) {
        continue;
      }

      const distance = distanceFromSegment(item.x, item.y, x1, y1, x2, y2);
      if (distance <= item.radius * 0.9) {
        sliceItem(item);
      }
    }
  }

  function distanceFromSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return Math.hypot(px - x1, py - y1);
    }

    const t = clamp(((px - x1) * dx + (py - y1) * dy) / lengthSquared, 0, 1);
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return Math.hypot(px - closestX, py - closestY);
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function loop(now) {
    const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
    state.lastFrame = now;
    updateGame(dt);
    drawGame();
    drawCelebrationEffects();
    requestAnimationFrame(loop);
  }

  accessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const enteredCode = accessCode.value.trim().toUpperCase();

    if (enteredCode === ACCESS_CODE) {
      unlockAccessCover();
    } else {
      showAccessError();
    }
  });

  window.setTimeout(() => {
    accessCode.focus();
  }, 0);

  startButton.disabled = true;
  startButton.setAttribute("aria-disabled", "true");

  function endGame() {
    if (!state.running && !state.matchOver) {
      return;
    }
    
    state.running = false;
    state.paused = false;
    state.matchOver = true;
    state.items = [];
    state.trails.clear();

    if (isOnePlayerMode()) {
      const player = state.players[0];
      player.timeLeft = 0;
      player.answerText = `Final score: ${player.score}. Game ended.`;
      player.answerTone = "done";

      setStartLabel("Restart", "\\u25b6");
      setPauseLabel("Pause", "\\u275a\\u275a");
      createWinnerCelebration("GAME ENDED", `Score ${player.score}`);
      updateAllHud();
      return;
    }

    const scores = state.players.map((player) => player.score);
    
    state.players.forEach((player) => {
      player.timeLeft = 0;
      player.answerText = `Final score: ${player.score}. Game ended.`;
      player.answerTone = "done";
    });

    setStartLabel("Restart", "\\u25b6");
    setPauseLabel("Pause", "\\u275a\\u275a");
    createWinnerCelebration("GAME ENDED", `P1 ${scores[0]} - P2 ${scores[1]}`);
    updateAllHud();
  }

  function isStandaloneDisplay() {
    return (
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches
    );
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function syncFullscreenButton() {
    const fullscreenActive = Boolean(fullscreenElement()) || isStandaloneDisplay();
    fullscreenButton.setAttribute("aria-pressed", String(fullscreenActive));
    fullscreenButton.title = fullscreenActive ? "Full screen active" : "Full screen";
  }

  async function enterFullscreen() {
    state.fullscreenWanted = true;
    syncFullscreenButton();

    if (isStandaloneDisplay() || fullscreenElement()) {
      return;
    }

    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen({ navigationUI: "hide" });
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      }
    } catch (error) {
      // Some iPad Safari versions only allow fullscreen from a fresh user gesture.
    }

    syncFullscreenButton();
  }

  async function exitFullscreen() {
    state.fullscreenWanted = false;

    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
        await document.webkitExitFullscreen();
      }
    } catch (error) {
      // Ignore platform-specific fullscreen failures.
    }

    syncFullscreenButton();
  }

  function toggleFullscreen() {
    if (fullscreenElement() && !isStandaloneDisplay()) {
      exitFullscreen();
      return;
    }

    enterFullscreen();
  }

  function handleFullscreenChange() {
    syncFullscreenButton();

    if (!state.fullscreenWanted || fullscreenElement() || isStandaloneDisplay()) {
      return;
    }

    window.setTimeout(() => {
      if (state.fullscreenWanted && !fullscreenElement() && !isStandaloneDisplay()) {
        enterFullscreen();
      }
    }, 350);
  }

  function updateViewportHeight() {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${Math.max(1, height)}px`);
    resizeCanvas();
  }

  function suppressIOSBottomGesture(event) {
    const touch = event.touches && event.touches[0] ? event.touches[0] : event.changedTouches && event.changedTouches[0];
    const y = touch ? touch.clientY : event.clientY || 0;
    const bottomGuard = Math.max(72, Math.min(136, window.innerHeight * 0.13));

    if (event.cancelable && (event.type === "touchmove" || y > window.innerHeight - bottomGuard)) {
      event.preventDefault();
    }

    if (state.fullscreenWanted && !fullscreenElement() && !isStandaloneDisplay()) {
      enterFullscreen();
    }
  }

  function preventDefaultWhenCancelable(event) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return;
    }

    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", togglePause);
  resetButton.addEventListener("click", resetGame);
  modeToggleButton.addEventListener("click", togglePlayerMode);
  endGameButton.addEventListener("click", endGame);
  fullscreenButton.addEventListener("click", toggleFullscreen);

  if (winnerResetButton) {
    winnerResetButton.addEventListener("click", resetGame);
  }

  canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
  canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
  canvas.addEventListener("pointerup", handlePointerEnd, { passive: false });
  canvas.addEventListener("pointercancel", handlePointerEnd, { passive: false });

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("touchstart", suppressIOSBottomGesture, { passive: false, capture: true });
  document.addEventListener("touchmove", suppressIOSBottomGesture, { passive: false, capture: true });
  document.addEventListener("gesturestart", preventDefaultWhenCancelable, { passive: false });
  document.addEventListener("contextmenu", preventDefaultWhenCancelable);

  window.addEventListener("resize", updateViewportHeight);
  window.addEventListener("orientationchange", () => window.setTimeout(updateViewportHeight, 250));
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateViewportHeight);
  }

  registerServiceWorker();
  updateViewportHeight();
  resetGame();
  loadImages().then(() => {
    state.ready = true;
    startButton.disabled = false;
    startButton.removeAttribute("aria-disabled");
    updateAllHud();
  });
  requestAnimationFrame(loop);
})();
