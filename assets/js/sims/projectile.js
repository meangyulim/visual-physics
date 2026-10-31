/* 포물선 운동 — 궤적, 속도 성분 화살표(수평 일정·연직 변화), 같은 시간 간격 점, 이전 궤적 점선 비교 */
SIM.register('projectile', {
  title: '포물선 운동',
  hint: '처음 속력·발사각·발사 높이를 바꿔 보세요. 회색 점선은 바꾸기 전의 궤적이에요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 0.8 : 0.56, maxH: 520 });
    const D = kit.draw, g = 9.8, MI = '−';
    const FONT = (s, b) => `${b ? '700' : '500'} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
    const sg = (v, d = 1) => { const s = Math.abs(v).toFixed(d); return +s === 0 ? s : (v > 0 ? '+' : MI) + s; };
    let cur = { v0: 20, th: 45, h: 0 }, prev = null, editing = false, lastEdit = 0, t = 0;
    const calc = (p) => {
      const a = p.th * Math.PI / 180, vx = p.v0 * Math.cos(a), vy = p.v0 * Math.sin(a);
      const T = (vy + Math.sqrt(vy * vy + 2 * g * p.h)) / g;
      return { vx, vy, T, H: p.h + vy * vy / (2 * g), R: vx * T, h: p.h, ta: vy / g };
    };
    let tc = calc(cur), tp = null;
    // 슬라이더를 움직이기 시작할 때의 궤적을 '이전 궤적'으로 남김
    function edit(key, val) {
      if (!editing) { prev = { ...cur }; tp = calc(prev); editing = true; }
      cur = { ...cur, [key]: val }; tc = calc(cur); t = 0; lastEdit = performance.now(); upd();
    }
    kit.slider({ label: '처음 속력 v₀', min: 5, max: 30, step: 1, value: cur.v0, unit: 'm/s', onInput: (v) => edit('v0', v) });
    kit.slider({ label: '발사각 θ', min: 0, max: 90, step: 1, value: cur.th, fmt: (v) => v + '°', onInput: (v) => edit('th', v) });
    kit.slider({ label: '발사 높이 h', min: 0, max: 20, step: 1, value: cur.h, unit: 'm', onInput: (v) => edit('h', v) });
    const rT = kit.readout('체공 시간'), rH = kit.readout('최고점 높이'), rR = kit.readout('수평 도달 거리');
    function upd() { rT.set(tc.T.toFixed(2) + ' s'); rH.set(tc.H.toFixed(1) + ' m'); rR.set(tc.R.toFixed(1) + ' m'); }
    const loop = kit.loop((dt) => {
      if (editing && performance.now() - lastEdit > 700) editing = false;
      t += dt; if (t > tc.T + 1.5) t = 0;
      render();
    });
    const pb = kit.playButton(loop);
    kit.button('↺ 다시 던지기', () => { t = 0; loop.play(); pb.textContent = '⏸ 정지'; });
    kit.button('점선 지우기', () => { prev = null; tp = null; });
    kit.note('수평 방향은 힘이 없어 <b>v<sub>x</sub>가 일정</b>해요(같은 시간 간격의 점들이 수평으로 같은 간격). 연직 방향은 중력 때문에 <b>v<sub>y</sub>가 1초에 9.8 m/s씩</b> 줄어들고, 최고점에서 v<sub>y</sub> = 0이에요.');
    kit.note('발사 높이가 0이면 같은 속력에서 45°일 때 가장 멀리 가고, 30°와 60°처럼 합이 90°인 두 각은 도달 거리가 같아요.');

    const NICE = [8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200];
    const pathPts = (c, X, Y, t1 = c.T) => {
      const pts = [], n = 90;
      for (let i = 0; i <= n; i++) { const tt = t1 * i / n; pts.push([X(c.vx * tt), Y(c.h + c.vy * tt - 0.5 * g * tt * tt)]); }
      return pts;
    };
    function subLabel(ctx, base, sub, tail, x, y, col, align) {
      ctx.save(); ctx.fillStyle = col; ctx.textBaseline = 'middle';
      ctx.font = FONT(13, true); const w1 = ctx.measureText(base).width;
      ctx.font = FONT(11, true); const w2 = ctx.measureText(sub).width;
      ctx.font = FONT(12.5, true); const w3 = ctx.measureText(tail).width;
      const tw = w1 + w2 + w3; let x0 = align === 'right' ? x - tw : align === 'center' ? x - tw / 2 : x;
      ctx.textAlign = 'left';
      ctx.font = FONT(13, true); ctx.fillText(base, x0, y);
      ctx.font = FONT(11, true); ctx.fillText(sub, x0 + w1, y + 4);
      ctx.font = FONT(12.5, true); ctx.fillText(tail, x0 + w1 + w2, y);
      ctx.restore(); return tw;
    }

    function render() {
      const { ctx, W, H } = cv, C = kit.C;
      ctx.clearRect(0, 0, W, H);
      const pl = narrow ? 34 : 42, pr = 14, pt = 62, pbm = 30, tw = 14;
      const plotW = W - pl - pr - tw, plotH = H - pt - pbm;
      let xm = Math.max(tc.R, 4), ym = Math.max(tc.H, 3);
      if (tp) { xm = Math.max(xm, tp.R); ym = Math.max(ym, tp.H); }
      let sc = Math.min(plotW / (xm * 1.04), plotH / (ym * 1.1));
      const span = NICE.find((n) => n >= plotW / sc) || 200;
      sc = plotW / span;
      const x0 = pl + tw, y0 = H - pbm;
      const X = (x) => x0 + x * sc, Y = (y) => y0 - y * sc;
      // 격자와 눈금
      const steps = [1, 2, 5, 10, 20, 25, 50];
      const step = steps.find((s) => span / s <= (narrow ? 5 : 8)) || 50;
      ctx.lineWidth = 1;
      const nx = Math.floor(span / step + 1e-9);
      for (let k = 0; k <= nx; k++) {
        const xx = X(k * step), last = k === nx;
        ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(xx, pt - 6); ctx.lineTo(xx, y0); ctx.stroke();
        const lab = String(k * step) + (last ? ' m' : '');
        if (last && xx + 20 > W) D.text(ctx, lab, W - 2, y0 + 13, { size: 11, color: C.muted, align: 'right' });
        else D.text(ctx, lab, xx, y0 + 13, { size: 11, color: C.muted });
      }
      for (let k = 1; Y(k * step) >= pt - 6; k++) {
        const yy = Y(k * step);
        ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(pl - 2, yy); ctx.lineTo(W - pr, yy); ctx.stroke();
        D.text(ctx, String(k * step), pl - 6, yy, { size: 11, color: C.muted, align: 'right' });
      }
      // 땅
      ctx.save(); ctx.fillStyle = C.muted; ctx.globalAlpha = 0.12; ctx.fillRect(pl - 2, y0, W - pr - pl + 2, pbm); ctx.restore();
      ctx.strokeStyle = C.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pl - 2, y0); ctx.lineTo(W - pr, y0); ctx.stroke();
      // 발사대
      if (tc.h > 0) {
        ctx.save(); ctx.fillStyle = C.muted; ctx.globalAlpha = 0.3; ctx.fillRect(x0 - tw, Y(tc.h), tw, y0 - Y(tc.h)); ctx.restore();
        ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.strokeRect(x0 - tw, Y(tc.h), tw, y0 - Y(tc.h));
      }
      // 이전 궤적
      if (tp) {
        D.line(ctx, pathPts(tp, X, Y), C.muted, 2, [6, 5]);
        D.text(ctx, '이전', X(tp.vx * tp.ta), Y(tp.H) - 11, { size: 11, bold: true, color: C.muted });
      }
      // 현재 궤적(예정 경로는 옅게, 지나온 경로는 진하게)
      const tt = Math.min(t, tc.T);
      ctx.save(); ctx.globalAlpha = 0.3; D.line(ctx, pathPts(tc, X, Y), C.blue, 1.6); ctx.restore();
      D.line(ctx, pathPts(tc, X, Y, tt), C.blue, 2.8);
      // 발사각 표시
      if (cur.th >= 6 && cur.th <= 84) {
        const lx = X(0), ly = Y(tc.h), rA = 22;
        D.line(ctx, [[lx, ly], [lx + rA + 10, ly]], C.muted, 1.2, [3, 3]);
        ctx.strokeStyle = C.orange; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(lx, ly, rA, -cur.th * Math.PI / 180, 0); ctx.stroke();
        const am = -cur.th * Math.PI / 360;
        D.text(ctx, 'θ', lx + (rA + 9) * Math.cos(am), ly + (rA + 9) * Math.sin(am), { size: 12, bold: true, color: C.orange });
      }
      // 같은 시간 간격 점 + 땅·높이 눈금에 투영
      const ds = [0.1, 0.2, 0.25, 0.5, 1].find((d) => tc.T / d <= 14) || 1;
      for (let k = 1; k * ds <= tt + 1e-9; k++) {
        const s = k * ds, px = X(tc.vx * s), py = Y(tc.h + tc.vy * s - 0.5 * g * s * s);
        D.circle(ctx, px, py, 3.2, { fill: C.blue });
        ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(px, y0 - 5); ctx.lineTo(px, y0 + 1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pl - 2, py); ctx.lineTo(pl + 5, py); ctx.stroke();
      }
      // 최고점
      if (tc.vy > 0.3) {
        const ax = X(tc.vx * tc.ta), ay = Y(tc.H);
        D.line(ctx, [[pl, ay], [ax, ay]], C.muted, 1.1, [2, 4]);
        if (cur.th > 70) D.text(ctx, '최고점', ax + 12, ay, { size: 11, color: C.muted, align: 'left' });
        else D.text(ctx, '최고점', ax, ay - 12, { size: 11, color: C.muted });
      }
      // 공과 속도 성분
      const bx = X(tc.vx * tt), by = Y(tc.h + tc.vy * tt - 0.5 * g * tt * tt), vyt = tc.vy - g * tt;
      const kv = narrow ? 2.4 : 3.6;
      const ex = bx + tc.vx * kv, ey = by - vyt * kv;
      if (Math.abs(tc.vx) > 0.2 && Math.abs(vyt) > 0.2) {
        D.line(ctx, [[ex, by], [ex, ey], [bx, ey]], C.muted, 1, [3, 3]);
        ctx.save(); ctx.globalAlpha = 0.4; D.arrow(ctx, bx, by, ex, ey, C.blue, 2.5, 9); ctx.restore();
      }
      if (tc.vx > 0.2) {
        D.arrow(ctx, bx, by, ex, by, C.blue, 3, 9);
        subLabel(ctx, 'v', 'x', '', ex + 5, by + (vyt > 0 ? 10 : -10), C.blue, 'left');
      }
      if (Math.abs(vyt) > 0.2) {
        D.arrow(ctx, bx, by, bx, ey, C.blue, 3, 9);
        subLabel(ctx, 'v', 'y', '', bx - 7, ey + (vyt > 0 ? 4 : -4), C.blue, 'right');
      }
      D.circle(ctx, bx, by, 7, { fill: C.blue, stroke: C.card, width: 1.5 });
      // 왼쪽 위: 시간과 속도 성분 값, 오른쪽 위: 가속도
      D.text(ctx, `t = ${tt.toFixed(2)} s`, pl, 12, { size: 12.5, bold: true, align: 'left', color: C.fg });
      const lw = subLabel(ctx, 'v', 'x', ` = ${tc.vx.toFixed(1)} m/s`, pl, 29, C.blue, 'left');
      D.text(ctx, '(일정)', pl + lw + 5, 29, { size: 11, color: C.muted, align: 'left' });
      subLabel(ctx, 'v', 'y', ` = ${sg(vyt)} m/s`, pl, 46, C.blue, 'left');
      D.arrow(ctx, W - pr - 8, 6, W - pr - 8, 34, C.green, 3, 8);
      D.text(ctx, '가속도 g (아래로 일정)', W - pr - 18, 20, { size: 11.5, bold: true, color: C.green, align: 'right' });
    }
    upd();
    cv.onResize(render);
    render();
  },
});
