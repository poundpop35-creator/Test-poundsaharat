// Resolve existing bookmarks as well as links from the shared menu.
(() => {
  const dashboard = document.getElementById('dashboard');
  const quiz = document.getElementById('quiz');
  const result = document.getElementById('result');
  const panels = [...dashboard.querySelectorAll('.energy-panel')];
  const links = [...dashboard.querySelectorAll('.energy-tabs a')];
  const routes = {dashboard: 'start', topicButtons: 'topics', briefing: 'reading', history: 'history'};

  function navigate() {
    const hash = location.hash.slice(1);
    if (hash === 'resume') return;
    const target = document.getElementById(hash);
    const section = routes[hash] || target?.closest('.energy-panel')?.id.slice(6);
    if (hash && !section) return;
    dashboard.hidden = false;
    quiz.hidden = result.hidden = true;
    const active = section || 'start';
    for (const panel of panels) panel.hidden = panel.id !== 'panel-' + active;
    for (const link of links) {
      if (link.dataset.panel === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    if (hash && !routes[hash] && target) {
      const fold = target.closest('details');
      if (fold) fold.open = true;
      target.scrollIntoView();
    } else window.scrollTo(0, 0);
  }

  function updateQuizLayout() {
    document.body.classList.toggle('quiz-active', !quiz.hidden);
  }
  new MutationObserver(updateQuizLayout).observe(quiz, {attributes: true, attributeFilter: ['hidden']});
  window.addEventListener('hashchange', navigate);
  navigate();
  updateQuizLayout();
})();
