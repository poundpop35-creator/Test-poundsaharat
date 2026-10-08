/* quiz-reveal.js — เลื่อนเฉลยขึ้นมาให้เห็นทันทีหลังตอบ
   ทำงานกับทั้งแอปคลังติว (.explain.show) และหน้า sprint (.feedback / .notice)
   เป็นสคริปต์เสริม ไม่แตะตรรกะการทำข้อสอบเดิม */
(function () {
  var SEL = '#quiz .explain.show, #quiz .feedback, #quiz .notice';
  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  var smooth = !(window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function stickyBottom() {
    // แถบบนที่ปักอยู่ (ปุ่มออก + ตัวนับ + หลอดความคืบหน้า) กินพื้นที่บนสุดเท่าไร
    var bars = document.querySelectorAll(
      '#quiz .read-head, #quiz .quiz-head, #quiz .quiz-nav, #quiz > progress');
    var bottom = 0;
    for (var i = 0; i < bars.length; i++) {
      var cs = window.getComputedStyle(bars[i]);
      if (cs.position !== 'sticky' && cs.position !== 'fixed') continue;
      var r = bars[i].getBoundingClientRect();
      if (r.height && r.bottom > bottom) bottom = r.bottom;
    }
    return bottom;
  }

  function dockHeight() {
    var d = document.querySelector('#quiz #nextBtn, #quiz .actions');
    if (!d) return 0;
    var cs = window.getComputedStyle(d);
    if (cs.position !== 'fixed') return 0;
    return d.getBoundingClientRect().height;
  }

  function reveal() {
    var el = document.querySelector(SEL);
    if (!el) return;
    if (seen) { if (seen.has(el)) return; seen.add(el); }

    requestAnimationFrame(function () {
      var r = el.getBoundingClientRect();
      if (!r.height) return;
      var top0 = stickyBottom() + 10;                 // ใต้แถบบนที่ปักอยู่
      var limit = window.innerHeight - dockHeight() - 12;
      if (r.bottom <= limit && r.top >= top0) return; // เห็นครบอยู่แล้ว

      // เฉลยสั้น: ดันให้ชิดแถบปุ่ม | เฉลยยาว: ให้หัวข้อเฉลยอยู่ใต้แถบบนพอดี
      var space = limit - top0;
      var want = r.height <= space ? limit - r.height : top0;
      var top = window.pageYOffset + r.top - want;
      if (top < 0) top = 0;
      try {
        window.scrollTo({ top: top, behavior: smooth ? 'smooth' : 'auto' });
      } catch (e) {
        window.scrollTo(0, top);
      }
    });
  }

  function boot() {
    var q = document.getElementById('quiz');
    if (!q) { setTimeout(boot, 400); return; }
    new MutationObserver(reveal).observe(q, {
      subtree: true, childList: true,
      attributes: true, attributeFilter: ['class', 'hidden', 'style']
    });
    reveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
