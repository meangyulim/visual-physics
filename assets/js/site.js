/* 그림으로 이해하는 고등 물리 — 화면 동작 (탭·목차·그림 확대·풀이 펼치기·퀴즈·진도·검색·테마) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가(사생활 모드 등) */ } },
  };
  /* ── 공부 기록: 항목마다 고친 시각(meta)을 함께 저장 → 여러 기기 기록을 항목 단위로 합친다 ── */
  const PKEY = 'vp-progress-v1', MKEY = 'vp-progress-meta-v1';
  const prog = store.get(PKEY, {});
  const J = (v) => JSON.stringify(v);
  const canon = (o) => J(Object.keys(o).sort().map((k) => [k, o[k]]));
  const PARTS = ['c', 'cp', 'o', 'ov'];
  function flat(p) {
    const f = {};
    for (const code in p) {
      if (code === '_last') { if (p._last) f._last = p._last; continue; }
      for (const part of PARTS) { const d = p[code] && p[code][part]; if (d) for (const k in d) f[code + '|' + part + '|' + k] = d[k]; }
    }
    return f;
  }
  function unflat(f) {
    const p = {};
    for (const key in f) {
      if (key === '_last') { p._last = f._last; continue; }
      const a = key.indexOf('|'), b = key.indexOf('|', a + 1);
      const code = key.slice(0, a), part = key.slice(a + 1, b), k = key.slice(b + 1);
      const u = (p[code] = p[code] || { c: {}, o: {} });
      (u[part] = u[part] || {})[k] = f[key];
    }
    return p;
  }
  let snap = flat(prog);
  let meta = store.get(MKEY, null);
  if (!meta) { meta = {}; for (const k in snap) meta[k] = 1; store.set(MKEY, meta); } // 예전 기록은 '아주 오래된' 것으로
  let onProgSaved = () => {};
  function saveProg() {
    const now = Date.now(), f = flat(prog);
    for (const k in f) if (!(k in snap) || J(f[k]) !== J(snap[k])) meta[k] = now;
    for (const k in snap) if (!(k in f)) meta[k] = now; // 지운 항목도 시각을 남겨 다른 기기에서 되살아나지 않게
    snap = f; store.set(PKEY, prog); store.set(MKEY, meta);
    onProgSaved();
  }
  function replaceProg(np) { Object.keys(prog).forEach((k) => delete prog[k]); Object.assign(prog, np); }
  const unitProg = (code) => (prog[code] = prog[code] || { c: {}, o: {} });
  const restorers = []; // 기록이 바뀌면 화면을 다시 칠하는 함수들

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

  /* ── 마지막으로 본 곳(이어서 공부하기) ── */
  const unitCode = (location.pathname.match(/\/u\/([A-Za-z0-9]+)\.html$/) || [])[1];
  function setLast(sec) {
    if (!unitCode) return;
    const t = $('.ab-title b'), title = t ? t.textContent.trim() : unitCode;
    const h = sec ? $(`#s-${sec} .sec-h h2`) : null;
    const href = `u/${unitCode}.html` + (sec ? `#s-${sec}` : '');
    if (prog._last && prog._last.href === href) return;
    prog._last = { href, unit: title, sec: sec ? `개념 ${sec}. ${h ? h.textContent.trim() : ''}` : '' };
    saveProg();
  }
  if (unitCode && !(prog._last && prog._last.href.startsWith(`u/${unitCode}.html`))) setLast(null);

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
        setLast(n);
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
    const clear = () => {
      $$('.qc', q).forEach((b) => b.classList.remove('correct', 'wrong'));
      $('.qcs', q).classList.remove('done'); $('.quiz-why', q).hidden = true;
    };
    const restore = () => {
      clear();
      const saved = (prog[code] && prog[code].cp) ? prog[code].cp[q.dataset.qid] : undefined;
      if (saved !== undefined) markQuiz(q, saved, false);
    };
    restore(); restorers.push(restore);
    $$('.qc', q).forEach((b) => b.addEventListener('click', () => {
      if ($('.qcs', q).classList.contains('done')) return;
      markQuiz(q, +b.dataset.i, true);
    }));
    $('.quiz-retry', q).addEventListener('click', () => {
      clear();
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
    const clearAll = () => items.forEach((it) => { it.classList.remove('done'); $$('.ox-b', it).forEach((b) => b.classList.remove('ok', 'no', 'ans')); $('.ox-why', it).hidden = true; });
    const restore = () => {
      clearAll();
      const savedO = (prog[code] && prog[code].ov) || {};
      items.forEach((it) => { if (savedO[it.dataset.k]) mark(it, savedO[it.dataset.k], false); });
      upd();
    };
    restore(); restorers.push(restore);
    items.forEach((it) => {
      $$('.ox-b', it).forEach((b) => b.addEventListener('click', () => {
        if (it.classList.contains('done')) return;
        const up = unitProg(code); up.ov = up.ov || {}; up.ov[it.dataset.k] = b.dataset.v;
        mark(it, b.dataset.v, true);
      }));
    });
    $('.ox-reset', box).addEventListener('click', () => {
      clearAll();
      const up = unitProg(code); up.o = {}; up.ov = {}; saveProg(); upd();
    });
  });

  /* ── 홈: 진도 막대 ── */
  function paintHome() {
    $$('.ucard[data-code]').forEach((c) => {
      const p = prog[c.dataset.code]; const total = +c.dataset.total || 0;
      const done = p ? Object.keys(p.c || {}).length + Object.keys(p.o || {}).length : 0;
      const bar = $('.uc-bar i', c); if (bar) bar.style.width = total ? Math.min(100, Math.round(done / total * 100)) + '%' : '0%';
      const m = $('.uc-m', c); if (!m) return;
      let sp = $('.uc-done', m);
      if (!sp) { sp = document.createElement('span'); sp.className = 'uc-done'; m.appendChild(sp); }
      sp.innerHTML = done && total ? ` · <b>${Math.min(done, total)}/${total} 풀이</b>` : '';
    });
  }
  function paintResume() {
    const hero = $('.hero-home'); if (!hero) return;
    let a = $('.resume', hero); const L = prog._last;
    if (!L) { if (a) a.remove(); return; }
    if (!a) {
      a = document.createElement('a'); a.className = 'resume';
      a.innerHTML = '<span class="rs-k">이어서 공부하기</span><span class="rs-t"><b></b><small></small></span><span class="rs-go" aria-hidden="true">→</span>';
      const ch = $('.chips', hero); if (ch) ch.after(a); else hero.appendChild(a);
    }
    a.href = L.href; $('b', a).textContent = L.unit || ''; $('small', a).textContent = L.sec || '';
  }
  paintHome(); paintResume();
  restorers.push(paintHome, paintResume);

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

  /* ── 기기 간 동기화: 내 GitHub 비공개 gist 하나에 기록을 저장·병합 ── */
  const TKEY = 'vp-sync-token', GKEY = 'vp-sync-gist', LKEY = 'vp-sync-login', SKEY = 'vp-sync-last';
  const API = 'https://api.github.com', FILE = 'visual-physics-progress.json';
  const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=' + encodeURIComponent('그림 물리 공부 기록');
  let token = store.get(TKEY, null), busy = false, again = false, timer = 0, state = token ? 'idle' : 'off', errMsg = '';
  let lastOk = store.get(SKEY, 0);

  async function gh(path, opt = {}, tk = token) {
    const headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + tk };
    if (opt.body) headers['Content-Type'] = 'application/json';
    const r = await fetch(API + path, Object.assign({ cache: 'no-store' }, opt, { headers }));
    if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    return r.status === 204 ? null : r.json();
  }
  function mergeState(lf, lm, rf, rm) {
    const keys = new Set([...Object.keys(lf), ...Object.keys(lm), ...Object.keys(rf), ...Object.keys(rm)]);
    const f = {}, m = {};
    keys.forEach((k) => {
      const lt = lm[k] || 0, rt = rm[k] || 0, src = rt > lt ? rf : lf;
      m[k] = Math.max(lt, rt); if (k in src) f[k] = src[k];
    });
    return { f, m };
  }
  async function findGist() {
    const id = store.get(GKEY, null); if (id) return id;
    for (let page = 1; page <= 10; page++) {
      const list = await gh(`/gists?per_page=100&page=${page}`);
      const g = list.find((x) => x.files && x.files[FILE]);
      if (g) { store.set(GKEY, g.id); return g.id; }
      if (list.length < 100) break;
    }
    return null;
  }
  async function readGist(id) {
    const g = await gh('/gists/' + id), fl = g.files && g.files[FILE];
    if (!fl) return { f: {}, m: {} };
    let txt = fl.content;
    if (fl.truncated) txt = await (await fetch(fl.raw_url, { cache: 'no-store' })).text();
    const d = JSON.parse(txt || '{}');
    return { f: d.flat || {}, m: d.meta || {} };
  }
  async function syncNow() {
    if (!token) return;
    if (busy) { again = true; return; }
    busy = true; clearTimeout(timer); timer = 0; setState('busy');
    try {
      let id = await findGist(), remote = { f: {}, m: {} };
      if (id) {
        try { remote = await readGist(id); }
        catch (e) { if (e.status === 404) { store.set(GKEY, null); id = await findGist(); if (id) remote = await readGist(id); } else throw e; }
      }
      const lf = flat(prog), M = mergeState(lf, meta, remote.f, remote.m);
      if (canon(M.f) !== canon(lf)) { replaceProg(unflat(M.f)); snap = flat(prog); store.set(PKEY, prog); restorers.forEach((fn) => fn()); }
      meta = M.m; store.set(MKEY, meta);
      if (!id || canon(M.f) !== canon(remote.f) || canon(M.m) !== canon(remote.m)) {
        const content = J({ v: 1, updated: new Date().toISOString(), flat: M.f, meta: M.m });
        if (id) await gh('/gists/' + id, { method: 'PATCH', body: J({ files: { [FILE]: { content } } }) });
        else {
          const g = await gh('/gists', { method: 'POST', body: J({ description: '그림 물리 공부 기록 (자동 동기화 · 지우면 기록이 사라져요)', public: false, files: { [FILE]: { content } } }) });
          store.set(GKEY, g.id);
        }
      }
      lastOk = Date.now(); store.set(SKEY, lastOk); errMsg = ''; setState('ok');
    } catch (e) {
      errMsg = e.status === 401 ? '토큰이 만료되었거나 잘못됐어요. 연결을 끊고 새 토큰을 넣어 주세요.'
        : (e.status === 403 || e.status === 404) ? '토큰에 gist 권한이 없어요. gist 를 체크해서 다시 만들어 주세요.'
        : '인터넷 연결을 확인해 주세요. 기록은 이 기기에 남아 있고 다음에 다시 맞춰요.';
      setState('err');
    } finally {
      busy = false;
      if (again) { again = false; schedule(800); }
    }
  }
  function schedule(ms = 2500) { if (!token) return; clearTimeout(timer); timer = setTimeout(syncNow, ms); }
  onProgSaved = () => schedule();
  document.addEventListener('visibilitychange', () => {
    if (!token) return;
    if (document.visibilityState === 'hidden') { if (timer) syncNow(); }
    else if (Date.now() - lastOk > 15000) syncNow();
  });
  window.addEventListener('online', () => schedule(500));

  /* 동기화 버튼·창 */
  const bar = $('.appbar'), themeBtn = bar && $('[data-theme-toggle]', bar);
  const ago = (t) => { if (!t) return '아직 없음'; const s = (Date.now() - t) / 1000; if (s < 60) return '방금'; if (s < 3600) return Math.floor(s / 60) + '분 전'; const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  let modal = null, syncBtn = null;
  function setState(s) {
    state = s;
    if (syncBtn) { syncBtn.dataset.state = s; syncBtn.setAttribute('aria-label', '기기 간 기록 동기화 — ' + ({ off: '꺼짐', idle: '켜짐', busy: '맞추는 중', ok: '맞춤 완료', err: '문제 있음' }[s])); }
    if (modal && !modal.hidden) renderModal();
    const cta = $('.sync-cta'); if (cta) cta.hidden = !!token;
  }
  function renderModal() {
    const body = $('.sync-body', modal);
    if (!token) {
      body.innerHTML = `<p>푼 문제·OX·이어서 볼 위치를 <b>내 GitHub 계정의 비공개 gist</b>에 저장해서, 폰·태블릿·컴퓨터 어디서 열어도 이어서 공부할 수 있어요.</p>
<ol class="sync-steps">
<li><a href="${TOKEN_URL}" target="_blank" rel="noopener">GitHub 토큰 만들기 ↗</a><br>‘gist’만 체크된 채로 열려요. Expiration(만료)을 고르고 맨 아래 <b>Generate token</b> → 나온 <code>ghp_…</code> 를 복사하세요.</li>
<li>아래 칸에 붙여넣고 <b>연결</b>을 누르세요.</li>
<li>다른 기기에서도 한 번씩 같은 토큰을 넣으면 끝이에요. (그 기기에서 토큰을 새로 만들어도 같은 계정이면 기록이 합쳐져요.)</li>
</ol>
<div class="sync-row"><input class="sync-in" type="password" placeholder="ghp_… 토큰 붙여넣기" autocomplete="off" spellcheck="false"><button class="sync-b primary sync-go" type="button">연결</button></div>
<p class="sync-msg" role="status"></p>
<p class="sync-note">토큰은 이 기기의 브라우저에만 저장돼요. gist 권한만 있는 토큰이라 저장소나 계정 설정은 건드릴 수 없어요. 공용 컴퓨터에서는 다 쓴 뒤 연결을 끊어 주세요.</p>`;
      const inp = $('.sync-in', body), go = $('.sync-go', body), msg = $('.sync-msg', body);
      const connect = async () => {
        const tk = inp.value.trim(); if (!tk) { inp.focus(); return; }
        go.disabled = true; msg.className = 'sync-msg'; msg.textContent = '확인하는 중…';
        try {
          const u = await gh('/user', {}, tk);
          await gh('/gists?per_page=1', {}, tk); // gist 권한 확인
          token = tk; store.set(TKEY, tk); store.set(LKEY, u.login); store.set(GKEY, null);
          renderModal(); await syncNow();
        } catch (e) {
          go.disabled = false; msg.className = 'sync-msg bad';
          msg.textContent = e.status === 401 ? '토큰이 맞지 않아요. 다시 복사해 붙여넣어 주세요.' : (e.status === 403 || e.status === 404) ? 'gist 권한이 없는 토큰이에요. gist 를 체크해서 다시 만들어 주세요.' : '연결하지 못했어요. 인터넷 연결을 확인해 주세요.';
        }
      };
      go.addEventListener('click', connect);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });
      setTimeout(() => inp.focus(), 50);
    } else {
      const login = store.get(LKEY, '');
      const st = state === 'busy' ? '맞추는 중…' : state === 'err' ? errMsg : `마지막 동기화: ${ago(lastOk)}`;
      body.innerHTML = `<p class="sync-on"><span class="sync-ok-i" aria-hidden="true"></span><b>${login ? '@' + login.replace(/[<>&]/g, '') : 'GitHub'}</b> 계정과 연결됨</p>
<p class="sync-msg ${state === 'err' ? 'bad' : ''}" role="status">${st}</p>
<p>문제를 풀면 몇 초 뒤 자동으로 저장되고, 다른 기기에서 이 사이트를 열면 자동으로 이어져요.</p>
<div class="sync-row"><button class="sync-b primary sync-now" type="button" ${state === 'busy' ? 'disabled' : ''}>지금 동기화</button><button class="sync-b sync-off" type="button">이 기기에서 연결 끊기</button></div>
<p class="sync-note">연결을 끊어도 이 기기의 기록은 그대로 남아요. 기록 원본은 GitHub gist 의 ‘${FILE}’ 이에요.</p>`;
      $('.sync-now', body).addEventListener('click', syncNow);
      $('.sync-off', body).addEventListener('click', () => {
        token = null; [TKEY, GKEY, LKEY].forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* */ } });
        clearTimeout(timer); setState('off'); renderModal();
      });
    }
  }
  function openModal() {
    if (!modal) {
      modal = document.createElement('div'); modal.className = 'sync-modal'; modal.hidden = true;
      modal.innerHTML = `<div class="sync-card" role="dialog" aria-modal="true" aria-labelledby="sync-h">
<div class="sync-top"><h2 id="sync-h">기기 간 기록 동기화</h2><button class="ab-btn sync-x" type="button" aria-label="닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>
<div class="sync-body"></div></div>`;
      document.body.appendChild(modal);
      $('.sync-x', modal).addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && !modal.hidden) closeModal(); });
    }
    modal.hidden = false; document.body.classList.add('lb-open'); renderModal();
  }
  function closeModal() { if (modal) { modal.hidden = true; document.body.classList.remove('lb-open'); } }
  if (bar && themeBtn) {
    syncBtn = document.createElement('button');
    syncBtn.className = 'ab-btn ab-sync'; syncBtn.type = 'button';
    syncBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.5h10.2a4.3 4.3 0 0 0 .6-8.56A6 6 0 0 0 6.3 9.1 4.7 4.7 0 0 0 7 18.5z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9.6 13.6l1.8 1.8 3.4-3.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="i-chk"/></svg><i class="sync-dot"></i>';
    themeBtn.before(syncBtn);
    syncBtn.addEventListener('click', openModal);
  }
  const heroSearch = $('.hero-home .search');
  if (heroSearch) {
    const cta = document.createElement('button'); cta.type = 'button'; cta.className = 'sync-cta';
    cta.innerHTML = '폰·태블릿·컴퓨터에서 기록 이어가기 <span aria-hidden="true">→</span>';
    cta.addEventListener('click', openModal); heroSearch.after(cta);
  }
  setState(state);
  if (token) syncNow();

})();
