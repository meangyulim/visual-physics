/* 빛 시계 — 우주선 안(위아래 왕복) vs 밖의 관찰자(지그재그), 똑딱 수 비교, γ, 길이 수축 L = L₀/γ */
SIM.register('light-clock', {
  title: '빛 시계: 시간 지연과 길이 수축',
  hint: '우주선의 속력을 바꿔 보세요. 밖에서 보면 빛이 더 긴 비스듬한 길을 가요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.3 : 0.535, maxH: 500 });
    const D = kit.draw, T0 = 1.6;                 // 정지한 빛 시계의 1 똑딱(화면 초)
    let beta = 0.6, t = 0, tc = 0;                // tc: 오른쪽 우주선이 이번에 왼쪽에서 출발한 시각
    const gam = () => 1 / Math.sqrt(1 - beta * beta);
    const geo = () => (narrow ? { d: 62, L0: 158, mw: 30 } : { d: 92, L0: 214, mw: 36 });
    const cpx = () => 2 * geo().d / T0;           // 빛의 속력 (px/s)
    const stars = [];
    for (let i = 0; i < 16; i++) stars.push([Math.random(), Math.random()]);

    kit.slider({ label: '우주선의 속력 v', min: 0, max: 0.98, step: 0.01, value: beta, fmt: (v) => v.toFixed(2) + ' c', onInput: (v) => { beta = v; t = 0; tc = 0; upd(); } });
    const rg = kit.readout('γ (감마)'), rt = kit.readout('밖에서 잰 1 똑딱'), rl = kit.readout('우주선 길이 L');
    function upd() { const g = gam(); rg.set(g.toFixed(2)); rt.set(g.toFixed(2) + ' t₀'); rl.set((1 / g).toFixed(2) + ' L₀'); }
    const loop = kit.loop((dt) => {
      t += dt;
      const L = layout(cv.W, cv.H), Lc = geo().L0 / gam();
      if (beta > 0 && xs(L.pB, t) > L.pB.x + L.pB.w - Lc / 2 - 12) tc = t;   // 오른쪽 끝에 닿으면 다시 왼쪽에서
      render();
    });
    const pb = kit.playButton(loop);
    kit.button('↺ 처음부터', () => { t = 0; tc = 0; loop.play(); pb.textContent = '⏸ 정지'; });
    const [sA, sB] = narrow ? ['위쪽', '아래쪽'] : ['왼쪽', '오른쪽'];
    kit.note(`빛의 속력은 어느 관찰자에게나 c예요. 밖에서 보면 빛이 더 긴 비스듬한 경로를 가야 하므로 한 번 똑딱하는 데 <b>γ배 더 오래</b> 걸려요 → 움직이는 시계가 느리게 가요(<b>시간 지연</b>). 그래서 같은 시간 동안 ${sB} 시계의 똑딱 수가 더 적어요.`);
    kit.note(`${sA} 시계는 시계와 함께 움직이는 관찰자가 본 모습이라 정지한 시계와 똑같이 똑딱여요. 운동 방향의 길이는 밖에서 재면 L₀/γ로 짧아져요(<b>길이 수축</b>). 운동 방향에 수직인 거울 사이 거리 d는 그대로예요.`);

    function layout(W, H) {
      if (narrow) return { pA: { x: 0, y: 0, w: W, h: 152 }, pB: { x: 0, y: 158, w: W, h: 188 }, lb: { x: 0, y: 352, w: W, h: H - 352 } };
      return { pA: { x: 0, y: 0, w: W * 0.36 - 3, h: 318 }, pB: { x: W * 0.36 + 3, y: 0, w: W * 0.64 - 3, h: 318 }, lb: { x: 0, y: 326, w: W, h: H - 326 } };
    }
    // 오른쪽 우주선 중심 x
    function xs(pB, tt) {
      const Lc = geo().L0 / gam();
      if (beta === 0) return pB.x + pB.w / 2;
      return pB.x + Lc / 2 + 12 + beta * cpx() * (tt - tc);
    }
    // 빛의 높이: 아래 거울에서 출발해 위아래 왕복 (주기 per)
    const yPh = (cy, d, tt, per) => { const f = tt / per - Math.floor(tt / per); return f < 0.5 ? cy + d / 2 - 2 * f * d : cy - d / 2 + (2 * f - 1) * d; };

    function rr(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function ship(ctx, cx, cy, len, k, C, flash) {   // k = 가로 줄어듦 비율 (1/γ)
      const { d, mw } = geo(), hh = d + 36, nose = len * 0.2, x0 = cx - len / 2, x1 = cx + len / 2;
      ctx.save(); ctx.beginPath();
      ctx.moveTo(x0, cy - hh / 2); ctx.lineTo(x1 - nose, cy - hh / 2); ctx.lineTo(x1, cy); ctx.lineTo(x1 - nose, cy + hh / 2); ctx.lineTo(x0, cy + hh / 2);
      ctx.lineTo(x0 - len * 0.06, cy + hh / 2 + 9); ctx.lineTo(x0 - len * 0.06, cy - hh / 2 - 9); ctx.closePath();
      ctx.fillStyle = C.bg; ctx.fill(); ctx.fillStyle = C.blue; ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
      // 거울
      const hw = mw / 2 * k;
      ctx.strokeStyle = C.fg; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - hw, cy - d / 2 - 2); ctx.lineTo(cx + hw, cy - d / 2 - 2); ctx.moveTo(cx - hw, cy + d / 2 + 2); ctx.lineTo(cx + hw, cy + d / 2 + 2); ctx.stroke();
      if (flash > 0) { ctx.save(); ctx.globalAlpha = flash; ctx.strokeStyle = C.orange; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - hw - 3, cy + d / 2 + 4); ctx.lineTo(cx + hw + 3, cy + d / 2 + 4); ctx.stroke(); ctx.restore(); }
    }
    function photon(ctx, x, y, C) {
      ctx.save(); ctx.globalAlpha = 0.25; D.circle(ctx, x, y, 10, { fill: C.purple }); ctx.restore();
      D.circle(ctx, x, y, 5, { fill: C.purple });
    }
    function panel(ctx, r, C) { ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1.2; rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 10); ctx.stroke(); ctx.restore(); }
    function counter(ctx, x, y, n, C, align) {
      D.text(ctx, '똑딱', x - (align === 'right' ? 34 : -0), y, { size: 12, color: C.muted, align: align === 'right' ? 'right' : 'left' });
      D.text(ctx, String(n), x + (align === 'right' ? 0 : 34), y, { size: 20, bold: true, color: C.purple, align: align === 'right' ? 'right' : 'left' });
    }

    function render() {
      const { ctx, W, H } = cv, C = kit.C;
      ctx.clearRect(0, 0, W, H);
      const { pA, pB, lb } = layout(W, H), { d, L0 } = geo(), g = gam(), v = beta * cpx();
      panel(ctx, pA, C); panel(ctx, pB, C);
      // ── 왼쪽(위): 우주선 안에서 본 모습 ──
      const cxA = pA.x + pA.w * (narrow ? 0.4 : 0.5), cyA = pA.y + (narrow ? 88 : pA.h * 0.48);
      ctx.save(); ctx.beginPath(); rr(ctx, pA.x + 3, pA.y + 3, pA.w - 6, pA.h - 6, 9); ctx.clip();
      stars.forEach(([sx, sy]) => {    // 우주선 기준: 바깥 별이 뒤로 흘러감
        let x = (sx * pA.w - v * t) % pA.w; if (x < 0) x += pA.w;
        ctx.save(); ctx.globalAlpha = 0.45; D.circle(ctx, pA.x + x, pA.y + 24 + sy * (pA.h - 34), 1.6, { fill: C.muted }); ctx.restore();
      });
      ctx.restore();
      D.text(ctx, '우주선 안 관찰자가 본 빛 시계', pA.x + 12, pA.y + 16, { size: 12.5, bold: true, align: 'left', color: C.fg });
      const fA = (t % T0) < 0.22 && t > 0.05 ? 1 - (t % T0) / 0.22 : 0;
      ship(ctx, cxA, cyA, L0, 1, C, fA);
      D.line(ctx, [[cxA, cyA - d / 2], [cxA, cyA + d / 2]], C.purple, 2, [4, 4]);
      photon(ctx, cxA, yPh(cyA, d, t, T0), C);
      const nA = Math.floor(t / T0), nB = Math.floor(t / (g * T0));
      if (narrow) {
        counter(ctx, pA.x + pA.w - 14, cyA - 8, nA, C, 'right');
        D.text(ctx, '1 똑딱 = t₀', pA.x + pA.w - 14, cyA + 18, { size: 11.5, color: C.muted, align: 'right' });
      } else {
        counter(ctx, pA.x + pA.w / 2 - 30, pA.y + pA.h - 46, nA, C, 'left');
        D.text(ctx, '1 똑딱: 경로 2d, 시간 t₀', pA.x + pA.w / 2, pA.y + pA.h - 20, { size: 11.5, color: C.muted });
      }
      // ── 오른쪽(아래): 밖의 관찰자가 본 모습 ──
      const cyB = pB.y + (narrow ? 100 : pB.h * 0.48), Lc = L0 / g, x = xs(pB, t);
      ctx.save(); ctx.beginPath(); rr(ctx, pB.x + 3, pB.y + 3, pB.w - 6, pB.h - 6, 9); ctx.clip();
      stars.forEach(([sx, sy]) => { ctx.save(); ctx.globalAlpha = 0.45; D.circle(ctx, pB.x + 6 + sx * (pB.w - 12), pB.y + 24 + sy * (pB.h - 34), 1.6, { fill: C.muted }); ctx.restore(); });
      ctx.restore();
      D.text(ctx, '밖의 관찰자가 본 빛 시계', pB.x + 12, pB.y + 16, { size: 12.5, bold: true, align: 'left', color: C.fg });
      const per = g * T0, fB = (t % per) < 0.22 && t > 0.05 ? 1 - (t % per) / 0.22 : 0;
      ship(ctx, x, cyB, Lc, 1 / g, C, fB);
      // 빛의 지그재그 경로 (이번 출발 이후)
      const pts = [], k0 = Math.ceil((tc / per) * 2 + 1e-9), k1 = Math.floor((t / per) * 2);
      pts.push([xs(pB, tc), yPh(cyB, d, tc, per)]);
      for (let k = k0; k <= k1; k++) { const tk = k * per / 2; if (tk > tc && tk < t) pts.push([xs(pB, tk), yPh(cyB, d, tk, per)]); }
      pts.push([x, yPh(cyB, d, t, per)]);
      D.line(ctx, pts, C.purple, 2.2);
      photon(ctx, x, yPh(cyB, d, t, per), C);
      // 속도 화살표
      const hh = d + 36, ay = cyB - hh / 2 - 16;
      if (beta > 0) {
        const al = 18 + 44 * beta, ax0 = Math.min(x - 10, pB.x + pB.w - al - 80);
        D.arrow(ctx, ax0, ay, ax0 + al, ay, C.blue, 3, 9);
        D.text(ctx, `v = ${beta.toFixed(2)}c`, ax0 + al + 6, ay, { size: 12, bold: true, color: C.blue, align: 'left' });
      } else D.text(ctx, '정지 (v = 0)', x, ay, { size: 12, bold: true, color: C.blue });
      if (narrow) {
        counter(ctx, pB.x + pB.w - 14, pB.y + pB.h - 20, nB, C, 'right');
        D.text(ctx, `1 똑딱: 경로 ${(2 * g).toFixed(2)}d, 시간 ${g.toFixed(2)}t₀`, pB.x + 12, pB.y + pB.h - 18, { size: 11.5, color: C.muted, align: 'left' });
      } else {
        counter(ctx, pB.x + pB.w / 2 - 30, pB.y + pB.h - 46, nB, C, 'left');
        D.text(ctx, `1 똑딱: 경로 ${(2 * g).toFixed(2)}d (더 김), 시간 ${g.toFixed(2)}t₀`, pB.x + pB.w / 2, pB.y + pB.h - 20, { size: 11.5, color: C.muted });
      }
      // ── 길이 막대 ──
      const bx0 = narrow ? 104 : 170, bmax = narrow ? Math.min(150, W - bx0 - 106) : 300, bh = 14;
      const y1 = lb.y + (narrow ? 20 : 26), y2 = y1 + (narrow ? 32 : 36);
      D.text(ctx, '정지 길이 L₀', bx0 - 10, y1, { size: 12, bold: true, align: 'right', color: C.fg });
      ctx.save(); ctx.fillStyle = C.muted; ctx.globalAlpha = 0.2; ctx.fillRect(bx0, y1 - bh / 2, bmax, bh); ctx.restore();
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.strokeRect(bx0, y1 - bh / 2, bmax, bh);
      D.text(ctx, 'L₀', bx0 + bmax + 8, y1, { size: 12, bold: true, color: C.muted, align: 'left' });
      D.text(ctx, '밖에서 잰 길이 L', bx0 - 10, y2, { size: 12, bold: true, align: 'right', color: C.blue });
      ctx.save(); ctx.fillStyle = C.blue; ctx.globalAlpha = 0.35; ctx.fillRect(bx0, y2 - bh / 2, bmax / g, bh); ctx.restore();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 1.5; ctx.strokeRect(bx0, y2 - bh / 2, bmax / g, bh);
      D.text(ctx, `L₀/γ = ${(1 / g).toFixed(2)} L₀`, bx0 + bmax / g + 8, y2, { size: 12, bold: true, color: C.blue, align: 'left' });
    }
    upd();
    cv.onResize(render);
    render();
  },
});
