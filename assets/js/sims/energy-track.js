/* 역학적 에너지 보존과 손실 — 언덕·골짜기 트랙 위의 공, 실시간 에너지 막대, 위치에 따른 속력 그래프 */
SIM.register('energy-track', {
  title: '역학적 에너지 보존과 마찰',
  hint: '출발 높이와 마찰을 바꿔 보세요. 마찰이 0이면 공이 처음 높이까지 다시 올라가요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.5 : 0.6, maxH: 600 });
    const D = kit.draw, g = 9.8, m = 1;          // 질량 1 kg
    const XM = 10, YM = 5.3, EMAX = m * g * 5;    // 트랙 가로 10 m, 에너지 막대 최대 49 J
    const K = 2 * Math.PI / 5;
    // 트랙 모양: 양 끝 높이 5 m, 골짜기 2곳(0 m), 가운데 언덕 2.6 m
    const yT = (x) => (2.6 + 0.096 * (x - 5) ** 2) * (1 + Math.cos(K * x)) / 2;
    const dyT = (x) => 0.192 * (x - 5) * (1 + Math.cos(K * x)) / 2 - (2.6 + 0.096 * (x - 5) ** 2) * K * Math.sin(K * x) / 2;
    const HILL = 2.6;

    let h0 = 4, mu = 0, x, v, Dx, stopped, trail, E0;
    function reset() {
      let a = 0, b = 2.5;                         // 왼쪽 비탈에서 높이 h0 인 곳
      for (let i = 0; i < 50; i++) { const mid = (a + b) / 2; if (yT(mid) > h0) a = mid; else b = mid; }
      x = (a + b) / 2; v = 0; Dx = 0; stopped = false; E0 = m * g * yT(x); trail = [[x, 0]];
    }
    // 접선 방향 운동: dv/dt = -g(sinθ ± μcosθ), 마찰이 한 일 = μmg × (수평 이동 거리)
    function step(h) {
      if (stopped) return;
      let sig = Math.sign(v);
      if (sig === 0) { const s = dyT(x); if (Math.abs(s) <= mu) { stopped = true; return; } sig = -Math.sign(s); }
      const f = (xx, vv) => { const s = dyT(xx), q = Math.sqrt(1 + s * s); return [vv / q, -g * (s + mu * sig) / q]; };
      const [a1, b1] = f(x, v), [a2, b2] = f(x + h / 2 * a1, v + h / 2 * b1);
      const [a3, b3] = f(x + h / 2 * a2, v + h / 2 * b2), [a4, b4] = f(x + h * a3, v + h * b3);
      const nx = x + h / 6 * (a1 + 2 * a2 + 2 * a3 + a4), nv = v + h / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
      Dx += Math.abs(nx - x); x = nx;
      if (Math.sign(nv) !== sig) {                // 되돌아오는 순간
        if (mu > 0 && Math.abs(dyT(x)) <= mu) { v = 0; stopped = true; return; }
      }
      v = nv;
    }
    const energies = () => {
      const Ep = m * g * yT(x);
      if (stopped) return { Ep, Q: E0 - Ep, Ek: 0, sp: 0 };
      const Q = mu * m * g * Dx, Ek = Math.max(0, E0 - Ep - Q);
      return { Ep, Q, Ek, sp: Math.sqrt(2 * Ek / m) };
    };

    kit.slider({ label: '출발 높이 h₀', min: 1, max: 4.8, step: 0.1, value: h0, unit: 'm', onInput: (val) => { h0 = val; reset(); } });
    kit.slider({ label: '마찰 정도', min: 0, max: 0.3, step: 0.01, value: mu, fmt: (val) => (val === 0 ? '0 (없음)' : val.toFixed(2)), onInput: (val) => { mu = val; reset(); } });
    const rh = kit.readout('높이 h'), rv = kit.readout('속력 v'), rm = kit.readout('역학적 에너지');
    const loop = kit.loop((dt) => {
      const n = Math.ceil(dt / 0.002);
      for (let i = 0; i < n; i++) step(dt / n);
      const sp = energies().sp, last = trail[trail.length - 1];
      if (dt > 0 && (Math.abs(x - last[0]) > 0.02 || Math.abs(sp - last[1]) > 0.15)) { trail.push([x, sp]); if (trail.length > 2500) trail.shift(); }
      render();
    });
    const pb = kit.playButton(loop);
    kit.button('↺ 처음부터', () => { reset(); loop.play(); pb.textContent = '⏸ 정지'; });
    kit.note('마찰이 없으면 운동 에너지와 퍼텐셜 에너지가 서로 바뀔 뿐 합(역학적 에너지 = E<sub>k</sub> + E<sub>p</sub>)은 일정해서, 공이 <b>처음 높이까지</b> 올라갔다 되돌아와요. (질량 1 kg, 퍼텐셜 에너지는 골짜기 바닥 0 m 기준)');
    kit.note('마찰이 있으면 역학적 에너지 일부가 <b>열</b>로 바뀌어 점점 낮게 올라가요. 그래도 열까지 더한 전체 에너지(맨 오른쪽 막대)는 그대로예요.');

    function layout(W, H) {
      if (narrow) {
        const tr = { x: 30, y: 30, w: W - 42 };
        const s = Math.min(tr.w / XM, (H - 30 - 34 - 70 - 30 - 140) / YM); tr.w = s * XM; tr.h = s * YM;   // 화면을 돌려 넓어져도 막대 자리 확보
        const sp = { x: tr.x, y: tr.y + tr.h + 34, w: tr.w, h: 70 };
        const eb = { x: 10, y: sp.y + sp.h + 30, w: W - 20 }; eb.h = H - eb.y - 6;
        return { tr, s, sp, eb };
      }
      const colW = W * 0.63;
      const tr = { x: 40, y: 32, w: colW - 52 }; let s = tr.w / XM; tr.h = s * YM;
      if (tr.h > H * 0.56) { s = H * 0.56 / YM; tr.h = s * YM; tr.w = s * XM; }
      const sp = { x: tr.x, y: tr.y + tr.h + 40, w: tr.w }; sp.h = H - sp.y - 30;
      const eb = { x: colW + 18, y: 20, w: W - colW - 30, h: H - 26 };
      return { tr, s, sp, eb };
    }

    function render() {
      const { ctx, W, H } = cv, C = kit.C;
      ctx.clearRect(0, 0, W, H);
      const { tr, s, sp, eb } = layout(W, H);
      const X = (xx) => tr.x + xx * s, Y = (yy) => tr.y + tr.h - yy * s;
      const en = energies();
      // 높이 눈금
      for (let k = 0; k <= 5; k++) {
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tr.x, Y(k)); ctx.lineTo(tr.x + tr.w, Y(k)); ctx.stroke();
        D.text(ctx, k + (k === 5 ? ' m' : ''), tr.x - 6, Y(k), { size: 11, color: C.muted, align: 'right' });
      }
      // 트랙
      const pts = []; for (let i = 0; i <= 200; i++) { const xx = XM * i / 200; pts.push([X(xx), Y(yT(xx))]); }
      ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], Y(0) + 8);
      pts.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[200][0], Y(0) + 8); ctx.closePath();
      ctx.fillStyle = C.muted; ctx.globalAlpha = 0.14; ctx.fill(); ctx.restore();
      D.line(ctx, pts, C.fg, 3);
      // 처음 높이 점선
      D.line(ctx, [[tr.x, Y(h0)], [tr.x + tr.w, Y(h0)]], C.orange, 1.5, [6, 5]);
      // 범례: 점선 = 출발 높이 (트랙과 겹치지 않게 오른쪽 위에)
      ctx.font = "700 11.5px Pretendard, 'Noto Sans KR', system-ui, sans-serif";
      const lw = ctx.measureText('출발 높이').width;
      D.text(ctx, '출발 높이', tr.x + tr.w, tr.y - 14, { size: 11.5, bold: true, color: C.orange, align: 'right' });
      D.line(ctx, [[tr.x + tr.w - lw - 28, tr.y - 14], [tr.x + tr.w - lw - 7, tr.y - 14]], C.orange, 1.6, [5, 3]);
      // 공
      const sl = dyT(x), nx = -s * sl, ny = -s, nl = Math.hypot(nx, ny), r = narrow ? 8 : 10;
      const bx = X(x) + nx / nl * r, by = Y(yT(x)) + ny / nl * r;
      D.circle(ctx, bx, by, r, { fill: C.blue });
      // 속도 화살표 (접선 방향)
      if (en.sp > 0.15 && !stopped) {
        const tx = s, ty = -s * sl, tl = Math.hypot(tx, ty), dir = Math.sign(v) || 1, len = en.sp * (narrow ? 4.6 : 6.2);
        const ex = bx + dir * tx / tl * (r + len), ey = by + dir * ty / tl * (r + len);
        D.arrow(ctx, bx + dir * tx / tl * r, by + dir * ty / tl * r, ex, ey, C.blue, 3, 9);
        D.text(ctx, 'v', ex + nx / nl * 12, ey + ny / nl * 12, { size: 12.5, bold: true, color: C.blue });
      }
      if (stopped) D.text(ctx, '마찰 때문에 멈췄어요', tr.x + 4, tr.y - 14, { size: 12, bold: true, color: C.red, align: 'left' });
      else if (mu === 0) D.text(ctx, '마찰 없음: 역학적 에너지 보존', tr.x + 4, tr.y - 14, { size: 12, bold: true, color: C.green, align: 'left' });
      else if (h0 < HILL && trail.length < 3) D.text(ctx, '언덕보다 낮게 출발', tr.x + 4, tr.y - 14, { size: 12, color: C.muted, align: 'left' });

      // 위치-속력 그래프 (트랙과 가로축을 맞춤)
      const VM = 10;
      const A = D.axes(ctx, sp, { xlabel: '위치', ylabel: '속력 v (m/s)', xmin: 0, xmax: XM, ymin: 0, ymax: VM });
      [5, 10].forEach((k) => {
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sp.x, A.Y(k)); ctx.lineTo(sp.x + sp.w, A.Y(k)); ctx.stroke();
        D.text(ctx, String(k), sp.x - 6, A.Y(k), { size: 11, color: C.muted, align: 'right' });
      });
      // 마찰 없을 때 속력 (갈 수 있는 구간만)
      const xa = trail[0][0], ya = yT(xa);
      let xb = xa + 0.01;
      while (xb < XM && yT(xb) <= ya) xb += 0.01;
      const ideal = []; for (let xx = xa; xx <= xb; xx += 0.02) { const vv = Math.sqrt(Math.max(0, 2 * g * (ya - yT(xx)))); ideal.push([A.X(xx), A.Y(vv)]); }
      D.line(ctx, ideal, C.muted, 1.5, [4, 4]);
      if (mu > 0) D.text(ctx, '점선: 마찰이 없을 때', sp.x + sp.w, sp.y - 6, { size: 11, color: C.muted, align: 'right' });
      D.line(ctx, trail.map((p) => [A.X(p[0]), A.Y(p[1])]), C.blue, 2.2);
      D.circle(ctx, A.X(x), A.Y(en.sp), 4.5, { fill: C.blue });
      // 공 위치와 그래프 점 잇기
      D.line(ctx, [[X(x), Y(yT(x)) + 4], [A.X(x), A.Y(en.sp)]], C.blue, 1, [2, 4]);

      // 에너지 막대
      energyBars(ctx, eb, en, C);
      rh.set(yT(x).toFixed(2) + ' m'); rv.set(en.sp.toFixed(2) + ' m/s'); rm.set((en.Ek + en.Ep).toFixed(1) + ' J');
    }

    function energyBars(ctx, r, en, C) {
      D.text(ctx, '에너지 (J)', r.x, r.y + 8, { size: 12.5, bold: true, align: 'left', color: C.fg });
      const py0 = r.y + 30, py1 = r.y + r.h - 26;
      const Y = (e) => py1 - e / EMAX * (py1 - py0);
      const items = [['운동', en.Ek, C.blue], ['퍼텐셜', en.Ep, C.purple], ['열', en.Q, C.red]];
      const slot = r.w / 4, bw = Math.min(slot * 0.56, 46);
      items.forEach(([nm, e, col], i) => {
        const x = r.x + slot * i + (slot - bw) / 2;
        ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = col; ctx.fillRect(x, Y(e), bw, py1 - Y(e)); ctx.restore();
        D.text(ctx, e.toFixed(1), x + bw / 2, Y(e) - 8, { size: 11, bold: true, color: col });
        D.text(ctx, nm, x + bw / 2, py1 + 14, { size: 12, color: C.fg });
      });
      // 합: 쌓은 막대
      const x = r.x + slot * 3 + (slot - bw) / 2;
      let base = py1;
      [[en.Ep, C.purple], [en.Ek, C.blue], [en.Q, C.red]].forEach(([e, col]) => {
        const hh = e / EMAX * (py1 - py0);
        ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = col; ctx.fillRect(x, base - hh, bw, hh); ctx.restore(); base -= hh;
      });
      ctx.save(); ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.strokeRect(x, Y(E0), bw, py1 - Y(E0)); ctx.restore();
      D.text(ctx, E0.toFixed(1), x + bw / 2, Y(E0) - 8, { size: 11, bold: true, color: C.orange });
      D.text(ctx, '합', x + bw / 2, py1 + 14, { size: 12, bold: true, color: C.orange });
      D.line(ctx, [[r.x, Y(E0)], [r.x + r.w, Y(E0)]], C.orange, 1.2, [4, 4]);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r.x, py1); ctx.lineTo(r.x + r.w, py1); ctx.stroke();
    }

    reset();
    cv.onResize(render);
    render();
  },
});
