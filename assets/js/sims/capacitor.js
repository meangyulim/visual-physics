/* 평행판 축전기: 넓이 A, 간격 d, 유전체 κ, 전원 연결(V 일정)/분리(Q 일정) → C, Q, V, E, U 를 처음 상태의 배수로 */
SIM.register('capacitor', {
  title: '평행판 축전기: 전원 연결과 분리',
  hint: '극판 넓이·간격·유전체를 바꿔 보세요. 전원에 연결된 채(V 일정)일 때와 충전 뒤 분리했을 때(Q 일정) 결과가 달라요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.24 : 0.5, maxH: 520 });
    let mode = 'V', A = 1, d = 1, k = 1;
    kit.select({ label: '전원', options: [['V', '전원 연결 (V 일정)'], ['Q', '충전 후 분리 (Q 일정)']], value: mode, onChange: (v) => { mode = v; render(); } });
    const sA = kit.slider({ label: '극판 넓이 A', min: 0.5, max: 2, step: 0.25, value: 1, fmt: (v) => `${+v.toFixed(2)} A₀`, onInput: (v) => { A = v; render(); } });
    const sd = kit.slider({ label: '극판 간격 d', min: 0.5, max: 2, step: 0.25, value: 1, fmt: (v) => `${+v.toFixed(2)} d₀`, onInput: (v) => { d = v; render(); } });
    const sk = kit.slider({ label: '유전체의 비유전율 κ', min: 1, max: 5, step: 0.5, value: 1, fmt: (v) => (v === 1 ? '1 (없음)' : v.toFixed(1)), onInput: (v) => { k = v; render(); } });
    kit.button('↺ 처음 상태', () => { sA.set(1); sd.set(1); sk.set(1); });
    const KEYS = ['C', 'Q', 'V', 'E', 'U'];
    const NAME = { C: '전기 용량 C', Q: '전하량 Q', V: '전압 V', E: '전기장 E', U: '에너지 U' };
    const R = {}; KEYS.forEach((key) => { R[key] = kit.readout(NAME[key]); });
    kit.note('처음 상태: 극판 사이가 빈(A₀, d₀) 축전기를 전압 V₀로 충전한 상태예요. ‘분리’는 충전한 뒤 스위치를 연 경우라 Q가 처음 값 그대로 남아요.');
    kit.note('C = κε₀A/d. <b>연결</b>: V 일정 → Q = CV, E = V/d (유전체와 무관). <b>분리</b>: Q 일정 → V = Q/C, E는 d와 무관하고 유전체를 넣으면 1/κ로 줄어요. 극판의 전하 개수 ∝ Q, 전기력선 간격이 좁을수록 E가 커요.');

    function ratios() {
      const c = k * A / d;
      return mode === 'V' ? { C: c, Q: c, V: 1, E: 1 / d, U: c } : { C: c, Q: 1, V: 1 / c, E: 1 / (k * A), U: 1 / c };
    }
    function frac(r) { for (let q = 1; q <= 6; q++) { const p = Math.round(r * q); if (p > 0 && Math.abs(r * q - p) < 1e-6) return [p, q]; } return null; }
    function fmtR(r, s) {
      const f = frac(r), sym = s + '₀';
      if (!f) return +r.toFixed(2) + sym;
      const [p, q] = f;
      return (p === 1 ? '' : p) + sym + (q === 1 ? '' : '/' + q);
    }
    const fmtX = (r) => { const f = frac(r); return '×' + (f ? (f[1] === 1 ? f[0] : f[0] + '/' + f[1]) : r.toFixed(2)); };
    const COL = (C) => ({ C: C.blue, Q: C.red, V: C.green, E: C.purple, U: C.orange });

    function plusMinus(ctx, x, y, s, plus, color) {
      kit.draw.line(ctx, [[x - s, y], [x + s, y]], color, 1.8);
      if (plus) kit.draw.line(ctx, [[x, y - s], [x, y + s]], color, 1.8);
    }
    function rowsOf(n, perRow) {            // n개를 줄마다 고르게
      const rows = Math.max(1, Math.ceil(n / perRow)), out = []; let left = n;
      for (let r = 0; r < rows; r++) { const m = Math.round(left / (rows - r)); out.push(m); left -= m; }
      return out;
    }

    function drawCap(P, rt) {
      const { ctx } = cv, C = kit.C, D = kit.draw;
      const L0 = Math.min((P.w - 100) / 2.1, narrow ? 112 : 130), g0 = Math.min(P.h * 0.21, 58), th = 7;
      const Lp = L0 * A, gp = g0 * d, xb = P.x + P.w - 44, cx = P.x + 24 + L0, cy = P.y + P.h / 2 + 4;
      const xl = cx - Lp / 2, xr = cx + Lp / 2, yt = cy - gp / 2, yb = cy + gp / 2;
      // 유전체 + 분극된 분자(− 끝이 (+)극판 쪽)
      if (k > 1) {
        ctx.save(); ctx.fillStyle = C.yellow; ctx.globalAlpha = 0.1 + 0.05 * (k - 1); ctx.fillRect(xl, yt, Lp, gp); ctx.restore();
        if (gp >= 34) {
          const nx = Math.max(1, Math.floor(Lp / 24)), ny = Math.max(1, Math.floor(gp / 22));
          ctx.save(); ctx.globalAlpha = Math.min(0.9, 0.3 + 0.15 * (k - 1));
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
            const x = xl + (i + 0.5) * Lp / nx, y = yt + (j + 0.5) * gp / ny;
            ctx.beginPath(); ctx.ellipse(x, y, 3.5, 6.5, 0, Math.PI, 2 * Math.PI); ctx.fillStyle = C.blue; ctx.fill();
            ctx.beginPath(); ctx.ellipse(x, y, 3.5, 6.5, 0, 0, Math.PI); ctx.fillStyle = C.red; ctx.fill();
          }
          ctx.restore();
        }
      }
      // 전기력선 (개수 ∝ E·A → 간격 ∝ 1/E)
      const nL = Math.round(6 * rt.Q / k);
      for (let i = 0; i < nL; i++) { const x = xl + (i + 0.5) * Lp / nL; D.arrow(ctx, x, yt + 2, x, yb - 2, C.purple, 1.6, Math.min(8, gp * 0.35)); }
      // 극판
      ctx.fillStyle = C.fg; ctx.fillRect(xl, yt - th, Lp, th); ctx.fillRect(xl, yb, Lp, th);
      // 극판 전하 (개수 ∝ Q, 줄을 쌓아 밀도 표현)
      const nQ = Math.round(6 * rt.Q), per = Math.max(1, Math.floor(Lp / 9)), rows = rowsOf(nQ, per);
      rows.forEach((m, r) => {
        for (let i = 0; i < m; i++) {
          const x = xl + (i + (rows.length === 1 ? 0.5 : r % 2 ? 0.75 : 0.25)) * Lp / m;   // 여러 줄이면 반 칸씩 엇갈리게
          plusMinus(ctx, x, yt - th - 6 - r * 8.5, 2.8, true, C.red);
          plusMinus(ctx, x, yb + th + 6 + r * 8.5, 2.8, false, C.blue);
        }
      });
      const stack = rows.length * 8.5;
      // 간격 d 표시
      const xd = xl - 13;
      D.arrow(ctx, xd, cy, xd, yt + 1, C.muted, 1.2, 5); D.arrow(ctx, xd, cy, xd, yb - 1, C.muted, 1.2, 5);
      D.text(ctx, 'd', xd - 8, cy, { size: 12, color: C.muted, bold: true });
      if (k > 1) D.text(ctx, `유전체 κ = ${k.toFixed(1)}`, cx, yb + th + stack + 14, { size: 12, color: C.yellow, bold: true });
      // 도선 + 전원 (+ 분리 스위치)
      const ywt = yt - th / 2, ywb = yb + th / 2, bt = cy - 5, bb = cy + 5;
      const xs = xb - 20;
      if (mode === 'V') D.line(ctx, [[xr, ywt], [xb, ywt], [xb, bt]], C.fg, 1.8);
      else {
        D.line(ctx, [[xr, ywt], [xs - 9, ywt]], C.fg, 1.8); D.line(ctx, [[xs + 9, ywt], [xb, ywt], [xb, bt]], C.fg, 1.8);
        D.line(ctx, [[xs - 9, ywt], [xs + 7, ywt - 12]], C.fg, 1.8);
        D.circle(ctx, xs - 9, ywt, 2.4, { fill: C.fg }); D.circle(ctx, xs + 9, ywt, 2.4, { fill: C.card, stroke: C.fg, width: 1.4 });
        D.text(ctx, '분리', xs, ywt - 22, { size: 12, color: C.orange, bold: true });
      }
      D.line(ctx, [[xb, bb], [xb, ywb], [xr, ywb]], C.fg, 1.8);
      D.line(ctx, [[xb - 12, bt], [xb + 12, bt]], C.fg, 2.2); D.line(ctx, [[xb - 6, bb], [xb + 6, bb]], C.fg, 3.2);
      D.text(ctx, 'V₀', xb + 16, cy, { size: 12, color: C.muted, align: 'left', bold: true });
      D.text(ctx, '+', xb - 17, bt - 6, { size: 11, color: C.muted });
    }

    function drawBars(B, rt) {
      const { ctx } = cv, C = kit.C, D = kit.draw, col = COL(C), YM = 4;
      const Y = (v) => B.y + B.h - Math.min(v, YM) / YM * B.h;
      D.text(ctx, '처음 상태 대비 배수', B.x - 26, B.y - 34, { size: 12, color: C.muted, align: 'left', bold: true });
      [2, 3, 4].forEach((v) => { D.line(ctx, [[B.x, Y(v)], [B.x + B.w, Y(v)]], C.grid, 1); D.text(ctx, '×' + v, B.x - 5, Y(v), { size: 11, color: C.muted, align: 'right' }); });
      D.line(ctx, [[B.x, Y(1)], [B.x + B.w, Y(1)]], C.muted, 1.3, [5, 4]);
      D.text(ctx, '×1', B.x - 5, Y(1), { size: 11, color: C.fg, align: 'right', bold: true });
      D.line(ctx, [[B.x, Y(0)], [B.x + B.w, Y(0)]], C.fg, 1.4);
      const slot = B.w / 5, bw = Math.min(34, slot * 0.56);
      KEYS.forEach((key, i) => {
        const v = rt[key], x = B.x + (i + 0.5) * slot, top = Y(v);
        ctx.save(); ctx.fillStyle = col[key]; ctx.globalAlpha = 0.85; ctx.fillRect(x - bw / 2, top, bw, Y(0) - top); ctx.restore();
        if (v > YM) {                         // 잘린 막대 표시
          ctx.save(); ctx.fillStyle = kit.C.bg; ctx.beginPath(); ctx.moveTo(x - bw / 2 - 1, top + 9); ctx.lineTo(x - bw / 6, top + 4); ctx.lineTo(x + bw / 6, top + 11); ctx.lineTo(x + bw / 2 + 1, top + 6); ctx.lineTo(x + bw / 2 + 1, top + 13); ctx.lineTo(x + bw / 6, top + 18); ctx.lineTo(x - bw / 6, top + 11); ctx.lineTo(x - bw / 2 - 1, top + 16); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        D.text(ctx, fmtX(v), x, top - 9, { size: 12, color: col[key], bold: true });
        D.text(ctx, key, x, Y(0) + 13, { size: 13, color: col[key], bold: true });
      });
    }

    function render() {
      const { ctx, W, H } = cv, rt = ratios();
      ctx.clearRect(0, 0, W, H);
      if (narrow) {
        const ph = Math.round(H * 0.58);
        drawCap({ x: 0, y: 0, w: W, h: ph }, rt);
        kit.draw.line(ctx, [[0, ph], [W, ph]], kit.C.grid, 1);
        drawBars({ x: 46, y: ph + 56, w: W - 62, h: H - ph - 84 }, rt);
      } else {
        const pw = Math.round(W * 0.58);
        drawCap({ x: 0, y: 0, w: pw, h: H }, rt);
        kit.draw.line(ctx, [[pw, 16], [pw, H - 16]], kit.C.grid, 1);
        drawBars({ x: pw + 58, y: 74, w: W - pw - 78, h: H - 110 }, rt);
      }
      KEYS.forEach((key) => R[key].set(fmtR(rt[key], key)));
    }
    cv.onResize(render);
    new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');   // 시스템 다크 모드가 바뀌면 다시 그림
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', () => render()); else if (mq.addListener) mq.addListener(() => render()); }
    render();
  },
});
