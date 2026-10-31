/* 그림으로 이해하는 고등 물리 — 화면 동작 (탭·목차·그림 확대·풀이 펼치기·퀴즈·진도·검색·테마) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가(사생활 모드 등) */ } },
  };
  const PKEY = 'vp-progress-v1';
  const prog = store.get(PKEY, {});
  const saveProg = () => store.set(PKEY, prog);
  const unitProg = (code) => (prog[code] = prog[code] || { c: {}, o: {} });

  /* ── 테마 ── */
  const curTheme = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function nudgeSims() { // 시뮬 캔버스 다시 그리기(색 갱신)
    $$('.sim-body').forEach((el) => { el.style.paddingRight = '1px'; requestAnimationFrame(() => { el.style.paddingRight = ''; }); });
  }
  $$('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
    const n = curTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem('vp-theme', n); } catch (e) { /* */ }
    nudgeSims();
  }));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', nudgeSims);

  /* ── 서랍 목차 ── */
  const drawer = $('#drawer'), scrim = $('.scrim');
  const wide = () => matchMedia('(min-width: 1024px)').matches;
  function openDrawer() { if (!drawer) return; drawer.classList.add('open'); if (scrim) scrim.hidden = false; }
  function closeDrawer() { if (!drawer) return; drawer.classList.remove('open'); if (scrim) scrim.hidden = true; }
  $$('[data-drawer-open]').forEach((b) => b.addEventListener('click', openDrawer));
  $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', closeDrawer));
  if (drawer) drawer.addEventListener('click', (e) => { if (e.target.closest('a') && !wide()) closeDrawer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  // 넓은 화면에서는 '단원 흐름'을 펼쳐 둔다(폰·태블릿은 접어서 본문이 바로 보이게)
  if (wide()) $$('details[data-open-wide]').forEach((d) => { d.open = true; });

  /* ── 탭 ── */
  const tabs = $$('.tabs [data-tab]');
  const panels = $$('[data-panel]');
  function showTab(name, opts = {}) {
    if (!panels.length) return;
    if (!panels.some((p) => p.dataset.panel === name)) name = 'concept';
    panels.forEach((p) => { p.hidden = p.dataset.panel !== name; });
    tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === name ? 'true' : 'false'));
    if (opts.hash) history.replaceState(null, '', '#' + name);
    if (opts.scroll) {
      const bar = $('.tabs');
      const top = bar.getBoundingClientRect().top + window.scrollY - 56;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'auto' });
    }
  }
  tabs.forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab, { hash: true, scroll: true })));
  $$('[data-tab-link]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); showTab(a.dataset.tabLink, { hash: true, scroll: true });
  }));
  // 다른 탭에서 개념 절로 가는 링크
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#s-"]');
    if (!a || !panels.length) return;
    showTab('concept');
  });
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!panels.length || !h) return;
    if (/^s-\d+$/.test(h)) { showTab('concept'); const el = document.getElementById(h); if (el) requestAnimationFrame(() => el.scrollIntoView()); return; }
    if (/^lab-\d+$/.test(h)) { showTab('lab'); const el = document.getElementById(h); if (el) requestAnimationFrame(() => el.scrollIntoView()); return; }
    if (/^chal-\d+$/.test(h)) { showTab('practice'); const el = document.getElementById(h); if (el) requestAnimationFrame(() => el.scrollIntoView()); return; }
    if (['concept', 'lab', 'practice', 'exam'].includes(h)) showTab(h);
  }
  window.addEventListener('hashchange', route);
  route();

  /* ── 지금 보는 절 표시 ── */
  const secs = $$('.sec[id^="s-"]');
  if (secs.length && 'IntersectionObserver' in window) {
    const links = $$('[data-sec-link]');
    const chipBox = $('.toc-chips');
    let cur = null;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        const n = en.target.dataset.sec;
        if (n === cur) return; cur = n;
        links.forEach((l) => l.classList.toggle('on', l.dataset.secLink === n));
        const chip = chipBox && chipBox.querySelector(`[data-sec-link="${n}"]`);
        if (chip && chipBox.scrollWidth > chipBox.clientWidth) {
          const pad = parseFloat(getComputedStyle(chipBox).paddingLeft) || 16;
          const left = chip.getBoundingClientRect().left - chipBox.getBoundingClientRect().left + chipBox.scrollLeft - pad;
          chipBox.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  /* ── 그림 확대 ── */
  const lb = $('#lightbox');
  if (lb) {
    const img = $('img', lb), cap = $('.lb-cap', lb), stage = $('.lb-stage', lb), tip = $('.lb-tip', lb);
    const tip0 = tip ? tip.textContent : '';
    let scale = 1, opened = false;
    const apply = () => {
      stage.classList.toggle('zoom', scale > 1);
      img.style.width = scale > 1 ? (scale * Math.min(stage.clientWidth - 20, img.naturalWidth || 1200)) + 'px' : '';
    };
    // 폰처럼 좁은 화면에서 옆으로 긴 그림은 글자가 읽히도록 처음부터 키워서 연다(− 버튼·두 번 탭으로 전체 보기)
    const autoFit = () => {
      const nw = img.naturalWidth, nh = img.naturalHeight;
      if (!opened || !nw || !nh) return;
      const fw = Math.min(stage.clientWidth - 20, nw), fh = fw * nh / nw;
      if (nw / nh < 1.7 || fw / nw >= 0.45) return;
      const s = Math.min(3, 0.62 * nw / fw, ((stage.clientHeight - 20) * 0.92) / fh);
      if (s < 1.15) return;
      scale = s; apply(); stage.scrollLeft = 0;
      if (tip) tip.textContent = '옆으로 밀어서 보세요 · 두 번 탭하면 전체가 보여요';
    };
    const open = (src, text) => {
      img.src = src; cap.textContent = text || ''; scale = 1; apply();
      if (tip) tip.textContent = tip0;
      lb.hidden = false; document.body.classList.add('lb-open'); opened = true;
      history.pushState({ lb: 1 }, '');
      $('[data-lb-close]', lb).focus({ preventScroll: true });
      if (img.complete && img.naturalWidth) autoFit(); else img.addEventListener('load', autoFit, { once: true });
    };
    const close = (fromPop) => {
      if (!opened) return;
      opened = false; lb.hidden = true; document.body.classList.remove('lb-open'); img.removeAttribute('src');
      if (!fromPop && history.state && history.state.lb) history.back();
    };
    document.addEventListener('click', (e) => {
      const b = e.target.closest('.fig-btn');
      if (!b) return;
      const fig = b.closest('figure');
      const fc = fig && fig.querySelector('figcaption');
      open(b.querySelector('img').currentSrc || b.querySelector('img').src, fc ? fc.textContent : (b.querySelector('img').alt || ''));
    });
    $('[data-lb-close]', lb).addEventListener('click', () => close());
    $$('[data-lb-zoom]', lb).forEach((b) => b.addEventListener('click', () => {
      scale = b.dataset.lbZoom === 'in' ? Math.min(4, scale * 1.6) : Math.max(1, scale / 1.6); if (scale < 1.05) scale = 1; apply();
    }));
    stage.addEventListener('click', (e) => { if (e.target === stage) close(); });
    let lastTap = 0;
    img.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 320) { scale = scale > 1 ? 1 : 2.2; apply(); lastTap = 0; } else lastTap = now;
    });
    img.addEventListener('dblclick', (e) => e.preventDefault());
    window.addEventListener('popstate', () => close(true));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && opened) close(); });
  }

  /* ── 풀이 한 단계씩 ── */
  $$('.stepper').forEach((st) => {
    const lis = $$('.steps li', st), ans = $('.ans', st), nxt = $('.step-next', st), all = $('.step-all', st);
    const label0 = nxt.textContent;
    const reset = () => { lis.forEach((l) => { l.hidden = true; }); ans.hidden = true; nxt.textContent = label0; all.hidden = false; };
    const finish = () => { ans.hidden = false; nxt.textContent = '다시 접기'; all.hidden = true; };
    nxt.addEventListener('click', () => {
      if (!ans.hidden) { reset(); return; }
      const h = lis.find((l) => l.hidden);
      if (h) { h.hidden = false; nxt.textContent = lis.some((l) => l.hidden) ? '다음 단계' : '답 보기'; }
      else finish();
    });
    all.addEventListener('click', () => { lis.forEach((l) => { l.hidden = false; }); finish(); });
  });

  /* ── 개념 체크(선택형) ── */
  function markQuiz(q, pick, save) {
    const ans = +q.dataset.ans, list = $('.qcs', q), btns = $$('.qc', q);
    btns.forEach((b) => b.classList.remove('correct', 'wrong'));
    btns[ans] && btns[ans].classList.add('correct');
    if (pick !== ans && btns[pick]) btns[pick].classList.add('wrong');
    list.classList.add('done');
    const why = $('.quiz-why', q), res = $('.quiz-res', q);
    res.textContent = pick === ans ? '정답이에요!' : `아쉬워요. 정답은 ${ans + 1}번이에요.`;
    res.className = 'quiz-res ' + (pick === ans ? 'ok' : 'no');
    why.hidden = false;
    if (save) {
      const code = q.dataset.qid.split('-')[0];
      unitProg(code).c[q.dataset.qid] = pick === ans ? 1 : 0; unitProg(code).cp = unitProg(code).cp || {};
      unitProg(code).cp[q.dataset.qid] = pick; saveProg();
    }
  }
  $$('.quiz').forEach((q) => {
    const code = q.dataset.qid.split('-')[0];
    const saved = (prog[code] && prog[code].cp) ? prog[code].cp[q.dataset.qid] : undefined;
    if (saved !== undefined) markQuiz(q, saved, false);
    $$('.qc', q).forEach((b) => b.addEventListener('click', () => {
      if ($('.qcs', q).classList.contains('done')) return;
      markQuiz(q, +b.dataset.i, true);
    }));
    $('.quiz-retry', q).addEventListener('click', () => {
      $$('.qc', q).forEach((b) => b.classList.remove('correct', 'wrong'));
      $('.qcs', q).classList.remove('done'); $('.quiz-why', q).hidden = true;
      const up = unitProg(code); delete up.c[q.dataset.qid]; if (up.cp) delete up.cp[q.dataset.qid]; saveProg();
    });
  });

  /* ── OX 퀴즈 ── */
  $$('.oxq').forEach((box) => {
    const code = box.dataset.code, total = +box.dataset.total, items = $$('.ox-item', box), score = $('.ox-score', box);
    const upd = () => {
      const o = unitProg(code).o; const done = Object.keys(o).length; const ok = Object.values(o).filter((v) => v === 1).length;
      score.textContent = done ? `${ok} / ${total} 정답${done < total ? ` · ${total - done}개 남음` : ''}` : `0 / ${total}`;
    };
    const mark = (it, v, save) => {
      const ans = it.dataset.ans, ok = v === ans;
      $$('.ox-b', it).forEach((b) => { b.classList.remove('ok', 'no', 'ans'); if (b.dataset.v === v) b.classList.add(ok ? 'ok' : 'no'); else if (!ok && b.dataset.v === ans) b.classList.add('ans'); });
      it.classList.add('done');
      const why = $('.ox-why', it), b = $('b', why);
      b.textContent = ok ? `정답 (${ans})` : `틀렸어요 — 정답 ${ans}`; b.className = ok ? 'ok' : 'no'; why.hidden = false;
      if (save) { unitProg(code).o[it.dataset.k] = ok ? 1 : 0; saveProg(); upd(); }
    };
    const savedO = (prog[code] && prog[code].ov) || {};
    items.forEach((it) => {
      if (savedO[it.dataset.k]) mark(it, savedO[it.dataset.k], false);
      $$('.ox-b', it).forEach((b) => b.addEventListener('click', () => {
        if (it.classList.contains('done')) return;
        mark(it, b.dataset.v, true);
        const up = unitProg(code); up.ov = up.ov || {}; up.ov[it.dataset.k] = b.dataset.v; saveProg();
      }));
    });
    $('.ox-reset', box).addEventListener('click', () => {
      items.forEach((it) => { it.classList.remove('done'); $$('.ox-b', it).forEach((b) => b.classList.remove('ok', 'no', 'ans')); $('.ox-why', it).hidden = true; });
      const up = unitProg(code); up.o = {}; up.ov = {}; saveProg(); upd();
    });
    upd();
  });

  /* ── 홈: 진도 막대 ── */
  $$('.ucard[data-code]').forEach((c) => {
    const p = prog[c.dataset.code]; const total = +c.dataset.total || 0;
    if (!p || !total) return;
    const done = Object.keys(p.c || {}).length + Object.keys(p.o || {}).length;
    const bar = $('.uc-bar i', c); if (bar) bar.style.width = Math.min(100, Math.round(done / total * 100)) + '%';
    const m = $('.uc-m', c); if (m && done) m.insertAdjacentHTML('beforeend', ` · <b style="color:var(--acc)">${Math.min(done, total)}/${total} 풀이</b>`);
  });

  /* ── 홈: 개념 검색 ── */
  const q = $('#q'), res = $('#search-res'), idxEl = $('#search-index');
  if (q && res && idxEl) {
    let IDX = [];
    try { IDX = JSON.parse(idxEl.textContent); } catch (e) { /* */ }
    const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const run = () => {
      const k = norm(q.value);
      if (!k) { res.hidden = true; res.innerHTML = ''; return; }
      const hits = [];
      for (const [code, n, t, unit, subj, keys] of IDX) {
        const nt = norm(t), score = nt.includes(k) ? 2 : (norm(keys).includes(k) || norm(unit).includes(k) ? 1 : 0);
        if (score) hits.push([score, code, n, t, unit, subj]);
      }
      hits.sort((a, b) => b[0] - a[0]);
      res.innerHTML = hits.length ? hits.slice(0, 40).map(([, code, n, t, unit, subj]) =>
        `<li><a href="u/${code}.html#s-${n}"><b>${esc(t)}</b><span>물리학${subj} · ${esc(unit)} · 개념 ${n}</span></a></li>`).join('')
        : '<li class="none">찾는 개념이 없어요. 다른 낱말로 검색해 보세요.</li>';
      res.hidden = false;
    };
    q.addEventListener('input', run);
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = res.querySelector('a'); if (a) location.href = a.href; } });
  }

  /* ── 맨 위로 ── */
  const tt = $('.to-top');
  if (tt) {
    const onS = () => { tt.hidden = window.scrollY < 1400; };
    window.addEventListener('scroll', onS, { passive: true }); onS();
    tt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();
