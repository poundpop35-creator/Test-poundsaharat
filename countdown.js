/* countdown.js — ป้ายนับถอยหลังวันสอบ
   ใช้กับ <span class="cd" data-cd-key="energy" data-cd="2026-10-26"></span>
   แตะที่ป้ายเพื่อแก้วันสอบเอง (เก็บไว้ในเครื่อง ไม่ส่งออกไปที่ไหน)
   ไม่มี element ที่ตรงเงื่อนไข สคริปต์นี้จะไม่ทำอะไรเลย */
(function () {
  var PREFIX = 'study:examdate:';
  var MS = 86400000;

  function todayUTCmid() {
    var n = new Date();
    return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1, d = +m[3];
    var t = Date.UTC(y, mo, d);
    var chk = new Date(t);
    if (chk.getUTCFullYear() !== y || chk.getUTCMonth() !== mo || chk.getUTCDate() !== d) return null;
    return t;
  }

  var TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function thaiDate(t) {
    var d = new Date(t);
    return d.getUTCDate() + ' ' + TH_MONTH[d.getUTCMonth()] + ' ' + (d.getUTCFullYear() + 543);
  }

  function stored(key) {
    if (!key) return null;
    try { return parseISO(localStorage.getItem(PREFIX + key)); } catch (e) { return null; }
  }

  function save(key, iso) {
    if (!key) return;
    try {
      if (iso) localStorage.setItem(PREFIX + key, iso);
      else localStorage.removeItem(PREFIX + key);
    } catch (e) { /* ใช้งานต่อได้ แม้เบราว์เซอร์ปิดการเก็บข้อมูล */ }
  }

  function paint(el) {
    var key = el.getAttribute('data-cd-key');
    var t = stored(key) || parseISO(el.getAttribute('data-cd'));
    if (t === null) {
      // ยังไม่มีวันสอบ: ถ้าแก้ได้ก็ชวนให้ตั้ง ถ้าแก้ไม่ได้ก็ซ่อนไป
      if (!key) { el.hidden = true; return; }
      el.hidden = false;
      el.dataset.cdState = 'unset';
      el.innerHTML = '<b></b>';
      el.firstChild.textContent = 'ตั้งวันสอบ';
      el.title = 'ยังไม่ได้ตั้งวันสอบ — แตะเพื่อตั้ง';
      return;
    }
    el.hidden = false;

    var days = Math.round((t - todayUTCmid()) / MS);
    var label, state;
    if (days > 1)       { label = 'เหลือ ' + days + ' วัน';  state = days <= 7 ? 'urgent' : days <= 21 ? 'soon' : 'far'; }
    else if (days === 1) { label = 'สอบพรุ่งนี้';            state = 'urgent'; }
    else if (days === 0) { label = 'สอบวันนี้ สู้ ๆ';         state = 'urgent'; }
    else                 { label = 'สอบไปแล้ว';              state = 'past'; }

    el.dataset.cdState = state;
    el.innerHTML = '<b></b><span></span>';
    el.firstChild.textContent = label;
    el.lastChild.textContent = thaiDate(t);
    el.title = 'วันสอบ ' + thaiDate(t) + ' — แตะเพื่อแก้วันสอบ';
  }

  function edit(el) {
    var key = el.getAttribute('data-cd-key');
    if (!key || typeof window.prompt !== 'function') return;
    var cur = stored(key) || parseISO(el.getAttribute('data-cd'));
    var now = cur === null ? '' : new Date(cur).toISOString().slice(0, 10);
    var ans = window.prompt('วันสอบ (ปี ค.ศ. เดือน วัน เช่น 2026-10-26)\nเว้นว่างเพื่อกลับไปใช้ค่าตั้งต้น', now);
    if (ans === null) return;
    ans = ans.trim();
    if (ans && parseISO(ans) === null) { window.alert('รูปแบบวันที่ไม่ถูกต้อง ต้องเป็น ปปปป-ดด-วว'); return; }
    save(key, ans);
    paint(el);
  }

  function boot() {
    var list = document.querySelectorAll('.cd[data-cd]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      paint(el);
      if (el.getAttribute('data-cd-key') && !el.dataset.cdBound) {
        el.dataset.cdBound = '1';
        el.style.cursor = 'pointer';
        el.addEventListener('click', (function (node) {
          return function (e) { e.preventDefault(); edit(node); };
        })(el));
      }
    }
  }

  window.StudyCountdown = { refresh: boot };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
