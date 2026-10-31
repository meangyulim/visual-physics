/* 열역학 과정 — 실린더(피스톤) + P-V 그래프, 일(넓이)·내부 에너지·열의 부호와 크기 (단원자 이상 기체) */
SIM.register('pv-cycle', {
  title: '열역학 과정과 P-V 그래프',
  hint: '과정을 고르고 재생하거나 진행 막대를 움직여 보세요. 그래프 아래 넓이가 기체가 한 일 W예요.',
  init(kit) {
    const narrow = kit.root.clientWidth < 560;
    const cv = kit.canvas({ aspect: narrow ? 1.38 : 0.6, maxH: 560 });
    const D = kit.draw, MI = '−', GAM = 5 / 3;
    const PL = 4 * Math.pow(1 / 3, GAM);          // 단열 팽창 끝 압력
    // [이름, 종류, 처음 (V L, P ×10⁵ Pa), 나중, 비교 곡선 글자 자리 [V, 위(-1)/아래(+1), 정렬]]
    //  종류: p 등압, v 등적, t 등온, q 단열
    const PROC = {
      'p-exp': ['등압 팽창', 'p', [2, 2], [6, 2]], 'p-com': ['등압 압축', 'p', [6, 2], [2, 2]],
      'v-heat': ['등적 가열', 'v', [3, 1], [3, 4]], 'v-cool': ['등적 냉각', 'v', [3, 4], [3, 1]],
      't-exp': ['등온 팽창', 't', [2, 4], [6, 4 / 3], [7, 0, 'right']], 't-com': ['등온 압축', 't', [6, 4 / 3], [2, 4], [2.85, 0, 'left']],
      'q-exp': ['단열 팽창', 'q', [2, 4], [6, PL], [5.2, -1, 'center']], 'q-com': ['단열 압축', 'q', [6, PL], [2, 4], [2.4, 1, 'center']],
    };
    const sg = (v) => { const s = Math.abs(v).toFixed(0); return +s === 0 ? '0' : (v > 0 ? '+' : MI) + s; };
    let key = 'p-exp', s = 0, hold = 0, running = true, syncing = false;
    const pr = () => PROC[key];
    // 진행 정도 u(0~1)에서의 상태. PV 단위 100 J, T = 50·PV (K)
    function state(p, u) {
      const [, kind, [Va, Pa], [Vb, Pb]] = p;
      let V, P, W;
      if (kind === 'v') { V = Va; P = Pa + u * (Pb - Pa); W = 0; }
      else {
        V = Va + u * (Vb - Va);
        if (kind === 'p') { P = Pa; W = Pa * (V - Va); }
        else if (kind === 't') { P = Pa * Va / V; W = Pa * Va * Math.log(V / Va); }
        else { P = Pa * Math.pow(Va / V, GAM); W = (Pa * Va - P * V) / (GAM - 1); }
      }
      const dU = 1.5 * (P * V - Pa * Va);
      return { V, P, W: W * 100, dU: kind === 't' ? 0 : dU * 100, Q: (kind === 'q' ? 0 : (W + (kind === 't' ? 0 : dU)) * 100), T: 50 * P * V };
    }

    kit.select({
      label: '과정', value: key,
      options: Object.keys(PROC).map((k) => [k, PROC[k][0]]),
      onChange: (v) => { key = v; s = 0; hold = 0; running = true; btn.textContent = '⏸ 정지'; sync(); },
    });
    const sp = kit.slider({ label: '진행', min: 0, max: 100, step: 1, value: 0, fmt: (v) => v + ' %', onInput: (v) => { if (syncing) return; s = v / 100; running = false; btn.textContent = '▶ 재생'; } });
    const rW = kit.readout('기체가 한 일 W'), rU = kit.readout('내부 에너지 ΔU'), rQ = kit.readout('기체가 받은 열 Q');
    const btn = kit.button('⏸ 정지', () => { running = !running; if (running && s >= 1) { s = 0; hold = 0; } btn.textContent = running ? '⏸ 정지' : '▶ 재생'; });
    kit.button('↺ 처음부터', () => { s = 0; hold = 0; running = true; btn.textContent = '⏸ 정지'; sync(); });
    kit.note('열역학 제1법칙: <b>Q = ΔU + W</b>. 부피가 늘면 W > 0(기체가 일을 함), 줄면 W < 0. 내부 에너지 변화 ΔU는 온도 변화에 비례해요(단원자 이상 기체). 회색 점선은 처음·나중 온도의 등온선이에요.');
    kit.note('등온·단열 과정에서는 보라 점선과 비교해 보세요: <b>단열선이 등온선보다 가파릅니다.</b> 단열 팽창에서는 열을 받지 않고 일을 하므로 내부 에너지가 줄어 온도까지 내려가기 때문이에요.');
    function sync() { syncing = true; sp.set(Math.round(s * 100)); syncing = false; }

    // 기체 입자 (속력 ∝ √T)
    const parts = [];
    for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2; parts.push({ u: Math.random(), w: Math.random(), dx: Math.cos(a), dy: Math.sin(a) }); }
    let gasBox = { w: 80, h: 80 };
    const loop = kit.loop((dt) => {
      if (running && dt > 0) {
        if (s < 1) s = Math.min(1, s + dt / 3.4); else { hold += dt; if (hold > 1.4) { s = 0; hold = 0; } }
        sync();
      }
      const st = state(pr(), s), spd = 70 * Math.sqrt(st.T / 400);
      parts.forEach((q) => {
        q.u += q.dx * spd * dt / gasBox.w; q.w += q.dy * spd * dt / gasBox.h;
        if (q.u < 0) { q.u = -q.u; q.dx = -q.dx; } if (q.u > 1) { q.u = 2 - q.u; q.dx = -q.dx; }
        if (q.w < 0) { q.w = -q.w; q.dy = -q.dy; } if (q.w > 1) { q.w = 2 - q.w; q.dy = -q.dy; }
      });
      render();
    });

    function layout(W, H) {
      if (narrow) return {
        cr: { x: 4, y: 0, w: W * 0.47, h: 222 },
        eb: { x: W * 0.52, y: 6, w: W * 0.48 - 8, h: 212 },
        gr: { x: 40, y: 262, w: W - 76, h: H - 262 - 30 },
      };
      return {
        cr: { x: 4, y: 0, w: W * 0.24, h: H },
        gr: { x: W * 0.24 + 52, y: 40, w: W * 0.46 - 70, h: H - 76 },
        eb: { x: W * 0.72, y: 10, w: W * 0.28 - 12, h: H - 20 },
      };
    }

    function render() {
      const { ctx, W, H } = cv, C = kit.C;
      ctx.clearRect(0, 0, W, H);
      const L = layout(W, H), p = pr(), st = state(p, s), fin = state(p, 1);
      drawCylinder(ctx, L.cr, C, p, st, fin);
      drawGraph(ctx, L.gr, C, p, st);
      drawBars(ctx, L.eb, C, st, fin);
      rW.set(sg(st.W) + ' J'); rU.set(sg(st.dU) + ' J'); rQ.set(sg(st.Q) + ' J');
    }

    function drawCylinder(ctx, r, C, p, st, fin) {
      const kind = p[1];
      const cw = Math.min(r.w * 0.6, 104), cx = r.x + r.w * 0.5, left = cx - cw / 2, right = cx + cw / 2;
      const top = r.y + 30, bottom = r.y + r.h - 50, hU = bottom - top - 16;
      const py = bottom - st.V / 7 * hU;            // 피스톤 아랫면
      D.text(ctx, `${p[0]}`, r.x + 4, r.y + 12, { size: 13, bold: true, align: 'left', color: C.fg });
      D.text(ctx, `T = ${st.T.toFixed(0)} K${kind === 't' ? ' 일정' : ''}`, r.x + r.w - 2, r.y + 12, { size: 12, bold: true, align: 'right', color: C.red });
      // 기체 (온도에 따라 파랑→빨강)
      const f = Math.max(0, Math.min(1, (st.T - 150) / 450));
      ctx.save(); ctx.fillStyle = C.blue; ctx.globalAlpha = 0.2 * (1 - f); ctx.fillRect(left, py, cw, bottom - py);
      ctx.fillStyle = C.red; ctx.globalAlpha = 0.24 * f; ctx.fillRect(left, py, cw, bottom - py); ctx.restore();
      gasBox = { w: cw - 8, h: Math.max(10, bottom - py - 8) };
      parts.forEach((q) => D.circle(ctx, left + 4 + q.u * gasBox.w, py + 4 + q.w * gasBox.h, 2.4, { fill: C.fg }));
      // 벽
      if (kind === 'q') {   // 단열 벽: 빗금
        ctx.save(); ctx.fillStyle = C.muted; ctx.globalAlpha = 0.25;
        ctx.fillRect(left - 9, top - 4, 9, bottom - top + 13); ctx.fillRect(right, top - 4, 9, bottom - top + 13); ctx.fillRect(left - 9, bottom, cw + 18, 9);
        ctx.restore();
        ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
        for (let y = top; y < bottom + 4; y += 7) { [left - 9, right].forEach((x0) => { ctx.beginPath(); ctx.moveTo(x0, y + 7); ctx.lineTo(x0 + 9, y); ctx.stroke(); }); }
        ctx.restore();
      }
      ctx.strokeStyle = C.fg; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(left, top - 4); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, top - 4); ctx.stroke();
      // 피스톤과 막대
      ctx.save(); ctx.fillStyle = C.muted; ctx.globalAlpha = 0.55; ctx.fillRect(left + 2, py - 12, cw - 4, 12); ctx.restore();
      ctx.strokeStyle = C.fg; ctx.lineWidth = 1.5; ctx.strokeRect(left + 2, py - 12, cw - 4, 12);
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, py - 12); ctx.lineTo(cx, Math.max(r.y + 22, py - 12 - 34)); ctx.stroke();
      // 일의 방향
      if (kind === 'v') {   // 피스톤 고정
        ctx.fillStyle = C.fg; ctx.fillRect(left - 7, py - 20, 9, 6); ctx.fillRect(right - 2, py - 20, 9, 6);
        D.text(ctx, '고정', left - 10, py - 17, { size: 11, bold: true, color: C.muted, align: 'right' });
      } else {
        const up = p[3][0] > p[2][0], ax = cx + 14, ay = py - 20;
        D.arrow(ctx, ax, up ? ay : ay - 26, ax, up ? ay - 26 : ay, C.orange, 3, 8);
        D.text(ctx, 'W', ax + 8, ay - 13, { size: 12.5, bold: true, color: C.orange, align: 'left' });
      }
      // 열의 출입 (과정 전체의 부호)
      const hy = bottom + (kind === 'q' ? 12 : 6);
      if (kind === 'q') D.text(ctx, '단열: 열 출입 없음', cx, hy + 22, { size: 11.5, bold: true, color: C.muted });
      else {
        const inQ = fin.Q > 0, y0 = hy + 30, y1 = hy + 2;
        D.arrow(ctx, cx - 20, inQ ? y0 : y1, cx - 20, inQ ? y1 : y0, C.red, 3, 8);
        D.text(ctx, inQ ? 'Q 흡수' : 'Q 방출', cx - 10, (y0 + y1) / 2, { size: 12, bold: true, color: C.red, align: 'left' });
      }
    }

    function drawGraph(ctx, r, C, p, st) {
      const kind = p[1], [Va, Pa] = p[2], [Vb, Pb] = p[3];
      const VM = 7, PM = 5, X = (V) => r.x + V / VM * r.w, Y = (P) => r.y + r.h - P / PM * r.h;
      ctx.lineWidth = 1;
      for (let v = 1; v <= VM; v++) { ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(X(v), r.y); ctx.lineTo(X(v), Y(0)); ctx.stroke(); if (v < VM) D.text(ctx, String(v), X(v), Y(0) + 13, { size: 11, color: C.muted }); }
      for (let q = 1; q <= PM; q++) { ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(r.x, Y(q)); ctx.lineTo(r.x + r.w, Y(q)); ctx.stroke(); D.text(ctx, String(q), r.x - 7, Y(q), { size: 11, color: C.muted, align: 'right' }); }
      D.arrow(ctx, r.x, Y(0), r.x + r.w + 12, Y(0), C.fg, 1.4, 7);
      D.arrow(ctx, r.x, Y(0), r.x, r.y - 12, C.fg, 1.4, 7);
      D.text(ctx, 'V (L)', r.x + r.w + 14, Y(0) + 13, { size: 11.5, color: C.muted, align: 'right' });
      D.text(ctx, 'P (×10⁵ Pa)', r.x + 6, r.y - 14, { size: 11.5, color: C.muted, align: 'left' });
      D.text(ctx, `P = ${st.P.toFixed(2)}, V = ${st.V.toFixed(2)}`, r.x + r.w + 14, r.y - 14, { size: 11.5, bold: true, color: C.blue, align: 'right' });
      const curve = (fn, v0 = 0.6, v1 = VM) => { const pts = []; for (let v = v0; v <= v1 + 1e-9; v += 0.05) pts.push([X(v), Y(fn(v))]); return pts; };
      const path = (u1) => { const pts = []; for (let i = 0; i <= 60; i++) { const q = state(p, u1 * i / 60); pts.push([X(q.V), Y(q.P)]); } return pts; };
      ctx.save(); ctx.beginPath(); ctx.rect(r.x + 1, r.y - 6, r.w + 6, Y(0) - r.y + 6); ctx.clip();
      // 온도 기준 등온선 / 비교 곡선
      const isoA = (v) => Pa * Va / v, adiA = (v) => Pa * Math.pow(Va / v, GAM);
      const refs = [], labs = [];
      if (kind === 'p' || kind === 'v') {
        [[Va, Pa], [Vb, Pb]].forEach(([v, q]) => {   // 처음·나중 온도의 등온선
          const fn = (x) => v * q / x; refs.push(fn);
          D.line(ctx, curve(fn), C.muted, 1.2, [3, 4]);
          labs.push([`${(50 * v * q).toFixed(0)} K`, X(7) - 2, Y(fn(6.85)) + 11, { size: 11, color: C.muted, align: 'right' }]);
        });
      } else {                                        // 같은 처음 점을 지나는 비교 곡선
        const cmp = kind === 't' ? adiA : isoA, [vl, dir, al] = p[4]; refs.push(cmp);
        D.line(ctx, curve(cmp), C.purple, 2, [6, 4]);
        const yl = dir === 0 ? Y(4.75) : Y(cmp(vl)) + dir * 14;
        labs.push([kind === 't' ? '단열선 (더 가파름)' : '등온선', X(vl) + (al === 'left' ? 8 : 0), yl, { size: 11.5, bold: true, color: C.purple, align: al }]);
      }
      // 일 = 그래프 아래 넓이
      if (kind !== 'v' && s > 0) {
        const pts = path(s);
        ctx.save(); ctx.beginPath(); ctx.moveTo(X(Va), Y(0)); pts.forEach((q) => ctx.lineTo(q[0], q[1])); ctx.lineTo(X(st.V), Y(0)); ctx.closePath();
        ctx.fillStyle = C.orange; ctx.globalAlpha = 0.26; ctx.fill(); ctx.restore();
        if (Math.abs(st.V - Va) > 0.7) {            // 점선 곡선에서 가장 먼 높이에 글자
          const mid = state(p, s / 2);
          let best = 0.5, bd = -1;
          [0.3, 0.42, 0.55, 0.68, 0.8].forEach((f) => {
            const pp = mid.P * f; if (pp < 0.38) return;
            const d = Math.min(...refs.map((fn) => Math.abs(fn(mid.V) - pp)));
            if (d > bd) { bd = d; best = f; }
          });
          labs.push([st.W >= 0 ? 'W > 0' : 'W < 0', X(mid.V), Y(mid.P * best), { size: 12.5, bold: true, color: C.orange }]);
        }
      }
      // 과정 경로
      D.line(ctx, path(1), C.muted, 1.6, [5, 4]);
      D.line(ctx, path(s), C.blue, 3.2);
      ctx.restore();
      labs.forEach(([tx, x, y, o]) => D.text(ctx, tx, x, y, o));
      const q1 = state(p, 0.44), q2 = state(p, 0.56);
      D.arrow(ctx, X(q1.V), Y(q1.P), X(q2.V), Y(q2.P), C.blue, 0.1, 11);
      if (kind === 'v') D.text(ctx, '넓이 0 → W = 0', X(Va) + 10, Y((Pa + Pb) / 2), { size: 11.5, bold: true, color: C.orange, align: 'left' });
      D.circle(ctx, X(Va), Y(Pa), 5, { fill: C.card, stroke: C.blue, width: 2 });
      D.text(ctx, '처음', X(Va) + (Vb >= Va && kind !== 'v' ? -6 : 8), Y(Pa) + (kind === 'v' ? 0 : -12), { size: 11, bold: true, color: C.muted, align: Vb >= Va && kind !== 'v' ? 'right' : 'left' });
      D.circle(ctx, X(st.V), Y(st.P), 6, { fill: C.blue });
    }

    function drawBars(ctx, r, C, st, fin) {
      D.text(ctx, 'Q = ΔU + W', r.x, r.y + 8, { size: 13, bold: true, align: 'left', color: C.fg });
      D.text(ctx, '(J)', r.x + r.w, r.y + 8, { size: 11, color: C.muted, align: 'right' });
      const py0 = r.y + 70, py1 = r.y + r.h - 8, mid = (py0 + py1) / 2, EM = 2200;
      const Y = (e) => mid - e / EM * (py1 - py0) / 2;
      const items = [['Q', '열', st.Q, fin.Q, C.red], ['ΔU', '내부 에너지', st.dU, fin.dU, C.green], ['W', '일', st.W, fin.W, C.orange]];
      const slot = r.w / 3, bw = Math.min(slot * 0.5, 40);
      items.forEach(([nm, sub, e, ef, col], i) => {
        const x = r.x + slot * i + (slot - bw) / 2;
        D.text(ctx, nm, x + bw / 2, r.y + 32, { size: 13, bold: true, color: col });
        D.text(ctx, sub, x + bw / 2, r.y + 48, { size: 11, color: C.muted });
        // 점선 상자 = 과정이 끝났을 때 값
        if (Math.abs(ef) > 1) { ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.strokeRect(x, Math.min(mid, Y(ef)), bw, Math.abs(Y(ef) - mid)); ctx.restore(); }
        ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = col; ctx.fillRect(x, Math.min(mid, Y(e)), bw, Math.max(1.5, Math.abs(Y(e) - mid))); ctx.restore();
        const ye = Y(ef);
        D.text(ctx, sg(e), x + bw / 2, ef >= 0 ? Math.min(ye, mid) - 9 : Math.max(ye, mid) + 10, { size: 11, bold: true, color: col });
      });
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r.x, mid); ctx.lineTo(r.x + r.w, mid); ctx.stroke();
      D.text(ctx, '0', r.x - 4, mid, { size: 11, color: C.muted, align: 'right' });
    }

    cv.onResize(render);
    render();
  },
});
