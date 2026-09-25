/* KasirQuh Customer — KQ Icons
 * Original local SVG icon set, 24x24, 2px rounded stroke.
 * Visual language is intentionally unified across the customer UI.
 */
(function(){
  'use strict';
  const paths = {
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
    bag:'<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    cart:'<path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>',
    chat:'<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.5-3.4A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
    settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1a2 2 0 0 0 2.8-2.8l-.1-.1a2 2 0 0 1 0-2.4l.1-.1a2 2 0 0 0-2.8-2.8l-.1.1a2 2 0 0 1-2.4 0l-.1-.1a2 2 0 0 0-2.8 2.8l.1.1a2 2 0 0 1 0 2.4l-.1.1a2 2 0 0 0 2.8 2.8l.1-.1a2 2 0 0 1 2.4 0Z"/>',
    logout:'<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M8 12h10"/>',
    package:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9"/>',
    share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    coin:'<circle cx="12" cy="12" r="8"/><path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 3-5 1-5 4a2.5 2.5 0 0 0 5 0M12 6.5v11"/>',
    receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    send:'<path d="m3 11 18-8-8 18-2-7-8-3Z"/><path d="m11 14 5-5"/>',
    camera:'<path d="M4 7h4l2-2h4l2 2h4v12H4V7Z"/><circle cx="12" cy="13" r="3.5"/>',
    scan:'<path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"/><path d="M7 12h10"/>',
    bagCart:'<path d="M5 8h11l-1 9H6L5 8Z"/><path d="M8 8V6a3 3 0 0 1 6 0v2"/><path d="M18 11h3l1 5"/>',
    message:'<path d="M20 11a7 7 0 0 1-8 7 8 8 0 0 1-4-.9L4 20l1.5-3.5A7 7 0 1 1 20 11Z"/>'
  };
  function icon(name, cls, label){
    const body = paths[name] || paths.package;
    const aria = label ? ' aria-label="'+String(label).replace(/"/g,'&quot;')+'" role="img"' : ' aria-hidden="true"';
    return '<svg class="kq-svg-icon '+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'+aria+'>'+body+'</svg>';
  }
  const map = {'🏠':'home','🛍️':'bag','🛒':'cart','🗨️':'chat','💬':'chat','👤':'user','🔍':'search','⚙️':'settings','🚪':'logout','📦':'package','⭐':'star','➕':'plus','➖':'minus','❌':'close','✅':'check','🪙':'coin','📋':'receipt','📤':'send','📷':'camera','📸':'camera','🔳':'scan'};
  function replaceKnownEmoji(root){
    if(!root) return;
    const walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      let value=node.nodeValue;
      if(!value || !Object.keys(map).some(k=>value.includes(k))) return;
      const frag=document.createDocumentFragment();
      let rest=value;
      const re=/🏠|🛍️|🛒|🗨️|💬|👤|🔍|⚙️|🚪|📦|⭐|➕|➖|❌|✅|🪙|📋|📤|📷|📸|🔳/u;
      while(true){
        const m=rest.match(re); if(!m){ if(rest) frag.appendChild(document.createTextNode(rest)); break; }
        const idx=m.index; if(idx) frag.appendChild(document.createTextNode(rest.slice(0,idx)));
        const span=document.createElement('span'); span.innerHTML=icon(map[m[0]],'kq-svg-inline'); frag.appendChild(span.firstChild);
        rest=rest.slice(idx+m[0].length);
      }
      node.parentNode?.replaceChild(frag,node);
    });
  }
  window.KQIcon = icon;
  window.KQReplaceIcons = replaceKnownEmoji;
  window.KQModules = window.KQModules || {};
  const old=window.KQModules.icons||{};
  window.KQModules.icons=Object.assign(old,{name:'icons',boot:function(){replaceKnownEmoji(document.body);}});
})();
