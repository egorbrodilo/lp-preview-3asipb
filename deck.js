// Love&Pay deck: living light threads behind the slides. One set of threads flows, pulses like a heartbeat
// and re-forms between scenes while the reader scrolls: infinity -> globe with an orbit -> heart.
(() => {
  const BLUE_D = '#22ADE6', BLUE = '#67D2F6', PINK = '#FF6B76', PINK_D = '#F0405A';
  const SHOT = window.DECK_START !== undefined;           // snapshot mode: one fixed frame
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(innerWidth, innerHeight) < 560;
  let N = small ? 140 : 220; const M = small ? 64 : 80;

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(11), TH = [];
  for (let k = 0; k < 250; k++) TH.push({ side: k % 2, q: (k * 0.61803398875) % 1, u: R() * 2 - 1, r: R(), amp: 0.4 + R(), k1: 2 + Math.floor(R() * 4), p1: R() * 6.283, k2: 5 + 2 * Math.floor(R() * 3), p2: R() * 6.283, w: 0.7 + 0.6 * R(), al: 0.75 + 0.5 * R() });

  // ---- layout: a 1920x1080 stage in landscape, a 390x844 stage in portrait, both centred in the viewport
  let lay;
  function layout() {
    const iw = innerWidth, ih = innerHeight, portrait = iw / ih < 0.8;
    const px = portrait ? Math.min(iw, ih * 0.46209) / 390 : Math.min(iw, ih * 1.77778) / 1920;
    const sw = (portrait ? 390 : 1920) * px, sh = (portrait ? 844 : 1080) * px;
    lay = { px, ox: (iw - sw) / 2, oy: (ih - sh) / 2, portrait, iw, ih };
  }

  // ---- curves (unit shapes), each returns [x, y] for t in [0, 2pi)
  const lemn = (t) => { const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s; return [c / d, s * c / d]; };
  const heartC = (t) => { const s = Math.PI / 2 - t; const a = Math.sin(s); return [16 * a * a * a / 17, -(13 * Math.cos(s) - 5 * Math.cos(2 * s) - 2 * Math.cos(3 * s) - Math.cos(4 * s)) / 17]; };

  // centre line and normals of a ribbon are the same for all its threads: computed once per frame
  const mkBuf = () => ({ cx: new Float32Array(111), cy: new Float32Array(111), nx: new Float32Array(111), ny: new Float32Array(111) });
  function prep(buf, f, A, shift) {
    for (let j = 0; j < M; j++) { const t = j / M * 6.2832 + shift, c = f(t), a = f(t - 0.012), b = f(t + 0.012);
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = Math.hypot(nx, ny) || 1; buf.cx[j] = c[0] * A; buf.cy[j] = c[1] * A; buf.nx[j] = nx / L; buf.ny[j] = ny / L; }
  }
  function ribbonPt(buf, j, th, t, W, dp, wob, time, o) {
    const ph = t + th.ph + time * 0.16;
    const off = W * (th.u * Math.cos(ph) + (th.u * th.u - 0.5) * dp * Math.sin(ph)) + wob * th.amp * (Math.sin(th.k1 * t + th.p1 + time * 0.5) + 0.4 * Math.sin(th.k2 * t + th.p2 - time * 0.35));
    o[0] = buf.cx[j] + buf.nx[j] * off; o[1] = buf.cy[j] + buf.ny[j] * off;
  }
  function kind(q) { return q < 0.70 ? 0 : q < 0.88 ? 1 : 2; }       // 0 main, 1 halo, 2 white highlight
  const rot = (o, a) => { const c = Math.cos(a), s = Math.sin(a), x = o[0]; o[0] = x * c - o[1] * s; o[1] = x * s + o[1] * c; };

  // ---- scenes. cfg holds [landscape, portrait] placements in stage units.
  const SCENES = [
    { // infinity
      cfg: [{ cx: 1392, cy: 540, a: 500, rot: -13 }, { cx: 198, cy: 254, a: 184, rot: -62 }],
      mid: 0, bg: [[1680, 250, 1.0, 1000, 930, 1.0], [330, 150, 1.0, 60, 520, 1.0]],
      buf: mkBuf(), prep(time, c) { prep(this.buf, lemn, c.a, 0); },
      pt(th, j, s, time, c, o) {
        const k = kind(th.q), sc = c.a / 566, t = s * 6.2832;
        th.ph = [0.55, 0.2, 0.55][k];
        ribbonPt(this.buf, j, th, t, [74, 128, 40][k] * sc, [0.45, 0.2, 0.45][k], [6, 14, 4][k] * sc, time, o);
        rot(o, c.rot * Math.PI / 180); o[0] += c.cx; o[1] += c.cy;
      },
      al: (th) => [0.38, 0.2, 0.42][kind(th.q)], lw: (th) => [1.05, 0.8, 0.9][kind(th.q)],
      ext: (c) => [c.cx - c.a * Math.abs(Math.cos(c.rot * Math.PI / 180)) - c.a * 0.1, c.cx + c.a * Math.abs(Math.cos(c.rot * Math.PI / 180)) + c.a * 0.1],
      core: (c) => [c.cx, c.cy, c.a * 0.46]
    },
    { // two linked rings: exchange, and two that became one
      cfg: [{ cx: 1440, cy: 300, r: 165, d: 112, rot: -10 }, { cx: 195, cy: 322, r: 58, d: 39, rot: -10 }],
      mid: 0.8, bg: [[1560, 420, 0.95, 420, 760, 1.05], [300, 300, 0.9, 60, 560, 1.0]],
      prep() {},
      pt(th, j, s, time, c, o) {
        const k = kind(th.q), sc = c.r / 165, t = s * 6.2832 + (th.side ? 0 : Math.PI), ph = t + [0.5, 0.2, 0.5][k] + time * 0.16;
        const off = [22, 46, 12][k] * sc * (th.u * Math.cos(ph) + (th.u * th.u - 0.5) * 0.4 * Math.sin(ph)) + [3, 8, 2][k] * sc * th.amp * (Math.sin(th.k1 * t + th.p1 + time * 0.5) + 0.4 * Math.sin(th.k2 * t + th.p2 - time * 0.35));
        o[0] = (th.side ? c.d : -c.d) + (c.r + off) * Math.cos(t); o[1] = (c.r + off) * Math.sin(t);
        rot(o, c.rot * Math.PI / 180); o[0] += c.cx; o[1] += c.cy;
      },
      al: (th) => [0.4, 0.2, 0.42][kind(th.q)], lw: (th) => [1.05, 0.8, 0.9][kind(th.q)],
      ext: (c) => [c.cx - c.d - c.r, c.cx + c.d + c.r], core: (c) => [c.cx, c.cy, c.r * 0.5]
    },
    { // globe of meridians and parallels with an orbit ribbon around it
      cfg: [{ cx: 860, cy: 560, R: 300, rx: 372, ry: 126, rot: -17 }, { cx: 195, cy: 318, R: 104, rx: 146, ry: 48, rot: -17 }],
      mid: 0.9, bg: [[1190, 840, 0.8, 660, 330, 1.0], [300, 420, 0.8, 70, 250, 1.0]],
      buf: mkBuf(), prep(time, c) { prep(this.buf, (u) => [Math.cos(u), Math.sin(u) * c.ry / c.rx], c.rx, time * 0.05); },
      pt(th, j, s, time, c, o) {
        const q = th.q, t = s * 6.2832, sc = c.R / 304;
        if (q < 0.46 || q >= 0.88) {
          const k = q < 0.36 ? 0 : q < 0.46 ? 1 : 2; th.ph = [0.6, 0.2, 0.6][k];
          ribbonPt(this.buf, j, th, t + time * 0.05, [30, 62, 16][k] * sc, 0.4, [4, 10, 3][k] * sc, time, o);
        } else if (q < 0.72) {
          const an = Math.PI * (q - 0.46) / 0.26 + time * 0.04, rx = c.R * Math.cos(an);
          o[0] = rx * Math.cos(t) + 2.2 * sc * th.amp * Math.sin(th.k1 * t + th.p1 + time * 0.4); o[1] = c.R * Math.sin(t);
        } else {
          const la = -1.3 + 2.6 * (q - 0.72) / 0.16, rr = c.R * Math.cos(la);
          o[0] = rr * Math.cos(t); o[1] = rr * 0.24 * Math.sin(t) + c.R * Math.sin(la) * 0.94 + 1.5 * sc * th.amp * Math.sin(th.k1 * t + th.p1);
        }
        rot(o, c.rot * Math.PI / 180); o[0] += c.cx; o[1] += c.cy;
      },
      al: (th) => th.q < 0.36 ? 0.38 : th.q < 0.46 ? 0.2 : th.q < 0.72 ? 0.26 : th.q < 0.88 ? 0.2 : 0.4,
      lw: (th) => th.q < 0.36 ? 1 : 0.8,
      ext: (c) => [c.cx - c.rx, c.cx + c.rx], core: (c) => [c.cx, c.cy, 0]
    },
    { // heart: the infinity opens at its crossing point
      cfg: [{ cx: 960, cy: 486, k: 288, rot: 0 }, { cx: 195, cy: 438, k: 150, rot: 0 }],
      mid: 0.45, bg: [[1260, 380, 1.15, 640, 700, 1.0], [300, 330, 1.1, 80, 600, 1.0]],
      buf: mkBuf(), prep(time, c) { prep(this.buf, heartC, c.k, 0); },
      pt(th, j, s, time, c, o) {
        const k = kind(th.q), sc = c.k / 288, t = s * 6.2832;
        th.ph = [0.9, 0.3, 0.9][k];
        ribbonPt(this.buf, j, th, t, [44, 80, 22][k] * sc, [0.45, 0.2, 0.45][k], [5, 12, 3][k] * sc, time, o);
        o[0] += c.cx; o[1] += c.cy;
      },
      al: (th) => [0.38, 0.2, 0.42][kind(th.q)], lw: (th) => [1.05, 0.8, 0.9][kind(th.q)],
      ext: (c) => [c.cx - c.k * 1.0, c.cx + c.k * 1.0], core: (c) => [c.cx, c.cy - c.k * 0.1, c.k * 0.62]
    }
  ];

  // ---- canvases
  const $ = (id) => document.getElementById(id);
  const cv = $('threads'), gl = $('glow'), fr = $('front'), core = $('core'), b1 = $('blobPink'), b2 = $('blobBlue');
  let ctx, gctx, fctx, dpr, frontClean = false, coreOn = null;
  function size() {
    layout(); dpr = Math.min(window.devicePixelRatio || 1, 2); if (!SHOT) dpr = Math.max(1, Math.min(dpr, 1.6, Math.sqrt(3.0e6 / (lay.iw * lay.ih))));
    for (const [c, k] of [[cv, dpr], [fr, dpr]]) { c.width = Math.round(lay.iw * k); c.height = Math.round(lay.ih * k); c.style.width = lay.iw + 'px'; c.style.height = lay.ih + 'px'; }
    // glow: a quarter-size canvas is blurred while it is small (cheap) and only then scaled up by the compositor
    gl.width = Math.ceil(lay.iw / 4); gl.height = Math.ceil(lay.ih / 4); gl.style.width = gl.width + 'px'; gl.style.height = gl.height + 'px'; gl.style.transformOrigin = '0 0'; gl.style.transform = 'scale(4)';
    ctx = cv.getContext('2d'); fctx = fr.getContext('2d'); gctx = gl.getContext('2d');
    gl.style.filter = 'blur(' + (lay.portrait ? 2.5 : Math.max(2.5, 5.5 * lay.px)) + 'px)';
    frontClean = false;
  }

  const X = new Float32Array(250 * 111), Y = new Float32Array(250 * 111), pA = [0, 0], pB = [0, 0];
  const lerp = (a, b, f) => a + (b - a) * f, sm = (f) => f * f * (3 - 2 * f), clamp = (v) => Math.max(0, Math.min(1, v));
  const beat = (time) => { const u = (time % 1.9) / 1.9; return Math.exp(-Math.pow((u - 0.12) / 0.055, 2)) + 0.6 * Math.exp(-Math.pow((u - 0.31) / 0.07, 2)); };
  let pointer = [0, 0], ptarget = [0, 0];

  function frame(p, time) {
    const { px, ox, oy, portrait, iw, ih } = lay, o = portrait ? 1 : 0;
    p = Math.max(0, Math.min(SCENES.length - 1, p));
    const i = Math.min(Math.floor(p), SCENES.length - 2), f = p - i, A = SCENES[i], B = SCENES[i + 1], ca = A.cfg[o], cb = B.cfg[o];
    const pulse = reduce || SHOT ? 0.25 : beat(time), wpulse = 1 + 0.05 * pulse;
    const sx = ox + pointer[0] * 14 * px, sy = oy + pointer[1] * 10 * px;
    // points
    if (f < 1) A.prep(time, ca); if (f > 0) B.prep(time, cb);
    for (let k = 0; k < N; k++) {
      const th = TH[k], ft = f <= 0 ? 0 : f >= 1 ? 1 : sm(clamp(f * 1.5 - th.r * 0.5));
      for (let j = 0; j < M; j++) {
        const s = j / M;
        if (ft < 1) A.pt(th, j, s, time, ca, pA);
        if (ft > 0) B.pt(th, j, s, time, cb, pB);
        const x = ft <= 0 ? pA[0] : ft >= 1 ? pB[0] : lerp(pA[0], pB[0], ft), y = ft <= 0 ? pA[1] : ft >= 1 ? pB[1] : lerp(pA[1], pB[1], ft);
        X[k * M + j] = sx + x * px; Y[k * M + j] = sy + y * px;
      }
      th._al = lerp(A.al(th), B.al(th), ft) * th.al; th._lw = lerp(A.lw(th), B.lw(th), ft) * th.w;
    }
    const fe = sm(f), ea = A.ext(ca), eb = B.ext(cb), g0 = sx + lerp(ea[0], eb[0], fe) * px, g1 = sx + lerp(ea[1], eb[1], fe) * px, mid = lerp(A.mid, B.mid, fe);
    const mk = (c, white) => { const g = c.createLinearGradient(g0, 0, g1, 0);
      if (white) { g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.42, 'rgba(255,255,255,.95)'); g.addColorStop(0.5, 'rgba(255,255,255,' + mid + ')'); g.addColorStop(0.58, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,.95)'); }
      else { g.addColorStop(0, BLUE_D); g.addColorStop(0.34, BLUE); g.addColorStop(0.47, 'rgba(206,176,214,' + mid + ')'); g.addColorStop(0.53, 'rgba(206,176,214,' + mid + ')'); g.addColorStop(0.66, PINK); g.addColorStop(1, PINK_D); } return g; };
    const path = (c, k, sc) => { c.beginPath(); const b = k * M; c.moveTo(X[b] * sc, Y[b] * sc); for (let j = 1; j < M; j++) c.lineTo(X[b + j] * sc, Y[b + j] * sc); c.closePath(); };
    const lwU = (portrait ? 0.62 : Math.max(px, 0.55)) * dpr;
    // main canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.lineJoin = 'bevel';
    const gc = mk(ctx, false), gw = mk(ctx, true);
    // gradient coordinates are in css px, so scale the context instead of the points
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // threads with the same colour, opacity step and width step go into one path: a few dozen strokes instead of hundreds
    const groups = new Map();
    for (let k = 0; k < N; k++) { const th = TH[k], key = (kind(th.q) === 2 ? 1000 : 0) + Math.round(th._al * 14) * 10 + Math.round(th._lw * 3); let g = groups.get(key); if (!g) groups.set(key, g = []); g.push(k); }
    const sub = (c, k) => { const b = k * M; c.moveTo(X[b], Y[b]); for (let j = 1; j < M; j++) c.lineTo(X[b + j], Y[b + j]); c.closePath(); };
    for (const [key, list] of groups) { ctx.beginPath(); for (const k of list) sub(ctx, k); ctx.strokeStyle = key >= 1000 ? gw : gc; ctx.globalAlpha = Math.min(1, (Math.floor(key % 1000 / 10) / 14) * 1.12 * (portrait ? 0.85 : 1)); ctx.lineWidth = Math.max(0.5, (key % 10) / 3) * lwU / dpr * wpulse; ctx.stroke(); }
    // falling stars: lights glide along the threads without steps (position is interpolated between
    // thread points) and leave a tail that fades out
    ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineCap = 'round';
    const base = (portrait ? 0.95 : Math.max(px, 0.62)) * 1.15, SP = small ? 16 : 30, TS = 7;
    for (let n = 0; n < SP; n++) {
      const k = (n * 7 + 3) % N, sp = 0.014 + ((n * 37) % 11) * 0.0026, pos = (n * 0.137 + time * sp) % 1, tl = 0.034 + ((n * 13) % 7) * 0.007;
      const tw = 0.72 + 0.28 * Math.sin(time * 1.3 + n * 2.1), size = base * (0.8 + (n % 4) * 0.22);
      // the tail is one stroke with a gradient from transparent to white
      let px0 = 0, py0 = 0, tx = 0, ty = 0; ctx.beginPath();
      for (let q = 0; q <= TS; q++) {
        const u = (((pos - tl * (1 - q / TS)) % 1) + 1) % 1 * M, i = Math.floor(u), g = u - i, a0 = k * M + i, b0 = k * M + (i + 1) % M;
        px0 = X[a0] + (X[b0] - X[a0]) * g; py0 = Y[a0] + (Y[b0] - Y[a0]) * g;
        if (q === 0) { tx = px0; ty = py0; ctx.moveTo(px0, py0); } else ctx.lineTo(px0, py0);
      }
      const tg = ctx.createLinearGradient(tx, ty, px0, py0); tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(1, 'rgba(255,255,255,.95)');
      ctx.strokeStyle = tg; ctx.globalAlpha = tw; ctx.lineWidth = size * 1.5; ctx.stroke();
      ctx.globalAlpha = 0.14 * tw; ctx.beginPath(); ctx.arc(px0, py0, size * 5.2, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 0.3 * tw; ctx.beginPath(); ctx.arc(px0, py0, size * 2.5, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 0.98; ctx.beginPath(); ctx.arc(px0, py0, size * 1.15, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // glow layer (half resolution, blurred by css)
    gctx.setTransform(0.25, 0, 0, 0.25, 0, 0); gctx.clearRect(0, 0, iw + 8, ih + 8); gctx.strokeStyle = mk(gctx, false); gctx.lineWidth = (portrait ? 5 : 8 * px) * wpulse; gctx.lineJoin = 'bevel';
    gctx.globalAlpha = 0.3; gctx.beginPath(); for (let k = 0; k < N; k += 4) { if (kind(TH[k].q) !== 2) sub(gctx, k); } gctx.stroke();
    // the part of the orbit that passes in front of the cards
    const near = clamp(1 - Math.abs(p - 2) * 4);
    if (near > 0 || !frontClean) { fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, iw, ih); fr.style.opacity = near; frontClean = near <= 0; }
    if (near > 0) { const c = SCENES[2].cfg[o], a = c.rot * Math.PI / 180, cx = sx + c.cx * px, cy = sy + c.cy * px, d = 4000, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
      fctx.save(); fctx.beginPath(); fctx.moveTo(cx - ux * d, cy - uy * d); fctx.lineTo(cx + ux * d, cy + uy * d); fctx.lineTo(cx + ux * d + vx * d, cy + uy * d + vy * d); fctx.lineTo(cx - ux * d + vx * d, cy - uy * d + vy * d); fctx.closePath(); fctx.clip();
      const g2 = mk(fctx, false), w2 = mk(fctx, true); fctx.lineJoin = 'bevel';
      for (const [key, list] of groups) { fctx.beginPath(); let any = false; for (const k of list) { if (TH[k].q < 0.36) { sub(fctx, k); any = true; } } /* only the dense core of the orbit goes in front of the cards */ if (!any) continue; fctx.strokeStyle = key >= 1000 ? w2 : g2; fctx.globalAlpha = Math.min(1, (Math.floor(key % 1000 / 10) / 14) * 1.12); fctx.lineWidth = Math.max(0.5, (key % 10) / 3) * lwU / dpr; fctx.stroke(); }
      fctx.restore(); }
    // core light and background colour fields
    const k1 = A.core(ca), k2 = B.core(cb), cr = lerp(k1[2], k2[2], fe) * px * (1 + 0.1 * pulse);
    core.style.transform = 'translate(' + (sx + lerp(k1[0], k2[0], fe) * px - 200) + 'px,' + (sy + lerp(k1[1], k2[1], fe) * px - 200) + 'px) scale(' + (cr / 200) + ')'; if ((cr > 1) !== coreOn) { coreOn = cr > 1; core.style.opacity = coreOn ? 1 : 0; }
    const ba = A.bg[o], bb = B.bg[o], br = (portrait ? 330 : 820) * px, drift = SHOT || reduce ? 0 : time;
    const place = (el, x, y, s, ph) => { const r = br * s; el.style.transform = 'translate(' + (ox + x * px - 500 + Math.sin(drift * 0.11 + ph) * 26 * px) + 'px,' + (oy + y * px - 500 + Math.cos(drift * 0.09 + ph) * 22 * px) + 'px) scale(' + (r / 500) + ')'; };
    place(b1, lerp(ba[0], bb[0], fe), lerp(ba[1], bb[1], fe), lerp(ba[2], bb[2], fe), 0); place(b2, lerp(ba[3], bb[3], fe), lerp(ba[4], bb[4], fe), lerp(ba[5], bb[5], fe), 2);
  }

  // ---- run
  const slides = [...document.querySelectorAll('.slide')];
  const progress = () => SHOT ? window.DECK_START : (window.scrollY || document.documentElement.scrollTop) / innerHeight;
  size();
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('in', e.isIntersecting)), { threshold: 0.45 }); slides.forEach((s) => io.observe(s)); } else slides.forEach((s) => s.classList.add('in'));
  if (SHOT) slides.forEach((s) => s.classList.add('in'));
  frame(progress(), 0);
  if (SHOT) return;
  addEventListener('resize', () => { size(); frame(progress(), performance.now() / 1000); });
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') ptarget = [e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5]; });
  addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ' ': 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[e.key]; if (!d) return; e.preventDefault(); const n = Math.max(0, Math.min(slides.length - 1, Math.round(progress()) + d)); scrollTo({ top: n * innerHeight, behavior: 'smooth' }); });
  let slow = 0, frames = 0, last = performance.now();
  if (reduce) { addEventListener('scroll', () => frame(progress(), 0), { passive: true }); return; }
  (function loop(now) {
    const dt = now - last; last = now;
    if (!document.hidden) { pointer[0] += (ptarget[0] - pointer[0]) * 0.05; pointer[1] += (ptarget[1] - pointer[1]) * 0.05; frame(progress(), now / 1000);
      if (++frames > 20 && frames < 140) { if (dt > 30) slow++; if (frames === 139 && slow > 60 && N > 110) N = Math.round(N * 0.6); } }   // slower devices get fewer threads
    requestAnimationFrame(loop);
  })(last);
})();
