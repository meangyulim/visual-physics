/* 단진자 — 진자 애니메이션 + 변위-시간 그래프 + 운동·퍼텐셜 에너지 막대, T = 2π√(L/g) */
SIM.register('pendulum', {
  title: '단진자의 주기',
  hint: '길이·중력·진폭·질량을 바꿔 보세요. 주기를 바꾸는 것은 어느 것일까요?',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.25 : 0.56, maxH: 520 });
    const D = kit.draw, MI = '−';
    const GS = { earth: [9.8, '지구', 'g = 9.8 m/s²'], moon: [1.6, '달', 'g = 1.6 m/s²'], lift: [14.7, '엘리베이터', 'g + a = 14.7 m/s²'] };
    let L = 1, gk = 'earth', amp = 10, mass = 1, th = 0, om = 0, t = 0, hist = [];
    const gv = () => GS[gk][0];
    const Tsmall = () => 2 * Math.PI * Math.sqrt(L / gv());
    // 실제 주기(큰 진폭 보정 포함): T = 4√(L/g)·K(sin(θ₀/2)), K 는 산술-기하 평균으로
    const Tex = () => {
      const k = Math.sin(amp * Math.PI / 360); let a = 1, b = Math.sqrt(1 - k * k);
      for (let i = 0; i < 8; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
      return 4 * Math.sqrt(L / gv()) * Math.PI / (2 * a);
    };
    function reset() { th = amp * Math.PI / 180; om = 0; t = 0; hist = [[0, L * Math.sin(th)]]; upd(); }
    function step(h) {   // θ'' = −(g/L) sin θ  (RK4)
      const w2 = gv() / L, f = (a) => -w2 * Math.sin(a);
      const k1t = om, k1o = f(th), k2t = om + h / 2 * k1o, k2o = f(th + h / 2 * k1t);
      const k3t = om + h / 2 * k2o, k3o = f(th + h / 2 * k2t), k4t = om + h * k3o, k4o = f(th + h * k3t);
      th += h / 6 * (k1t + 2 * k2t + 2 * k3t + k4t); om += h / 6 * (k1o + 2 * k2o + 2 * k3o + k4o);
    }
    kit.slider({ label: '실의 길이 L', min: 0.2, max: 2, step: 0.1, value: L, unit: 'm', onInput: (v) => { L = v; reset(); } });
    kit.slider({ label: '진폭 θ₀', min: 3, max: 20, step: 1, value: amp, fmt: (v) => v + '°', onInput: (v) => { amp = v; reset(); } });
    kit.select({
      label: '중력 가속도', value: gk,
      options: [['earth', '지구 (9.8 m/s²)'], ['moon', '달 (1.6 m/s²)'], ['lift', '위로 가속하는 엘리베이터 (g + a = 14.7 m/s²)']],
      onChange: (v) => { gk = v; reset(); },
    });
    kit.slider({ label: '추의 질량 m', min: 0.5, max: 5, step: 0.5, value: mass, unit: 'kg', onInput: (v) => { mass = v; upd(); } });   // 질량은 운동을 다시 시작하지 않음
    const rT = kit.readout('주기 T'), rg = kit.readout('중력 가속도'), rv = kit.readout('최대 속력');
    function upd() {
      rT.set(Tsmall().toFixed(2) + ' s');
      rg.set(gv().toFixed(1) + ' m/s²');
      rv.set(Math.sqrt(2 * gv() * L * (1 - Math.cos(amp * Math.PI / 180))).toFixed(2) + ' m/s');
    }
    const loop = kit.loop((dt) => {
      if (dt > 0) {
        const n = Math.ceil(dt / 0.002); for (let i = 0; i < n; i++) step(dt / n);
        t += dt; hist.push([t, L * Math.sin(th)]);
        const tw = win(); while (hist.length > 2 && hist[1][0] < t - tw - 0.2) hist.shift();
      }
      render();
    });
    const pb = kit.playButton(loop);
    kit.button('↺ 처음부터', () => { reset(); loop.play(); pb.textContent = '⏸ 정지'; });
    kit.note('주기 T = 2π√(L/g)는 <b>길이 L과 중력 가속도 g</b>로만 정해져요. <b>질량</b>을 바꿔도(진자가 그대로 흔들려요), <b>진폭</b>을 바꿔도(진폭이 작을 때) 주기는 같아요.');
    kit.note('위로 가속하는 엘리베이터 안에서는 겉보기 중력 가속도가 g + a로 커져서 주기가 짧아지고, 달에서는 길어져요.');

    const win = () => Math.max(8, Math.ceil(2.2 * Tex() / 4) * 4);   // 그래프 시간 폭
    function layout(W, H) {
      if (narrow) return {
        pr: { x: 0, y: 0, w: W * 0.6, h: 236 },
        eb: { x: W * 0.62, y: 8, w: W * 0.38 - 8, h: 222 },
        gr: { x: 40, y: 270, w: W - 84, h: H - 270 - 30 },
      };
      return {
        pr: { x: 0, y: 0, w: W * 0.36, h: H },
        gr: { x: W * 0.36 + 44, y: 34, w: W * 0.64 - 92, h: H * 0.5 - 34 },
        eb: { x: W * 0.36 + 30, y: H * 0.58, w: W * 0.64 - 46, h: H * 0.42 - 6 },
      };
    }

    function render() {
      const { ctx, W, H } = cv, C = kit.C;
      ctx.clearRect(0, 0, W, H);
      const { pr, eb, gr } = layout(W, H);
      drawPendulum(ctx, pr, C);
      drawGraph(ctx, gr, C);
      drawEnergy(ctx, eb, C);
    }

    function drawPendulum(ctx, r, C) {
      const pvx = r.x + r.w / 2, pvy = r.y + 30;
      const sL = (r.h - 30 - 46) / 2;                 // px / m (L 최대 2 m)
      const len = L * sL, th0 = amp * Math.PI / 180;
      // 엘리베이터 상자
      if (gk === 'lift') {
        ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.setLineDash([]);
        ctx.strokeRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12); ctx.restore();
        D.arrow(ctx, r.x + r.w - 18, r.y + r.h * 0.62, r.x + r.w - 18, r.y + r.h * 0.38, C.green, 3, 9);
        D.text(ctx, 'a', r.x + r.w - 30, r.y + r.h * 0.5, { size: 13, bold: true, color: C.green });
      }
      // 천장
      ctx.strokeStyle = C.fg; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(pvx - 34, pvy); ctx.lineTo(pvx + 34, pvy); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = C.muted;
      for (let k = -30; k <= 26; k += 8) { ctx.beginPath(); ctx.moveTo(pvx + k, pvy); ctx.lineTo(pvx + k + 7, pvy - 7); ctx.stroke(); }
      // 평형 위치와 진폭
      D.line(ctx, [[pvx, pvy], [pvx, pvy + len + 18]], C.muted, 1.2, [3, 4]);
      ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(pvx, pvy, len, Math.PI / 2 - th0, Math.PI / 2 + th0); ctx.stroke(); ctx.restore();
      const rb = Math.min(6 + 1.7 * mass, Math.max(6, len * 0.55));   // 짧은 실에서는 추가 천장에 닿지 않게
      [-1, 1].forEach((s) => {
        ctx.save(); ctx.globalAlpha = 0.25;
        D.line(ctx, [[pvx, pvy], [pvx + len * Math.sin(s * th0), pvy + len * Math.cos(th0)]], C.muted, 1);
        D.circle(ctx, pvx + len * Math.sin(s * th0), pvy + len * Math.cos(th0), rb, { stroke: C.blue, width: 1.5 });
        ctx.restore();
      });
      // 진폭 각 표시
      if (len > 56) {
        const ra = Math.min(30, len * 0.5);
        ctx.strokeStyle = C.orange; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pvx, pvy, ra, Math.PI / 2 - th0, Math.PI / 2); ctx.stroke();
        D.text(ctx, 'θ₀', pvx + (ra + 10) * Math.sin(th0 / 2) + 6, pvy + (ra + 10) * Math.cos(th0 / 2), { size: 12, bold: true, color: C.orange });
      }
      // 실과 추
      const bx = pvx + len * Math.sin(th), by = pvy + len * Math.cos(th);
      D.line(ctx, [[pvx, pvy], [bx, by]], C.fg, 1.6);
      D.circle(ctx, pvx, pvy, 3, { fill: C.fg });
      // 속도 화살표 (접선 방향, 최대 속력일 때 약 40 px)
      const vmax = Math.sqrt(2 * gv() * L * (1 - Math.cos(th0))), v = L * om;
      if (vmax > 0 && Math.abs(v) > vmax * 0.06) {
        const k = 40 / vmax * v, ux = Math.cos(th), uy = -Math.sin(th);
        const sx = bx + ux * Math.sign(v) * (rb + 2), sy = by + uy * Math.sign(v) * (rb + 2);
        D.arrow(ctx, sx, sy, sx + ux * k, sy + uy * k, C.blue, 2.8, 8);
        D.text(ctx, 'v', sx + ux * k + Math.sign(v) * 9, sy + uy * k + 9, { size: 12, bold: true, color: C.blue });
      }
      D.circle(ctx, bx, by, rb, { fill: C.blue, stroke: C.card, width: 1.5 });
      // 아래 글
      D.text(ctx, `${GS[gk][1]}: ${GS[gk][2]}`, r.x + r.w / 2, r.y + r.h - 16, { size: 12, bold: true, color: gk === 'lift' ? C.green : C.fg });
      D.text(ctx, `L = ${L.toFixed(1)} m`, pvx + 40, pvy - 14, { size: 11.5, color: C.muted, align: 'left' });
    }

    function drawGraph(ctx, r, C) {
      const tw = win(), t1 = Math.max(tw, t), t0 = t1 - tw;
      const A = L * Math.sin(amp * Math.PI / 180), ym = A * 1.35;
      const X = (tt) => r.x + (tt - t0) / tw * r.w, Y = (x) => r.y + r.h / 2 - x / ym * (r.h / 2);
      D.text(ctx, '변위 x', r.x - 2, r.y - 14, { size: 12, bold: true, align: 'left', color: C.fg });
      D.text(ctx, `T = 2π√(L/g) = ${Tsmall().toFixed(2)} s`, r.x + r.w, r.y - 14, { size: 12, bold: true, align: 'right', color: C.orange });
      // ±A 선과 시간 눈금
      [A, -A].forEach((a, i) => {
        D.line(ctx, [[r.x, Y(a)], [r.x + r.w, Y(a)]], C.grid, 1);
        D.text(ctx, (i ? MI : '+') + 'A', r.x - 6, Y(a), { size: 11, color: C.muted, align: 'right' });
      });
      const dtk = tw <= 8 ? 1 : 2;
      for (let k = Math.ceil(t0 / dtk); k * dtk <= t1 + 1e-9; k++) {
        const xx = X(k * dtk);
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xx, r.y); ctx.lineTo(xx, r.y + r.h); ctx.stroke();
        D.text(ctx, String(k * dtk), xx, r.y + r.h + 12, { size: 11, color: C.muted });
      }
      D.text(ctx, 't (s)', r.x + r.w + 14, r.y + r.h + 12, { size: 11, color: C.muted, align: 'left' });
      D.arrow(ctx, r.x, Y(0), r.x + r.w + 10, Y(0), C.fg, 1.4, 7);
      D.arrow(ctx, r.x, r.y + r.h, r.x, r.y - 6, C.fg, 1.4, 7);
      // 주기 표시: 연속한 두 최대점 사이
      const Te = Tex(), n2 = Math.floor(t / Te), n1 = n2 - 1;
      if (n1 >= 0 && n1 * Te >= t0) {
        const xa = X(n1 * Te), xb = X(n2 * Te), yy = r.y + 8;
        D.line(ctx, [[xa, Y(A)], [xa, yy]], C.orange, 1, [2, 3]); D.line(ctx, [[xb, Y(A)], [xb, yy]], C.orange, 1, [2, 3]);
        D.arrow(ctx, (xa + xb) / 2, yy, xa, yy, C.orange, 1.6, 6); D.arrow(ctx, (xa + xb) / 2, yy, xb, yy, C.orange, 1.6, 6);
        if (xb - xa > 26) { ctx.save(); ctx.fillStyle = C.bg; ctx.fillRect((xa + xb) / 2 - 9, yy - 8, 18, 16); ctx.restore(); D.text(ctx, 'T', (xa + xb) / 2, yy, { size: 12, bold: true, color: C.orange }); }
      }
      // 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y - 4, r.w + 2, r.h + 8); ctx.clip();
      D.line(ctx, hist.map((p) => [X(p[0]), Y(p[1])]), C.blue, 2.4);
      ctx.restore();
      D.circle(ctx, X(t), Y(L * Math.sin(th)), 4.5, { fill: C.blue });
    }

    function drawEnergy(ctx, r, C) {
      const th0 = amp * Math.PI / 180, g = gv();
      const Et = mass * g * L * (1 - Math.cos(th0)), Ep = mass * g * L * (1 - Math.cos(th)), Ek = Math.max(0, Et - Ep);
      const fe = (e) => (e >= 1 ? e.toFixed(2) + ' J' : e >= 0.1 ? e.toFixed(3) + ' J' : (e * 1000).toFixed(e * 1000 >= 10 ? 1 : 2) + ' mJ');
      D.text(ctx, '에너지', r.x, r.y + 8, { size: 12.5, bold: true, align: 'left', color: C.fg });
      D.text(ctx, '합 ' + fe(Et), r.x + r.w, r.y + 8, { size: 11.5, bold: true, align: 'right', color: C.orange });
      const py0 = r.y + 40, py1 = r.y + r.h - 24, Y = (e) => py1 - (Et > 0 ? e / Et : 0) * (py1 - py0);
      const items = [['운동', Ek, C.blue], ['퍼텐셜', Ep, C.purple]];
      const slot = r.w / 3, bw = Math.min(slot * 0.58, 44);
      items.forEach(([nm, e, col], i) => {
        const x = r.x + slot * i + (slot - bw) / 2;
        ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = col; ctx.fillRect(x, Y(e), bw, py1 - Y(e)); ctx.restore();
        D.text(ctx, nm, x + bw / 2, py1 + 13, { size: 12, color: C.fg });
      });
      const x = r.x + slot * 2 + (slot - bw) / 2;
      ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = C.purple; ctx.fillRect(x, Y(Ep), bw, py1 - Y(Ep));
      ctx.fillStyle = C.blue; ctx.fillRect(x, Y(Et), bw, Y(Ep) - Y(Et)); ctx.restore();
      ctx.save(); ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.strokeRect(x, Y(Et), bw, py1 - Y(Et)); ctx.restore();
      D.text(ctx, '합', x + bw / 2, py1 + 13, { size: 12, bold: true, color: C.orange });
      D.line(ctx, [[r.x, Y(Et)], [r.x + r.w, Y(Et)]], C.orange, 1.2, [4, 4]);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r.x, py1); ctx.lineTo(r.x + r.w, py1); ctx.stroke();
    }

    reset();
    cv.onResize(render);
    render();
  },
});
