---
version: alpha
name: Waypoint
description: Editorial, photo-forward travel guides — a printed guidebook on screen, not a dashboard.
colors:
  primary: "#C4552D"
  secondary: "#5A6B52"
  neutral: "#F6F1E9"
  surface: "#FFFCF8"
  on-surface: "#2A2521"
  muted: "#6B635C"
  border: "#E5DDD3"
  on-primary: "#FFFCF8"
  primary-soft: "#F3E4DC"
  secondary-soft: "#E8EDE5"
typography:
  headline-display:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.2
  headline-sm:
    fontFamily: Fraunces
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.25
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.06em
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  gutter: 24px
  margin: 32px
  max-width: 1200px
components:
  link:
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  link-hover:
    textColor: "{colors.primary}"
  map-pin:
    backgroundColor: "{colors.primary}"
    size: 28px
  map-pin-active:
    backgroundColor: "{colors.primary}"
    size: 36px
  guide-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  place-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  place-card-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  photo-frame:
    backgroundColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
  category-chip:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 6px
---

## Overview

Waypoint looks and feels like a **printed travel guide** — warm paper, confident serif headlines, generous photography, and quiet utility type. The product is photo-forward: cover images, place galleries, and map pins carry the story; chrome stays out of the way.

The emotional target is **editorial warmth**, not SaaS density. Think Monocle city guides or a well-designed indie magazine spread, not a data dashboard. Whitespace is a feature. Photos breathe. Maps orient; they do not dominate.

**Audience:** A single author who knows a place well and shares a curated guide. The UI should honor their curation — typography and layout frame their photos and notes, never compete with them.

**Core surfaces:** Guide list (cover-forward grid), guide editor (map + place cards), guide viewer (synced map and cards), public guide (read-only share), place detail (photos, notes, category, rating).

Load **Fraunces** and **Inter** from Google Fonts. Fraunces sets the editorial voice for all headings. Inter handles body copy, labels, form fields, and metadata.

## Colors

Two accent colors on warm paper, with ink reserved for text.

- **Primary (#C4552D):** Terracotta — the main accent. Map pins, links, active states, primary buttons, and key highlights. This is the color that draws the eye.
- **Secondary (#5A6B52):** Sage — the complementary accent. Category chips, section labels, editorial dividers, and decorative flourishes. Earthy and calm; pairs with terracotta like ink and watercolor in a field guide.
- **On-surface (#2A2521):** Warm ink — **all** text: headlines, body, labels, map text, and secondary button labels. Never use ink for buttons, pins, or filled accents.
- **Muted (#6B635C):** Stone — captions, addresses, timestamps, and de-emphasized metadata.
- **Neutral (#F6F1E9):** Paper base — page background across every view.
- **Surface (#FFFCF8):** Card stock — place cards, guide cards, inputs, and photo matting.
- **Border (#E5DDD3):** Hairline rules — card edges, input borders, list dividers.
- **Primary-soft (#F3E4DC):** Light terracotta wash — selected card backgrounds, hover states, accent tint blocks.
- **Secondary-soft (#E8EDE5):** Light sage wash — category chip fills, subtle section backgrounds.

Avoid pure white (`#FFFFFF`) for page backgrounds. Avoid cool grays and blues. Rating stars use ink and stone, not accent colors.

## Typography

Two typefaces, clear roles:

- **Fraunces** — all headings (`headline-display` through `headline-sm`). Editorial, slightly old-world, trustworthy. Used for guide titles, place names, and section labels. Always in `on-surface` ink.
- **Inter** — all body text, labels, captions, and UI chrome. Neutral and highly legible at small sizes.

**Hierarchy:**

- **Display:** Guide title on cover and hero moments — one per screen maximum.
- **Headline lg/md:** Guide titles in lists, place names on cards.
- **Headline sm:** Section headers ("Places", "Photos", "Notes").
- **Body lg:** Place notes and guide descriptions — the author's voice.
- **Body md/sm:** Default UI copy, addresses, helper text.
- **Label md:** Uppercase category tags and metadata with letter-spacing. Use sparingly.
- **Caption:** Photo captions beneath images.

Do not introduce a third typeface. Limit to two weights per screen (e.g., Fraunces 600 + Inter 400). Avoid all-caps in body copy.

## Layout

Layout follows an **editorial column**, not a dashboard grid.

- **Max content width:** 1200px, centered on desktop. Generous side margins on mobile.
- **Spacing scale:** 4px base with steps at 8, 16, 24, 40, and 64px. Default section gap is 24–40px.
- **Guide list:** Cover-image-forward cards in a responsive grid (1 col mobile, 2–3 col desktop). Cover photos are 3:2 or 4:3 aspect ratio; title overlays or sits below.
- **Guide viewer:** Split layout on desktop — map occupies ~45% width, scrollable place cards ~55%. On mobile, map stacks above cards or collapses to a toggle; cards remain the primary scroll surface.
- **Place detail:** Full-bleed photo gallery at top, then editorial text block below. Photos are edge-to-edge within the content column, not trapped in small thumbnails.
- **Editor:** Functional but still editorial — the map is a workspace, not a control panel. Place cards mirror the viewer's card design for WYSIWYG fidelity.

Prefer vertical rhythm and breathing room over information density. One primary action per screen. Group related content with whitespace, not heavy containers.

## Elevation & Depth

Depth is **paper layering**, not Material shadows.

- Page sits on paper (`neutral`). Cards and inputs sit on surface (`surface`) with a 1px `border` hairline — no drop shadow by default.
- Photos may use a very subtle shadow (`0 2px 8px rgba(42, 37, 33, 0.08)`) to lift off the page, mimicking a print on mat board.
- Active place cards use a `primary-soft` background tint or a 2px left border in terracotta — not a glow or heavy shadow.
- Map tiles stay flat; terracotta pins provide the strongest color on the map surface.

Never use stacked card shadows, glassmorphism, or dark overlays on photos.

## Shapes

Corners are **gently squared** — editorial, not playful.

- **Photos and cards:** 4px (`rounded.sm`) or 8px (`rounded.md`). Consistent within a view.
- **Buttons and inputs:** 4px (`rounded.sm`).
- **Map pins:** Circular (full round on pin marker only).
- **Avatars / rating icons:** Square or slightly rounded, never pill-shaped unless functionally required.

Do not mix sharp and heavily rounded corners on the same screen. No pill buttons, no 24px+ border radius on cards.

## Components

### Map pins

Filled terracotta (`primary`) circle with a small tail or dot marker. Default 28px; active/selected pin scales to 36px. The strongest saturated element on the map.

### Links

Terracotta (`primary`) text, no underline by default. Underline on hover. Never style links as buttons. Inline within body copy only.

### Guide cards

Surface background, hairline border, cover photo fills the top ~60% of the card. Guide title in Fraunces below, ink color. No badges, no stats row, no action icon strip.

### Place cards

Surface background, hairline border. Place name in Fraunces (`headline-md`), address in muted (`body-sm`). Optional thumbnail photo on the left (square, 64px). Active/selected state: `primary-soft` background or 2px left border in terracotta — text stays ink.

### Buttons

- **Primary:** Terracotta fill (`primary`), surface text (`on-primary`) — for save, publish, and the single most important action per screen.
- **Secondary:** Surface fill with ink text and hairline border — default for most actions (edit, add place, back).

Never use ink (`on-surface`) as a button fill. Never use sage for primary actions.

### Photos

Hero element. Full width within column, natural aspect ratio preserved (no forced squares except thumbnails). Caption in `caption` style below, muted color. Lightbox on tap in viewer; inline in editor with add/reorder controls that stay minimal.

### Form inputs

Surface background, hairline border, ink text. Focus state: border darkens to ink — not terracotta. Labels in Inter `body-sm`, muted color.

### Rating & category

Category as uppercase label in sage (`secondary`) on `secondary-soft` background — the one place sage appears as a fill. Rating as simple ink numerals or minimal star outline in muted — no gold stars.

## Map

Waypoint's custom base map.
- Custom MapLibre style at /styles/waypoint-style.json
- Muted base; land matches {colors.paper} so map and page read as one surface
- No clutter; only the author's pins are shown
- Terracotta reserved for pins and active states; the base map uses none of it

## Do's and Don'ts

- Do treat photos as the hero — large, uncropped where possible, with captions.
- Do keep the paper background (`#F6F1E9`) visible; let content float on it with surface cards.
- Do use terracotta (`primary`) for pins, links, active states, and primary buttons.
- Do use sage (`secondary`) for categories and editorial accents — never for interactive emphasis.
- Do use ink (`on-surface`) for all text — never as a fill or accent block.
- Do use Fraunces for every heading and Inter for everything else.
- Do maintain generous whitespace — if it feels like a dashboard, remove a row.
- Don't use ink for buttons, pins, or large accent blocks.
- Don't add charts, stat cards, sidebar nav, or dense data tables.
- Don't use cool-toned grays, pure white page backgrounds, or more than two accent hues.
- Don't add drop shadows to cards — use borders and paper contrast instead.
- Don't use pill-shaped buttons, gradient fills, or glass/blur effects.
- Do maintain WCAG AA contrast: ink on paper passes; terracotta buttons with surface text pass; sage chips with sage text pass at 12px+.
