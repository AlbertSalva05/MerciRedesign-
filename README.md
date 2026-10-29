# Marci Metzger Homes: Website Redesign

Redesign of [marcimetzger.com](https://marcimetzger.com/) for Marci Metzger - The Ridge Realty Group, a Pahrump, Nevada Realtor. The layout is new; all copy, contact details and photos come from the original site.

## Contents
1. [Overview](#overview)
2. [Pages](#pages)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Design system](#design-system)
6. [Accessibility and SEO](#accessibility-and-seo)
7. [Run locally](#run-locally)
8. [Deploy on Render](#deploy-on-render)
9. [Before going live](#before-going-live)

## Overview
A static, framework-free website: plain HTML, CSS and JavaScript, with no build step and no React.

## Pages
| Page | URL | Sections |
|---|---|---|
| Home | `/index.html` | Hero, About, Get It Sold timeline, Find Your Dream Home search, Photo Gallery, Our Services, Call or Visit |
| Listings | `/listings.html` | Dark band with image wall, What's New at The Ridge, Upcoming Virtual Showings |
| Let's Move | `/lets-move.html` | Dark band with image wall, Contact Us form and office hours, search |
| About Us | `/about-us.html` | Dark band with portrait, About, Get It Sold, Our Services |
| 404 | any unknown path | Not-found page |

## Tech stack
- **HTML5** pages, one per route, with the markup in a `<template>`
- **CSS** in `assets/css/styles.css`: design tokens, base styles, BEM-style component classes (`section__element`), states, keyframes. Inline styles are used only for values that change at runtime (scroll progress, open/closed states).
- **Vanilla JavaScript**:
  - `assets/js/runtime.js` is a small renderer and state layer
  - `assets/js/app.js` holds the page logic shared by all pages
- **Three.js r160** (jsDelivr CDN): light-beam effect on the subpage dark bands
- **Google Fonts**: Libre Caslon Display, Libre Caslon Text, Source Sans 3
- **Google Maps** embed with a custom brand pin

## Project structure
```
index.html            Home
listings.html         Listings
lets-move.html        Let's Move
about-us.html         About Us
404.html              Not-found page
assets/
  css/styles.css      All styles
  js/runtime.js       Renderer and state
  js/app.js           Page logic
  js/light-beam.js    Three.js light beam (subpages only)
  img/                Photos, badges, logo, hero and brush SVGs
  logo/               Favicons and app icons
  og-image.jpg        Social share image
robots.txt            Crawler rules
sitemap.xml           Sitemap (4 pages)
site.webmanifest      App manifest
render.yaml           Render static-site blueprint
```

## Design system
- **Colours:**
  - Ivory `#FAF8F5` background
  - Ink `#1B1B1B` text
  - Mauve `#6F5A5A` accent
  - Soft mauve `#AD8C8C` on dark
  - Charcoal `#161616` dark bands
- **Type:** Libre Caslon Display for headings, Source Sans 3 for body text (16px / 1.5)
- **Spacing:** 8pt grid, even font sizes, 48px minimum tap targets
- **Motion:** scroll reveals, a pinned hero, the timeline and gallery effects. All animation turns off when the visitor's device asks for reduced motion.

## Accessibility and SEO
- WCAG AA contrast, semantic landmarks, skip link, breadcrumbs, keyboard and focus support, labelled forms
- Unique title per page, meta description, canonical link, Open Graph and Twitter tags, structured data for a real estate agent, robots.txt and sitemap.xml

## Run locally
Serve the folder with any static server, for example `npx serve .`, then open http://localhost:3000.

## Deploy on Render
1. Push this folder to a GitHub repository as the repository root.
2. In Render choose **New > Static Site**, leave the build command empty and set the publish directory to `.`. Or choose **New > Blueprint**, which reads `render.yaml`.
3. Render serves `404.html` for unknown paths.

## Before going live
- Replace `https://marci-metzger-homes.onrender.com` with the real domain in all `.html` files, `robots.txt` and `sitemap.xml`.
- Connect a form service (for example Formspree) so the contact form delivers messages.
