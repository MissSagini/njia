---
name: Njia Design System
description: Visual system for Njia, which pairs Kenyan students with Kenyan mentors who studied at their dream UK or European university. Direction is "The Trusted Sibling", the warmth of an older sibling with the credibility a parent needs to see. Mostly Cream and White, led by Forest, with one Sunset highlight per screen.
colors:
  primary: "#C8551B"
  secondary: "#1F4D3A"
  accent: "#E3A43B"
  background: "#FBF6EE"
  surface: "#FFFFFF"
  surface-tint: "#DCE8E0"
  dark: "#1C2A23"
  text: "#1C2A23"
  text-muted: "#5A6660"
  text-on-brand: "#FFFFFF"
  text-on-dark: "#FBF6EE"
  border: "#E6DCCB"
  focus: "#1F4D3A"
  danger: "#C8551B"
  sunset: "#C8551B"
  forest: "#1F4D3A"
  ochre: "#E3A43B"
  cream: "#FBF6EE"
  white: "#FFFFFF"
  forest-soft: "#DCE8E0"
  ink: "#1C2A23"
  ink-muted: "#5A6660"
  line: "#E6DCCB"
typography:
  display:
    fontFamily: Literata
    fontSize: 60px
    fontWeight: 600
    lineHeight: 64px
    letterSpacing: -0.01em
  display-mobile:
    fontFamily: Literata
    fontSize: 40px
    fontWeight: 600
    lineHeight: 44px
    letterSpacing: -0.01em
  title:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
  heading:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: 600
    lineHeight: 30px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 29px
  body:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
  small:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  label:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.08em
  button:
    fontFamily: DM Sans
    fontSize: 19px
    fontWeight: 700
    lineHeight: 24px
rounded:
  sm: 6px
  md: 12px
  pill: 999px
spacing:
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "6": 24px
  "8": 32px
  "10": 40px
  "16": 64px
  "24": 96px
  touch-min: 44px
  button-primary-min: 52px
  container-max: 1200px
  gutter-mobile: 20px
  gutter-desktop: 40px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-brand}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "{spacing.button-primary-min}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.text-on-brand}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-min}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    borderColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-min}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-min}"
  button-inverse:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-min}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: 48px
  checkbox:
    size: 20px
    borderColor: "{colors.secondary}"
    checkedBackground: "{colors.secondary}"
    checkColor: "{colors.white}"
    rounded: "{rounded.sm}"
    rowHeight: "{spacing.touch-min}"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "{spacing.4}"
    paddingDesktop: "{spacing.6}"
  card-tint:
    backgroundColor: "{colors.surface-tint}"
    rounded: "{rounded.md}"
  card-dark:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.text-on-dark}"
    rounded: "{rounded.md}"
  card-brand:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.text-on-brand}"
    rounded: "{rounded.md}"
  badge:
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
  tag:
    backgroundColor: "{colors.surface-tint}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.pill}"
  nav-bar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    scrolledBorder: "{colors.border}"
  nav-bar-dark:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.text-on-brand}"
  tab-bar:
    backgroundColor: "{colors.surface}"
    activeBackground: "{colors.surface-tint}"
    iconColor: "{colors.secondary}"
  footer:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.text-on-dark}"
    labelColor: "{colors.accent}"
---

# Njia Design System

## Overview

Njia pairs Kenyan students with Kenyan mentors who studied at their dream UK or European university, with guidance from application to settling in. The primary user is a 17-year-old student in Nairobi. Parents are the second audience: they pay, have no login and receive a weekly progress report by email. Every screen has to win the student's heart and the parent's trust.

The brand direction is **The Trusted Sibling**: the warmth of an older sibling who has already made the journey, with the credibility a parent needs to see. The interface is calm and flat. Pages are mostly Cream and White, Forest leads, and a single Sunset highlight on each screen marks the next step.

**Voice.** A smart, kind older sibling. Warm and encouraging, honest and well informed. Plain words and short sentences. Use "you" for the student and "we" for Njia. Mentors speak in the first person ("I applied to LSE from Nairobi"). Students get a friendly, personal tone. Parents get a calm, clear, reassuring one.

- Lead with the next step. Buttons and headings name the action: "Book your free call", "Choose a time first", "Join on Google Meet".
- Be specific. Name universities, courses and real tasks: "Shortlist 5 Economics courses on UCAS".
- Use sentence case everywhere: headlines, buttons and navigation.
- Headlines end with a full stop.
- Words to reach for: together, next step, been there, guide, home.

Sample headlines: "Someone from home who's already been there." · "A clear path, one next step at a time." · "The offer letter is just the beginning." · "Your path starts with one free call."

## Colors

| Token | Hex | Role |
|---|---|---|
| `forest` / `secondary` | #1F4D3A | Leads the interface: secondary buttons, links, icons, header bands, focus rings |
| `sunset` / `primary` | #C8551B | The single highlight per screen, usually the primary call to action. Also the error colour |
| `ochre` / `accent` | #E3A43B | Decoration only: path motif, badges with Ink text, accents on dark backgrounds |
| `cream` / `background` | #FBF6EE | Page background |
| `white` / `surface` | #FFFFFF | Cards, forms, panels, tab bar |
| `forest-soft` / `surface-tint` | #DCE8E0 | Mentor cards, tags, completed tasks, selected fills, focus ring halo |
| `ink` / `text` / `dark` | #1C2A23 | Body text, the dark background band, footer |
| `ink-muted` / `text-muted` | #5A6660 | Secondary text, hints, captions |
| `line` / `border` | #E6DCCB | 1px borders, skeleton blocks, disabled fills |

**Approved text pairings**
- Ink or Ink-muted text on Cream or White.
- White text on Forest.
- White text on Sunset, only at 19px bold or larger. Primary buttons therefore always use the `button` style.
- Cream text on Ink. Ochre may be used for accents and labels on Ink.

**Interaction colours** are mixed toward Ink rather than defined as new hex values:
- `sunset-hover` is Sunset 88% mixed with Ink.
- `forest-hover` is Forest 85% mixed with Ink.
- `tint-hover` is Forest-soft 80% mixed with Line.

**Hairlines on Ink** use Cream at 18 to 20% opacity. This is the only place transparency is used.

## Typography

There are three families, all self-hosted in Latin and Latin-ext subsets.

- **Literata 600** is used for the single hero headline on a page.
- **Fraunces 600** is used for every other heading and for the logo.
- **DM Sans** (400, 500, 600, 700) is used for everything else.

Fallbacks are Georgia and "Times New Roman" for the two serifs, and system-ui, -apple-system and "Segoe UI" for DM Sans.

| Style | Family | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| display | Literata | 60 / 64px | 600 | -0.01em | One hero headline per page, desktop |
| display-mobile | Literata | 40 / 44px | 600 | -0.01em | Same, on mobile |
| title | Fraunces | 32 / 40px | 600 | — | Section titles |
| heading | Fraunces | 22 / 30px | 600 | — | Card titles, sub-sections |
| body-lg | DM Sans | 18 / 29px | 400 | — | Intros, lead paragraphs |
| body | DM Sans | 16 / 26px | 400 | — | Default text, inputs |
| small | DM Sans | 14 / 22px | 400 | — | Hints, captions, meta |
| label | DM Sans | 12 / 16px | 600 | 0.08em, uppercase | Badges only |
| button | DM Sans | 19 / 24px | 700 | — | Primary buttons |

Text inputs use the 16px `body` style on mobile.

## Layout

- **Mobile first.** Design at 390px, then at desktop width. Each size gets its own layout. Desktop uses multi-column grids, sticky side panels and a top navigation. Mobile stacks content, pins the main action to the bottom and uses a bottom tab bar.
- **Container.** Content is at most 1200px wide inside full-width colour bands. Gutters are 20px on mobile and 40px on desktop.
- **Spacing scale.** 4, 8, 12, 16, 24, 32, 40, 64 and 96px. The brand guide defines 8, 16, 24 and 40. The others extend the scale in 4px steps.
  - 8px separates small related items.
  - 16px goes between form fields and is the card padding on mobile.
  - 24px is the card padding on desktop and the gap between cards.
  - 40px is the minimum space between page sections.
  - 96px separates sections on desktop landing pages.
- **Touch targets** are at least 44 × 44px. Primary buttons are at least 52px tall.
- **Backgrounds.** Plain Cream sections alternate with White sections, with at most one Ink band per page.
- **Path motif.** Three or four dots rising from lower left to upper right, warm to solid Forest, or Cream on dark. Use it at most once per page.
- **Header.** The site header is a sticky Cream bar. It gains a Line border and `shadow-sm` once the page scrolls.

## Elevation & Depth

Surfaces are flat at rest. They are separated by a 1px Line border, not by shadow. All shadows are tinted with Ink, and shadows are not part of the brand guide.

| Token | Value | Use |
|---|---|---|
| shadow-none | none | Every surface at rest |
| shadow-sm | 0 1px 2px rgba(28,42,35,0.06) | Sticky header after scroll |
| shadow-md | 0 4px 14px rgba(28,42,35,0.08) | Hover lift on buttons and interactive cards |
| shadow-lg | 0 14px 36px rgba(28,42,35,0.14) | Floating layers: menus, sheets, toasts, chips overlapping photos |
| shadow-focus | 0 0 0 3px #DCE8E0 | Focus halo on inputs |

**Motion is quiet.** Transitions last 120ms (`duration-fast`) or 200ms (`duration-base`) and use `cubic-bezier(0.2,0.7,0.2,1)`. Only colour, shadow and a 1 to 2px translate change.

## Shapes

The feel is soft but not bubbly.

- `rounded.sm` (6px) is for inputs, checkboxes and small badges.
- `rounded.md` (12px) is for cards, buttons, panels and images.
- `rounded.pill` (999px) is for tags, avatars and path dots.

**Icons** are simple line icons with a 2px stroke and rounded ends and joins. The bundled set uses Lucide path data.
- Size is 20px by default, 18px inside medium buttons and inputs, and 22 to 24px in navigation.
- Colour is {colors.forest} on light backgrounds, and {colors.ochre} or {colors.cream} on {colors.ink}.

**Logo.** Use the supplied files exactly as they are.
- `njia-lockup.svg` goes on light backgrounds.
- `njia-lockup-dark.svg` goes on Ink, Forest and dark photos.
- `njia-app-icon.svg` is for the favicon, the app icon and anything below 80px.
- Minimum width is 80px. Clear space is at least the diameter of the largest stone.

## Components

### Buttons
- **Primary** uses {colors.primary} with {colors.text-on-brand} text in the {typography.button} style, at least {spacing.button-primary-min} tall, with {rounded.md} corners. Use it once per screen, for the next step.
- **Secondary** uses {colors.secondary} with {colors.text-on-brand} text. It is the default for every other action.
- **Outline** uses {colors.surface} with a {colors.secondary} border and text.
- **Ghost** is text only, in {colors.secondary}.
- **Inverse** uses {colors.cream} on {colors.ink} backgrounds.
- **Link** is an underlined {typography.small} label in {colors.secondary}, with no fill or border, still at least {spacing.touch-min} tall. Use it for small actions inside a line of content, such as "Change link" or "Remove" next to a task.
- **Sizes.** `lg` is at least 52px tall with a 19px label. `md` is at least {spacing.touch-min} tall with a 16px label. Primary is always `lg`.
- **States:**
  - Hover: filled buttons darken toward Ink (`sunset-hover`, `forest-hover`) and lift with `shadow-md`. Outline and ghost buttons gain a {colors.forest-soft} fill.
  - Pressed: a 1px downward nudge with the shadow removed.
  - Focus: a 2px {colors.focus} outline with a 2px offset. On dark backgrounds the outline is {colors.cream}.
  - Disabled: {colors.line} fill with a {colors.ink-muted} label.
  - Loading: a spinner with a present-tense label such as "Booking your call…". The button is disabled while loading.

### Inputs
- **Text input and select.** 48px tall with {rounded.sm} corners, a {colors.surface} fill on {colors.background}, a {colors.border} border and the {typography.body} style.
  - Every field has a visible label above it and an optional hint below it in {typography.small}, coloured {colors.text-muted}.
  - Optional fields are marked as optional.
- **Input states:**
  - Hover: the border changes to {colors.ink-muted}.
  - Focus: a {colors.forest} border with a 3px {colors.forest-soft} ring (`shadow-focus`).
  - Error: a {colors.danger} border with a Sunset alert icon. The message sits under the field, in one plain sentence, in {colors.text}.
  - Disabled: a {colors.cream} fill.
- **Checkbox.** A 20px box with {rounded.sm} corners and a 2px {colors.secondary} border, on a 44px row. When checked, it fills with {colors.secondary} and shows a {colors.white} tick. Weekly tasks strike through and mute the label once checked.
- **Choice chips** are used for call times, days, payment methods and filters.
  - Default: {colors.surface} with a 1px {colors.border} border, {rounded.md} corners and a height of at least 44px.
  - Selected: a 2px {colors.forest} border with a {colors.forest-soft} fill.
  - Taken: a {colors.cream} fill and {colors.ink-muted} struck-through text, and the chip can't be tapped.
- **Form layout.** 16px goes between fields. Two columns are used on desktop and one on mobile. Related checkboxes are grouped in a fieldset with a legend.

### Cards
- **Default** is {colors.surface} with a 1px {colors.border} border and {rounded.md} corners. Padding is {spacing.4} on mobile and {spacing.6} on desktop. There is no shadow at rest.
- **Tint** ({colors.surface-tint}) is for mentor cards and completed tasks.
- **Dark** ({colors.dark}) is for emphasis bands.
- **Brand** ({colors.secondary}) is for header bands.
- **Card states:**
  - Interactive cards lift 2px with `shadow-md` on hover, show the focus outline and use a pointer cursor.
  - Selected: a 2px {colors.forest} border.
  - Disabled: 55% opacity.
- **Panel.** A plain box for grouping part of a screen that holds forms, lists or mixed content, where a card's text styling would get in the way. It has a 1px {colors.border} border, {rounded.md} corners, no shadow, and puts no styles on its content.
  - Tones: {colors.surface} (default) or {colors.cream} (website feature cards on white sections, and inline confirm steps such as "Cancel this session?").
  - Padding: {spacing.4} on mobile and {spacing.6} on desktop by default; 12px for inline steps nested inside another box.
  - An optional header holds a {typography.heading} title, a {typography.body} description in {colors.text-muted}, and one action at the end of the row.
  - Use Card for short text cards and Panel for everything else. Never hand-build a bordered box.
- **Badges** use the {typography.label} style with {rounded.sm} corners. Variants are tag, forest, ochre (with Ink text), neutral and dark. **Tags** use {rounded.pill} corners on {colors.surface-tint}.

### Navigation
- **Site header.** A Cream bar with the logo, links, "Log in" and one call to action.
  - The call to action is secondary (Forest) by default, so Sunset stays free for the hero button. It uses Sunset only when it is the screen's single highlight.
  - The active link gets an underline.
  - On mobile, a hamburger opens a drawer.
  - A dark variant uses {colors.secondary} with the dark lockup.
- **App navigation.**
  - Desktop: a sticky Cream top bar with the logo, page links and the user's avatar. The active link sits in a {colors.forest-soft} pill.
  - Mobile: a {colors.surface} bottom tab bar with three or four tabs, each with an icon and a label. The active tab gets a {colors.forest-soft} pill and every tab is at least 44px tall.
- **Footer.** {colors.dark} background with the dark lockup, a Fraunces tagline, {colors.accent} column labels and {colors.text-on-dark} links.

### Chat assistant
- **Where.** Website pages only, for visitors and parents. It is hidden until it is set up.
- **Launcher.** A Secondary `md` button, "Ask a question" with the message icon, fixed 16px from the bottom-right corner with `shadow-lg`. It is never Sunset, which stays free for each page's hero button.
- **Window.** The Sheet: a bottom sheet on mobile and a centred 480px panel from `sm` up. The title is "Ask a question." and the description says that answers come from AI using what's on the site, and that people shouldn't share personal details.
- **Messages.** The conversation scrolls inside the sheet, up to half the screen height. The visitor's messages sit on the right on {colors.forest-soft}. The assistant's sit on the left on {colors.cream} with a 1px {colors.border} border. Both use {rounded.md} corners, the {typography.body} style and at most 85% of the width.
- **Empty.** One muted line ("Try one of these, or type your own.") above three starter questions as left-aligned choice chips.
- **Loading.** The assistant's message shows "Writing an answer…" in {colors.text-muted} until the first words arrive, then fills in as it streams. The Send button shows its loading state.
- **Hand-off.** When a person should take over, the assistant's message is followed by a Secondary "Book a free call" button and an Outline "Email us" button. Tapping either closes the sheet. If the assistant wrote nothing else, its message reads "A person on our team can help with that."
- **Closing.** Closing the sheet stops an answer that's still coming in. Whatever had arrived stays in the conversation.
- **Error.** An error Banner above the input: "The assistant didn't answer. Try again, or email us at hello@njia.co.ke." The question goes back into the input so it isn't lost.
- **Input.** A text input labelled "Your question" with a Secondary `md` Send button beside it. Under it, one {typography.small} line in {colors.text-muted}: "AI can make mistakes. Check important details with us."

### Feedback layers
- **Sheet or modal.** A full-screen Ink scrim at 55%.
  - Mobile: the sheet comes up from the bottom with 12px top corners.
  - Desktop: a centred 480px panel.
  - Both use `shadow-lg` and close with Escape or a tap outside.
- **Toast.** An {colors.ink} bar with {colors.cream} text, 12px corners and `shadow-lg`, with an {colors.ochre} check circle. It sits above the tab bar and disappears after 3 seconds.
- **Avatar.** A {rounded.pill} circle with initials. It is {colors.forest} with white text, or {colors.forest-soft} with Forest text.

### Screen states
- **Empty.** A {colors.surface} card with a 56px {colors.forest-soft} icon circle, a {typography.heading} title and one {typography.body} sentence in {colors.text-muted}. It names what comes next, for example "Your mentor will add this week's tasks after your session." Pair it with the one action that fills the space, such as "Book your first session".
- **Loading.** Skeleton blocks: {colors.line} bars and circles inside {colors.surface} cards in the shape of the content that is coming. They don't shimmer, to stay light on mobile data. Buttons that start an action show their loading state, for example "Waiting for your PIN…". Waits such as an M-Pesa prompt show a status card saying what to do: "Check your phone."
- **Error.** A banner on {colors.surface} with a 2px {colors.danger} border and a Sunset alert icon. The text in {colors.text} says what happened and what to do, and reassures where it matters: "Your M-Pesa payment didn't go through. No money was taken." Field errors sit under the field in one sentence. Offer a "Try again" action.
- **Success.** A {colors.forest-soft} banner with a Forest check, or a confirmation page with the path motif and a {typography.display} headline such as "You're booked!". Show the key details, such as date, time and where the link was sent, and one next step.

## Do's and Don'ts

**Do**
- Use Sunset once per screen, for the next step.
- Keep pages mostly Cream and White, with Forest leading.
- Use only the approved text pairings, so text meets WCAG AA contrast.
- Keep every tap target at least 44 × 44px and primary buttons at least 52px tall.
- Give every field a visible label, and show errors under the field in one plain sentence.
- Show a visible focus state on every interactive element.
- Use 16px text in inputs on mobile.
- Design mobile first, then give desktop its own layout.
- Name the action in buttons and headings, and be specific about universities, courses and tasks.

**Don't**
- Don't use Sunset more than once per screen.
- Don't put White text on Sunset below 19px bold.
- Don't put Ochre text on Cream or White. Ochre is decoration only on light backgrounds.
- Don't use Sunset for small error text. Error messages stay Ink, next to a Sunset border and icon.
- Don't use pairings outside the approved list.
- Don't use gradients, blur or glass effects. Colour is flat.
- Don't use transparency, except for Cream hairlines on Ink.
- Don't make pages stark white. The page background is Cream.
- Don't use a serif for body text.
- Don't use Literata for more than one headline per page.
- Don't use uppercase except through the `label` style, and don't put small uppercase labels above headings.
- Don't use title case. Use sentence case everywhere.
- Don't use more than one exclamation mark per screen.
- Don't use emoji, in product or marketing copy, or unicode glyphs as icons.
- Don't use the words guaranteed, elite, easy, hack or agent.
- Don't add shadows to surfaces at rest, or put a shadow on the logo.
- Don't use left-border accent stripes on cards.
- Don't use patterns or textures in backgrounds.
- Don't show the path motif more than once per page.
- Don't use bounces, scale or shrink effects, or page-load animations.
- Don't recolour, stretch, rotate, add effects to, rearrange or retype the logo, and don't show it below 80px wide.
- Don't use glossy stock photography.
- Don't use placeholder text.
- Don't invent colours, fonts, spacing or radius values outside these tokens.
