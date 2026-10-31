/* 이중 슬릿 간섭(영의 실험)과 단일 슬릿 회절: 스크린 무늬, 세기 그래프, Δx = Lλ/d */
(function () {
  'use strict';
  const XW = 10;   // 스크린에서 보여 주는 범위: −10 ~ +10 mm
  const FONT = (s, b) => `${b ? 700 : 500} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
  // 파장(nm) → 화면 색 (가시광선 근사)
  function wl2rgb(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
    else r = 1;
    const f = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 680 ? 0.35 + 0.65 * (780 - nm) / 100 : 1;
    return [r, g, b].map((c) => Math.round(255 * Math.pow(Math.max(0, c * f), 0.8)));
  }
  const colorName = (nm) => (nm < 425 ? '보라' : nm < 450 ? '남색' : nm < 495 ? '파랑' : nm < 570 ? '초록' : nm < 590 ? '노랑' : nm < 620 ? '주황' : '빨강');
  const lum = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim()); if (!m) return 1; const n = parseInt(m[1], 16); return (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };

  SIM.register('double-slit', {
    title: '이중 슬릿 간섭과 단일 슬릿 회절',
    hint: '빛의 파장, 슬릿 간격, 스크린까지 거리를 바꿔 무늬 간격이 어떻게 달라지는지 보세요.',
    init(kit) {
      const D = kit.draw;
      const narrow = kit.root.clientWidth < 560;
      let lam = 550, d = 0.25, L = 1.0, mode = 'D', ph = 0;
      let bandKey = '', band = null;

      const cv = kit.canvas({ aspect: narrow ? 1.1 : 0.64, maxH: 520 });
      kit.select({ label: '보기', options: [['D', '이중 슬릿 (간섭)'], ['S', '단일 슬릿 (회절)']], value: 'D', onChange: (v) => { mode = v; relabel(); } });
      kit.slider({ label: '파장 λ', min: 400, max: 700, step: 10, value: lam, unit: 'nm', onInput: (v) => { lam = v; } });
      const sd = kit.slider({ label: '슬릿 간격 d', min: 0.1, max: 0.5, step: 0.05, value: d, fmt: (v) => v.toFixed(2) + ' mm', onInput: (v) => { d = v; } });
      kit.slider({ label: '스크린까지 거리 L', min: 0.5, max: 2, step: 0.1, value: L, unit: 'm', onInput: (v) => { L = v; } });
      const outs = kit.root.querySelector('.sim-outs');
      const mk = (lab) => {
        const r = kit.readout(lab), el = outs.lastElementChild.querySelector('.sim-out-lab'); let last = '';
        return { set: (s) => { if (s !== last) { last = s; r.set(s); } }, lab: (t) => { el.innerHTML = t; } };
      };
      const oC = mk('빛의 색'), o1 = mk('밝은 무늬 간격 Δx'), o2 = mk('가운데 무늬 폭');
      kit.loop((dt) => { ph += dt; render(); });
      kit.note('이중 슬릿: 밝은 무늬 간격 Δx = Lλ/d. 파장이 길수록(빨강 쪽), 스크린이 멀수록, 슬릿 간격이 좁을수록 무늬 간격이 넓어져요.');
      kit.note('단일 슬릿: 가운데 밝은 무늬 폭(2Lλ/a)이 옆 밝은 무늬 폭(Lλ/a)의 2배예요. 슬릿이 좁을수록 넓게 퍼져요(회절).');
      function relabel() {
        const lab = sd.el.closest('.sim-field').querySelector('.sim-lab');
        lab.textContent = mode === 'D' ? '슬릿 간격 d' : '슬릿 폭 a';
        o1.lab(mode === 'D' ? '밝은 무늬 간격 Δx' : '옆 무늬 폭');
      }

      // 상대 세기 (x: mm)
      const unit = () => lam * L / d * 1e-3;     // mm: 이중 = Δx, 단일 = 첫 어두운 무늬 위치
      function I(x) {
        const u = unit();
        if (mode === 'D') { const c = Math.cos(Math.PI * x / u); return c * c; }
        const b = Math.PI * x / u; return Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2;
      }
      function tag(ctx, s, x, y, o) {
        ctx.save(); ctx.font = FONT(o.size || 12, o.bold);
        const w = ctx.measureText(s).width + 8, h = (o.size || 12) + 6;
        const al = o.align || 'center', x0 = al === 'left' ? x - 4 : al === 'right' ? x - w + 4 : x - w / 2;
        ctx.globalAlpha = 0.9; ctx.fillStyle = o.bg; ctx.fillRect(x0, y - h / 2, w, h); ctx.restore();
        D.text(ctx, s, x, y, o);
        return w;
      }
      const textW = (ctx, s, size, b) => { ctx.save(); ctx.font = FONT(size, b); const w = ctx.measureText(s).width; ctx.restore(); return w; };
      // 치수선 (양 끝 짧은 세로선)
      function bracket(ctx, xa, xb, y, color) {
        D.line(ctx, [[xa, y], [xb, y]], color, 1.5);
        D.line(ctx, [[xa, y - 5], [xa, y + 5]], color, 1.5); D.line(ctx, [[xb, y - 5], [xb, y + 5]], color, 1.5);
      }

      function render() {
        const { ctx, W, H } = cv, C = kit.C;
        ctx.clearRect(0, 0, W, H);
        const dark = lum(C.bg) < 0.4;
        const col = wl2rgb(lam), cs = `rgb(${col})`;
        const stroke = dark ? cs : `rgb(${col.map((c) => Math.round(c * 0.62))})`;
        const m = narrow ? 14 : 24, cx = W / 2, hw = W / 2 - m;
        const X = (mm) => cx + mm / XW * hw;
        const Ys = Math.round(H * (narrow ? 0.4 : 0.42));
        const bTop = Ys + 2, bBot = bTop + (narrow ? 44 : 56);
        const gTop = bBot + (narrow ? 28 : 32), gBot = H - 24;
        const u = unit();

        // ---------- 장치 그림 (위에서 본 모습, 크기 비율은 과장) ----------
        const top = 26;
        const Lpx = 26 + (L - 0.5) / 1.5 * (Ys - top - 46 - 26);
        const yP = Ys - Lpx;
        const sep = mode === 'D' ? 10 + (d - 0.1) / 0.4 * 30 : 0;            // 그림 속 슬릿 간격(px)
        const gap = mode === 'D' ? 4 : 5 + (d - 0.1) / 0.4 * 18;              // 그림 속 슬릿 폭(px)
        const slits = mode === 'D' ? [cx - sep / 2, cx + sep / 2] : [cx];
        // 레이저와 빛줄기
        ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = cs; ctx.fillRect(cx - sep / 2 - gap / 2 - 9, top - 4, sep + gap + 18, yP - top + 1); ctx.restore();
        const lw = Math.max(44, sep + gap + 26);
        ctx.fillStyle = C.fg; ctx.fillRect(cx - lw / 2, 4, lw, 16);
        ctx.fillStyle = cs; ctx.fillRect(cx - 6, 18, 12, 4);
        D.text(ctx, `레이저 (${lam} nm)`, cx + lw / 2 + 8, 12, { size: 11, color: C.muted, align: 'left' });
        // 슬릿 뒤로 퍼지는 원형 파면
        const lv = 7 + (lam - 400) / 300 * 6, spd = 16, rmax = Math.hypot(W / 2, Lpx) + 4;
        ctx.save(); ctx.beginPath(); ctx.rect(0, yP + 3, W, Ys - yP - 4); ctx.clip();
        ctx.strokeStyle = cs; ctx.lineWidth = 1.5;
        slits.forEach((sx) => {
          for (let r = (ph * spd) % lv; r < rmax; r += lv) {
            if (r < 2) continue;
            ctx.globalAlpha = 0.6 * (1 - r / rmax);
            ctx.beginPath(); ctx.arc(sx, yP + 3, r, 0, Math.PI); ctx.stroke();
          }
        });
        ctx.restore();
        // 슬릿판
        const pw = narrow ? 130 : 180;
        ctx.fillStyle = C.fg;
        const edges = [cx - pw / 2];
        slits.forEach((sx) => { edges.push(sx - gap / 2, sx + gap / 2); });
        edges.push(cx + pw / 2);
        for (let i = 0; i < edges.length; i += 2) ctx.fillRect(edges[i], yP - 3, edges[i + 1] - edges[i], 6);
        // 슬릿 간격/폭 표시
        if (mode === 'D') bracket(ctx, slits[0], slits[1], yP - 10, C.fg);
        else bracket(ctx, cx - gap / 2, cx + gap / 2, yP - 10, C.fg);
        tag(ctx, mode === 'D' ? 'd' : 'a', cx + Math.max(sep / 2, gap / 2) + 12, yP - 11, { size: 12, bold: true, color: C.fg, bg: C.bg, align: 'left' });
        // L 치수
        const lx = m + 10;
        D.arrow(ctx, lx, (yP + Ys) / 2, lx, yP, C.fg, 1.4, 6); D.arrow(ctx, lx, (yP + Ys) / 2, lx, Ys, C.fg, 1.4, 6);
        D.line(ctx, [[lx - 6, yP], [cx - pw / 2 - 4, yP]], C.muted, 1, [2, 3]);
        tag(ctx, `L = ${L.toFixed(1)} m`, lx + 8, (yP + Ys) / 2, { size: 12, bold: true, color: C.fg, bg: C.bg, align: 'left' });
        // 스크린 (아래 띠가 스크린 앞면)
        D.line(ctx, [[m - 4, Ys], [W - m + 4, Ys]], C.muted, 3);
        D.text(ctx, '스크린', W - m, Ys - 9, { size: 11, color: C.muted, align: 'right', bold: true });

        // ---------- 스크린 무늬 (띠) ----------
        const dpr = Math.min(2.5, window.devicePixelRatio || 1);
        const bw = Math.round((W - 2 * m) * dpr);
        const key = [bw, lam, d, L, mode].join(',');
        if (key !== bandKey) {
          bandKey = key;
          band = document.createElement('canvas'); band.width = bw; band.height = 1;
          const bctx = band.getContext('2d'), im = bctx.createImageData(bw, 1);
          for (let i = 0; i < bw; i++) {
            const x = ((i + 0.5) / bw * 2 - 1) * XW, v = Math.pow(I(x), 0.6);
            im.data[i * 4] = col[0] * v; im.data[i * 4 + 1] = col[1] * v; im.data[i * 4 + 2] = col[2] * v; im.data[i * 4 + 3] = 255;
          }
          bctx.putImageData(im, 0, 0);
        }
        ctx.fillStyle = '#07080c'; ctx.fillRect(m, bTop, W - 2 * m, bBot - bTop);
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(band, 0, 0, bw, 1, m, bTop, W - 2 * m, bBot - bTop); ctx.restore();
        ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.strokeRect(m - 0.5, bTop - 0.5, W - 2 * m + 1, bBot - bTop + 1); ctx.restore();

        // ---------- 세기 그래프 ----------
        const gh = gBot - gTop, Iy = (v) => gBot - v * (gh - 22);
        D.arrow(ctx, m, gBot, W - m + 8, gBot, C.fg, 1.3, 7);
        D.arrow(ctx, m, gBot, m, gTop - 4, C.fg, 1.3, 7);
        D.text(ctx, '빛의 세기', m + 7, gTop - 10, { size: 11, color: C.muted, align: 'left' });
        [-10, -5, 0, 5, 10].forEach((v) => {
          D.line(ctx, [[X(v), gBot - 3], [X(v), gBot + 3]], C.fg, 1.2);
          D.text(ctx, v === 10 ? '10 mm' : (v < 0 ? '−' + -v : String(v)), v === 10 ? W - m + 6 : X(v), gBot + 12, { size: 11, color: C.muted, align: v === 10 ? 'right' : 'center' });
        });
        const pts = [];
        for (let px = m; px <= W - m; px += 0.5) pts.push([px, Iy(I((px - cx) / hw * XW))]);
        ctx.save(); ctx.beginPath(); ctx.moveTo(m, gBot); pts.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(W - m, gBot); ctx.closePath();
        ctx.globalAlpha = 0.28; ctx.fillStyle = cs; ctx.fill(); ctx.restore();
        D.line(ctx, pts, stroke, 2);
        if (mode === 'S') {   // 옆 무늬는 아주 어두워서 10배로 키운 곡선도 함께
          const p10 = [];
          for (let px = m; px <= W - m; px += 0.5) { const x = (px - cx) / hw * XW; if (Math.abs(x) >= u * 0.98) p10.push([px, Iy(Math.min(1.08, 10 * I(x)))]); else if (p10.length && p10[p10.length - 1] !== null) p10.push(null); }
          ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.3; ctx.setLineDash([3, 3]); ctx.beginPath();
          let pen = false;
          p10.forEach((p) => { if (!p) { pen = false; return; } if (pen) ctx.lineTo(p[0], p[1]); else { ctx.moveTo(p[0], p[1]); pen = true; } });
          ctx.stroke(); ctx.restore();
          D.text(ctx, '점선 = 옆 무늬 세기 ×10', m + 8, gTop + 22, { size: 11, color: C.muted, align: 'left' });
        }

        // ---------- 간격 표시 ----------
        const by = gTop + 6;
        const guide = (x) => D.line(ctx, [[x, bTop], [x, gBot]], C.muted, 1, [2, 3]);
        if (mode === 'D') {
          if (u <= XW) {
            guide(X(0)); guide(X(u));
            bracket(ctx, X(0), X(u), by, C.fg);
            const s = `Δx = ${u.toFixed(2)} mm`, w = textW(ctx, s, 12, true) + 8, bwid = X(u) - X(0);
            if (bwid > w + 10) tag(ctx, s, (X(0) + X(u)) / 2, by, { size: 12, bold: true, color: C.fg, bg: C.bg });
            else tag(ctx, s, X(u) + 8, by, { size: 12, bold: true, color: C.fg, bg: C.bg, align: 'left' });
          } else tag(ctx, `Δx = ${u.toFixed(1)} mm (화면보다 넓어요)`, cx, by, { size: 12, bold: true, color: C.fg, bg: C.bg });
        } else {
          const sa = `${(2 * u).toFixed(2)} mm`, sb = `${u.toFixed(2)} mm`;
          if (u <= XW) {
            guide(X(-u)); guide(X(u));
            bracket(ctx, X(-u), X(u), by, C.fg);
            const wa = textW(ctx, sa, 12, true) + 8;
            const showB = 2 * u <= XW;
            if (showB) { guide(X(2 * u)); bracket(ctx, X(u) + 2, X(2 * u), by, C.muted); }
            const wb = textW(ctx, sb, 12, true) + 8;
            let ax = cx, aal = 'center';
            if (X(u) - X(-u) < wa + 8) {               // 가운데 괄호가 좁으면 글자를 옆으로
              ax = X(-u) - 6; aal = 'right';
            }
            tag(ctx, sa, ax, by, { size: 12, bold: true, color: C.fg, bg: C.bg, align: aal });
            if (showB) {
              if (X(2 * u) - X(u) > wb + 8) tag(ctx, sb, (X(u) + X(2 * u)) / 2, by, { size: 12, bold: true, color: C.muted, bg: C.bg });
              else tag(ctx, sb, X(2 * u) + 6, by, { size: 12, bold: true, color: C.muted, bg: C.bg, align: 'left' });
            }
          } else tag(ctx, `가운데 무늬 폭 ${(2 * u).toFixed(1)} mm (화면보다 넓어요)`, cx, by, { size: 12, bold: true, color: C.fg, bg: C.bg });
        }

        // ---------- 수치 ----------
        oC.set(`<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${cs};vertical-align:-1px;margin-right:5px"></span>${colorName(lam)}`);
        o1.set(`${u.toFixed(2)} mm`);
        o2.set(`${(mode === 'D' ? u : 2 * u).toFixed(2)} mm`);
      }
      cv.onResize(render);
      render();
    },
  });
})();
