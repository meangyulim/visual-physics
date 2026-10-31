/* 보어 모형: 에너지 준위(E_n = −13.6/n² eV)·원 궤도(r ∝ n²), 전이 → 광자 에너지·파장(λ = 1240/ΔE nm)·색·계열, 스펙트럼 띠 */
SIM.register('bohr', {
  title: '보어 모형과 수소 스펙트럼',
  hint: '처음 준위와 나중 준위를 고르세요. 그림에서 준위(이름표)나 궤도를 눌러도 돼요: 첫 번째 = 처음, 두 번째 = 나중.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.48 : 0.64, maxH: 600 });
    const E = (n) => -13.6 / (n * n);
    const SERIES = { 1: '라이먼 계열', 2: '발머 계열', 3: '파셴 계열', 4: '브래킷 계열', 5: '푼트 계열' };
    let ni = 3, nf = 2, stage = 0, t = 0, k = null, ang = 0, B = {};
    const opts = [1, 2, 3, 4, 5, 6].map((n) => [String(n), `n = ${n}   (${E(n).toFixed(2)} eV)`]);
    const si = kit.select({ label: '처음 준위', options: opts, value: '3', onChange: (v) => { ni = +v; t = 0; } });
    const sf = kit.select({ label: '나중 준위', options: opts, value: '2', onChange: (v) => { nf = +v; t = 0; } });
    kit.button('↺ 다시 보기', () => { t = 0; });
    const rE = kit.readout('광자 에너지 ΔE'), rL = kit.readout('파장 λ'), rR = kit.readout('빛의 영역'), rS = kit.readout('계열'), rK = kit.readout('흡수 / 방출');
    kit.note('높은 준위 → 낮은 준위: 두 준위의 에너지 차 ΔE만큼의 광자를 <b>방출</b>(밝은 선). 낮은 → 높은 준위: 정확히 ΔE인 광자만 <b>흡수</b>(어두운 선). 파장 λ(nm) = 1240 / ΔE(eV).');
    kit.note('가시광선 선은 모두 n = 2로 내려오는 발머 계열이에요. n = 1로 내려오는 라이먼 계열은 자외선, n = 3으로 내려오는 파셴 계열은 적외선이에요.');

    function wlRGB(l, dim = 1) {                          // 가시광선 파장 → 실제 색 (dim < 1 이면 어둡게: 밝은 바탕의 글자용)
      let r = 0, g = 0, b = 0;
      if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = (510 - l) / 20; }
      else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = (645 - l) / 65; } else { r = 1; }
      const f = l < 420 ? 0.35 + 0.65 * (l - 380) / 40 : l > 700 ? 0.35 + 0.65 * (750 - l) / 50 : 1;
      const c = (v) => Math.round(255 * dim * Math.pow(Math.max(0, v) * f, 0.8));
      return `rgb(${c(r)},${c(g)},${c(b)})`;
    }
    const colorName = (l) => (l < 450 ? '보라' : l < 480 ? '파랑' : l < 500 ? '청록' : l < 565 ? '초록' : l < 590 ? '노랑' : l < 625 ? '주황' : '빨강');
    const region = (l) => (l < 380 ? '자외선' : l <= 750 ? '가시광선' : '적외선');
    const photon = (a, b) => { const dE = Math.abs(E(a) - E(b)); return { dE, lam: 1240 / dE }; };
    const lineColor = (l) => (l >= 380 && l <= 750 ? wlRGB(l) : kit.C.fg);   // 보이지 않는 빛(자외선·적외선)은 무채색
    const darkBg = () => { const m = /^#?([0-9a-f]{6})$/i.exec(kit.C.bg.trim()); if (!m) return false; const v = parseInt(m[1], 16); return ((v >> 16) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11) < 100; };
    const inkColor = (l) => (l >= 380 && l <= 750 ? wlRGB(l, darkBg() ? 1 : 0.62) : kit.C.fg);   // 글자는 바탕과 대비되게

    function layout() {
      const { W, H } = cv;
      if (narrow) {                                       // 폰: 준위(위, 전체 폭) / 궤도 + 광자 카드 / 스펙트럼
        const lh = Math.round(H * 0.36), oy = 34 + lh + 14, oh = H - oy - 122;
        B = { L: { x: 0, y: 34, w: W - 4, h: lh }, O: { x: 0, y: oy, w: W * 0.52, h: oh }, P: { x: W * 0.52 + 6, y: oy + 8, w: W * 0.48 - 14, h: oh - 16 }, S: { x: 14, y: H - 72, w: W - 28, h: 30 } };
      } else {
        const ow = W * 0.36, oh = Math.min(ow * 0.92, H - 250);
        B = { O: { x: 0, y: 4, w: ow, h: oh }, P: { x: 14, y: oh + 12, w: ow - 24, h: H - 128 - oh - 12 }, L: { x: W * 0.38, y: 36, w: W * 0.6, h: H - 168 }, S: { x: 34, y: H - 72, w: W - 68, h: 32 } };
      }
    }
    // ── 에너지 준위 그림 (선형 눈금)
    const EMIN = -14.4, EMAX = 0.7;
    const labW = () => (narrow ? 96 : 126);
    const EY = (e) => B.L.y + B.L.h - (e - EMIN) / (EMAX - EMIN) * B.L.h;
    function labelYs() {                                  // 이름표가 겹치지 않게 벌려 놓기
      const gap = narrow ? 14 : 16, ys = {}; let prev = -1e9;
      for (let n = 6; n >= 1; n--) { const y = Math.max(EY(E(n)), prev + gap); ys[n] = y; prev = y; }
      return ys;
    }
    function drawLevels(ctx, ph) {
      const C = kit.C, D = kit.draw, L = B.L, xa = L.x + 30, xb = L.x + L.w - labW(), ys = labelYs();
      D.arrow(ctx, L.x + 12, L.y + L.h + 6, L.x + 12, L.y - 18, C.muted, 1.2, 6);
      D.text(ctx, '에너지', L.x + 4, L.y - 26, { size: 11.5, color: C.muted, align: 'left', bold: true });
      D.line(ctx, [[xa, EY(0)], [xb, EY(0)]], C.muted, 1, [4, 4]);
      D.text(ctx, 'E = 0 (이온화)', xb + 6, EY(0) - (narrow ? 13 : 14), { size: 11, color: C.muted, align: 'left' });
      for (let n = 1; n <= 6; n++) {
        const y = EY(E(n)), sel = n === ni ? C.blue : n === nf ? C.green : null;
        D.line(ctx, [[xa, y], [xb, y]], sel || C.fg, sel ? 3 : 1.6);
        D.line(ctx, [[xb, y], [xb + 6, ys[n]]], C.muted, 1);
        D.text(ctx, `n=${n}  ${E(n).toFixed(2)} eV`, xb + 9, ys[n], { size: narrow ? 11 : 12, color: sel || C.fg, align: 'left', bold: !!sel });
      }
      D.text(ctx, stage === 0 ? '눌러서 고르기: ‘처음’ 준위' : '눌러서 고르기: ‘나중’ 준위', L.x + L.w, L.y - 26, { size: 11, color: stage === 0 ? C.blue : C.green, align: 'right', bold: true });
      if (ni === nf) return;
      const y0 = EY(E(ni)), y1 = EY(E(nf)), xm = (xa + xb) / 2, col = lineColor(ph.lam);
      D.arrow(ctx, xm, y0, xm, y1, C.bg, 7, 13); D.arrow(ctx, xm, y0, xm, y1, col, 3.2, Math.min(11, Math.abs(y1 - y0) * 0.7));
      // 광자 (방출: 밖으로, 흡수: 안으로)
      const ym = (y0 + y1) / 2, emit = ni > nf, sx = xm + 8, ex = Math.min(xb - 4, xm + 64);
      wave(ctx, emit ? sx : ex, ym, emit ? ex : sx, ym, col, ph.lam);
      kitTag(ctx, `ΔE = ${ph.dE.toFixed(2)} eV`, xm - 9, Math.max(y0, y1) - 13, inkColor(ph.lam), 'right');
    }
    function wave(ctx, x0, y0, x1, y1, col, lam) {       // 물결 모양 광자 + 화살촉
      const L = Math.hypot(x1 - x0, y1 - y0); if (L < 8) return;
      const ux = (x1 - x0) / L, uy = (y1 - y0) / L, wl = Math.max(5, Math.min(22, 3.5 + lam / 90)), pts = [];
      for (let s = 0; s <= L - 8; s += 1) { const a = 4 * Math.sin(2 * Math.PI * s / wl); pts.push([x0 + ux * s - uy * a, y0 + uy * s + ux * a]); }
      kit.draw.line(ctx, pts, col, 2.2);
      kit.draw.arrow(ctx, x1 - ux * 10, y1 - uy * 10, x1, y1, col, 2.2, 8);
    }
    function kitTag(ctx, str, x, y, color, align = 'center') {
      ctx.save(); ctx.font = "700 12px Pretendard, 'Noto Sans KR', system-ui, sans-serif";
      const w = ctx.measureText(str).width + 8, x0 = align === 'left' ? x - 4 : align === 'right' ? x - w + 4 : x - w / 2;
      ctx.fillStyle = kit.C.bg; ctx.globalAlpha = 0.88; ctx.fillRect(x0, y - 9, w, 18); ctx.restore();
      kit.draw.text(ctx, str, x, y, { size: 12, color, bold: true, align });
    }
    // ── 원 궤도 그림 (r ∝ n², 보이는 가장 큰 궤도에 맞춰 축척)
    function drawOrbits(ctx, ph, dt) {
      const C = kit.C, D = kit.draw, O = B.O, cx = O.x + O.w / 2, cy = O.y + O.h / 2, R = Math.min(O.w, O.h) / 2 - 10;
      const N = Math.max(3, ni, nf), target = R / (N * N);
      k = k === null ? target : k + (target - k) * Math.min(1, dt * 6);
      for (let n = 1; n <= 6; n++) {
        const r = k * n * n; if (r > R + 6) break;
        const sel = n === ni ? C.blue : n === nf ? C.green : null;
        D.circle(ctx, cx, cy, r, { stroke: sel || C.muted, width: sel ? 2.2 : 1 });
        if (sel || r > 26) D.text(ctx, `n=${n}`, cx + r * 0.71 + 3, cy - r * 0.71 - 6, { size: 11, color: sel || C.muted, align: 'left', bold: !!sel });
      }
      D.circle(ctx, cx, cy, 4.5, { fill: C.red });
      D.text(ctx, '반지름 ∝ n²', O.x + 10, O.y + 10, { size: 11, color: C.muted, align: 'left' });
      // 전자의 움직임: 처음 궤도 → (광자) → 나중 궤도
      const T = 3.4, s = t % T, emit = ni > nf, ri = k * ni * ni, rf = k * nf * nf;
      let r = ri, phot = null;
      if (ni !== nf) {
        if (emit) { if (s > 1.0) r = s < 1.25 ? ri + (rf - ri) * (s - 1.0) / 0.25 : rf; if (s > 1.0 && s < 1.9) phot = { out: true, u: (s - 1.0) / 0.9 }; }
        else { if (s > 1.0 && s < 1.55) phot = { out: false, u: (s - 1.0) / 0.55 }; if (s > 1.55) r = s < 1.8 ? ri + (rf - ri) * (s - 1.55) / 0.25 : rf; }
      }
      const nNow = Math.sqrt(r / k);
      ang -= (dt || 0) * 2.6 / Math.pow(nNow, 1.5);
      const ex = cx + r * Math.cos(ang), ey = cy + r * Math.sin(ang);
      if (phot) {
        const col = lineColor(ph.lam), dir = [Math.cos(ang), Math.sin(ang)], far = R + 4;
        const head = phot.out ? r + 8 + (far - r) * phot.u : far - (far - r - 8) * phot.u, tail = Math.max(phot.out ? r + 6 : head, head - 38);
        const a0 = phot.out ? tail : head + 38, a1 = phot.out ? head : head;
        wave(ctx, cx + dir[0] * (phot.out ? a0 : a0), cy + dir[1] * (phot.out ? a0 : a0), cx + dir[0] * a1, cy + dir[1] * a1, col, ph.lam);
      }
      D.circle(ctx, ex, ey, 5.5, { fill: C.blue, stroke: C.bg, width: 1.5 });
    }
    // ── 스펙트럼 띠 (자외선 | 가시광선 | 적외선 — 구간마다 눈금이 다름)
    const SEG = [[90, 380, 0.22], [380, 750, 0.46], [750, 2000, 0.32]];
    function SX(l) {
      const S = B.S, gap = 9, wTot = S.w - 2 * gap; let x = S.x;
      for (let i = 0; i < SEG.length; i++) { const [a, b, fr] = SEG[i], w = wTot * fr; if (l <= b || i === SEG.length - 1) return x + (Math.min(Math.max(l, a), b) - a) / (b - a) * w; x += w + gap; }
      return x;
    }
    function drawSpectrum(ctx, ph) {
      const C = kit.C, D = kit.draw, S = B.S, emit = ni > nf, absorb = ni < nf, lo = Math.min(ni, nf);
      const segX = SEG.map(([a, b]) => [SX(a), SX(b)]);
      segX.forEach(([x0, x1], i) => {
        if (absorb && i === 1) { const g = ctx.createLinearGradient(x0, 0, x1, 0); for (let l = 380; l <= 750; l += 20) g.addColorStop((l - 380) / 370, wlRGB(l)); ctx.fillStyle = g; }
        else ctx.fillStyle = absorb ? C.grid : '#0b0d12';
        ctx.fillRect(x0, S.y, x1 - x0, S.h);
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, S.y + 0.5, x1 - x0 - 1, S.h - 1);
      });
      D.text(ctx, ni === nf ? '스펙트럼' : emit ? '방출 스펙트럼 (밝은 선)' : '흡수 스펙트럼 (어두운 선)', S.x, S.y - 40, { size: 12, color: C.fg, align: 'left', bold: true });
      // 같은 계열의 다른 선(흐리게) + 지금 선(진하게)
      if (lo < 6) for (let n = lo + 1; n <= 6; n++) {
        const l = 1240 / Math.abs(E(n) - E(lo)), cur = ni !== nf && Math.max(ni, nf) === n;
        if (l > 2000) continue;
        const x = SX(l), col = emit || ni === nf ? (l >= 380 && l <= 750 ? wlRGB(l) : '#e6e9ef') : '#111';
        ctx.save(); ctx.globalAlpha = cur ? 1 : 0.4; D.line(ctx, [[x, S.y], [x, S.y + S.h]], col, cur ? 3 : 1.6); ctx.restore();
      }
      // 눈금
      [[300, '300'], [400, '400'], [500, '500'], [600, '600'], [700, '700'], [1000, '1000'], [1500, '1500'], [2000, '2000']].forEach(([l, s]) => {
        const x = SX(l); D.line(ctx, [[x, S.y + S.h], [x, S.y + S.h + 4]], C.muted, 1);
        D.text(ctx, s, x, S.y + S.h + 12, { size: 11, color: C.muted });
      });
      D.text(ctx, '(nm)', S.x, S.y + S.h + 12, { size: 11, color: C.muted, align: 'left' });
      [['자외선', 0], ['가시광선', 1], ['적외선', 2]].forEach(([s, i]) => D.text(ctx, s, (segX[i][0] + segX[i][1]) / 2, S.y + S.h + 27, { size: 11, color: C.muted, bold: true }));
      if (ni !== nf) {
        const l = ph.lam, over = l > 2000, x = over ? S.x + S.w : SX(l);
        const col = l >= 380 && l <= 750 ? wlRGB(l) : C.fg;
        ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, S.y - 1); ctx.lineTo(x - 5, S.y - 9); ctx.lineTo(x + 5, S.y - 9); ctx.closePath(); ctx.fill(); ctx.restore();
        const txt = over ? `${l.toFixed(0)} nm →` : `${l.toFixed(0)} nm`, al = x > S.x + S.w - 40 ? 'right' : x < S.x + 40 ? 'left' : 'center';
        kitTag(ctx, txt, al === 'right' ? x + 4 : al === 'left' ? x - 4 : x, S.y - 19, C.fg, al);
      }
    }

    // ── 광자 카드: 실제 색(가시광선) 또는 '눈에 안 보임'
    function drawCard(ctx, ph) {
      const C = kit.C, D = kit.draw, P = B.P; if (!P || P.h < 60) return;
      ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(P.x, P.y, P.w, P.h, 10) : ctx.rect(P.x, P.y, P.w, P.h); ctx.stroke(); ctx.restore();
      const cx = P.x + P.w / 2;
      D.text(ctx, ni === nf ? '광자 없음' : ni > nf ? '나오는 광자' : '흡수되는 광자', cx, P.y + 15, { size: 12, color: C.muted, bold: true });
      if (ni === nf) return;
      const l = ph.lam, vis = l >= 380 && l <= 750, col = vis ? wlRGB(l) : C.muted;
      const wy = P.y + P.h * 0.42, half = Math.min(60, P.w / 2 - 14);
      if (vis) { ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.18; ctx.fillRect(cx - half - 6, wy - 13, 2 * half + 12, 26); ctx.restore(); }
      ctx.save(); if (!vis) ctx.setLineDash([3, 3]); wave(ctx, cx - half, wy, cx + half, wy, col, l); ctx.restore();
      D.text(ctx, `${l.toFixed(0)} nm`, cx, P.y + P.h * 0.68, { size: 17, color: inkColor(l), bold: true });
      D.text(ctx, vis ? `${colorName(l)} (가시광선)` : `${region(l)} · 눈에 안 보임`, cx, P.y + P.h * 0.68 + 20, { size: 11.5, color: C.muted, bold: true });
    }
    function render(dt) {
      layout();
      const { ctx, W, H } = cv, ph = photon(ni, nf);
      ctx.clearRect(0, 0, W, H);
      drawOrbits(ctx, ph, dt); drawLevels(ctx, ph); drawSpectrum(ctx, ph); drawCard(ctx, ph);
      if (ni === nf) { rE.set('—'); rL.set('—'); rR.set('—'); rS.set('—'); rK.set('전이 없음'); return; }
      const l = ph.lam, vis = l >= 380 && l <= 750;
      rE.set(ph.dE.toFixed(2) + ' eV');
      rL.set((vis ? `<span style="display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;background:${wlRGB(l)}"></span>` : '') + l.toFixed(0) + ' nm');
      rR.set(region(l));
      rS.set(SERIES[Math.min(ni, nf)]);
      rK.set(ni > nf ? `방출 (${ni}→${nf})` : `흡수 (${ni}→${nf})`);
    }
    kit.loop((dt) => { t += dt; render(dt); });
    kit.pointer(cv.el, {
      down(x, y) {
        let n = null;
        if (x >= B.L.x) {                                 // 준위: 선 또는 이름표에 가장 가까운 것
          const ys = labelYs(), xb = B.L.x + B.L.w - labW(); let best = 1e9;
          for (let m = 1; m <= 6; m++) { const d = x > xb ? Math.abs(y - ys[m]) : Math.abs(y - EY(E(m))); if (d < best) { best = d; n = m; } }
          if (best > 14) n = null;
        } else if (y < B.O.y + B.O.h && k) {              // 궤도
          const O = B.O, d = Math.hypot(x - (O.x + O.w / 2), y - (O.y + O.h / 2)); let best = 1e9;
          for (let m = 1; m <= 6; m++) { const r = k * m * m; if (r > Math.min(O.w, O.h) / 2) break; if (Math.abs(d - r) < best) { best = Math.abs(d - r); n = m; } }
          if (best > 12) n = null;
        }
        if (n === null) return;
        if (stage === 0) { si.set(String(n)); stage = 1; } else { sf.set(String(n)); stage = 0; }
      },
    });
    cv.onResize(() => render(0));
    render(0);
  },
});
