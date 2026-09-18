# Design System Port — Culiat Public Safety

You are applying an existing design system to this subdomain app. The parent site is
`culiatpublicsafety.com` (React 19 + Vite + Tailwind CSS v4 + shadcn-style components).
This subdomain must look like it was built by the same team on the same day: same colors,
same fonts, same card shape, same motion, same light/dark theme.

Do NOT invent your own palette, radii, shadows, or font pairings. Everything you need is
specified below. Where this app already has components, restyle them to match these tokens
instead of adding a second competing style layer.

---

## 1. Stack requirements

- Tailwind CSS **v4** (CSS-first config via `@theme inline`, NOT `tailwind.config.js`).
- Install: `tailwindcss @tailwindcss/vite tw-animate-css clsx tailwind-merge class-variance-authority @radix-ui/react-slot lucide-react`
- Vite plugin: `tailwindcss()` from `@tailwindcss/vite`, alias `@` -> `./src`.
- `cn()` helper in `src/lib/utils.ts`:
  ```ts
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";
  export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
  ```
- Icons: **lucide-react only**. No emoji icons, no other icon set.

## 2. Fonts

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet"/>
```

- **Manrope** = body / UI font (`--font-sans`, applied to `body`).
- **Sora** = display font (`--font-display`, used via the `font-display` class) for ALL headings,
  stat numbers, card titles, and logo text. Headings are heavy: `font-black` (900) for hero and
  section headings, `font-extrabold` (800) for card titles.

## 3. Theme tokens — copy verbatim into `src/index.css`

```css
@import "tailwindcss" source(none);
@source ".";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --font-sans: "Manrope", sans-serif;
  --font-display: "Sora", sans-serif;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-brand-surface: var(--brand-surface);
  --color-brand-surface-foreground: var(--brand-surface-foreground);
  --color-brand-surface-muted: var(--brand-surface-muted);
  --color-footer: var(--footer);
  --color-footer-foreground: var(--footer-foreground);
  --color-footer-muted: var(--footer-muted);
  --color-footer-accent: var(--footer-accent);
}

:root {
  color-scheme: light;
  --radius: 1rem;
  --background: oklch(0.985 0.009 145);
  --foreground: oklch(0.18 0.025 150);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.025 150);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.025 150);
  --primary: oklch(0.47 0.145 150);          /* deep civic green — the brand color */
  --primary-foreground: oklch(0.985 0.005 145);
  --secondary: oklch(0.935 0.03 145);
  --secondary-foreground: oklch(0.27 0.07 150);
  --muted: oklch(0.955 0.015 145);
  --muted-foreground: oklch(0.47 0.025 155);
  --accent: oklch(0.925 0.055 145);
  --accent-foreground: oklch(0.3 0.095 150);
  --destructive: oklch(0.58 0.22 27);
  --destructive-foreground: oklch(0.985 0.005 145);
  --border: oklch(0.87 0.03 145);
  --input: oklch(0.87 0.03 145);
  --ring: oklch(0.54 0.15 150);
  --brand-surface: oklch(0.47 0.145 150);
  --brand-surface-foreground: oklch(0.985 0.005 145);
  --brand-surface-muted: oklch(0.86 0.045 145);
  --footer: oklch(0.145 0.025 150);
  --footer-foreground: oklch(0.965 0.01 145);
  --footer-muted: oklch(0.69 0.025 150);
  --footer-accent: oklch(0.76 0.16 145);

  --ease-theme: cubic-bezier(0.65, 0, 0.35, 1);
  --theme-fill-duration: 1150ms;
  --theme-fade-duration: 900ms;
}

.dark {
  color-scheme: dark;
  /* Dark mode is BLACK AND GREEN, not dark-green-on-dark-green: every neutral
     sits at zero chroma and the green appears only as an accent. Surfaces still
     climb in lightness with elevation so cards read as raised, not painted on. */
  --background: oklch(0.125 0 0);
  --foreground: oklch(0.97 0 0);
  --card: oklch(0.18 0 0);
  --card-foreground: oklch(0.97 0 0);
  --popover: oklch(0.195 0 0);
  --popover-foreground: oklch(0.97 0 0);
  --primary: oklch(0.76 0.155 148);
  --primary-foreground: oklch(0.14 0.02 152);
  --secondary: oklch(0.235 0 0);
  --secondary-foreground: oklch(0.96 0 0);
  --muted: oklch(0.205 0 0);
  --muted-foreground: oklch(0.74 0 0);
  /* The one tinted neutral: hover states earn a trace of brand. */
  --accent: oklch(0.28 0.045 150);
  --accent-foreground: oklch(0.95 0.02 145);
  --destructive: oklch(0.68 0.19 25);
  --destructive-foreground: oklch(0.97 0.005 145);
  --border: oklch(0.31 0 0);
  --input: oklch(0.31 0 0);
  --ring: oklch(0.76 0.155 148);
  /* Full-bleed brand bands stay deep in dark mode — a 0.76-lightness green at that size glares. */
  --brand-surface: oklch(0.34 0.095 152);
  --brand-surface-foreground: oklch(0.97 0.01 145);
  --brand-surface-muted: oklch(0.78 0.05 148);
  --footer: oklch(0.09 0 0);
  --footer-foreground: oklch(0.96 0 0);
  --footer-muted: oklch(0.7 0 0);
  --footer-accent: oklch(0.78 0.155 148);
}
```

**Rule: never hardcode a hex color in a component.** Always use the token utilities
(`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary/10`, `text-primary`, ...).

## 4. Base layer, utilities and keyframes — also copy verbatim

```css
@layer base {
  * { border-color: var(--color-border); }

  /* Two faint brand glows give the black canvas depth without washing it green.
     Keep them at 5%/3% — at 13%/7% the whole page reads as dark green. */
  .dark body {
    background-image:
      radial-gradient(110rem 55rem at 78% -12%, color-mix(in oklab, var(--color-primary) 5%, transparent), transparent 62%),
      radial-gradient(80rem 50rem at 4% 8%, color-mix(in oklab, var(--color-primary) 3%, transparent), transparent 58%);
  }

  html { scroll-behavior: smooth; }

  body {
    margin: 0;
    background-color: var(--color-background);
    background-attachment: fixed;
    color: var(--color-foreground);
    font-family: var(--font-sans);
    letter-spacing: 0;
  }

  a, button, section, header, footer, div, span {
    transition-property: box-shadow, opacity, transform;
    transition-duration: 700ms;
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
}

/* Small uppercase green eyebrow above every section heading. */
@utility section-label {
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

/* Faint 56px grid behind hero sections, masked out toward the bottom. */
@utility civic-grid {
  --grid-line: color-mix(in oklab, var(--color-primary) 8%, transparent);
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, black 10%, transparent 90%);
}
.dark .civic-grid { --grid-line: color-mix(in oklab, var(--color-primary) 15%, transparent); }

@utility signal-line {
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  animation: signal-sweep 5s ease-in-out infinite;
}

@utility animate-rise { animation: rise-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@utility animate-float { animation: float-card 7s ease-in-out infinite, rise-in 900ms 180ms cubic-bezier(0.22, 1, 0.36, 1) both; }

/* Inner top highlight + deep drop shadow so dark-mode cards read as raised glass. */
.dark [class*="bg-card"] {
  box-shadow:
    0 1px 0 0 color-mix(in oklab, white 7%, transparent) inset,
    0 24px 60px -32px oklch(0 0 0 / 0.85);
}

/* THE signature card hover. Put this on every interactive card. */
@utility system-card {
  transition: transform 450ms cubic-bezier(0.22, 1, 0.36, 1), border-color 450ms ease, box-shadow 450ms ease;
  &:hover {
    transform: translateY(-8px);
    border-color: color-mix(in oklab, var(--color-primary) 50%, transparent);
    box-shadow: 0 28px 65px -34px color-mix(in oklab, var(--color-primary) 55%, transparent);
  }
}

/* Scroll reveal, driven by the useRevealOnScroll hook. */
.reveal-ready [data-reveal] { opacity: 0; transform: translateY(32px); }
.reveal-ready [data-reveal][data-visible="true"] { opacity: 1; transform: translateY(0); transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1); }
.reveal-ready [data-reveal][data-visible="false"] { opacity: 0.2; transform: translateY(22px); }

@keyframes rise-in { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
@keyframes float-card { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes signal-sweep { 0%, 100% { opacity: 0.25; transform: scaleX(0.65); } 50% { opacity: 0.8; transform: scaleX(1); } }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
  .reveal-ready [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

## 5. Button component — `src/components/ui/button.tsx`

Every button in the app is **fully rounded (`rounded-full`)**, min-height 44px, `font-bold`,
`text-sm`. Recreate exactly:

```tsx
const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl",
        primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-border bg-card/80 text-foreground shadow-sm backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "size-11 shrink-0 border border-border bg-card/80 p-0 text-foreground shadow-sm backdrop-blur-xl hover:rotate-6 hover:bg-accent",
      },
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-13 px-7 text-base",
        icon: "size-11 p-0",
        "icon-sm": "size-9 min-h-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);
```

Support `asChild` via `@radix-ui/react-slot` so buttons can wrap `<a>` / `<Link>`.

## 6. The card recipe (use this everywhere)

**Standard content card:**

```
rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl
```

**Interactive / clickable card:** add `system-card group`, and give it `data-reveal`.

**Icon chip inside a card** (48px rounded square that fills with brand green on hover):

```tsx
<span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:rotate-3 group-hover:bg-primary group-hover:text-primary-foreground">
  <Icon className="size-6" />
</span>
```

**Full card structure to mirror:**

```tsx
<article data-reveal className="system-card group flex min-h-80 flex-col rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
  <div className="flex items-start justify-between gap-4">
    {/* icon chip here */}
    <ArrowUpRight className="size-5 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
  </div>
  <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-primary">EYEBROW</p>
  <h3 className="mt-2 font-display text-xl font-extrabold leading-snug">Title</h3>
  <p className="mt-3 text-sm leading-6 text-muted-foreground">Description copy.</p>
  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
    <span>meta</span>
    <Button size="sm" variant="outline">Action</Button>
  </div>
</article>
```

Card grid: `grid gap-5 md:grid-cols-2 xl:grid-cols-3`.

Other surface patterns:

- **Pill / badge:** `rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary`
- **Stat block:** `font-display text-2xl font-black text-primary` over `text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted-foreground`
- **Modal / dialog:** native `<dialog>` with `rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/30 backdrop:backdrop-blur-sm`
- **Input surface:** `rounded-2xl border border-border bg-muted p-3` wrapping a transparent, outline-free `<input>` / `<textarea>`
- **Card on a green band:** `rounded-3xl border border-brand-surface-foreground/20 bg-brand-surface-foreground/10 p-6 backdrop-blur-sm`

## 7. Layout rules

- Page shell: `min-h-screen bg-background text-foreground`.
- Section padding: `px-5 py-20 sm:px-8 lg:px-12 lg:py-28`.
- Max content width when centered: `mx-auto w-full max-w-[100rem]`.
- Alternate section backgrounds for rhythm: plain `bg-background` → `border-y border-border bg-muted/35`
  → `bg-brand-surface text-brand-surface-foreground` (full-bleed green band) → `bg-footer text-footer-foreground`.
- Sticky header: `fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl`,
  height `h-20 lg:h-24`, with the Barangay Culiat seal at `size-11 sm:size-13 lg:size-16` beside a two-line
  lockup (Sora extrabold title + tiny uppercase tracked subtitle in `text-muted-foreground`).
- Every anchored section gets `scroll-mt-24` or larger to clear the fixed header.
- Nav links: `rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground`.
- Footer: `w-full bg-footer text-footer-foreground`, seal + wordmark left, meta right, muted text in `text-footer-muted`.

## 8. Typography scale

| Role | Classes |
|---|---|
| Hero h1 | `font-display text-5xl font-black leading-[1.02] sm:text-6xl lg:text-7xl xl:text-8xl` |
| Section h2 | `font-display text-4xl font-black leading-tight sm:text-5xl` |
| Card h3 | `font-display text-xl font-extrabold leading-snug` |
| Section eyebrow | the `section-label` utility |
| Body | `text-base leading-8 text-muted-foreground sm:text-lg` |
| Card body | `text-sm leading-6 text-muted-foreground` |
| Micro label | `text-xs font-extrabold uppercase tracking-[0.16em] text-primary` |

Accent a single word inside a heading with `<span className="text-primary">word</span>`.

## 9. Dark mode + theme toggle

**Dark mode is black and green — never dark-green-on-dark-green.** Light mode carries a
warm green tint through its neutrals; dark mode must not. Every dark neutral
(`--background`, `--card`, `--popover`, `--secondary`, `--muted`, `--border`, `--input`,
`--footer` and their foregrounds) sits at **zero chroma** — `oklch(L 0 0)`. Tinting them
(the old values ran 0.022–0.038 chroma at hue 152) makes the whole canvas read as murky
dark green instead of black, and it is the single easiest way to wreck this theme.

Green stays where it is genuinely an accent, at full strength:

- `--primary` and `--ring` — buttons, links, icon chips, `text-primary` numerals like the
  `01 / 02 / 03` step cards
- `--brand-surface` — the full-bleed brand band
- `.section-label` eyebrows
- `--footer-accent`
- `--accent` is the one deliberate exception among the neutrals: it keeps a **trace** of
  green (`oklch(0.28 0.045 150)`) so hover states feel branded rather than dead grey.

The two `.dark body` radial glows are capped at **5% / 3%** primary. They exist only to
stop the page flattening into `#000`; push them higher and they re-tint the whole canvas.

Dark mode is class-based on `<html>`. Implement exactly this behavior:

1. On mount, read `localStorage["culiat-theme"]`; fall back to `matchMedia("(prefers-color-scheme: dark)")`,
   then `document.documentElement.classList.toggle("dark", shouldUseDark)`.
2. The toggle is `<Button variant="icon" size="icon">` containing overlapping Sun/Moon lucide icons that
   rotate and scale-swap: `absolute size-5 transition-all duration-700 [transition-timing-function:var(--ease-theme)]`,
   the hidden one at `rotate-90 scale-0 opacity-0`.
3. Transition: if `document.startViewTransition` exists and reduced-motion is off, run the flip inside
   `startViewTransition(() => flushSync(() => applyTheme(next)))`, then animate `::view-transition-new(root)`
   with `clipPath` from `circle(0px at Xpx Ypx)` to `circle(Rpx at Xpx Ypx)`, where X/Y is the toggle button's
   center and `R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))`.
   Duration 1150ms, easing `cubic-bezier(0.65, 0, 0.35, 1)`.
4. Fallback for other browsers: add a `.theme-transition` class to `<html>` for ~960ms that cross-fades the
   color tokens, then remove it. Supporting CSS:

```css
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
::view-transition-old(root) { z-index: 1; }
::view-transition-new(root) { z-index: 2; }
html.theme-transition, html.theme-transition *, html.theme-transition *::before, html.theme-transition *::after {
  transition:
    background-color var(--theme-fade-duration) var(--ease-theme),
    border-color var(--theme-fade-duration) var(--ease-theme),
    color var(--theme-fade-duration) var(--ease-theme),
    fill var(--theme-fade-duration) var(--ease-theme),
    stroke var(--theme-fade-duration) var(--ease-theme),
    box-shadow var(--theme-fade-duration) var(--ease-theme) !important;
  transition-delay: 0s !important;
}
```

## 10. Scroll reveal hook — `src/hooks/use-reveal.ts`

```ts
import { useEffect } from "react";

export function useRevealOnScroll() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.setAttribute("data-visible", "true"));
      return;
    }
    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) =>
          (e.target as HTMLElement).setAttribute("data-visible", e.isIntersecting ? "true" : "false"),
        ),
      { threshold: 0.12, rootMargin: "0px 0px -40px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);
}
```

Call it once at the top of each page and put `data-reveal` on cards, headings, and sections.

## 11. Motion vocabulary (keep it consistent)

- Signature easing: `cubic-bezier(0.22, 1, 0.36, 1)` for entrances and hovers.
- Theme easing: `cubic-bezier(0.65, 0, 0.35, 1)`.
- Card hover lift `-8px`; button hover lift `hover:-translate-y-0.5`.
- Icon buttons rotate `6deg` on hover; card icon chips rotate `3deg`.
- Hero main column uses `animate-rise`; hero side panel uses `animate-float`.
- Always respect `prefers-reduced-motion`.

## 12. Accessibility & quality bar

- Every icon-only control needs an `aria-label`; decorative visuals get `aria-hidden="true"`.
- Focus ring on all interactive elements: `focus-visible:ring-3 focus-visible:ring-ring/40`.
- Minimum tap target 44px (`min-h-11`).
- Fully responsive down to 360px with no horizontal scroll. Mobile nav collapses to a `Menu`/`X` icon
  button revealing an `max-h-0` → `max-h-80` animated panel.
- Verify both light and dark; contrast must hold in both.

---

## What I want you to do

1. Set up the stack and drop in the token CSS, fonts, `cn()`, Button, and reveal hook above.
2. Restyle every existing screen in this subdomain to use these tokens and patterns — header, cards,
   tables, forms, modals, empty states, footer.
3. Keep this app's own content, routes, and functionality exactly as they are. This is a visual/design
   port only; do not change business logic or data flow.
4. Add the theme toggle to the header and persist the choice under a subdomain-appropriate localStorage key.
5. Tell me about anything in this app that has no equivalent pattern above (data tables, charts, pagination,
   file uploads) and propose styling that follows the same rules — `rounded-3xl` surfaces, `border-border`,
   `bg-card/95`, Sora headings, green `--primary` accents — rather than importing a different look.
