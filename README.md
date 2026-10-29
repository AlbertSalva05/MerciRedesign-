# Marci Metzger Homes v4

Plain HTML5, CSS3 and JavaScript. No framework, no runtime, no build step needed to host it.

Generated from `Marci Metzger Homes v2.dc.html` by `build/build-v4.js`. Edit v2 (or `build/v4-main.js` for behaviour), then rebuild. Do not hand-edit this folder.

## Pages
- index.html (Home), listings.html, lets-move.html, about-us.html, 404.html

## Files
- assets/css/common.css: fonts, tokens, utilities, responsive values, states, shared components, keyframes
- assets/css/top.css, listings.css, lets-move.css, about.css, 404.css: page-only components
- assets/js/main.js: all behaviour, in 16 numbered sections (see the contents list at the top of the file)
- assets/js/footer-smoke.js, light-beam.js: Three.js effects (`<mm-smoke>`, `<mm-light-beam>`), using assets/js/vendor/three.module.min.js
- Gallery data: the JSON block `#site-data` at the end of index.html

## How state works
- main.js adds classes to `<html>`: `js`, `is-scrolled`, `is-menu-open`, `is-hero-in`, `is-top-visible`, `is-office-open`, `has-cookie`.
- Elements shown on demand carry `data-show="group"` and the `hidden` attribute.
- Clickable elements name their action: `data-on-click="toggleMobileMenu"`; forms: `data-on-submit="sendContactMessage"`.

## Deploy (Render)
Static site, publish path `.` (see render.yaml). Replace https://marci-metzger-homes.onrender.com in the pages, sitemap.xml and robots.txt if the domain changes.
