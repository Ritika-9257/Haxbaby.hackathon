(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let intro = $('#introScreen');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const introAssets = ['assets/pip-main.webp', 'assets/pip-portrait.webp', 'assets/pip-lantern.webp', 'assets/pip-musicbox.webp'];
  const minimumIntroTime = prefersReducedMotion ? 500 : 3200;
  let introFinished = false;
  let introTimer = null;
  let introProgressFrame = 0;
  let introStartedAt = 0;
  let introProgress = 0;
  let introAssetsLoaded = 0;
  let introAssetsReady = false;

  function setIntroProgress(value) {
    introProgress = Math.max(introProgress, Math.min(100, Math.round(value)));
    const fill = $('#introProgressFill', intro);
    const bar = $('#introProgressBar', intro);
    const number = $('#introProgressNumber', intro);
    if (fill) fill.style.width = `${introProgress}%`;
    if (bar) bar.setAttribute('aria-valuenow', String(introProgress));
    if (number) number.textContent = `${introProgress}%`;
    const message = $('#introLoadingMessage', intro);
    if (message) {
      if (introProgress >= 100) message.textContent = 'Pip is ready to dream!';
      else if (introProgress < 30) message.textContent = 'Waking up the little stars…';
      else if (introProgress < 60) message.textContent = 'Following the dream trail…';
      else message.textContent = 'Tucking in the clouds…';
    }
  }

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    clearTimeout(introTimer);
    cancelAnimationFrame(introProgressFrame);
    const leavingIntro = intro;
    if (leavingIntro) leavingIntro.classList.add('is-leaving');
    window.setTimeout(() => {
      if (leavingIntro) leavingIntro.remove();
      if (intro === leavingIntro) intro = null;
      document.body.classList.remove('intro-active');
      if (typeof startCanvas === 'function') startCanvas();
    }, 760);
  }

  function preloadIntroAssets() {
    introAssetsLoaded = 0;
    return Promise.all(introAssets.map(src => new Promise(resolve => {
      const image = new Image();
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        introAssetsLoaded += 1;
        resolve(); // A failed optional illustration must never trap the visitor on the loader.
      };
      image.onload = done;
      image.onerror = done;
      image.decoding = 'async';
      image.src = src;
      if (image.complete) done();
    }))).then(() => { introAssetsReady = true; });
  }

  function updateIntroProgress(now) {
    if (!intro || !intro.isConnected || introFinished) return;
    const elapsed = now - introStartedAt;
    // The visible percentage is a gentle intro timeline; real core-image readiness
    // gates the final 100%, so it cannot remain stuck at the old baked-in 75%.
    const timelineProgress = 6 + Math.min(1, elapsed / minimumIntroTime) * 83;
    setIntroProgress(Math.min(92, timelineProgress));

    if (introAssetsReady && elapsed >= minimumIntroTime) {
      setIntroProgress(100);
      cancelAnimationFrame(introProgressFrame);
      clearTimeout(introTimer);
      introTimer = window.setTimeout(finishIntro, 520);
      return;
    }
    introProgressFrame = requestAnimationFrame(updateIntroProgress);
  }

  function startIntro() {
    if (!intro) return;
    if (prefersReducedMotion) {
      intro.remove();
      intro = null;
      return;
    }
    introFinished = false;
    introProgress = 0;
    introAssetsReady = false;
    introStartedAt = performance.now();
    intro.classList.remove('is-leaving');
    document.body.classList.add('intro-active');
    setIntroProgress(3);

    const skipButton = $('#skipIntro', intro);
    if (skipButton) skipButton.onclick = finishIntro;
    preloadIntroAssets();
    // Fail-safe for a broken or offline asset: never leave the intro running forever.
    introTimer = window.setTimeout(() => { introAssetsReady = true; }, 9500);
    introProgressFrame = requestAnimationFrame(updateIntroProgress);
  }

  startIntro();

  // Subtle procedural fluid-like canvas: flowing contour ribbons, swirling particles,
  // and touch/mouse disturbances. Adaptive particle count keeps it suitable for phones.
  const canvas = $('#fluidCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0, height = 0, dpr = 1, tick = 0, raf = 0;
  let lastFrame = 0;
  const pointer = { x: -1000, y: -1000, activeUntil: 0 };
  const swirls = [];
  const bursts = [];
  let particles = [];
  let isTwilight = false;
  let reduced = prefersReducedMotion;

  const random = (min, max) => min + Math.random() * (max - min);
  function makeParticle() {
    return { x: random(0, width), y: random(0, height), vx: random(-.2, .2), vy: random(-.2, .2), r: random(.7, 1.9), phase: random(0, Math.PI * 2), hue: Math.random() };
  }
  function resizeCanvas() {
    const oldWidth = width || window.innerWidth;
    const oldHeight = height || window.innerHeight;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, width < 680 ? 1.25 : 1.55);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    swirls.length = 0;
    const scale = Math.min(width, height);
    swirls.push({ x: width * .18, y: height * .38, rx: scale * .17, ry: scale * .115, phase: .5, speed: .18, strength: 125 });
    swirls.push({ x: width * .78, y: height * .32, rx: scale * .22, ry: scale * .13, phase: 2.4, speed: -.14, strength: 145 });
    swirls.push({ x: width * .54, y: height * .78, rx: scale * .23, ry: scale * .16, phase: 4.2, speed: .11, strength: 115 });
    const count = width < 520 ? 95 : width < 900 ? 145 : 220;
    particles = Array.from({ length: count }, makeParticle);
    drawFrame(performance.now(), true);
    if (!reduced && (!intro || !intro.isConnected || intro.classList.contains('is-leaving'))) startCanvas();
  }
  function palette() {
    return isTwilight
      ? ['rgba(180,145,223,', 'rgba(226,153,190,', 'rgba(159,209,204,', 'rgba(249,213,150,']
      : ['rgba(231,169,196,', 'rgba(192,171,235,', 'rgba(155,211,187,', 'rgba(244,206,132,']
  }
  function rgba(base, alpha) { return `${base}${Math.max(0, Math.min(1, alpha))})`; }
  function currentSwirl(s, index, time) {
    const driftX = Math.sin(time * s.speed + s.phase) * width * .018;
    const driftY = Math.cos(time * s.speed * .86 + s.phase) * height * .022;
    return { x: s.x + driftX, y: s.y + driftY, rx: s.rx, ry: s.ry, phase: s.phase, strength: s.strength };
  }
  function drawContour(swirl, ring, time, color) {
    const rx = swirl.rx * (0.32 + ring * .105);
    const ry = swirl.ry * (0.25 + ring * .115);
    ctx.beginPath();
    const steps = Math.max(90, Math.min(180, Math.round(width / 6)));
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wobble = 1 + .105 * Math.sin(a * 3 + time * .28 + swirl.phase + ring * .4) + .045 * Math.cos(a * 5 - time * .22 + ring);
      const swirlBend = .065 * Math.sin(a * 2 + time * .18 + ring * .65);
      const x = swirl.x + Math.cos(a) * rx * wobble + Math.sin(a * 2 + time * .2) * rx * swirlBend;
      const y = swirl.y + Math.sin(a) * ry * wobble;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(color, .12 + (ring % 3) * .018);
    ctx.lineWidth = ring % 3 === 0 ? 2.4 : 1.35;
    ctx.shadowColor = rgba(color, .55);
    ctx.shadowBlur = ring % 3 === 0 ? 12 : 7;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  function drawFlowLines(time, colors) {
    // Fine streamlines drift across the page and fold around three slow-moving vortices.
    const rows = width < 520 ? 5 : 7;
    for (let row = 0; row < rows; row++) {
      ctx.beginPath();
      const baseline = height * (.16 + row * .12);
      const step = width < 520 ? 12 : 16;
      for (let x = -16, n = 0; x <= width + 20; x += step, n++) {
        let y = baseline;
        y += Math.sin(x * .0045 + time * (.27 + row * .007) + row * 1.4) * height * .038;
        y += Math.sin(x * .009 + time * -.16 + row) * height * .012;
        swirls.forEach((s, idx) => {
          const cx = s.x + Math.sin(time * s.speed + s.phase) * width * .018;
          const cy = s.y + Math.cos(time * s.speed + s.phase) * height * .02;
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const reach = Math.max(width, height) * .2;
          const influence = Math.max(0, 1 - dist / reach);
          y += Math.sin(Math.atan2(dy, dx) * 1.65 + time * .23 + idx) * height * .025 * influence;
        });
        if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      const color = colors[(row + 1) % colors.length];
      ctx.strokeStyle = rgba(color, .11);
      ctx.lineWidth = 1.1;
      ctx.shadowColor = rgba(color, .35);
      ctx.shadowBlur = 9;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  function drawParticles(dt, time, colors) {
    for (const p of particles) {
      let fx = Math.sin(p.y * .003 + time * .35 + p.phase) * .065;
      let fy = Math.cos(p.x * .0032 - time * .28 + p.phase) * .06;
      for (const s of swirls) {
        const sx = s.x + Math.sin(time * s.speed + s.phase) * width * .018;
        const sy = s.y + Math.cos(time * s.speed + s.phase) * height * .02;
        const dx = p.x - sx;
        const dy = p.y - sy;
        const r2 = dx * dx + dy * dy + 500;
        const force = s.strength / r2;
        fx += -dy * force * .22;
        fy += dx * force * .22;
      }
      if (time < pointer.activeUntil) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const r2 = dx * dx + dy * dy + 170;
        const force = Math.min(3.2, 900 / r2);
        fx += -dy * force * .026;
        fy += dx * force * .026;
      }
      p.vx = (p.vx + fx * dt) * .987;
      p.vy = (p.vy + fy * dt) * .987;
      p.vx = Math.max(-1.45, Math.min(1.45, p.vx));
      p.vy = Math.max(-1.45, Math.min(1.45, p.vy));
      p.x += p.vx * dt * 58;
      p.y += p.vy * dt * 58;
      if (p.x < -12) p.x = width + 12; if (p.x > width + 12) p.x = -12;
      if (p.y < -12) p.y = height + 12; if (p.y > height + 12) p.y = -12;
      const shimmer = .24 + .48 * (.5 + .5 * Math.sin(time * 1.2 + p.phase));
      const c = colors[Math.min(colors.length - 1, Math.floor(p.hue * colors.length))];
      ctx.beginPath();
      ctx.fillStyle = rgba(c, shimmer);
      ctx.shadowColor = rgba(c, .5);
      ctx.shadowBlur = p.r * 5;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (p.r > 1.35 && shimmer > .58) {
        ctx.strokeStyle = `rgba(255,255,255,${shimmer * .65})`;
        ctx.lineWidth = .65;
        ctx.beginPath(); ctx.moveTo(p.x - 3, p.y); ctx.lineTo(p.x + 3, p.y); ctx.moveTo(p.x, p.y - 3); ctx.lineTo(p.x, p.y + 3); ctx.stroke();
      }
    }
  }
  function drawBursts(time) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life -= .015;
      ctx.beginPath(); ctx.arc(b.x, b.y, (1 - b.life) * 60 + 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,226,160,${Math.max(0,b.life) * .65})`; ctx.lineWidth = 2; ctx.stroke();
      if (b.life <= 0) bursts.splice(i, 1);
    }
  }
  function drawFrame(now, still = false) {
    if (!ctx || !width || !height) return;
    // A ~34 fps ceiling gives the flowing contours room to breathe on lower-powered phones.
    if (!still && lastFrame && now - lastFrame < 28) { raf = requestAnimationFrame(drawFrame); return; }
    const dt = lastFrame ? Math.min(.06, (now - lastFrame) / 1000) : .016;
    lastFrame = now;
    if (!still) tick += dt;
    ctx.clearRect(0, 0, width, height);
    const colors = palette();
    const time = tick;
    drawFlowLines(time, colors);
    swirls.forEach((s, i) => {
      const swirl = currentSwirl(s, i, time);
      for (let ring = 1; ring <= (width < 520 ? 6 : 8); ring++) drawContour(swirl, ring, time, colors[(ring + i) % colors.length]);
    });
    drawParticles(dt, time, colors);
    drawBursts(time);
    if (!still && !reduced) raf = requestAnimationFrame(drawFrame);
  }
  function startCanvas() {
    if (reduced || document.hidden) return;
    cancelAnimationFrame(raf);
    lastFrame = 0;
    raf = requestAnimationFrame(drawFrame);
  }
  function pointerMove(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.activeUntil = tick + 1.7;
  }
  window.addEventListener('pointermove', pointerMove, { passive: true });
  window.addEventListener('pointerdown', event => {
    pointer.x = event.clientX; pointer.y = event.clientY; pointer.activeUntil = tick + 2.4;
    bursts.push({ x: pointer.x, y: pointer.y, life: 1 });
    if (bursts.length > 5) bursts.shift();
  }, { passive: true });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduced) startCanvas();
  });

  // Low-volume Web Audio chimes; no sound is played without a user gesture.
  let audioCtx = null;
  let soundOn = false;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }
  function playTone(frequency = 660, duration = .18, volume = .035, when = 0) {
    const audio = getAudioContext();
    if (!audio) return;
    const start = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    osc.type = 'sine'; osc.frequency.setValueAtTime(frequency, start);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(2300, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001, volume), start + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(audio.destination);
    osc.start(start); osc.stop(start + duration + .03);
    return osc;
  }
  function uiChime() { if (soundOn) playTone(740, .12, .018); }
  const soundToggle = $('#soundToggle');
  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    document.body.classList.toggle('sound-on', soundOn);
    soundToggle.setAttribute('aria-pressed', String(soundOn));
    soundToggle.setAttribute('aria-label', soundOn ? 'Turn interface sounds off' : 'Turn interface sounds on');
    $('#soundLabel').textContent = soundOn ? 'Sound on' : 'Sound off';
    if (soundOn) { getAudioContext(); playTone(523.25, .22, .028); playTone(659.25, .24, .025, .1); }
    showToast(soundOn ? 'Tiny chimes are on ♫' : 'All quiet and cozy.');
    // Keep the Lullaby Lab in sync with the global sound setting.
if (!soundOn) {
  stopLullaby();

  const status = $('#lullabyStatus');

  if (status) {
    status.textContent =
      'Sound is off. Turn sound on, then press play.';
  }
} else {
  const status = $('#lullabyStatus');
  const notes = $('#lullabyNotes');

  if (status && !notes?.classList.contains('playing')) {
    status.textContent =
      'Sound is on. Press Play for Pip’s lullaby.';
  }
}
  });

  const themeToggle = $('#themeToggle');
  themeToggle.addEventListener('click', () => {
    isTwilight = !isTwilight;
    document.body.dataset.theme = isTwilight ? 'twilight' : 'day';
    themeToggle.setAttribute('aria-pressed', String(isTwilight));
    themeToggle.setAttribute('aria-label', isTwilight ? 'Switch to daydream mode' : 'Switch to twilight mode');
    themeToggle.title = isTwilight ? 'Switch to daydream mode' : 'Switch to twilight mode';
    $('#themeIcon').textContent = isTwilight ? '☀' : '☾';
    if (!reduced) startCanvas(); else drawFrame(performance.now(), true);
    showToast(isTwilight ? 'Twilight mode: soft and sleepy.' : 'Daydream mode is back.');
  });

  // Pip's hotspots and project links scroll to real page sections; they never open a modal.
  const panelScrollTargets = {
  about: 'about',
  work: 'projects',
  story: 'pip-origin-story',
  storybook: 'pip-origin-story',
  lullaby: 'lullaby-lab',
  lantern: 'nightlight-collection',
  toys: 'toybox',
  toybox: 'toybox',
  gallery: 'projects'
};
  document.addEventListener('click', event => {
    const panelButton = event.target.closest('[data-panel]');
    if (!panelButton) return;
    event.preventDefault();
    const key = panelButton.getAttribute('data-panel');
    const targetId = panelScrollTargets[key] || 'projects';
    if (['lullaby', 'lantern', 'toys', 'storybook', 'story'].includes(key)) {
      markTaskVisited(key === 'lantern' ? 'nightlights' : key === 'lullaby' ? 'lullaby' : key === 'toys' ? 'toys' : 'storybook');
    }
    const target = document.getElementById(targetId);
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 40);
  });

  // Lullaby: a deliberately soft, user-triggered melody generated locally with Web Audio.
  let lullabyTimeouts = [];
  let activeLullabyOscillators = [];
  const lullabyNotes = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 392, 523.25];
  function stopLullaby() {
  // Cancel any pending completion timers.
  lullabyTimeouts.forEach(clearTimeout);
  lullabyTimeouts = [];

  // Stop every active note immediately.
  activeLullabyOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (_) {
      // The oscillator may already have stopped.
    }
  });

  activeLullabyOscillators = [];

  // Reset the animation.
  $('#lullabyNotes')?.classList.remove('playing');

  // Disable Stop when playback is inactive.
  const stopButton = $('#stopLullaby');

  if (stopButton) {
    stopButton.disabled = true;
  }

  const status = $('#lullabyStatus');

  if (status) {
    status.textContent = 'The music box is resting.';
  }
}
// Initialize the whole-site background from the currently selected nightlight.
// Keep the preview and selected-button feature working as before.
const nightlightSectionInitial = $('#nightlight-collection');
if (nightlightSectionInitial) {
  const selectedGlowInitial = nightlightSectionInitial.querySelector(
    '.glow-choice[aria-pressed="true"]'
  );
  const allowedGlowThemes = ['gold', 'pink', 'mint'];
  const initialGlow = allowedGlowThemes.includes(selectedGlowInitial?.dataset.glow)
    ? selectedGlowInitial.dataset.glow
    : 'gold';

  document.body.dataset.nightlightGlow = initialGlow;

  const initialLanternPreview = $('#lanternPreview');
  if (initialLanternPreview) {
    initialLanternPreview.dataset.glow = initialGlow;
  }
}
  document.addEventListener('click', event => {
    if (event.target.closest('#playLullaby')) {
      stopLullaby();
      const status = $('#lullabyStatus');
      const notesViz = $('#lullabyNotes');
      if (!soundOn) { if (status) status.textContent = 'Turn sound on in the top corner, then press play.'; return; }
      getAudioContext();
      if (!audioCtx) { if (status) status.textContent = 'This browser does not support the tiny music box.'; return; }
      if (notesViz) notesViz.classList.add('playing');
      const stopButton = $('#stopLullaby');

if (stopButton) {
  stopButton.disabled = false;
}
      if (status) status.textContent = 'A little melody is floating by…';
      lullabyNotes.forEach((note, index) => {
        const melodyTone = playTone(note, .42, .045, index * .38);
        const overtone = playTone(note * 2, .22, .012, index * .38 + .035);
        if (melodyTone) activeLullabyOscillators.push(melodyTone);
        if (overtone) activeLullabyOscillators.push(overtone);
      });
      lullabyTimeouts.push(setTimeout(() => {
  activeLullabyOscillators = [];
  lullabyTimeouts = [];

  if (notesViz) {
    notesViz.classList.remove('playing');
  }

  const stopButton = $('#stopLullaby');

  if (stopButton) {
    stopButton.disabled = true;
  }

  if (status) {
    status.textContent =
      'All tucked in. Play again any time.';
  }
}, lullabyNotes.length * 380 + 600));
    }
    if (event.target.closest('#stopLullaby')) stopLullaby();
    // ==========================================
// NIGHTLIGHT — CHANGE THE WHOLE WEBSITE THEME
// ==========================================

const glow = event.target.closest('.glow-choice[data-glow]');

if (glow) {
  const selectedGlow = glow.dataset.glow;

  // Update the lantern preview.
  const preview = $('#lanternPreview');

  if (preview) {
    preview.dataset.glow = selectedGlow;
  }

  // Change the background of the ENTIRE website.
  document.body.dataset.nightlightGlow = selectedGlow;

  // Highlight the selected color button.
  $$('.glow-choice').forEach(button => {
    button.setAttribute(
      'aria-pressed',
      String(button === glow)
    );
  });
}
  });

  // The five-scene origin story is handled by origin-story.js.

  // Bubble toy: tapping a bubble pops it and creates a tiny burst; reset after all are popped.
  const bubbleButtons = $$('.bubble');
  const bubbleStatus = $('#bubbleStatus');
  function updateBubbleStatus() {
    const remaining = $$('.bubble:not(.popped)').length;
    bubbleStatus.textContent = remaining ? `${remaining} ${remaining === 1 ? 'bubble is' : 'bubbles are'} floating` : 'All popped! A tiny wish came true.';
    if (!remaining) {
      window.setTimeout(() => {
        bubbleButtons.forEach((bubble, i) => { bubble.classList.remove('popped'); bubble.style.left = ['', '15%', '37%', '24%'][i] || '15%'; });
        if (bubbleStatus.isConnected) bubbleStatus.textContent = 'New bubbles are floating';
      }, 1700);
    }
  }
  bubbleButtons.forEach(bubble => bubble.addEventListener('click', () => {
    if (bubble.classList.contains('popped')) return;
    const rect = bubble.getBoundingClientRect();
    bubble.classList.add('popped'); spawnSparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 7); updateBubbleStatus();
  }));

  // Rattle & Block Toys: tap blocks to stack them and shake the rattle.
  // ============================================
// RATTLE & BLOCK TOYS — PIP'S STACKING GAME
// ============================================

const blockCard = $('#rattleBlockPlay');
const blockButtons = $$('.play-block', blockCard);
const blockTower = $('#blockTower');
const towerPlaceholder = $('#towerPlaceholder');
const blockStatus = $('#blockStatus');
const resetBlockTower = $('#resetBlockTower');
const shakeRattle = $('#shakeRattle');

const MAX_TOWER_BLOCKS = 4;

let towerBlocks = [];
let rattleTimer = null;


// Add a block to Pip's tower.
function addBlockToTower(button) {
  if (towerBlocks.length >= MAX_TOWER_BLOCKS) {
    return;
  }

  const color = button.dataset.block;
  const symbol = button.dataset.symbol;

  // Create the visual block.
  const towerBlock = document.createElement('span');

  towerBlock.className = `tower-block tower-block-${color}`;
  towerBlock.textContent = symbol;
  towerBlock.setAttribute('aria-hidden', 'true');

  // Add it to the tower.
  blockTower.appendChild(towerBlock);

  towerBlocks.push({
    color,
    symbol
  });

  // Hide the empty-tower message.
  towerPlaceholder.hidden = true;

  // Update the accessible description.
  const count = towerBlocks.length;

  blockTower.setAttribute(
    'aria-label',
    `${count} of ${MAX_TOWER_BLOCKS} blocks stacked`
  );

  // Update the instructions.
  if (count < MAX_TOWER_BLOCKS) {
    blockStatus.textContent =
      `${count} of ${MAX_TOWER_BLOCKS} blocks stacked! ` +
      `${MAX_TOWER_BLOCKS - count} more to go.`;
  } else {
    blockStatus.textContent =
      'Dream tower complete! Four little blocks, one big dream. ' +
      'Shake the rattle to celebrate!';

    // Prevent adding more blocks until the game is reset.
    blockButtons.forEach(button => {
      button.disabled = true;
    });

    showToast('Pip’s dream tower is complete! ✨');
  }

  // Create sparkles around the selected block.
  const rect = button.getBoundingClientRect();

  spawnSparks(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    7
  );

  // Play a tiny interface chime if sound is enabled.
  uiChime();
}


// Handle all four block buttons.
blockButtons.forEach(button => {
  button.addEventListener('click', () => {
    addBlockToTower(button);
  });
});


// Reset the tower and start again.
function resetTowerGame() {
  towerBlocks = [];

  blockTower.replaceChildren(towerPlaceholder);

  towerPlaceholder.hidden = false;

  blockTower.setAttribute(
    'aria-label',
    'Empty tower'
  );

  blockButtons.forEach(button => {
    button.disabled = false;
  });

  blockStatus.textContent =
    'Choose four colorful blocks to build your tower.';

  showToast('A fresh little tower awaits!');

  uiChime();
}

resetBlockTower.addEventListener('click', resetTowerGame);


// Shake Pip's rattle.
shakeRattle.addEventListener('click', () => {
  // Restart the animation if clicked repeatedly.
  clearTimeout(rattleTimer);

  shakeRattle.classList.remove('is-shaking');

  void shakeRattle.offsetWidth;

  shakeRattle.classList.add('is-shaking');

  shakeRattle.setAttribute('aria-pressed', 'true');

  if (soundOn) {
    playTone(880, 0.1, 0.022);
    playTone(1174.66, 0.13, 0.02, 0.08);
  }

  const count = towerBlocks.length;

  if (count === MAX_TOWER_BLOCKS) {
    blockStatus.textContent =
      'Rattle-rattle! Pip celebrates your perfect dream tower!';
  } else {
    blockStatus.textContent =
      `Rattle-rattle! Your tower has ${count} of ` +
      `${MAX_TOWER_BLOCKS} blocks. Keep building!`;
  }

  const rect = shakeRattle.getBoundingClientRect();

  spawnSparks(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    9
  );

  rattleTimer = window.setTimeout(() => {
    shakeRattle.classList.remove('is-shaking');
    shakeRattle.setAttribute('aria-pressed', 'false');
  }, 650);
});

  // Local wish notes stay in this browser only; no server or account is involved.
  const wishForm = $('#wishForm');
  const wishInput = $('#wishInput');
  const wishStatus = $('#wishStatus');
  function loadWish() {
    try {
      const wish = localStorage.getItem('pipsLittleWish');
      if (wish) { wishInput.value = wish; wishStatus.textContent = 'Your last wish is tucked safely in this browser. ♥'; }
    } catch (_) { /* Storage may be disabled. */ }
  }
  wishForm.addEventListener('submit', event => {
    event.preventDefault();
    const wish = wishInput.value.trim();
    if (!wish) return;
    try { localStorage.setItem('pipsLittleWish', wish); wishStatus.textContent = 'Wish tucked in. Pip will keep it safe on this device. ♥'; }
    catch (_) { wishStatus.textContent = 'Wish received for this visit. (Browser storage is unavailable.)'; }
    showToast('A tiny wish has been tucked away ♥'); spawnSparks(wishForm.getBoundingClientRect().left + 80, wishForm.getBoundingClientRect().top, 9);
  });
  loadWish();

  // The single hidden Easter egg is the patterned egg chase game below. The footer
  // heart is decorative and does not trigger a second secret.

  // Navbar toggles on compact screens; active links follow visible sections.
  const menuToggle = $('#menuToggle');
  const primaryNav = $('#primaryNav');
  menuToggle.addEventListener('click', () => {
    const open = primaryNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menuToggle.textContent = open ? '×' : '☰';
  });
  $$('.primary-nav a').forEach(link => link.addEventListener('click', () => {
    primaryNav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation'); menuToggle.textContent = '☰';
  }));
  const sections = ['home', 'about', 'projects', 'story', 'toybox'].map(id => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, .1, .25, .5] });
    sections.forEach(section => sectionObserver.observe(section));
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  function spawnSparks(x, y, amount = 12) {
    const layer = $('#sparkleLayer');
    const glyphs = ['✦', '✧', '·', '♡', '✺'];
    for (let i = 0; i < amount; i++) {
      const particle = document.createElement('span');
      particle.className = 'burst-spark';
      particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      particle.style.left = `${x}px`; particle.style.top = `${y}px`;
      particle.style.setProperty('--dx', `${random(-85, 85)}px`); particle.style.setProperty('--dy', `${random(-95, 35)}px`);
      particle.style.animationDelay = `${random(0, .18)}s`;
      particle.style.color = ['#e5b65b', '#e99db3', '#bca3dd', '#a6d3ba'][Math.floor(Math.random() * 4)];
      layer.appendChild(particle);
      setTimeout(() => particle.remove(), 1400);
    }
  }

  // One hidden reward egg: it appears after any two of Pip's four chosen projects
  // have been explored. It peeks from the edge, then runs after three clicks.
  const visitedTasks = new Set();
  const eggTeaser = $('#eggTeaser');
  const eggTeaserLabel = $('#eggTeaserLabel');
  const eggTeaserVisual = $('#eggTeaserVisual');
  const eggRewardOverlay = $('#eggRewardOverlay');
  const eggRewardClose = $('#eggRewardClose');
  const eggRewardArt = $('#eggRewardArt');
  let eggUnlocked = false;
  let eggStage = 'locked';
  let eggAttempts = 0;
  let eggChasePosition = 0;

  function eggArtworkSvg(prefix, extraClass = '') {
    const eggPath = 'M110 9 C161 9 199 71 197 143 C195 211 153 265 110 271 C67 265 25 211 23 143 C21 71 59 9 110 9 Z';
    const clipId = `egg-clip-${prefix}`;
    return `<svg class="patterned-egg-svg ${extraClass}" viewBox="0 0 220 282" role="img" aria-label="A colorful hand-decorated Easter egg with stripes, flowers, dots, and leaves" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${clipId}"><path d="${eggPath}"/></clipPath><linearGradient id="egg-base-${prefix}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff9de"/><stop offset=".55" stop-color="#ffedcf"/><stop offset="1" stop-color="#f6d6bf"/></linearGradient><linearGradient id="egg-shine-${prefix}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff" stop-opacity=".68"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <ellipse cx="112" cy="265" rx="67" ry="10" fill="#b99480" opacity=".18"/>
      <path d="${eggPath}" fill="url(#egg-base-${prefix})" stroke="#fffdf5" stroke-width="5"/>
      <g clip-path="url(#${clipId})">
        <path d="M5 57 Q110 76 215 57" fill="none" stroke="#f28cb0" stroke-width="20"/>
        <path d="M5 82 Q110 64 215 82" fill="none" stroke="#f5c85f" stroke-width="16"/>
        <path d="M5 108 Q110 126 215 108" fill="none" stroke="#89b8ee" stroke-width="20"/>
        <path d="M5 136 Q110 117 215 136" fill="none" stroke="#f7a26d" stroke-width="17"/>
        <path d="M5 163 Q110 183 215 163" fill="none" stroke="#a7ce72" stroke-width="20"/>
        <path d="M5 190 Q110 173 215 190" fill="none" stroke="#f18cac" stroke-width="16"/>
        <path d="M5 218 Q110 239 215 218" fill="none" stroke="#9dc7eb" stroke-width="19"/>
        <path d="M20 75 l10 -8 10 8 10 -8 10 8 10 -8 10 8 10 -8 10 8 10 -8 10 8 10 -8 10 8 10 -8 10 8 10 -8 10 8 10 -8 10 8" fill="none" stroke="#fff8eb" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M10 148 l9 -7 9 7 9 -7 9 7 9 -7 9 7 9 -7 9 7 9 -7 9 7 9 -7 9 7 9 -7 9 7 9 -7 9 7 9 -7 9 7 9 -7 9 7" fill="none" stroke="#fff7eb" stroke-width="3.5" stroke-linejoin="round"/>
        <g fill="#fff9ea" opacity=".96"><circle cx="46" cy="42" r="4"/><circle cx="74" cy="36" r="3.2"/><circle cx="152" cy="39" r="4.2"/><circle cx="174" cy="48" r="3"/><circle cx="42" cy="121" r="3.6"/><circle cx="82" cy="116" r="4.1"/><circle cx="140" cy="117" r="3.1"/><circle cx="179" cy="124" r="4"/><circle cx="58" cy="203" r="3.4"/><circle cx="102" cy="198" r="3.2"/><circle cx="161" cy="204" r="4"/><circle cx="184" cy="194" r="2.8"/><circle cx="77" cy="246" r="3.2"/><circle cx="145" cy="247" r="4"/></g>
        <g transform="translate(75 145)"><g fill="#72aee9"><ellipse cx="0" cy="-13" rx="7" ry="12"/><ellipse cx="12" cy="-4" rx="7" ry="12" transform="rotate(72 12 -4)"/><ellipse cx="8" cy="10" rx="7" ry="12" transform="rotate(144 8 10)"/><ellipse cx="-8" cy="10" rx="7" ry="12" transform="rotate(216 -8 10)"/><ellipse cx="-12" cy="-4" rx="7" ry="12" transform="rotate(288 -12 -4)"/></g><circle r="6" fill="#f7d46d"/></g>
        <g transform="translate(153 181)"><g fill="#f28cac"><ellipse cx="0" cy="-12" rx="6" ry="10"/><ellipse cx="11" cy="-3" rx="6" ry="10" transform="rotate(72 11 -3)"/><ellipse cx="7" cy="9" rx="6" ry="10" transform="rotate(144 7 9)"/><ellipse cx="-7" cy="9" rx="6" ry="10" transform="rotate(216 -7 9)"/><ellipse cx="-11" cy="-3" rx="6" ry="10" transform="rotate(288 -11 -3)"/></g><circle r="5" fill="#ffdb72"/></g>
        <g fill="#75b982"><ellipse cx="52" cy="226" rx="8" ry="17" transform="rotate(-48 52 226)"/><ellipse cx="67" cy="235" rx="7" ry="15" transform="rotate(37 67 235)"/><ellipse cx="166" cy="88" rx="7" ry="15" transform="rotate(-42 166 88)"/><ellipse cx="178" cy="97" rx="6" ry="13" transform="rotate(42 178 97)"/></g>
        <ellipse cx="67" cy="45" rx="16" ry="48" fill="url(#egg-shine-${prefix})" transform="rotate(-18 67 45)"/>
      </g>
      <path d="${eggPath}" fill="none" stroke="#fffdf7" stroke-width="4" opacity=".94"/>
      <path d="M69 20 Q43 45 42 79" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>
    </svg>`;
  }

  if (eggTeaserVisual) eggTeaserVisual.innerHTML = eggArtworkSvg('teaser');
  if ($('#eggShellTop')) $('#eggShellTop').innerHTML = eggArtworkSvg('reward-top');
  if ($('#eggShellBottom')) $('#eggShellBottom').innerHTML = eggArtworkSvg('reward-bottom');

  function unlockEgg() {
    if (eggUnlocked || !eggTeaser || eggStage === 'reward') return;
    eggUnlocked = true;
    eggStage = 'tease';
    eggTeaser.hidden = false;
    eggTeaser.setAttribute('aria-label', 'A decorated dream egg is peeking out. Click to open');
    if (eggTeaserLabel) eggTeaserLabel.textContent = 'Click to open';
    // Keep only the edge of the egg visible until the visitor hovers or focuses it.
    if (soundOn) { playTone(783.99, .12, .018); playTone(987.77, .16, .016, .1); }
  }

  function markTaskVisited(task) {
    if (!['lullaby', 'nightlights', 'toys', 'storybook'].includes(task) || visitedTasks.has(task)) return;
    visitedTasks.add(task);
    if (visitedTasks.size >= 2) unlockEgg();
  }

  // The surprise is repeatable during a visit: after each reward closes, the next
  // two distinct project sections can unlock another decorated egg. All state is
  // intentionally in memory, so a page refresh starts a fresh discovery cycle.
  function resetEggCycle() {
    visitedTasks.clear();
    eggUnlocked = false;
    eggStage = 'locked';
    eggAttempts = 0;
    eggChasePosition = 0;
    if (eggTeaser) {
      eggTeaser.classList.remove('is-peeking-in', 'is-chasing', 'is-peeking');
      eggTeaser.hidden = true;
      eggTeaser.style.removeProperty('left');
      eggTeaser.style.removeProperty('top');
      eggTeaser.style.removeProperty('right');
      eggTeaser.style.removeProperty('bottom');
      eggTeaser.style.removeProperty('transform');
      eggTeaser.setAttribute('aria-label', 'A decorated dream egg will appear after you explore two projects');
    }
    if (eggTeaserLabel) eggTeaserLabel.textContent = 'Click to open';
  }

  const taskObserverTargets = $$('[data-task-detail]');
  if ('IntersectionObserver' in window && taskObserverTargets.length) {
    const taskObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.intersectionRatio < .32) return;
        const task = entry.target.dataset.task || entry.target.dataset.taskDetail;
        markTaskVisited(task);
      });
    }, { threshold: [.32, .48, .65] });
    taskObserverTargets.forEach(target => taskObserver.observe(target));
  } else {
    // Older browsers still unlock after project interactions, through the click map.
    $$('.project-card[data-task]').forEach(card => card.addEventListener('click', () => markTaskVisited(card.dataset.task)));
  }

  function placeChasingEgg() {
    if (!eggTeaser) return;
    const rect = eggTeaser.getBoundingClientRect();
    const maxLeft = Math.max(12, window.innerWidth - rect.width - 12);
    const maxTop = Math.max(80, window.innerHeight - rect.height - 16);
    const spots = [
      [Math.max(12, window.innerWidth * .08), Math.max(72, window.innerHeight * .20)],
      [maxLeft, Math.min(maxTop, window.innerHeight * .30)],
      [Math.min(maxLeft, window.innerWidth * .53), Math.max(72, window.innerHeight * .64)],
      [Math.max(12, window.innerWidth * .12), Math.min(maxTop, window.innerHeight * .63)],
      [Math.min(maxLeft, window.innerWidth * .68), Math.max(78, window.innerHeight * .14)]
    ];
    const spot = spots[eggChasePosition % spots.length];
    eggChasePosition += 1;
    eggTeaser.style.left = `${Math.round(spot[0])}px`;
    eggTeaser.style.top = `${Math.round(spot[1])}px`;
    eggTeaser.style.right = 'auto';
    eggTeaser.style.bottom = 'auto';
    eggTeaser.style.transform = `rotate(${Math.round(random(-9, 9))}deg)`;
  }

  function startEggChase() {
    eggStage = 'chasing';
    eggAttempts = 1;
    eggTeaser.classList.remove('is-peeking-in');
    eggTeaser.classList.add('is-chasing');
    if (eggTeaserLabel) eggTeaserLabel.textContent = 'Find me first!';
    eggTeaser.setAttribute('aria-label', 'Find me first! Click the decorated egg again');
    showToast('Find me first!');
    if (soundOn) playTone(659.25, .13, .02);
    placeChasingEgg();
  }

  function openEggReward() {
    eggStage = 'reward';
    eggTeaser.hidden = true;
    eggRewardOverlay.hidden = false;
    document.body.classList.add('egg-reward-open');
    window.requestAnimationFrame(() => eggRewardOverlay.classList.add('is-opening'));
    spawnSparks(window.innerWidth / 2, window.innerHeight / 2, 28);
    if (soundOn) {
      playTone(523.25, .22, .026);
      playTone(659.25, .24, .025, .12);
      playTone(783.99, .3, .027, .25);
      playTone(1046.5, .42, .025, .42);
    }
    window.setTimeout(() => eggRewardOverlay.classList.add('is-open'), 760);
    window.setTimeout(() => eggRewardClose?.focus({ preventScroll: true }), 820);
  }

  eggTeaser?.addEventListener('pointerenter', () => {
    if (eggStage === 'tease') eggTeaser.classList.add('is-peeking-in');
  });
  eggTeaser?.addEventListener('focus', () => {
    if (eggStage === 'tease') eggTeaser.classList.add('is-peeking-in');
  });
  eggTeaser?.addEventListener('click', event => {
    event.preventDefault();
    if (eggStage === 'tease') { startEggChase(); return; }
    if (eggStage !== 'chasing') return;
    eggAttempts += 1;
    if (eggAttempts >= 3) { openEggReward(); return; }
    if (eggTeaserLabel) eggTeaserLabel.textContent = `Find me first! (${eggAttempts}/3)`;
    showToast(eggAttempts === 2 ? 'So close! One more try!' : 'Find me first!');
    if (soundOn) playTone(620 + eggAttempts * 100, .12, .018);
    placeChasingEgg();
  });

  eggRewardClose?.addEventListener('click', () => {
    eggRewardOverlay.classList.remove('is-opening', 'is-open');
    eggRewardOverlay.hidden = true;
    document.body.classList.remove('egg-reward-open');
    showToast('Thank you for visiting Pip’s Dream World! ♥');
    resetEggCycle();
  });
  eggRewardOverlay?.addEventListener('click', event => {
    if (event.target === eggRewardOverlay) eggRewardClose?.click();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && eggRewardOverlay && !eggRewardOverlay.hidden) eggRewardClose?.click();
  });
  window.addEventListener('resize', () => {
    if (eggStage === 'chasing') placeChasingEgg();
  }, { passive: true });

  // ==============================================
// PIP'S BEDTIME STORYBOOK
// 10 original bedtime stories for little dreamers
// ==============================================

const bedtimeStories = [

  // STORY 1
  {
    title: "The Sleepy Firefly",

    text: `Once upon a time, a little firefly named Fifi
    worried that her light was too small.

    "The other stars shine so brightly," she whispered.

    The Moon smiled. "Little lights can make a big
    difference, too."

    Fifi flew down to a tiny flower sleeping beneath
    a leaf. Her gentle glow lit the flower's petals.

    "Thank you," murmured the flower.

    Fifi smiled all the way home. She curled up in
    her cozy leaf bed, happy to have shared her light.

    And soon, the whole garden was asleep.`
  },

  // STORY 2
  {
    title: "The Cloud That Couldn't Sleep",

    text: `High above the sleepy town floated a little
    cloud named Nimbus.

    Nimbus tried counting stars, singing to the Moon,
    and drifting past the tallest trees. But sleep
    simply wouldn't come.

    At last, a gentle breeze carried Nimbus a soft
    moonbeam.

    "Perhaps you need a pillow," whispered the wind.

    Nimbus tucked the moonbeam beneath its fluffy
    head and snuggled into the quiet sky.

    One tiny yawn escaped.

    Then another.

    Soon, Nimbus was dreaming of a sky full of
    cotton-candy clouds.`
  },

  // STORY 3
  {
    title: "The Little Acorn's Big Dream",

    text: `Under an old oak tree lived a tiny acorn
    named Archie.

    Archie wanted to become a tall tree immediately.

    "I want branches and leaves and birds who sing
    in the morning!" he told the wise old owl.

    The owl chuckled gently. "Every big tree begins
    with something small. Growing takes time."

    Archie settled into the soft earth and listened
    to the rain tapping above him.

    He didn't need to grow tonight.

    He only needed to rest.

    Archie closed his little eyes and dreamed of
    the wonderful tree he might become someday.`
  },

  // STORY 4
  {
    title: "The Moon's Missing Button",

    text: `One evening, the Moon noticed a tiny silver
    button missing from its favorite nightcoat.

    "Oh, dear!" sighed the Moon.

    A rabbit searched the meadow. A squirrel
    checked the pinecones. And a little mouse
    peeked beneath every flower.

    At last, the mouse found the shiny button
    beside a sleepy daisy.

    Together, the friends returned it to the Moon.

    "Thank you, little helpers!" said the Moon.

    It shone a little brighter, sending a gentle
    silver glow over the meadow.

    The friends waved goodnight and headed home.`
  },

  // STORY 5
  {
    title: "The Rabbit Who Counted Stars",

    text: `Milo the rabbit loved counting stars before
    bedtime.

    One star, two stars, three stars...

    But every time Milo reached ten, he forgot
    where he had started!

    His grandmother tucked a blanket around him.

    "You don't have to count them all," she said.
    "The stars will be here tomorrow."

    Milo looked up at the sky.

    One little star twinkled as if it were waving.

    Milo smiled, snuggled into his pillow, and
    listened to the night breeze.

    Tonight, he would simply dream beneath the
    stars instead of counting them.`
  },

  // STORY 6
  {
    title: "The Little Dragon's Warm Tea",

    text: `Dottie was a tiny dragon who loved helping
    her friends.

    One chilly evening, she wanted to warm a cup
    of milk for her teddy bear.

    But whenever Dottie breathed out, a little
    puff of smoke floated into the air!

    She paused, took a slow breath, and tried
    again.

    This time, a gentle warmth rose from the cup.

    Dottie wrapped herself in a blanket and sat
    beside Teddy beneath the window.

    Outside, the stars twinkled quietly.

    Inside, Dottie and Teddy shared their warm
    drink before drifting into happy dreams.`
  },

  // STORY 7
  {
    title: "The Little Paper Boat",

    text: `One rainy evening, a little paper boat named
    Pipkin floated along a quiet garden puddle.

    Pipkin carried a tiny wish written on a leaf:
    "May everyone have a happy dream tonight."

    A friendly frog watched the boat glide past.

    A sleepy duckling waved from the bank.

    The puddle shimmered beneath the Moon, and
    a tiny breeze guided Pipkin between the flowers.

    At last, the boat rested beside a soft patch
    of moss.

    Its journey was over.

    The little wish floated into the moonlight,
    and the whole garden settled into peaceful sleep.`
  },

  // STORY 8
  {
    title: "The Cat and the Goodnight Garden",

    text: `Every night, a little cat named Mallow walked
    through the garden to say goodnight.

    "Goodnight, roses," Mallow purred.

    "Goodnight, daisies."

    "Goodnight, sleepy bees."

    One by one, the flowers folded their petals
    and settled beneath the silver moon.

    Mallow found a warm patch of grass beneath
    a lavender bush.

    A tiny butterfly landed nearby and folded
    its wings.

    Mallow curled its tail around its paws.

    The garden grew quiet, the stars blinked
    slowly, and every little creature dreamed
    beneath the peaceful sky.`
  },

  // STORY 9
  {
    title: "The Fox Who Shared Moonlight",

    text: `A little fox named Rowan discovered a beautiful
    patch of moonlight beneath an apple tree.

    It was just big enough for Rowan to curl up in.

    Soon, a hedgehog wandered over, followed by
    two sleepy field mice.

    Rowan moved aside to make room.

    "There is enough moonlight for all of us,"
    Rowan whispered.

    The friends snuggled together beneath the
    gentle silver glow.

    Above them, the Moon smiled through the leaves.

    They listened to the soft rustling trees
    until their eyes grew heavy.

    And under the apple tree, three little dreams
    began at the very same time.`
  },

  // STORY 10
  {
    title: "Pip's Tiny Hiccup Song",

    text: `One sleepy night at Midnight Nursery, Pip
    wanted to sing a lullaby for a little owl.

    But just as Pip began, a tiny hiccup escaped.

    "Hic!"

    A musical note floated into the air.

    "Hic!"

    Another note joined it.

    Pip giggled and tried turning the funny sounds
    into a gentle little melody.

    The little owl listened, tucked its wings close,
    and slowly closed its eyes.

    Pip finished with one soft, happy note.

    The owl was dreaming before Pip could say
    goodnight.

    Pip smiled, adjusted the starry nightcap,
    and tiptoed away into the moonlit nursery.`
  }

];


// ==============================================
// RANDOM STORY PICKER
// ==============================================

const bedtimeStoryDialog = $('#bedtimeStoryDialog');
const openBedtimeStoryButton = $('#openBedtimeStory');
const closeBedtimeStoryButton = $('#closeBedtimeStory');
const finishBedtimeStoryButton = $('#finishBedtimeStory');
const anotherBedtimeStoryButton = $('#anotherBedtimeStory');

let currentBedtimeStoryIndex = -1;


// Choose a random story without repeating the previous one.
function chooseRandomBedtimeStory() {

  if (!bedtimeStories.length) return;

  let nextIndex;

  do {
    nextIndex = Math.floor(
      Math.random() * bedtimeStories.length
    );
  } while (
    bedtimeStories.length > 1 &&
    nextIndex === currentBedtimeStoryIndex
  );

  currentBedtimeStoryIndex = nextIndex;

  const story = bedtimeStories[nextIndex];

  $('#bedtimeStoryTitle').textContent = story.title;

  $('#bedtimeStoryText').textContent =
    story.text.replace(/\s+/g, ' ').trim();

  $('#bedtimeStoryNumber').textContent =
    `Story ${nextIndex + 1} of ${bedtimeStories.length} · A random pick`;

}


// Open the popup.
function openRandomBedtimeStory() {

  chooseRandomBedtimeStory();

  if (typeof markTaskVisited === 'function') {
    markTaskVisited('storybook');
  }

  if (!bedtimeStoryDialog) return;

  if (
    typeof bedtimeStoryDialog.showModal === 'function'
  ) {
    if (!bedtimeStoryDialog.open) {
      bedtimeStoryDialog.showModal();
    }
  } else {
    bedtimeStoryDialog.setAttribute('open', '');
  }

  window.setTimeout(() => {
    closeBedtimeStoryButton?.focus({
      preventScroll: true
    });
  }, 30);

}


// Close the popup.
function closeBedtimeStory() {

  if (!bedtimeStoryDialog) return;

  if (
    typeof bedtimeStoryDialog.close === 'function' &&
    bedtimeStoryDialog.open
  ) {
    bedtimeStoryDialog.close();
  } else {
    bedtimeStoryDialog.removeAttribute('open');
  }

}


// Clicking the project's button opens a random story.
openBedtimeStoryButton?.addEventListener(
  'click',
  openRandomBedtimeStory
);


// Show a different story without closing the popup.
anotherBedtimeStoryButton?.addEventListener(
  'click',
  chooseRandomBedtimeStory
);


// Close buttons.
closeBedtimeStoryButton?.addEventListener(
  'click',
  closeBedtimeStory
);

finishBedtimeStoryButton?.addEventListener(
  'click',
  closeBedtimeStory
);


// Clicking the backdrop also closes the popup.
bedtimeStoryDialog?.addEventListener(
  'click',
  event => {
    if (event.target === bedtimeStoryDialog) {
      closeBedtimeStory();
    }
  }
);


// Return keyboard focus to the original button.
bedtimeStoryDialog?.addEventListener(
  'close',
  () => {
    openBedtimeStoryButton?.focus({
      preventScroll: true
    });
  }
);

  // Sound is only added to deliberate UI actions; no intrusive background audio.
  document.addEventListener('click', event => {
    if (event.target.closest('button, .hint-chip, .nav-link, .text-link')) {
      if (!event.target.closest('#soundToggle, #playLullaby, #stopLullaby, #eggTeaser, #eggRewardClose')) uiChime();
    }
  }, true);
// ==========================================
// NIGHTLIGHT COLLECTION — SCROLL STORY REVEAL
// ==========================================

const nightlightSection = document.querySelector('#nightlight-collection');

if (nightlightSection) {
  const nightlightHeading = nightlightSection.querySelector('.section-heading');
  const nightlightCard = nightlightSection.querySelector('.nightlight-feature');

  const nightlightTargets = [
    nightlightHeading,
    nightlightCard
  ].filter(Boolean);

  const nightlightReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (
    !nightlightReducedMotion &&
    'IntersectionObserver' in window &&
    nightlightTargets.length
  ) {
    document.body.classList.add('nightlight-story-effects');

    const nightlightObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('is-scroll-visible');

          // Reveal each element only once per page load.
          nightlightObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    nightlightTargets.forEach(element => {
      nightlightObserver.observe(element);
    });
  }
}
// ==========================================
// LULLABY LAB + TOYBOX — SCROLL REVEALS
// ==========================================

const dreamProjectMotionReduced = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const dreamProjectRevealTargets = [];

const dreamProjectFloatTargets = new WeakSet();

function addDreamProjectTarget(element, shouldFloat = false) {
  if (!element) return;

  dreamProjectRevealTargets.push(element);

  if (shouldFloat) {
    dreamProjectFloatTargets.add(element);
  }
}

// Lullaby Lab: heading and complete feature card.
addDreamProjectTarget(
  document.querySelector('#lullaby-lab .section-heading')
);

addDreamProjectTarget(
  document.querySelector('#lullaby-lab .lullaby-feature'),
  true
);

// Toybox: heading and every interactive toy card.
addDreamProjectTarget(
  document.querySelector('#toybox .section-heading')
);

document
  .querySelectorAll('#toybox .toybox-grid > .toy-card')
  .forEach(card => {
    addDreamProjectTarget(card, true);
  });

// Activate the effects only when motion is permitted
// and the browser supports scroll observation.
if (
  !dreamProjectMotionReduced &&
  'IntersectionObserver' in window &&
  dreamProjectRevealTargets.length > 0
) {
  document.body.classList.add('dream-project-effects-ready');

  const dreamProjectObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const element = entry.target;

        // Reveal the element as it enters the viewport.
        element.classList.add('dream-project-revealed');

        // Begin floating after the entrance animation.
        if (dreamProjectFloatTargets.has(element)) {
          window.setTimeout(() => {
            if (element.isConnected) {
              element.classList.add('dream-project-floating');
            }
          }, 900);
        }

        // Reveal each element only once.
        dreamProjectObserver.unobserve(element);
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -35px 0px'
    }
  );

  dreamProjectRevealTargets.forEach(element => {
    dreamProjectObserver.observe(element);
  });
}
})();
