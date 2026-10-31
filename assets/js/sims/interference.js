/* 두 파원의 간섭(물결파): 픽셀 격자 물결 무늬, 보강선·상쇄선, 탐침점의 경로차 */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const VIEW_CM = 24;          // 캔버스 가로 = 24 cm
  const FONT = (s, b) => `${b ? 700 : 500} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
  function rgb(c) {
    c = (c || '').trim();
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = c.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }

  SIM.register('interference', {
    title: '두 파원의 간섭 — 물결파',
    hint: '파장과 파원 사이 거리를 바꿔 보세요. 화면을 끌면 탐침점 P가 움직이며 경로차로 보강·상쇄를 알려 줘요.',
    init(kit) {
      const D = kit.draw;
      const narrow = kit.root.clientWidth < 560;
      let lam = 1.5, d = 5, showLines = true, t = 0;
      let P = { fx: 0.68, fy: 0.74 };                 // 탐침점 (캔버스 비율 좌표)
      let gw = 0, gh = 0, off = null, octx = null, img = null, buf = null, A = null, B = null;
      let geoKey = '', lutKey = '';
      const LUT = new Uint32Array(256);

      const cv = kit.canvas({ aspect: narrow ? 0.98 : 0.6, maxH: 480 });
      kit.slider({ label: '파장 λ', min: 1, max: 3, step: 0.1, value: lam, unit: 'cm', onInput: (v) => { lam = v; } });
      kit.slider({ label: '두 파원 사이 거리 d', min: 2, max: 8, step: 0.2, value: d, unit: 'cm', onInput: (v) => { d = v; } });
      kit.toggle({ label: '보강선·상쇄선 그리기', value: true, onChange: (b) => { showLines = b; } });
      const out = (lab) => { const r = kit.readout(lab); let last = ''; return (s) => { if (s !== last) { last = s; r.set(s); } }; };
      const oD = out('|S₁P − S₂P|'), oQ = out('경로차 ÷ λ'), oJ = out('P 의 간섭');
      const loop = kit.loop((dt) => { t += dt; render(); });
      kit.playButton(loop);
      kit.note('경로차가 0, λ, 2λ… (파장의 정수배)인 곳은 보강 간섭 — 크게 진동해요. 0.5λ, 1.5λ… (반파장의 홀수배)인 곳은 상쇄 간섭 — 거의 진동하지 않아요(마디).');
      kit.note('파장이 짧을수록, 두 파원 사이가 멀수록 마디선이 촘촘해지고 개수가 많아져요.');

      const setP = (x, y) => { P = { fx: Math.min(0.97, Math.max(0.03, x / cv.W)), fy: Math.min(0.97, Math.max(0.03, y / cv.H)) }; };
      kit.pointer(cv.el, { down: setP, move: setP });

      function geometry(W, H) {
        const key = [W, H, lam, d].join(',');
        if (key === geoKey) return;
        geoKey = key;
        const ngw = Math.min(narrow ? 170 : 220, Math.round(W / 2)), ngh = Math.max(20, Math.round(ngw * H / W));
        if (ngw !== gw || ngh !== gh || !off) {
          gw = ngw; gh = ngh;
          off = document.createElement('canvas'); off.width = gw; off.height = gh; octx = off.getContext('2d');
          img = octx.createImageData(gw, gh); buf = new Uint32Array(img.data.buffer);
          A = new Float32Array(gw * gh); B = new Float32Array(gw * gh);
        }
        const g = layout(W, H), k = TAU / g.lp, cw = W / gw, ch = H / gh;
        // u = sin(kr₁ − ωt) + sin(kr₂ − ωt) = A·cos ωt − B·sin ωt
        for (let j = 0; j < gh; j++) {
          const y = (j + 0.5) * ch, dy = y - g.ys;
          for (let i = 0; i < gw; i++) {
            const x = (i + 0.5) * cw, r1 = Math.hypot(x - g.x1, dy), r2 = Math.hypot(x - g.x2, dy), id = j * gw + i;
            A[id] = Math.sin(k * r1) + Math.sin(k * r2); B[id] = Math.cos(k * r1) + Math.cos(k * r2);
          }
        }
      }
      function layout(W, H) {
        const ppc = W / VIEW_CM;
        return { ppc, lp: lam * ppc, dp: d * ppc, ys: H * 0.2, x1: W / 2 - d * ppc / 2, x2: W / 2 + d * ppc / 2, cx: W / 2 };
      }
      function palette(C) {
        const key = C.purple + C.card;
        if (key === lutKey) return;
        lutKey = key;
        const lo = rgb(C.card), hi = rgb(C.purple);
        for (let q = 0; q < 256; q++) {
          const s = q / 255, r = lo[0] + (hi[0] - lo[0]) * s, g = lo[1] + (hi[1] - lo[1]) * s, b = lo[2] + (hi[2] - lo[2]) * s;
          LUT[q] = (255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r);
        }
      }
      function tag(ctx, s, x, y, o) {
        ctx.save(); ctx.font = FONT(o.size || 12, o.bold);
        const w = ctx.measureText(s).width + 8, h = (o.size || 12) + 6;
        const al = o.align || 'center', x0 = al === 'left' ? x - 4 : al === 'right' ? x - w + 4 : x - w / 2;
        ctx.globalAlpha = o.alpha ?? 0.9; ctx.fillStyle = o.bg; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x0, y - h / 2, w, h, 5); else ctx.rect(x0, y - h / 2, w, h);
        ctx.fill(); ctx.restore();
        D.text(ctx, s, x, y, o);
        return w;
      }

      function render() {
        const { ctx, W, H } = cv, C = kit.C;
        geometry(W, H); palette(C);
        const g = layout(W, H);
        // 물결 무늬
        const w = TAU * 1.1, c = Math.cos(w * t), s = Math.sin(w * t), n = gw * gh;
        for (let id = 0; id < n; id++) {
          let q = ((A[id] * c - B[id] * s) * 0.25 + 0.5) * 255 | 0;
          buf[id] = LUT[q < 0 ? 0 : q > 255 ? 255 : q];
        }
        octx.putImageData(img, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(off, 0, 0, W, H); ctx.restore();

        // 보강선(경로차 mλ)·상쇄선(경로차 (m+½)λ): 두 파원을 초점으로 하는 쌍곡선
        const labels = [];
        if (showLines) {
          const yb = H - 12;
          const hyper = (Dv, color, dash, txt) => {
            ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = narrow ? 1.3 : 1.5; ctx.globalAlpha = 0.85; if (dash) ctx.setLineDash(dash);
            ctx.beginPath();
            if (Math.abs(Dv) < 1e-6) { ctx.moveTo(g.cx, 0); ctx.lineTo(g.cx, H); labels.push([g.cx, txt, color]); }
            else {
              const a = Math.abs(Dv) / 2, cc = g.dp / 2, b = Math.sqrt(cc * cc - a * a), sg = Math.sign(Dv);
              const T = Math.asinh(Math.max(g.ys, H - g.ys) * 1.2 / b);
              for (let i = 0; i <= 120; i++) { const tt = -T + 2 * T * i / 120; const x = g.cx + sg * a * Math.cosh(tt), y = g.ys + b * Math.sinh(tt); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
              const xb = g.cx + sg * a * Math.sqrt(1 + ((yb - g.ys) / b) ** 2);
              if (xb > 14 && xb < W - 14) labels.push([xb, txt, color]);
            }
            ctx.stroke(); ctx.restore();
          };
          const M = Math.ceil(d / lam) + 1;
          for (let m = -M; m <= M; m++) {
            const Dv = m * g.lp;
            if (Math.abs(Dv) < g.dp - 0.5) hyper(Dv, C.orange, null, m === 0 ? '0' : `${Math.abs(m)}λ`);
            const Dn = (m + 0.5) * g.lp;
            if (Math.abs(Dn) < g.dp - 0.5) hyper(Dn, C.fg, [5, 4], `${Math.abs(m + 0.5).toFixed(1)}λ`);
          }
          // 아래쪽 경로차 글자 (가운데부터, 겹치면 생략)
          labels.sort((p, q) => Math.abs(p[0] - g.cx) - Math.abs(q[0] - g.cx));
          const placed = [];
          ctx.save(); ctx.font = FONT(11, true);
          labels.forEach(([x, txt, color]) => {
            const wd = ctx.measureText(txt).width + 8;
            if (placed.every(([px, pw]) => Math.abs(px - x) > (pw + wd) / 2 + 3) && x - wd / 2 > 2 && x + wd / 2 < W - 2) { placed.push([x, wd, txt, color]); }
          });
          ctx.restore();
          placed.forEach(([x, , txt, color]) => tag(ctx, txt, x, yb, { size: 11, bold: true, color, bg: C.card, alpha: 0.85 }));
          // 범례
          const ly = 13;
          ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = C.card; ctx.beginPath();
          const lgW = narrow ? 172 : 196;
          if (ctx.roundRect) ctx.roundRect(4, 3, lgW, 21, 6); else ctx.rect(4, 3, lgW, 21);
          ctx.fill(); ctx.restore();
          D.line(ctx, [[10, ly], [26, ly]], C.orange, 2);
          D.text(ctx, '보강선(배)', 30, ly, { size: 11, bold: true, color: C.fg, align: 'left' });
          D.line(ctx, [[narrow ? 92 : 104, ly], [narrow ? 108 : 120, ly]], C.fg, 2, [4, 3]);
          D.text(ctx, '상쇄선(마디)', narrow ? 112 : 124, ly, { size: 11, bold: true, color: C.fg, align: 'left' });
        }
        // 축척: λ 길이 막대
        {
          const x1 = W - 10, x0 = x1 - g.lp, y = 14;
          ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = C.card; ctx.fillRect(x0 - 26, 3, g.lp + 32, 21); ctx.restore();
          D.line(ctx, [[x0, y], [x1, y]], C.fg, 2); D.line(ctx, [[x0, y - 5], [x0, y + 5]], C.fg, 2); D.line(ctx, [[x1, y - 5], [x1, y + 5]], C.fg, 2);
          D.text(ctx, 'λ', x0 - 6, y, { size: 12, bold: true, color: C.fg, align: 'right' });
        }

        // 탐침점 P
        const px = P.fx * W, py = P.fy * H;
        const r1 = Math.hypot(px - g.x1, py - g.ys) / g.ppc, r2 = Math.hypot(px - g.x2, py - g.ys) / g.ppc;
        const dl = Math.abs(r1 - r2), q = dl / lam;
        const e1 = Math.abs(q - Math.round(q)), e2 = Math.abs(q - (Math.floor(q) + 0.5));
        const kind = e1 <= 0.1 ? 'con' : e2 <= 0.1 ? 'des' : 'mid';
        ctx.save(); ctx.globalAlpha = 0.85;
        D.line(ctx, [[g.x1, g.ys], [px, py]], C.fg, 1.5); D.line(ctx, [[g.x2, g.ys], [px, py]], C.fg, 1.5);
        ctx.restore();
        D.circle(ctx, px, py, 9, { stroke: C.card, width: 5 });
        D.circle(ctx, px, py, 9, { stroke: C.fg, width: 2.2 });
        D.circle(ctx, px, py, 2.5, { fill: C.fg });
        const ktxt = kind === 'con' ? '보강' : kind === 'des' ? '상쇄' : '중간';
        const kcol = kind === 'con' ? C.orange : kind === 'des' ? C.fg : C.muted;
        const ty = py > H * 0.18 + 30 ? py - 22 : py + 24;
        tag(ctx, `P: ${q.toFixed(2)}λ → ${ktxt}`, Math.min(W - 70, Math.max(70, px)), ty, { size: 12, bold: true, color: kcol, bg: C.card, alpha: 0.92 });

        // 파원
        [[g.x1, 'S₁'], [g.x2, 'S₂']].forEach(([x, nm]) => {
          const pulse = 6 + 1.5 * Math.sin(w * t);
          D.circle(ctx, x, g.ys, pulse + 2, { fill: C.card });
          D.circle(ctx, x, g.ys, pulse, { fill: C.fg });
          tag(ctx, nm, x, g.ys - 19, { size: 12, bold: true, color: C.fg, bg: C.card, alpha: 0.85 });
        });

        oD(`${dl.toFixed(2)} cm`);
        oQ(`${q.toFixed(2)} λ`);
        oJ(kind === 'con' ? '보강 (배)' : kind === 'des' ? '상쇄 (마디)' : '중간');
      }
      cv.onResize(render);
      render();
    },
  });
})();
