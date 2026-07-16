/* ================================================================
   IGLOO-STYLE 3D CURSOR PARALLAX — parallax-cursor.js
   • Custom cursor glow blob  (large, lagged)
   • Custom cursor dot        (sharp, fast)
   • 4 CSS depth layers       (parallax at 0.03 → 0.20 depth)
   • Per-layer float animation driven by requestAnimationFrame lerp
   ================================================================ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  /* ── helpers ── */
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd  = (min, max) => min + Math.random() * (max - min);
  const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ── colour palette (hue angles) ── */
  const HUES = [185, 210, 260, 30, 170, 220];

  /* ──────────────────────────────────────────────────
     1. CUSTOM CURSOR
  ────────────────────────────────────────────────── */
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  const ring = document.createElement('div');
  ring.id = 'cursor-ring';
  document.body.appendChild(ring);

  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  document.body.appendChild(dot);

  /* ──────────────────────────────────────────────────
     2. BUILD PARALLAX LAYERS
  ────────────────────────────────────────────────── */
  /*
   * depthFactor: how many px the layer shifts per 1 px of mouse offset from centre.
   *   0.03 = far / barely moves
   *   0.20 = close / moves a lot
   */
  const LAYER_DEFS = [
    { id: 'pl-0', depth: 0.028, lerpT: 0.035, count: 5,  type: 'orb'  },
    { id: 'pl-1', depth: 0.065, lerpT: 0.050, count: 7,  type: 'hex'  },
    { id: 'pl-2', depth: 0.115, lerpT: 0.070, count: 10, type: 'dot'  },
    { id: 'pl-3', depth: 0.200, lerpT: 0.095, count: 5,  type: 'ring' },
  ];

  /* Shape generators */
  function makeOrb() {
    const el = document.createElement('div');
    el.className = 'pl-orb';
    const hue  = pick(HUES);
    const size = rnd(180, 420);
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${rnd(-10,110)}%; top:${rnd(-10,110)}%;
      border-radius:50%;
      background: radial-gradient(circle,
        hsla(${hue},78%,62%,0.14) 0%,
        hsla(${hue},78%,62%,0.05) 45%,
        transparent 70%);
      will-change:transform;
      pointer-events:none;
      animation: plFloat${Math.round(rnd(1,4))} ${rnd(8,14)}s ease-in-out ${rnd(0,6)}s infinite;
    `;
    return el;
  }

  function makeHex() {
    const el = document.createElement('div');
    el.className = 'pl-hex';
    const hue  = pick(HUES);
    const size = rnd(40, 110);
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${rnd(5,95)}%; top:${rnd(5,95)}%;
      border: 1px solid hsla(${hue},70%,60%,${rnd(0.08,0.22)});
      clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
      transform-origin: center;
      will-change:transform;
      pointer-events:none;
      animation: plSpin ${rnd(20,40)}s linear ${rnd(0,10)}s infinite,
                 plFloat${Math.round(rnd(1,4))} ${rnd(7,13)}s ease-in-out ${rnd(0,5)}s infinite;
    `;
    return el;
  }

  function makeDot() {
    const el = document.createElement('div');
    el.className = 'pl-dot';
    const hue  = pick(HUES);
    const size = rnd(2, 7);
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${rnd(2,98)}%; top:${rnd(2,98)}%;
      border-radius:50%;
      background: hsla(${hue},80%,68%,${rnd(0.35,0.75)});
      box-shadow: 0 0 ${size*2}px hsla(${hue},80%,68%,0.5);
      will-change:transform;
      pointer-events:none;
      animation: plFloat${Math.round(rnd(1,4))} ${rnd(5,11)}s ease-in-out ${rnd(0,7)}s infinite;
    `;
    return el;
  }

  function makeRing() {
    const el = document.createElement('div');
    el.className = 'pl-ring';
    const hue  = pick(HUES);
    const size = rnd(50, 140);
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${rnd(5,90)}%; top:${rnd(5,90)}%;
      border-radius:50%;
      border: 1px solid hsla(${hue},65%,58%,${rnd(0.08,0.20)});
      will-change:transform;
      pointer-events:none;
      animation: plPulse ${rnd(3,7)}s ease-in-out ${rnd(0,4)}s infinite,
                 plFloat${Math.round(rnd(1,4))} ${rnd(9,16)}s ease-in-out ${rnd(0,6)}s infinite;
    `;
    return el;
  }

  const makers = { orb: makeOrb, hex: makeHex, dot: makeDot, ring: makeRing };

  /* Build and mount layers */
  const layers = LAYER_DEFS.map(def => {
    const wrapper = document.createElement('div');
    wrapper.className = 'parallax-layer';
    wrapper.id = def.id;

    for (let i = 0; i < def.count; i++) {
      wrapper.appendChild(makers[def.type]());
    }
    document.body.appendChild(wrapper);

    return {
      el:    wrapper,
      depth: def.depth,
      lerpT: def.lerpT,
      cx:    0,
      cy:    0,
    };
  });

  /* ──────────────────────────────────────────────────
     3. MOUSE STATE
  ────────────────────────────────────────────────── */
  let rawX = window.innerWidth  / 2;
  let rawY = window.innerHeight / 2;

  /* cursor smooth positions */
  let glowX = rawX, glowY = rawY;
  let ringX = rawX, ringY = rawY;
  let dotX  = rawX, dotY  = rawY;

  /* link-hover state for cursor ring */
  let isHovering = false;

  window.addEventListener('mousemove', e => {
    rawX = e.clientX;
    rawY = e.clientY;
  });

  /* scale cursor ring on interactive elements */
  document.addEventListener('mouseover', e => {
    const t = e.target;
    if (t.closest('a,button,.nav-link,.port-card,.skill-ring-card,.cert-pill,.stat-card,.social-icon,.filter-btn,.btn-primary')) {
      isHovering = true;
    }
  });
  document.addEventListener('mouseout', e => {
    const t = e.target;
    if (t.closest('a,button,.nav-link,.port-card,.skill-ring-card,.cert-pill,.stat-card,.social-icon,.filter-btn,.btn-primary')) {
      isHovering = false;
    }
  });

  /* ──────────────────────────────────────────────────
     4. RAF LOOP
  ────────────────────────────────────────────────── */
  function tick() {
    /* ---- cursor glow (big blob, very slow) ---- */
    glowX = lerp(glowX, rawX, 0.055);
    glowY = lerp(glowY, rawY, 0.055);
    glow.style.transform = `translate(${glowX - 280}px, ${glowY - 280}px)`;

    /* ---- cursor ring (medium lag) ---- */
    ringX = lerp(ringX, rawX, 0.12);
    ringY = lerp(ringY, rawY, 0.12);
    const ringSize = isHovering ? 52 : 28;
    ring.style.width  = ringSize + 'px';
    ring.style.height = ringSize + 'px';
    ring.style.transform = `translate(${ringX - ringSize / 2}px, ${ringY - ringSize / 2}px)`;
    ring.style.opacity = isHovering ? '1' : '0.7';

    /* ---- cursor dot (sharp, fast) ---- */
    dotX = lerp(dotX, rawX, 0.28);
    dotY = lerp(dotY, rawY, 0.28);
    dot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;

    /* ---- parallax layers ---- */
    const halfW = window.innerWidth  / 2;
    const halfH = window.innerHeight / 2;
    const offX  = rawX - halfW;   // signed offset from centre
    const offY  = rawY - halfH;

    layers.forEach(layer => {
      layer.cx = lerp(layer.cx, -offX * layer.depth, layer.lerpT);
      layer.cy = lerp(layer.cy, -offY * layer.depth, layer.lerpT);
      layer.el.style.transform = `translate(${layer.cx}px, ${layer.cy}px)`;
    });

    requestAnimationFrame(tick);
  }
  tick();

  /* ──────────────────────────────────────────────────
     5. INJECT CSS KEYFRAMES  (avoids extra file load)
  ────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* cursor */
    body { cursor: none !important; }
    a, button, [role="button"], .nav-link, .port-card, .filter-btn,
    .skill-ring-card, .cert-pill, .social-icon, .btn-primary {
      cursor: none !important;
    }

    #cursor-glow {
      position: fixed; top: 0; left: 0; z-index: 1;
      width: 560px; height: 560px;
      border-radius: 50%;
      background: radial-gradient(circle,
        rgba(103,232,249,0.13) 0%,
        rgba(96,165,250,0.06) 40%,
        transparent 70%);
      pointer-events: none;
      mix-blend-mode: screen;
      will-change: transform;
      transition: opacity 0.4s ease;
    }

    #cursor-ring {
      position: fixed; top: 0; left: 0; z-index: 9998;
      border-radius: 50%;
      border: 1.5px solid rgba(103,232,249,0.75);
      box-shadow: 0 0 8px rgba(103,232,249,0.35),
                  inset 0 0 8px rgba(103,232,249,0.12);
      pointer-events: none;
      will-change: transform, width, height;
      transition: width 0.25s cubic-bezier(0.23,1,0.32,1),
                  height 0.25s cubic-bezier(0.23,1,0.32,1),
                  opacity 0.25s ease;
    }

    #cursor-dot {
      position: fixed; top: 0; left: 0; z-index: 9999;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(103,232,249,0.95);
      box-shadow: 0 0 12px rgba(103,232,249,0.9),
                  0 0 4px  rgba(255,255,255,0.6);
      pointer-events: none;
      will-change: transform;
    }

    /* parallax layer wrappers */
    .parallax-layer {
      position: fixed;
      inset: -15%;
      z-index: 0;
      pointer-events: none;
      will-change: transform;
      overflow: visible;
    }

    /* float keyframes */
    @keyframes plFloat1 {
      0%,100% { transform: translateY(0px)   translateX(0px); }
      33%      { transform: translateY(-18px) translateX(8px); }
      66%      { transform: translateY(10px)  translateX(-6px); }
    }
    @keyframes plFloat2 {
      0%,100% { transform: translateY(0px)  translateX(0px); }
      40%      { transform: translateY(14px) translateX(-10px); }
      70%      { transform: translateY(-9px) translateX(5px); }
    }
    @keyframes plFloat3 {
      0%,100% { transform: translateY(0px)   translateX(0px); }
      25%      { transform: translateY(-12px) translateX(-8px); }
      75%      { transform: translateY(8px)   translateX(12px); }
    }
    @keyframes plFloat4 {
      0%,100% { transform: translateY(0px)  translateX(0px); }
      50%      { transform: translateY(-20px) translateX(6px); }
    }
    @keyframes plSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes plPulse {
      0%,100% { opacity: 0.6; transform: scale(1); }
      50%      { opacity: 1.0; transform: scale(1.15); }
    }
  `;
  document.head.appendChild(style);

})();
