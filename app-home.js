(function () {
  'use strict';
  const catalog = window.STUDY_CATALOG, ui = window.StudyUI;
  if (!catalog || !ui) return;
  const $ = id => document.getElementById(id), esc = ui.escape;

  const groups = {
    agencies:['หน่วยงานที่กำลังเตรียมสอบ','แต่ละหน่วยงานมีครบ ตั้งแต่อ่านเนื้อหาไปจนถึงชุดจำลองสอบ'],
    resources:['คลังกลาง ใช้ได้หลายหน่วยงาน','กฎหมายที่ออกสอบซ้ำ ตัวบทต้นฉบับ และตัวช่วยวางแผนอ่าน'],
    english:['ภาษาอังกฤษ','เลือกเรียนเป็นคอร์ส หรือทวนบทเรียนพื้นฐาน'],
    archive:['หน่วยงานที่สอบไปแล้ว','คลังเดิมยังอยู่ครบ เปิดมาทวนได้ทุกเมื่อ']
  };

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
  const totalQ = hubItems.reduce((sum, p) => sum + (p.total || 0), 0);
  const agencyCount = hubItems.filter(p => p.group === 'agencies' || p.group === 'archive').length;

  const stats = $('home-stats');
  if (stats) {
    stats.innerHTML =
      `<span><b>${totalQ.toLocaleString('en-US')}</b> ข้อพร้อมเฉลย</span>` +
      `<span><b>${agencyCount}</b> หน่วยงาน</span>` +
      `<span><b>${hubItems.filter(p => p.group === 'agencies').length}</b> สนามที่กำลังเตรียม</span>`;
  }

  let category = groups[location.hash.slice(1)] ? location.hash.slice(1) : 'agencies';
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
    const badge = p.flag ? `<span class="agency-flag">${esc(p.flag)}</span>`
      : p.exam ? `<span class="cd" data-cd-key="${esc(p.id)}" data-cd="${esc(p.exam)}"></span>`
      : p.examPending ? '<span class="agency-flag soft">รอวันสอบทางการ</span>'
      : p.group === 'archive' ? '<span class="agency-flag quiet">สอบแล้ว</span>' : '';
    return `<article class="agency-card${p.priority ? ' priority' : ''}">
      <div class="agency-top">
        <span class="agency-icon ${esc(p.color)}" aria-hidden="true">${ui.icon(p.icon)}</span>
        <div class="agency-id">
          <h3><a href="${ui.href(p.file)}">${esc(p.title)}</a></h3>
          <p class="agency-role">${esc(p.role || '')}</p>
        </div>
        ${p.total ? `<span class="agency-total"><b>${p.total.toLocaleString('en-US')}</b>ข้อ</span>` : ''}
      </div>
      ${badge ? `<div class="agency-badges">${badge}</div>` : ''}
      ${p.headline ? `<p class="agency-headline">${esc(p.headline)}</p>` : `<p class="agency-headline">${esc(p.description || '')}</p>`}
      ${res.length ? `<div class="res-list">${res.map(r => row(p, r)).join('')}</div>` : ''}
      ${extras.length ? `<div class="res-extras">${extras.map(e =>
          `<a href="${ui.href(e.file, e.hash || '')}">${esc(e.label)}</a>`).join('')}</div>` : ''}
    </article>`;
  }

  function render() {
    const query = input.value.trim().toLocaleLowerCase('th');
    const items = hubItems.filter(p => query
      ? [p.title, p.short, p.role, p.search, p.description, p.headline].join(' ').toLocaleLowerCase('th').includes(query)
      : p.group === category);
    $('home-section-title').textContent = query ? 'ผลการค้นหา' : groups[category][0];
    $('home-section-description').textContent = query ? 'ค้นจากทุกหน่วยงานและทุกหมวด' : groups[category][1];
    $('home-count').textContent = items.length + ' รายการ';
    $('home-clear').hidden = !input.value;
    $('home-empty').hidden = !!items.length;
    document.querySelectorAll('[data-category]').forEach(a => {
      if (!query && a.dataset.category === category) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $('home-cards').innerHTML = items.map(card).join('');
    if (window.StudyCountdown) window.StudyCountdown.refresh();
  }

  input.addEventListener('input', render);
  $('home-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  $('home-reset').addEventListener('click', () => {
    input.value = ''; category = 'agencies';
    history.replaceState(null, '', '#agencies'); render(); input.focus();
  });
  document.querySelectorAll('[data-category]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); category = a.dataset.category; input.value = '';
    history.replaceState(null, '', '#' + category); render();
  }));
  window.addEventListener('hashchange', () => {
    category = groups[location.hash.slice(1)] ? location.hash.slice(1) : 'agencies';
    input.value = ''; render();
  });

  /* แถบ "กลับไปต่อ" — ชุดที่ค้างไว้มาก่อน แล้วค่อยเป็นหน้าที่เปิดล่าสุด */
  try {
    let recent;
    for (const p of catalog.filter(p => p.sprint && p.group === 'agencies')) {
      let saved;
      try { saved = JSON.parse(localStorage.getItem(p.sprintKey) || 'null'); } catch (_) { continue; }
      const session = saved && saved.session;
      if (session && !session.complete && Array.isArray(session.ids) &&
          Number.isInteger(session.idx) && session.idx >= 0 && session.idx < session.ids.length) {
        recent = {label: 'ทำชุด ' + p.short + ' ที่ค้างไว้ต่อ', file: p.sprint, hash: '#resume'};
        break;
      }
    }
    if (!recent) {
      const saved = JSON.parse(localStorage.getItem('study:last-page') || 'null');
      const page = saved && catalog.find(p => p.file === saved.file);
      if (page) recent = {label: 'เปิดล่าสุด: ' + page.short, file: page.file,
        hash: ['#read','#practice','#sources','#summary'].includes(saved.hash) ? saved.hash : ''};
    }
    if (recent) {
      $('home-recent').innerHTML = `<span>${esc(recent.label)}</span><a href="${ui.href(recent.file, recent.hash)}">กลับไปต่อ →</a>`;
      $('home-recent').hidden = false;
    }
  } catch (_) { /* Browsing remains available without storage. */ }

  render();
})();
