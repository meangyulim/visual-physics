/* 빛의 굴절과 전반사: n₁sinθ₁ = n₂sinθ₂, 임계각, 속력 비 */
(function () {
  'use strict';
  const MEDIA = [['1.00', '공기'], ['1.33', '물'], ['1.50', '유리'], ['2.42', '다이아몬드']];
  const NAME = Object.fromEntries(MEDIA);
  const RAD = Math.PI / 180;
  const FONT = (s, b) => `${b ? 700 : 500} ${s}px Pretendard, 'Noto Sans KR', system-ui, sans-serif`;

  SIM.register('snell', {
    title: '빛의 굴절과 전반사',
    hint: '두 매질과 입사각을 바꿔 보세요. 굴절률이 큰 쪽에서 작은 쪽으로 갈 때 입사각을 키우면 전반사가 일어나요.',
    init(kit) {
      const D = kit.draw;
      const narrow = kit.root.clientWidth < 560;
      let n1 = 1.0, n2 = 1.5, th = 40, phase = 0, geo = null;

      const cv = kit.canvas({ aspect: narrow ? 0.98 : 0.58, maxH: 470 });
      const opts = MEDIA.map(([v, t]) => [v, `${t} (n = ${v})`]);
      const s1 = kit.select({ label: '위 매질 (빛이 오는 쪽)', options: opts, value: '1.00', onChange: (v) => { n1 = +v; } });
      const s2 = kit.select({ label: '아래 매질', options: opts, value: '1.50', onChange: (v) => { n2 = +v; } });
      const sth = kit.slider({ label: '입사각 θ₁', min: 0, max: 89, step: 1, value: th, unit: '°', onInput: (v) => { th = v; } });
      const out = (lab) => { const r = kit.readout(lab); let last = ''; return (s) => { if (s !== last) { last = s; r.set(s); } }; };
      const o2 = out('굴절각 θ₂'), oC = out('임계각 θ<sub>c</sub>'), oV = out('속력 비 v₂/v₁');
      const loop = kit.loop((dt) => { phase += dt; render(); });
      kit.playButton(loop);
      kit.button('↕ 위·아래 매질 바꾸기', () => { const a = s1.get(), b = s2.get(); s1.set(b); s2.set(a); });
      kit.note('굴절률 n이 클수록 빛이 느려요(v = c/n). 느린 매질로 들어가면 법선 쪽으로 꺾여요. 광선 위의 짧은 눈금은 파면이에요 — 느린 매질에서 간격(파장)이 짧아져요.');
      kit.note('굴절률이 큰 매질 → 작은 매질로 갈 때 입사각이 임계각보다 크면 굴절 광선이 사라지고 모두 반사돼요(전반사, 광섬유의 원리).');

      // 화면을 끌어 입사각 정하기 (위쪽 매질에서)
      const drag = (x, y) => {
        if (!geo || y > geo.oy - 4) return;
        const a = Math.atan2(Math.abs(x - geo.ox), geo.oy - y) / RAD;
        sth.set(Math.max(0, Math.min(89, Math.round(a))));
      };
      kit.pointer(cv.el, { down: drag, move: drag });
      cv.el.style.touchAction = 'pan-y';

      // 반사율(편광 안 된 빛의 평균) — 광선 밝기에만 사용
      function fresnel(c1, c2, ci) {
        const st = c1 / c2 * Math.sqrt(1 - ci * ci);
        if (st >= 1) return 1;
        const ct = Math.sqrt(1 - st * st);
        const rs = (c1 * ci - c2 * ct) / (c1 * ci + c2 * ct), rp = (c2 * ci - c1 * ct) / (c2 * ci + c1 * ct);
        return (rs * rs + rp * rp) / 2;
      }
      function tag(ctx, s, x, y, o) {
        ctx.save(); ctx.font = FONT(o.size || 12, o.bold);
        const w = ctx.measureText(s).width + 8, h = (o.size || 12) + 6;
        const al = o.align || 'center', x0 = al === 'left' ? x - 4 : al === 'right' ? x - w + 4 : x - w / 2;
        ctx.globalAlpha = 0.88; ctx.fillStyle = o.bg; ctx.fillRect(x0, y - h / 2, w, h); ctx.restore();
        D.text(ctx, s, x, y, o);
      }
      const textW = (ctx, s, size, b) => { ctx.save(); ctx.font = FONT(size, b); const w = ctx.measureText(s).width; ctx.restore(); return w; };

      function render() {
        const { ctx, W, H } = cv, C = kit.C;
        ctx.clearRect(0, 0, W, H);
        const ox = W / 2, oy = H / 2;
        geo = { ox, oy };
        const Lr = Math.min(W / 2 - 18, H / 2 - 30);
        const t1 = th * RAD, sn2 = n1 / n2 * Math.sin(t1);
        const tir = sn2 > 1 + 1e-9;
        const t2 = tir ? null : Math.asin(Math.min(1, sn2));
        const crit = n1 > n2 ? Math.asin(n2 / n1) : null;

        // 매질 (굴절률이 클수록 진하게)
        const tint = (n) => Math.min(0.32, (n - 1) * 0.22);
        ctx.save(); ctx.fillStyle = C.blue;
        ctx.globalAlpha = tint(n1); ctx.fillRect(0, 0, W, oy);
        ctx.globalAlpha = tint(n2); ctx.fillRect(0, oy, W, H - oy);
        ctx.restore();
        D.line(ctx, [[0, oy], [W, oy]], C.muted, 1.5);
        // 법선
        D.line(ctx, [[ox, oy - Lr - 6], [ox, oy + Lr + 6]], C.muted, 1.2, [5, 5]);
        D.text(ctx, '법선', ox + 5, oy + Lr + 2, { size: 11, color: C.muted, align: 'left' });

        // 글자: 매질 이름
        D.text(ctx, `${NAME[n1.toFixed(2)]} · n₁ = ${n1.toFixed(2)}`, 10, 13, { size: 12, bold: true, color: C.fg, align: 'left' });
        D.text(ctx, `${NAME[n2.toFixed(2)]} · n₂ = ${n2.toFixed(2)}`, 10, H - 12, { size: 12, bold: true, color: C.fg, align: 'left' });

        // 광선 방향 단위벡터 (화면 좌표: 아래가 +y)
        const uin = [Math.sin(t1), Math.cos(t1)];            // 입사 광선 진행 방향 (O를 향함)
        const P = [ox - uin[0] * Lr, oy - uin[1] * Lr];       // 광원 쪽 끝
        const ure = [Math.sin(t1), -Math.cos(t1)];           // 반사
        const urf = tir ? null : [Math.sin(t2), Math.cos(t2)]; // 굴절
        const R = n1 === n2 ? 0 : fresnel(n1, n2, Math.cos(t1));
        const aRe = R > 0 ? 0.3 + 0.7 * Math.sqrt(R) : 0;
        const aRf = tir ? 0 : 0.35 + 0.65 * Math.sqrt(1 - R);

        // 임계각 표시 (입사 쪽)
        if (crit !== null) {
          const ce = [ox - Math.sin(crit) * Lr * 0.8, oy - Math.cos(crit) * Lr * 0.8];
          D.line(ctx, [[ox, oy], ce], C.red, 1.6, [6, 4]);
          // 글자는 입사 광선과 반대쪽에 (입사각이 더 크면 법선 쪽, 작으면 바깥쪽)
          const txt = `임계각 ${(crit / RAD).toFixed(1)}°`, w = textW(ctx, txt, 11, true);
          const side = t1 >= crit ? 1 : -1;               // +1: 법선 쪽으로
          const nx = Math.cos(crit) * side, ny = -Math.sin(crit) * side;   // 임계각 선에 수직
          let lx = ce[0] + nx * (w / 2 + 8) - Math.sin(crit) * 4, ly = ce[1] + ny * 12 - Math.cos(crit) * 4;
          lx = Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, lx)); ly = Math.max(30, ly);
          tag(ctx, txt, lx, ly, { size: 11, color: C.red, bg: C.bg, bold: true });
        }

        // 광선 그리기 (+ 파면 눈금)
        const lam0 = Math.max(16, Lr / 6.5), cvis = lam0 * 1.5;
        const ray = (a, u, len, alpha, nn, s0) => {
          // a: 시작점, u: 방향, len: 길이, nn: 굴절률, s0: 시작점까지의 광학 경로
          if (alpha <= 0) return;
          ctx.save(); ctx.globalAlpha = alpha;
          D.line(ctx, [a, [a[0] + u[0] * len, a[1] + u[1] * len]], C.orange, 3.2);
          // 가운데 화살촉
          const m = len * 0.55, hx = a[0] + u[0] * m, hy = a[1] + u[1] * m;
          D.arrow(ctx, hx - u[0] * 10, hy - u[1] * 10, hx + u[0] * 4, hy + u[1] * 4, C.orange, 3.2, 11);
          // 파면: 광학 경로 (s0 + n s − c t) 가 λ0 의 정수배인 곳
          ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.globalAlpha = alpha * 0.85;
          const px = -u[1], py = u[0], hl = 6;
          const start = Math.ceil((s0 - cvis * phase) / lam0);
          ctx.beginPath();
          for (let q = start; ; q++) {
            const s = (q * lam0 + cvis * phase - s0) / nn;
            if (s > len - 4) break;
            if (s < 4) continue;
            const x = a[0] + u[0] * s, y = a[1] + u[1] * s;
            ctx.moveTo(x - px * hl, y - py * hl); ctx.lineTo(x + px * hl, y + py * hl);
          }
          ctx.stroke(); ctx.restore();
        };
        ray(P, uin, Lr, 1, n1, 0);
        ray([ox, oy], ure, Lr, aRe, n1, n1 * Lr);
        if (!tir) ray([ox, oy], urf, Lr, aRf, n2, n1 * Lr);
        // 광원(레이저)
        ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(Math.atan2(uin[1], uin[0]));
        ctx.fillStyle = C.fg; ctx.fillRect(-14, -5, 16, 10); ctx.fillStyle = C.orange; ctx.fillRect(1, -3, 3, 6);
        ctx.restore();
        D.circle(ctx, ox, oy, 3.5, { fill: C.fg });

        // 각도 호
        const ra = narrow ? 30 : 40;
        const arc = (a0, a1, r, color) => { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(ox, oy, r, a0, a1); ctx.stroke(); ctx.restore(); };
        const up = -Math.PI / 2, dn = Math.PI / 2;
        // 각 기호: 쐐기 안에 들어가면 안에, 좁으면 광선 바깥쪽에
        const lab = (mid, half, s, color, side) => {
          const w = textW(ctx, s, 13, true);
          let r = Math.max(ra + 13, (w / 2 + 5) / Math.max(0.01, Math.sin(half))), ang = mid;
          if (r > ra + 40) { r = ra + 16; ang = mid + side * (half + (w / 2 + 7) / r); }
          tag(ctx, s, ox + Math.cos(ang) * r, oy + Math.sin(ang) * r, { size: 13, bold: true, color, bg: C.bg });
        };
        if (th > 0.5) {
          arc(up - t1, up, ra, C.fg);
          lab(up - t1 / 2, t1 / 2, 'θ₁', C.fg, -1);
          if (aRe > 0) { arc(up, up + t1, ra - 6, C.muted); lab(up + t1 / 2, t1 / 2, 'θ₁', C.muted, 1); }
          if (!tir && t2 > 0.005) { arc(dn - t2, dn, ra, C.fg); lab(dn - t2 / 2, t2 / 2, 'θ₂', C.fg, -1); }
        }
        if (tir) {
          tag(ctx, '전반사 — 굴절 광선 없음', ox + (narrow ? 0 : 20), oy + 40, { size: 13, bold: true, color: C.red, bg: C.bg, align: narrow ? 'center' : 'left' });
        }

        // 위 오른쪽: 굴절 법칙 확인
        let law;
        if (tir) law = `sin θ₂ = ${(n1 * Math.sin(t1)).toFixed(2)} ÷ ${n2.toFixed(2)} = ${sn2.toFixed(2)} > 1`;
        else law = `${n1.toFixed(2)}×sin${th}° = ${n2.toFixed(2)}×sin${(t2 / RAD).toFixed(1)}°`;
        const lw = textW(ctx, law, 12, false), nw = textW(ctx, `${NAME[n1.toFixed(2)]} · n₁ = ${n1.toFixed(2)}`, 12, true);
        if (lw + nw + 34 <= W) {
          D.text(ctx, law, W - 10, 13, { size: 12, color: tir ? C.red : C.muted, align: 'right' });
        } else {
          D.text(ctx, law, W - 10, 31, { size: 11, color: tir ? C.red : C.muted, align: 'right' });
        }
        if (!narrow) D.text(ctx, 'n₁ sin θ₁ = n₂ sin θ₂', W - 10, H - 12, { size: 12, bold: true, color: C.muted, align: 'right' });

        // 수치
        o2(tir ? '없음 (전반사)' : `${(t2 / RAD).toFixed(1)}°`);
        oC(crit !== null ? `${(crit / RAD).toFixed(1)}°` : '없음');
        const vr = n1 / n2;
        oV(`${vr.toFixed(2)}배`);
      }
      cv.onResize(render);
      render();
    },
  });
})();
