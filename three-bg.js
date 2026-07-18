/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║   CYBER NETWORK BACKGROUND — Premium Canvas Animation   ║
 * ║   Independent particles + local network clusters         ║
 * ║   Mouse attraction · Soft glow · 60 FPS optimised       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

(function CyberNetwork() {
  'use strict';

  /* ── Respect prefers-reduced-motion ─────────────────────── */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Canvas setup ────────────────────────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.id    = 'cyber-bg';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:fixed',
    'top:0', 'left:0',
    'width:100%', 'height:100%',
    'pointer-events:none',
    'z-index:0',
    'display:block',
  ].join(';');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');

  /* ── Dimensions ──────────────────────────────────────────── */
  let W = 0, H = 0;

  function resize() {
    const dpr   = Math.min(window.devicePixelRatio || 1, 2);
    W           = window.innerWidth;
    H           = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', () => { resize(); rebuildClusters(); });

  /* ── Colour palette (cyan / electric-blue / soft-teal) ───── */
  const PALETTE = [
    { r: 103, g: 232, b: 249 }, // #67e8f9 — cyan
    { r:  56, g: 189, b: 248 }, // #38bdf8 — sky-blue
    { r:  34, g: 211, b: 238 }, // #22d3ee — teal-cyan
    { r:  96, g: 165, b: 250 }, // #60a5fa — electric-blue
    { r:   6, g: 182, b: 212 }, // #06b6d4 — deep-teal
    { r: 125, g: 211, b: 252 }, // #7dd3fc — light-sky
  ];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick  = arr  => arr[Math.floor(Math.random() * arr.length)];

  /* ── Mouse ───────────────────────────────────────────────── */
  const mouse = { x: -9999, y: -9999, active: false };
  window.addEventListener('mousemove', e => {
    mouse.x      = e.clientX;
    mouse.y      = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });

  /* ── Configuration ───────────────────────────────────────── */
  const CFG = {
    SOLO_COUNT:     120,   // independent particles
    CLUSTER_COUNT:  7,    // number of clusters
    CLUSTER_SIZE_MIN: 4,
    CLUSTER_SIZE_MAX: 10,
    CONNECT_DIST:    90,   // max px between cluster-mates to draw line
    MOUSE_RADIUS:   110,   // px — attraction + temp-line radius
    MOUSE_FORCE:    0.03, // slower, gentler nudge to cursor
    MOUSE_LINE_DIST: 80,   // draw temp line when this close to mouse
  };

  /* ══════════════════════════════════════════════════════════
     PARTICLE
  ══════════════════════════════════════════════════════════ */
  class Particle {
    constructor(opts = {}) {
      this.clusterID = opts.clusterID ?? -1;          // -1 = solo
      this.col       = pick(PALETTE);

      /* position — cluster particles spawn near a seed */
      if (opts.seed) {
        this.x  = opts.seed.x + rand(-80, 80);
        this.y  = opts.seed.y + rand(-80, 80);
      } else {
        this.x  = rand(0, W);
        this.y  = rand(0, H);
      }

      /* velocity — ultra slow organic drift */
      const speed   = rand(0.01, 0.06);
      const angle   = rand(0, Math.PI * 2);
      this.vx       = Math.cos(angle) * speed;
      this.vy       = Math.sin(angle) * speed;

      /* wandering — subtle noise-like direction change */
      this.wander   = rand(0, Math.PI * 2);  // wander phase
      this.wanderSpd= rand(0.003, 0.010);     // how fast direction shifts

      /* visual */
      this.r        = rand(1.0, 2.2);          // radius
      this.baseAlpha= rand(0.35, 0.80);
      this.alpha    = this.baseAlpha;
      this.pulsePhase = rand(0, Math.PI * 2);
      this.pulseSpd   = rand(0.006, 0.022);

      /* mouse interaction */
      this.homeX    = this.x;
      this.homeY    = this.y;
      this.attracted = false;
    }

    update(t) {
      if (reduceMotion) return;

      /* wander — slowly rotate velocity direction */
      this.wander += this.wanderSpd;
      this.vx     += Math.cos(this.wander) * 0.001;
      this.vy     += Math.sin(this.wander) * 0.001;

      /* clamp speed */
      const spd = Math.hypot(this.vx, this.vy);
      const max = this.clusterID >= 0 ? 0.08 : 0.10;
      if (spd > max) { this.vx = (this.vx / spd) * max; this.vy = (this.vy / spd) * max; }

      /* mouse attraction */
      this.isHovered = false;
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (mouse.active && dist < CFG.MOUSE_RADIUS) {
        const f  = (1 - dist / CFG.MOUSE_RADIUS) * CFG.MOUSE_FORCE;
        this.vx += (dx / dist) * f;
        this.vy += (dy / dist) * f;
        this.attracted = true;
      } else {
        this.attracted = false;
      }

      this.x += this.vx;
      this.y += this.vy;

      /* wrap around screen edges smoothly */
      const pad = 20;
      if (this.x < -pad)  this.x = W + pad;
      if (this.x >  W + pad) this.x = -pad;
      if (this.y < -pad)  this.y = H + pad;
      if (this.y >  H + pad) this.y = -pad;

      /* soft pulse alpha */
      this.pulsePhase += this.pulseSpd;
      const pulse     = Math.sin(this.pulsePhase) * 0.18;
      const attBoost  = this.attracted ? 0.2 : 0;
      this.alpha      = Math.min(1, Math.max(0.05, this.baseAlpha + pulse + attBoost));
    }

    draw() {
      const { r, g, b } = this.isHovered ? { r: 255, g: 60, b: 60 } : this.col;
      const radius       = this.attracted ? this.r * 1.5 : this.r;

      /* glow halo */
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius * 4.5);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${(this.alpha * 0.55).toFixed(3)})`);
      grd.addColorStop(0.5, `rgba(${r},${g},${b},${(this.alpha * 0.12).toFixed(3)})`);
      grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* core dot */
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  /* ══════════════════════════════════════════════════════════
     CLUSTER — group of particles that only wire to each other
  ══════════════════════════════════════════════════════════ */
  class Cluster {
    constructor(id) {
      this.id         = id;
      this.particles  = [];
      const seed      = { x: rand(60, W - 60), y: rand(60, H - 60) };
      const count     = Math.round(rand(CFG.CLUSTER_SIZE_MIN, CFG.CLUSTER_SIZE_MAX));
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle({ clusterID: id, seed }));
      }
    }

    drawConnections() {
      const pts = this.particles;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx   = pts[i].x - pts[j].x;
          const dy   = pts[i].y - pts[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist > CFG.CONNECT_DIST) continue;

          const t     = 1 - dist / CFG.CONNECT_DIST;
          const alpha = t * t * 0.55; // quadratic fade

          /* brighten if either endpoint near mouse */
          const dma = Math.hypot(mouse.x - pts[i].x, mouse.y - pts[i].y);
          const dmb = Math.hypot(mouse.x - pts[j].x, mouse.y - pts[j].y);
          const near = mouse.active && (dma < CFG.MOUSE_RADIUS || dmb < CFG.MOUSE_RADIUS);
          const finalAlpha = near ? Math.min(1, alpha * 2.2) : alpha;

          /* blend the two particle colours on the line */
          const ca = pts[i].col, cb = pts[j].col;
          const r  = (ca.r + cb.r) >> 1;
          const g  = (ca.g + cb.g) >> 1;
          const b  = (ca.b + cb.b) >> 1;

          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${finalAlpha.toFixed(3)})`;
          ctx.lineWidth   = near ? 0.8 : 0.5;
          ctx.stroke();
        }
      }
    }


  }

  /* ── State ───────────────────────────────────────────────── */
  let solos    = [];
  let clusters = [];

  function rebuildClusters() {
    solos    = Array.from({ length: CFG.SOLO_COUNT },     () => new Particle());
    clusters = Array.from({ length: CFG.CLUSTER_COUNT }, (_, i) => new Cluster(i));
  }
  rebuildClusters();

  /* ── Visibility API — pause when tab hidden ──────────────── */
  let hidden = false;
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if (!hidden) requestAnimationFrame(loop);
  });

  /* ── Render loop ─────────────────────────────────────────── */
  let raf = null;
  let lastT = 0;

  function loop(t) {
    if (hidden) return;
    raf = requestAnimationFrame(loop);

    const dt = t - lastT;
    lastT     = t;

    /* Skip frames on very slow devices to avoid lag */
    if (dt > 80) return;

    ctx.clearRect(0, 0, W, H);

    /* === Draw cluster connections (behind particles) === */
    ctx.save();
    for (const cl of clusters) {
      cl.drawConnections();
    }

    /* === Dynamic Cursor Network === */
    if (mouse.active) {
      let nearby = [];
      for (const p of solos) {
        const d = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        if (d < CFG.MOUSE_RADIUS) {
          p.isHovered = true;
          nearby.push({ p, d });
        }
      }
      for (const cl of clusters) {
        for (const p of cl.particles) {
          const d = Math.hypot(mouse.x - p.x, mouse.y - p.y);
          if (d < CFG.MOUSE_RADIUS) {
            p.isHovered = true;
            nearby.push({ p, d });
          }
        }
      }

      /* Form a full local network with all nearby dots */
      const topNearby = nearby.map(item => item.p);

      /* Connect nearby to mouse */
      for (const p of topNearby) {
        const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        if (dist > CFG.MOUSE_LINE_DIST) continue;
        const t     = 1 - dist / CFG.MOUSE_LINE_DIST;
        const alpha = t * 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(255,60,60,${alpha.toFixed(3)})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }

      /* Connect nearby to each other forming a web */
      for (let i = 0; i < topNearby.length; i++) {
        for (let j = i + 1; j < topNearby.length; j++) {
          const p1 = topNearby[i], p2 = topNearby[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < CFG.CONNECT_DIST) {
             const t = 1 - dist / CFG.CONNECT_DIST;
             const alpha = t * 0.45;
             ctx.beginPath();
             ctx.moveTo(p1.x, p1.y);
             ctx.lineTo(p2.x, p2.y);
             ctx.strokeStyle = `rgba(255,60,60,${alpha.toFixed(3)})`;
             ctx.lineWidth = 0.6;
             ctx.stroke();
          }
        }
      }
    }
    ctx.restore();

    /* === Update + draw all particles === */
    for (const p of solos) { p.update(t); p.draw(); }
    for (const cl of clusters) {
      for (const p of cl.particles) { p.update(t); p.draw(); }
    }
  }

  /* Start */
  if (!reduceMotion) {
    raf = requestAnimationFrame(loop);
  } else {
    /* reduced motion: render one static frame */
    for (const p of solos)    p.draw();
    for (const cl of clusters) {
      cl.drawConnections();
      for (const p of cl.particles) p.draw();
    }
  }

})();
