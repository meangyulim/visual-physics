/* 파동의 요소: 진행하는 횡파·종파 — 진폭·파장·진동수, 한 매질 점의 진동과 변위-시간 그래프, v = fλ */
(function () {
  'use strict';
  const XMAX = 8;    // 화면에 보이는 매질 길이 (m)
  const TW = 4;      // 변위-시간 그래프의 시간 창 (s)
  const AMAX = 5;    // 진폭 최댓값 (cm)
  const TAU = Math.PI * 2;
  const FONT = (s, b) => `${b ? 700 : 500} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
  const mod = (a, n) => ((a % n) + n) % n;
  const fmt1 = (v) => (Math.abs(v) < 0.05 ? '0.0' : (v > 0 ? '+' : '−') + Math.abs(v).toFixed(1));

  SIM.register('wave', {
    title: '파동의 요소 — 진폭·파장·진동수',
    hint: '슬라이더를 움직이고 횡파·종파 보기를 바꿔 보세요. 주황 점(매질의 한 점)은 눌러서 다른 곳으로 옮길 수 있어요.',
    init(kit) {
      const D = kit.draw;
      const narrow = kit.root.clientWidth < 560;
      let A = 3, lam = 2, f = 0.5, dir = 1, mode = 'T', x0 = 2.5;
      let theta = 0, tau = 0, geo = null;

      const cv = kit.canvas({ aspect: narrow ? 1.1 : 0.64, maxH: 520 });
      kit.slider({ label: '진폭 A', min: 1, max: AMAX, step: 0.5, value: A, unit: 'cm', onInput: (v) => { A = v; } });
      kit.slider({ label: '파장 λ', min: 1, max: 4, step: 0.1, value: lam, unit: 'm', onInput: (v) => { lam = v; } });
      kit.slider({ label: '진동수 f', min: 0.5, max: 2, step: 0.1, value: f, unit: 'Hz', onInput: (v) => { f = v; } });
      kit.select({ label: '진행 방향', options: [['1', '오른쪽으로 (→)'], ['-1', '왼쪽으로 (←)']], value: '1', onChange: (v) => { dir = +v; } });
      kit.select({ label: '보기', options: [['T', '횡파 — 줄을 따라가는 파동'], ['L', '종파 — 입자의 소밀(빽빽·듬성)']], value: 'T', onChange: (v) => { mode = v; } });
      const out = (lab) => { const r = kit.readout(lab); let last = ''; return (s) => { if (s !== last) { last = s; r.set(s); } }; };
      const oT = out('주기 T = 1/f'), oV = out('속력 v = fλ'), oY = out('주황 점의 변위');
      const loop = kit.loop((dt) => { theta = mod(theta + dir * TAU * f * dt, TAU); tau = (tau + dt) % TW; render(); });
      kit.playButton(loop);
      kit.note('매질의 점은 제자리에서 진동만 하고, 파동의 모양이 한 주기 T 동안 한 파장 λ만큼 나아가요. 그래서 v = λ/T = fλ. 파란 화살표 = 주황 점의 속도.');
      kit.note('실제 파동의 속력은 매질이 정해요. 같은 줄에서 진동수를 2배로 하면 파장이 절반이 돼요.');

      const pick = (x, y) => {
        if (!geo || y > geo.maxY) return;
        x0 = Math.min(XMAX - 0.3, Math.max(0.3, (x - geo.L) / geo.pw * XMAX));
      };
      kit.pointer(cv.el, { down: pick, move: pick });
      cv.el.style.touchAction = 'pan-y';   // 세로 스크롤은 그대로, 가로로 끌면 점 이동

      // 배경 있는 글자 (선 위에 겹칠 때)
      function tag(ctx, s, x, y, o) {
        ctx.save(); ctx.font = FONT(o.size || 12, o.bold);
        const w = ctx.measureText(s).width + 8, h = (o.size || 12) + 5;
        ctx.fillStyle = o.bg; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.restore();
        D.text(ctx, s, x, y, o);
      }
      // 가운데 가로축 + 세로축
      function axes(ctx, r, C, ylabel) {
        const yc = r.y + r.h / 2;
        D.arrow(ctx, r.x, yc, r.x + r.w + 8, yc, C.fg, 1.3, 7);
        D.arrow(ctx, r.x, r.y + r.h, r.x, r.y - 6, C.fg, 1.3, 7);
        ctx.save(); ctx.font = FONT(12); const lw = ctx.measureText(ylabel).width; ctx.fillStyle = C.bg; ctx.fillRect(r.x + 4, r.y - 20, lw + 6, 16); ctx.restore();
        D.text(ctx, ylabel, r.x + 7, r.y - 12, { size: 12, color: C.muted, align: 'left' });
        return yc;
      }
      // ±A 눈금 (세로축 왼쪽)
      function ampTicks(ctx, r, yc, s, C) {
        ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        [A, -A].forEach((v) => { const yy = yc - v * s; ctx.beginPath(); ctx.moveTo(r.x, yy); ctx.lineTo(r.x + r.w, yy); ctx.stroke(); });
        ctx.restore();
        [A, -A].forEach((v) => {
          const yy = yc - v * s;
          D.line(ctx, [[r.x - 3, yy], [r.x + 3, yy]], C.fg, 1.2);
          D.text(ctx, (v > 0 ? '' : '−') + Math.abs(v), r.x - 6, yy, { size: 11, color: C.muted, align: 'right' });
        });
      }
      // 아래쪽 눈금 글자
      function xTicks(ctx, r, yc, n, max, unit, C) {
        for (let m = 1; m < n; m++) {
          const xx = r.x + m / n * r.w;
          D.line(ctx, [[xx, yc - 3], [xx, yc + 3]], C.fg, 1.2);
          D.text(ctx, String(m * max / n), xx, r.y + r.h + 9, { size: 11, color: C.muted });
        }
        D.text(ctx, unit, r.x + r.w + 6, r.y + r.h + 9, { size: 11, color: C.muted, align: 'right' });
      }
      // 양쪽 화살표 치수선
      function dim(ctx, x0_, x1_, y, color) {
        const m = (x0_ + x1_) / 2;
        D.arrow(ctx, m, y, x0_, y, color, 1.4, 6); D.arrow(ctx, m, y, x1_, y, color, 1.4, 6);
      }

      function render() {
        const { ctx, W, H } = cv, C = kit.C;
        ctx.clearRect(0, 0, W, H);
        const L = narrow ? 34 : 46, R = narrow ? 12 : 22, pw = W - L - R;
        const X = (x) => L + x / XMAX * pw;
        const k = TAU / lam, w = TAU * f, T = 1 / f;
        const head = narrow ? 24 : 28;
        // ---------- 레이아웃 ----------
        let r1, band = null;
        if (mode === 'T') {
          r1 = { x: L, y: head + 8, w: pw, h: Math.round(H * (narrow ? 0.43 : 0.45)) };
        } else {
          const nR = narrow ? 6 : 7, gap = narrow ? 9 : 11;
          band = { y: head + 26, h: (nR - 1) * gap, nR, gap };
          const gy = band.y + band.h + (narrow ? 38 : 42);
          r1 = { x: L, y: gy, w: pw, h: Math.round(H * (narrow ? 0.22 : 0.22)) };
        }
        const y2 = r1.y + r1.h + (narrow ? 42 : 46);
        const r2 = { x: L, y: y2, w: pw, h: H - y2 - 22 };
        geo = { L, pw, maxY: r1.y + r1.h + 24 };

        // ---------- 진행 방향 ----------
        {
          const yy = 11, ax1 = W - R + 6, ax0 = ax1 - 30;
          if (dir > 0) D.arrow(ctx, ax0, yy, ax1, yy, C.purple, 2.5, 9); else D.arrow(ctx, ax1, yy, ax0, yy, C.purple, 2.5, 9);
          D.text(ctx, '파동의 진행 방향', ax0 - 7, yy, { size: 12, color: C.purple, align: 'right', bold: true });
        }

        let xm0 = x0;   // 표시한 점의 평형 위치
        if (mode === 'T') {
          // ---------- 횡파: 줄(매질) = y-x 그래프 ----------
          const yc = axes(ctx, r1, C, 'y (cm)');
          const s = (r1.h / 2 - 24) / AMAX;              // cm → px
          const Yw = (y) => yc - y * s;
          ampTicks(ctx, r1, yc, s, C);
          xTicks(ctx, r1, yc, XMAX, XMAX, 'x (m)', C);
          const pts = [];
          for (let px = 0; px <= pw; px += 2) { const x = px / pw * XMAX; pts.push([L + px, Yw(A * Math.sin(k * x - theta))]); }
          D.line(ctx, pts, C.purple, 3);
          ctx.fillStyle = C.fg;
          ctx.beginPath();
          for (let i = 0; i <= 32; i++) { const x = i * XMAX / 32, yy = Yw(A * Math.sin(k * x - theta)); ctx.moveTo(X(x) + 2.4, yy); ctx.arc(X(x), yy, 2.4, 0, TAU); }
          ctx.fill();
          // 파장 λ: 이웃한 두 마루 사이 (파동과 함께 움직임)
          const base = XMAX / 2 - lam;
          const xc = base + mod((theta + Math.PI / 2) / k - base, lam);
          const by = r1.y + 8;
          [xc, xc + lam].forEach((xx) => D.line(ctx, [[X(xx), Yw(A) - 5], [X(xx), by + 4]], C.muted, 1, [2, 3]));
          dim(ctx, X(xc), X(xc + lam), by, C.fg);
          const lp = X(xc + lam) - X(xc);
          tag(ctx, lp > 80 ? `λ = ${lam.toFixed(1)} m` : 'λ', (X(xc) + X(xc + lam)) / 2, by, { size: 12, bold: true, bg: C.bg, color: C.fg });
          // 표시한 점
          const ym = A * Math.sin(k * x0 - theta), xp = X(x0), yp = Yw(ym);
          D.line(ctx, [[xp, Yw(A)], [xp, Yw(-A)]], C.orange, 1.5, [3, 3]);
          D.line(ctx, [[xp - 6, Yw(A)], [xp + 6, Yw(A)]], C.orange, 1.5);
          D.line(ctx, [[xp - 6, Yw(-A)], [xp + 6, Yw(-A)]], C.orange, 1.5);
          const vv = -dir * Math.cos(k * x0 - theta);    // 매질 속도 / (Aω)
          if (Math.abs(vv) > 0.1) { const sg = Math.sign(vv); D.arrow(ctx, xp, yp - sg * 8, xp, yp - sg * (8 + Math.abs(vv) * (narrow ? 22 : 30)), C.blue, 3, 8); }
          D.circle(ctx, xp, yp, 6.5, { fill: C.orange, stroke: C.bg, width: 2 });
        } else {
          // ---------- 종파: 입자들의 소밀 ----------
          const pxm = pw / XMAX, lamPx = lam * pxm;
          const Al = (A / AMAX) * Math.min(narrow ? 14 : 24, 0.85 * lamPx / TAU);  // 입자 변위 진폭(px, 과장해서 표시)
          const dxp = narrow ? 7 : 9, dxm = dxp / pxm;
          const i0 = Math.round(x0 / dxm); xm0 = i0 * dxm;
          const sx = (xe) => Al * Math.sin(k * xe - theta);
          // 밀(빽빽): 위상 kx−θ = π, 소(듬성): 위상 = 0
          const comp = [], rare = [];
          for (let n = -2; n < XMAX / lam + 3; n++) {
            const xa = (theta + Math.PI + TAU * n) / k, xb = (theta + TAU * n) / k;
            if (xa > 0.15 && xa < XMAX - 0.15) comp.push(xa);
            if (xb > 0.15 && xb < XMAX - 0.15) rare.push(xb);
          }
          // 밀 위치 세로 점선 (입자 띠 ~ 변위 그래프)
          comp.forEach((xa) => D.line(ctx, [[X(xa), band.y - 6], [X(xa), r1.y + r1.h]], C.purple, 1, [2, 4]));
          // 밀·소 글자
          const labY = band.y - 15;
          if (lamPx / 2 >= 30) {
            comp.forEach((xa) => D.text(ctx, '밀', X(xa), labY, { size: 12, bold: true, color: C.purple }));
            rare.forEach((xb) => D.text(ctx, '소', X(xb), labY, { size: 12, bold: true, color: C.muted }));
          } else if (comp.length) {
            const xa = comp.reduce((p, q) => (Math.abs(q - XMAX / 2) < Math.abs(p - XMAX / 2) ? q : p));
            const xb = (xa + lam / 2 < XMAX - 0.15) ? xa + lam / 2 : xa - lam / 2;
            D.text(ctx, '밀', X(xa), labY, { size: 12, bold: true, color: C.purple });
            D.text(ctx, '소', X(xb), labY, { size: 12, bold: true, color: C.muted });
          }
          // 입자
          const rad = narrow ? 2.2 : 2.7;
          ctx.save(); ctx.beginPath(); ctx.rect(L - 8, band.y - 8, pw + 16, band.h + 16); ctx.clip();
          ctx.fillStyle = C.fg; ctx.globalAlpha = 0.8; ctx.beginPath();
          for (let r = 0; r < band.nR; r++) {
            const yy = band.y + r * band.gap;
            for (let i = -3; i * dxm <= XMAX + 3 * dxm; i++) {
              if (i === i0) continue;
              const xe = i * dxm, xp = X(xe) + sx(xe);
              ctx.moveTo(xp + rad, yy); ctx.arc(xp, yy, rad, 0, TAU);
            }
          }
          ctx.fill(); ctx.restore();
          // 표시한 입자 줄
          const xq = X(xm0), sq = sx(xm0);
          D.line(ctx, [[xq, band.y - 7], [xq, band.y + band.h + 7]], C.muted, 1, [2, 2]);
          for (let r = 0; r < band.nR; r++) D.circle(ctx, xq + sq, band.y + r * band.gap, rad + 1.3, { fill: C.orange });
          const ry = band.y + band.h + 12;
          D.line(ctx, [[xq - Al, ry], [xq + Al, ry]], C.orange, 1.5);
          D.line(ctx, [[xq - Al, ry - 4], [xq - Al, ry + 4]], C.orange, 1.5); D.line(ctx, [[xq + Al, ry - 4], [xq + Al, ry + 4]], C.orange, 1.5);
          const vv = -dir * Math.cos(k * xm0 - theta);
          if (Math.abs(vv) > 0.1) { const sg = Math.sign(vv); D.arrow(ctx, xq + sq, ry, xq + sq + sg * Math.abs(vv) * (narrow ? 20 : 28), ry, C.blue, 3, 7); }
          D.circle(ctx, xq + sq, ry, 3, { fill: C.orange });
          // 변위-위치 그래프 (오른쪽 변위를 + 로)
          const yc = axes(ctx, r1, C, '변위 (cm)');
          { const t = '오른쪽으로 변위 = +'; ctx.save(); ctx.font = FONT(11); const tw = ctx.measureText(t).width; ctx.fillStyle = C.bg; ctx.fillRect(r1.x + r1.w - tw - 3, r1.y - 19, tw + 6, 15); ctx.restore();
            D.text(ctx, t, r1.x + r1.w, r1.y - 12, { size: 11, color: C.muted, align: 'right' }); }
          const s = (r1.h / 2 - 8) / AMAX;
          ampTicks(ctx, r1, yc, s, C);
          xTicks(ctx, r1, yc, XMAX, XMAX, 'x (m)', C);
          const pts = [];
          for (let px = 0; px <= pw; px += 2) { const x = px / pw * XMAX; pts.push([L + px, yc - A * Math.sin(k * x - theta) * s]); }
          D.line(ctx, pts, C.purple, 2.5);
          D.circle(ctx, X(xm0), yc - A * Math.sin(k * xm0 - theta) * s, 5, { fill: C.orange, stroke: C.bg, width: 1.5 });
        }

        // ---------- 표시한 점의 변위-시간 그래프 ----------
        const yc2 = axes(ctx, r2, C, mode === 'T' ? 'y (cm)' : '변위 (cm)');
        D.text(ctx, '주황 점의 변위–시간 그래프', r2.x + r2.w, r2.y - 12, { size: 11, color: C.orange, align: 'right', bold: true });
        const s2 = (r2.h / 2 - 16) / AMAX;
        const T2 = (t) => r2.x + t / TW * r2.w;
        ampTicks(ctx, r2, yc2, s2, C);
        xTicks(ctx, r2, yc2, TW, TW, 't (s)', C);
        const phs = k * xm0 - theta + dir * w * tau;            // t = 0 일 때의 위상
        const yAt = (t) => A * Math.sin(phs - dir * w * t);
        const full = [], done = [];
        for (let i = 0; i <= 240; i++) { const t = TW * i / 240, p = [T2(t), yc2 - yAt(t) * s2]; full.push(p); if (t <= tau) done.push(p); }
        done.push([T2(tau), yc2 - yAt(tau) * s2]);
        D.line(ctx, full, C.muted, 1.5, [4, 4]);
        D.line(ctx, done, C.orange, 2.8);
        D.circle(ctx, T2(tau), yc2 - yAt(tau) * s2, 5, { fill: C.orange });
        // 주기 T: 이웃한 두 최고점 사이
        const t1 = mod(dir * (phs - Math.PI / 2), TAU) / w;
        if (t1 + T <= TW + 1e-6) {
          const ty = r2.y + 7;
          [t1, t1 + T].forEach((tt) => D.line(ctx, [[T2(tt), yc2 - A * s2 - 4], [T2(tt), ty + 4]], C.muted, 1, [2, 3]));
          dim(ctx, T2(t1), T2(t1 + T), ty, C.fg);
          const tp = T2(t1 + T) - T2(t1);
          tag(ctx, tp > 76 ? `T = ${T.toFixed(2)} s` : 'T', (T2(t1) + T2(t1 + T)) / 2, ty, { size: 12, bold: true, bg: C.bg, color: C.fg });
        }

        // ---------- 수치 ----------
        oT(`${T.toFixed(2)} s`);
        oV(`${(f * lam).toFixed(2)} m/s`);
        oY(`${fmt1(A * Math.sin(k * xm0 - theta))} cm`);
      }
      cv.onResize(render);
      render();
    },
  });
})();
