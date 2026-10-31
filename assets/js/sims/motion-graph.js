/* 등가속도 직선 운동: 수레 + x-t, v-t 그래프 (기울기·넓이 연결) */
SIM.register('motion-graph', {
  title: '등가속도 직선 운동과 그래프',
  hint: '처음 속도와 가속도를 바꾸고 재생해 보세요. v-t 그래프의 넓이가 곧 이동한 변위예요.',
  init(kit) {
    const T = 6;
    let v0 = 2, a = 1, t = 0;
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.12 : 0.6, maxH: 560 });
    const sv = kit.slider({ label: '처음 속도 v₀', min: -6, max: 8, step: 0.5, value: v0, unit: 'm/s', onInput: (v) => { v0 = v; t = 0; } });
    const sa = kit.slider({ label: '가속도 a', min: -3, max: 3, step: 0.25, value: a, unit: 'm/s²', onInput: (v) => { a = v; t = 0; } });
    const rt = kit.readout('시간 t'), rx = kit.readout('변위 x'), rv = kit.readout('속도 v');
    const loop = kit.loop((dt) => { t = Math.min(T, t + dt); render(); });
    kit.playButton(loop);
    kit.button('↺ 처음부터', () => { t = 0; loop.play(); });
    kit.note('파란 화살표 = 속도, 초록 화살표 = 가속도. 둘의 방향이 같으면 빨라지고, 반대면 느려져요. v = 0인 순간 운동 방향이 바뀌어요.');

    const X = (tt) => v0 * tt + 0.5 * a * tt * tt;
    const V = (tt) => v0 + a * tt;

    function render() {
      const { ctx, W, H } = cv, C = kit.C, D = kit.draw;
      ctx.clearRect(0, 0, W, H);
      // x 범위
      let xmin = 0, xmax = 0, vmin = 0, vmax = 0;
      for (let k = 0; k <= 60; k++) { const tt = T * k / 60; xmin = Math.min(xmin, X(tt)); xmax = Math.max(xmax, X(tt)); vmin = Math.min(vmin, V(tt)); vmax = Math.max(vmax, V(tt)); }
      const padx = (xmax - xmin) * 0.08 + 1; xmin -= padx; xmax += padx;
      vmin = Math.min(vmin, -1); vmax = Math.max(vmax, 1);
      const vpad = (vmax - vmin) * 0.12; vmin -= vpad; vmax += vpad;
      // 레이아웃
      const trackH = narrow ? H * 0.2 : H * 0.3;
      const gy = trackH + (narrow ? 40 : 30);
      let r1, r2;
      if (narrow) { const gh = (H - gy - 46) / 2; r1 = { x: 44, y: gy, w: W - 70, h: gh - 10 }; r2 = { x: 44, y: gy + gh + 30, w: W - 70, h: gh - 10 }; }
      else { const gw = (W - 120) / 2; r1 = { x: 44, y: gy, w: gw, h: H - gy - 32 }; r2 = { x: 44 + gw + 60, y: gy, w: gw, h: H - gy - 32 }; }
      // 트랙
      const TX = (x) => 30 + (x - xmin) / (xmax - xmin) * (W - 60);
      const ty = trackH * 0.62;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, ty + 16); ctx.lineTo(W - 20, ty + 16); ctx.stroke();
      ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(TX(0), ty - 24); ctx.lineTo(TX(0), ty + 22); ctx.stroke(); ctx.setLineDash([]);
      D.text(ctx, 'x = 0', TX(0), ty + 30, { size: 11, color: C.muted });
      const cx = TX(X(t));
      ctx.fillStyle = C.blue; ctx.globalAlpha = 0.18; ctx.fillRect(cx - 22, ty - 12, 44, 26); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.strokeRect(cx - 22, ty - 12, 44, 26);
      D.circle(ctx, cx - 12, ty + 15, 4, { fill: C.fg }); D.circle(ctx, cx + 12, ty + 15, 4, { fill: C.fg });
      const vv = V(t), sc = 9;
      if (Math.abs(vv) > 0.05) D.arrow(ctx, cx, ty - 22, cx + vv * sc, ty - 22, C.blue, 3, 9);
      if (Math.abs(a) > 0.01) D.arrow(ctx, cx, ty - 36, cx + a * sc * 2.2, ty - 36, C.green, 3, 9);
      D.text(ctx, 'v', cx + vv * sc + (vv >= 0 ? 10 : -10), ty - 22, { size: 12, color: C.blue, bold: true });
      if (Math.abs(a) > 0.01) D.text(ctx, 'a', cx + a * sc * 2.2 + (a >= 0 ? 10 : -10), ty - 36, { size: 12, color: C.green, bold: true });
      // x-t
      const A1 = D.axes(ctx, r1, { xlabel: 't', ylabel: 'x', xmin: 0, xmax: T, ymin: Math.min(xmin, 0), ymax: xmax });
      const pts = []; for (let k = 0; k <= 80; k++) { const tt = T * k / 80; pts.push([A1.X(tt), A1.Y(X(tt))]); }
      D.line(ctx, pts, C.muted, 1.5, [4, 4]);
      const done = pts.filter((p, i) => T * i / 80 <= t); D.line(ctx, done, C.blue, 3);
      // 접선 (기울기 = 속도)
      const x0p = A1.X(t), y0p = A1.Y(X(t)), dtt = 0.9;
      D.line(ctx, [[A1.X(t - dtt), A1.Y(X(t) - V(t) * dtt)], [A1.X(t + dtt), A1.Y(X(t) + V(t) * dtt)]], C.orange, 2);
      D.circle(ctx, x0p, y0p, 5, { fill: C.blue });
      D.text(ctx, '접선 기울기 = v', r1.x + r1.w - 4, r1.y + 6, { size: 11, color: C.orange, align: 'right' });
      // v-t
      const A2 = D.axes(ctx, r2, { xlabel: 't', ylabel: 'v', xmin: 0, xmax: T, ymin: vmin, ymax: vmax });
      ctx.save(); ctx.beginPath(); ctx.moveTo(A2.X(0), A2.Y(0));
      for (let k = 0; k <= 60; k++) { const tt = t * k / 60; ctx.lineTo(A2.X(tt), A2.Y(V(tt))); }
      ctx.lineTo(A2.X(t), A2.Y(0)); ctx.closePath(); ctx.fillStyle = C.blue; ctx.globalAlpha = 0.16; ctx.fill(); ctx.restore();
      D.line(ctx, [[A2.X(0), A2.Y(V(0))], [A2.X(T), A2.Y(V(T))]], C.muted, 1.5, [4, 4]);
      D.line(ctx, [[A2.X(0), A2.Y(V(0))], [A2.X(t), A2.Y(V(t))]], C.blue, 3);
      D.circle(ctx, A2.X(t), A2.Y(V(t)), 5, { fill: C.blue });
      D.text(ctx, '넓이 = 변위,  기울기 = a', r2.x + r2.w - 4, r2.y + 6, { size: 11, color: C.green, align: 'right' });
      rt.set(t.toFixed(1) + ' s'); rx.set(X(t).toFixed(1) + ' m'); rv.set(V(t).toFixed(1) + ' m/s');
    }
    cv.onResize(render);
    render();
  },
});
