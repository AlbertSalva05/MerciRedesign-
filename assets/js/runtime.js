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
