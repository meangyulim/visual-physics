/* 볼록 렌즈의 상: 주요 광선 3개, 실상·허상, b = af/(a−f), 배율 m = b/a */
(function () {
  'use strict';
  const FONT = (s, b) => `${b ? 700 : 500} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;

  SIM.register('lens', {
    title: '볼록 렌즈가 만드는 상',
    hint: '물체 거리 a를 바꿔 보세요(화면을 좌우로 끌어도 돼요). 초점 F와 2F를 지날 때 상이 어떻게 바뀌는지 보세요.',
    init(kit) {
      const D = kit.draw;
      const narrow = kit.root.clientWidth < 560;
      let f = 10, a = 1.5;       // f: cm, a: f 단위
      let geo = null, dirty = true, lastKey = '';

      const cv = kit.canvas({ aspect: narrow ? 0.88 : 0.55, maxH: 460 });
      const fmtA = (v) => `${v.toFixed(2)}f (${(v * f).toFixed(1)} cm)`;
      const sa = kit.slider({ label: '물체 거리 a', min: 0.3, max: 4, step: 0.05, value: a, fmt: fmtA, onInput: (v) => { a = v; dirty = true; } });
      kit.slider({ label: '초점 거리 f', min: 5, max: 20, step: 1, value: f, unit: 'cm', onInput: (v) => { f = v; sa.el.nextElementSibling.textContent = fmtA(a); dirty = true; } });
      const out = (lab) => { const r = kit.readout(lab); let last = ''; return (s) => { if (s !== last) { last = s; r.set(s); } }; };
      const oB = out('상 거리 b'), oM = out('배율 m = |b|/a'), oK = out('상의 종류');
      kit.note('주요 광선: 축에 나란히 들어온 빛 → 렌즈를 지나 뒤 초점 F를 지나요. 렌즈 중심을 지나는 빛 → 그대로 직진. 앞 초점 F를 지나온 빛 → 렌즈를 지나 축에 나란히 나가요.');
      kit.note('a > 2f: 축소된 실상 · a = 2f: 같은 크기 · f < a < 2f: 확대된 실상 · a < f: 확대된 허상(돋보기). 상의 종류와 배율은 a/f 로 정해져요.');
      kit.loop(() => { const c = kit.C, k = c.fg + c.bg; if (dirty || k !== lastKey) { lastKey = k; dirty = false; render(); } });   // 바뀔 때만 다시 그림(다크 모드 전환 포함)

      const drag = (x) => { if (!geo) return; const v = Math.round(((geo.xL - x) / geo.fp) * 20) / 20; sa.set(Math.max(0.3, Math.min(4, v))); };
      kit.pointer(cv.el, { down: drag, move: drag });
      cv.el.style.touchAction = 'pan-y';

      function tag(ctx, s, x, y, o) {
        ctx.save(); ctx.font = FONT(o.size || 12, o.bold);
        const w = ctx.measureText(s).width + 8, h = (o.size || 12) + 6;
        const al = o.align || 'center', x0 = al === 'left' ? x - 4 : al === 'right' ? x - w + 4 : x - w / 2;
        ctx.globalAlpha = 0.9; ctx.fillStyle = o.bg; ctx.fillRect(x0, y - h / 2, w, h); ctx.restore();
        D.text(ctx, s, x, y, o);
      }
      // 점 p 에서 방향 d 로 화면 끝까지
      function toEdge(p, d, W, H) {
        let t = Infinity;
        if (d[0] > 1e-9) t = Math.min(t, (W - p[0]) / d[0]); else if (d[0] < -1e-9) t = Math.min(t, -p[0] / d[0]);
        if (d[1] > 1e-9) t = Math.min(t, (H - p[1]) / d[1]); else if (d[1] < -1e-9) t = Math.min(t, -p[1] / d[1]);
        if (!isFinite(t) || t < 0) t = 0;
        return [p[0] + d[0] * t, p[1] + d[1] * t];
      }
      function vArrow(ctx, x, y0, y1, color, dash) {
        if (Math.abs(y1 - y0) < 2) return;
        if (dash) {
          const s = Math.sign(y1 - y0);
          D.line(ctx, [[x, y0], [x, y1 - s * 9]], color, 3.5, [6, 5]);
          D.arrow(ctx, x, y1 - s * 10, x, y1, color, 3.5, 11);
        } else D.arrow(ctx, x, y0, x, y1, color, 3.5, 11);
      }

      function render() {
        const { ctx, W, H } = cv, C = kit.C;
        ctx.clearRect(0, 0, W, H);
        const xL = Math.round(W * (narrow ? 0.54 : 0.5)), ya = Math.round(H / 2);
        const fp = (xL - (narrow ? 10 : 24)) / 4.25;               // f 의 길이 (px)
        const ho = Math.min(fp, H * 0.17);                         // 물체 높이 (px)
        geo = { xL, fp };
        const xo = xL - a * fp, yq = ya - ho, Q = [xo, yq];
        const none = Math.abs(a - 1) < 1e-3;                      // a = f: 상이 생기지 않음
        const b = none ? Infinity : a / (a - 1);                   // f 단위 (음수 = 허상)
        const m = none ? Infinity : -b / a;                        // 부호 있는 배율 (음수 = 도립)
        const real = !none && b > 0;
        const xi = xL + b * fp, yi = ya - m * ho;

        // 광축, 렌즈
        D.line(ctx, [[0, ya], [W, ya]], C.muted, 1.4);
        const hL = Math.min(ya, H - ya) - 8, th = (narrow ? 3 : 4) + (narrow ? 30 : 50) / f;   // 초점 거리가 짧을수록 볼록하게
        ctx.save(); ctx.beginPath(); ctx.moveTo(xL, ya - hL);
        ctx.quadraticCurveTo(xL + th * 2, ya, xL, ya + hL); ctx.quadraticCurveTo(xL - th * 2, ya, xL, ya - hL); ctx.closePath();
        ctx.globalAlpha = 0.16; ctx.fillStyle = C.blue; ctx.fill(); ctx.globalAlpha = 0.8; ctx.strokeStyle = C.blue; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        D.line(ctx, [[xL, ya - hL], [xL, ya + hL]], C.muted, 1, [2, 4]);
        // F, 2F
        [[-2, '2F'], [-1, 'F'], [1, 'F'], [2, '2F']].forEach(([k, s]) => {
          const x = xL + k * fp;
          D.circle(ctx, x, ya, 3.5, { fill: C.fg });
          D.text(ctx, s, x, ya + 14, { size: 12, bold: true, color: C.fg });
        });

        // 광선
        const ray = (pts, dash, alpha = 1) => { ctx.save(); ctx.globalAlpha = alpha; D.line(ctx, pts, C.orange, 2.2, dash); ctx.restore(); };
        const mid = (p, q) => { const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); if (L > 26) D.arrow(ctx, mx - dx / L * 6, my - dy / L * 6, mx + dx / L * 6, my + dy / L * 6, C.orange, 2.2, 9); };
        // ① 축에 나란히 → F′ 쪽으로
        const P1 = [xL, yq], d1 = [fp, ho];
        ray([Q, P1]); mid(Q, P1);
        const E1 = toEdge(P1, d1, W, H); ray([P1, E1]);
        // ② 렌즈 중심 → 직진
        const P2 = [xL, ya], d2 = [a * fp, ho];
        ray([Q, P2]); mid(Q, P2);
        const E2 = toEdge(P2, d2, W, H); ray([P2, E2]);
        // ③ 앞 초점 F 를 지나는(향하는) 빛 → 축에 나란히
        if (!none) {
          const y3 = ya + ho / (a - 1), P3 = [xL, y3];
          if (a < 1) ray([[xL - fp, ya], Q], [4, 4], 0.55);    // F 에서 오는 방향 (작도선)
          ray([Q, P3]); mid(Q, P3);
          if (y3 > -2 && y3 < H + 2) ray([P3, [W, y3]]);
          // 허상: 굴절 광선을 거꾸로 연장 (점선)
          if (!real) {
            ray([P1, [xi, yi]], [5, 5], 0.75); ray([P2, [xi, yi]], [5, 5], 0.75); ray([P3, [xi, yi]], [5, 5], 0.75);
          }
        }

        // 물체
        vArrow(ctx, xo, ya, yq, C.blue, false);
        tag(ctx, '물체', xo, ya + 31, { size: 12, bold: true, color: C.blue, bg: C.bg });
        // 상
        let note = '';
        if (none) note = '상이 생기지 않아요 (굴절한 빛이 나란해요)';
        else {
          const inX = xi > 4 && xi < W - 4, inY = yi > 2 && yi < H - 2;
          if (inX) {
            ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
            vArrow(ctx, xi, ya, Math.max(-20, Math.min(H + 20, yi)), C.green, !real);
            ctx.restore();
            const ly = inY ? (yi > ya ? yi + 14 : yi - 13) : (yi > ya ? H - 12 : 12);
            tag(ctx, real ? '실상' : '허상', xi, ly, { size: 12, bold: true, color: C.green, bg: C.bg });
            if (!inY) note = `상이 커서 화면 ${yi > ya ? '아래' : '위'}로 넘쳐요 (${Math.abs(m).toFixed(1)}배)`;
          } else note = real ? `실상이 화면 오른쪽 밖에 생겨요 (b = ${(b * f).toFixed(0)} cm)` : `허상이 화면 왼쪽 밖에 생겨요 (b = −${(-b * f).toFixed(0)} cm)`;
        }
        if (note) tag(ctx, note, W / 2, H - 13, { size: 12, bold: true, color: C.fg, bg: C.bg });

        // 수치
        if (none) { oB('∞'); oM('—'); oK('상 없음'); }
        else {
          const bc = b * f, am = Math.abs(m);
          oB(`${bc < 0 ? '−' : ''}${Math.abs(bc).toFixed(1)} cm`);
          oM(`${am.toFixed(2)}배<span style="font-size:12.5px"> ${Math.abs(am - 1) < 0.005 ? '같음' : am > 1 ? '확대' : '축소'}</span>`);
          oK(real ? '실상 · 도립' : '허상 · 정립');
        }
      }
      cv.onResize(() => { dirty = true; render(); });
      render();
    },
  });
})();
