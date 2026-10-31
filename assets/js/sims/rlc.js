/* 교류 RLC 직렬 회로의 공명: X_L, X_C – f 그래프와 전류 I – f 공명 곡선, f₀ = 1/(2π√LC) */
SIM.register('rlc', {
  title: 'RLC 회로의 공명',
  hint: '진동수 f를 움직여 전류가 가장 커지는 곳을 찾아보세요. R, L, C를 바꾸면 공명 진동수와 곡선 모양이 달라져요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.18 : 0.5, maxH: 520 });
    const V = 12, FMAX = 250, XMAX = 500, IMAX = 1.3;
    let R = 20, L = 0.3, Cp = 20e-6, f = 100;
    const sf = kit.slider({ label: '전원의 진동수 f', min: 10, max: 250, step: 1, value: f, unit: 'Hz', onInput: (v) => { f = v; render(); } });
    kit.slider({ label: '저항 R', min: 10, max: 60, step: 5, value: R, unit: 'Ω', onInput: (v) => { R = v; render(); } });
    kit.slider({ label: '코일의 자체 유도 계수 L', min: 0.1, max: 0.5, step: 0.05, value: L, fmt: (v) => v.toFixed(2) + ' H', onInput: (v) => { L = v; render(); } });
    kit.slider({ label: '축전기의 전기 용량 C', min: 10, max: 50, step: 5, value: 20, unit: 'μF', onInput: (v) => { Cp = v * 1e-6; render(); } });
    kit.button('f를 f₀에 맞추기', () => sf.set(Math.round(f0())), { primary: true });
    const rf0 = kit.readout('공명 진동수 f₀'), rXL = kit.readout('X<sub>L</sub> (코일)'), rXC = kit.readout('X<sub>C</sub> (축전기)'), rZ = kit.readout('임피던스 Z'), rI = kit.readout('전류 I');
    kit.note('공명(f = f₀)에서는 X<sub>L</sub> = X<sub>C</sub> 라서 임피던스가 R로 가장 작아지고 <b>전류가 최대</b>예요. f₀ = 1/(2π√LC) — L이나 C가 클수록 f₀가 낮아져요.');
    kit.note('f < f₀ 이면 X<sub>C</sub> > X<sub>L</sub>, f > f₀ 이면 X<sub>L</sub> > X<sub>C</sub>. R은 f₀를 바꾸지 않지만, R이 작을수록 공명 곡선이 높고 뾰족해요. (전원 전압 12 V)');

    const f0 = () => 1 / (2 * Math.PI * Math.sqrt(L * Cp));
    const XL = (fv) => 2 * Math.PI * fv * L, XC = (fv) => 1 / (2 * Math.PI * fv * Cp);
    const Z = (fv) => Math.hypot(R, XL(fv) - XC(fv)), I = (fv) => V / Z(fv);

    function axes(r, ymax, yt, ylabel) {
      const { ctx } = cv, C = kit.C, D = kit.draw;
      const X = (fv) => r.x + fv / FMAX * r.w, Y = (v) => r.y + r.h - v / ymax * r.h;
      [50, 100, 150, 200].forEach((fv) => { D.line(ctx, [[X(fv), r.y], [X(fv), r.y + r.h]], C.grid, 1); D.text(ctx, String(fv), X(fv), r.y + r.h + 12, { size: 11, color: C.muted }); });
      yt.forEach((v) => { D.line(ctx, [[r.x, Y(v)], [r.x + r.w, Y(v)]], C.grid, 1); D.text(ctx, String(v), r.x - 6, Y(v), { size: 11, color: C.muted, align: 'right' }); });
      D.arrow(ctx, r.x, r.y + r.h, r.x + r.w + 10, r.y + r.h, C.fg, 1.3, 7);
      D.arrow(ctx, r.x, r.y + r.h, r.x, r.y - 10, C.fg, 1.3, 7);
      D.text(ctx, 'O', r.x - 8, r.y + r.h + 9, { size: 11, color: C.muted });
      D.text(ctx, ylabel, r.x + 6, r.y - 14, { size: 12, color: C.muted, align: 'left', bold: true });
      D.text(ctx, 'f (Hz)', r.x + r.w + 10, r.y + r.h + 12, { size: 11.5, color: C.muted, align: 'right' });
      return { X, Y };
    }
    function curve(r, X, Y, fn, color, width) {
      const { ctx } = cv, pts = [];
      for (let px = 0; px <= r.w; px += 1.5) { const fv = Math.max(0.5, px / r.w * FMAX); pts.push([X(fv), Y(fn(fv))]); }
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y - 2, r.w + 2, r.h + 2); ctx.clip();
      kit.draw.line(ctx, pts.map(([x, y]) => [x, Math.max(r.y - 50, y)]), color, width); ctx.restore();
    }
    // 아래 첨자가 섞인 이름표: tag(ctx, 'X_L = X_C', ...) → '_' 다음 한 글자를 아래 첨자로
    const font = (sub) => `700 ${sub ? 11 : 13}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
    function measure(ctx, str) {
      const parts = []; for (let i = 0; i < str.length; i++) { if (str[i] === '_') { parts.push([str[i + 1], 1]); i++; } else if (parts.length && !parts[parts.length - 1][1]) parts[parts.length - 1][0] += str[i]; else parts.push([str[i], 0]); }
      ctx.save(); const ws = parts.map(([t, sb]) => { ctx.font = font(sb); return ctx.measureText(t).width; }); ctx.restore();
      return { parts, ws, w: ws.reduce((p, q) => p + q, 0) };
    }
    function tag(ctx, str, x, y, color, align = 'center') {
      const { parts, ws, w } = measure(ctx, str);
      ctx.save();
      let x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      ctx.fillStyle = kit.C.bg; ctx.globalAlpha = 0.88; ctx.fillRect(x0 - 4, y - 10, w + 8, 21); ctx.globalAlpha = 1;
      ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      parts.forEach(([t, sb], i) => { ctx.font = font(sb); ctx.fillText(t, x0, y + (sb ? 4 : 0)); x0 += ws[i]; });
      ctx.restore();
    }

    function render() {
      const { ctx, W, H } = cv, C = kit.C, D = kit.draw, F0 = f0();
      ctx.clearRect(0, 0, W, H);
      let r1, r2;
      if (narrow) { const gh = (H - 112) / 2; r1 = { x: 44, y: 30, w: W - 66, h: gh }; r2 = { x: 44, y: 30 + gh + 60, w: W - 66, h: gh }; }
      else { const gw = (W - 150) / 2; r1 = { x: 52, y: 36, w: gw, h: H - 84 }; r2 = { x: 52 + gw + 78, y: 36, w: gw, h: H - 84 }; }
      // ── 위(왼쪽): 리액턴스
      const A1 = axes(r1, XMAX, [100, 200, 300, 400], '리액턴스 (Ω)');
      curve(r1, A1.X, A1.Y, XL, C.blue, 2.6); curve(r1, A1.X, A1.Y, XC, C.red, 2.6);
      const fL = Math.min(FMAX * 0.97, XMAX * 0.86 / (2 * Math.PI * L));          // 곡선 이름표 자리
      tag(ctx, 'X_L = 2πfL', A1.X(fL) - 6, A1.Y(XL(fL)) - 2, C.blue, 'right');
      const F0c = f0(), wC = measure(ctx, 'X_C = 1/(2πfC)').w, hw = wC / 2 / r1.w * FMAX;   // X_C 이름표: 겹침이 가장 적은 자리
      let fC = 0.72 * FMAX, best = Infinity;
      [0.72, 0.6, 0.84, 0.5, 0.4, 0.92, 0.3, 0.22].forEach((k) => {
        const fv = k * FMAX, x = A1.X(fv), y = A1.Y(XC(fv)) - 16;
        if (y < r1.y + 10) return;
        let pen = 0;
        [fv - hw, fv, fv + hw].forEach((g) => { const dd = Math.abs(A1.Y(XL(g)) - y); if (dd < 16) pen += 16 - dd; });
        if (Math.abs(x - A1.X(f)) < wC / 2 + 6) pen += 12;
        if (Math.abs(x - A1.X(F0c)) < wC / 2 + 90) pen += 12;
        if (x + wC / 2 > r1.x + r1.w + 10) pen += 30;
        if (pen < best) { best = pen; fC = fv; }
      });
      tag(ctx, 'X_C = 1/(2πfC)', A1.X(fC), A1.Y(XC(fC)) - 16, C.red, 'center');
      const f0in = F0 <= FMAX;
      if (f0in) {
        [r1, r2].forEach((r) => D.line(ctx, [[r.x + F0 / FMAX * r.w, r.y], [r.x + F0 / FMAX * r.w, r.y + r.h]], C.green, 1.4, [5, 4]));
        D.circle(ctx, A1.X(F0), A1.Y(XL(F0)), 5, { fill: C.green });
      }
      // 현재 f: 두 리액턴스와 차이
      const xL = XL(f), xC = XC(f), px1 = A1.X(f);
      D.line(ctx, [[px1, r1.y], [px1, r1.y + r1.h]], C.orange, 1.6);
      const yA = A1.Y(Math.min(xL, XMAX)), yB = A1.Y(Math.min(xC, XMAX));
      ctx.save(); ctx.globalAlpha = 0.28; D.line(ctx, [[px1, yA], [px1, yB]], C.orange, 5); ctx.restore();
      if (xL <= XMAX) D.circle(ctx, px1, yA, 5, { fill: C.blue, stroke: C.bg, width: 1.5 });
      if (xC <= XMAX) D.circle(ctx, px1, yB, 5, { fill: C.red, stroke: C.bg, width: 1.5 });
      // ── 아래(오른쪽): 전류 공명 곡선
      const A2 = axes(r2, IMAX, [0.5, 1], '전류 I (A)');
      curve(r2, A2.X, A2.Y, I, C.orange, 2.8);
      const px2 = A2.X(f);
      D.line(ctx, [[px2, r2.y], [px2, r2.y + r2.h]], C.orange, 1.6);
      D.circle(ctx, px2, A2.Y(I(f)), 6, { fill: C.orange, stroke: C.bg, width: 2 });
      if (f0in) {
        D.circle(ctx, A2.X(F0), A2.Y(V / R), 4.5, { fill: C.green });
        const side = (r, str) => {                  // 이름표가 현재 f 세로선과 겹치지 않고 캔버스 안에 드는 쪽 (true = 오른쪽)
          const w = measure(ctx, str).w, x0 = r.x + F0 / FMAX * r.w, xf = r.x + f / FMAX * r.w;
          const hit = (a, b) => xf >= a - 6 && xf <= b + 6;
          const inR = x0 + 8 + w <= r.x + r.w && !hit(x0 + 8, x0 + 8 + w), inL = x0 - 8 - w >= r.x + 2 && !hit(x0 - 8 - w, x0 - 8);
          if (inR && inL) return xf < x0; if (inR || inL) return inR;
          const okR = x0 + 8 + w <= W - 4 && !hit(x0 + 8, x0 + 8 + w), okL = x0 - 8 - w >= 4 && !hit(x0 - 8 - w, x0 - 8);
          if (okR || okL) return okR;
          return Math.abs(xf - (x0 + 8 + w / 2)) > Math.abs(xf - (x0 - 8 - w / 2));
        };
        const s2 = side(r2, `f₀ = ${F0.toFixed(0)} Hz`), s1 = side(r1, 'X_L = X_C');
        tag(ctx, `f₀ = ${F0.toFixed(0)} Hz`, A2.X(F0) + (s2 ? 8 : -8), Math.max(r2.y + 4, A2.Y(V / R) - 14), C.green, s2 ? 'left' : 'right');
        tag(ctx, 'X_L = X_C', A1.X(F0) + (s1 ? 8 : -8), Math.max(r1.y + 6, A1.Y(XL(F0)) - 16), C.green, s1 ? 'left' : 'right');
      }
      // ── 읽기
      rf0.set(F0.toFixed(1) + ' Hz'); rXL.set(xL.toFixed(0) + ' Ω'); rXC.set(xC.toFixed(0) + ' Ω');
      rZ.set(Z(f).toFixed(0) + ' Ω'); rI.set(I(f).toFixed(2) + ' A');
    }
    cv.onResize(render);
    new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');   // 시스템 다크 모드가 바뀌면 다시 그림
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', () => render()); else if (mq.addListener) mq.addListener(() => render()); }
    render();
  },
});
