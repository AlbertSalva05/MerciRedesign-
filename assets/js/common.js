/* Marci Metzger Homes: common.js (generated, do not hand-edit). 1. Runtime  2. Footer smoke  3. App logic shared by all pages */
/* Marci Metzger Homes v3: tiny React-free runtime.
   Renders the same {{ }} template (sc-if / sc-for) with a keyed DOM patcher, and runs a class-based logic object. */
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const HOLE = /\{\{\s*([\w.$]+)\s*\}\}/g;
  const WHOLE = /^\s*\{\{\s*([\w.$]+)\s*\}\}\s*$/;
  const REMAP = { 'x-select': 'select', 'x-option': 'option' };
  const lookup = (path, scope) => {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
    let v = scope;
    for (const p of path.split('.')) { if (v == null) return undefined; v = v[p]; }
    return v;
  };
  const interp = (s, scope) => s.replace(HOLE, (_, p) => { const v = lookup(p, scope); return v == null || v === false ? '' : String(v); });
  const attrVal = (raw, scope) => { const m = raw.match(WHOLE); if (m) return lookup(m[1], scope); return raw.indexOf('{{') < 0 ? raw : interp(raw, scope); };

  let nid = 0;
  const tag = (n) => { if (n.__id === undefined) n.__id = ++nid; return n.__id; };

  function buildKids(node, scope, kp, out) { for (const c of node.childNodes) build(c, scope, kp, out); }
  function pushValue(v, k, out) {
    if (v == null || v === false || v === true) return;
    if (Array.isArray(v)) { v.forEach((x, i) => pushValue(x, k + '|' + i, out)); return; }
    if (typeof v === 'object' && v.__v) { out.push(withKeys(v, k)); return; }
    out.push({ t: '#', v: String(v), k });
  }
  function withKeys(v, k) {
    const kk = k + (v.key != null ? '#' + v.key : '');
    const c = [];
    (v.c || []).forEach((x, i) => pushValue(x, kk + '/' + i, c));
    return { t: v.t, ns: v.t === 'svg' ? SVGNS : null, p: v.p, c, k: kk };
  }
  function build(node, scope, kp, out) {
    if (node.nodeType === 3) {
      const s = node.nodeValue, k = tag(node) + kp;
      if (s.indexOf('{{') < 0) { out.push({ t: '#', v: s, k }); return; }
      const m = s.match(WHOLE);
      if (m) { pushValue(lookup(m[1], scope), k, out); return; }
      out.push({ t: '#', v: interp(s, scope), k });
      return;
    }
    if (node.nodeType !== 1) return;
    const name = node.localName;
    if (name === 'sc-if') { if (attrVal(node.getAttribute('value') || '', scope)) buildKids(node, scope, kp + '.' + tag(node), out); return; }
    if (name === 'sc-for') {
      const list = attrVal(node.getAttribute('list') || '', scope) || [];
      const as = node.getAttribute('as') || 'item';
      const id = tag(node);
      list.forEach((it, i) => { const s = Object.create(scope); s[as] = it; s.$index = i; buildKids(node, s, kp + '.' + id + ':' + i, out); });
      return;
    }
    const p = {};
    for (const a of node.attributes) { if (a.name.indexOf('hint-') === 0) continue; p[a.name] = attrVal(a.value, scope); }
    const v = { t: REMAP[name] || name, ns: node.namespaceURI === SVGNS ? SVGNS : null, p, c: [], k: tag(node) + kp };
    buildKids(node, scope, kp, v.c);
    out.push(v);
  }

  const kebab = (s) => s.indexOf('-') >= 0 ? s : s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  function parseStyle(st) {
    const o = {};
    if (!st) return o;
    if (typeof st === 'object') { for (const k in st) if (st[k] != null && st[k] !== '') o[kebab(k)] = String(st[k]); return o; }
    let depth = 0, cur = '';
    const parts = [];
    for (const ch of String(st)) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ';' && !depth) { parts.push(cur); cur = ''; } else cur += ch; }
    parts.push(cur);
    for (const d of parts) { const i = d.indexOf(':'); if (i < 0) continue; const k = d.slice(0, i).trim(); const val = d.slice(i + 1).trim(); if (k && val) o[k.toLowerCase().indexOf('--') === 0 ? k : k.toLowerCase()] = val; }
    return o;
  }
  function applyStyles(el) {
    const s = el.__st || {};
    const m = Object.assign({}, s.base, el.__hov ? s.hover : null, el.__foc ? s.focus : null);
    const prev = el.__applied || {};
    for (const k in prev) if (!(k in m)) el.style.removeProperty(k);
    for (const k in m) if (prev[k] !== m[k]) el.style.setProperty(k, m[k]);
    el.__applied = m;
  }
  function ensurePseudo(el) {
    if (el.__pseudo) return;
    el.__pseudo = true;
    el.addEventListener('mouseenter', () => { el.__hov = true; applyStyles(el); });
    el.addEventListener('mouseleave', () => { el.__hov = false; applyStyles(el); });
    el.addEventListener('focus', () => { el.__foc = true; applyStyles(el); });
    el.addEventListener('blur', () => { el.__foc = false; applyStyles(el); });
  }
  const evName = (el, n) => { const e = n.slice(2).toLowerCase(); if (e === 'change' && (el.localName === 'input' || el.localName === 'textarea')) return 'input'; if (e === 'doubleclick') return 'dblclick'; return e; };
  function setProps(el, p) {
    const prev = el.__p || {};
    el.__st = el.__st || {};
    for (const n in p) if (n.indexOf('on') === 0 && typeof p[n] === 'function') {
      const e = evName(el, n);
      el.__h = el.__h || {};
      if (!el.__h[e]) el.addEventListener(e, (ev) => { const f = el.__h[e]; f && f(ev); }, e.indexOf('touch') === 0 ? { passive: true } : false);
      el.__h[e] = p[n];
    }
    if (el.__h) for (const e in el.__h) { if (!Object.keys(p).some(n => n.indexOf('on') === 0 && evName(el, n) === e && typeof p[n] === 'function')) el.__h[e] = null; }
    let styleDirty = false;
    for (const n in p) {
      const v = p[n];
      if (n.indexOf('on') === 0 && typeof v === 'function') continue;
      if (n === 'key') continue;
      if (n === 'ref') { if (v && typeof v === 'object') v.current = el; else if (typeof v === 'function') v(el); continue; }
      if (n === 'style') { if (prev.style !== v) { el.__st.base = parseStyle(v); styleDirty = true; } continue; }
      if (n === 'style-hover' || n === 'style-focus') { const k = n.slice(6); if (prev[n] !== v) { el.__st[k] = parseStyle(v); styleDirty = true; ensurePseudo(el); } continue; }
      if (prev[n] === v && n !== 'value') continue;
      if (n === 'value' && 'value' in el && el.localName !== 'option') { if (el.value !== String(v ?? '')) el.value = v ?? ''; continue; }
      if (n === 'checked' || n === 'selected') { el[n] = !!v; continue; }
      if (n === 'classname') { el.setAttribute('class', v); continue; }
      if (v == null || v === false && !(n.indexOf('aria-') === 0 || n === 'draggable')) { el.removeAttribute(n); continue; }
      if (typeof v === 'function' || (typeof v === 'object')) continue;
      const attr = n === 'htmlfor' ? 'for' : n;
      el.setAttribute(attr, v === true ? (n.indexOf('aria-') === 0 || n.indexOf('data-') === 0 ? 'true' : '') : String(v));
    }
    for (const n in prev) if (!(n in p)) {
      if (n === 'style') { el.__st.base = {}; styleDirty = true; } else if (n.indexOf('on') !== 0 && n !== 'ref' && n !== 'key' && n.indexOf('style-') !== 0) el.removeAttribute(n);
    }
    if (styleDirty) applyStyles(el);
    el.__p = p;
  }
  function create(v, svg) {
    if (v.t === '#') { const n = document.createTextNode(v.v); n.__k = v.k; n.__t = '#'; return n; }
    const isSvg = svg || v.ns === SVGNS || v.t === 'svg';
    const el = isSvg ? document.createElementNS(SVGNS, v.t) : document.createElement(v.t);
    el.__k = v.k; el.__t = v.t;
    setProps(el, v.p);
    patch(el, v.c, isSvg && v.t !== 'foreignObject');
    return el;
  }
  function patch(parent, list, svg) {
    if (parent.__lock) return;
    const existing = new Map();
    for (const n of parent.childNodes) if (n.__k !== undefined) existing.set(n.__k, n);
    const keep = new Set();
    let cursor = parent.firstChild;
    for (const v of list) {
      let el = existing.get(v.k);
      if (el && el.__t !== v.t) el = null;
      if (!el) el = create(v, svg);
      else if (v.t === '#') { if (el.nodeValue !== v.v) el.nodeValue = v.v; }
      else { setProps(el, v.p); patch(el, v.c, svg || v.t === 'svg'); }
      keep.add(el);
      while (cursor && cursor.__k === undefined) cursor = cursor.nextSibling;
      if (el === cursor) cursor = cursor.nextSibling;
      else parent.insertBefore(el, cursor);
    }
    for (const n of Array.from(parent.childNodes)) if (n.__k !== undefined && !keep.has(n)) parent.removeChild(n);
  }

  window.React = {
    createRef: () => ({ current: null }),
    createElement: (t, props, ...kids) => {
      const p = Object.assign({}, props || {});
      const key = p.key; delete p.key;
      const out = {};
      for (const n in p) out[n.indexOf('on') === 0 ? n.toLowerCase() : (n === 'className' ? 'class' : n === 'htmlFor' ? 'for' : n)] = p[n];
      return { __v: true, t, p: out, c: kids.flat(Infinity), key };
    }
  };
  let current = null, pending = false, cbs = [];
  function render(first) {
    const c = current;
    const vals = c.renderVals();
    const out = [];
    buildKids(c.__tpl, vals, '', out);
    patch(c.__root, out, false);
    if (!first && c.componentDidUpdate) c.componentDidUpdate();
    const q = cbs; cbs = []; q.forEach(f => f());
  }
  let burst = 0, burstT = 0;
  function schedule() {
    if (pending) return;
    const now = performance.now();
    if (now - burstT > 1000) { burstT = now; burst = 0; }
    if (++burst > 120) { if (burst === 121) console.error('v3 runtime: render loop detected', new Error().stack); return; }
    pending = true; queueMicrotask(() => { pending = false; try { render(false); } catch (e) { console.error(e); } });
  }
  window.DCLogic = class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(u, cb) {
      const next = typeof u === 'function' ? u(this.state, this.props) : u;
      if (next != null) this.state = Object.assign({}, this.state, next);
      if (cb) cbs.push(cb);
      if (this.__mounted) schedule();
    }
    forceUpdate(cb) { if (cb) cbs.push(cb); schedule(); }
  };
  window.mountDC = function (Component, root, tpl, props) {
    current = new Component(props);
    current.__root = root; current.__tpl = tpl;
    try { render(true); } catch (e) { console.error('v3 first render failed', e); }
    current.__mounted = true;
    if (current.componentDidMount) current.componentDidMount();
    window.addEventListener('pagehide', () => current.componentWillUnmount && current.componentWillUnmount());
  };
})();

(function () {
  if (customElements.get('mm-smoke')) return;
  class MMSmoke extends HTMLElement {
    connectedCallback() {
      Object.assign(this.style, { display: 'block', position: 'absolute', top: 'auto', right: '0', bottom: '0', left: '0', height: '360px', overflow: 'hidden', pointerEvents: 'none', WebkitMaskImage: 'linear-gradient(0deg,#000 0%,#000 55%,transparent 100%)', maskImage: 'linear-gradient(0deg,#000 0%,#000 55%,transparent 100%)' });
      this.setAttribute('aria-hidden', 'true');
      this.init();
    }
    disconnectedCallback() {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.io && this.io.disconnect();
      this.ro && this.ro.disconnect();
      if (this.renderer) { this.renderer.dispose(); this.renderer.domElement.remove(); }
    }
    async init() {
      let THREE;
      try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'); } catch (e) { return; }
      if (this.dead) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setClearColor(0x000000, 0);
      Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
      this.appendChild(renderer.domElement);
      this.renderer = renderer;
      const scene = new THREE.Scene(), camera = new THREE.Camera();
      const C = hex => { const v = parseInt(hex.slice(1), 16); return new THREE.Vector3((v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255); };
      const uniforms = {
        uTime: { value: 0 }, uAspect: { value: 1 },
        uLight: { value: C('#F0D3CC') }, uTint: { value: C('#B4838D') }, uDeep: { value: C('#7A5866') }, uStrength: { value: 1.0 }, uH: { value: 360 }, uBg: { value: C('#161616') }
      };
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
          precision mediump float;
          uniform float uTime, uAspect, uStrength, uH; uniform vec3 uLight, uTint, uDeep, uBg; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
          float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8); for (int i = 0; i < 5; i++){ v += a * n(p); p = r * p * 2.02; a *= 0.5; } return v; }
          void main(){
            vec2 uv = vec2(vUv.x * uAspect, vUv.y);
            float t = uTime * 0.07;
            vec2 q = vec2(fbm(uv * 1.4 + vec2(t, 0.0)), fbm(uv * 1.4 + vec2(-t * 0.7, t * 0.4) + 5.2));
            float s = fbm(uv * 2.0 + q * 1.6 + vec2(t * 1.3, -t * 0.3));
            float edge = 0.42 + 0.10 * sin(vUv.x * 5.0 + uTime * 0.28) + 0.06 * sin(vUv.x * 11.0 - uTime * 0.4) + (s - 0.5) * 0.18;
            float body = 1.0 - smoothstep(edge - 0.22, edge, uv.y);
            float rim = exp(-pow((uv.y - edge) / 0.035, 2.0));
            float smoke = 0.55 + 0.45 * smoothstep(0.3, 0.8, s);
            float gx = 0.5 + 0.5 * sin(vUv.x * 3.1 + uTime * 0.12);
            vec3 base = mix(uDeep, uTint, gx);
            vec3 col = mix(base, uLight, rim * 0.85);
            float alpha = clamp(body * smoke * 0.75 + rim * 0.75, 0.0, 0.9) * uStrength;
            gl_FragColor = vec4(col * alpha, alpha);
          }`
      }));
      quad.frustumCulled = false;
      scene.add(quad);
      const size = () => {
        const w = Math.max(1, this.clientWidth), h = Math.max(1, this.clientHeight);
        renderer.setSize(w, h, false);
        uniforms.uAspect.value = w / h; uniforms.uH.value = h;
        if (reduce || !this.running) renderer.render(scene, camera);
      };
      this.ro = new ResizeObserver(size);
      this.ro.observe(this);
      size();
      if (reduce) { uniforms.uTime.value = 8; renderer.render(scene, camera); return; }
      const t0 = performance.now();
      const tick = () => {
        if (this.dead || !this.running) return;
        uniforms.uTime.value = (performance.now() - t0) / 1000;
        renderer.render(scene, camera);
        this.raf = requestAnimationFrame(tick);
      };
      this.io = new IntersectionObserver(([e]) => {
        const was = this.running;
        this.running = e.isIntersecting;
        if (this.running && !was) this.raf = requestAnimationFrame(tick);
      });
      this.io.observe(this);
    }
  }
  customElements.define('mm-smoke', MMSmoke);
})();

/* Marci Metzger Homes: app.js (generated from v2, shared by all pages). Requires runtime.js. */
const GALLERY = [
  ['Aerial view of a community clubhouse with tennis and pickleball courts, a lawn and palm trees, with the valley behind', 'Community clubhouse', 'Tennis and pickleball courts beside the lawn'],
  ['Aerial view of a row of single-story homes along a street, with a green lawn and pond behind', 'Single-story homes', 'A quiet street backing onto a pond and lawn'],
  ['Aerial view of a resort-style community pool among palm trees, beside a golf course and lake with mountains beyond', 'Resort-style pool', 'Palms, a lake and the golf course beyond'],
  ['Sunlit corner room with a red leather armchair and floor-to-ceiling windows onto a desert garden', 'Sunlit reading corner', 'Floor-to-ceiling windows onto a desert garden'],
  ['Aerial view of a cul-de-sac of tile-roofed homes with desert landscaping and snow-capped mountains beyond', 'Cul-de-sac living', 'Tile roofs, desert landscaping and mountain views'],
  ['Aerial view of a tile-roofed home with a private pool and spa, trees and snow-capped mountains beyond', 'Private pool and spa', 'Backing onto open land with the mountains beyond'],
  ['Aerial view of a community clubhouse with pickleball courts and a roundabout, mountains on the horizon', 'Clubhouse and courts', 'Pickleball courts with mountains on the horizon']
].map(([alt, title, desc], i) => ({ alt, title, desc, src: `assets/img/top/img_gallery_0${i + 1}_hq.jpg`, file: `img_gallery_0${i + 1}_hq.jpg` }));
const BADGES = [
  { src: 'assets/img/top/icn_badge_01.png', alt: 'The Ridge Realty Group' },
  { src: 'assets/img/top/icn_badge_02.png', alt: 'Equal Housing Opportunity' },
  { src: 'assets/img/top/icn_badge_03.png', alt: 'REALTOR® member pin' },
  { src: 'assets/img/top/icn_badge_04.png', alt: 'Pahrump Valley Chamber of Commerce' }
];
const SELECTS = [
  { id: 'f-location', name: 'location', label: 'Location', icon1: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', icon2: 'M12 12.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5', icon3: '',
    options: ['Any','Alamo','Alton','Amargosa Valley','Beatty','Beryl','Blue Diamond','Boulder City','Brian Head','Cal Nev Ari','Caliente','Cedar City','Cold Creek','Crystal','Duck Creek Village','Dyer','Elko','Ely','Goldfield','Goodsprings','Hatch','Henderson','Indian Springs','Jean','Las Vegas','Laughlin','Logandale','Mc Gill','Mesquite','Moapa','Mount Charleston','Mountain Springs','Nelson','North Las Vegas','Other','Overton','Pahrump','Palm Gardens','Panaca','Parowan','Pioche','Ruth','Sandy Valley','Searchlight','Tonopah'] },
  { id: 'f-type', name: 'type', label: 'Type', icon1: 'M3 21h18', icon2: 'M5 21V10l7-5 7 5v11', icon3: 'M10 21v-6h4v6', options: ['Any','Land','Residential Lease','High Rise','Residential'] },
  { id: 'f-beds', name: 'beds', label: 'Bedrooms', icon1: 'M3 18V7', icon2: 'M3 14h18v4', icon3: 'M21 14v-2a3 3 0 0 0-3-3h-7v5', options: ['Any Number','Studio','1+','2+','3+','4+','5+','6+'] },
  { id: 'f-baths', name: 'baths', label: 'Baths', icon1: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z', icon2: 'M6 12V5a2 2 0 0 1 4 0', icon3: 'M7 19l-1 2M17 19l1 2', options: ['Any Number','1+','2+','3+','4+','5+','6+'] }
];
const SORTS = ['Newest','Oldest','Least Expensive to Most','Most Expensive to Least','Bedrooms (Low to High)','Bedrooms (High to Low)','Bathrooms (Low to High)','Bathrooms (High to Low)'];
const NAV = [
  { label: 'Home', href: '#home', id: 'home', i1: 'M3 11l9-7 9 7', i2: 'M5 10v10h14V10', i3: 'M10 20v-5h4v5' },
  { label: 'About', href: '#about', id: 'about', i1: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8', i2: 'M4 21a8 8 0 0 1 16 0', i3: '' },
  { label: 'Search Homes', href: '#listings', id: 'listings', i1: 'M11 18a7 7 0 1 0 0-14a7 7 0 1 0 0 14', i2: 'M20 20l-3.5-3.5', i3: '' },
  { label: 'Gallery', href: '#gallery', id: 'gallery', i1: 'M4 5h16v14H4z', i2: 'M4 16l5-5 4 4 3-3 4 4', i3: '' },
  { label: 'Contact', href: '#contact', id: 'contact', i1: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', i2: 'M3 7l9 6 9-6', i3: '' }
];
const PAGES = [
  { label: 'Listings', href: 'listings.html', id: 'listings', desc: 'Current listings and what\'s new', i1: 'M3 11l9-7 9 7', i2: 'M5 10v10h14V10', i3: 'M10 20v-5h4v5' },
  { label: "Let's Move", href: 'lets-move.html', id: 'lets-move', desc: 'Contact us, hours and directions', i1: 'M8 19a4 4 0 1 0 0-8a4 4 0 1 0 0 8', i2: 'M11 12l9-9', i3: 'M16 7l3 3' },
  { label: 'About Us', href: 'about-us.html', id: 'about', desc: 'Meet Marci J Metzger', i1: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8', i2: 'M4 21a8 8 0 0 1 16 0', i3: '' }
];
const ROUTES = { '#/listings': 'listings', '#/lets-move': 'lets-move', '#/about-us': 'about' };
const parseRoute = () => (document.body && document.body.dataset.route) || 'home';
const TITLES = { home: 'Marci Metzger Homes | Pahrump Realtor | The Ridge Realty Group', listings: 'Listings | Marci Metzger Homes | Pahrump Real Estate', 'lets-move': "Let's Move | Contact Marci Metzger Homes | Pahrump, NV", about: 'About Us | Marci Metzger | The Ridge Realty Group' };
const SPY = [['home','home'],['about','about'],['get-it-sold','about'],['listings','listings'],['gallery','gallery'],['services','gallery'],['contact','contact']];
const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/MarciHomes/', path: 'M20 12.047C20 7.603 16.418 4 12 4s-8 3.603-8 8.047c0 4.017 2.925 7.346 6.75 7.95v-5.624H8.719v-2.326h2.031v-1.773c0-2.017 1.194-3.13 3.022-3.13.875 0 1.79.157 1.79.157v1.98h-1.008c-.994 0-1.304.62-1.304 1.257v1.51h2.219l-.355 2.325H13.25v5.624c3.825-.604 6.75-3.933 6.75-7.95z' },
  { label: 'Instagram', href: 'https://www.instagram.com/marcimetzger_theridge/', path: 'M14.667 12a2.57 2.57 0 0 0-.782-1.885A2.57 2.57 0 0 0 12 9.333a2.57 2.57 0 0 0-1.885.782A2.57 2.57 0 0 0 9.333 12c0 .736.26 1.365.782 1.885.52.521 1.149.782 1.885.782a2.57 2.57 0 0 0 1.885-.782c.521-.52.782-1.149.782-1.885zm1.437 0c0 1.139-.4 2.108-1.198 2.906-.798.799-1.767 1.198-2.906 1.198-1.139 0-2.108-.4-2.906-1.198-.799-.798-1.198-1.767-1.198-2.906 0-1.139.4-2.108 1.198-2.906.798-.799 1.767-1.198 2.906-1.198 1.139 0 2.108.4 2.906 1.198.799.798 1.198 1.767 1.198 2.906zm1.125-4.27c0 .263-.094.489-.281.676a.923.923 0 0 1-.677.282.923.923 0 0 1-.677-.282.923.923 0 0 1-.281-.677c0-.264.093-.49.28-.677a.923.923 0 0 1 .678-.281c.264 0 .49.094.677.281a.923.923 0 0 1 .281.677zM12 5.437l-.797-.006a56.514 56.514 0 0 0-1.099 0c-.25.004-.585.014-1.005.032-.42.017-.778.052-1.073.104a4.177 4.177 0 0 0-.745.192c-.347.14-.653.34-.916.605-.264.263-.466.569-.605.916-.076.202-.14.45-.192.745a8.255 8.255 0 0 0-.104 1.073c-.018.42-.028.755-.032 1.005-.003.25-.003.616 0 1.1l.006.796-.006.797c-.003.483-.003.849 0 1.099.004.25.014.585.032 1.005.017.42.052.778.104 1.073.052.295.116.543.192.745.14.347.34.653.605.916.263.264.569.466.916.605.202.076.45.14.745.192.295.052.653.087 1.073.104.42.018.755.028 1.005.032.25.003.616.003 1.1 0l.796-.005.797.005c.483.003.849.003 1.099 0 .25-.004.585-.014 1.005-.032.42-.017.778-.052 1.073-.104.295-.052.543-.116.745-.192.347-.14.653-.34.916-.605.264-.263.466-.569.605-.916.076-.202.14-.45.192-.745.052-.295.087-.653.104-1.073.018-.42.028-.755.032-1.005.003-.25.003-.616 0-1.1L18.562 12l.006-.797c.003-.483.003-.849 0-1.099a38.59 38.59 0 0 0-.032-1.005 8.255 8.255 0 0 0-.104-1.073 4.177 4.177 0 0 0-.192-.745 2.703 2.703 0 0 0-.605-.916 2.703 2.703 0 0 0-.916-.605 4.177 4.177 0 0 0-.745-.192 8.255 8.255 0 0 0-1.073-.104c-.42-.018-.755-.028-1.005-.032-.25-.003-.616-.003-1.1 0L12 5.438zM20 12c0 1.59-.017 2.691-.052 3.302-.07 1.445-.5 2.563-1.292 3.354-.791.792-1.91 1.222-3.354 1.292-.611.035-1.712.052-3.302.052s-2.691-.017-3.302-.052c-1.445-.07-2.563-.5-3.354-1.292-.792-.791-1.222-1.91-1.292-3.354C4.017 14.691 4 13.59 4 12s.017-2.691.052-3.302c.07-1.445.5-2.563 1.292-3.354.791-.792 1.91-1.222 3.354-1.292C9.309 4.017 10.41 4 12 4s2.691.017 3.302.052c1.445.07 2.563.5 3.354 1.292.792.791 1.222 1.91 1.292 3.354.035.611.052 1.712.052 3.302z' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/marci-metzger-30642496/', path: 'M5.181 4h13.634C19.468 4 20 4.518 20 5.153v13.692c0 .638-.532 1.155-1.184 1.155H5.181C4.53 20 4 19.483 4 18.845V5.153c0-.636.53-1.152 1.181-1.152zm3.754 3.574a1.376 1.376 0 00-2.752 0A1.38 1.38 0 007.56 8.95c.758 0 1.375-.618 1.375-1.376zM8.75 9.998H6.372v7.635H8.75V9.999zm1.485 0h.003v7.633h2.371v-3.777c0-.995.19-1.96 1.425-1.96 1.217 0 1.233 1.14 1.233 2.025v3.714h2.372v-4.188c0-2.056-.444-3.637-2.847-3.637-1.159 0-1.933.633-2.25 1.233h-.031V9.999h-2.273v-.002l-.003.002z' },
  { label: 'Yelp', href: 'https://www.yelp.com/biz/xr3yQN_m2SgO0R_7S6p62w', path: 'M9.988 14.158c-.037.01-3.983 1.134-4.224 1.134-.554-.029-.674-.515-.726-.99a6.35 6.35 0 0 1 .011-1.487c.07-.596.201-1.431.883-1.396.175 0 2.447.822 4.11 1.41.624.215.679 1.136-.054 1.33zm2.112-3.616c.065 1.213-.93 1.54-1.722.454L6.501 5.663c-.055-.21.011-.394.193-.553.57-.523 3.626-1.263 4.432-1.082.273.06.441.194.503.4.048.263.42 5.314.47 6.114zm-.051 5.232c0 .146.007 3.696-.062 3.857-.084.19-.256.308-.522.356-.368.054-.988-.06-1.86-.34-.803-.257-2.068-.682-1.798-1.349.102-.219 1.874-1.994 2.82-2.971.437-.483 1.45-.175 1.422.447zm6.572-3.74c-.204.118-4.041.896-4.307.972l.01-.02c-.66.15-1.29-.586-.85-1.098.136-.117 2.404-2.933 2.656-3.08.19-.113.412-.12.667-.018.671.28 2.01 2.003 2.094 2.686-.004.092.044.371-.27.558zm.368 4.15c-.098.654-1.623 2.33-2.327 2.571-.251.083-.47.064-.645-.063-.183-.111-2.254-3.083-2.367-3.248-.398-.514.248-1.263.933-1.054 0 0 4.03 1.133 4.184 1.25.19.131.262.312.222.544z' }
].map(s => ({ ...s, aria: `Marci Metzger on ${s.label} (opens in a new tab)` }));
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const toCss = (str) => Object.fromEntries(str.split(';').filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), d.slice(i + 1).trim()]; }));

class Component extends DCLogic {
  state = {
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    menuOpen: false, failed: {}, badgeFailed: {}, lb: -1,
    searchStatus: 'idle', searchMsg: '', contactStatus: 'idle', emailErr: false,
    cookieOk: store.get('mm_cookie_ok') === '1', now: Date.now(),
    scrolled: false, showTop: false, topDock: false, active: 'home', revealed: {}, marks: {}, heroIn: false, route: parseRoute(),
    reduce: typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
  setupMarks() {
    if (this.mio) this.mio.disconnect();
    const els = Array.from(document.querySelectorAll('[data-mark]'));
    if (this.state.reduce || !('IntersectionObserver' in window)) { const m = {}; els.forEach(e => { m[e.getAttribute('data-mark')] = true; }); this.setState({ marks: m }); return; }
    this.mio = new IntersectionObserver((es) => {
      const add = {};
      es.forEach(en => { if (en.isIntersecting) { add[en.target.getAttribute('data-mark')] = true; this.mio.unobserve(en.target); } });
      if (Object.keys(add).length) this.setState(st => ({ marks: { ...st.marks, ...add } }));
    }, { threshold: 0.6 });
    els.forEach(e => this.mio.observe(e));
  }
  afterRoute(hash) {
    document.title = TITLES[this.state.route];
    const id = hash && !hash.startsWith('#/') ? hash.slice(1) : null;
    const el = id ? document.getElementById(id) : null;
    if (el) this.scrollToEl(el, 'instant'); else window.scrollTo({ top: 0, behavior: 'instant' });
    const m = document.getElementById('main'); if (m && !el) m.focus({ preventScroll: true });
    setTimeout(() => { this.setupMarks(); this.setupText(); this.onScroll(); }, 80);
  }
  tlRef = React.createRef(); tlFill = React.createRef();
  updateTimeline() {
    const box = this.tlRef.current, fill = this.tlFill.current;
    if (!box || !fill) return;
    const vh = window.innerHeight, r = box.getBoundingClientRect();
    const p = this.state.reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
    fill.style.transform = `scaleY(${p})`;
    const act = this.state.tlActive || {};
    let changed = false; const next = { ...act };
    box.querySelectorAll('[data-tl]').forEach(el => {
      const k = el.getAttribute('data-tl');
      if (!next[k] && (this.state.reduce || el.getBoundingClientRect().top + el.offsetHeight * 0.3 < vh * 0.85)) { next[k] = true; changed = true; }
    });
    if (changed) this.setState({ tlActive: next });
  }
  heroRef = React.createRef(); heroFrame = React.createRef(); heroText = React.createRef(); heroCaption = React.createRef();
  updateHero() {
    const sec = this.heroRef.current, fr = this.heroFrame.current, tx = this.heroText.current, cap = this.heroCaption.current;
    if (!sec || !fr || !tx || !cap) return;
    if (this.state.reduce) { fr.style.clipPath = 'none'; tx.style.opacity = '1'; tx.style.transform = 'none'; cap.style.opacity = '0'; return; }
    const vh = window.innerHeight - 80, vw = window.innerWidth;
    const r = sec.getBoundingClientRect();
    const span = Math.max(1, r.height - vh);
    const p = Math.min(1, Math.max(0, (80 - r.top) / span));
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const t = e * vh * 0.05, b = e * vh * 0.16, x = e * Math.max(16, vw * 0.06), rad = e * 24;
    fr.style.clipPath = `inset(${t}px ${x}px ${b}px ${x}px round ${rad}px)`;
    const to = 1 - Math.min(1, p / 0.45);
    tx.style.opacity = String(to);
    tx.style.transform = `translateY(${-p * 48}px)`;
    tx.style.visibility = to < 0.02 ? 'hidden' : 'visible';
    cap.style.opacity = String(Math.min(1, Math.max(0, (p - 0.55) / 0.35)));
  }
  setupReveal() {
    const nodes = Array.from(document.querySelectorAll('[data-gal]'));
    if (this.state.reduce || !('IntersectionObserver' in window)) { const all = {}; nodes.forEach(n => { all[n.getAttribute('data-gal')] = 0; }); this.setState({ revealed: all }); return; }
    this.io = new IntersectionObserver((entries) => {
      const hits = entries.filter(en => en.isIntersecting).map(en => en.target).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      if (!hits.length) return;
      const add = {};
      hits.forEach((el, k) => { add[el.getAttribute('data-gal')] = k * 110; this.io.unobserve(el); });
      this.setState(s => ({ revealed: { ...s.revealed, ...add } }));
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
    nodes.forEach(n => this.io.observe(n));
  }
  splitWords(p) {
    const orig = Array.from(p.childNodes);
    if (!orig.every(n => n.nodeType === 3)) return null;
    const words = p.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment(); const spans = [];
    words.forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; } const s = document.createElement('span'); s.textContent = w; s.style.display = 'inline-block'; frag.appendChild(s); spans.push(s); });
    orig.forEach(n => n.remove()); p.__lock = true; p.appendChild(frag);
    return { orig, spans, restore: () => { while (p.firstChild) p.removeChild(p.firstChild); orig.forEach(n => p.appendChild(n)); p.__lock = false; } };
  }
  setupText() {
    this.tio && this.tio.disconnect();
    this.sio && this.sio.disconnect();
    if (this.state.reduce || !('IntersectionObserver' in window)) return;
    const main = document.getElementById('main'); if (!main) return;
    const ps = Array.from(main.querySelectorAll('p')).filter(p => (!p.dataset.rv || p.style.opacity === '0') && p.textContent.trim().length > 40 && !p.closest('form,button,a,label,blockquote,[aria-hidden="true"],[data-tl],[data-gal],#home,[role="dialog"]'));
    const quote = main.querySelector('[data-quote]');
    const anim = (el, delay) => el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    const runLines = (p) => {
      const sp = this.splitWords(p);
      if (!sp) { anim(p, 0); return; }
      const lines = []; let top = null;
      sp.spans.forEach(s => { const t = s.offsetTop; if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; } lines[lines.length - 1].push(s); });
      let last;
      lines.forEach((ln, i) => ln.forEach(s => { last = anim(s, i * 120); }));
      if (last) last.onfinish = () => sp.restore(); else sp.restore();
    };
    const runQuote = (q) => {
      const mark = q.querySelector('[data-quote-mark]');
      mark && mark.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.12)', offset: .6 }, { transform: 'scale(.96)', offset: .8 }, { opacity: 1, transform: 'scale(1)' }], { duration: 650, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
      let k = 0, last; const sps = [];
      q.querySelectorAll('p').forEach(p => { const sp = this.splitWords(p); if (sp) { sps.push(sp); sp.spans.forEach(s => { last = s.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 550 + k++ * 28, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); }); } });
      if (last) last.onfinish = () => sps.forEach(sp => sp.restore());
    };
    ps.forEach(p => { p.dataset.rv = '1'; p.style.opacity = '0'; });
    const qPending = quote && (!quote.dataset.rv || quote.style.opacity === '0');
    if (qPending) { quote.dataset.rv = '1'; quote.style.opacity = '0'; }
    this.tio = new IntersectionObserver((entries) => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; this.tio.unobserve(el); el.style.opacity = '';
      if (el.hasAttribute('data-quote')) runQuote(el); else runLines(el);
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    ps.forEach(p => this.tio.observe(p));
    if (qPending) this.tio.observe(quote);
    const cards = Array.from(main.querySelectorAll('[data-svc]')).filter(c => !c.dataset.rv || c.style.opacity === '0');
    if (cards.length) {
      cards.forEach(c => { c.dataset.rv = '1'; c.style.opacity = '0'; });
      this.sio && this.sio.disconnect();
      this.sio = new IntersectionObserver((entries) => {
        const hits = entries.filter(en => en.isIntersecting).map(en => en.target);
        hits.forEach(c => {
          this.sio.unobserve(c);
          const i = cards.indexOf(c) % 3;
          c.style.opacity = '';
          c.animate([{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: i * 160, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
          const img = c.querySelector('img');
          img && img.animate([{ transform: 'scale(1.08)', filter: 'saturate(.7)' }, { transform: 'scale(1)', filter: 'saturate(1)' }], { duration: 1400, delay: i * 160, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
      cards.forEach(c => this.sio.observe(c));
    }
    const rvs = Array.from(main.querySelectorAll('[data-reveal]')).filter(n => n.dataset.revealed !== '1');
    if (rvs.length) {
      if (this.state.reduce || !('IntersectionObserver' in window)) { rvs.forEach(n => { n.dataset.revealed = '1'; n.style.opacity = ''; }); }
      else {
        const K = { up: [{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'none' }], left: [{ opacity: 0, transform: 'translateX(-40px)' }, { opacity: 1, transform: 'none' }], right: [{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], img: [{ opacity: 0, transform: 'translateY(24px)', clipPath: 'inset(6% 6% 6% 6% round 4px)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0% 0% 0% 0% round 4px)' }], form: [{ opacity: 0, transform: 'translateY(40px)', boxShadow: '0 0 0 rgba(22,22,22,0)' }, { opacity: 1, transform: 'none', boxShadow: '0 0 0 rgba(22,22,22,0)' }] };
        const vh = window.innerHeight;
        rvs.forEach(n => { if (n.getBoundingClientRect().top > vh * 0.9) n.style.opacity = '0'; else { n.dataset.revealed = '1'; n.style.opacity = ''; } });
        this.rio && this.rio.disconnect();
        this.rio = new IntersectionObserver((entries) => {
          entries.forEach(en => {
            if (!en.isIntersecting) return;
            const n = en.target; this.rio.unobserve(n);
            if (n.dataset.revealed === '1') return;
            n.dataset.revealed = '1';
            const v = n.getAttribute('data-reveal'), i = +n.getAttribute('data-reveal-i') || 0, d = i * 140;
            n.style.opacity = '';
            const dur = v === 'img' ? 1200 : v === 'form' ? 1000 : 900, ez = 'cubic-bezier(.2,.8,.2,1)';
            n.animate(K[v] || K.up, { duration: dur, delay: d, easing: ez, fill: 'backwards' });
            if (v === 'form') Array.from(n.children).filter(c => c.offsetHeight).forEach((c, j) => c.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: d + 240 + j * 80, easing: ez, fill: 'backwards' }));
            n.querySelectorAll('[data-reveal-sub]').forEach(s => { const fr = s.getAttribute('data-reveal-sub') === 'frame'; s.animate(fr ? [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }] : [{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: d + (fr ? 450 : 750), easing: ez, fill: 'backwards' }); });
            const im = v === 'img' && n.querySelector('img');
            im && im.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 1600, delay: d, easing: 'cubic-bezier(.2,.8,.2,1)' });
          });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        rvs.filter(n => n.dataset.revealed !== '1').forEach(n => this.rio.observe(n));
      }
    }
  }
  componentDidMount() {
    document.documentElement.lang = 'en';
    this.onResize = () => this.setState(s => ({ w: window.innerWidth, menuOpen: window.innerWidth >= 960 ? false : s.menuOpen }));
    this.onKey = (e) => {
      if (this.state.lb >= 0) {
        if (e.key === 'Escape') this.closeLb();
        if (e.key === 'ArrowRight') this.stepLb(1);
        if (e.key === 'ArrowLeft') this.stepLb(-1);
      } else if (e.key === 'Escape' && (this.state.menuOpen || this.state.pagesOpen)) this.setState({ menuOpen: false, pagesOpen: false });
    };
    this.onScroll = () => {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        const y = window.scrollY, vh = window.innerHeight;
        const ft = document.getElementById('site-footer');
        const dock = !!ft && ft.getBoundingClientRect().top < vh - 24;
        let active = 'home';
        for (const [id, nav] of SPY) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= vh * 0.35) active = nav; }
        const next = { scrolled: y > 8, showTop: y > vh * 0.9, topDock: dock, active };
        const s = this.state;
        this.updateHero();
        this.updateTimeline();
        let addG = null, kG = 0;
        document.querySelectorAll('[data-gal]').forEach(el => { const k = el.getAttribute('data-gal'); if (this.state.revealed[k] === undefined && el.getBoundingClientRect().top < vh * 0.95) { (addG = addG || {})[k] = (kG++) * 90; } });
        if (addG) this.setState(st => ({ revealed: { ...st.revealed, ...addG } }));
        if (s.scrolled !== next.scrolled || s.showTop !== next.showTop || s.topDock !== next.topDock || s.active !== next.active) this.setState(next);
      });
    };
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.tick = setInterval(() => this.setState({ now: Date.now() }), 60000);
    window.addEventListener('resize', this.onScroll);
    this.onHash = () => {
      const r = parseRoute(), hash = location.hash;
      if (r !== this.state.route) this.setState({ route: r, marks: {}, menuOpen: false }, () => this.afterRoute(hash));
      else if (hash === '#/') window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', this.onHash);
    this.onPop = () => this.onHash();
    window.addEventListener('popstate', this.onPop);
    this.onLinkClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      const el = href.length > 1 ? document.getElementById(href.slice(1)) : null;
      if (!el) return;
      e.preventDefault();
      try { history.pushState(null, '', href); } catch (err) {}
      const wasOpen = this.state.menuOpen;
      this.setState({ menuOpen: false, pagesOpen: false }, () => requestAnimationFrame(() => this.scrollToEl(el, wasOpen ? 'instant' : 'smooth')));
    };
    if (location.hash.length > 1) { const el0 = document.getElementById(location.hash.slice(1)); if (el0) setTimeout(() => this.scrollToEl(el0, 'instant'), 120); }
    document.addEventListener('click', this.onLinkClick);
    if (this.state.route !== 'home') document.title = TITLES[this.state.route];
    this.onScroll();
    setTimeout(() => { this.setupReveal(); this.setupText(); }, 60);
    requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ heroIn: true })));
    setTimeout(() => {
      const els = Array.from(document.querySelectorAll('[data-mark]'));
      if (this.state.reduce || !('IntersectionObserver' in window)) { const m = {}; els.forEach(e => { m[e.getAttribute('data-mark')] = true; }); this.setState({ marks: m }); return; }
      this.mio = new IntersectionObserver((es) => {
        const add = {};
        es.forEach(en => { if (en.isIntersecting) { add[en.target.getAttribute('data-mark')] = true; this.mio.unobserve(en.target); } });
        if (Object.keys(add).length) this.setState(st => ({ marks: { ...st.marks, ...add } }));
      }, { threshold: 0.6 });
      els.forEach(e => this.mio.observe(e));
    }, 80);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    window.removeEventListener('hashchange', this.onHash);
    document.removeEventListener('click', this.onLinkClick);
    this.tio && this.tio.disconnect();
    this.sio && this.sio.disconnect();
    if (this.io) this.io.disconnect();
    if (this.mio) this.mio.disconnect();
    clearInterval(this.tick);
    document.body.style.overflow = '';
  }
  componentDidUpdate() {
    const want = this.state.lb >= 0;
    if (want !== !!this._locked) {
      const de = document.documentElement;
      if (want) { const sw = window.innerWidth - de.clientWidth; this._locked = true; de.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; document.body.style.paddingRight = sw > 0 ? sw + 'px' : ''; }
      else { this._locked = false; de.style.overflow = ''; document.body.style.overflow = ''; document.body.style.paddingRight = ''; }
    }
  }
  openLb(i) { this.lastFocus = document.activeElement; this.setState({ lb: i, lbDir: 0 }, () => { const b = document.querySelector('[data-lb-close]'); b && b.focus({ preventScroll: true }); }); }
  closeLb() { this.setState({ lb: -1 }, () => { this.lastFocus && this.lastFocus.focus({ preventScroll: true }); }); }
  stepLb(d) { this.setState(s => ({ lb: (s.lb + d + GALLERY.length) % GALLERY.length, lbDir: d, lbN: (s.lbN || 0) + 1 })); }
  lbTrack = React.createRef();
  headerH() { const hd = document.querySelector('.site-header'); return hd ? Math.round(hd.getBoundingClientRect().height) : 80; }
  scrollToEl(el, behavior) {
    const de = document.documentElement;
    const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smooth = behavior === 'smooth' && !rm;
    const target = () => Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - this.headerH()));
    const jump = (y) => { de.style.scrollBehavior = 'auto'; window.scrollTo(0, y); de.style.scrollBehavior = ''; };
    if (this._pin) cancelAnimationFrame(this._pin);
    clearTimeout(this.scrollFix);
    let aborted = false;
    const abort = () => { aborted = true; };
    ['wheel', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, abort, { once: true, passive: true }));
    const pin = () => {
      const start = performance.now();
      const step = () => {
        if (aborted) return;
        const t = target();
        if (Math.abs(window.scrollY - t) > 1) jump(t);
        if (performance.now() - start < 1200) this._pin = requestAnimationFrame(step);
      };
      this._pin = requestAnimationFrame(step);
    };
    if (smooth) { window.scrollTo({ top: target(), behavior: 'smooth' }); this.scrollFix = setTimeout(pin, 700); }
    else { requestAnimationFrame(() => requestAnimationFrame(() => { jump(target()); pin(); })); }
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  toTop = () => {
    const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' });
    const m = document.getElementById('main'); m && m.focus({ preventScroll: true });
  };
  pahrumpOpen() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false }).formatToParts(new Date(this.state.now));
    const h = parseInt(parts.find(p => p.type === 'hour').value, 10) % 24;
    return h >= 8 && h < 19;
  }
  onSearch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const num = (v) => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };
    const min = num(fd.get('min')), max = num(fd.get('max'));
    if (min !== null && max !== null && max < min) {
      this.setState({ searchStatus: 'error', searchMsg: 'Max Price is lower than Min Price. Raise the maximum or clear one of the fields.' });
      return;
    }
    this.setState({ searchStatus: 'loading', searchMsg: 'Opening listings on marcimetzger.com…' });
    setTimeout(() => {
      window.open('https://marcimetzger.com/listings', '_blank', 'noopener');
      this.setState({ searchStatus: 'idle', searchMsg: 'Listings opened in a new tab. Not seeing what you need? Call (206) 919-6886.' });
    }, 500);
  };
  onContact = (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.setState({ emailErr: true, contactStatus: 'error' }); form.querySelector('#c-email').focus(); return; }
    this.setState({ emailErr: false, contactStatus: 'sending' });
    const done = (ok) => { this.setState({ contactStatus: ok ? 'sent' : 'failed' }); if (ok) form.reset(); };
    if (/netlify\.app$/.test(location.hostname)) {
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() })
        .then(r => done(r.ok)).catch(() => done(false));
    } else setTimeout(() => done(true), 700);
  };
  renderVals() {
    const s = this.state;
    const isMobile = s.w < 960;
    const hdrMobile = s.w < 1180;
    const narrow = s.w < 640;
    const menuOpen = hdrMobile && s.menuOpen;
    const nCols = s.w >= 960 ? 3 : s.w >= 560 ? 2 : 1;
    const LAYOUT = {
      3: [[[0, '4/5'], [3, '1/1']], [[1, '3/2'], [4, '1/1'], [5, '3/2']], [[2, '1/1'], [6, '4/5']]],
      2: [[[0, '4/5'], [2, '3/2'], [4, '1/1'], [6, '3/2']], [[1, '1/1'], [3, '4/5'], [5, '4/5']]],
      1: [[[0, '4/5'], [1, '3/2'], [2, '1/1'], [3, '4/5'], [4, '3/2'], [5, '1/1'], [6, '3/2']]]
    }[nCols];
    const touch = isMobile;
    const gallery = GALLERY.map((g, i) => {
      const d = s.revealed[i];
      const shown = d !== undefined;
      const hov = s.hoverG === i;
      const failed = !!s.failed[i];
      return { ...g, idx: String(i), ok: !failed, failed, label: `Enlarge photo ${i + 1} of ${GALLERY.length}: ${g.title}`,
        reveal: { opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(28px)', transition: 'opacity 600ms cubic-bezier(.2,.8,.2,1), transform 700ms cubic-bezier(.2,.8,.2,1)', transitionDelay: (d || 0) + 'ms' },
        enter: () => this.setState({ hoverG: i }), leave: () => this.setState(st => (st.hoverG === i ? { hoverG: -1 } : null)),
        imgTf: hov ? 'scale(1.04)' : 'none', ovOp: hov || touch ? 1 : 0.75,
        hovOp: hov || touch ? 1 : 0, iconTf: hov ? 'none' : 'translateY(-6px)', descRows: hov || touch ? '1fr' : '0fr', open: () => this.openLb(i), onError: () => this.setState(st => ({ failed: { ...st.failed, [i]: true } })) };
    });
    const lbItem = s.lb >= 0 ? gallery[s.lb] : null;
    const open = this.pahrumpOpen();
    const cs = s.contactStatus;
    const showCookie = !s.cookieOk && this.props.showCookieNotice !== false;
    const topOn = s.showTop && !s.topDock;
    return {
      hdrShadow: s.scrolled || menuOpen ? 'var(--shadow-2)' : 'none',
      isDesktop: !isMobile, isMobile, menuOpen, menuClosed: !menuOpen,
      navItems: NAV.map(n => { const on = s.route === 'home' && n.id === s.active; return { ...n, href: s.route === 'home' ? n.href : 'index.html' + n.href, current: on ? 'true' : undefined, color: on ? 'var(--ink)' : 'var(--ink-2)', weight: on ? 600 : 400, line: on ? 'var(--accent)' : 'transparent', iconColor: on ? 'var(--accent)' : 'currentColor' }; }),
      menuText: menuOpen ? 'Close' : 'Menu',
      hdrMobile, hdrDesktop: !hdrMobile, aboutHeroCols: s.w >= 640 ? 'minmax(0,5fr) minmax(0,7fr)' : 'minmax(0,1fr)', aboutImgMax: s.w >= 640 ? '400px' : '100%', aboutImgRatio: s.w >= 640 ? '4/5' : '1/1', searchPadTop: (s.route === 'lets-move') ? 'clamp(32px,4vw,48px)' : 'clamp(40px,5vw,64px)', lmContactCols: s.w >= 1100 ? 'repeat(2,minmax(0,1fr))' : 'minmax(0,1fr)', weekDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => { const on = i === (new Date(s.now || Date.now()).getDay() + 6) % 7; return { day, current: on ? 'date' : undefined, bg: on ? 'var(--accent)' : 'var(--bg)', color: on ? '#FFFFFF' : 'var(--ink)', border: on ? 'var(--accent)' : 'var(--line)' }; }), mapRatio: s.w >= 960 ? '7/2' : s.w >= 640 ? '5/2' : '16/10', wallCols: s.w >= 640 ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)', wallH: s.w >= 960 ? '440px' : s.w >= 640 ? '400px' : '280px', wallUp: s.reduce ? 'none' : 'mmWallUp 40s linear infinite', wallDown: s.reduce ? 'none' : 'mmWallDown 40s linear infinite', lmStripCols: s.w < 640 ? '1fr' : 'repeat(3,minmax(0,1fr))', aboutImgJs: s.w < 720 ? 'start' : 'end',
      pagesOpen: !hdrMobile && !!s.pagesOpen, pagesOpenStr: s.pagesOpen ? 'true' : 'false', pagesChev: s.pagesOpen ? 'rotate(180deg)' : 'none',
      pagesLine: s.route !== 'home' ? 'var(--accent)' : 'transparent', pagesColor: s.route !== 'home' || s.pagesOpen ? 'var(--ink)' : 'var(--ink-2)', pagesWeight: s.route !== 'home' ? 600 : 500,
      togglePages: () => this.setState(st => ({ pagesOpen: !st.pagesOpen })),
      closePages: () => this.setState({ pagesOpen: false }),
      drawerNav: NAV.map(n => { const on = s.route === 'home' && n.id === s.active; return { ...n, href: s.route === 'home' ? n.href : 'index.html' + n.href, current: on ? 'true' : undefined, bg: on ? 'var(--bg-2)' : 'transparent', color: on ? 'var(--accent)' : 'var(--ink)' }; }),
      pageItems: PAGES.map(p => { const on = s.route === p.id; return { ...p, current: on ? 'page' : undefined, bg: on ? 'var(--bg-2)' : 'transparent', color: on ? 'var(--accent)' : 'var(--ink)' }; }),
      socials: SOCIALS,
      menuOpenStr: menuOpen ? 'true' : 'false', menuLabel: menuOpen ? 'Close menu' : 'Open menu',
      toggleMenu: () => this.setState(st => ({ menuOpen: !st.menuOpen })),
      closeMenu: () => this.setState({ menuOpen: false }),
      badges: BADGES.map((b, i) => ({ ...b, ok: !s.badgeFailed[i], onError: () => this.setState(st => ({ badgeFailed: { ...st.badgeFailed, [i]: true } })) })),
      selects: SELECTS, sorts: SORTS,
      onSearch: this.onSearch,
      searchBusy: s.searchStatus === 'loading',
      searchLabel: s.searchStatus === 'loading' ? 'Searching…' : 'Search Now',
      searchMsg: s.searchMsg, searchMsgColor: s.searchStatus === 'error' ? '#9B2C2C' : 'var(--ink-2)',
      priceInvalid: s.searchStatus === 'error' ? 'true' : 'false', priceBorder: s.searchStatus === 'error' ? '#9B2C2C' : 'var(--line)',
      gallery, galleryCols: `repeat(${nCols},minmax(0,1fr))`,
      galleryColumns: LAYOUT.map(col => ({ items: col.map(([i, ratio], k) => {
        const g = gallery[i]; const last = k === col.length - 1 && nCols > 1;
        return { ...g, cell: { ...g.reveal, display: 'block', aspectRatio: ratio, flex: last ? '1 0 auto' : 'none' } };
      }) })),
      heroRef: this.heroRef, heroFrame: this.heroFrame, heroText: this.heroText, heroCaption: this.heroCaption,
      tlCols: isMobile ? '32px minmax(0,1fr)' : 'minmax(0,1fr) 72px minmax(0,1fr)',
      tlGap: isMobile ? '16px' : '24px',
      cardL: isMobile ? '2' : '1', cardR: isMobile ? '2' : '3', markCol: isMobile ? '1' : '2',
      markAlign: isMobile ? 'start' : 'center', markTop: isMobile ? '28px' : '0px',
      lineLeft: isMobile ? '15.5px' : 'calc(50% - .5px)',
      isHome: s.route === 'home', isListings: s.route === 'listings', isLetsMove: s.route === 'lets-move', isAbout: s.route === 'about',
      tlRef: this.tlRef, tlFill: this.tlFill,
      ...Object.fromEntries([0, 1, 2, 3, 4].map(k => ['mark' + k, s.marks[k] ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)'])),
      ...Object.fromEntries([0, 1, 2].map(k => ['hl' + k, { op: s.heroIn || s.reduce ? 1 : 0, tf: s.heroIn || s.reduce ? 'none' : 'translateY(16px)', d: (k * 140) + 'ms' }])),
      ctaDir: narrow ? 'column' : 'row', ctaAlign: narrow ? 'flex-start' : 'flex-end', ctaMl: narrow ? '0' : 'auto',
      h1Mb: narrow ? '0' : '-48px', svcJs: narrow ? 'start' : 'end', svcAi: narrow ? 'flex-start' : 'flex-end', svcTa: narrow ? 'left' : 'right',
      lbHint: (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ? 'Swipe to browse photos' : 'Use arrow keys or buttons to browse',
      driftAnim: s.reduce ? 'none' : 'mmDrift 22s ease-in-out 1.6s infinite alternate', shimmerAnim: s.reduce ? 'none' : 'mmShimmer 6s cubic-bezier(.4,0,.2,1) 1.2s infinite', aboutRatio: s.w < 880 ? (s.w >= 600 ? '4/3' : '4/5') : 'auto', aboutMax: s.w < 880 ? '100%' : '480px', aboutMinH: s.w < 880 ? '0' : '424px', aboutJs2: s.w < 880 ? 'stretch' : 'end',
      footCols: s.w >= 1100 ? '1.6fr 1fr 1fr 1.4fr 1fr' : s.w >= 640 ? 'repeat(4,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))', footBrand: s.w >= 1100 ? 'auto' : '1 / -1', footWide: s.w < 640 ? '1 / -1' : 'auto',
      pinPulse: s.reduce ? 'none' : 'mmPin 2.2s cubic-bezier(.2,.8,.2,1) infinite',
      officeWs: s.w >= 1100 ? 'nowrap' : 'normal',
      chevBob: s.reduce ? 'none' : 'mmBob 1.6s ease-in-out infinite',
      lbTouchStart: (e) => { const t = e.touches[0]; this._tx = t.clientX; this._ty = t.clientY; this._tt = Date.now(); this._drag = null; },
      lbTouchMove: (e) => {
        if (this._tx == null) return; const t = e.touches[0]; let dx = t.clientX - this._tx; const dy = t.clientY - this._ty;
        if (this._drag == null) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; this._drag = Math.abs(dx) > Math.abs(dy); }
        if (!this._drag) return; const tr = this.lbTrack.current; if (!tr) return;
        const last = GALLERY.length - 1; if ((s.lb === 0 && dx > 0) || (s.lb === last && dx < 0)) dx *= 0.3;
        tr.style.transition = 'none'; tr.style.transform = 'translateX(calc(' + (-s.lb * 100) + '% - ' + (s.lb * 32) + 'px + ' + dx + 'px))';
      },
      lbTouchEnd: (e) => {
        if (this._tx == null) return; const t = e.changedTouches[0]; const dx = t.clientX - this._tx; const dt = Math.max(1, Date.now() - this._tt); const drag = this._drag; this._tx = null; this._drag = null;
        const tr = this.lbTrack.current; if (tr) tr.style.transition = s.reduce ? 'none' : 'transform 680ms cubic-bezier(.22,1,.36,1)';
        if (!drag) return; const last = GALLERY.length - 1; const go = Math.abs(dx) > window.innerWidth * 0.18 || Math.abs(dx) / dt > 0.45;
        const d = dx < 0 ? 1 : -1;
        if (go && !((s.lb === 0 && d < 0) || (s.lb === last && d > 0))) { e.preventDefault(); this.stepLb(d); }
        else if (tr) tr.style.transform = 'translateX(calc(' + (-s.lb * 100) + '% - ' + (s.lb * 32) + 'px))';
      },
      badgeSpin: s.reduce ? 'none' : 'mmSpin 28s linear infinite',
      heroDrift: s.reduce ? 'none' : 'mmDrift 480s linear infinite',
      h1Fill: s.reduce ? 'none' : 'mmFill 9s cubic-bezier(.65,0,.35,1) 600ms infinite',
      nameGlint: s.reduce ? 'none' : 'mmGlint 7s cubic-bezier(.45,0,.25,1) 1s infinite',
      ...Object.fromEntries([0, 1, 2].map(k => {
        const on = !!(s.tlActive || {})[k];
        const fromLeft = isMobile ? false : k !== 1;
        const off = fromLeft ? 'translateX(-48px)' : 'translateX(48px)';
        return ['tl' + k, {
          op: on ? 1 : 0, cardTf: on ? 'none' : off, sideTf: on ? 'none' : (fromLeft ? 'translateX(48px)' : 'translateX(-48px)'),
          dotBg: on ? 'var(--accent-soft)' : 'var(--dark)', dotTf: on ? 'scale(1)' : 'scale(.7)',
          ripple: on && !s.reduce ? 'mmRipple 1.8s cubic-bezier(.2,.8,.2,1) 0s 3' : 'none',
          ripple2: on && !s.reduce ? 'mmRipple 1.8s cubic-bezier(.2,.8,.2,1) .6s 3' : 'none',
          numColor: on ? '#5A4848' : '#2A2625'
        }];
      })),
      soldHeadAlign: isMobile ? 'flex-start' : 'center', soldHeadText: isMobile ? 'left' : 'center',
      heroH: s.reduce ? 'calc(100dvh - 80px)' : '180vh',
      lbOpen: !!lbItem,
      lbImage: lbItem ? React.createElement('div', { style: { width: '100%', height: '100%', overflow: 'hidden', touchAction: 'pan-y pinch-zoom' } },
        React.createElement('div', { ref: this.lbTrack, style: { display: 'flex', height: '100%', gap: '32px', transform: 'translateX(calc(' + (-s.lb * 100) + '% - ' + (s.lb * 32) + 'px))', transition: s.reduce ? 'none' : 'transform 680ms cubic-bezier(.22,1,.36,1)', willChange: 'transform' } },
          gallery.map((g, i) => React.createElement('div', { key: g.src, 'aria-hidden': i === s.lb ? undefined : 'true', style: { flex: '0 0 100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement('img', { src: g.src, alt: g.alt, draggable: false, style: { maxWidth: 'min(100%, 1536px)', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', userSelect: 'none', boxShadow: '0 24px 60px rgba(0,0,0,.45)', transform: i === s.lb ? 'scale(1)' : 'scale(.88)', opacity: i === s.lb ? 1 : 0.3, filter: i === s.lb ? 'none' : 'saturate(.6)', transition: s.reduce ? 'none' : 'transform 680ms cubic-bezier(.22,1,.36,1), opacity 680ms cubic-bezier(.22,1,.36,1), filter 680ms' } }))))) : null,
      lbOk: !!lbItem, lbFailed: false,
      lbLabel: lbItem ? `Photo ${s.lb + 1} of ${GALLERY.length}` : '', lbCount: lbItem ? `${s.lb + 1} / ${GALLERY.length}` : '',
      lbClose: () => this.closeLb(), lbPrev: (e) => { e.stopPropagation(); this.stepLb(-1); }, lbNext: (e) => { e.stopPropagation(); this.stepLb(1); },
      lbBackdrop: (e) => { if (e.target === e.currentTarget) this.closeLb(); },
      openLabel: open ? 'Open now' : 'Closed now', openDot: open ? '#2F7D4F' : 'var(--accent-soft)',
      onContact: this.onContact, emailErr: s.emailErr, emailInvalid: s.emailErr ? 'true' : 'false', emailBorder: s.emailErr ? '#9B2C2C' : 'var(--line)',
      contactBusy: cs === 'sending', contactLabel: cs === 'sending' ? 'Sending…' : 'Send',
      contactMsg: cs === 'sent' ? 'Thank you. Your message was sent and Marci\u2019s team will reply by email.' : cs === 'failed' ? 'Your message didn\u2019t go through. Please try again, or call (206) 919-6886.' : '',
      contactMsgColor: cs === 'failed' ? '#9B2C2C' : '#2F6B47',
      toTop: this.toTop,
      topOp: topOn ? 1 : 0, topVis: topOn ? 'visible' : 'hidden', topTf: topOn ? 'none' : 'translateY(8px)', topDelay: topOn ? '0s' : '200ms',
      topTab: topOn ? 0 : -1, topHidden: topOn ? undefined : 'true', topBottom: showCookie ? (narrow ? '132px' : '96px') : '24px',
      footPad: showCookie ? '120px' : '28px',
      showCookie,
      acceptCookies: () => { store.set('mm_cookie_ok', '1'); this.setState({ cookieOk: true }); }
    };
  }
}

mountDC(Component, document.getElementById('app'), document.getElementById('tpl').content, { showCookieNotice: true });
