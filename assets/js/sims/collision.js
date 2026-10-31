/* 충돌과 운동량 보존 — 수평 트랙 위 두 수레, 충돌 전·후 운동량(각자·합)과 운동 에너지(합) 막대그래프 */
SIM.register('collision', {
  title: '충돌과 운동량 보존',
  hint: '두 수레의 질량·속도와 충돌 종류를 바꿔 보세요. 오른쪽이 (+) 방향이에요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.22 : 0.6, maxH: 520 });
    const D = kit.draw, MI = '−';
    const FONT = (s, b) => `${b ? '700' : '500'} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
    // 부호 붙인 수: 정수에 가까우면 소수점 없이
    const sg = (v, d = 1) => { const s = Math.abs(v).toFixed(d); return +s === 0 ? '0' : (v > 0 ? '+' : MI) + s; };
    const sgs = (v) => sg(v, Math.abs(v - Math.round(v)) < 0.05 ? 0 : 1);
    const num = (v) => { const a = Math.abs(v), s = a.toFixed(Math.abs(a - Math.round(a)) < 0.05 ? 0 : 1); return +s === 0 ? '0' : s; };
    const E = { el: 1, inel: 0.5, perf: 0 };
    let m1 = 2, m2 = 3, v1 = 4, v2 = -2, type = 'el', t = 0, S = {};

    const restart = () => { solve(); t = 0; };
    kit.slider({ label: '수레 1 질량 m₁', min: 1, max: 5, step: 0.5, value: m1, unit: 'kg', onInput: (v) => { m1 = v; restart(); } });
    kit.slider({ label: '수레 2 질량 m₂', min: 1, max: 5, step: 0.5, value: m2, unit: 'kg', onInput: (v) => { m2 = v; restart(); } });
    kit.slider({ label: '수레 1 속도 v₁', min: -6, max: 6, step: 0.5, value: v1, fmt: (v) => sg(v) + ' m/s', onInput: (v) => { v1 = v; restart(); } });
    kit.slider({ label: '수레 2 속도 v₂', min: -6, max: 6, step: 0.5, value: v2, fmt: (v) => sg(v) + ' m/s', onInput: (v) => { v2 = v; restart(); } });
    kit.select({
      label: '충돌 종류', value: type,
      options: [['el', '탄성 충돌'], ['inel', '비탄성 충돌 (반발 계수 0.5)'], ['perf', '완전 비탄성 충돌 (붙어서 함께 운동)']],
      onChange: (v) => { type = v; restart(); },
    });
    const ro1 = kit.readout('충돌 후 v₁′'), ro2 = kit.readout('충돌 후 v₂′'), roK = kit.readout('운동 에너지 손실');
    const loop = kit.loop((dt) => { t += dt; if (t > geom(cv.W).tEnd + 1.6) t = 0; render(); });
    const pb = kit.playButton(loop);
    kit.button('↺ 처음부터', () => { t = 0; loop.play(); pb.textContent = '⏸ 정지'; });
    kit.note('초록 막대(운동량의 합)는 어떤 충돌에서도 충돌 전과 후가 같아요 → <b>운동량 보존</b>. 운동 에너지의 합은 <b>탄성 충돌에서만</b> 보존되고, 비탄성 충돌에서는 일부가 열·소리 등으로 바뀌어 줄어들어요.');
    kit.note('수레 1이 수레 2보다 빠를 때(v₁ > v₂)만 서로 가까워져 충돌해요.');

    function solve() {
      const e = E[type], app = v1 > v2, M = m1 + m2;
      const u1 = app ? ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / M : v1;
      const u2 = app ? ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / M : v2;
      const K0 = 0.5 * (m1 * v1 * v1 + m2 * v2 * v2), K1 = 0.5 * (m1 * u1 * u1 + m2 * u2 * u2);
      S = { e, app, u1, u2, K0, K1, pre: [m1 * v1, m2 * v2, m1 * v1 + m2 * v2], post: [m1 * u1, m2 * u2, m1 * u1 + m2 * u2] };
      ro1.set(app ? sg(u1, 2) + ' m/s' : '충돌 없음');
      ro2.set(app ? sg(u2, 2) + ' m/s' : '충돌 없음');
      const loss = K0 - K1;
      roK.set(!app ? '–' : loss < 0.05 ? '0 J (보존)' : loss.toFixed(1) + ' J');
    }

    // 수레 크기: 질량이 클수록 크게
    const cw = (m) => (narrow ? 28 : 40) + m * (narrow ? 6.4 : 9);
    const chh = (m) => (narrow ? 20 : 26) + m * (narrow ? 2.6 : 3.4);
    // 화면 배치와 시간표: 다가갈 때는 트랙 가운데에서 부딪히도록 출발 위치를 거꾸로 계산
    function geom(W) {
      const L = 12, R = W - 12, c = (L + R) / 2, half = (R - L) / 2;
      const w1 = cw(m1), w2 = cw(m2);
      const k = (half - cw(5) - 6) / (6 * 1.15);           // 화면 px / m
      const TMAX = 3.2;
      if (S.app) {
        let tPre = 2.2;
        if (v1 > 0) tPre = Math.min(tPre, (half - w1 - 4) / (k * v1));
        if (v2 < 0) tPre = Math.min(tPre, (half - w2 - 4) / (k * -v2));
        let s = TMAX;
        if (S.u1 < 0) s = Math.min(s, (c - w1 - L) / (k * -S.u1));
        if (S.u2 > 0) s = Math.min(s, (R - c - w2) / (k * S.u2));
        return { L, R, c, w1, w2, k, tPre, tEnd: tPre + s };
      }
      const a0 = c - 16 - w1, b0 = c + 16;
      let s = TMAX;
      if (v1 < 0) s = Math.min(s, (a0 - L) / (k * -v1));
      if (v2 > 0) s = Math.min(s, (R - b0 - w2) / (k * v2));
      return { L, R, c, w1, w2, k, tPre: Infinity, tEnd: s, a0, b0 };
    }
    // 두 수레의 왼쪽 끝 x
    function pos(g, tt) {
      const te = Math.min(tt, g.tEnd);
      if (S.app) {
        if (te < g.tPre) { const d = g.tPre - te; return [g.c - v1 * g.k * d - g.w1, g.c - v2 * g.k * d]; }
        const s = te - g.tPre; return [g.c + S.u1 * g.k * s - g.w1, g.c + S.u2 * g.k * s];
      }
      return [g.a0 + v1 * g.k * te, g.b0 + v2 * g.k * te];
    }
    function rr(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function cart(ctx, x, w, h, yb, col, m, C) {
      const y = yb - 6 - h;
      ctx.save(); rr(ctx, x, y, w, h, 5);
      ctx.globalAlpha = 0.2; ctx.fillStyle = col; ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      D.circle(ctx, x + w * 0.26, yb - 5, 5, { fill: C.fg }); D.circle(ctx, x + w * 0.74, yb - 5, 5, { fill: C.fg });
      D.text(ctx, num(m) + ' kg', x + w / 2, y + h / 2, { size: narrow ? 11 : 13, bold: true, color: col });
    }
    function vArrow(ctx, cx, y, v, col, lab, W) {
      const ka = narrow ? 5.5 : 8, Lx = v * ka;
      const zero = Math.abs(v) < 0.05;
      if (zero) D.circle(ctx, cx, y, 3.5, { fill: col }); else D.arrow(ctx, cx, y, cx + Lx, y, col, 3, 9);
      const txt = zero ? `${lab} = 0` : `${lab} ${sg(v)} m/s`;
      ctx.font = FONT(12, true); const tw = ctx.measureText(txt).width;
      let tx = zero ? cx + 8 : v > 0 ? cx + Lx + 6 : cx + Lx - 6 - tw;
      // 화살표 끝 쪽에 자리가 없으면 꼬리 쪽으로
      if (!zero && v > 0 && tx + tw > W - 4) tx = cx - 6 - tw;
      if (!zero && v < 0 && tx < 4) tx = cx + 6;
      tx = Math.max(4, Math.min(W - 4 - tw, tx));
      D.text(ctx, txt, tx, y, { size: 12, bold: true, color: col, align: 'left' });
    }

    function pChart(ctx, r, C, ghost) {
      D.text(ctx, '운동량 (kg·m/s)', r.x, r.y + 9, { size: 12.5, bold: true, align: 'left', color: C.fg });
      const py0 = r.y + 32, py1 = r.y + r.h - 34;
      const vals = S.pre.concat(S.post);
      let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
      const span = Math.max(hi - lo, 2);
      if (hi > 0) hi += span * 0.17; if (lo < 0) lo -= span * 0.17;
      if (hi - lo < 2) hi = lo + 2;
      const Y = (v) => py1 - (v - lo) / (hi - lo) * (py1 - py0);
      const slot = r.w / 7.1, bw = slot * 0.64, y0 = Y(0);
      const cols = [C.blue, C.purple, C.green], names = ['p₁', 'p₂', '합'];
      D.line(ctx, [[r.x, Y(S.pre[2])], [r.x + r.w, Y(S.pre[2])]], C.green, 1.3, [4, 4]);
      [0, 1].forEach((gi) => {
        const arr = gi ? S.post : S.pre, gx = r.x + slot * (0.25 + gi * 3.75);
        const gh = gi && ghost;
        arr.forEach((v, i) => {
          const x = gx + i * slot, yv = Y(v);
          ctx.save(); ctx.globalAlpha = gh ? 0.18 : 0.88; ctx.fillStyle = cols[i];
          ctx.fillRect(x, Math.min(y0, yv), bw, Math.max(1.5, Math.abs(yv - y0))); ctx.restore();
          if (!gh) D.text(ctx, sgs(v), x + bw / 2, v >= 0 ? yv - 8 : yv + 9, { size: 11, color: cols[i], bold: true });
          D.text(ctx, names[i], x + bw / 2, py1 + 13, { size: 11.5, color: C.muted });
        });
        D.text(ctx, gi ? (S.app ? '충돌 후' : '충돌 없음') : '충돌 전', gx + slot * 1.32, py1 + 28, { size: 12, bold: true, color: gh ? C.muted : C.fg });
      });
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r.x, y0); ctx.lineTo(r.x + r.w, y0); ctx.stroke();
    }
    function kChart(ctx, r, C, ghost) {
      D.text(ctx, '운동 에너지 합', r.x, r.y + 9, { size: 12.5, bold: true, align: 'left', color: C.fg });
      const py0 = r.y + 32, py1 = r.y + r.h - 34;
      const top = Math.max(S.K0, S.K1, 1) * 1.17;
      const Y = (v) => py1 - v / top * (py1 - py0);
      const slot = r.w / 2, bw = Math.min(slot * 0.56, 46);
      [[S.K0, '전'], [S.K1, '후']].forEach(([v, nm], i) => {
        const x = r.x + slot * i + (slot - bw) / 2, gh = i && ghost;
        ctx.save(); ctx.globalAlpha = gh ? 0.18 : 0.88; ctx.fillStyle = C.orange;
        ctx.fillRect(x, Y(v), bw, Math.max(1.5, py1 - Y(v))); ctx.restore();
        if (!gh) D.text(ctx, num(v) + ' J', x + bw / 2, Y(v) - 8, { size: 11, bold: true, color: C.orange });
        D.text(ctx, nm, x + bw / 2, py1 + 13, { size: 11.5, color: C.muted });
      });
      const loss = S.K0 - S.K1;
      if (!ghost && S.app && loss > 0.005) {      // 처음 높이를 점선으로: 줄어든 만큼이 손실
        const x = r.x + slot + (slot - bw) / 2, gap = Y(S.K1) - Y(S.K0);
        D.line(ctx, [[x - 4, Y(S.K0)], [x + bw + 4, Y(S.K0)]], C.red, 1.6, [4, 3]);
        if (gap > 40) D.text(ctx, '손실', x + bw / 2, Y(S.K0) + (gap - 16) / 2, { size: 11, bold: true, color: C.red });
      }
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r.x, py1); ctx.lineTo(r.x + r.w, py1); ctx.stroke();
      if (!ghost && S.app) D.text(ctx, S.e === 1 ? '보존' : '감소', r.x + r.w / 2, py1 + 28, { size: 12, bold: true, color: S.e === 1 ? C.green : C.red });
    }

    function render() {
      const { ctx, W, H } = cv, C = kit.C;
      ctx.clearRect(0, 0, W, H);
      const g = geom(W);
      const TH = narrow ? 140 : 164;               // 트랙 영역 높이
      const ty = TH - (narrow ? 22 : 28);          // 트랙(바퀴 바닥) y
      // 트랙과 양 끝 막이
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(g.L - 4, ty); ctx.lineTo(g.R + 4, ty); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.L - 4, ty); ctx.lineTo(g.L - 4, ty - 14); ctx.moveTo(g.R + 4, ty); ctx.lineTo(g.R + 4, ty - 14); ctx.stroke();
      // 상태 글
      const after = S.app && t >= g.tPre;
      const stat = !S.app ? '가까워지지 않아 충돌하지 않아요' : after ? (S.e === 0 ? '충돌 후 — 한 덩어리로 운동' : '충돌 후') : '충돌 전 — 다가가는 중';
      D.text(ctx, stat, 10, 14, { size: 12.5, bold: true, align: 'left', color: !S.app ? C.red : C.fg });
      D.arrow(ctx, W - 44, ty + 12, W - 14, ty + 12, C.muted, 1.6, 7);
      D.text(ctx, '(+)', W - 48, ty + 12, { size: 11, color: C.muted, align: 'right' });
      // 수레
      const [a, b] = pos(g, t);
      cart(ctx, a, g.w1, chh(m1), ty, C.blue, m1, C);
      cart(ctx, b, g.w2, chh(m2), ty, C.purple, m2, C);
      // 속도 화살표 (두 줄로 나눠 겹치지 않게)
      const topMax = ty - 6 - chh(5);
      const u1 = after ? S.u1 : v1, u2 = after ? S.u2 : v2;
      vArrow(ctx, a + g.w1 / 2, topMax - 30, u1, C.blue, after ? 'v₁′' : 'v₁', W);
      vArrow(ctx, b + g.w2 / 2, topMax - 12, u2, C.purple, after ? 'v₂′' : 'v₂', W);
      // 충돌 순간 반짝임
      if (S.app && t >= g.tPre && t < g.tPre + 0.35) {
        const al = 1 - (t - g.tPre) / 0.35, cy = ty - 6 - Math.min(chh(m1), chh(m2)) / 2;
        ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
          const an = i * Math.PI / 4 + 0.39;
          ctx.beginPath(); ctx.moveTo(g.c + Math.cos(an) * 9, cy + Math.sin(an) * 9); ctx.lineTo(g.c + Math.cos(an) * 21, cy + Math.sin(an) * 21); ctx.stroke();
        }
        ctx.restore();
      }
      // 구분선
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, TH); ctx.lineTo(W - 8, TH); ctx.stroke();
      // 막대그래프
      const ghost = S.app && !after;
      const y0 = TH + 10, hh = H - y0 - 6;
      if (narrow) {
        pChart(ctx, { x: 10, y: y0, w: W * 0.66 - 10, h: hh }, C, ghost);
        kChart(ctx, { x: W * 0.71, y: y0, w: W * 0.29 - 8, h: hh }, C, ghost);
      } else {
        pChart(ctx, { x: 24, y: y0, w: W * 0.6 - 24, h: hh }, C, ghost);
        kChart(ctx, { x: W * 0.69, y: y0, w: W * 0.27, h: hh }, C, ghost);
      }
    }
    solve();
    cv.onResize(render);
    render();
  },
});
