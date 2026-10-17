# Njia Brand Guide

**Brand:** Njia (Swahili for "path")
**Direction:** The Trusted Sibling — the warmth of an older sibling, with the credibility a parent needs to see.
**Version:** 1.0

---

## 1. Brand concept

### What Njia does
Njia pairs Kenyan students with Kenyan mentors who studied at their dream UK or European university, for guidance from application to settling in.

### Mission
No ambitious Kenyan student should have to find their way to a top UK or European university alone.

### Primary audience
**Students like Cynthia:** 17 to 19 years old, finishing A-levels or IB in Kenya (for example, at Nairobi International School), dreaming of universities like Oxford, Cambridge, LSE and UCL. She has no one to ask about choosing a course, writing essays, applying, or preparing to move abroad.

### Secondary audience
**Parents.** They pay and want proof that their child is in safe, serious hands. They have no login; they receive regular progress reports by email. Every page must win the student's heart and the parent's trust at the same time.

### Positioning
Njia is the only service where a Kenyan who studied at your dream university guides you from application to settling in.

| Alternative | What it lacks | How Njia is different |
|---|---|---|
| Education agents | Expensive, often stop at the offer letter, rarely went to the school themselves | Mentors studied at the exact university, and support continues after arrival |
| Google and YouTube | Generic, mostly made for UK or US students | Personal guidance that fits a Kenyan background |
| School careers counsellors | Stretched across many students, little first-hand experience abroad | One dedicated mentor with regular sessions and weekly tasks |
| A cousin's friend who went abroad | Kind but informal and unreliable | Structured and accountable, with progress reports for parents |

### Brand pillars
1. **Been there.** Every mentor is Kenyan and studied at the university the student wants. Advice comes from lived experience, not a brochure.
2. **A clear path.** Free consultation, careful matching, weekly sessions and tasks, and progress reports for parents. Students always know their next step.
3. **With you all the way.** Support continues after the offer letter: accommodation, bank accounts, SIM cards, transport and finding community.

### Visual feel
Njia looks like a trusted family friend who is also very organised. Deep forest green signals trust to parents; a single warm sunset accent welcomes students. Pages sit on warm cream, never stark white. Headlines are serif and friendly, body text is clean and easy to read on a phone. Corners are soft but not bubbly. Photos show real mentors and students, in Kenya and on campus abroad. A short line of rising stepping-stone dots (the path motif) echoes the name Njia.

---

## 2. Colour palette

All values are exact. There is one theme (light). The "dark background" is Ink.

| Brand name | Token | Hex | Role |
|---|---|---|---|
| Forest | `forest` | `#1F4D3A` | Primary brand colour. Main buttons, header bands, links, icons, the logo on light backgrounds. Signals trust. |
| Sunset | `sunset` | `#C8551B` | Warm accent. Exactly one highlight per screen, usually the main call to action. Logo stones and letter dots on light backgrounds. |
| Ochre | `ochre` | `#E3A43B` | Decoration only: the path motif, illustrations, badges with Ink text, logo stones and letter dots on dark backgrounds. |
| Cream | `surface` | `#FBF6EE` | Page background. Use instead of white for pages. Logo lettering on dark backgrounds. |
| White | `surface-raised` | `#FFFFFF` | Cards, forms and panels sitting on Cream. |
| Forest-soft | `forest-soft` | `#DCE8E0` | Tinted backgrounds: mentor cards, labels, tags, completed tasks. |
| Ink | `ink` | `#1C2A23` | Primary text and headlines. Also the dark background colour. |
| Ink-muted | `ink-muted` | `#5A6660` | Secondary text, captions, metadata, form hints. |
| Line | `line` | `#E6DCCB` | Borders, dividers, input borders. |
| White on Forest | `on-forest` | `#FFFFFF` | Text and icons on Forest or Sunset fills. |

### Balance
Mostly Cream and White. Forest is the main colour. Sunset appears once per screen as the highlight. Ochre is a small touch of warmth.

### Contrast (WCAG 2.1)

| Text | Background | Ratio | Allowed for |
|---|---|---|---|
| Ink | Cream | 13.89:1 | All text |
| Ink | White | 14.95:1 | All text |
| Ink | Forest-soft | 11.86:1 | All text |
| Ink | Ochre | 6.86:1 | All text (badges) |
| Ink-muted | Cream | 5.57:1 | All text |
| Ink-muted | White | 5.99:1 | All text |
| Ink-muted | Forest-soft | 4.75:1 | All text |
| Forest | Cream | 8.95:1 | All text, links |
| Forest | Forest-soft | 7.64:1 | All text, labels |
| White | Forest | 9.63:1 | All text |
| Cream | Ink | 13.89:1 | All text (dark backgrounds) |
| Ochre | Ink | 6.86:1 | All text (dark backgrounds) |
| White | Sunset | 4.40:1 | Large text only: 24px+ regular or 19px+ bold |
| Sunset | Cream | 4.09:1 | Large text only: 24px+ regular or 19px+ bold |
| Ochre | Forest | 4.42:1 | Large text only, or decoration |
| Ochre | Cream or White | 2.02:1 | Never for text. Decoration only. |

### Colour rules
- Text on Forest or Sunset is always White.
- Sunset button labels are DM Sans 700 at 19px or larger, so they meet contrast.
- Never put Ochre text on Cream or White.
- Never use gradients. Use flat colour only.

---

## 3. Typography

Three fonts, all free on Google Fonts.

| Font | Weights to load | Role | Fallback stack |
|---|---|---|---|
| **Literata** | 600 | The one big hero headline per page | `"Literata", Georgia, "Times New Roman", serif` |
| **Fraunces** | 600 | Screen titles, section headings, card titles, the logo | `"Fraunces", Georgia, "Times New Roman", serif` |
| **DM Sans** | 400, 500, 600, 700 | Everything else: paragraphs, buttons, forms, labels, navigation | `"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif` |

Google Fonts URL:
`https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,600&family=Fraunces:opsz,wght@9..144,600&family=DM+Sans:wght@400;500;600;700&display=swap`

### Type scale

| Token | Font | Weight | Size | Line height | Letter spacing | Use |
|---|---|---|---|---|---|---|
| `display` | Literata | 600 | 60px (mobile 40px) | 64px (mobile 44px) | -0.01em | Hero headline. One per page. |
| `title` | Fraunces | 600 | 32px | 40px | 0 | Screen titles |
| `heading` | Fraunces | 600 | 22px | 30px | 0 | Section headings, card titles |
| `body-lg` | DM Sans | 400 | 18px | 29px | 0 | Intro paragraphs under headlines |
| `body` | DM Sans | 400 | 16px | 26px | 0 | All running text |
| `small` | DM Sans | 400 | 14px | 22px | 0 | Supporting details, form hints, captions |
| `label` | DM Sans | 600 | 12px | 16px | 0.08em, uppercase | Small labels above cards and sections |
| `button` | DM Sans | 700 | 19px | 24px | 0 | Button labels |

### Type rules
- Only one Literata headline per page.
- Fraunces for every other heading. Never use Fraunces or Literata for body text.
- Headings use Ink (or White on Forest). Body uses Ink; secondary text uses Ink-muted.

---

## 4. Shape, spacing and motif

### Corner radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | Inputs, checkboxes, small badges |
| `radius-md` | 12px | Cards, buttons, panels, images |
| `radius-pill` | 999px | Tags, avatars, path motif dots |

### Spacing

| Token | Value | Use |
|---|---|---|
| `space-2` | 8px | Gaps between small related items |
| `space-4` | 16px | Card padding on mobile, gaps between form fields |
| `space-6` | 24px | Card padding on desktop, gaps between cards |
| `space-10` | 40px | Minimum space between page sections (use 96px on desktop landing pages) |

### Components (defaults)
- **Primary button:** Sunset fill, White label, `button` type, `radius-md`, padding 16px 28px, minimum height 52px. One per screen.
- **Secondary button:** Forest fill, White label, `radius-md`, minimum height 44px.
- **Text link:** Forest, DM Sans 600.
- **Card:** White on Cream, 1px Line border, `radius-md`, padding `space-4` (mobile) / `space-6` (desktop).
- **Tag:** Forest-soft fill, Forest text, `label` type, `radius-pill`.
- **Checkbox:** 20px, `radius-sm`, 2px Forest border; checked = Forest fill with a White tick.
- **Touch targets:** at least 44px tall.

### The path motif
A short line of 3 to 4 round dots (`radius-pill`) rising from lower left to upper right, like stepping stones. Warm colours lead to a solid final dot (on light: Ochre or Sunset leading to Forest; on dark: Ochre leading to Cream). Use it once per page at most.

### Icons
Simple line icons, 2px stroke, rounded ends and joins, in Forest. No emoji.

---

## 5. Logo

### Primary logo: wordmark with symbol
Three stepping stones rising toward the word "Njia," set in Fraunces SemiBold (wght 600, opsz 72, SOFT 50, WONK 0) and converted to outlines. Two warm stones lead to a solid "destination" stone. The dots on the "j" and "i" are coloured with the accent.

| Variant | File | Stones (1, 2, 3) | Lettering | Dots on "j" and "i" | Use on |
|---|---|---|---|---|---|
| Light | `njia-lockup.svg` | Sunset, Sunset, Forest | Forest | Sunset | Cream, White, Forest-soft |
| Dark | `njia-lockup-dark.svg` | Ochre, Ochre, Cream | Cream | Ochre | Ink, Forest, dark photos |

### Secondary marks

| Mark | File | Description | Use on |
|---|---|---|---|
| Wordmark (light) | `njia-wordmark.svg` | Forest lettering, Sunset dots on "j" and "i" | Light backgrounds where the symbol won't fit |
| Wordmark (dark) | `njia-wordmark-dark.svg` | Cream lettering, Ochre dots | Dark backgrounds |
| App icon | `njia-app-icon.svg` | Forest rounded square (512 × 512, corner radius 112) with three stones: Ochre (r 50), Ochre (r 54), Cream (r 70), rising from lower left to upper right | App icon, favicon, browser tab, social profile pictures. Works on light and dark backgrounds. |

### Logo rules
- **Minimum size:** primary logo at 80px wide or larger. Below 80px, use the app icon.
- **Clear space:** keep empty space on every side at least equal to the diameter of the largest stepping stone.
- **Background:** always use the variant made for the background (light or dark). Place on plain backgrounds with good contrast.
- **Do:** use the SVG files exactly as supplied.
- **Don't:** recolour, stretch, squash, rotate, add shadows, outlines or gradients, rearrange or remove the stones, change the dot colours, or retype "Njia" in any font.

---

## 6. Voice and tone

### Personality
A smart, kind older sibling: warm and encouraging, honest and well-informed. Plain words, short sentences. Never talks down, never overpromises.

| Audience | Tone |
|---|---|
| Students | Friendly, personal, encouraging |
| Parents | Calm, clear, reassuring |

### Words we always use

| Word | Why |
|---|---|
| Together | We walk the path with the student |
| Next step | Progress is always clear and small |
| Been there | Our mentors have lived it |
| Guide | We guide; we don't do it for them |
| Home | Mentors share the student's background |

### Words we never use

| Word | Why |
|---|---|
| Guaranteed | We never promise admission |
| Elite | We are welcoming, not exclusive |
| Easy | Applying is hard; we're honest about it |
| Hack | No shortcuts or tricks |
| Agent | We are mentors, not education agents |

### Writing rules
- Use "you" for the student and "we" for Njia.
- Lead with the next step. Keep sentences short.
- Be specific: name universities, courses and real tasks.
- No exclamation-mark overload; one at most per screen.
- No emoji in product or marketing copy.

### Example headlines
- "Someone from home who's already been there."
- "A clear path, one next step at a time."
- "The offer letter is just the beginning."
- "Your path starts with one free call."

---

## 7. Photography

- Real mentors and students, smiling and natural.
- Settings in Kenya (Nairobi streets, homes, schools) and abroad (campuses, cities, student halls), to show the journey.
- Warm, natural light. Never glossy stock photos or staged corporate shots.
- Images use `radius-md` corners.

---

## 8. Checklist

Before anything goes out, check that:
- It uses the right logo file for the background, at 80px or wider (or the app icon below that).
- Forest leads, Sunset appears once as the highlight, and the page background is Cream.
- There is only one Literata headline, with Fraunces headings and DM Sans for everything else.
- Every text colour pairing is allowed in the contrast table.
- It sounds like a kind older sibling and uses none of the "never" words.
