(function () {
  'use strict';
  const catalog=window.STUDY_CATALOG||[];
  const selected=catalog.find(p=>p.id===new URLSearchParams(location.search).get('page'));
  if(!selected){location.replace('index.html');return;}
  const frame=document.getElementById('study-frame');
  const loading=document.getElementById('study-loading'),error=document.getElementById('study-error');
  const base=new URL('.',location.href),version='20261006';
  document.title=selected.short+' — คลังติว';frame.title=selected.title+' · '+selected.role;
  document.getElementById('study-original').href=selected.file+location.hash;
  function failed(){loading.hidden=true;error.hidden=false;}
  const timeout=setTimeout(failed,20000);
  function asset(doc,tag,attrs){return new Promise((resolve,reject)=>{const el=doc.createElement(tag);Object.assign(el,attrs);el.onload=resolve;el.onerror=reject;doc.head.append(el);});}
  frame.addEventListener('load',async()=>{
    try{
      const doc=frame.contentDocument,win=frame.contentWindow;
      if(!doc||!doc.querySelector('main,body > .wrap'))throw Error('Content not available');
      doc.body.classList.add('study-app','app-legacy');
      await asset(doc,'link',{rel:'stylesheet',href:'app-shell.css?v='+version});
      await asset(doc,'script',{src:'app-catalog.js?v='+version});
      await asset(doc,'script',{src:'app-shell.js?v='+version});
      // Keep navigation at the top level while respecting the quiz exit guard.
      doc.addEventListener('click',e=>{
        if(e.defaultPrevented)return;
        const link=e.target.closest('a[href]');if(!link||link.hasAttribute('download'))return;
        const raw=link.getAttribute('href');if(!raw||raw.startsWith('#'))return;
        const url=new URL(link.href);
        if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
        const file=url.pathname.slice(base.pathname.length);
        const item=catalog.find(p=>p.file===file);
        const known=item||file==='index.html'||file==='study.html'||catalog.some(p=>p.sprint===file);
        if(!known)return;
        const destination=item?win.StudyUI.href(item.file,url.hash):url.href;
        link.href=destination;link.target='_top';
        if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
        e.preventDefault();location.assign(new URL(destination,base).href);
      });
      clearTimeout(timeout);loading.hidden=true;error.hidden=true;frame.dataset.ready='true';
      frame.dispatchEvent(new CustomEvent('study:ready'));
    }catch(_){clearTimeout(timeout);failed();}
  });
  window.addEventListener('message',e=>{
    if(e.source!==frame.contentWindow||e.origin!==location.origin||e.data?.type!=='study:hash')return;
    const hash=e.data.hash;if(typeof hash!=='string'||(hash&&!hash.startsWith('#')))return;
    if(hash!==location.hash)history.replaceState(null,'',location.pathname+location.search+hash);
  });
  window.addEventListener('hashchange',()=>{
    if(frame.dataset.ready&&frame.contentWindow.location.hash!==location.hash)frame.contentWindow.location.hash=location.hash;
  });
  frame.src=selected.file+location.hash;
})();
