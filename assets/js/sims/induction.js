/* 전자기 유도: 균일한 자기장 영역(종이면에 들어감)을 일정한 속력으로 지나는 정사각형 고리 → Φ(x), ε(x), 유도 전류 방향(렌츠 법칙) */
SIM.register('induction', {
  title: '전자기 유도와 렌츠 법칙',
  hint: '고리가 일정한 속력으로 자기장 영역을 지나가요. 영역 폭·고리 크기·속력을 바꾸거나, 그림을 끌어 고리를 직접 옮겨 보세요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.3 : 0.7, maxH: 600 });
    const B = 0.5, XL = 0.7, XMIN = 0, XMAX = 2.5, AMAX = 0.6, PHIMAX = 0.2, EMAX = 0.35;
    let w = 0.8, a = 0.5, v = 0.5, x = 0, ph = 0, drag = false, G = {};
    const x0 = () => XMIN + 0.05 + a, x1 = () => XL + w + a + 0.15;
    x = x0();
    const loop = kit.loop((dt) => { if (!drag) { x += v * dt; if (x > x1()) x = x0(); } render(dt); });
    kit.playButton(loop);
    kit.button('↺ 처음부터', () => { x = x0(); });
    kit.slider({ label: '자기장 영역의 폭 w', min: 0.2, max: 1.0, step: 0.1, value: w, unit: 'm', onInput: (val) => { w = val; } });
    kit.slider({ label: '고리 한 변의 길이 a', min: 0.2, max: 0.6, step: 0.05, value: a, fmt: (val) => val.toFixed(2) + ' m', onInput: (val) => { a = val; } });
    kit.slider({ label: '고리의 속력 v', min: 0.2, max: 1.0, step: 0.1, value: v, unit: 'm/s', onInput: (val) => { v = val; } });
    const rP = kit.readout('자기 선속 Φ'), rE = kit.readout('유도 기전력 ε'), rI = kit.readout('유도 전류 방향');
    kit.note('고리를 지나는 자기 선속 Φ가 <b>변할 때만</b> 기전력이 생겨요. 들어갈 때는 Φ가 늘어 반시계 방향, 나올 때는 Φ가 줄어 시계 방향으로 전류가 흘러요 (렌츠 법칙: 변화를 방해하는 쪽).');
    kit.note('기전력의 크기는 선속의 변화율 = B·a·v (자기장 속에서 한 변만 움직일 때). 고리 전체가 영역 안에 있거나 영역이 고리 안에 다 들어 있으면 Φ가 일정해 기전력은 0이에요. 빨간 화살표 = 유도 전류가 받는 자기력으로, 늘 운동을 방해해요.');

    const XR = () => XL + w;
    const overlap = (xx) => Math.max(0, Math.min(xx, XR()) - Math.max(xx - a, XL));
    const phi = (xx) => B * a * overlap(xx);
    const slope = (xx) => (overlap(xx) > 0 || (xx > XL && xx - a < XR()) ? (xx < XR() ? 1 : 0) - (xx - a > XL ? 1 : 0) : 0);
    const emf = (xx) => B * a * v * slope(xx);                    // 반시계 방향 +

    function layout() {
      const { W, H } = cv, m = narrow ? 14 : 22, s = (W - 2 * m) / (XMAX - XMIN), hs = Math.round(AMAX * s + 58);
      const gap = 34, gh = Math.max(70, (H - hs - 2 * gap - 22) / 2);
      G = { W, H, m, s, hs, gh, g1: hs + gap, g2: hs + gap + gh + gap, X: (xx) => m + (xx - XMIN) * s, cy: hs / 2 + 10 };
    }
    function graph(y0, h, f, ymax, sym, col, label) {
      const { ctx } = cv, C = kit.C, D = kit.draw, X = G.X, Y = (val) => y0 + h / 2 - val / ymax * h / 2 * (sym ? 1 : 2) + (sym ? 0 : h / 2);
      const yz = Y(0);
      [XL, XR()].forEach((xx) => D.line(ctx, [[X(xx), y0 - 4], [X(xx), y0 + h]], C.purple, 1, [3, 4]));
      D.arrow(ctx, X(XMIN), yz, X(XMAX) + 8, yz, C.fg, 1.3, 7);
      D.arrow(ctx, X(XMIN), y0 + h, X(XMIN), y0 - 8, C.fg, 1.3, 7);
      D.text(ctx, label, X(XMIN) + 8, y0 - 12, { size: 12, color: col, align: 'left', bold: true });
      const pts = []; for (let px = X(XMIN); px <= X(XMAX); px += 1.5) { const xx = XMIN + (px - G.m) / G.s; pts.push([px, Y(f(xx))]); }
      D.line(ctx, pts, col, 2.4);
      return Y;
    }

    function render(dt) {
      layout();
      const { ctx, W, H } = cv, C = kit.C, D = kit.draw, X = G.X, s = G.s;
      ctx.clearRect(0, 0, W, H);
      // ── 자기장 영역
      const rx0 = X(XL), rx1 = X(XR()), ry0 = 22, ry1 = G.hs - 4;
      ctx.save(); ctx.fillStyle = C.purple; ctx.globalAlpha = 0.08; ctx.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0); ctx.restore();
      D.line(ctx, [[rx0, ry0], [rx0, ry1]], C.purple, 1.4, [5, 4]); D.line(ctx, [[rx1, ry0], [rx1, ry1]], C.purple, 1.4, [5, 4]);
      const nx = Math.max(1, Math.round((rx1 - rx0) / 26)), ny = Math.max(1, Math.round((ry1 - ry0) / 26));
      ctx.save(); ctx.globalAlpha = 0.5;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const cx = rx0 + (i + 0.5) * (rx1 - rx0) / nx, cy = ry0 + (j + 0.5) * (ry1 - ry0) / ny;
        D.circle(ctx, cx, cy, 5, { stroke: C.purple, width: 1.3 }); D.line(ctx, [[cx - 3, cy - 3], [cx + 3, cy + 3]], C.purple, 1.3); D.line(ctx, [[cx - 3, cy + 3], [cx + 3, cy - 3]], C.purple, 1.3);
      }
      ctx.restore();
      D.text(ctx, 'B ⊗ (종이면에 들어감)', (rx0 + rx1) / 2, 11, { size: 11.5, color: C.purple, bold: true });
      // ── 고리
      const xl = X(x - a), xr = X(x), half = a * s / 2, yt = G.cy - half, yb = G.cy + half;
      const ox0 = Math.max(xl, rx0), ox1 = Math.min(xr, rx1);
      if (ox1 > ox0) { ctx.save(); ctx.fillStyle = C.purple; ctx.globalAlpha = 0.22; ctx.fillRect(ox0, yt, ox1 - ox0, yb - yt); ctx.restore(); }
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3.2; ctx.strokeRect(xl, yt, xr - xl, yb - yt);
      const e = emf(x), dir = Math.sign(e);
      D.arrow(ctx, (xl + xr) / 2 - 14, yt - 13, (xl + xr) / 2 + 20, yt - 13, C.bg, 6, 11);
      D.arrow(ctx, (xl + xr) / 2 - 14, yt - 13, (xl + xr) / 2 + 20, yt - 13, C.blue, 2.6, 8);
      D.text(ctx, 'v', (xl + xr) / 2 + 30, yt - 13, { size: 12, color: C.blue, bold: true });
      if (dir !== 0) {
        // 유도 전류: 둘레를 도는 점 + 변 가운데 화살촉 (반시계: 아래→오른쪽 변 위로→위→왼쪽 변 아래로)
        const side = xr - xl, P = 4 * side, sp = 15, n = Math.max(4, Math.floor(P / sp));
        ph = (ph + dir * (18 + 70 * Math.abs(e) / 0.3) * (dt || 0)) % P; if (ph < 0) ph += P;
        const at = (p) => { p = ((p % P) + P) % P; const k = Math.floor(p / side), u = p - k * side; return k === 0 ? [xl + u, yb] : k === 1 ? [xr, yb - u] : k === 2 ? [xr - u, yt] : [xl, yt + u]; };
        for (let i = 0; i < n; i++) { const [px, py] = at(i * P / n + ph); D.circle(ctx, px, py, 2.3, { fill: C.orange }); }
        for (let k = 0; k < 4; k++) { const p = (k + 0.5) * side, [ax, ay] = at(p - dir * 7), [bx, by] = at(p + dir * 7); D.arrow(ctx, ax, ay, bx, by, C.orange, 2.4, 10); }
        const ex = dir > 0 ? xr : xl, fy = G.cy + half * 0.5;      // 자기장 속에 있는 변이 받는 힘 (운동 반대)
        D.arrow(ctx, ex, fy, ex - 36, fy, C.bg, 7, 13); D.arrow(ctx, ex, fy, ex - 36, fy, C.red, 3.2, 11);
        D.text(ctx, 'F', ex - 44, fy - 1, { size: 12, color: C.red, bold: true, align: 'right' });
      }
      // ── 그래프 (가로축 = 고리 앞변의 위치, 위 그림과 같은 눈금)
      D.line(ctx, [[0, G.hs + 4], [W, G.hs + 4]], C.grid, 1);
      const Y1 = graph(G.g1, G.gh, phi, PHIMAX, false, C.purple, '자기 선속 Φ (Wb)');
      const Y2 = graph(G.g2, G.gh, emf, EMAX, true, C.orange, '유도 기전력 ε (V) · 반시계 방향 +');
      D.text(ctx, '가로축: 고리 앞변(오른쪽 변)의 위치 →', X(XMAX) + 8, G.g2 + G.gh + 11, { size: 11.5, color: C.muted, align: 'right' });
      const lo = Math.min(a, w), hi = Math.max(a, w), ep = B * a * v;
      D.text(ctx, '들어갈 때', X(XL + lo / 2), Y2(ep) - 11, { size: 11.5, color: C.orange, bold: true });
      D.text(ctx, '나올 때', X(XL + hi + lo / 2), Y2(-ep) + 12, { size: 11.5, color: C.orange, bold: true });
      const px = X(x);
      D.line(ctx, [[px, yb + 4], [px, G.g2 + G.gh]], C.orange, 1.2, [2, 3]);
      D.circle(ctx, px, Y1(phi(x)), 5, { fill: C.purple }); D.circle(ctx, px, Y2(e), 5, { fill: C.orange });
      // ── 읽기
      rP.set(phi(x).toFixed(3) + ' Wb');
      rE.set((e === 0 ? '0' : (e > 0 ? '+' : '−') + Math.abs(e).toFixed(2)) + ' V');
      rI.set(dir > 0 ? '↺ 반시계' : dir < 0 ? '↻ 시계' : '없음');
    }

    const place = (px) => { x = Math.max(XMIN + a + 0.02, Math.min(XMAX - 0.02, XMIN + (px - G.m) / G.s)); };
    kit.pointer(cv.el, { down: (px) => { drag = true; place(px); }, move: (px) => { if (drag) place(px); }, up: () => { drag = false; } });
    cv.onResize(() => render(0));
    render(0);
  },
});
