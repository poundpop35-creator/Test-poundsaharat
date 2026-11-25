(async () => {
  // Existing bookmarks keep leading to the relevant lesson; progress remains in its original key.
  const match = location.hash.match(/^#day-(\d+)-(rd|energy)$/);
  const agency = match?.[2] || (location.hash === '#rd' ? 'rd' : location.hash === '#energy' ? 'energy' : null);
  if (!agency) return;
  let hash = '#chapters';
  if (match) {
    try {
      const response = await fetch('question-banks/' + agency + '.json?v=20261125-chapters');
      if (response.ok) {
        const bank = await response.json();
        const chapter = bank.chapters.find(ch => (ch.lessons || []).some(l => l.legacyId === agency + '-' + Number(match[1])));
        if (chapter) hash = '#chapter/' + encodeURIComponent(chapter.id);
      }
    } catch (_) { /* The agency directory remains a useful destination offline. */ }
  }
  location.replace('question-bank.html?agency=' + agency + hash);
})();
