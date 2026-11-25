(function () {
  'use strict';
  const catalog = window.STUDY_CATALOG, ui = window.StudyUI;
  if (!catalog || !ui) return;
  const $ = id => document.getElementById(id), esc = ui.escape;

  /* คำเรียกและไอคอนประจำ "ชนิดของสิ่งที่ทำได้" ใช้ชุดเดียวกันทุกหน่วยงาน */
  const KIND = {
    read:  {name:'อ่าน',    d:'M12 6c-3-2-7-2-10-1v14c3-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-3-1-7-1-10 1V6'},
    drill: {name:'ฝึก',     d:'M4 6h9M4 12h6M4 18h9M14.5 16.5l2 2 4-4'},
    mock:  {name:'จำลองสอบ', d:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'},
    memo:  {name:'ท่อง',    d:'M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2Z'},
    source:{name:'ตัวบท',   d:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8M8 17h5'},
    plan:  {name:'แผน',     d:'M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z'},
    write: {name:'เขียน',   d:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'}
  };
  const glyph = kind => {
    const k = KIND[kind] || KIND.read;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${k.d}"/></svg>`;
  };

  const hubItems = catalog.filter(p => p.hub !== false);
  const input = $('home-search-input');

  function row(p, r) {
    const cls = 'res-row' + (r.strong ? ' strong' : '');
    return `<a class="${cls}" href="${ui.href(r.file, r.hash || '')}" data-kind="${esc(r.kind)}">` +
      `<span class="res-ico">${glyph(r.kind)}</span>` +
      `<span class="res-text"><b>${esc(r.label)}</b>${r.meta ? `<small>${esc(r.meta)}</small>` : ''}</span>` +
      `<span class="res-go" aria-hidden="true">→</span></a>`;
  }

  function card(p) {
    const res = p.resources || [];
    const extras = p.extras || [];
    const primary = res.find(r => r.primary === true)
      || res.find(r => r.file && r.file.startsWith('practice500.html?'))
      || res.find(r => r.kind === 'mock') || res.find(r => r.strong) || res[0];
    const mixed = res.find(r => r.featuredMixed);
    const more = res.filter(r => r !== primary && r !== mixed);
    const badge = p.flag ? `<span class="agency-flag">${esc(p.flag)}</span>`
      : p.exam ? `<span class="cd" data-cd-key="${esc(p.id)}" data-cd="${esc(p.exam)}"></span>`
      : p.examPending ? '<span class="agency-flag soft">รอวันสอบทางการ</span>'
      : p.group === 'archive' ? '<span class="agency-flag quiet">สอบแล้ว</span>' : '';
    return `<article class="agency-card${p.priority ? ' priority' : ''}">
      <div class="agency-top">
        <span class="agency-icon ${esc(p.color)}" aria-hidden="true">${ui.icon(p.icon)}</span>
        <div class="agency-id">
          <h3><a href="${ui.href(p.directoryFile || p.file)}">${esc(p.title)}</a></h3>
          <p class="agency-role">${esc(p.role || '')}</p>
        </div>
        ${p.total ? `<span class="agency-total"><b>${p.total.toLocaleString('en-US')}</b>ข้อ</span>` : ''}
      </div>
      ${badge ? `<div class="agency-badges">${badge}</div>` : ''}
      ${p.headline ? `<p class="agency-headline">${esc(p.headline)}</p>` : `<p class="agency-headline">${esc(p.description || '')}</p>`}
      ${primary ? `<div class="agency-entry"><a class="agency-primary" href="${ui.href(primary.file, primary.hash || '')}"><span>${p.chapterBank ? '' : 'เริ่มเลย · '}${esc(primary.label)}</span></a>${mixed ? `<a class="agency-primary agency-mixed" href="${ui.href(mixed.file,mixed.hash)}">ชุดรวม 100 ข้อ</a>` : ''}</div>` : ''}
      ${more.length || extras.length ? '<details class="resource-fold"><summary>ชุดเดิมและเอกสารเพิ่มเติม</summary>' : ''}
      ${more.length ? `<div class="res-list">${more.map(r => row(p, r)).join('')}</div>` : ''}
      ${extras.length ? `<div class="res-extras">${extras.map(e =>
          `<a href="${ui.href(e.file, e.hash || '')}">${esc(e.label)}</a>`).join('')}</div>` : ''}
    ${more.length || extras.length ? '</details>' : ''}</article>`;
  }

  function render() {
    const query = input.value.trim().toLocaleLowerCase('th');
    const matches = hubItems.filter(p => [p.title, p.short, p.role, p.search, p.description, p.headline,
      ...(p.resources || []).map(r => r.label)].join(' ').toLocaleLowerCase('th').includes(query));
    const agencies = matches.filter(p => ['agencies', 'archive'].includes(p.group));
    const shared = matches.filter(p => ['resources', 'english'].includes(p.group));
    for (const [prefix, section, items, unit] of [
      ['agency', 'agencies', agencies, 'หน่วยงาน'], ['shared', 'resources', shared, 'รายการ']
    ]) {
      $(section).hidden = items.length === 0;
      $(prefix + '-count').textContent = items.length + ' ' + unit;
      const subgroup = prefix === 'agency' ? 'archive' : 'english';
      const secondary = items.filter(p => p.group === subgroup);
      $(prefix + '-cards').innerHTML = items.filter(p => p.group !== subgroup).map(card).join('');
      $(subgroup).hidden = secondary.length === 0;
      $(subgroup + '-cards').innerHTML = secondary.map(card).join('');
    }
    $('home-clear').hidden = !input.value;
    $('home-empty').hidden = matches.length > 0;
    $('search-status').textContent = query ? 'พบ ' + agencies.length + ' หน่วยงาน และ ' + shared.length + ' รายการในคลังกลาง' : '';
    if (window.StudyCountdown) window.StudyCountdown.refresh();
  }

  input.addEventListener('input', render);
  $('home-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  $('home-reset').addEventListener('click', () => {
    input.value = ''; render(); input.focus();
  });
  function openSection(hash) {
    const target = {archive:'archive', english:'english', agencies:'agencies', resources:'resources'}[hash.slice(1)];
    if (!target) return;
    input.value = '';
    render();
    $(target).scrollIntoView();
  }
  document.querySelectorAll('.portal-nav a').forEach(link => link.addEventListener('click', () => openSection(link.hash)));
  window.addEventListener('hashchange', () => openSection(location.hash));

  /* แถบ "กลับไปต่อ" — ชุดที่ค้างไว้มาก่อน แล้วค่อยเป็นหน้าที่เปิดล่าสุด */
  function readSaved(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }
  function isPending(session) {
    return session && session.complete === false && Array.isArray(session.ids) && session.ids.length > 0 &&
      Number.isInteger(session.idx) && session.idx >= 0 && session.idx < session.ids.length;
  }
  {
    let recent;
    const latest = readSaved('chapter-bank:last');
    const currentBanks = catalog.filter(p => p.chapterBank);
    currentBanks.sort((a,b) => Number(b.chapterBank === latest?.agency) - Number(a.chapterBank === latest?.agency));
    for (const p of currentBanks) {
      const saved = readSaved('chapter-bank:' + p.chapterBank + ':v1');
      if (isPending(saved?.session)) {
        recent = {label:'ทำชุด ' + p.short + ' ที่ค้างไว้ต่อ',file:p.directoryFile || p.file,hash:'#resume'};
        break;
      }
    }
    if (!recent) for (const p of catalog.filter(p => p.sprint && p.sprintKey)) {
      const saved = readSaved(p.sprintKey);
      const session = saved && saved.session;
      if (isPending(session)) {
        recent = {label: 'ทำชุด ' + p.short + ' ที่ค้างไว้ต่อ', file: p.sprint, hash: '#resume'};
        break;
      }
    }
    if (!recent) {
      const saved = readSaved('energy-intensive:500:v1');
      if (isPending(saved && saved.session)) {
        recent = {label:'ทำชุดพลังงานเข้มข้นที่ค้างไว้ต่อ',file:'energy-intensive.html',hash:'#quiz'};
      }
    }
    if (!recent) for (const id of ['rd','dmh','drr','opsmoac','namban']) {
      const saved = readSaved(id + ':practice500:v1');
      if (isPending(saved)) {
        recent = {label:'ทำข้อสอบ '+(catalog.find(p => p.id === id)?.short || id)+' ที่ค้างไว้ต่อ',file:'practice500.html?agency='+id,hash:'#resume'};
        break;
      }
    }
    if (!recent) {
      const saved = readSaved('study:last-page');
      const page = saved && catalog.find(p => p.file === saved.file);
      if (page) recent = {label: 'เปิดล่าสุด: ' + page.short, file: page.file,
        hash: ['#read','#practice','#sources','#summary'].includes(saved.hash) ? saved.hash : ''};
    }
    if (recent) {
      $('home-recent').innerHTML = `<span>${esc(recent.label)}</span><a href="${ui.href(recent.file, recent.hash)}">กลับไปต่อ →</a>`;
      $('home-recent').hidden = false;
    }
  }

  render();
  if (location.hash) openSection(location.hash);
})();
