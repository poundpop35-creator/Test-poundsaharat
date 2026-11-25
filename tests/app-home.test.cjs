'use strict';
/* Run with: node --test tests/app-home.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app-home.js'), 'utf8');
const catalogContext = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'app-catalog.js'), 'utf8'), catalogContext);
const catalog = JSON.parse(JSON.stringify(catalogContext.window.STUDY_CATALOG));
const pending = overrides => ({ids:['q1','q2'], idx:1, complete:false, ...overrides});
const escape = value => String(value ?? '').replace(/[&<>"']/g,
  char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function renderHome(saved = {}, options = {}) {
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) elements.set(id, {
      hidden: id === 'home-recent', value:'', innerHTML:'', textContent:'',
      addEventListener() {}, scrollIntoView() {}, focus() {}
    });
    return elements.get(id);
  };
  const storage = new Map(Object.entries(saved).map(([key, value]) =>
    [key, typeof value === 'string' ? value : JSON.stringify(value)]));
  const before = [...storage];
  const mutations = [];
  const window = {
    STUDY_CATALOG: options.catalog || catalog,
    StudyUI: {
      escape, icon: escape,
      href: (file, hash = '') => file + (hash ? '#' + hash.replace(/^#/, '') : '')
    },
    addEventListener() {}
  };
  const context = {
    window, document: {getElementById, querySelectorAll: () => []}, location: {hash:''},
    localStorage: {
      getItem(key) {
        if (options.blockedKeys?.includes(key)) throw new Error('Storage unavailable');
        return storage.get(key) ?? null;
      },
      setItem: (...args) => mutations.push(['setItem', ...args]),
      removeItem: (...args) => mutations.push(['removeItem', ...args]),
      clear: () => mutations.push(['clear'])
    }
  };
  if (options.blockedStorage) Object.defineProperty(context, 'localStorage', {
    get() { throw new Error('Storage access denied'); }
  });
  vm.runInNewContext(source, context, {filename:'app-home.js'});
  assert.deepEqual(mutations, [], 'Rendering the directory must never write or delete progress');
  assert.deepEqual([...storage], before, 'Saved progress must remain unchanged');
  return {get: getElementById, recent: getElementById('home-recent')};
}

test('archived SAO and OPSMOAC sprint sessions can resume from the directory', () => {
  for (const id of ['sao', 'opsmoac']) {
    const agency = catalog.find(p => p.id === id);
    assert.equal(agency.group, 'archive');
    const home = renderHome({[agency.sprintKey]: {session:pending()}});
    assert.equal(home.recent.hidden, false, id);
    assert.ok(home.recent.innerHTML.includes('href="' + agency.sprint + '#resume"'), id);
    assert.ok(home.recent.innerHTML.includes(agency.short), id);
  }
});

test('the intensive energy bank uses its supported quiz route to resume', () => {
  const home = renderHome({'energy-intensive:500:v1': {version:1, session:pending()}});
  assert.equal(home.recent.hidden, false);
  assert.match(home.recent.innerHTML, /href="energy-intensive\.html#quiz"/);
});

test('all five practice500 banks have working resume destinations', () => {
  for (const id of ['rd', 'dmh', 'drr', 'opsmoac', 'namban']) {
    const home = renderHome({[id + ':practice500:v1']: pending()});
    assert.equal(home.recent.hidden, false, id);
    assert.ok(home.recent.innerHTML.includes('href="practice500.html?agency=' + id + '#resume"'), id);
  }
});

test('malformed earlier records do not hide a valid later practice session', () => {
  const home = renderHome({
    'coj:proc:69:v1':'{bad JSON',
    'energy-intensive:500:v1':'{bad JSON',
    'rd:practice500:v1':'{bad JSON',
    'dmh:practice500:v1':pending()
  });
  assert.equal(home.recent.hidden, false);
  assert.match(home.recent.innerHTML, /href="practice500\.html\?agency=dmh#resume"/);
});

test('a blocked storage key does not hide later records and full blocking leaves the directory usable', () => {
  const home = renderHome({'drr:practice500:v1':pending()}, {
    blockedKeys:['coj:proc:69:v1', 'energy-intensive:500:v1', 'rd:practice500:v1']
  });
  assert.match(home.recent.innerHTML, /href="practice500\.html\?agency=drr#resume"/);
  const blocked = renderHome({}, {blockedStorage:true});
  assert.equal(blocked.recent.hidden, true);
  assert.equal(blocked.get('agency-count').textContent, '9 หน่วยงาน');
  assert.equal(blocked.get('shared-count').textContent, '6 รายการ');
});

test('empty, completed, negative, out-of-range, and noninteger sessions never offer resume', () => {
  const invalid = [
    pending({ids:[]}), pending({complete:true}), pending({idx:-1}),
    pending({idx:2}), pending({idx:0.5}), pending({idx:'1'}),
    pending({ids:null}), pending({complete:undefined})
  ];
  for (const session of invalid) {
    for (const [key, value] of [
      ['sao48:v1', {session}],
      ['energy-intensive:500:v1', {version:1, session}],
      ['rd:practice500:v1', session]
    ]) {
      assert.equal(renderHome({[key]:value}).recent.hidden, true, key + ': ' + JSON.stringify(session));
    }
  }
});

test('invalid sessions are skipped in favor of a valid later one', () => {
  const home = renderHome({
    'coj:proc:69:v1': {session:pending({complete:true})},
    'energy-intensive:500:v1': {version:1, session:pending({ids:[]})},
    'rd:practice500:v1': pending({idx:-1}),
    'dmh:practice500:v1': pending({idx:2}),
    'drr:practice500:v1': pending({idx:0.5}),
    'namban:practice500:v1': pending()
  });
  assert.match(home.recent.innerHTML, /href="practice500\.html\?agency=namban#resume"/);
});

test('last visited page remains available when earlier storage records are malformed', () => {
  const home = renderHome({
    'rd:practice500:v1':'{bad JSON',
    'study:last-page': {file:'laws.html', hash:'#sources'}
  });
  assert.equal(home.recent.hidden, false);
  assert.match(home.recent.innerHTML, /href="laws\.html#sources"/);
  assert.match(home.recent.innerHTML, /เปิดล่าสุด/);
});

test('the Energy primary resource opens short practice while keeping its intensive course accessible', () => {
  const energy = catalog.find(p => p.id === 'energy');
  const home = renderHome({}, {catalog:[energy]});
  const html = home.get('agency-cards').innerHTML;
  assert.match(html, /class="agency-primary" href="energy-sprint\.html"/);
  assert.match(html, /class="res-row[^"]*" href="energy-intensive\.html"/);
});

test('the Diprom primary resource opens practice while keeping lessons accessible', () => {
  const diprom = catalog.find(p => p.id === 'diprom');
  const home = renderHome({}, {catalog:[diprom]});
  const html = home.get('archive-cards').innerHTML;
  assert.match(html, /class="agency-primary" href="diprom\.html#practice"/);
  assert.match(html, /class="res-row[^"]*" href="diprom\.html#read"/);
});

test('without an explicit primary, existing practice500, mock, strong, and first-resource priorities remain', () => {
  const resources = [
    {kind:'read', file:'first.html', label:'First'},
    {kind:'read', file:'strong.html', label:'Strong', strong:true},
    {kind:'mock', file:'mock.html', label:'Mock'},
    {kind:'drill', file:'practice500.html?agency=rd', label:'Practice 500'}
  ];
  for (const [length, expected] of [[4, 'practice500.html?agency=rd'], [3, 'mock.html'], [2, 'strong.html'], [1, 'first.html']]) {
    const agency = {id:'rd', title:'กรมสรรพากร', short:'สรรพากร', group:'agencies', file:'rd.html', resources:resources.slice(0, length)};
    const home = renderHome({}, {catalog:[agency]});
    assert.ok(home.get('agency-cards').innerHTML.includes('class="agency-primary" href="' + expected + '"'), expected);
  }
});
