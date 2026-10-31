/* 두 직선 전류의 자기장: 격자 화살표(방향·세기) + 탐침점 합성(B₁+B₂) + 두 도선을 잇는 직선 위 B 그래프와 B = 0 점 */
SIM.register('wire-field', {
  title: '두 직선 전류가 만드는 자기장',
  hint: '두 도선의 전류 세기와 방향을 바꿔 보세요. 그림을 끌면 탐침점 P가 움직이고, 아래 그래프를 누르면 P가 두 도선을 잇는 직선 위로 가요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.34 : 0.72, maxH: 640 });
    const XW = 5;                    // 도선 위치 x = ±5 cm (간격 10 cm)
    const XH = narrow ? 11 : 15;     // 그림 가로 반폭 (cm)
    const BMAX = 60;                 // 그래프 세로 범위 (μT)
    let I1 = 4, I2 = 2, probe = { x: 0, y: 3.5 }, L = {};
    const fmtI = (v) => (v === 0 ? '0 A' : `${Math.abs(v).toFixed(1)} A ${v > 0 ? '⊙ 나옴' : '⊗ 들어감'}`);
    kit.slider({ label: '왼쪽 도선 전류 I₁', min: -5, max: 5, step: 0.5, value: I1, fmt: fmtI, onInput: (v) => { I1 = v; render(); } });
    kit.slider({ label: '오른쪽 도선 전류 I₂', min: -5, max: 5, step: 0.5, value: I2, fmt: fmtI, onInput: (v) => { I2 = v; render(); } });
    const rb1 = kit.readout('P의 B₁'), rb2 = kit.readout('P의 B₂'), rb = kit.readout('P의 합성 B'), rz = kit.readout('B = 0 인 점');
    if (narrow) kit.root.querySelector('.sim-outs').style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    kit.note('오른손 엄지를 전류 방향으로 향하면 감아쥔 네 손가락 방향이 자기장 방향이에요. 세기는 전류에 비례하고 도선에서의 거리에 반비례해요 (B ∝ I/r).');
    kit.note('두 전류가 같은 방향이면 B = 0인 점이 두 도선 <b>사이</b>에, 반대 방향이면 <b>바깥쪽</b>에 생기고, 어느 쪽이든 전류가 약한 도선에 더 가까워요.');

    const wires = () => [{ x: -XW, I: I1, name: 'I₁' }, { x: XW, I: I2, name: 'I₂' }];
    // 자기장 (μT, 위쪽 +): B = 20·I/r (r: cm), 방향 = 반시계(⊙)
    function field(x, y) {
      let bx = 0, by = 0; const parts = [];
      for (const w of wires()) {
        const rx = x - w.x, ry = y, r2 = Math.max(1e-6, rx * rx + ry * ry), k = 20 * w.I / r2;
        parts.push([-k * ry, k * rx]); bx += -k * ry; by += k * rx;
      }
      return { bx, by, parts };
    }
    const lineB = (x) => 20 * I1 / (x + XW) + 20 * I2 / (x - XW);
    const zeroX = () => (I1 === 0 || I2 === 0 || I1 + I2 === 0 ? null : XW * (I1 - I2) / (I1 + I2));

    function layout() {
      const { W, H } = cv, m = narrow ? 30 : 40, fh = Math.round(H * 0.6);
      L = { W, H, m, fh, s: (W - 2 * m) / (2 * XH), cx: W / 2, cy: fh / 2, gy: fh + 34, gh: H - fh - 62 };
    }
    const SX = (x) => L.cx + x * L.s, SY = (y) => L.cy - y * L.s;

    function tag(ctx, str, x, y, color, size = 12, align = 'center', bold = true) {
      ctx.save(); ctx.font = `${bold ? 700 : 500} ${size}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
      const w = ctx.measureText(str).width + 8, x0 = align === 'left' ? x - 4 : align === 'right' ? x - w + 4 : x - w / 2;
      ctx.fillStyle = kit.C.bg; ctx.globalAlpha = 0.85; ctx.fillRect(x0, y - size * 0.7, w, size * 1.4); ctx.restore();
      kit.draw.text(ctx, str, x, y, { color, size, bold, align });
    }
    function circArrow(ctx, x, y, I, color) {   // 도선 둘레 회전 방향 표시
      if (I === 0) return;
      const r = 21, ccw = I > 0, a0 = -0.6, span = 4.9, n = 24, pts = [];
      for (let k = 0; k <= n; k++) { const a = a0 + (ccw ? -1 : 1) * span * k / n; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
      ctx.save(); ctx.globalAlpha = 0.9; kit.draw.line(ctx, pts.slice(0, -1), color, 1.6);
      kit.draw.arrow(ctx, pts[n - 3][0], pts[n - 3][1], pts[n][0], pts[n][1], color, 1.6, 7); ctx.restore();
    }
    function wire(ctx, w) {
      const C = kit.C, x = SX(w.x), y = SY(0);
      circArrow(ctx, x, y, w.I, C.purple);
      kit.draw.circle(ctx, x, y, 12, { fill: C.card, stroke: C.fg, width: 2 });
      if (w.I > 0) kit.draw.circle(ctx, x, y, 3.6, { fill: C.fg });
      if (w.I < 0) { const d = 6; kit.draw.line(ctx, [[x - d, y - d], [x + d, y + d]], C.fg, 2); kit.draw.line(ctx, [[x - d, y + d], [x + d, y - d]], C.fg, 2); }
      tag(ctx, w.name, x, y + 33, C.fg, 13);
    }

    function render() {
      layout();
      const { ctx, W, H } = cv, C = kit.C, D = kit.draw;
      ctx.clearRect(0, 0, W, H);
      // ── 위: 종이면을 위에서 본 그림
      const g = narrow ? 26 : 34, ox = ((W % g) + g) / 2, oy = ((L.fh % g) + g) / 2;
      for (let py = oy; py < L.fh - 4; py += g) for (let px = ox; px < W - 4; px += g) {
        if (wires().some((w) => Math.hypot(px - SX(w.x), py - SY(0)) < 22)) continue;
        const f = field((px - L.cx) / L.s, (L.cy - py) / L.s), mag = Math.hypot(f.bx, f.by);
        const t = Math.min(1, Math.pow(mag / 35, 0.55)), len = g * 0.8 * t;
        if (len < 3) continue;
        const ux = f.bx / mag, uy = -f.by / mag;
        ctx.globalAlpha = 0.25 + 0.75 * t;
        D.arrow(ctx, px - ux * len / 2, py - uy * len / 2, px + ux * len / 2, py + uy * len / 2, C.purple, 1.6, 5.5);
        ctx.globalAlpha = 1;
      }
      D.line(ctx, [[8, SY(0)], [W - 8, SY(0)]], C.muted, 1.2, [5, 5]);
      tag(ctx, '위에서 본 모습 (⊙ 나옴, ⊗ 들어감)', 10, 13, C.muted, 11.5, 'left', false);
      wires().forEach((w) => wire(ctx, w));
      const z = zeroX();
      const zIn = z !== null && Math.abs(z) < XH - 0.3;
      if (zIn) {
        D.circle(ctx, SX(z), SY(0), 6, { fill: C.bg, stroke: C.green, width: 2.4 });
        tag(ctx, 'B = 0', SX(z), SY(0) - 17, C.green, 12);
      } else if (z !== null) tag(ctx, z > 0 ? 'B = 0 점 →' : '← B = 0 점', z > 0 ? W - 8 : 8, SY(0) - 15, C.green, 11.5, z > 0 ? 'right' : 'left');
      // 탐침 P: B₁, B₂ 와 합성 B (같은 비율로 그려 평행사변형 법칙이 보이게)
      const f = field(probe.x, probe.y), [b1, b2] = f.parts, mag = Math.hypot(f.bx, f.by);
      const m1 = Math.hypot(...b1), m2 = Math.hypot(...b2);
      const k = Math.min(5, (narrow ? 70 : 90) / Math.max(m1, m2, mag, 1e-9));
      const px = SX(probe.x), py = SY(probe.y), dirs = [], labs = [];
      wires().forEach((w) => D.line(ctx, [[SX(w.x), SY(0)], [px, py]], C.muted, 1, [2, 4]));
      [[b1[0], b1[1], 'B₁'], [b2[0], b2[1], 'B₂'], [f.bx, f.by, 'B']].forEach(([bx, by, nm]) => {
        const bm = Math.hypot(bx, by), len = bm * k;
        if (len < 5) return;
        const ux = bx / bm, uy = -by / bm, ex = px + ux * len, ey = py + uy * len;
        dirs.push(Math.atan2(uy, ux));
        if (nm === 'B') { D.arrow(ctx, px, py, ex, ey, C.bg, 7, 13); D.arrow(ctx, px, py, ex, ey, C.purple, 3.4, 11); }
        else { ctx.setLineDash([5, 3]); D.arrow(ctx, px, py, ex, ey, C.purple, 1.6, 7); ctx.setLineDash([]); }
        labs.push([nm, Math.max(14, Math.min(W - 14, ex + ux * 12)), Math.max(34, Math.min(L.fh - 10, ey + uy * 12)), nm === 'B' ? 13 : 11]);
      });
      labs.forEach(([nm, x, y, sz]) => tag(ctx, nm, x, y, C.purple, sz));
      let best = 0, bestD = -1;                       // P 라벨은 화살표들과 가장 먼 방향에
      for (let a = 0; a < 8; a++) {
        const th = (a + 0.5) * Math.PI / 4, dm = Math.min(Math.PI, ...dirs.map((d) => Math.abs(Math.atan2(Math.sin(th - d), Math.cos(th - d)))));
        if (dm > bestD) { bestD = dm; best = th; }
      }
      D.circle(ctx, px, py, 6.5, { fill: C.bg, stroke: C.orange, width: 2.4 });
      tag(ctx, 'P', px + Math.cos(best) * 17, py + Math.sin(best) * 17, C.orange, 12);
      // ── 아래: 두 도선을 잇는 직선 위의 B (위쪽 +)
      D.line(ctx, [[0, L.fh + 6], [W, L.fh + 6]], C.grid, 1);
      const x0 = L.m, x1 = W - L.m, gy = L.gy, gh = L.gh, GY = (b) => gy + gh / 2 - b / BMAX * gh / 2;
      [BMAX / 2, -BMAX / 2].forEach((b) => { D.line(ctx, [[x0, GY(b)], [x1, GY(b)]], C.grid, 1, [3, 4]); D.text(ctx, (b > 0 ? '+' : '−') + Math.abs(b), x0 - 4, GY(b), { size: 11, color: C.muted, align: 'right' }); });
      wires().forEach((w) => { D.line(ctx, [[SX(w.x), gy], [SX(w.x), gy + gh]], C.muted, 1, [4, 4]); D.text(ctx, w.name, SX(w.x), gy + gh + 11, { size: 11.5, color: C.muted }); });
      D.arrow(ctx, x0, GY(0), x1 + 12, GY(0), C.fg, 1.3, 7);
      D.arrow(ctx, x0, gy + gh, x0, gy - 8, C.fg, 1.3, 7);
      D.text(ctx, '두 도선을 잇는 직선 위의 B (위쪽 +, μT)', x0 + 6, gy - 14, { size: 12, color: C.purple, align: 'left' });
      D.text(ctx, '위치', x1 + 10, GY(0) + 14, { size: 11.5, color: C.muted, align: 'right' });
      ctx.save(); ctx.beginPath(); ctx.rect(x0, gy - 4, x1 - x0 + 1, gh + 8); ctx.clip();
      const segs = [[-XH, -XW - 0.02], [-XW + 0.02, XW - 0.02], [XW + 0.02, XH]], step = 1.5 / L.s;
      segs.forEach(([a, b]) => {
        const pts = [];
        for (let x = a; x <= b + 1e-9; x += step) pts.push([SX(x), GY(Math.max(-2 * BMAX, Math.min(2 * BMAX, lineB(x))))]);
        pts.push([SX(b), GY(Math.max(-2 * BMAX, Math.min(2 * BMAX, lineB(b))))]);
        D.line(ctx, pts, C.purple, 2.4);
      });
      ctx.restore();
      if (zIn) D.circle(ctx, SX(z), GY(0), 5.5, { fill: C.bg, stroke: C.green, width: 2.4 });
      if (probe.y === 0) {
        const bp = Math.max(-BMAX, Math.min(BMAX, lineB(probe.x)));
        D.line(ctx, [[px, gy], [px, gy + gh]], C.orange, 1.2, [2, 3]);
        D.circle(ctx, px, GY(bp), 5, { fill: C.orange });
      }
      // ── 읽기
      rb1.set(m1.toFixed(1) + ' μT'); rb2.set(m2.toFixed(1) + ' μT'); rb.set(mag.toFixed(1) + ' μT');
      if (I1 === 0 && I2 === 0) rz.set('전류 없음');
      else if (z === null) rz.set('없음');
      else {
        const d = z < -XW ? `I₁ 왼쪽 ${(-XW - z).toFixed(1)} cm` : z > XW ? `I₂ 오른쪽 ${(z - XW).toFixed(1)} cm` : `I₁에서 ${(z + XW).toFixed(1)} cm`;
        rz.set(d);
      }
    }

    function place(x, y) {
      if (y > L.fh + 6) { probe = { x: (x - L.cx) / L.s, y: 0 }; }
      else {
        probe = { x: (x - L.cx) / L.s, y: (L.cy - y) / L.s };
        if (Math.abs(probe.y) * L.s < 9) probe.y = 0;   // 직선 가까이 오면 직선 위로
      }
      const ymax = (L.cy - 10) / L.s;
      probe.x = Math.max(-XH + 0.3, Math.min(XH - 0.3, probe.x)); probe.y = Math.max(-ymax, Math.min(ymax, probe.y));
      wires().forEach((w) => {                          // 도선 속으로 들어가지 않게
        const dx = probe.x - w.x, dy = probe.y, r = Math.hypot(dx, dy), rmin = 18 / L.s;
        if (r < rmin) { if (r < 1e-6) probe.x = w.x + rmin; else { probe.x = w.x + dx / r * rmin; probe.y = dy / r * rmin; } }
      });
      render();
    }
    let drag = false;
    kit.pointer(cv.el, { down: (x, y) => { drag = true; place(x, y); }, move: (x, y) => { if (drag) place(x, y); }, up: () => { drag = false; } });
    cv.onResize(render);
    new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');   // 시스템 다크 모드가 바뀌면 다시 그림
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', () => render()); else if (mq.addListener) mq.addListener(() => render()); }
    render();
  },
});
