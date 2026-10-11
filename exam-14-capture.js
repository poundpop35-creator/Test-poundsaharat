/* Executed after each complete bank, before the next bank replaces ROLE_SPRINT. */
(() => {
  const d = window.ROLE_SPRINT;
  if (d && window.EXAM14) window.EXAM14.banks[d.id] = d;
})();
