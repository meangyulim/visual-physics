/* 광전 효과: 광자 에너지 hf, 일함수 W, E_k,max = hf − W, 정지 전압, E_k,max–f 그래프 */
(function () {
  'use strict';
  const H_EV = 0.4136;   // h (eV / 10¹⁴ Hz)  — h = 4.136×10⁻¹⁵ eV·s
  const METALS = [['2.1', '세슘'], ['2.3', '나트륨'], ['4.3', '아연']];
  const FMAX = 15, EMAX = 4.6;
  const FONT = (s, b) => `${b ? 700 : 500} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;
  function wl2rgb(nm) {
    if (nm < 380) return [157, 123, 255];                   // 자외선: 보이지 않음 (보라로 표시)
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
    else r = 1;
    const f = nm < 420 ? 0.45 + 0.55 * (nm - 380) / 40 : nm > 700 ? Math.max(0.35, 0.35 + 0.65 * (780 - nm) / 80) : 1;
    return [r, g, b].map((c) => Math.round(255 * Math.pow(c * f, 0.8)));
  }
  const band = (nm) => (nm < 380 ? '자외선' : nm > 750 ? '적외선' : nm < 425 ? '보라' : nm < 450 ? '남색' : nm < 495 ? '파랑' : nm < 570 ? '초록' : nm < 590 ? '노랑' : nm < 620 ? '주황' : '빨강');

  SIM.register('photoelectric', {
    title: '광전 효과',
    hint: '금속을 고르고 빛의 진동수와 세기를 바꿔 보세요. 전자가 튀어나오는 조건은 무엇일까요?',
    init(kit) {
      const D = kit.draw;
      const narrow = kit.root.clientWidth < 560;
      let f = 6.5, inten = 60, Wf = 2.1;
      const photons = [], electrons = [], flashes = [];
      let acc = 0;

      const cv = kit.canvas({ aspect: narrow ? 1.04 : 0.56, maxH: 460 });
      kit.select({ label: '금속 (일함수 W)', options: METALS.map(([v, n]) => [v, `${n} — W = ${v} eV`]), value: '2.1', onChange: (v) => { Wf = +v; } });
      kit.slider({ label: '빛의 진동수 f', min: 4, max: FMAX, step: 0.1, value: f, fmt: (v) => `${v.toFixed(1)}×10¹⁴ Hz`, onInput: (v) => { f = v; } });
      kit.slider({ label: '빛의 세기', min: 0, max: 100, step: 10, value: inten, unit: '%', onInput: (v) => { inten = v; } });
      const out = (lab) => { const r = kit.readout(lab); let last = ''; return (s) => { if (s !== last) { last = s; r.set(s); } }; };
      const oE = out('광자 에너지 hf'), oK = out('E<sub>k,max</sub> = hf − W'), oV = out('정지 전압');
      const loop = kit.loop((dt) => { step(dt); render(); });
      kit.playButton(loop);
      kit.note('진동수가 문턱 진동수 f₀(= W/h)보다 작으면 빛이 아무리 세도 전자가 나오지 않아요. 세기를 키우면 튀어나오는 전자 수가, 진동수를 키우면 전자의 최대 운동 에너지가 커져요.');
      kit.note('그래프: E<sub>k,max</sub> = hf − W. 기울기는 플랑크 상수 h로 모든 금속이 같고, 가로축과 만나는 점(문턱 진동수)은 금속마다 달라요.');

      function layout(W, H) {
        if (narrow) {
          const sh = Math.round(H * 0.43);
          return { S: { x: 0, y: 0, w: W, h: sh }, G: { x: 40, y: sh + 34, w: W - 40 - 16, h: H - sh - 34 - 24 } };
        }
        const sw = Math.round(W * 0.45);
        return { S: { x: 0, y: 0, w: sw, h: H }, G: { x: sw + 50, y: 34, w: W - sw - 50 - 22, h: H - 34 - 30 } };
      }
      function scene(W, H) {
        const { S } = layout(W, H);
        const pw = narrow ? 12 : 16;
        const plate = { x: S.x + S.w * 0.14, y: S.y + S.h * (narrow ? 0.16 : 0.2), w: pw, h: S.h * (narrow ? 0.66 : 0.58) };
        const lamp = [S.x + S.w * 0.85, S.y + S.h * (narrow ? 0.2 : 0.14)];
        const hit = [plate.y + plate.h * 0.3, plate.y + plate.h * 0.72];
        const sc = Math.min(S.w, S.h * 1.6);
        return { S, plate, lamp, hit, vPh: sc * 0.95, cE: sc * 0.2 };
      }

      function step(dt) {
        if (dt <= 0) return;
        const { S, plate, lamp, hit, vPh, cE } = scene(cv.W, cv.H);
        const Ek = H_EV * f - Wf;
        acc += dt * inten / 100 * (narrow ? 10 : 13);
        while (acc >= 1) {
          acc -= 1;
          const ty = hit[0] + Math.random() * (hit[1] - hit[0]);
          photons.push({ x: lamp[0] + (Math.random() - 0.5) * 8, y: lamp[1] + (Math.random() - 0.5) * 8, tx: plate.x + plate.w, ty });
        }
        for (let i = photons.length - 1; i >= 0; i--) {
          const p = photons[i], dx = p.tx - p.x, dy = p.ty - p.y, L = Math.hypot(dx, dy), s = vPh * dt;
          if (L <= s) {
            photons.splice(i, 1);
            if (Ek > 0) {
              const E = Ek * (0.55 + 0.45 * Math.random()), sp = cE * Math.sqrt(E), ang = (Math.random() * 2 - 1) * 1.15;
              if (electrons.length < 70) electrons.push({ x: p.tx + 4, y: p.ty, vx: sp * Math.cos(ang), vy: sp * Math.sin(ang) });
            } else flashes.push({ x: p.tx + 2, y: p.ty, t: 0 });
          } else { p.x += dx / L * s; p.y += dy / L * s; }
        }
        for (let i = electrons.length - 1; i >= 0; i--) {
          const e = electrons[i]; e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.x > S.x + S.w + 6 || e.y < S.y - 6 || e.y > S.y + S.h + 6) electrons.splice(i, 1);
        }
        for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].t += dt; if (flashes[i].t > 0.35) flashes.splice(i, 1); }
      }

      function tag(ctx, s, x, y, o) {
        ctx.save(); ctx.font = FONT(o.size || 12, o.bold);
        const w = ctx.measureText(s).width + 8, h = (o.size || 12) + 6;
        const al = o.align || 'center', x0 = al === 'left' ? x - 4 : al === 'right' ? x - w + 4 : x - w / 2;
        ctx.globalAlpha = 0.9; ctx.fillStyle = o.bg; ctx.fillRect(x0, y - h / 2, w, h); ctx.restore();
        D.text(ctx, s, x, y, o);
      }

      function render() {
        const { ctx, W, H } = cv, C = kit.C;
        ctx.clearRect(0, 0, W, H);
        const { S, plate, lamp, hit } = scene(W, H), { G } = layout(W, H);
        const nm = 3000 / f, col = wl2rgb(nm), cs = `rgb(${col})`;
        const Eph = H_EV * f, Ek = Eph - Wf, f0 = Wf / H_EV;
        const metal = METALS.find(([v]) => +v === Wf)[1];

        // ---------- 장면: 빛 → 금속판 → 전자 ----------
        if (inten > 0) {
          ctx.save(); ctx.globalAlpha = 0.05 + 0.18 * inten / 100; ctx.fillStyle = cs;
          ctx.beginPath(); ctx.moveTo(lamp[0] - 5, lamp[1] - 3); ctx.lineTo(lamp[0] + 5, lamp[1] + 3);
          ctx.lineTo(plate.x + plate.w, hit[1]); ctx.lineTo(plate.x + plate.w, hit[0]); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        // 금속판
        ctx.save(); ctx.fillStyle = C.muted; ctx.globalAlpha = 0.55; ctx.fillRect(plate.x, plate.y, plate.w, plate.h); ctx.restore();
        ctx.save(); ctx.strokeStyle = C.fg; ctx.lineWidth = 1.5; ctx.strokeRect(plate.x, plate.y, plate.w, plate.h); ctx.restore();
        tag(ctx, `${metal}  W = ${Wf.toFixed(1)} eV`, plate.x - 2, plate.y + plate.h + 14, { size: 12, bold: true, color: C.fg, bg: C.bg, align: 'left' });
        // 광원
        D.circle(ctx, lamp[0], lamp[1], 9, { fill: cs, stroke: C.fg, width: 1.5 });
        tag(ctx, `빛 ${Math.round(nm)} nm (${band(nm)})`, lamp[0] - 14, lamp[1] - 12, { size: 12, bold: true, color: C.fg, bg: C.bg, align: 'right' });
        // 광자 (짧은 파동 묶음)
        const wv = 3 + nm / 700 * 5;
        ctx.save(); ctx.strokeStyle = cs; ctx.lineWidth = 2; ctx.lineCap = 'round';
        photons.forEach((p) => {
          const dx = p.tx - p.x, dy = p.ty - p.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
          ctx.beginPath();
          for (let s = -8; s <= 8; s += 1) { const a = 2.6 * Math.sin(2 * Math.PI * s / wv) * Math.cos(s / 16 * Math.PI / 1.1); const x = p.x + ux * s - uy * a, y = p.y + uy * s + ux * a; if (s === -8) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
          ctx.stroke();
        });
        ctx.restore();
        flashes.forEach((q) => { ctx.save(); ctx.globalAlpha = 1 - q.t / 0.35; D.circle(ctx, q.x, q.y, 3 + q.t * 20, { stroke: cs, width: 1.5 }); ctx.restore(); });
        // 전자
        electrons.forEach((e) => {
          const sp = Math.hypot(e.vx, e.vy) || 1;
          ctx.save(); ctx.globalAlpha = 0.35; D.line(ctx, [[e.x - e.vx / sp * 12, e.y - e.vy / sp * 12], [e.x, e.y]], C.blue, 2.5); ctx.restore();
          D.circle(ctx, e.x, e.y, 5, { fill: C.blue });
          D.line(ctx, [[e.x - 2.6, e.y], [e.x + 2.6, e.y]], C.bg, 1.6);
        });
        // 상태 문구
        const sx = S.x + S.w - 8, sy = plate.y + plate.h + 14;
        if (inten === 0) tag(ctx, '빛이 없어요 (세기 0)', sx, sy, { size: 12, bold: true, color: C.muted, bg: C.bg, align: 'right' });
        else if (Ek <= 0) tag(ctx, 'hf < W: 방출 없음', sx, sy, { size: 12, bold: true, color: C.red, bg: C.bg, align: 'right' });
        else tag(ctx, '광전자 방출!', sx, sy, { size: 12, bold: true, color: C.blue, bg: C.bg, align: 'right' });

        // ---------- 그래프: E_k,max – f ----------
        const X = (v) => G.x + v / FMAX * G.w, Y = (e) => G.y + G.h / 2 - e / EMAX * (G.h / 2);
        const y0 = Y(0);
        if (!narrow) D.line(ctx, [[S.x + S.w + 14, 14], [S.x + S.w + 14, H - 14]], C.grid, 1);
        D.arrow(ctx, G.x, y0, G.x + G.w + 8, y0, C.fg, 1.3, 7);
        D.arrow(ctx, G.x, G.y + G.h, G.x, G.y - 8, C.fg, 1.3, 7);
        D.text(ctx, '최대 운동 에너지 (eV)', G.x + 6, G.y - 14, { size: 11, color: C.muted, align: 'left' });
        D.text(ctx, 'f (×10¹⁴ Hz)', G.x + G.w + 6, y0 + 12, { size: 11, color: C.muted, align: 'right' });
        for (let v = 1; v < FMAX; v++) D.line(ctx, [[X(v), y0 - 2.5], [X(v), y0 + 2.5]], C.fg, 1);
        [5, 10].forEach((v) => D.text(ctx, String(v), X(v), y0 + 12, { size: 11, color: C.muted }));
        [-4, -2, 2, 4].forEach((e) => { D.line(ctx, [[G.x - 3, Y(e)], [G.x + 3, Y(e)]], C.fg, 1); if (Math.abs(e + Wf) > 0.6) D.text(ctx, (e < 0 ? '−' : '') + Math.abs(e), G.x - 6, Y(e), { size: 11, color: C.muted, align: 'right' }); });
        // 다른 금속 (흐리게)
        METALS.forEach(([v]) => {
          const w = +v; if (w === Wf) return;
          const a0 = w / H_EV;
          ctx.save(); ctx.globalAlpha = 0.55; D.line(ctx, [[X(a0), y0], [X(FMAX), Y(H_EV * FMAX - w)]], C.muted, 1.5); ctx.restore();
        });
        // 고른 금속
        D.line(ctx, [[X(0), Y(-Wf)], [X(f0), y0]], C.orange, 2, [5, 4]);
        D.line(ctx, [[X(f0), y0], [X(FMAX), Y(H_EV * FMAX - Wf)]], C.orange, 3);
        D.text(ctx, metal, X(FMAX) + 2, Y(H_EV * FMAX - Wf) - 11, { size: 11, bold: true, color: C.orange, align: 'right' });
        D.circle(ctx, X(0), Y(-Wf), 3.5, { fill: C.orange });
        D.text(ctx, '−W', G.x - 6, Y(-Wf), { size: 12, bold: true, color: C.orange, align: 'right' });
        D.circle(ctx, X(f0), y0, 4, { fill: C.bg, stroke: C.orange, width: 2 });
        tag(ctx, `f₀ = ${f0.toFixed(2)}`, Math.max(G.x + 34, Math.min(G.x + G.w - 34, X(f0))), y0 + 27, { size: 11, bold: true, color: C.orange, bg: C.bg });
        D.text(ctx, '기울기 = h (모든 금속 같음)', G.x + G.w, Y(-EMAX * 0.82), { size: 11, color: C.muted, align: 'right' });
        // 현재 빛
        D.line(ctx, [[X(f), G.y + 2], [X(f), G.y + G.h]], cs, 1.5, [3, 3]);
        if (Ek > 0) {
          D.line(ctx, [[X(f), Y(Ek)], [G.x, Y(Ek)]], C.orange, 1, [2, 3]);
          D.circle(ctx, X(f), Y(Ek), 9, { fill: C.bg, stroke: C.orange, width: 1 });
          D.circle(ctx, X(f), Y(Ek), 6, { fill: C.orange, stroke: C.bg, width: 1.5 });
        } else {
          D.circle(ctx, X(f), y0, 6, { fill: C.bg, stroke: C.red, width: 2.5 });
          tag(ctx, '방출 없음', Math.max(G.x + 30, Math.min(X(f), G.x + G.w - 28)), y0 - 16, { size: 11, bold: true, color: C.red, bg: C.bg });
        }

        // ---------- 수치 ----------
        oE(`${Eph.toFixed(2)} eV`);
        oK(Ek > 0 ? `${Ek.toFixed(2)} eV` : '0 (방출 없음)');
        oV(Ek > 0 ? `${Ek.toFixed(2)} V` : '—');
      }
      cv.onResize(render);
      render();
    },
  });
})();
