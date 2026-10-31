/* 점전하의 전기장·전기력: 전기력선 / 격자 화살표, 탐침점 P의 E(= 각 전하의 E 합), E = 0 인 점, 전하가 받는 힘 */
SIM.register('efield', {
  title: '점전하가 만드는 전기장과 전기력',
  hint: '전하량을 바꾸고 전하를 끌어 옮겨 보세요. 빈 곳을 누르거나 끌면 탐침점 P가 움직여요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.02 : 0.6, maxH: 560 });
    const K = 9e7;                                    // E(N/C) = 9×10⁷·q(μC)/r²(cm²)
    const START = [[-6, 0, 2], [6, 0, -1], [0, -6.5, 1]];
    const Q = START.map(([x, y, q]) => ({ x, y, q }));
    const SUB = ['₁', '₂', '₃'];
    let three = false, mode = 'lines', showF = true, probe = { x: 0, y: 5 }, L = {}, cache = null;
    const fq = (v) => (v === 0 ? '0' : (v > 0 ? '+' : '−') + Math.abs(v).toFixed(1)) + ' μC';
    const sl = Q.map((c, i) => kit.slider({ label: `전하량 q${SUB[i]}`, min: -3, max: 3, step: 0.5, value: c.q, fmt: fq, onInput: (v) => { c.q = v; cache = null; render(); } }));
    const t3 = kit.toggle({ label: '세 번째 전하 q₃ 넣기', value: false, onChange: (b) => { three = b; sl[2].el.closest('.sim-field').style.display = b ? '' : 'none'; cache = null; render(); } });
    sl[2].el.closest('.sim-field').style.display = 'none';
    t3.el.closest('.sim-field').after(sl[2].el.closest('.sim-field'));   // q₃ 슬라이더를 켜기 버튼 뒤로
    kit.select({ label: '보기', options: [['lines', '전기력선'], ['grid', '전기장 화살표 (격자)']], value: mode, onChange: (v) => { mode = v; render(); } });
    kit.toggle({ label: '전하가 받는 전기력 (빨강)', value: true, onChange: (b) => { showF = b; render(); } });
    kit.button('↺ 처음 배치', () => { START.forEach(([x, y], i) => { Q[i].x = x; Q[i].y = y; }); probe = { x: 0, y: 5 }; cache = null; render(); });
    const rE = kit.readout('P의 E (N/C)'), rZ = kit.readout('E = 0 인 점'), rR = kit.readout('q₁–q₂ 거리'), rF = kit.readout('q₁–q₂ 사이 힘');
    if (narrow) kit.root.querySelector('.sim-outs').style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    kit.note('전기장의 방향은 (+)전하가 받는 힘의 방향이에요. 전기력선은 (+)전하에서 나와 (−)전하로 들어가고, 촘촘한 곳일수록 전기장이 세요. P의 E는 각 전하가 만든 전기장(점선 E₁, E₂ …)의 벡터 합이에요.');
    kit.note('두 전하만 있을 때: 부호가 같으면 E = 0인 점이 두 전하 <b>사이</b>, 다르면 <b>바깥쪽</b>에 생기고, 어느 쪽이든 크기가 작은 전하에 더 가까워요.');

    const act = () => Q.slice(0, three ? 3 : 2);
    const live = () => act().filter((c) => c.q !== 0);
    function E0(x, y, cs = act()) {                   // 상수 K를 뺀 전기장 (y 위쪽 +)
      let ex = 0, ey = 0;
      for (const c of cs) { const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy, k = c.q / (r2 * Math.sqrt(r2)); ex += k * dx; ey += k * dy; }
      return [ex, ey];
    }
    function layout() {
      const { W, H } = cv, s = Math.min(W, H * 1.3) / 30;
      L = { W, H, s, cx: W / 2, cy: H / 2, xh: W / 2 / s, yh: H / 2 / s };
    }
    const SX = (x) => L.cx + x * L.s, SY = (y) => L.cy - y * L.s;
    const RC = () => (narrow ? 13 : 15);              // 전하 반지름(px)

    // ── 전기력선: (+)에서 출발해 E 방향으로, (−)에서 출발해 −E 방향으로(양전하에 닿지 않고 무한히 가는 선만)
    function traceLines() {
      const cs = live(), r0 = (RC() - 2) / L.s, h = 3.2 / L.s, lines = [];
      const dir = (x, y, sg) => { const [ex, ey] = E0(x, y, cs), m = Math.hypot(ex, ey); return m < 1e-14 ? null : [sg * ex / m, sg * ey / m]; };
      function trace(x, y, sg) {
        const pts = [[x, y]]; let prev = null;
        for (let n = 0; n < 1600; n++) {
          const k1 = dir(x, y, sg); if (!k1 || (prev && k1[0] * prev[0] + k1[1] * prev[1] < 0)) break;
          const k2 = dir(x + k1[0] * h / 2, y + k1[1] * h / 2, sg); if (!k2) break;
          const k3 = dir(x + k2[0] * h / 2, y + k2[1] * h / 2, sg); if (!k3) break;
          const k4 = dir(x + k3[0] * h, y + k3[1] * h, sg); if (!k4) break;
          x += h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6; y += h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
          prev = k1; pts.push([x, y]);
          for (const c of cs) if (Math.sign(c.q) === -sg && Math.hypot(x - c.x, y - c.y) < r0) { pts.push([c.x, c.y]); return { pts, hit: true }; }
          if (Math.abs(x) > L.xh + 3 || Math.abs(y) > L.yh + 3) break;
        }
        return { pts, hit: false };
      }
      for (const c of cs) {
        const n = Math.max(2, Math.round(Math.abs(c.q) * (narrow ? 6 : 8))), sg = Math.sign(c.q);
        let off = 0, best = 1e9;
        for (const o of cs) if (o !== c) { const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < best) { best = d; off = Math.atan2(o.y - c.y, o.x - c.x); } }
        for (let i = 0; i < n; i++) {
          const a = off + 2 * Math.PI * i / n, res = trace(c.x + r0 * Math.cos(a), c.y + r0 * Math.sin(a), sg);
          if (sg < 0 && res.hit) continue;            // 양전하에서 이미 그린 선
          const pts = [[c.x, c.y], ...res.pts];
          lines.push(sg > 0 ? pts : pts.reverse());
        }
      }
      return lines;
    }
    // ── E = 0 인 점: 두 전하면 공식, 세 전하면 격자 최솟값에서 뉴턴법
    function zeros() {
      const cs = live();
      if (cs.length < 2) return [];
      if (cs.length === 2) {
        const [a, b] = cs, ra = Math.sqrt(Math.abs(a.q)), rb = Math.sqrt(Math.abs(b.q));
        let t;
        if (a.q * b.q > 0) t = ra / (ra + rb); else if (ra === rb) return []; else t = ra / (ra - rb);
        return [{ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, t, a, b }];
      }
      const out = [], nx = 40, ny = Math.round(nx * L.yh / L.xh), g = [];
      const P = (i, j) => [-L.xh + 2 * L.xh * i / nx, -L.yh + 2 * L.yh * j / ny];
      for (let j = 0; j <= ny; j++) { g.push([]); for (let i = 0; i <= nx; i++) { const [x, y] = P(i, j); g[j].push(cs.some((c) => Math.hypot(x - c.x, y - c.y) < 1) ? Infinity : Math.hypot(...E0(x, y, cs))); } }
      for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
        const v = g[j][i]; let isMin = v < Infinity;
        for (let dj = -1; dj <= 1 && isMin; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && g[j + dj][i + di] <= v) { isMin = false; break; }
        if (!isMin) continue;
        let [x, y] = P(i, j), ok = false;
        for (let it = 0; it < 40; it++) {
          let ex = 0, ey = 0, a = 0, b = 0, d = 0;
          for (const c of cs) { const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy, r3 = r2 * Math.sqrt(r2), r5 = r3 * r2; ex += c.q * dx / r3; ey += c.q * dy / r3; a += c.q * (1 / r3 - 3 * dx * dx / r5); b += c.q * (-3 * dx * dy / r5); d += c.q * (1 / r3 - 3 * dy * dy / r5); }
          const det = a * d - b * b; if (Math.abs(det) < 1e-18) break;
          const sx = -(d * ex - b * ey) / det, sy = -(-b * ex + a * ey) / det;
          x += sx; y += sy; if (Math.hypot(sx, sy) < 1e-7) { ok = true; break; }
        }
        if (ok && Math.abs(x) < L.xh && Math.abs(y) < L.yh && !cs.some((c) => Math.hypot(x - c.x, y - c.y) < 0.5) && !out.some((p) => Math.hypot(p.x - x, p.y - y) < 0.1)) out.push({ x, y });
      }
      return out;
    }

    function tag(ctx, str, x, y, color, size = 12, align = 'center') {
      ctx.save(); ctx.font = `700 ${size}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
      const w = ctx.measureText(str).width + 8, x0 = align === 'left' ? x - 4 : align === 'right' ? x - w + 4 : x - w / 2;
      ctx.fillStyle = kit.C.bg; ctx.globalAlpha = 0.85; ctx.fillRect(x0, y - size * 0.7, w, size * 1.4); ctx.restore();
      kit.draw.text(ctx, str, x, y, { color, size, bold: true, align });
    }
    const sci = (v) => { if (v < 1e-9) return '0'; const e = Math.floor(Math.log10(v)), m = v / 10 ** e; const sup = String(e).split('').map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(ch)]).join(''); return `${m.toFixed(1)}×10${sup}`; };

    function render() {
      layout();
      const { ctx, W, H } = cv, C = kit.C, D = kit.draw, cs = act();
      ctx.clearRect(0, 0, W, H);
      if (mode === 'lines') {
        if (!cache) cache = traceLines();
        for (const ln of cache) {
          const sp = ln.map(([x, y]) => [SX(x), SY(y)]);
          ctx.globalAlpha = 0.8; D.line(ctx, sp, C.purple, 1.5); ctx.globalAlpha = 1;
          const vis = sp.filter(([x, y]) => x > 0 && x < W && y > 0 && y < H);   // 보이는 부분의 가운데에 화살촉
          let tot = 0; for (let i = 1; i < vis.length; i++) tot += Math.hypot(vis[i][0] - vis[i - 1][0], vis[i][1] - vis[i - 1][1]);
          if (tot < 40) continue;
          let acc = 0;
          for (let i = 1; i < vis.length; i++) {
            acc += Math.hypot(vis[i][0] - vis[i - 1][0], vis[i][1] - vis[i - 1][1]);
            if (acc >= tot * 0.5) { const [x0, y0] = vis[Math.max(0, i - 3)], [x1, y1] = vis[i]; if (Math.hypot(x1 - x0, y1 - y0) > 2) D.arrow(ctx, x0, y0, x1, y1, C.purple, 1.5, 8); break; }
          }
        }
      } else {
        const g = narrow ? 28 : 34, ox = ((W % g) + g) / 2, oy = ((H % g) + g) / 2;
        for (let py = oy; py < H - 4; py += g) for (let px = ox; px < W - 4; px += g) {
          if (cs.some((c) => Math.hypot(px - SX(c.x), py - SY(c.y)) < RC() + 8)) continue;
          const [ex, ey] = E0((px - L.cx) / L.s, (L.cy - py) / L.s), m = Math.hypot(ex, ey) * K;
          const t = Math.min(1, Math.sqrt(m / 3e6)), len = g * 0.8 * t; if (len < 3) continue;
          const ux = ex / Math.hypot(ex, ey), uy = -ey / Math.hypot(ex, ey);
          ctx.globalAlpha = 0.3 + 0.7 * t; D.arrow(ctx, px - ux * len / 2, py - uy * len / 2, px + ux * len / 2, py + uy * len / 2, C.purple, 1.6, 5.5); ctx.globalAlpha = 1;
        }
      }
      // E = 0 인 점
      const zs = zeros();
      zs.forEach((z) => {
        if (Math.abs(z.x) < L.xh - 0.3 && Math.abs(z.y) < L.yh - 0.3) { D.circle(ctx, SX(z.x), SY(z.y), 6, { fill: C.bg, stroke: C.green, width: 2.4 }); tag(ctx, 'E = 0', SX(z.x), SY(z.y) - 17, C.green, 12); }
      });
      if (live().length === 2) { const [a, b] = live(); D.line(ctx, [[SX(a.x), SY(a.y)], [SX(b.x), SY(b.y)]], C.muted, 1, [3, 5]); }
      // 전하가 받는 힘 (F = 90·q₁q₂/r² N)
      const forces = cs.map((c) => { let fx = 0, fy = 0; for (const o of cs) if (o !== c) { const dx = c.x - o.x, dy = c.y - o.y, r2 = dx * dx + dy * dy, k = 90 * c.q * o.q / (r2 * Math.sqrt(r2)); fx += k * dx; fy += k * dy; } return [fx, fy]; });
      if (showF) {
        const fmax = Math.max(1e-9, ...forces.map((f) => Math.hypot(...f))), kf = Math.min(36, 60 / fmax);
        cs.forEach((c, i) => {
          const [fx, fy] = forces[i], m = Math.hypot(fx, fy), len = m * kf; if (len < 4) return;
          const ux = fx / m, uy = -fy / m, x0 = SX(c.x) + ux * RC(), y0 = SY(c.y) + uy * RC();
          D.arrow(ctx, x0, y0, x0 + ux * len, y0 + uy * len, C.bg, 7.5, 13); D.arrow(ctx, x0, y0, x0 + ux * len, y0 + uy * len, C.red, 3.4, 11);
        });
      }
      // 전하
      cs.forEach((c, i) => {
        const x = SX(c.x), y = SY(c.y), r = RC(), col = c.q > 0 ? C.red : c.q < 0 ? C.blue : C.muted;
        D.circle(ctx, x, y, r + 2.5, { fill: C.bg }); D.circle(ctx, x, y, r, { fill: col });
        D.line(ctx, [[x - r * 0.45, y], [x + r * 0.45, y]], '#fff', 2.6);
        if (c.q > 0) D.line(ctx, [[x, y - r * 0.45], [x, y + r * 0.45]], '#fff', 2.6);
        tag(ctx, 'q' + SUB[i], x - r - 9, y - r - 6, col, 12);
      });
      // 탐침 P: 각 전하의 E와 합성 E (같은 비율)
      const parts = live().map((c, i) => { const [ex, ey] = E0(probe.x, probe.y, [c]); return [ex * K, ey * K, 'E' + SUB[Q.indexOf(c)]]; });
      const [Ex, Ey] = E0(probe.x, probe.y).map((v) => v * K), Em = Math.hypot(Ex, Ey);
      const k = (narrow ? 70 : 90) / Math.max(Em, ...parts.map((p) => Math.hypot(p[0], p[1])), 1e-9);
      const px = SX(probe.x), py = SY(probe.y), labs = [], dirs = [];
      [...(parts.length > 1 ? parts : []), [Ex, Ey, 'E']].forEach(([ex, ey, nm]) => {
        const m = Math.hypot(ex, ey), len = m * k; if (len < 5) return;
        const ux = ex / m, uy = -ey / m, x1 = px + ux * len, y1 = py + uy * len;
        dirs.push(Math.atan2(uy, ux));
        if (nm === 'E') { D.arrow(ctx, px, py, x1, y1, C.bg, 7, 13); D.arrow(ctx, px, py, x1, y1, C.purple, 3.4, 11); }
        else { ctx.setLineDash([5, 3]); D.arrow(ctx, px, py, x1, y1, C.purple, 1.6, 7); ctx.setLineDash([]); }
        let lx = x1 + ux * 12, ly = y1 + uy * 12;
        if (cs.some((c) => Math.hypot(lx - SX(c.x), ly - SY(c.y)) < RC() + 12)) { lx = x1 - uy * 15; ly = y1 + ux * 15; }   // 전하와 겹치면 옆으로
        labs.push([nm, Math.max(14, Math.min(W - 14, lx)), Math.max(12, Math.min(H - 12, ly)), nm === 'E' ? 13 : 11]);
      });
      labs.forEach(([nm, x, y, sz]) => tag(ctx, nm, x, y, C.purple, sz));
      D.circle(ctx, px, py, 6.5, { fill: C.bg, stroke: C.orange, width: 2.4 });
      let ang = 0, bestD = -1;                         // P 라벨은 화살표들과 가장 먼 방향에
      for (let a = 0; a < 8; a++) {
        const th = (a + 0.5) * Math.PI / 4, dm = Math.min(Math.PI, ...dirs.map((d) => Math.abs(Math.atan2(Math.sin(th - d), Math.cos(th - d)))));
        if (dm > bestD) { bestD = dm; ang = th; }
      }
      tag(ctx, 'P', px + Math.cos(ang) * 17, py + Math.sin(ang) * 17, C.orange, 12);
      // 읽기
      rE.set(sci(Em));
      if (live().length === 2) {
        const z = zs[0];
        if (!z) rZ.set('없음');
        else {
          const d = Math.hypot(z.b.x - z.a.x, z.b.y - z.a.y), na = 'q' + SUB[Q.indexOf(z.a)], nb = 'q' + SUB[Q.indexOf(z.b)];
          const f1 = (v) => (v < 10 ? v.toFixed(1) : v.toFixed(0)) + ' cm';
          rZ.set(z.t > 0 && z.t < 1 ? `${na}에서 ${f1(z.t * d)}` : z.t >= 1 ? `${nb} 바깥 ${f1((z.t - 1) * d)}` : `${na} 바깥 ${f1(-z.t * d)}`);
        }
      } else if (live().length === 3) rZ.set(zs.length ? `${zs.length}곳 (그림)` : '화면 안에 없음');
      else rZ.set('—');
      const [a, b] = Q, r = Math.hypot(a.x - b.x, a.y - b.y), F = 90 * Math.abs(a.q * b.q) / (r * r);
      rR.set(r.toFixed(1) + ' cm');
      rF.set(a.q * b.q === 0 ? '0 N' : `${a.q * b.q > 0 ? '척력' : '인력'} ${F < 10 ? F.toFixed(2) : F.toFixed(1)} N`);
    }

    let drag = null;
    function toWorld(x, y) { return { x: Math.max(-L.xh + 0.6, Math.min(L.xh - 0.6, (x - L.cx) / L.s)), y: Math.max(-L.yh + 0.6, Math.min(L.yh - 0.6, (L.cy - y) / L.s)) }; }
    kit.pointer(cv.el, {
      down(x, y) {
        let best = null, bd = RC() + 12;
        act().forEach((c) => { const d = Math.hypot(x - SX(c.x), y - SY(c.y)); if (d < bd) { bd = d; best = c; } });
        drag = best || 'probe'; this.move(x, y);
      },
      move(x, y) {
        if (!drag) return;
        const p = toWorld(x, y);
        if (drag === 'probe') probe = p;
        else if (!act().some((o) => o !== drag && Math.hypot(o.x - p.x, o.y - p.y) < 2)) { drag.x = p.x; drag.y = p.y; cache = null; }
        render();
      },
      up() { drag = null; },
    });
    cv.onResize(() => { cache = null; render(); });
    new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');   // 시스템 다크 모드가 바뀌면 다시 그림
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', () => render()); else if (mq.addListener) mq.addListener(() => render()); }
    render();
  },
});
