/* 도플러 효과: 움직이는 음원의 원형 파면, 앞·뒤 관찰자가 듣는 진동수 f′ = f·v/(v ∓ v_s) */
(function () {
  'use strict';
  const V = 340, F0 = 500;     // 음속 (m/s), 음원 진동수 (Hz)
  const TV = 0.55;             // 화면 속 파면 방출 주기 (s)
  const FONT = (s, b) => `${b ? 700 : 500} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;

  SIM.register('doppler', {
    title: '도플러 효과 — 움직이는 음원',
    hint: '음원(진동수 500\u00a0Hz)의 속력을 바꿔 보세요. 음속은 340\u00a0m/s로 일정해요.',
    init(kit) {
      const D = kit.draw;
      const narrow = kit.root.clientWidth < 560;
      let beta = 0.5, t = 0;

      const cv = kit.canvas({ aspect: narrow ? 0.8 : 0.5, maxH: 420 });
      kit.slider({
        label: '음원의 속력 v<sub>s</sub>', min: 0, max: 0.9, step: 0.05, value: beta,
        fmt: (b) => `${b.toFixed(2)}v (${Math.round(b * V)} m/s)`,
        onInput: (b) => {
          const W = cv.W, o = travel(W, beta), n = travel(W, b);
          if (isFinite(o) && isFinite(n)) t = t / o * n; else t = 0;
          beta = b;
        },
      });
      const out = (lab) => { const r = kit.readout(lab); let last = ''; return (s) => { if (s !== last) { last = s; r.set(s); } }; };
      const oB = out('뒤 관찰자 f′'), oS = out('음원 f'), oF = out('앞 관찰자 f′');
      const loop = kit.loop((dt) => {
        t += dt;
        const Tt = travel(cv.W, beta);
        if (isFinite(Tt)) { if (t >= Tt) t -= Tt; } else if (t > TV * 1000) t -= TV * 1000;
        render();
      });
      kit.playButton(loop);
      kit.button('↺ 처음부터', () => { t = 0; loop.play(); });
      kit.note('음원이 다가오는 앞쪽은 파면 간격(파장)이 짧아져 더 높은 소리(f′ > f)로, 멀어지는 뒤쪽은 파장이 길어져 더 낮은 소리(f′ < f)로 들려요. 소리의 속력은 그대로예요.');
      kit.note('파면이 관찰자에게 닿을 때마다 주황 테두리가 깜빡여요. 앞 관찰자 쪽이 더 자주 깜빡여요(진동수가 커요).');

      // 음원이 화면을 한 번 지나가는 시간 (방출 주기의 정수배)
      function travel(W, b) {
        const vs = b * W * 0.16;
        if (vs < 1e-6) return Infinity;
        return Math.max(TV, Math.round(Math.min(30, W * 0.44 / vs) / TV) * TV);
      }
      function tag(ctx, s, x, y, o) {
        ctx.save(); ctx.font = FONT(o.size || 12, o.bold);
        const w = ctx.measureText(s).width + 8, h = (o.size || 12) + 6;
        const al = o.align || 'center', x0 = al === 'left' ? x - 4 : al === 'right' ? x - w + 4 : x - w / 2;
        ctx.globalAlpha = 0.9; ctx.fillStyle = o.bg; ctx.fillRect(x0, y - h / 2, w, h); ctx.restore();
        D.text(ctx, s, x, y, o);
      }
      function person(ctx, x, y, C, flash) {
        if (flash > 0) D.circle(ctx, x, y, 12, { stroke: C.orange, width: 3.5 * flash + 0.5 });
        D.circle(ctx, x, y, 7, { fill: C.fg });
        ctx.save(); ctx.fillStyle = C.fg; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - 7, y + 10, 14, 20, 5); else ctx.rect(x - 7, y + 10, 14, 20);
        ctx.fill(); ctx.restore();
      }

      function render() {
        const { ctx, W, H } = cv, C = kit.C;
        ctx.clearRect(0, 0, W, H);
        const vv = W * 0.16, vs = beta * vv, Tt = travel(W, beta);
        const cx = W / 2, y0 = Math.round(H * 0.5);
        const xs = (tt) => (isFinite(Tt) ? cx + vs * (tt - Tt / 2) : cx);
        const xB = Math.max(18, W * 0.06), xF = W - xB;
        // 진행 경로
        D.line(ctx, [[0, y0], [W, y0]], C.grid, 1.5, [4, 5]);
        // 파면들 (원의 중심 = 그 파면을 낸 순간의 음원 위치)
        const fronts = [];
        const corners = [[0, 0], [W, 0], [0, H], [W, H]];
        for (let n = Math.floor(t / TV); n > Math.floor(t / TV) - 400; n--) {
          const te = n * TV, r = vv * (t - te), xe = xs(te);
          if (corners.every(([px, py]) => Math.hypot(px - xe, py - y0) < r)) break;   // 화면을 통째로 감싸면 더 오래된 것도 안 보임
          fronts.push([xe, r]);
        }
        ctx.save(); ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
        fronts.forEach(([xe, r]) => {
          if (r < 1) return;
          ctx.globalAlpha = Math.max(0.18, 0.9 - r / (W * 1.5));
          ctx.beginPath(); ctx.arc(xe, y0, r, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.restore();
        // 관찰자에 파면이 막 닿았는지
        const flash = (xo) => {
          let f = 0;
          fronts.forEach(([xe, r]) => { const dd = r - Math.abs(xo - xe); if (dd >= 0 && dd < vv * 0.12) f = Math.max(f, 1 - dd / (vv * 0.12)); });
          return f;
        };
        person(ctx, xB, y0, C, flash(xB));
        person(ctx, xF, y0, C, flash(xF));
        const fB = F0 * V / (V + beta * V), fF = F0 * V / (V - beta * V);
        const lB = (V + beta * V) / F0, lF = (V - beta * V) / F0;
        tag(ctx, '뒤 관찰자', 6, 14, { size: 12, bold: true, color: C.fg, bg: C.bg, align: 'left' });
        tag(ctx, `f′ = ${Math.round(fB)} Hz`, 6, 32, { size: 12, bold: true, color: C.orange, bg: C.bg, align: 'left' });
        tag(ctx, '앞 관찰자', W - 6, 14, { size: 12, bold: true, color: C.fg, bg: C.bg, align: 'right' });
        tag(ctx, `f′ = ${Math.round(fF)} Hz`, W - 6, 32, { size: 12, bold: true, color: C.orange, bg: C.bg, align: 'right' });

        // 파장 표시: 음원 가까이의 이웃한 두 파면 사이 (앞은 짧고 뒤는 길다)
        const by = y0 + (narrow ? 44 : 50);
        const sx = xs(t);
        const dimL = (xa, xb, s) => {
          const okSpan = xb - xa >= 14 && xa > 6 && xb < W - 6;
          if (okSpan) {
            D.line(ctx, [[xa, by], [xb, by]], C.fg, 1.5);
            D.line(ctx, [[xa, by - 5], [xa, by + 5]], C.fg, 1.5); D.line(ctx, [[xb, by - 5], [xb, by + 5]], C.fg, 1.5);
            D.line(ctx, [[xa, y0 + 4], [xa, by]], C.muted, 1, [2, 3]); D.line(ctx, [[xb, y0 + 4], [xb, by]], C.muted, 1, [2, 3]);
          }
          return okSpan;
        };
        if (fronts.length >= 3) {
          const [e1, r1] = fronts[1], [e2, r2] = fronts[2];
          const okF = dimL(e1 + r1, e2 + r2), okB = dimL(e2 - r2, e1 - r1);
          const tF = `λ′ = ${lF.toFixed(2)} m`, tB = `λ′ = ${lB.toFixed(2)} m`;
          const xF0 = okF ? (e1 + r1 + e2 + r2) / 2 : sx + 46, xB0 = okB ? (e1 - r1 + e2 - r2) / 2 : sx - 46;
          ctx.save(); ctx.font = FONT(12, true); const wF = ctx.measureText(tF).width + 8, wB = ctx.measureText(tB).width + 8; ctx.restore();
          let pF = Math.min(W - wF / 2 - 4, Math.max(wF / 2 + 4, xF0)), pB = Math.min(W - wB / 2 - 4, Math.max(wB / 2 + 4, xB0));
          if (pF - pB < (wF + wB) / 2 + 4) { const mid = (pF + pB) / 2; pF = mid + (wF + wB) / 4 + 2; pB = mid - (wF + wB) / 4 - 2; }
          tag(ctx, tF, pF, by + 16, { size: 12, bold: true, color: C.fg, bg: C.bg });
          tag(ctx, tB, pB, by + 16, { size: 12, bold: true, color: C.fg, bg: C.bg });
        }

        // 음원
        D.circle(ctx, sx, y0, 9, { fill: C.blue, stroke: C.bg, width: 2 });
        D.circle(ctx, sx, y0, 3, { fill: C.bg });
        tag(ctx, '음원', sx, y0 + 21, { size: 12, bold: true, color: C.blue, bg: C.bg });
        if (beta > 0.001) {
          const L = 14 + beta * (narrow ? 34 : 56), mx = sx + 12 + L / 2;
          D.arrow(ctx, sx + 12, y0, sx + 12 + L, y0, C.blue, 3, 9);
          D.text(ctx, 'v', mx - 3, y0 - 14, { size: 13, bold: true, color: C.blue, align: 'right' });
          D.text(ctx, 's', mx - 2, y0 - 10, { size: 11, bold: true, color: C.blue, align: 'left' });
        }

        oB(`${Math.round(fB)} Hz`); oS(`${F0} Hz`); oF(`${Math.round(fF)} Hz`);
      }
      cv.onResize(render);
      render();
    },
  });
})();
