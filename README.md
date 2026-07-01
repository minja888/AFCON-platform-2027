# Karibu Arusha — AFCON Pamoja 2027 Tourism Platform

A lightweight, multilingual tourism web app that turns **AFCON Pamoja 2027** football
fans into multi-day **Arusha** tourists, and connects them to **licensed local operators on WhatsApp**.

> *"Come for the football. Stay for Tanzania."*

Built by **TUNAWEZA GROUP** for the Office of the Regional Administrative Secretary (RAS), Arusha.
No app to download, works on low data, hosts for free.

---

## ▶️ How to run it

**Easiest:** double-click `index.html` — it opens in any browser and works offline
(flags, photos and fonts need internet; everything else runs offline).

**Or serve locally** (recommended while editing):
```bash
# from this folder
python -m http.server 8000
# then open http://localhost:8000
```

---

## 🧭 What's inside

| File | What it does |
|------|--------------|
| `index.html`  | Page shell, header nav, footer, language switcher |
| `styles.css`  | All styling (warm savanna theme, mobile-first) |
| `data.js`     | **Edit this** — trips, operators, matches, "Discover Arusha" facts, config |
| `countries.js`| All 199 countries with ISO codes + international dial codes |
| `i18n.js`     | Interface text in **6 languages** (EN, SW, FR, AR, PT, HA) |
| `app.js`      | Routing, rendering, registration/login backend, WhatsApp booking |

---

## 🌍 Pages & features

- **Home** — scroll-gallery bento hero, match schedule, floating trip cards, register CTA
- **Trips** — filter by 1 / 2 / 3 days, delightful floating cards, full trip details
- **Operators** — searchable, filterable directory of verified/licensed businesses
- **Matches** — football-themed fixtures with **real team flags** (waving animation)
- **Discover Arusha** — wow-facts (Big Five, Kilimanjaro…) + wonders within reach of the stadium
- **Register** — visitor sign-up: name, searchable country picker (auto dial-code + flag), phone/email, **password**
- **Login** — returning visitors sign in with email/phone + password
- **Admin** — passcode-gated registrations panel with CSV export (footer link)
- **About** — how it works + who benefits

Booking flow: open a trip → **Book on WhatsApp** → pick a licensed operator → WhatsApp opens
with a pre-filled message. **The platform never handles money** — fans pay operators directly.

---

## 🗂️ The "backend" (demo)

Registrations and tourist accounts are stored in the browser (`localStorage`) so the demo
works offline. To collect data centrally, paste a form endpoint into
`window.CONFIG.registrationEndpoint` (Formspree / Google Apps Script / Supabase) — no code change.

> ⚠️ The tourist password + admin passcode are **client-side only** (demo-grade, not real security).
> For genuine accounts, wire `registrationEndpoint` to a real backend with server-side auth.

---

## ✏️ Common edits (no real coding)

- **Add a trip** → copy a block in `window.TRIPS` (in `data.js`); change text/price/icon.
- **Add an operator** → copy a block in `window.OPERATORS`.
- **Update matches** → edit `window.MATCHES` once CAF confirms fixtures (`home`/`away` use ISO codes like `tz`, `dz`).
- **WhatsApp number** → `window.CONFIG.visitorDeskWhatsApp` (intl format, digits only, e.g. `255787540009`). All operator links route here for the demo.
- **Admin passcode** → `window.CONFIG.adminCode` — **change from the default before launch.**

> After editing a `.js`/`.css` file, bump the `?v=` number on that asset in `index.html`
> so browsers load the fresh version (cache-busting).

---

## 🚀 Free hosting

Static site — any host works:
- **GitHub Pages** — Settings → Pages → deploy from `main` (root). Live in ~1 min.
- **Netlify Drop** — drag this folder onto https://app.netlify.com/drop
- **Vercel** — import the repo

Then generate a **QR code** to the live URL for stadium / airport / hotel posters.

---

## ✅ Before the RAS demo / launch

1. Change `adminCode` from the default.
2. Confirm the Visitor Desk WhatsApp number.
3. Update `MATCHES` with confirmed fixtures.
4. Confirm trip prices with each operator.
5. Host it and make a QR code.
