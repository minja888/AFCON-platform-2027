/* =====================================================================
   KARIBU ARUSHA — APP LOGIC
   Hash router · i18n · trip/operator views · WhatsApp booking · dashboard
   No build step, no server. Just open index.html.
   ===================================================================== */

(function () {
  "use strict";

  const RTL = ["ar"];
  let lang = localStorage.getItem("ka_lang") || "en";

  /* ---------- translation helpers ---------- */
  function t(key) {
    const dict = window.I18N[lang] || window.I18N.en;
    return (key in dict ? dict[key] : window.I18N.en[key]) ?? key;
  }
  // localized content field (object with en/sw…) -> string, fallback en
  function L(field) {
    if (field == null) return "";
    if (typeof field === "string") return field;
    return field[lang] || field.en || Object.values(field)[0] || "";
  }

  /* ---------- WhatsApp link builder ---------- */
  function waLink(number, extra) {
    const msg = t("wa_msg") + (extra || "");
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  }

  /* ---------- apply static translations (data-i18n) ---------- */
  function applyStaticI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? "rtl" : "ltr";
    const footWa = document.getElementById("footerWhatsApp");
    if (footWa) footWa.href = waLink(window.CONFIG.visitorDeskWhatsApp, "the Visitor Desk");
    const footCredit = document.getElementById("footerCredit");
    if (footCredit && heroVideoList().length && window.CONFIG.heroVideoCredit) footCredit.textContent = window.CONFIG.heroVideoCredit;
  }

  /* ---------- small DOM helper ---------- */
  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }
  const app = document.getElementById("app");
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ISO-2 country code -> flag emoji (regional indicator letters) */
  function flag(iso) {
    if (!iso) return "";
    return iso.toUpperCase().replace(/[A-Z]/g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
  }
  /* real flag IMAGES (flagcdn) — render everywhere incl. Windows, unlike emoji flags */
  function flagUrl(iso, w) { return `https://flagcdn.com/w${w || 40}/${String(iso).toLowerCase()}.png`; }
  function flagImg(iso, cls) {
    if (!iso) return `<span class="flag-img flag-tbd ${cls || ""}">⚽</span>`;
    return `<img class="flag-img ${cls || ""}" src="${flagUrl(iso, 80)}" srcset="${flagUrl(iso, 160)} 2x" alt="" loading="lazy" decoding="async" />`;
  }

  /* ---------- registrations "backend" (localStorage; optional POST to CONFIG.registrationEndpoint) ---------- */
  const REG_KEY = "ka_registrations";
  function getRegs() { try { return JSON.parse(localStorage.getItem(REG_KEY)) || []; } catch (e) { return []; } }
  function saveReg(rec) {
    const all = getRegs(); all.push(rec);
    localStorage.setItem(REG_KEY, JSON.stringify(all));           // 1) keep a local copy (offline-safe)
    const url = window.CONFIG && window.CONFIG.registrationEndpoint;
    if (url) { try { fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) }); } catch (e) {} }
    // 2) send to the central Supabase database (visible across all devices)
    const sb = window.CONFIG && window.CONFIG.supabase;
    if (sb && sb.url && sb.anonKey) {
      try {
        fetch(sb.url + "/rest/v1/registrations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": sb.anonKey,
            "Authorization": "Bearer " + sb.anonKey,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            name: rec.name, country: rec.country, country_code: rec.countryCode,
            dial: rec.dial || null, phone: rec.phone || null, zone: rec.zone || null,
            email: rec.email || null, interest: rec.interest || null, lang: rec.lang
          })
        }).catch(() => {});
      } catch (e) {}
    }
    return all.length;
  }
  function clearRegs() { localStorage.removeItem(REG_KEY); }
  function exportRegsCSV() {
    const rows = getRegs();
    const head = ["Registered", "Name", "Country", "Dial", "Phone", "Email", "Interest"];
    const data = rows.map(r => [r.ts, r.name, r.country, r.dial || "", r.phone || "", r.email || "", r.interest || ""]);
    const csv = [head].concat(data)
      .map(row => row.map(f => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "karibu-arusha-registrations.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- tourist accounts (simple password, localStorage-backed "backend") ---------- */
  const USER_KEY = "ka_user";
  function hashPass(str) {                 // lightweight obfuscation — NOT crypto-secure
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return "h" + h.toString(16);
  }
  function getCurrentUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } }
  function setCurrentUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
  function logoutUser() { localStorage.removeItem(USER_KEY); }
  const normId = (s) => String(s || "").toLowerCase().replace(/[\s+]/g, "");
  function findRegByLogin(id) {            // match a saved registration by email or phone
    const raw = String(id || "").trim().toLowerCase();
    const nid = normId(id);
    if (!nid) return null;
    return getRegs().find(r =>
      (r.email && r.email.toLowerCase() === raw) ||
      (r.phone && nid.length >= 6 && normId(r.phone).endsWith(nid))
    ) || null;
  }
  function updateAuthNav() {
    const u = getCurrentUser();
    const login = document.getElementById("navLogin");
    const reg = document.getElementById("navRegister");
    const chip = document.getElementById("navUser");
    const nameEl = document.getElementById("navUserName");
    if (!login || !reg || !chip) return;
    if (u && u.name) {
      login.hidden = true; reg.hidden = true; chip.hidden = false;
      nameEl.textContent = "👋 " + String(u.name).split(" ")[0];
    } else {
      login.hidden = false; reg.hidden = false; chip.hidden = true;
    }
  }
  /* primary call-to-action: registered tourists go to their account, not "Register" again */
  function primaryCta(cls, arrow) {
    const u = getCurrentUser();
    const suffix = arrow ? " →" : "";
    // Signed-in tourists never see "Register" or "My account" — send them exploring instead.
    if (u && u.name) return `<a href="#/explore" class="${cls}">${t("home_member_cta")}${suffix}</a>`;
    return `<a href="#/register" class="${cls}">${t("home_reg_cta")}${suffix}</a>`;
  }

  /* ---------- Supabase insert + favourites helpers ---------- */
  function sbInsert(table, row) {
    const sb = window.CONFIG && window.CONFIG.supabase;
    if (!sb || !sb.url) return Promise.reject(new Error("no-backend"));
    return fetch(sb.url + "/rest/v1/" + table, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey, "Prefer": "return=minimal" },
      body: JSON.stringify(row)
    }).then(r => { if (!r.ok) throw new Error("insert " + r.status); return true; });
  }
  const FAV_KEY = "ka_favs";
  function getFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; } }
  function isFav(id) { return getFavs().indexOf(id) !== -1; }
  function toggleFav(id) {
    const f = getFavs(); const i = f.indexOf(id);
    if (i === -1) f.push(id); else f.splice(i, 1);
    localStorage.setItem(FAV_KEY, JSON.stringify(f));
    return i === -1;
  }

  /* ---------- personal activity mirror (so a tourist sees THEIR OWN history) ---------- */
  const ACT_KEY = "ka_activity";
  function getActivity() { try { return JSON.parse(localStorage.getItem(ACT_KEY)) || []; } catch (e) { return []; } }
  function addActivity(entry) {
    const a = getActivity();
    a.unshift(Object.assign({ ts: new Date().toISOString() }, entry));  // newest first
    localStorage.setItem(ACT_KEY, JSON.stringify(a.slice(0, 100)));      // keep it bounded
  }

  /* ---------- inline SVG icon set (Lucide-style, stroke = currentColor) ----------
     Real photos carry the imagery; these clean line icons replace decorative
     emoji for structure, so everything renders identically on every device. */
  const ICONS = {
    pin:      '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>',
    map:      '<path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14M15 6v14"/>',
    mountain: '<path d="m3 19 6-11 4 6 2-3 6 8z"/>',
    tree:     '<path d="M12 3 7 11h3l-3 5h4v5h2v-5h4l-3-5h3z"/>',
    building: '<path d="M4 21V6l8-3 8 3v15"/><path d="M9 21v-5h6v5M8 9h.01M12 9h.01M16 9h.01M8 13h.01M16 13h.01"/>',
    users:    '<circle cx="9" cy="8" r="3"/><path d="M4 20a5 5 0 0 1 10 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M20 20a5 5 0 0 0-3-4.6"/>',
    water:    '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    camera:   '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    sprout:   '<path d="M12 21v-9"/><path d="M12 12a5 5 0 0 1 5-5 5 5 0 0 1-5 5z"/><path d="M12 14a5 5 0 0 0-5-5 5 5 0 0 0 5 5z"/>',
    gem:      '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3 7 9l5 12 5-12-2-6"/>',
    factory:  '<path d="M3 21V10l6 4V10l6 4V6l6 4v11z"/><path d="M3 21h18"/>',
    shield:   '<path d="M12 3 5 6v6c0 4.5 3.2 7.5 7 9 3.8-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    globe:    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    plane:    '<path d="M21 3 3 10l6 3 3 6z"/><path d="m13 13 4 8 4-18"/>',
    dove:     '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"/>'
  };
  function svgIcon(name, size) {
    const s = size || 22;
    return `<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.pin}</svg>`;
  }
  const CAT_ICON  = { park: "tree", mountain: "mountain", museum: "building", culture: "users", nature: "water", conference: "building" };
  const CAT_COLOR = { park: "#4d5f28", mountain: "#3a4a1e", museum: "#8a6a44", culture: "#c0552b", nature: "#4a7c59", conference: "#00a3dd" };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll-gallery hero (vanilla port of the bento scroll-animation) ---------- */
  const HERO_GALLERY = [
    "1535941339077-2dd1c7963098", // lions / savanna
    "1547471080-7cc2caa01a7e",    // acacia sunset
    "1549366021-9f761d450615",    // elephant
    "1547970810-dc1eac37d174",    // rhinos on the plains
    "1523805009345-7448845a9e53"  // giraffe at sunset
  ].map(id => `https://images.unsplash.com/photo-${id}?w=900&q=60&auto=format&fit=crop`);

  /* ---------- cinematic 4K hero background (crossfading Ken-Burns slides) ---------- */
  const CINE_SLIDES = [
    "1547471080-7cc2caa01a7e",    // acacia + giraffe savanna
    "1523805009345-7448845a9e53", // giraffe at golden hour
    "1464822759023-fed622ff2c3b"  // mountain / Kilimanjaro mood
  ].map(id => `https://images.unsplash.com/photo-${id}?w=2560&q=70&auto=format&fit=crop`);

  /* the configured list of hero videos — normalised to {src,title,note,from,to} */
  function heroVideoList() {
    const c = window.CONFIG || {};
    const raw = Array.isArray(c.heroVideos) ? c.heroVideos : (c.heroVideo ? [c.heroVideo] : []);
    return raw.filter(Boolean).map(v => typeof v === "string" ? { src: v } : v);
  }
  /* which clip should LEAD right now, from its time-of-day window (handles 17→5 wrap) */
  function heroLeadIndex(list) {
    const h = new Date().getHours();
    const i = list.findIndex(v => v.from != null &&
      (v.from <= v.to ? (h >= v.from && h < v.to) : (h >= v.from || h < v.to)));
    return i === -1 ? 0 : i;
  }
  /* Multiple hero clips that CROSS-ROTATE. Each fades in only once it can play;
     any clip that fails removes itself. If none play, the photo slideshow shows. */
  let cineTimer = null;
  function setupCineVideo() {
    if (cineTimer) { clearInterval(cineTimer); cineTimer = null; }
    let vids = Array.from(document.querySelectorAll(".cine-video"));
    if (!vids.length) return;
    if (reduceMotion) { vids.forEach(v => v.pause()); return; }

    const play = (v) => { try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
    vids.forEach(v => {
      v.addEventListener("error", () => {                // drop a broken clip, keep the rest
        v.classList.remove("ready"); v.remove();
        vids = vids.filter(x => x !== v);
      });
      // per-clip safety net: if it never becomes playable, remove it
      setTimeout(() => { if (v.isConnected && v.readyState < 2) { v.remove(); vids = vids.filter(x => x !== v); } }, 12000);
    });

    const meta = heroVideoList();
    const cap = document.getElementById("cineCaption");
    const setCaption = (vi) => {
      const m = meta[vi];
      if (!cap) return;
      if (!m || !m.title) { cap.hidden = true; return; }
      document.getElementById("cineCapTitle").textContent = L(m.title);
      document.getElementById("cineCapNote").textContent = L(m.note) || "";
      cap.hidden = false;
      cap.classList.remove("swap"); void cap.offsetWidth; cap.classList.add("swap");
    };
    let idx = 0;
    const show = (i) => {
      if (!vids.length) return;
      idx = (i + vids.length) % vids.length;
      vids.forEach((v, n) => {
        if (n === idx) { v.classList.add("ready"); play(v); setCaption(+v.dataset.vi); }
        else { v.classList.remove("ready"); setTimeout(() => { if (!v.classList.contains("ready")) v.pause(); }, 900); }
      });
    };
    // start with the clip that matches the CURRENT TIME OF DAY (morning falls,
    // midday migration, golden-hour giraffes), then keep rotating from there
    const lead = vids.findIndex(v => +v.dataset.vi === heroLeadIndex(meta));
    const first = vids[lead === -1 ? 0 : lead];
    first.addEventListener("canplay", () => first.classList.add("ready"), { once: true });
    show(lead === -1 ? 0 : lead);

    if (vids.length > 1) {
      const gap = (window.CONFIG && window.CONFIG.heroVideoRotate) || 9000;
      cineTimer = setInterval(() => { if (document.getElementById("cineHero")) show(idx + 1); else { clearInterval(cineTimer); cineTimer = null; } }, gap);
    }
  }

  let scrollHeroHandler = null;
  function stopScrollHero() {
    if (scrollHeroHandler) {
      window.removeEventListener("scroll", scrollHeroHandler);
      window.removeEventListener("resize", scrollHeroHandler);
      scrollHeroHandler = null;
    }
  }
  function buildScrollHero() {
    stopScrollHero();
    const sec = document.getElementById("scrollHero");
    const grid = document.getElementById("bentoGrid");
    const content = document.getElementById("scrollHeroContent");
    if (!sec || !grid || !content) return;
    const cells = Array.from(grid.querySelectorAll(".bento-cell"));
    if (reduceMotion) { sec.classList.add("no-anim"); return; } // static, no long scroll

    const lerp = (p, a, b, from, to) => {
      const tt = Math.min(Math.max((p - a) / (b - a), 0), 1);
      return from + (to - from) * tt;
    };
    let ticking = false;
    function update() {
      ticking = false;
      const rect = sec.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      // gentle zoom + fade (the old sideways slide felt jarring on phones)
      const sc = lerp(p, 0, 0.85, 0.92, 1);    // soft grow into place
      const op = lerp(p, 0, 0.4, 0.45, 1);     // fade the gallery in
      const tf = `scale(${sc.toFixed(3)})`;
      for (const c of cells) { c.style.transform = tf; c.style.opacity = op.toFixed(3); }
      const cScale = lerp(p, 0, 0.5, 1, 0);    // hero text shrinks…
      const cOpac = lerp(p, 0, 0.45, 1, 0);    // …and fades out
      content.style.transform = `translate(-50%, -50%) scale(${cScale.toFixed(3)})`;
      content.style.opacity = cOpac.toFixed(3);
      content.style.pointerEvents = p > 0.35 ? "none" : "auto";
    }
    scrollHeroHandler = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", scrollHeroHandler, { passive: true });
    window.addEventListener("resize", scrollHeroHandler);
    update();
  }

  /* ---------- animated hero background paths (vanilla port of FloatingPaths) ----------
     Performance-tuned for low-end phones: ~18 paths/side, a ONE-TIME draw-in
     (no perpetual stroke repaint), plus a slow transform drift (GPU-composited). */
  const PATH_COUNT = 18;
  function floatingPathsSVG(position, cls) {
    let paths = "";
    for (let i = 0; i < PATH_COUNT; i++) {
      const k = i * 2; // spread the curves like the original 36-step spacing
      const d =
        `M-${380 - k * 5 * position} -${189 + k * 6}` +
        `C-${380 - k * 5 * position} -${189 + k * 6} -${312 - k * 5 * position} ${216 - k * 6} ${152 - k * 5 * position} ${343 - k * 6}` +
        `C${616 - k * 5 * position} ${470 - k * 6} ${684 - k * 5 * position} ${875 - k * 6} ${684 - k * 5 * position} ${875 - k * 6}`;
      const w = (0.6 + k * 0.03).toFixed(2);
      paths += `<path class="flow-path" d="${d}" stroke="currentColor" stroke-width="${w}" fill="none" data-i="${i}"/>`;
    }
    return `<svg class="${cls}" viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${paths}</svg>`;
  }

  function buildHeroPaths() {
    const host = document.getElementById("heroPaths");
    if (!host) return;
    host.innerHTML = floatingPathsSVG(1, "drift-a") + floatingPathsSVG(-1, "drift-b");
    if (reduceMotion) return; // static lines when user prefers reduced motion
    host.querySelectorAll(".flow-path").forEach((p) => {
      const len = p.getTotalLength();
      const i = +p.dataset.i;
      const dash = Math.max(50, len * 0.4);      // a travelling segment of light
      p.style.strokeDasharray = dash + " " + (len - dash);
      p.style.setProperty("--len", len);
      p.style.animationDuration = (15 + (i % 8) * 1.6).toFixed(1) + "s"; // 15–26s, varied
      p.style.animationDelay = (-i * 0.9).toFixed(1) + "s";             // already mid-flow, spread out
    });
  }

  /* ---------- interactive: hero paths follow the cursor (desktop) ---------- */
  function setupHeroParallax() {
    if (reduceMotion) return;
    const hero = document.querySelector(".hero");
    const layer = document.getElementById("heroPaths");
    const inner = document.querySelector(".hero-inner");
    if (!hero || !layer) return;
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      layer.style.transform = `translate3d(${(x * 26).toFixed(1)}px, ${(y * 18).toFixed(1)}px, 0)`;
      if (inner) inner.style.transform = `translate3d(${(x * -9).toFixed(1)}px, ${(y * -6).toFixed(1)}px, 0)`;
    });
    hero.addEventListener("pointerleave", () => {
      layer.style.transform = "";
      if (inner) inner.style.transform = "";
    });
  }

  /* ---------- scroll reveal (cards/panels fade up as they enter view) ---------- */
  let revealObserver = null;
  function setupReveal() {
    if (reduceMotion) return;
    if (!("IntersectionObserver" in window)) return;
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".card, .kpi-card, .panel, .step-card, .win-card, .match-card")
      .forEach((el, idx) => {
        el.classList.add("reveal");
        el.style.setProperty("--reveal-delay", (Math.min(idx, 5) * 28) + "ms");
        revealObserver.observe(el);
      });
  }

  /* ===================================================================
     VIEW: HOME
     =================================================================== */
  function viewHome() {
    const featured = window.TRIPS.slice(0, 6);
    return `
      <section class="cine-hero" id="cineHero">
        <div class="cine-bg" aria-hidden="true">
          ${CINE_SLIDES.map((u, i) => `<div class="cine-slide" style="background-image:url('${u}');animation-delay:${(i * 6 - 2).toFixed(0)}s"></div>`).join("")}
          ${heroVideoList().map((v, i) => `<video class="cine-video" data-vi="${i}" muted loop playsinline preload="${i === 0 ? "auto" : "metadata"}" poster="${CINE_SLIDES[0]}"><source src="${v.src}" type="${/\.webm(\?|$)/i.test(v.src) ? "video/webm" : "video/mp4"}"></video>`).join("")}
          <div class="cine-grain"></div>
          <div class="cine-scrim"></div>
        </div>
        <div class="cine-caption" id="cineCaption" hidden>
          <span class="cine-caption-dot" aria-hidden="true"></span>
          <span class="cine-caption-tx">
            <strong id="cineCapTitle"></strong>
            <small id="cineCapNote"></small>
          </span>
        </div>
        <div class="cine-content">
          <span class="hero-kicker">${t("hero_kicker")}</span>
          <p class="hero-lead">${t("hero_lead")}</p>
          <h1 class="hero-arusha">Arusha</h1>
          <p class="hero-script">${t("hero_script")}</p>
          <p class="hero-sub">${t("hero_sub")}</p>
          <div class="hero-cta-row">
            ${primaryCta("btn btn-primary")}
            <a href="#/trips" class="btn btn-ghost btn-on-dark">${t("hero_cta")}</a>
          </div>
          <div class="scroll-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>
          </div>
        </div>
      </section>

      ${(function () {
        const words = t("home_heart").split(" ");
        const last = words.length - 1;
        const heart = `<svg class="heart-ic" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M12 21s-6.7-4.3-9.3-8.3C1 10 1.8 6.4 4.8 5.3 7 4.5 9.2 5.6 12 8.3c2.8-2.7 5-3.8 7.2-3 3 1.1 3.8 4.7 2.1 7.4C18.7 16.7 12 21 12 21Z"/></svg>`;
        const parts = words.map((w, i) => {
          if (w === "—" || w === "–" || w === "-") return `<span class="hb-heart" style="animation-delay:${(i * 0.08).toFixed(2)}s">${heart}</span>`;
          const cls = i === last ? "hb-word hb-accent" : "hb-word";
          return `<span class="${cls}" style="animation-delay:${(i * 0.08).toFixed(2)}s">${esc(w)}</span>`;
        }).join(" ");
        const flourish = `<svg class="heart-flourish" viewBox="0 0 300 20" fill="none" aria-hidden="true"><path d="M6 12c40-9 90-11 150-8 40 2 90 5 138-2" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`;
        return `
      <section class="container heart-band" aria-label="${esc(t("home_heart"))}">
        <h2 class="heart-line">${parts}</h2>
        ${flourish}
      </section>`;
      })()}

      <section class="container section">
        <div class="section-head">
          <div>
            <h2>${t("matches_strip_title")}</h2>
            <p class="muted">${t("matches_strip_sub")}</p>
          </div>
          <a href="#/matches" class="link-more">${t("nav_matches")} →</a>
        </div>
        <div class="match-strip">
          ${window.MATCHES.map(matchCard).join("")}
        </div>
      </section>

      <section class="container section trips-section">
        <div class="section-head trips-head">
          <div>
            <span class="trips-kicker">${t("sec_trips_kicker")}</span>
            <h2>${t("sec_trips_title")}</h2>
            <p class="muted">${t("sec_trips_sub")}</p>
          </div>
          <a href="#/trips" class="link-more">${t("nav_trips")} →</a>
        </div>
        <div class="card-grid trips-grid">${featured.map(tripCard).join("")}</div>
        <div class="home-svcs" id="homeSvcs" hidden>
          <div class="section-head" style="margin-top:34px">
            <div>
              <h2>${t("home_svc_t")}</h2>
              <p class="muted">${t("home_svc_sub")}</p>
            </div>
            <a href="#/services" class="link-more">${t("nav_services")} →</a>
          </div>
          <div class="card-grid" id="homeSvcGrid"></div>
        </div>
      </section>

      <section class="container section">
        <div class="section-head">
          <div>
            <h2>${t("sec_ops_title")}</h2>
            <p class="muted">${t("sec_ops_sub")}</p>
          </div>
          <a href="#/operators" class="link-more">${t("nav_operators")} →</a>
        </div>
        <div class="card-grid">${window.OPERATORS.slice(0, 4).map(operatorCard).join("")}</div>
      </section>

      <section class="container section">
        <div class="home-explore">
          <div class="home-explore-text">
            <span class="trips-kicker">${t("exp_home_kicker")}</span>
            <h2>${t("exp_home_title")}</h2>
            <p class="muted">${t("exp_home_sub")}</p>
            <div class="exp-teaser">
              ${(window.ATTRACTIONS || []).slice(0, 6).map(a => `<a class="exp-teaser-chip" href="#/place/${a.id}">${svgIcon(CAT_ICON[a.cat] || "pin", 14)} ${esc(L(a.name))}</a>`).join("")}
              <a class="exp-teaser-chip more" href="#/explore">+${Math.max(0, (window.ATTRACTIONS || []).length - 6)}…</a>
            </div>
            <a href="#/explore" class="btn btn-primary">${getCurrentUser() ? t("exp_home_cta_in") : t("exp_home_cta")} →</a>
          </div>
        </div>
      </section>

      ${getCurrentUser() && getCurrentUser().name ? "" : `
      <section class="container section">
        <div class="home-reg">
          <div class="home-reg-text">
            <span class="home-reg-kicker">${t("home_reg_kicker")}</span>
            <h2>${t("home_reg_title")}</h2>
            <p>${t("home_reg_text")}</p>
          </div>
          ${primaryCta("btn btn-primary btn-lg", true)}
        </div>
      </section>`}
    `;
  }

  /* ---------- cards ---------- */
  function matchCard(m) {
    const d = new Date(m.date + "T00:00:00");
    const day = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { day: "numeric", month: "short" });
    return `
      <div class="match-card">
        <div class="match-date">⚽ ${day} · ${m.time}</div>
        <div class="match-fixture">
          <span class="team">${flagImg(m.home.iso, "flag-wave")}<small>${esc(m.home.code)}</small></span>
          <span class="vs">VS</span>
          <span class="team">${flagImg(m.away.iso, "flag-wave")}<small>${esc(m.away.code)}</small></span>
        </div>
        <div class="match-group">${esc(m.group)}</div>
      </div>`;
  }

  function tripCard(tr) {
    return `
      <a class="card trip-card" href="#/trip/${tr.id}">
        <div class="card-media ${tr.grad}">
          ${tr.img
            ? `<img class="card-img" src="${tr.img}" alt="${esc(L(tr.name))}" loading="lazy" decoding="async" /><span class="card-scrim"></span>`
            : `<span class="card-icon">${tr.icon}</span>`}
          <span class="badge-duration">${tr.duration} ${tr.duration > 1 ? t("days") : t("day")}</span>
        </div>
        <div class="card-body">
          <div class="card-rating">★ ${tr.rating}</div>
          <h3>${esc(L(tr.name))}</h3>
          <p class="muted">${esc(L(tr.summary))}</p>
          <div class="card-foot">
            <span class="price">${t("from")} <strong>$${tr.priceFrom}</strong></span>
            <span class="btn btn-small">${t("view_trip")} →</span>
          </div>
        </div>
      </a>`;
  }

  function operatorCard(op) {
    return `
      <a class="card op-card" href="#/operator/${op.id}">
        <div class="op-top">
          <span class="op-icon">${op.icon}</span>
          ${op.verified ? `<span class="verified-pill">✔ ${t("verified")}</span>` : ""}
        </div>
        <h3>${esc(L(op.name))}</h3>
        <p class="muted">${esc(L(op.desc))}</p>
        <div class="card-foot">
          <span class="op-cat">${t("cat_" + op.category)}</span>
          <span class="card-rating">★ ${op.rating}</span>
        </div>
      </a>`;
  }

  /* ===================================================================
     VIEW: TRIPS (with duration filter)
     =================================================================== */
  function viewTrips(filter) {
    const f = filter || "all";
    const list = f === "all" ? window.TRIPS : window.TRIPS.filter(x => String(x.duration) === f);
    const chip = (val, labelKey) =>
      `<button class="chip ${f === val ? "active" : ""}" data-filter="${val}">${t(labelKey)}</button>`;
    return `
      <section class="container section trips-section">
        <span class="trips-kicker">${t("sec_trips_kicker")}</span>
        <h2 class="page-title">${t("sec_trips_title")}</h2>
        <p class="muted">${t("sec_trips_sub")}</p>
        <div class="chips" id="tripFilters">
          ${chip("all", "filter_all")}${chip("1", "filter_1")}${chip("2", "filter_2")}${chip("3", "filter_3")}
        </div>
        <div class="card-grid trips-grid">${list.map(tripCard).join("")}</div>
      </section>`;
  }

  /* ===================================================================
     VIEW: TRIP DETAIL
     =================================================================== */
  function viewTripDetail(id) {
    const tr = window.TRIPS.find(x => x.id === id);
    if (!tr) return notFound();
    const hl = (L(tr.highlights) || []);
    const bg = tr.photoId
      ? ` style="background-image: linear-gradient(rgba(22,32,22,.45), rgba(22,32,22,.72)), url('https://images.unsplash.com/photo-${tr.photoId}?w=1400&q=65&auto=format&fit=crop');"`
      : "";
    return `
      <section class="detail-hero ${tr.grad}"${bg}>
        <div class="container">
          <a href="#/trips" class="back-link">← ${t("back")}</a>
          <span class="detail-icon">${tr.icon}</span>
          <h1>${esc(L(tr.name))}</h1>
          <div class="detail-meta">
            <span>★ ${tr.rating} ${t("rating")}</span>
            <span>• ${tr.duration} ${tr.duration > 1 ? t("days") : t("day")}</span>
            <span>• ${t("from")} <strong>$${tr.priceFrom}</strong> ${t("per_person")}</span>
          </div>
        </div>
      </section>
      <section class="container detail-body">
        <p class="detail-summary">${esc(L(tr.summary))}</p>
        <h3>${t("trip_included")}</h3>
        <ul class="highlight-list">
          ${hl.map(h => `<li>${esc(h)}</li>`).join("")}
        </ul>
        <div class="detail-cta">
          <button class="btn btn-primary btn-wa" data-book="${tr.id}">💬 ${t("book_whatsapp")}</button>
          <button class="btn btn-ghost fav-btn ${isFav(tr.id) ? "on" : ""}" data-fav="${tr.id}" aria-pressed="${isFav(tr.id)}">
            <span class="fav-heart">♥</span> <span class="fav-txt">${isFav(tr.id) ? t("fav_saved") : t("fav_save")}</span>
          </button>
          <span class="muted small">${t("safe_text")}</span>
        </div>
      </section>`;
  }

  /* ===================================================================
     VIEW: OPERATORS (search + category filter)
     =================================================================== */
  function viewOperators() {
    const cats = ["all", "safari", "culture", "stay", "food", "transport", "trek"];
    const chips = cats.map(c =>
      `<button class="chip ${c === "all" ? "active" : ""}" data-cat="${c}">${t("cat_" + c)}</button>`).join("");
    // spotlight the highest-rated verified operator as "Certified tour operator of the tournament"
    const top = window.OPERATORS.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    const topCard = top ? `
      <div class="op-spotlight">
        <div class="op-spot-badge">${svgIcon("shield", 18)} ${t("ops_top_badge")}</div>
        <div class="op-spot-body">
          <span class="op-icon">${top.icon}</span>
          <div>
            <h3>${esc(L(top.name))} ${top.verified ? `<span class="verified-pill">✔ ${t("verified")}</span>` : ""}</h3>
            <p class="muted">${esc(L(top.desc))}</p>
            <div class="op-spot-meta"><span class="card-rating">★ ${top.rating}</span> · <span>${t("cat_" + top.category)}</span> · <code>${esc(top.license)}</code></div>
          </div>
          <a class="btn btn-gold" href="#/operator/${top.id}">${t("view_trip")} →</a>
        </div>
      </div>` : "";
    return `
      <section class="container section">
        <h2 class="page-title">${t("sec_ops_title")}</h2>
        <p class="muted">${t("sec_ops_sub")}</p>
        ${topCard}
        <input type="search" id="opSearch" class="search-box" placeholder="${t("search_ph")}" />
        <div class="chips" id="opFilters">${chips}</div>
        <div class="card-grid" id="opGrid">${window.OPERATORS.map(operatorCard).join("")}</div>
      </section>`;
  }

  function filterOperators() {
    const q = (document.getElementById("opSearch")?.value || "").toLowerCase();
    const cat = document.querySelector("#opFilters .chip.active")?.dataset.cat || "all";
    const list = window.OPERATORS.filter(op => {
      const matchCat = cat === "all" || op.category === cat;
      const matchQ = !q || L(op.name).toLowerCase().includes(q) || L(op.desc).toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    const grid = document.getElementById("opGrid");
    if (grid) grid.innerHTML = list.length ? list.map(operatorCard).join("") : `<p class="muted">—</p>`;
  }

  /* ===================================================================
     VIEW: OPERATOR DETAIL
     =================================================================== */
  function viewOperatorDetail(id) {
    const op = window.OPERATORS.find(x => x.id === id);
    if (!op) return notFound();
    return `
      <section class="detail-hero grad-green">
        <div class="container">
          <a href="#/operators" class="back-link">← ${t("back")}</a>
          <span class="detail-icon">${op.icon}</span>
          <h1>${esc(L(op.name))}</h1>
          <div class="detail-meta">
            ${op.verified ? `<span class="verified-pill light">✔ ${t("verified")}</span>` : ""}
            <span>• ★ ${op.rating}</span>
            <span>• ${t("cat_" + op.category)}</span>
          </div>
        </div>
      </section>
      <section class="container detail-body">
        <p class="detail-summary">${esc(L(op.desc))}</p>
        <p class="licence-line">${t("licence")}: <code>${esc(op.license)}</code></p>
        <div class="detail-cta">
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${waLink(op.whatsapp, L(op.name))}">💬 ${t("contact_whatsapp")}</a>
          <span class="muted small">${t("safe_text")}</span>
        </div>
      </section>`;
  }

  /* ===================================================================
     VIEW: MATCHES
     =================================================================== */
  function viewMatches() {
    return `
      <section class="matches-hero">
        <div class="container matches-hero-inner">
          <span class="matches-ball">⚽</span>
          <h1>${t("matches_strip_title")}</h1>
          <p>${t("matches_strip_sub")} · 📍 ${esc(window.CONFIG.stadium)}</p>
        </div>
      </section>
      <section class="container section">
        <div class="fixtures">
          ${window.MATCHES.map(m => {
            const d = new Date(m.date + "T00:00:00");
            const day = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { weekday: "short", day: "numeric", month: "long" });
            return `
              <article class="fixture">
                <div class="fixture-top">
                  <span class="fixture-tag">${esc(m.group)}</span>
                  <span class="fixture-when">${day} · ${m.time}</span>
                </div>
                <div class="fixture-body">
                  <div class="fixture-team">
                    ${flagImg(m.home.iso, "flag-wave")}
                    <strong>${esc(m.home.name)}</strong>
                  </div>
                  <div class="fixture-vs"><span>VS</span></div>
                  <div class="fixture-team">
                    ${flagImg(m.away.iso, "flag-wave")}
                    <strong>${esc(m.away.name)}</strong>
                  </div>
                </div>
                <a class="btn btn-small fixture-cta" href="#/trips">${t("hero_cta")} →</a>
              </article>`;
          }).join("")}
        </div>
      </section>`;
  }

  /* ===================================================================
     VIEW: DASHBOARD
     =================================================================== */
  function viewDashboard() {
    const dash = window.DASHBOARD || {};
    const stats = dash.stats || [];
    const wonders = dash.wonders || [];
    return `
      <section class="dashboard-hero">
        <div class="dashboard-hero-bg" style="background: linear-gradient(135deg, #4d5f28 0%, #3a4a1e 50%, #2c3817 100%); position: relative; overflow: hidden;">
          <div class="dashboard-hero-content">
            <span class="dash-kicker">${t("hero_kicker")}</span>
            <h1 class="dash-title">${t("dash_title")}</h1>
            <p class="dash-subtitle">${t("dash_sub")}</p>
            <a href="#/register" class="btn btn-primary btn-lg">${t("dash_cta")} →</a>
          </div>
        </div>
      </section>

      <section class="dashboard-stats">
        <div class="container">
          <div class="stats-grid-pro">
            ${stats.map(s => {
              const label = typeof s.label === 'string' ? s.label : (s.label[lang] || s.label.en || '');
              return `<div class="stat-card-pro">
                <div class="stat-icon-pro">${s.icon}</div>
                <div class="stat-value-pro">${s.value.toLocaleString()}<span class="stat-suffix">${s.suffix || ''}</span></div>
                <div class="stat-label-pro">${esc(label)}</div>
              </div>`;
            }).join("")}
          </div>
        </div>
      </section>

      <section class="dashboard-wonders">
        <div class="container">
          <div class="wonders-header">
            <h2>${t("dash_wonders_title")}</h2>
            <p>${t("dash_wonders_sub")}</p>
          </div>
          <div class="wonders-grid-pro">
            ${wonders.map(w => {
              const name = typeof w.name === 'string' ? w.name : (w.name[lang] || w.name.en || '');
              const note = typeof w.note === 'string' ? w.note : (w.note[lang] || w.note.en || '');
              return `<div class="wonder-card-pro">
                <div class="wonder-header-pro">
                  <span class="wonder-icon-pro">${w.icon}</span>
                  <div class="wonder-meta">
                    <h3>${esc(name)}</h3>
                    <span class="wonder-drive-pro">${w.drive}h from stadium</span>
                  </div>
                </div>
                <p class="wonder-note-pro">${esc(note)}</p>
              </div>`;
            }).join("")}
          </div>
        </div>
      </section>`;
  }

  function animateCounters() {
    document.querySelectorAll(".kpi-value").forEach(el => {
      const target = +el.dataset.count;
      const dur = 1100; const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ===================================================================
     VIEW: EXPLORE ARUSHA (attractions + interactive map + investment)
     Public visitors see a locked teaser; registered tourists get the
     full Leaflet/OpenStreetMap experience — as requested by RAS.
     =================================================================== */
  let leafletPromise = null;
  function loadLeaflet() {                 // lazy-load Leaflet ONLY when the map page opens
    if (window.L) return Promise.resolve();
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      js.onload = resolve; js.onerror = reject;
      document.head.appendChild(js);
    });
    return leafletPromise;
  }
  const ATT_CATS = ["all", "park", "mountain", "museum", "culture", "nature", "conference"];
  const attCard = (a) => `
    <a class="card att-card" href="#/place/${a.id}" aria-label="${esc(L(a.name))}">
      <span class="att-media ${a.grad || "grad-green"}">
        ${a.img ? `<img class="att-img" src="${a.img}" alt="${esc(L(a.name))}" loading="lazy" decoding="async" onerror="this.remove()" />` : `<span class="att-media-fallback">${svgIcon(CAT_ICON[a.cat] || "pin", 40)}</span>`}
        <span class="att-scrim"></span>
        <span class="att-cat-pill">${svgIcon(CAT_ICON[a.cat] || "pin", 14)} ${t("att_" + a.cat)}</span>
      </span>
      <span class="att-body">
        <span class="att-name">${esc(L(a.name))}</span>
        <span class="att-desc">${esc(L(a.desc))}</span>
        <span class="att-locate">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${t("exp_learn")}
        </span>
      </span>
    </a>`;
  /* short history of Arusha city + the Clock Tower (shown to everyone on Explore) */
  function exploreHistoryBand() {
    return `
      <section class="container section hist-section">
        <div class="hist-band">
          <figure class="hist-photo">
            <img src="media/clock-tower.jpg"
                 alt="${t("hist_img_alt")}" loading="eager" decoding="async" onerror="this.parentElement.classList.add('noimg')" />
            <figcaption>${t("hist_img_cap")}</figcaption>
          </figure>
          <div class="hist-text">
            <span class="trips-kicker">${t("hist_kicker")}</span>
            <h2>${t("hist_title")}</h2>
            <p>${t("hist_p1")}</p>
            <p>${t("hist_p2")}</p>
          </div>
        </div>
      </section>`;
  }
  function viewExplore() {
    const u = getCurrentUser();
    const atts = window.ATTRACTIONS || [];
    if (!u || !u.name) {
      // locked teaser — names only, everything else invites registration
      const teaser = atts.slice(0, 8).map(a => `<a class="exp-teaser-chip" href="#/place/${a.id}">${svgIcon(CAT_ICON[a.cat] || "pin", 14)} ${esc(L(a.name))}</a>`).join("");
      return `
        <section class="detail-hero grad-green">
          <div class="container"><h1>${t("exp_title")}</h1><p class="detail-meta">${t("exp_lead")}</p></div>
        </section>
        ${exploreHistoryBand()}
        <section class="container section">
          <div class="exp-lock">
            <div class="exp-lock-photos" aria-hidden="true">
              ${atts.slice(0, 4).map(a => `<span class="exp-lock-photo ${a.grad || "grad-green"}">${a.img ? `<img src="${a.img}" alt="" loading="lazy" decoding="async" onerror="this.remove()" />` : `<span class="exp-lock-photo-ic">${svgIcon(CAT_ICON[a.cat] || "pin", 26)}</span>`}</span>`).join("")}
              <span class="exp-lock-lockbadge">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              </span>
            </div>
            <h2>${t("exp_lock_title")}</h2>
            <p class="muted">${t("exp_lock_sub")}</p>
            <div class="exp-lock-stats">
              <div><strong>${atts.length}</strong><span>${t("exp_stat_att")}</span></div>
              <div><strong>5</strong><span>${t("exp_stat_cat")}</span></div>
              <div><strong>${t("exp_stat_free_n")}</strong><span>${t("exp_stat_free")}</span></div>
            </div>
            <div class="exp-teaser">${teaser}<span class="exp-teaser-chip more">+${Math.max(0, atts.length - 8)}…</span></div>
            <div class="hero-cta-row" style="justify-content:center">
              <a class="btn btn-primary btn-lg" href="#/register">${t("home_reg_cta")} →</a>
              <a class="btn btn-ghost" href="#/login">${t("login_btn")}</a>
            </div>
          </div>
        </section>`;
    }
    const chips = ATT_CATS.map(c =>
      `<button class="chip ${c === "all" ? "active" : ""}" data-attcat="${c}">${t("att_" + c)}</button>`).join("");
    const inv = window.INVESTMENTS || { sectors: [], safety: [] };
    return `
      <section class="detail-hero grad-green">
        <div class="container"><h1>${t("exp_title")}</h1><p class="detail-meta">${t("exp_lead_in")}</p></div>
      </section>
      ${exploreHistoryBand()}
      <section class="container section">
        <div class="chips" id="attFilters">${chips}</div>
        <div id="attMap" class="att-map" role="application" aria-label="${t("exp_map_label")}"></div>
        <div class="card-grid att-grid" id="attGrid">${atts.map(attCard).join("")}</div>
      </section>
      <section class="container section inv-section" id="invest">
        <div class="section-head"><div>
          <span class="trips-kicker">${t("inv_kicker")}</span>
          <h2>${t("inv_title")}</h2>
          <p class="muted">${t("inv_sub")}</p>
        </div></div>
        <div class="inv-grid">
          ${inv.sectors.map(s => `
            <div class="card inv-card">
              <span class="inv-icon">${svgIcon(s.ic, 26)}</span>
              <h3>${esc(L(s.name))}</h3>
              <p class="inv-stat">${esc(L(s.stat))}</p>
              <p class="muted">${esc(L(s.desc))}</p>
            </div>`).join("")}
        </div>
        <div class="inv-safe">
          <h3>${t("inv_safe_title")}</h3>
          <ul class="inv-safe-list">
            ${inv.safety.map(x => `<li><span class="inv-safe-ic">${svgIcon(x.ic, 20)}</span> ${esc(lang === "sw" ? x.sw : x.en)}</li>`).join("")}
          </ul>
        </div>
        <form class="inv-form" id="invForm" novalidate>
          <h3>${t("inv_cta_title")}</h3>
          <p class="muted small">${t("inv_cta_sub")}</p>
          <textarea class="acct-msg" id="invMsg" rows="3" placeholder="${t("inv_ph")}"></textarea>
          <div class="form-ok" id="invOk" hidden>✓ ${t("acct_sent")}</div>
          <button class="btn btn-gold" type="submit">${t("inv_send")}</button>
        </form>
      </section>`;
  }
  let attMap = null, attMarkers = {};
  function bindExplore() {
    attMap = null; attMarkers = {};
    const mapEl = document.getElementById("attMap");
    if (!mapEl) return;                     // locked teaser — nothing to bind
    loadLeaflet().then(() => {
      if (!document.getElementById("attMap")) return;   // user navigated away
      attMap = window.L.map("attMap", { scrollWheelZoom: false }).setView([-3.2, 36.3], 8);
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(attMap);
      (window.ATTRACTIONS || []).forEach(a => {
        const col = CAT_COLOR[a.cat] || "#4d5f28";
        const pinSvg = `<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true"><path d="M16 1C8.3 1 2 7.1 2 14.7 2 25 16 39 16 39s14-14 14-24.3C30 7.1 23.7 1 16 1Z" fill="${col}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="14.5" r="5.2" fill="#fff"/></svg>`;
        const mk = window.L.marker([a.lat, a.lng], {
          icon: window.L.divIcon({ className: "att-pin", html: pinSvg, iconSize: [32, 40], iconAnchor: [16, 39], popupAnchor: [0, -34] })
        }).addTo(attMap);
        mk.bindPopup(`<strong style="color:${col}">${esc(L(a.name))}</strong><br><small>${esc(L(a.desc))}</small>`);
        attMarkers[a.id] = mk;
      });
    }).catch(() => { mapEl.innerHTML = `<p class="muted" style="padding:2rem;text-align:center">${t("exp_map_err")}</p>`; });

    // category filter: cards + pins together
    const filters = document.getElementById("attFilters");
    if (filters) filters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-attcat]"); if (!b) return;
      filters.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      b.classList.add("active");
      const cat = b.dataset.attcat;
      const grid = document.getElementById("attGrid");
      const list = (window.ATTRACTIONS || []).filter(a => cat === "all" || a.cat === cat);
      if (grid) grid.innerHTML = list.map(attCard).join("");
      Object.keys(attMarkers).forEach(id => {
        const a = window.ATTRACTIONS.find(x => x.id === id);
        const show = cat === "all" || (a && a.cat === cat);
        if (attMap) { if (show) attMarkers[id].addTo(attMap); else attMap.removeLayer(attMarkers[id]); }
      });
    });
    // tap a card → fly the map to that attraction
    document.addEventListener("click", attCardJump);
    function attCardJump(e) {
      const c = e.target.closest("[data-att]"); if (!c) return;
      if (!document.getElementById("attMap")) { document.removeEventListener("click", attCardJump); return; }
      const a = (window.ATTRACTIONS || []).find(x => x.id === c.dataset.att);
      if (!a || !attMap) return;
      document.getElementById("attMap").scrollIntoView({ behavior: "smooth", block: "center" });
      attMap.flyTo([a.lat, a.lng], 11, { duration: 1.2 });
      if (attMarkers[a.id]) attMarkers[a.id].openPopup();
    }
    // investment enquiry — saved centrally, tagged [INVEST]
    const invForm = document.getElementById("invForm");
    if (invForm) invForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = (document.getElementById("invMsg").value || "").trim();
      if (!msg) return;
      const u = getCurrentUser() || {};
      const btn = invForm.querySelector("button[type=submit]"); btn.disabled = true;
      sbInsert("submissions", {
        type: "enquiry", name: u.name || null, email: u.email || null, phone: u.phone || null,
        country: u.country || null, rating: null, lang, message: "[INVEST] " + msg
      }).then(() => {
        addActivity({ type: "enquiry", message: "[INVEST] " + msg });
        document.getElementById("invOk").hidden = false;
        document.getElementById("invMsg").value = ""; btn.disabled = false;
      }).catch(() => { btn.disabled = false; alert(t("acct_err")); });
    });
  }

  /* ===================================================================
     VIEW: PLACE (single attraction — history + unique feature)
     =================================================================== */
  function viewPlace(id) {
    const a = (window.ATTRACTIONS || []).find(x => x.id === id);
    if (!a) return notFound();
    const img = a.img || "";
    const bg = img ? ` style="background-image: linear-gradient(rgba(20,24,14,.35), rgba(20,24,14,.72)), url('${img}');"` : "";
    const nearby = (window.ATTRACTIONS || []).filter(x => x.id !== a.id && x.cat === a.cat).slice(0, 3);
    return `
      <section class="detail-hero ${a.grad || "grad-green"} tz-band place-hero"${bg}>
        <div class="container">
          <a href="#/explore" class="back-link">← ${t("nav_explore")}</a>
          <span class="att-cat-pill place-pill">${svgIcon(CAT_ICON[a.cat] || "pin", 14)} ${t("att_" + a.cat)}</span>
          <h1>${esc(L(a.name))}</h1>
        </div>
      </section>
      <section class="container detail-body">
        <p class="detail-summary">${esc(L(a.desc))}</p>
        <div id="placeMap" class="att-map" style="height:320px"></div>
        <div class="place-actions">
          <a class="btn btn-primary" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}">${t("place_directions")} →</a>
          <a class="btn btn-ghost" href="#/itineraries">${t("place_plan")}</a>
        </div>
        ${nearby.length ? `<h3 class="mt">${t("place_nearby")}</h3>
          <div class="card-grid att-grid">${nearby.map(attCard).join("")}</div>` : ""}
      </section>`;
  }
  function bindPlace(id) {
    const a = (window.ATTRACTIONS || []).find(x => x.id === id);
    if (!a) return;
    loadLeaflet().then(() => {
      const el2 = document.getElementById("placeMap"); if (!el2) return;
      const m = window.L.map("placeMap", { scrollWheelZoom: false }).setView([a.lat, a.lng], 10);
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap" }).addTo(m);
      const col = CAT_COLOR[a.cat] || "#4d5f28";
      window.L.marker([a.lat, a.lng], { icon: window.L.divIcon({ className: "att-pin", html: `<svg viewBox="0 0 32 40" width="32" height="40"><path d="M16 1C8.3 1 2 7.1 2 14.7 2 25 16 39 16 39s14-14 14-24.3C30 7.1 23.7 1 16 1Z" fill="${col}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="14.5" r="5.2" fill="#fff"/></svg>`, iconSize: [32, 40], iconAnchor: [16, 39] }) }).addTo(m);
    }).catch(() => {});
  }

  /* ===================================================================
     VIEW: EVENTS (marathons · sports · conferences · culture — per RAS)
     =================================================================== */
  const EV_TYPES = ["all", "afcon", "sports", "conference", "culture"];
  const EV_ICON = { afcon: "globe", sports: "users", conference: "building", culture: "camera" };
  function viewEvents(filter) {
    const f = filter || "all";
    const list = (window.EVENTS || [])
      .filter(e2 => f === "all" || e2.type === f)
      .slice().sort((a, b) => a.date.localeCompare(b.date));
    const chips = EV_TYPES.map(c =>
      `<button class="chip ${c === f ? "active" : ""}" data-evtype="${c}">${t("ev_" + c)}</button>`).join("");
    const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
    return `
      <section class="detail-hero grad-green tz-band">
        <div class="container"><h1>${t("ev_title")}</h1><p class="detail-meta">${t("ev_lead")}</p></div>
      </section>
      <section class="container section">
        <div class="chips" id="evFilters">${chips}</div>
        <div class="ev-list">
          ${list.map(e2 => `
            <article class="ev-item">
              <div class="ev-date"><span class="ev-day">${new Date(e2.date + "T00:00:00").getDate()}</span><span class="ev-mon">${new Date(e2.date + "T00:00:00").toLocaleDateString(lang === "sw" ? "sw-TZ" : "en", { month: "short" })}</span></div>
              <div class="ev-body">
                <div class="ev-top">
                  <span class="ev-type ev-type-${e2.type}">${svgIcon(EV_ICON[e2.type] || "globe", 13)} ${t("ev_" + e2.type)}</span>
                  ${e2.tbc ? `<span class="ev-tbc">${t("ev_tbc")}</span>` : ""}
                </div>
                <h3>${esc(L(e2.name))}</h3>
                <p class="muted">${esc(L(e2.desc))}</p>
                <p class="ev-meta">${svgIcon("pin", 13)} ${esc(e2.venue)} · ${fmt(e2.date)}</p>
                ${e2.link ? `<a class="link-inline" href="${e2.link}">${t("ev_more")} →</a>` : ""}
              </div>
            </article>`).join("") || `<p class="muted">${t("ev_none")}</p>`}
        </div>
        <p class="muted small center mt">${t("ev_note")}</p>
      </section>`;
  }
  function bindEvents() {
    const f = document.getElementById("evFilters");
    if (f) f.onclick = (e) => {
      const b = e.target.closest("[data-evtype]"); if (!b) return;
      app.innerHTML = viewEvents(b.dataset.evtype);
      bindEvents(); setupReveal();
    };
  }

  /* ===================================================================
     BECOME A PARTNER — landing, signup (PDF verification), portal, services
     Backend: Supabase RPCs (bcrypt) + private storage bucket partner-docs.
     =================================================================== */
  function sbRpcNamed(fn, body) { return sbRpc(fn, body); }
  const P_TYPES = ["tour_operator", "private_guide", "photographer", "transport", "rental_car", "accommodation", "conference", "food", "events", "other"];
  const P_ICON = { tour_operator: "map", private_guide: "users", photographer: "camera", transport: "plane", rental_car: "plane", accommodation: "building", conference: "building", food: "sprout", events: "globe", other: "globe" };
  const P_KEY = "ka_partner";
  const getPartner = () => { try { return JSON.parse(sessionStorage.getItem(P_KEY)); } catch (e) { return null; } };
  const setPartner = (p) => sessionStorage.setItem(P_KEY, JSON.stringify(p));
  const clearPartner = () => sessionStorage.removeItem(P_KEY);

  function viewPartners() {
    const why = [
      ["globe",   t("pw_b1_t"), t("pw_b1_d")],
      ["shield",  t("pw_b2_t"), t("pw_b2_d")],
      ["users",   t("pw_b3_t"), t("pw_b3_d")],
      ["map",     t("pw_b4_t"), t("pw_b4_d")],
      ["building",t("pw_b6_t"), t("pw_b6_d")]
    ];
    const steps = [t("pw_s1"), t("pw_s2"), t("pw_s3"), t("pw_s4"), t("pw_s5")];
    return `
      <section class="detail-hero grad-green tz-band">
        <div class="container">
          <h1>${t("pw_title")}</h1>
          <p class="detail-meta">${t("pw_lead")}</p>
        </div>
      </section>
      <section class="container section">
        <h2 class="page-title" style="text-transform:none">${t("pw_why")}</h2>
        <div class="pw-grid">
          ${why.map(w => `<div class="card pw-card"><span class="inv-icon">${svgIcon(w[0], 24)}</span><h3>${w[1]}</h3><p class="muted">${w[2]}</p></div>`).join("")}
        </div>
        <h2 class="page-title mt" style="text-transform:none">${t("pw_how")}</h2>
        <div class="pw-steps">
          ${steps.map((s, i) => `<div class="pw-step"><span class="pw-step-n">${i + 1}</span><strong>${s.split("—")[0]}</strong><small>${(s.split("—")[1] || "").trim()}</small></div>`).join("")}
        </div>
        <div class="center mt hero-cta-row" style="justify-content:center">
          <a class="btn btn-primary btn-lg" href="#/partner-signup">${t("pw_cta")}</a>
          <a class="btn btn-ghost" href="#/partner">${t("pw_login")}</a>
        </div>
      </section>`;
  }

  function viewPartnerSignup() {
    const typeCards = P_TYPES.map((ty, i) => `
      <button type="button" class="ptype-opt${i === 0 ? " active" : ""}" data-ptype="${ty}">
        ${svgIcon(P_ICON[ty], 20)}<span>${t("pt_" + ty)}</span>
      </button>`).join("");
    return `
      <section class="detail-hero grad-gold tz-band">
        <div class="container"><h1>${t("ps_title")}</h1><p class="detail-meta">${t("ps_lead")}</p></div>
      </section>
      <section class="container reg-wrap">
        <form id="pForm" class="reg-form pform" novalidate>
          <div class="field"><label>${t("ps_type")} <span class="req">*</span></label>
            <div class="ptype-grid" id="pTypes">${typeCards}</div></div>
          <div class="field"><label>${t("ps_entity")} <span class="req">*</span></label>
            <div class="zone-pick" id="pEntity">
              <button type="button" class="zone-opt active" data-ent="company"><b>${t("ps_ent_company")}</b><small>${t("ps_ent_company_s")}</small></button>
              <button type="button" class="zone-opt" data-ent="private"><b>${t("ps_ent_private")}</b><small>${t("ps_ent_private_s")}</small></button>
            </div></div>
          <div class="field"><label for="pCompany">${t("ps_company")} <span class="req">*</span></label>
            <input id="pCompany" type="text" placeholder="${t("ps_company_ph")}" /></div>
          <div class="field"><label for="pContact">${t("ps_contact")} <span class="req">*</span></label>
            <input id="pContact" type="text" autocomplete="name" /></div>
          <div class="field"><label for="pEmail">${t("reg_email")} <span class="req">*</span></label>
            <input id="pEmail" type="email" inputmode="email" autocomplete="email" /></div>
          <div class="field"><label for="pPhone">${t("ps_phone")} <span class="req">*</span></label>
            <input id="pPhone" type="tel" inputmode="tel" placeholder="+255 7xx xxx xxx" /></div>
          <div class="field"><label for="pWebsite">${t("ps_website")}</label>
            <input id="pWebsite" type="url" inputmode="url" placeholder="https://..." /></div>
          <div class="field"><label for="pTin">${t("ps_tin")}</label>
            <input id="pTin" type="text" placeholder="e.g. 123-456-789" /></div>
          <div class="field"><label for="pTinDoc">${t("ps_tin_doc")}</label>
            <input id="pTinDoc" type="file" accept="application/pdf" />
            <p class="field-note">${t("ps_tin_doc_note")}</p></div>
          <div class="field"><label for="pLicense">${t("ps_license")}</label>
            <input id="pLicense" type="text" placeholder="e.g. TALA-AR-2026-001" /></div>
          <div class="field"><label for="pDoc">${t("ps_doc")} <span class="req">*</span></label>
            <input id="pDoc" type="file" accept="application/pdf" />
            <p class="field-note">${t("ps_doc_note")}</p></div>
          <div class="field"><label for="pPass">${t("ps_pass")} <span class="req">*</span></label>
            <div class="pass-wrap"><input id="pPass" type="password" autocomplete="new-password" /><button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button></div></div>
          <div id="pErr" class="form-error" role="alert" hidden></div>
          <button type="submit" class="btn btn-primary btn-block">${t("ps_submit")}</button>
          <p class="muted small reg-privacy">${t("ps_privacy")}</p>
        </form>
        <div id="pOk" class="reg-success" hidden>
          <div class="reg-success-mark">✓</div>
          <p class="reg-success-msg">${t("ps_success")}</p>
          <a class="btn btn-primary" href="#/partner">${t("pw_login")}</a>
        </div>
      </section>`;
  }
  function bindPartnerSignup() {
    const form = document.getElementById("pForm");
    if (!form) return;
    let ptype = P_TYPES[0], entity = "company";
    document.getElementById("pTypes").addEventListener("click", (e) => {
      const b = e.target.closest(".ptype-opt"); if (!b) return;
      ptype = b.dataset.ptype;
      document.querySelectorAll(".ptype-opt").forEach(x => x.classList.toggle("active", x === b));
    });
    document.getElementById("pEntity").addEventListener("click", (e) => {
      const b = e.target.closest(".zone-opt"); if (!b) return;
      entity = b.dataset.ent;
      document.querySelectorAll("#pEntity .zone-opt").forEach(x => x.classList.toggle("active", x === b));
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = document.getElementById("pErr"); err.hidden = true;
      const val = (id) => (document.getElementById(id).value || "").trim();
      const file = document.getElementById("pDoc").files[0];
      const tinFile = document.getElementById("pTinDoc").files[0];
      const problems = [];
      if (tinFile && (tinFile.type !== "application/pdf" || tinFile.size > 10 * 1024 * 1024)) problems.push(t("ps_err_tin_pdf"));
      if (!val("pCompany")) problems.push(t("ps_err_company"));
      if (!val("pContact")) problems.push(t("reg_err_name"));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("pEmail"))) problems.push(t("reg_err_email"));
      if (!val("pPhone")) problems.push(t("ps_err_phone"));
      if (!file) problems.push(t("ps_err_doc"));
      else if (file.type !== "application/pdf") problems.push(t("ps_err_pdf"));
      else if (file.size > 10 * 1024 * 1024) problems.push(t("ps_err_size"));
      if (val("pPass").length < 6) problems.push(t("ps_err_pass"));
      if (problems.length) { err.innerHTML = problems.map(p => `<div>• ${esc(p)}</div>`).join(""); err.hidden = false; return; }

      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "⏳ " + t("ps_uploading");
      const sb = window.CONFIG.supabase;
      try {
        // 1) upload the verification PDF to the PRIVATE bucket
        const path = crypto.randomUUID() + ".pdf";
        const up = await fetch(`${sb.url}/storage/v1/object/partner-docs/${path}`, {
          method: "POST",
          headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey, "Content-Type": "application/pdf" },
          body: file
        });
        if (!up.ok) throw new Error("upload");
        // 1b) optional TIN certificate PDF
        let tinPath = null;
        if (tinFile) {
          tinPath = "tin-" + crypto.randomUUID() + ".pdf";
          const up2 = await fetch(`${sb.url}/storage/v1/object/partner-docs/${tinPath}`, {
            method: "POST",
            headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey, "Content-Type": "application/pdf" },
            body: tinFile
          });
          if (!up2.ok) throw new Error("upload-tin");
        }
        // 2) register the partner (server hashes the password with bcrypt)
        await sbRpcNamed("partner_register", {
          p_ptype: ptype, p_entity: entity, p_company: val("pCompany"), p_contact: val("pContact"),
          p_email: val("pEmail"), p_phone: val("pPhone"), p_tin: val("pTin") || null,
          p_license: val("pLicense") || null, p_pass: val("pPass"), p_doc_path: path,
          p_lang: lang, p_tin_doc_path: tinPath, p_website: val("pWebsite") || null
        });
        // email the administrator about the new application (best-effort)
        fetch(sb.url + "/functions/v1/partner-notify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "application", company: val("pCompany"), ptype, contact: val("pContact"),
            email: val("pEmail"), phone: val("pPhone"), website: val("pWebsite"), tin: val("pTin"), license: val("pLicense") })
        }).catch(() => {});
        form.hidden = true; document.getElementById("pOk").hidden = false;
      } catch (ex) {
        err.textContent = /email_exists/.test(String(ex)) ? t("ps_err_exists") : t("ps_err_fail");
        err.hidden = false; btn.disabled = false; btn.textContent = t("ps_submit");
      }
    });
  }

  /* ---- partner portal (login → status → add services with map pin) ---- */
  function viewPartnerPortal() {
    const p = getPartner();
    if (!p) {
      return `
        <section class="container auth-wrap">
          <form id="pLoginForm" class="auth-card" novalidate>
            <div class="auth-icon">🤝</div>
            <h1 class="auth-title">${t("pp_login_title")}</h1>
            <p class="auth-sub">${t("pp_login_sub")}</p>
            <div class="field"><label for="plEmail">${t("reg_email")}</label>
              <input id="plEmail" type="email" autocomplete="username" /></div>
            <div class="field"><label for="plPass">${t("ps_pass")}</label>
              <div class="pass-wrap"><input id="plPass" type="password" autocomplete="current-password" /><button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button></div></div>
            <div id="plErr" class="form-error" role="alert" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">${t("login_btn")}</button>
            <p class="muted small auth-alt">${t("pp_no_acct")} <a href="#/partner-signup" class="link-inline">${t("pw_cta")}</a></p>
            <p class="muted small auth-alt"><button type="button" class="link-inline linklike" id="pForgot">${t("pp_forgot")}</button></p>
          </form>
        </section>`;
    }
    const stBadge = { pending: `<span class="pstat pstat-pending">⏳ ${t("pp_st_pending")}</span>`,
                      approved: `<span class="pstat pstat-approved">✓ ${t("pp_st_approved")}</span>`,
                      rejected: `<span class="pstat pstat-rejected">✕ ${t("pp_st_rejected")}</span>` }[p.status] || "";
    const catOpts = P_TYPES.map(tt => `<option value="${tt}">${t("pt_" + tt)}</option>`).join("");
    return `
      <section class="detail-hero grad-green tz-band">
        <div class="container">
          <h1>${esc(p.company)}</h1>
          <p class="detail-meta">${t("pt_" + p.ptype)} · ${stBadge}</p>
        </div>
      </section>
      <section class="container section">
        ${p.status !== "approved" ? `<div class="exp-lock" style="max-width:560px"><h2>${p.status === "rejected" ? t("pp_rejected_t") : t("pp_pending_t")}</h2><p class="muted">${p.status === "rejected" ? t("pp_rejected_d") : t("pp_pending_d")}</p></div>` : `
        <h2 class="acct-section-h">${t("pp_add_h")}</h2>
        <form id="svcForm" class="reg-form pform" novalidate>
          <div class="field"><label for="sTitle">${t("pp_s_title")} <span class="req">*</span></label>
            <input id="sTitle" type="text" placeholder="${t("pp_s_title_ph")}" /></div>
          <div class="field"><label for="sCat">${t("ps_type")}</label>
            <select id="sCat">${catOpts}</select></div>
          <div class="field"><label for="sDesc">${t("pp_s_desc")}</label>
            <textarea id="sDesc" rows="3" class="acct-msg"></textarea></div>
          <div class="field"><label for="sPrice">${t("pp_s_price")}</label>
            <div class="pg-input"><span>$</span><input id="sPrice" type="number" min="0" step="1" /></div></div>
          <div class="field"><label for="sArea">${t("pp_s_area")} <span class="req">*</span></label>
            <input id="sArea" type="text" placeholder="${t("pp_s_area_ph")}" />
            <p class="field-note">${t("pp_s_map_note")}</p>
            <div id="svcMap" class="att-map" style="height:280px"></div>
            <input type="hidden" id="sLat" /><input type="hidden" id="sLng" /></div>
          <div class="field"><label for="sWa">${t("pp_s_wa")} <span class="req">*</span></label>
            <input id="sWa" type="tel" placeholder="255XXXXXXXXX" /></div>
          <div class="field"><label for="sPhotos">${t("pp_s_photos")}</label>
            <input id="sPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            <p class="field-note">${t("pp_s_photos_note")}</p></div>
          <div id="sErr" class="form-error" role="alert" hidden></div>
          <div class="form-ok" id="sOk" hidden>✓ ${t("pp_s_ok")}</div>
          <button type="submit" class="btn btn-primary">${t("pp_s_add")}</button>
        </form>
        <h2 class="acct-section-h">${t("pp_mine_h")}</h2>
        <div id="mySvcs"><p class="muted">${t("admin_loading")}</p></div>`}
        <div class="center mt"><button class="btn btn-ghost" id="pLogout">${t("admin_logout")}</button></div>
      </section>`;
  }
  function bindPartnerPortal() {
    const loginF = document.getElementById("pLoginForm");
    if (loginF) {
      const fg = document.getElementById("pForgot");
      if (fg) fg.addEventListener("click", () => {
        const em = (document.getElementById("plEmail").value || "").trim() || prompt(t("pp_forgot_ph"));
        if (!em) return;
        sbRpc("partner_request_reset", { p_email: em }).then(d => {
          if (d && d.token) {
            fetch(window.CONFIG.supabase.url + "/functions/v1/partner-notify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "reset", email: em, token: d.token })
            }).catch(() => {});
          }
          alert(t("pp_forgot_sent"));
        }).catch(() => alert(t("pp_forgot_sent")));
      });
      loginF.addEventListener("submit", (e) => {
        e.preventDefault();
        const em = document.getElementById("plEmail").value.trim();
        const pw = document.getElementById("plPass").value;
        const er = document.getElementById("plErr");
        const btn = loginF.querySelector("button[type=submit]"); btn.disabled = true;
        sbRpcNamed("partner_login", { p_email: em, p_pass: pw })
          .then(d => { setPartner(Object.assign({ email: em, pass: pw }, d)); render(); })
          .catch(() => { er.textContent = t("pp_login_err"); er.hidden = false; btn.disabled = false; });
      });
      return;
    }
    const out = document.getElementById("pLogout");
    if (out) out.addEventListener("click", () => { clearPartner(); render(); });
    const p = getPartner(); if (!p || p.status !== "approved") return;

    // map: tap to drop the service-area pin
    loadLeaflet().then(() => {
      const el2 = document.getElementById("svcMap"); if (!el2) return;
      const m = window.L.map("svcMap", { scrollWheelZoom: false }).setView([-3.37, 36.68], 11);
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap" }).addTo(m);
      let mk = null;
      m.on("click", (ev) => {
        document.getElementById("sLat").value = ev.latlng.lat.toFixed(5);
        document.getElementById("sLng").value = ev.latlng.lng.toFixed(5);
        if (mk) mk.setLatLng(ev.latlng); else mk = window.L.marker(ev.latlng).addTo(m);
      });
    }).catch(() => {});

    const list = document.getElementById("mySvcs");
    const loadMine = () => sbRpcNamed("partner_my_services", { p_email: p.email, p_pass: p.pass })
      .then(rows => {
        list.innerHTML = (rows && rows.length) ? `<div class="table-wrap"><table class="reg-table">
          <thead><tr><th>${t("pp_s_title")}</th><th>${t("ps_type")}</th><th>${t("pp_s_price")}</th><th>${t("pp_s_area")}</th><th></th></tr></thead>
          <tbody>${rows.map(s => `<tr><td>${esc(s.title)}</td><td>${t("pt_" + s.category)}</td><td>${s.price_from ? "$" + s.price_from : "—"}</td><td>${esc(s.area_name || "—")}</td>
            <td><button class="btn btn-small" data-del-svc="${s.id}">🗑</button></td></tr>`).join("")}</tbody></table></div>`
          : `<p class="muted">${t("pp_none")}</p>`;
        list.querySelectorAll("[data-del-svc]").forEach(b => b.addEventListener("click", () => {
          if (!confirm(t("pp_del_confirm"))) return;
          sbRpcNamed("partner_delete_service", { p_email: p.email, p_pass: p.pass, p_id: +b.dataset.delSvc }).then(loadMine).catch(() => {});
        }));
      }).catch(() => { list.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
    loadMine();

    const f = document.getElementById("svcForm");
    if (f) f.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = document.getElementById("sErr"); err.hidden = true;
      const v = (id) => (document.getElementById(id).value || "").trim();
      if (!v("sTitle") || !v("sArea") || !v("sWa")) { err.textContent = t("pp_s_err"); err.hidden = false; return; }
      const files = Array.from((document.getElementById("sPhotos") || { files: [] }).files || []).slice(0, 10);
      if (files.find(fl => fl.size > 5 * 1024 * 1024)) { err.textContent = t("pp_s_photo_big"); err.hidden = false; return; }
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "\u23F3 " + t("ps_uploading");
      const sb3 = window.CONFIG.supabase;
      Promise.all(files.map(fl => {
        const ext = (fl.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const ph = crypto.randomUUID() + "." + ext;
        return fetch(sb3.url + "/storage/v1/object/partner-photos/" + ph, {
          method: "POST", headers: { "apikey": sb3.anonKey, "Authorization": "Bearer " + sb3.anonKey, "Content-Type": fl.type },
          body: fl
        }).then(r => { if (!r.ok) throw new Error("photo"); return ph; });
      })).then(paths => sbRpcNamed("partner_add_service", {
        p_email: p.email, p_pass: p.pass, p_title: v("sTitle"), p_category: v("sCat"),
        p_description: v("sDesc") || null, p_price: v("sPrice") ? +v("sPrice") : null, p_currency: "USD",
        p_area: v("sArea"), p_lat: v("sLat") ? +v("sLat") : null, p_lng: v("sLng") ? +v("sLng") : null,
        p_whatsapp: v("sWa").replace(/\D/g, ""), p_photos: paths
      })).then(() => {
        document.getElementById("sOk").hidden = false; btn.disabled = false; btn.textContent = t("pp_s_add");
        ["sTitle", "sDesc", "sPrice", "sArea", "sWa", "sPhotos"].forEach(id => { const el2 = document.getElementById(id); if (el2) el2.value = ""; });
        loadMine();
      }).catch(() => { err.textContent = t("acct_err"); err.hidden = false; btn.disabled = false; btn.textContent = t("pp_s_add"); });
    });
  }

  /* photo-first partner-service card (like a trip card) - used on Services + Home */
  const svcPhotoUrl = (ph) => window.CONFIG.supabase.url + "/storage/v1/object/public/partner-photos/" + ph;
  function svcPhotoCard(s) {
    const ph = Array.isArray(s.photos) ? s.photos : [];
    const first = ph.length ? svcPhotoUrl(ph[0]) : null;
    return `
      <div class="card svc-card svc-photo-card">
        <div class="att-media grad-green">
          ${first ? `<img class="att-img" src="${first}" alt="${esc(s.title)}" loading="lazy" decoding="async" onerror="this.remove()" />`
                  : `<span class="att-media-fallback">${svgIcon(P_ICON[s.category] || "globe", 40)}</span>`}
          <span class="att-scrim"></span>
          <span class="att-cat-pill">${svgIcon(P_ICON[s.category] || "globe", 14)} ${t("pt_" + (s.category || "other"))}</span>
          ${ph.length > 1 ? `<span class="svc-photo-n">${svgIcon("camera", 13)} ${ph.length}</span>` : ""}
        </div>
        <div class="att-body">
          <span class="att-name">${esc(s.title)}</span>
          <span class="muted small">${esc(s.company_name)}${s.website ? ` &middot; <a class="link-inline" target="_blank" rel="noopener" href="${esc(s.website)}">${t("sv_site")}</a>` : ""}</span>
          ${s.description ? `<span class="att-desc">${esc(s.description)}</span>` : ""}
          <div class="svc-meta">
            ${s.area_name ? `<span>${svgIcon("pin", 14)} ${esc(s.area_name)}</span>` : ""}
            ${s.price_from ? `<span class="price">${t("from")} <strong>$${s.price_from}</strong></span>` : ""}
          </div>
          ${s.whatsapp ? `<a class="btn btn-small btn-gold" target="_blank" rel="noopener" href="https://wa.me/${esc(s.whatsapp)}?text=${encodeURIComponent(t("wa_msg") + s.title)}">\uD83D\uDCAC ${t("contact_whatsapp")}</a>` : ""}
        </div>
      </div>`;
  }

  /* home: surface the latest partner services under the trips section */
  function loadHomeServices() {
    const wrap = document.getElementById("homeSvcs");
    const grid = document.getElementById("homeSvcGrid");
    if (!wrap || !grid) return;
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_services?select=*&order=created_at.desc&limit=3`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => {
      if (!Array.isArray(rows) || !rows.length) return;      // stays hidden until partners publish
      grid.innerHTML = rows.map(svcPhotoCard).join("");
      wrap.hidden = false;
    }).catch(() => {});
  }

  /* ---- partner password reset (from the emailed 24h link) ---- */
  function viewPartnerReset(token) {
    return `
      <section class="container auth-wrap">
        <form id="pResetForm" class="auth-card" novalidate>
          <div class="auth-icon">🔑</div>
          <h1 class="auth-title">${t("pr_title")}</h1>
          <p class="auth-sub">${t("pr_sub")}</p>
          <div class="field"><label for="prPass">${t("ps_pass")}</label>
            <div class="pass-wrap"><input id="prPass" type="password" autocomplete="new-password" /><button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button></div></div>
          <div id="prErr" class="form-error" role="alert" hidden></div>
          <button type="submit" class="btn btn-primary btn-block" data-token="${esc(token || "")}">${t("pr_btn")}</button>
        </form>
      </section>`;
  }
  function bindPartnerReset() {
    const f = document.getElementById("pResetForm");
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = f.querySelector("button[type=submit]");
      const err = document.getElementById("prErr"); err.hidden = true;
      btn.disabled = true;
      sbRpc("partner_reset_password", { p_token: btn.dataset.token, p_pass: document.getElementById("prPass").value })
        .then(() => { clearPartner(); alert(t("pr_ok")); location.hash = "#/partner"; })
        .catch(() => { err.textContent = t("pr_err"); err.hidden = false; btn.disabled = false; });
    });
  }

  /* ---- public services marketplace (approved partners only) ---- */
  function viewServices() {
    const chips = ["all"].concat(P_TYPES).map(c =>
      `<button class="chip ${c === "all" ? "active" : ""}" data-svccat="${c}">${c === "all" ? t("att_all") : t("pt_" + c)}</button>`).join("");
    return `
      <section class="detail-hero grad-gold tz-band">
        <div class="container"><h1>${t("sv_title")}</h1><p class="detail-meta">${t("sv_lead")}</p></div>
      </section>
      <section class="container section">
        <div class="chips" id="svcFilters">${chips}</div>
        <div class="card-grid" id="svcGrid"><p class="muted">${t("admin_loading")}</p></div>
        <p class="muted small center mt">${t("sv_note")}</p>
      </section>`;
  }
  let svcCache = null;
  function bindServices() {
    const grid = document.getElementById("svcGrid");
    if (!grid) return;
    const card = svcPhotoCard;
    const show = (cat) => {
      const rows = (svcCache || []).filter(s => cat === "all" || s.category === cat);
      grid.innerHTML = rows.length ? rows.map(card).join("") : `<p class="muted">${t("sv_none")}</p>`;
    };
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_services?select=*&order=created_at.desc`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => { svcCache = Array.isArray(rows) ? rows : []; show("all"); })
      .catch(() => { grid.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
    document.getElementById("svcFilters").addEventListener("click", (e) => {
      const b = e.target.closest("[data-svccat]"); if (!b) return;
      document.querySelectorAll("#svcFilters .chip").forEach(c => c.classList.remove("active"));
      b.classList.add("active"); show(b.dataset.svccat);
    });
  }

  /* ===================================================================
     VIEW: ITINERARIES (Destination-Tanzania style, Arusha edition)
     =================================================================== */
  function itinCard(it) {
    const img = it.photoId ? `https://images.unsplash.com/photo-${it.photoId}?w=800&q=60&auto=format&fit=crop` : "";
    const plan = (L(it.plan) || []);
    return `
      <article class="card itin-card">
        <div class="itin-media ${it.grad}">
          ${img ? `<img src="${img}" alt="${esc(L(it.name))}" loading="lazy" decoding="async" onerror="this.remove()" />` : ""}
          <span class="att-scrim"></span>
          <span class="itin-days">${it.days} ${it.days > 1 ? t("days") : t("day")}</span>
        </div>
        <div class="itin-body">
          <h3>${esc(L(it.name))}</h3>
          <p class="muted">${esc(L(it.summary))}</p>
          <details class="itin-plan">
            <summary>${t("itin_view_plan")}</summary>
            <ol class="itin-steps">${plan.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
          </details>
          <div class="card-foot">
            <span class="price">${t("from")} <strong>$${it.priceFrom}</strong> <small class="muted">${t("per_person")}</small></span>
            <button class="btn btn-small btn-gold" data-book-itin="${it.id}">${t("itin_enquire")}</button>
          </div>
        </div>
      </article>`;
  }
  function viewItineraries() {
    const list = window.ITINERARIES || [];
    return `
      <section class="detail-hero grad-green tz-band">
        <div class="container">
          <h1>${t("itin_title")}</h1>
          <p class="detail-meta">${t("itin_lead")}</p>
        </div>
      </section>
      <section class="container section">
        <div class="card-grid itin-grid">${list.map(itinCard).join("")}</div>
        <p class="muted small center mt">${t("itin_note")}</p>
      </section>`;
  }
  function bindItineraries() {
    document.querySelectorAll("[data-book-itin]").forEach(b => b.addEventListener("click", () => {
      const it = (window.ITINERARIES || []).find(x => x.id === b.dataset.bookItin);
      if (!it) return;
      const u = getCurrentUser() || {};
      const msg = `${t("itin_wa_msg")} "${L(it.name)}" (${it.days}d, ${t("from")} $${it.priceFrom} pp)`;
      sbInsert("submissions", {
        type: "enquiry", name: u.name || null, email: u.email || null, phone: u.phone || null,
        country: u.country || null, rating: null, lang, message: "[ITINERARY] " + msg
      }).catch(() => {});
      window.open(`https://wa.me/${window.CONFIG.visitorDeskWhatsApp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    }));
  }

  /* ===================================================================
     VIEW: ABOUT
     =================================================================== */
  function viewAbout() {
    const step = (t1, d1) => `<div class="step-card"><h3>${t(t1)}</h3><p class="muted">${t(d1)}</p></div>`;
    const win = (ic, t1, d1) => `<div class="win-card"><span class="win-icon">${ic}</span><h4>${t(t1)}</h4><p class="muted">${t(d1)}</p></div>`;
    return `
      <section class="detail-hero grad-gold">
        <div class="container">
          <h1>${t("about_title")}</h1>
          <p class="detail-meta">${t("about_lead")}</p>
        </div>
      </section>
      <section class="container section">
        <div class="step-grid">
          ${step("step1_t","step1_d")}${step("step2_t","step2_d")}
          ${step("step3_t","step3_d")}${step("step4_t","step4_d")}
        </div>
        <h2 class="page-title mt">${t("about_who")}</h2>
        <div class="win-grid">
          ${win("🌱","win1_t","win1_d")}${win("🛍️","win2_t","win2_d")}
          ${win("🏛️","win3_t","win3_d")}${win("✈️","win4_t","win4_d")}
        </div>
        <div class="center mt">
          <a href="#/trips" class="btn btn-primary">${t("about_cta")}</a>
        </div>
      </section>`;
  }

  /* ===================================================================
     VIEW: REGISTER (tourist data capture)
     =================================================================== */
  function viewRegister() {
    const cu = getCurrentUser();
    if (cu && cu.name) {                       // already registered & signed in — don't ask again
      const f = esc(String(cu.name).split(" ")[0]);
      return `
        <section class="container auth-wrap">
          <div class="auth-card">
            <div class="auth-icon">✅</div>
            <h1 class="auth-title">${t("reg_already")}</h1>
            <p class="auth-sub">${f} — ${t("reg_already_sub")}</p>
            <div class="hero-cta-row" style="justify-content:center">
              <a class="btn btn-primary" href="#/account">${t("reg_go_account")}</a>
              <a class="btn btn-ghost" href="#/trips">${t("reg_explore")}</a>
            </div>
          </div>
        </section>`;
    }
    const countries = window.COUNTRIES || [];
    const dialOpts = countries.map(c =>
      `<option value="+${c.d}" data-c="${c.c}"${c.c === "TZ" ? " selected" : ""}>${flag(c.c)} +${c.d}</option>`).join("");
    const eacFlags = (window.EAC || []).map(c => flagImg(c.c, "zone-flag")).join("");
    const interestOpts = `<option value="">${t("reg_interest_ph")}</option>` +
      ["safari", "culture", "stay", "food", "trek"].map(k => `<option value="${t("cat_" + k)}">${t("cat_" + k)}</option>`).join("");

    return `
      <section class="detail-hero grad-gold reg-hero">
        <div class="container">
          <h1>${t("reg_title")}</h1>
          <p class="detail-meta">${t("reg_lead")}</p>
        </div>
      </section>
      <section class="container reg-wrap">
        <div class="reg-layout">
          <aside class="reg-aside">
            <h2 class="reg-why">${t("reg_why")}</h2>
            <ul class="reg-benefits">
              <li>${t("reg_b1")}</li>
              <li>${t("reg_b2")}</li>
              <li>${t("reg_b3")}</li>
              <li>${t("reg_b4")}</li>
            </ul>
          </aside>
          <div class="reg-formcol">
        <form id="regForm" class="reg-form" novalidate>
          <div class="field">
            <label>${t("reg_zone")} <span class="req">*</span></label>
            <div class="zone-pick" id="zonePick" role="radiogroup" aria-label="${t("reg_zone")}">
              <button type="button" class="zone-opt active" data-zone="eac" aria-pressed="true">
                <span class="zone-flags">${eacFlags}</span>
                <b>${t("reg_zone_eac")}</b><small>${t("reg_zone_eac_sub")}</small>
              </button>
              <button type="button" class="zone-opt" data-zone="intl" aria-pressed="false">
                <span class="zone-globe">🌍</span>
                <b>${t("reg_zone_intl")}</b><small>${t("reg_zone_intl_sub")}</small>
              </button>
            </div>
          </div>
          <div class="field">
            <label for="regName">${t("reg_name")} <span class="req">*</span></label>
            <input id="regName" type="text" autocomplete="name" placeholder="${t("reg_name_ph")}" />
          </div>
          <div class="field">
            <label for="regCountrySearch">${t("reg_country")} <span class="req">*</span></label>
            <div class="combo" id="regCountryCombo">
              <input id="regCountrySearch" type="text" autocomplete="off" role="combobox" aria-expanded="false"
                aria-autocomplete="list" aria-controls="regCountryList" placeholder="${t("reg_country_ph")}" />
              <input type="hidden" id="regCountry" />
              <ul class="combo-list" id="regCountryList" role="listbox" hidden></ul>
            </div>
          </div>
          <div class="field">
            <label for="regPhone">${t("reg_phone")}</label>
            <div class="phone-row">
              <div class="dial-wrap">
                <img id="regDialFlag" class="flag-img dial-flag" src="${flagUrl("tz", 80)}" srcset="${flagUrl("tz", 160)} 2x" alt="" />
                <select id="regDial" class="dial" aria-label="Country code">${dialOpts}</select>
              </div>
              <input id="regPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${t("reg_phone_ph")}" />
            </div>
          </div>
          <div class="field">
            <label for="regEmail">${t("reg_email")}</label>
            <input id="regEmail" type="email" inputmode="email" autocomplete="email" placeholder="${t("reg_email_ph")}" />
          </div>
          <p class="field-note">${t("reg_contact_note")}</p>
          <div class="field">
            <label for="regPass">${t("reg_pass")} <span class="req">*</span></label>
            <div class="pass-wrap">
              <input id="regPass" type="password" autocomplete="new-password" placeholder="${t("reg_pass_ph")}" />
              <button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button>
            </div>
            <p class="field-note">${t("reg_pass_note")}</p>
          </div>
          <div class="field">
            <label for="regInterest">${t("reg_interest")}</label>
            <select id="regInterest">${interestOpts}</select>
          </div>
          <div id="regError" class="form-error" role="alert" hidden></div>
          <button type="submit" class="btn btn-primary btn-block">${t("reg_submit")}</button>
          <p class="muted small reg-privacy">🛡️ ${t("reg_privacy")}</p>
        </form>
        <div id="regSuccess" class="reg-success" hidden>
          <div class="reg-success-mark">✓</div>
          <p class="reg-success-msg">${t("reg_success")}</p>
          <a class="btn btn-primary" href="#/home">${t("reg_explore")}</a>
        </div>
          </div>
        </div>
      </section>`;
  }

  function bindRegister() {
    const form = document.getElementById("regForm");
    if (!form) return;
    const dial = document.getElementById("regDial");
    const err = document.getElementById("regError");

    /* EAC vs Non-EAC portal: EAC citizens register with their own country phone code */
    let zone = "eac";
    const EAC_SET = new Set((window.EAC || []).map(c => c.c));
    const zoneCountries = () => zone === "eac"
      ? window.COUNTRIES.filter(c => EAC_SET.has(c.c))
      : window.COUNTRIES;
    function rebuildDial() {
      dial.innerHTML = zoneCountries().map(c =>
        `<option value="+${c.d}" data-c="${c.c}"${c.c === "TZ" ? " selected" : ""}>${flag(c.c)} +${c.d}</option>`).join("");
      const opt = dial.selectedOptions[0];
      if (opt) setDialFlag(opt.getAttribute("data-c"));
    }
    const zonePick = document.getElementById("zonePick");
    if (zonePick) zonePick.addEventListener("click", (e) => {
      const b = e.target.closest(".zone-opt"); if (!b) return;
      zone = b.dataset.zone;
      zonePick.querySelectorAll(".zone-opt").forEach(x => {
        const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on);
      });
      rebuildDial();
      // reset the chosen country if it no longer fits the zone
      const hiddenC = document.getElementById("regCountry");
      if (zone === "eac" && hiddenC.value && !EAC_SET.has(hiddenC.value)) {
        hiddenC.value = ""; document.getElementById("regCountrySearch").value = "";
      }
    });

    /* searchable country combobox — type to filter, pick to auto-set the phone code */
    const combo = document.getElementById("regCountryCombo");
    const search = document.getElementById("regCountrySearch");
    const hidden = document.getElementById("regCountry");
    const list = document.getElementById("regCountryList");
    function renderCountryList(q) {
      const query = (q || "").trim().toLowerCase();
      const matches = zoneCountries()
        .filter(c => !query || c.n.toLowerCase().includes(query) || ("+" + c.d).startsWith(query))
        .slice(0, 80);
      list.innerHTML = matches.length
        ? matches.map(c => `<li role="option" data-c="${c.c}" data-d="${c.d}" data-n="${esc(c.n)}"><img class="flag-img combo-flag" src="${flagUrl(c.c)}" alt="" loading="lazy" />${esc(c.n)}<em>+${c.d}</em></li>`).join("")
        : `<li class="combo-empty">${t("reg_country_none")}</li>`;
      list.hidden = false;
      search.setAttribute("aria-expanded", "true");
    }
    function closeCountryList() { list.hidden = true; search.setAttribute("aria-expanded", "false"); }
    const dialFlag = document.getElementById("regDialFlag");
    function setDialFlag(iso) { if (dialFlag && iso) dialFlag.src = flagUrl(iso, 80); }
    function chooseCountry(li) {
      if (!li || !li.dataset.c) return;
      search.value = li.dataset.n;
      hidden.value = li.dataset.c;
      dial.value = "+" + li.dataset.d;   // auto phone code
      setDialFlag(li.dataset.c);         // + matching flag
      closeCountryList();
    }
    // keep the flag in sync if they change the dial code manually
    dial.addEventListener("change", () => {
      const opt = dial.selectedOptions[0];
      if (opt) setDialFlag(opt.getAttribute("data-c"));
    });
    search.addEventListener("focus", () => renderCountryList(search.value));
    search.addEventListener("input", () => { hidden.value = ""; renderCountryList(search.value); });
    list.addEventListener("mousedown", (e) => {          // mousedown fires before blur
      const li = e.target.closest("li[data-c]");
      if (li) { e.preventDefault(); chooseCountry(li); }
    });
    search.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const first = list.querySelector("li[data-c]"); if (first && !list.hidden) { e.preventDefault(); chooseCountry(first); } }
      else if (e.key === "Escape") closeCountryList();
    });
    document.addEventListener("click", (e) => { if (!combo.contains(e.target)) closeCountryList(); });
    rebuildDial();                                   // start in the EAC portal
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("regName").value.trim();
      const countryCode = hidden.value;
      const countryName = (window.COUNTRIES.find(c => c.c === countryCode) || {}).n || "";
      const phone = document.getElementById("regPhone").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const interest = document.getElementById("regInterest").value;
      const pass = document.getElementById("regPass").value;
      const problems = [];
      if (!name) problems.push(t("reg_err_name"));
      if (!countryCode) problems.push(t("reg_err_country"));
      if (!phone && !email) problems.push(t("reg_err_contact"));
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push(t("reg_err_email"));
      if (!pass || pass.length < 4) problems.push(t("reg_err_pass"));
      if (email && findRegByLogin(email)) problems.push(t("reg_err_exists"));
      if (problems.length) {
        err.innerHTML = problems.map(p => `<div>• ${esc(p)}</div>`).join("");
        err.hidden = false;
        return;
      }
      const fullPhone = phone ? dial.value + " " + phone : "";
      const ts = new Date().toISOString();
      saveReg({
        ts, name, countryCode, country: countryName, zone,
        dial: phone ? dial.value : "", phone: fullPhone,
        email, interest, lang, pass: hashPass(pass)
      });
      setCurrentUser({ name, email, phone: fullPhone, country: countryName, interest, zone, ts });  // auto sign-in
      addActivity({ type: "register", message: t("act_registered") });
      updateAuthNav();
      form.hidden = true;
      document.getElementById("regSuccess").hidden = false;
    });
  }

  /* admin table of registrations (shown on the dashboard) */
  /* ---------- central admin backed by Supabase RPC (passcode-gated) ---------- */
  function sbRpc(fn, body) {
    const sb = window.CONFIG && window.CONFIG.supabase;
    if (!sb || !sb.url) return Promise.reject(new Error("no-backend"));
    return fetch(sb.url + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey },
      body: JSON.stringify(body)
    }).then(r => { if (!r.ok) throw new Error("rpc " + r.status); return r.json(); });
  }
  function renderAdminDashboard(data) {
    const regs = (data && data.registrations) || [];
    const subs = (data && data.submissions) || [];
    const enq = subs.filter(s => s.type === "enquiry");
    const rev = subs.filter(s => s.type === "review");
    const chal = subs.filter(s => s.type === "challenge");
    const when = ts => esc(new Date(ts).toLocaleDateString(lang === "sw" ? "sw-TZ" : lang));
    const contact = r => esc([r.phone, r.email].filter(Boolean).join(" · ")) || "—";
    const avg = rev.length ? (rev.reduce((a, b) => a + (b.rating || 0), 0) / rev.length).toFixed(1) : null;

    const stat = (icon, val, label) => `<div class="stat-card-sm"><span class="ssm-icon">${icon}</span><strong>${val}</strong><span>${label}</span></div>`;
    const summary = `<div class="admin-summary">
      ${stat("🧾", regs.length, t("admin_sum_reg"))}
      ${stat("📨", enq.length, t("admin_sum_enq"))}
      ${stat("⭐", avg ? `${rev.length} · ${avg}★` : rev.length, t("admin_sum_rev"))}
      ${stat("⚠️", chal.length, t("admin_sum_chal"))}
    </div>`;

    const regTable = regs.length ? `<div class="table-wrap"><table class="reg-table">
      <thead><tr><th>${t("admin_name")}</th><th>${t("admin_country")}</th><th>${t("admin_phone")}</th><th>${t("admin_email")}</th><th>${t("admin_interest")}</th><th>${t("admin_when")}</th></tr></thead>
      <tbody>${regs.map(r => `<tr>
        <td>${esc(r.name || "")}</td>
        <td>${flagImg(r.country_code)} ${esc(r.country || "")}</td>
        <td>${esc(r.phone || "—")}</td>
        <td>${esc(r.email || "—")}</td>
        <td>${esc(r.interest || "—")}</td>
        <td>${when(r.created_at)}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="muted admin-empty">${t("admin_empty")}</p>`;

    const msgTable = (list) => list.length ? `<div class="table-wrap"><table class="reg-table">
      <thead><tr><th>${t("admin_name")}</th><th>${t("admin_contact")}</th><th>${t("admin_message")}</th><th>${t("admin_when")}</th></tr></thead>
      <tbody>${list.map(s => `<tr><td>${esc(s.name || "—")}</td><td>${contact(s)}</td><td class="msg-cell">${esc(s.message || "")}</td><td>${when(s.created_at)}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="muted admin-empty">${t("admin_none")}</p>`;

    const revTable = rev.length ? `<div class="table-wrap"><table class="reg-table">
      <thead><tr><th>${t("admin_name")}</th><th>${t("admin_rating")}</th><th>${t("admin_message")}</th><th>${t("admin_when")}</th></tr></thead>
      <tbody>${rev.map(s => `<tr><td>${esc(s.name || "—")}</td><td class="stars-cell"><span class="on">${"★".repeat(s.rating || 0)}</span>${"★".repeat(5 - (s.rating || 0))}</td><td class="msg-cell">${esc(s.message || "")}</td><td>${when(s.created_at)}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="muted admin-empty">${t("admin_none")}</p>`;

    return `
      ${summary}
      <div class="admin-tabs" id="adminTabs">
        <button class="admin-tab active" data-tab="reg">🧾 ${t("admin_sum_reg")} (${regs.length})</button>
        <button class="admin-tab" data-tab="enq">📨 ${t("admin_sum_enq")} (${enq.length})</button>
        <button class="admin-tab" data-tab="rev">⭐ ${t("admin_sum_rev")} (${rev.length})</button>
        <button class="admin-tab" data-tab="chal">⚠️ ${t("admin_sum_chal")} (${chal.length})</button>
        <button class="admin-tab" data-tab="partners">🤝 ${t("admin_sum_partners")}</button>
      </div>
      <div class="admin-cat" data-cat="reg">
        <div class="admin-head"><h3>${t("admin_sum_reg")}</h3><div class="admin-actions"><button class="btn btn-small" id="regExport"${regs.length ? "" : " disabled"}>⬇ ${t("admin_export")}</button></div></div>
        ${regTable}
      </div>
      <div class="admin-cat" data-cat="enq" hidden><h3>📨 ${t("admin_sum_enq")}</h3>${msgTable(enq)}</div>
      <div class="admin-cat" data-cat="rev" hidden><h3>⭐ ${t("admin_sum_rev")}</h3>${revTable}</div>
      <div class="admin-cat" data-cat="chal" hidden><h3>⚠️ ${t("admin_sum_chal")}</h3>${msgTable(chal)}</div>
      <div class="admin-cat" data-cat="partners" hidden><h3>🤝 ${t("admin_sum_partners")}</h3><div id="adminPartners"><p class="muted">${t("admin_loading")}</p></div></div>`;
  }
  function exportCentralCSV(rows) {
    const head = ["Registered", "Name", "Country", "Phone", "Email", "Interest", "Lang"];
    const data = rows.map(r => [r.created_at, r.name, r.country, r.phone || "", r.email || "", r.interest || "", r.lang || ""]);
    const csv = [head].concat(data)
      .map(row => row.map(f => `"${String(f == null ? "" : f).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "karibu-arusha-registrations.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ===================================================================
     VIEW: ADMIN (passcode gate → ALL central registrations + change password)
     =================================================================== */
  function isAdmin() { return !!sessionStorage.getItem("ka_admin_pass"); }
  function pwField(id, ph) {
    return `<div class="pass-wrap"><input id="${id}" type="password" autocomplete="off" placeholder="${esc(ph)}" /><button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button></div>`;
  }
  function viewAdmin() {
    if (!isAdmin()) {
      return `
        <section class="container auth-wrap">
          <form id="adminLogin" class="auth-card" novalidate>
            <div class="auth-icon">🔒</div>
            <h1 class="auth-title">${t("admin_login_title")}</h1>
            <p class="auth-sub">${t("admin_login_sub")}</p>
            <div class="field">
              <label for="adminPass">${t("admin_pass_ph")}</label>
              ${pwField("adminPass", t("admin_pass_ph"))}
            </div>
            <div id="adminErr" class="form-error" role="alert" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">${t("admin_login_btn")}</button>
          </form>
        </section>`;
    }
    return `
      <section class="detail-hero grad-green">
        <div class="container"><h1>${t("admin_title")}</h1><p class="detail-meta">${t("admin_sub")}</p></div>
      </section>
      <section class="container section">
        <div id="adminData"><p class="muted">${t("admin_loading")}</p></div>
        <details class="admin-cp">
          <summary>🔑 ${t("admin_change_pw")}</summary>
          <form id="adminCpForm" class="admin-cp-form" novalidate>
            <div class="field"><label for="cpOld">${t("admin_cp_old")}</label>${pwField("cpOld", t("admin_cp_old"))}</div>
            <div class="field"><label for="cpNew">${t("admin_cp_new")}</label>${pwField("cpNew", t("admin_cp_new"))}</div>
            <div id="cpMsg" role="alert" hidden></div>
            <button type="submit" class="btn btn-primary">${t("admin_cp_save")}</button>
          </form>
        </details>
        <div class="center mt"><button class="btn btn-ghost" id="adminLogout">${t("admin_logout")}</button></div>
      </section>`;
  }
  function bindAdminPage() {
    const login = document.getElementById("adminLogin");
    if (login) {
      login.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = document.getElementById("adminPass").value;
        const er = document.getElementById("adminErr");
        const btn = login.querySelector("button[type=submit]");
        if (!val) { er.textContent = t("admin_login_err"); er.hidden = false; return; }
        btn.disabled = true; er.hidden = true;
        sbRpc("admin_data", { p_pass: val })
          .then(() => { sessionStorage.setItem("ka_admin_pass", val); render(); })
          .catch(() => { er.textContent = t("admin_login_err"); er.hidden = false; btn.disabled = false; });
      });
      return;
    }
    // authed view
    const logout = document.getElementById("adminLogout");
    if (logout) logout.addEventListener("click", () => { sessionStorage.removeItem("ka_admin_pass"); render(); });

    const cp = document.getElementById("adminCpForm");
    if (cp) cp.addEventListener("submit", (e) => {
      e.preventDefault();
      const oldv = document.getElementById("cpOld").value, nv = document.getElementById("cpNew").value;
      const msg = document.getElementById("cpMsg"); msg.hidden = true;
      sbRpc("admin_change_password", { p_old: oldv, p_new: nv })
        .then(() => {
          sessionStorage.setItem("ka_admin_pass", nv);
          msg.className = "form-ok"; msg.textContent = t("admin_cp_ok"); msg.hidden = false;
          document.getElementById("cpOld").value = ""; document.getElementById("cpNew").value = "";
        })
        .catch(() => { msg.className = "form-error"; msg.textContent = t("admin_cp_err"); msg.hidden = false; });
    });

    // load ALL central data (registrations + submissions) using the stored passcode
    const pass = sessionStorage.getItem("ka_admin_pass");
    const container = document.getElementById("adminData");
    sbRpc("admin_data", { p_pass: pass })
      .then((data) => {
        data = data || {};
        container.innerHTML = renderAdminDashboard(data);
        // category tabs
        const tabs = document.getElementById("adminTabs");
        if (tabs) tabs.addEventListener("click", (e) => {
          const b = e.target.closest(".admin-tab"); if (!b) return;
          tabs.querySelectorAll(".admin-tab").forEach(x => x.classList.remove("active"));
          b.classList.add("active");
          const cat = b.dataset.tab;
          container.querySelectorAll(".admin-cat").forEach(c => { c.hidden = c.dataset.cat !== cat; });
        });
        const exp = document.getElementById("regExport");
        if (exp) exp.addEventListener("click", () => exportCentralCSV(data.registrations || []));
        loadAdminPartners(pass);
      })
      .catch(() => {
        sessionStorage.removeItem("ka_admin_pass");
        if (container) container.innerHTML = `<p class="form-error">${t("admin_login_err")}</p>`;
      });
  }

  /* admin: download all partner rows as a CSV (opens in Excel) */
  function exportPartnersCSV(rows) {
    const head = ["Applied", "Company", "Contact", "Type", "Entity", "Email", "Phone", "Website", "TIN", "Licence", "Status", "Services"];
    const data = (rows || []).map(p => [p.created_at, p.company_name, p.contact_name, p.ptype, p.entity, p.email, p.phone, p.website || "", p.tin || "", p.license_no || "", p.status, p.services]);
    const csv = [head].concat(data).map(row => row.map(f => `"${String(f == null ? "" : f).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "karibu-arusha-partners.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---- admin: partner verification queue (approve / reject / view PDF) ---- */
  function loadAdminPartners(pass) {
    const host = document.getElementById("adminPartners");
    if (!host) return;
    sbRpc("admin_partners", { p_pass: pass }).then(d => {
      const rows = (d && d.partners) || [];
      const exportBar = `<div class="admin-head"><h4 style="margin:0">${rows.length} ${t("admin_sum_partners")}</h4><button class="btn btn-small" id="partExport">⬇ ${t("admin_export")}</button></div>`;
      if (!rows.length) { host.innerHTML = `<p class="muted admin-empty">${t("admin_none")}</p>`; return; }
      const stPill = (s) => `<span class="pstat pstat-${s}">${s === "approved" ? "✓" : s === "rejected" ? "✕" : "⏳"} ${t("pp_st_" + s)}</span>`;
      host.innerHTML = exportBar + `<div class="table-wrap"><table class="reg-table">
        <thead><tr><th>${t("ps_company")}</th><th>${t("ps_type")}</th><th>${t("admin_contact")}</th><th>${t("ps_website")}</th><th>TIN / ${t("ps_license")}</th><th>${t("admin_docs")}</th><th>${t("admin_status")}</th><th></th></tr></thead>
        <tbody>${rows.map(p => `<tr>
          <td><strong>${esc(p.company_name)}</strong><br><small class="muted">${esc(p.contact_name)} · ${p.entity}</small></td>
          <td>${t("pt_" + p.ptype)}</td>
          <td>${esc(p.email)}<br><small>${esc(p.phone)}</small></td>
          <td>${p.website ? `<a class="link-inline" target="_blank" rel="noopener" href="${esc(p.website)}">${t("sv_site")}</a>` : "—"}</td>
          <td>${esc(p.tin || "—")}<br><small>${esc(p.license_no || "—")}</small></td>
          <td class="admin-doc-cell">
              ${p.doc_path ? `<button class="btn btn-small" data-doc="${esc(p.doc_path)}">📄 ${t("admin_view_doc")}</button><button class="btn btn-small" data-doc="${esc(p.doc_path)}" data-dl="1" title="${t("admin_download")}">⬇</button>` : "—"}
              ${p.tin_doc_path ? `<div style="margin-top:4px"><button class="btn btn-small" data-doc="${esc(p.tin_doc_path)}">🧾 TIN</button><button class="btn btn-small" data-doc="${esc(p.tin_doc_path)}" data-dl="1" title="${t("admin_download")}">⬇</button></div>` : ""}</td>
          <td>${stPill(p.status)}<br><small class="muted">${p.services} ${t("admin_services_n")}</small></td>
          <td class="admin-actions-cell">
            ${p.status !== "approved" ? `<button class="btn btn-small btn-gold" data-pstat="approved" data-pid="${p.id}">✓ ${t("admin_approve")}</button>` : ""}
            ${p.status !== "rejected" ? `<button class="btn btn-small" data-pstat="rejected" data-pid="${p.id}">✕ ${t("admin_reject")}</button>` : ""}
          </td></tr>`).join("")}</tbody></table></div>`;
      host.querySelectorAll("[data-pstat]").forEach(b => b.addEventListener("click", () => {
        b.disabled = true;
        sbRpc("admin_partner_status", { p_pass: pass, p_id: b.dataset.pid, p_status: b.dataset.pstat })
          .then(() => loadAdminPartners(pass)).catch(() => { b.disabled = false; alert(t("acct_err")); });
      }));
      host.querySelectorAll("[data-doc]").forEach(b => b.addEventListener("click", () => {
        b.disabled = true;
        fetch(window.CONFIG.supabase.url + "/functions/v1/partner-doc", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pass, path: b.dataset.doc, download: b.dataset.dl === "1" })
        }).then(r => r.json()).then(d2 => { b.disabled = false; if (d2 && d2.url) window.open(d2.url, "_blank", "noopener"); else alert(t("acct_err")); })
          .catch(() => { b.disabled = false; alert(t("acct_err")); });
      }));
      const exp = document.getElementById("partExport");
      if (exp) exp.addEventListener("click", () => exportPartnersCSV(rows));
    }).catch(() => { host.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
  }

  /* ===================================================================
     VIEW: TOURIST LOGIN (sign in with the account made at registration)
     =================================================================== */
  function viewLogin() {
    const u = getCurrentUser();
    if (u && u.name) {
      return `
        <section class="container auth-wrap">
          <div class="auth-card">
            <div class="auth-icon">✅</div>
            <h1 class="auth-title">${t("login_already")}</h1>
            <p class="auth-sub">${esc(String(u.name).split(" ")[0])} — ${t("login_already_sub")}</p>
            <a class="btn btn-primary btn-block" href="#/home">${t("reg_explore")}</a>
          </div>
        </section>`;
    }
    return `
      <section class="container auth-wrap">
        <form id="loginForm" class="auth-card" novalidate>
          <div class="auth-icon">👋</div>
          <h1 class="auth-title">${t("login_title")}</h1>
          <p class="auth-sub">${t("login_sub")}</p>
          <div class="field">
            <label for="loginId">${t("login_id")}</label>
            <input id="loginId" type="text" autocomplete="username" placeholder="${t("login_id_ph")}" />
          </div>
          <div class="field">
            <label for="loginPass">${t("login_pass")}</label>
            <div class="pass-wrap">
              <input id="loginPass" type="password" autocomplete="current-password" placeholder="${t("login_pass_ph")}" />
              <button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button>
            </div>
          </div>
          <div id="loginErr" class="form-error" role="alert" hidden></div>
          <button type="submit" class="btn btn-primary btn-block">${t("login_btn")}</button>
          <p class="muted small auth-alt">${t("login_no_acct")} <a href="#/register" class="link-inline">${t("login_register")}</a></p>
        </form>
      </section>`;
  }
  function bindLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("loginId").value.trim();
      const pass = document.getElementById("loginPass").value;
      const err = document.getElementById("loginErr");
      const rec = findRegByLogin(id);
      if (rec && rec.pass && rec.pass === hashPass(pass)) {
        setCurrentUser({ name: rec.name, email: rec.email, phone: rec.phone, country: rec.country, ts: rec.ts });
        updateAuthNav();
        location.hash = "#/home"; render();
      } else {
        err.textContent = t("login_err"); err.hidden = false;
      }
    });
  }

  /* ===================================================================
     VIEW: MY ACCOUNT (tourist tools — enquiry, review, challenge, favourites)
     =================================================================== */
  function viewAccount() {
    const u = getCurrentUser();
    if (!u || !u.name) {
      return `
        <section class="container auth-wrap">
          <div class="auth-card">
            <div class="auth-icon">🔑</div>
            <h1 class="auth-title">${t("acct_need_login")}</h1>
            <p class="auth-sub">${t("acct_need_login_sub")}</p>
            <div class="hero-cta-row" style="justify-content:center">
              <a class="btn btn-primary" href="#/login">${t("login_btn")}</a>
              <a class="btn btn-ghost" href="#/register">${t("login_register")}</a>
            </div>
          </div>
        </section>`;
    }
    const first = esc(String(u.name).split(" ")[0]);
    const memberSince = u.ts ? new Date(u.ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const act = getActivity();
    const favCount = getFavs().length;
    const countOf = (ty) => act.filter(a => a.type === ty).length;
    const actIcon = { register: "🎉", enquiry: "📨", review: "⭐", challenge: "⚠️" };
    const actLabel = { register: t("acct_enquiry_h"), enquiry: t("acct_enquiry"), review: t("acct_review"), challenge: t("acct_challenge") };
    const timeAgo = (iso) => { try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
    const activityList = act.length
      ? `<ul class="acct-timeline">${act.map(a => `
          <li class="acct-tl-item">
            <span class="acct-tl-icon">${actIcon[a.type] || "•"}</span>
            <div class="acct-tl-body">
              <div class="acct-tl-top"><strong>${esc(actLabel[a.type] || a.type)}</strong>${a.rating ? ` <span class="acct-tl-stars">${"★".repeat(a.rating)}</span>` : ""}<span class="acct-tl-time">${timeAgo(a.ts)}</span></div>
              ${a.message ? `<p class="acct-tl-msg">${esc(a.message)}</p>` : ""}
            </div>
          </li>`).join("")}</ul>`
      : `<p class="muted">${t("acct_no_activity")}</p>`;
    const profileCard = `
      <div class="acct-profile">
        <div class="acct-avatar">${esc(String(u.name).trim().charAt(0).toUpperCase() || "🙂")}</div>
        <div class="acct-profile-info">
          <h2 class="acct-profile-name">${esc(u.name)}</h2>
          <div class="acct-profile-meta">
            ${u.country ? `<span>📍 ${esc(u.country)}</span>` : ""}
            ${u.phone ? `<span>📱 ${esc(u.phone)}</span>` : ""}
            ${u.email ? `<span>✉️ ${esc(u.email)}</span>` : ""}
            ${memberSince ? `<span>🗓️ ${t("acct_since")} ${esc(memberSince)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="acct-stats">
        <div class="acct-stat"><span class="acct-stat-n">${countOf("enquiry")}</span><span class="acct-stat-l">${t("acct_enquiry")}</span></div>
        <div class="acct-stat"><span class="acct-stat-n">${countOf("review")}</span><span class="acct-stat-l">${t("acct_review")}</span></div>
        <div class="acct-stat"><span class="acct-stat-n">${countOf("challenge")}</span><span class="acct-stat-l">${t("acct_challenge")}</span></div>
        <div class="acct-stat"><span class="acct-stat-n">${favCount}</span><span class="acct-stat-l">${t("acct_favs")}</span></div>
      </div>`;
    const starPicker = `<div class="star-pick" id="reviewStars" role="radiogroup" aria-label="${t("acct_rating")}">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="star" data-v="${i}" aria-label="${i}">★</button>`).join("")}</div><input type="hidden" id="reviewRating" value="0" />`;
    const favs = getFavs().map(id => window.TRIPS.find(x => x.id === id)).filter(Boolean);
    const favList = favs.length
      ? `<div class="card-grid trips-grid">${favs.map(tripCard).join("")}</div>`
      : `<p class="muted">${t("acct_no_favs")} <a href="#/trips" class="link-inline">${t("nav_trips")} →</a></p>`;
    const panel = (type, title, sub, ph, extra) => `
      <div class="acct-panel" data-panel="${type}"${type === "enquiry" ? "" : " hidden"}>
        <form class="acct-form" data-type="${type}" novalidate>
          <h3>${title}</h3>
          <p class="muted small">${sub}</p>
          ${extra || ""}
          <textarea class="acct-msg" rows="4" placeholder="${ph}" required></textarea>
          <div class="acct-ok form-ok" hidden>✓ ${t("acct_sent")}</div>
          <button class="btn btn-primary" type="submit">${t("acct_send")}</button>
        </form>
      </div>`;
    return `
      <section class="detail-hero grad-gold">
        <div class="container"><h1>${t("acct_hi")}, ${first} 👋</h1><p class="detail-meta">${t("acct_lead")}</p></div>
      </section>
      <section class="container section">
        ${profileCard}
        <a class="acct-explore" href="#/explore">
          <span class="acct-explore-ic">${svgIcon("map", 26)}</span>
          <span class="acct-explore-tx"><strong>${t("acct_explore_t")}</strong><small>${t("acct_explore_s")}</small></span>
          <span class="acct-explore-go">→</span>
        </a>
        <h2 class="acct-section-h">${t("acct_activity_h")}</h2>
        ${activityList}
        <h2 class="acct-section-h">${t("acct_tools_h")}</h2>
        <div class="acct-tabs" id="acctTabs">
          <button class="acct-tab active" data-tab="enquiry">📨 ${t("acct_enquiry")}</button>
          <button class="acct-tab" data-tab="review">⭐ ${t("acct_review")}</button>
          <button class="acct-tab" data-tab="challenge">⚠️ ${t("acct_challenge")}</button>
          <button class="acct-tab" data-tab="favs">❤️ ${t("acct_favs")}</button>
        </div>
        ${panel("enquiry", t("acct_enquiry_h"), t("acct_enquiry_sub"), t("acct_enquiry_ph"))}
        ${panel("review", t("acct_review_h"), t("acct_review_sub"), t("acct_review_ph"), starPicker)}
        ${panel("challenge", t("acct_challenge_h"), t("acct_challenge_sub"), t("acct_challenge_ph"))}
        <div class="acct-panel" data-panel="favs" hidden>
          <h3>${t("acct_favs_h")}</h3>
          ${favList}
        </div>
      </section>`;
  }
  function bindAccount() {
    const tabs = document.getElementById("acctTabs");
    if (!tabs) return;
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".acct-tab"); if (!b) return;
      tabs.querySelectorAll(".acct-tab").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const which = b.dataset.tab;
      document.querySelectorAll(".acct-panel").forEach(p => { p.hidden = p.dataset.panel !== which; });
    });
    const starWrap = document.getElementById("reviewStars");
    if (starWrap) starWrap.addEventListener("click", (e) => {
      const s = e.target.closest(".star"); if (!s) return;
      const v = +s.dataset.v;
      document.getElementById("reviewRating").value = v;
      starWrap.querySelectorAll(".star").forEach(st => st.classList.toggle("on", +st.dataset.v <= v));
    });
    const u = getCurrentUser() || {};
    document.querySelectorAll(".acct-form").forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const type = form.dataset.type;
        const msg = form.querySelector(".acct-msg").value.trim();
        if (!msg) return;
        const rating = type === "review" ? (+document.getElementById("reviewRating").value || null) : null;
        const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
        sbInsert("submissions", {
          type, name: u.name || null, email: u.email || null, phone: u.phone || null,
          country: u.country || null, rating, message: msg, lang
        }).then(() => {
          addActivity({ type, message: msg, rating });   // mirror into the tourist's own history
          form.querySelector(".acct-ok").hidden = false;
          form.querySelector(".acct-msg").value = "";
          if (type === "review" && starWrap) { document.getElementById("reviewRating").value = "0"; starWrap.querySelectorAll(".star").forEach(st => st.classList.remove("on")); }
          btn.disabled = false;
        }).catch(() => { btn.disabled = false; alert(t("acct_err")); });
      });
    });
  }

  function notFound() {
    return `<section class="container section center">
      <h2>🦒</h2><p class="muted">404</p>
      <a href="#/home" class="btn btn-primary">${t("nav_home")}</a></section>`;
  }

  /* ===================================================================
     BOOKING MODAL (choose operator → WhatsApp)
     =================================================================== */
  const backdrop = document.getElementById("modalBackdrop");
  const modalBody = document.getElementById("modalBody");

  function openBooking(tripId) {
    const tr = window.TRIPS.find(x => x.id === tripId);
    if (!tr) return;
    // suggest operators relevant to the trip (safari ↔ safari, else all)
    const safariTrip = tr.tags.includes("safari");
    const ops = window.OPERATORS.filter(o => safariTrip ? o.category === "safari" : true);
    const list = (ops.length ? ops : window.OPERATORS).slice(0, 5).map(op => `
      <a class="book-op" target="_blank" rel="noopener"
         href="${waLink(op.whatsapp, L(tr.name))}">
        <span class="op-icon">${op.icon}</span>
        <span class="book-op-text"><strong>${esc(L(op.name))}</strong><small>★ ${op.rating} · ${t("cat_" + op.category)}</small></span>
        <span class="book-op-go">💬</span>
      </a>`).join("");
    modalBody.innerHTML = `
      <h3 id="modalTitle">${t("book_title")}</h3>
      <p class="muted">${t("book_intro")}</p>
      <p class="book-trip">🎟️ <strong>${esc(L(tr.name))}</strong> · ${t("from")} $${tr.priceFrom}</p>
      <p class="book-choose">${t("book_choose")}</p>
      <div class="book-list">${list}</div>`;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeBooking() {
    backdrop.hidden = true;
    document.body.style.overflow = "";
  }
  document.getElementById("modalClose").addEventListener("click", closeBooking);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeBooking(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBooking(); });

  /* ===================================================================
     ROUTER
     =================================================================== */
  function render() {
    const hash = location.hash.replace(/^#\/?/, "") || "home";
    const [route, param] = hash.split("/");
    let html;
    switch (route) {
      case "home": html = viewHome(); break;
      case "trips": html = viewTrips(); break;
      case "trip": html = viewTripDetail(param); break;
      case "operators": html = viewOperators(); break;
      case "operator": html = viewOperatorDetail(param); break;
      case "matches": html = viewMatches(); break;
      case "dashboard": html = viewDashboard(); break;
      case "register": html = viewRegister(); break;
      case "login": html = viewLogin(); break;
      case "account": html = viewAccount(); break;
      case "admin": html = viewAdmin(); break;
      case "explore": html = viewExplore(); break;
      case "place": html = viewPlace(param); break;
      case "itineraries": html = viewItineraries(); break;
      case "partners": html = viewPartners(); break;
      case "partner-signup": html = viewPartnerSignup(); break;
      case "partner": html = viewPartnerPortal(); break;
      case "partner-reset": html = viewPartnerReset(param); break;
      case "services": html = viewServices(); break;
      case "events": html = viewEvents(); break;
      case "about": html = viewAbout(); break;
      default: html = notFound();
    }
    app.innerHTML = html;
    window.scrollTo(0, 0);
    afterRender(route, param);
    setActiveNav(route);
    updateAuthNav();
  }

  function afterRender(route, param) {
    // trip filter chips
    bindTripFilters();

    // operator search + category
    const search = document.getElementById("opSearch");
    if (search) search.addEventListener("input", filterOperators);
    const opf = document.getElementById("opFilters");
    if (opf) opf.addEventListener("click", e => {
      const b = e.target.closest("[data-cat]"); if (!b) return;
      opf.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      b.classList.add("active");
      filterOperators();
    });

    // booking buttons
    document.querySelectorAll("[data-book]").forEach(b =>
      b.addEventListener("click", () => openBooking(b.dataset.book)));

    if (route === "dashboard") animateCounters();
    if (route === "register") bindRegister();
    if (route === "login") bindLogin();
    if (route === "account") bindAccount();
    if (route === "admin") bindAdminPage();
    if (route === "explore") bindExplore();
    if (route === "place") bindPlace(param);
    if (route === "itineraries") bindItineraries();
    if (route === "partner-signup") bindPartnerSignup();
    if (route === "partner") bindPartnerPortal();
    if (route === "partner-reset") bindPartnerReset();
    if (route === "services") bindServices();
    if (route === "events") bindEvents();
    if (route === "home") { buildScrollHero(); setupCineVideo(); loadHomeServices(); } else stopScrollHero();
    setupReveal();
  }

  function bindTripFilters() {
    const tf = document.getElementById("tripFilters");
    if (!tf) return;
    tf.onclick = (e) => {
      const b = e.target.closest("[data-filter]"); if (!b) return;
      app.innerHTML = viewTrips(b.dataset.filter);
      afterRender("trips");
    };
  }

  function setActiveNav(route) {
    document.querySelectorAll(".main-nav a").forEach(a => {
      const r = a.getAttribute("href").replace("#/", "");
      a.classList.toggle("active", r === route || (route === "trip" && r === "trips") || (route === "operator" && r === "operators"));
    });
    // highlight a group button when one of its children is the active page
    document.querySelectorAll(".nav-group").forEach(g => {
      g.querySelector(".nav-group-btn").classList.toggle("active", !!g.querySelector(".nav-drop a.active"));
      g.classList.remove("open");
    });
  }

  /* ---------- language switch ---------- */
  const sel = document.getElementById("langSelect");
  sel.value = lang;
  sel.addEventListener("change", () => {
    lang = sel.value;
    localStorage.setItem("ka_lang", lang);
    applyStaticI18n();
    render();
    window.dispatchEvent(new Event("ka-lang"));
  });

  /* ---------- nav dropdown groups (Discover / Plan a trip) ---------- */
  document.querySelectorAll(".nav-group-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const g = btn.parentElement;
      const open = !g.classList.contains("open");
      document.querySelectorAll(".nav-group").forEach(x => { x.classList.remove("open"); x.querySelector(".nav-group-btn").setAttribute("aria-expanded", "false"); });
      g.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open);
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-group")) document.querySelectorAll(".nav-group").forEach(x => x.classList.remove("open"));
  });
  document.addEventListener("keydown", (e) => {           // Escape closes any open dropdown
    if (e.key === "Escape") document.querySelectorAll(".nav-group.open").forEach(x => {
      x.classList.remove("open");
      x.querySelector(".nav-group-btn").setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- mobile nav toggle ---------- */
  document.getElementById("navToggle").addEventListener("click", () => {
    document.getElementById("mainNav").classList.toggle("open");
  });
  document.getElementById("mainNav").addEventListener("click", e => {
    if (e.target.tagName === "A") document.getElementById("mainNav").classList.remove("open");
  });
  // close the menu when tapping anywhere outside it (so the page is usable again)
  document.addEventListener("click", (e) => {
    const nav = document.getElementById("mainNav");
    if (nav.classList.contains("open") && !nav.contains(e.target) && !e.target.closest("#navToggle")) {
      nav.classList.remove("open");
    }
  });

  /* ---------- show/hide password toggle (delegated, works for every .pass-wrap) ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".pass-toggle");
    if (!btn) return;
    const input = btn.parentElement.querySelector("input");
    if (!input) return;
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    btn.textContent = reveal ? "🙈" : "👁";
    btn.setAttribute("aria-label", reveal ? t("pass_hide") : t("pass_show"));
  });

  /* ---------- save/remove a favourite trip (must be logged in) ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".fav-btn"); if (!b) return;
    if (!getCurrentUser()) { location.hash = "#/login"; return; }
    const added = toggleFav(b.dataset.fav);
    b.classList.toggle("on", added);
    b.setAttribute("aria-pressed", added);
    const txt = b.querySelector(".fav-txt");
    if (txt) txt.textContent = added ? t("fav_saved") : t("fav_save");
  });

  /* ---------- tourist logout ---------- */
  const navLogoutBtn = document.getElementById("navLogout");
  if (navLogoutBtn) navLogoutBtn.addEventListener("click", () => {
    logoutUser(); updateAuthNav();
    document.getElementById("mainNav").classList.remove("open");
    location.hash = "#/home"; render();
  });

  /* ---------- header shadow on scroll + auto-close the mobile menu ---------- */
  window.addEventListener("scroll", () => {
    document.getElementById("siteHeader").classList.toggle("scrolled", window.scrollY > 10);
    document.getElementById("mainNav").classList.remove("open");  // scrolling closes the menu
  }, { passive: true });

  /* ===================================================================
     WELCOME ARUSHA — chatbot (scripted "layered" bot now; Claude Haiku
     auto-switches on once ANTHROPIC_API_KEY is set as a Supabase secret).
     =================================================================== */
  // A node = { m:{en,sw} hook, o:[{g:goto, l:{en,sw}}] }. goto: node id,
  // "wa" (WhatsApp), "page:#/..." (navigate), or "root".
  const WA = { g: "wa", l: { en: "💬 Talk to the Visitor Desk", sw: "💬 Ongea na Dawati la Wageni" } };
  const HOME = { g: "root", l: { en: "↩︎ Back to start", sw: "↩︎ Rudi mwanzo" } };
  const WELCOME_ARUSHA = {
    root: {
      m: { en: "Karibu sana! 🦒 You're at the gateway to the Northern Safari Circuit — a city humming with energy under the peak of Mount Meru. Wildlife, coffee, culture… Arusha has a rhythm you'll love.\n\nWhat vibe are you feeling today?",
           sw: "Karibu sana! 🦒 Uko kwenye lango la Mzunguko wa Safari wa Kaskazini — jiji lenye msisimko chini ya Mlima Meru. Wanyamapori, kahawa, utamaduni… Arusha ina mdundo utakaoupenda.\n\nUnahisi vibe gani leo?" },
      o: [
        { g: "thrill", l: { en: "🏔️ Thrill seeker", sw: "🏔️ Mpenda msisimko" } },
        { g: "culture", l: { en: "🪘 Culture lover", sw: "🪘 Mpenda utamaduni" } },
        { g: "relax", l: { en: "🌿 Relaxation", sw: "🌿 Pumziko" } },
        { g: "logistics", l: { en: "✈️ Getting there & around", sw: "✈️ Kufika na kuzunguka" } },
        { g: "stay", l: { en: "🏨 Where to stay", sw: "🏨 Malazi" } },
        { g: "eat", l: { en: "🍽️ Food & nightlife", sw: "🍽️ Chakula na burudani" } },
        { g: "shop", l: { en: "🛍️ Shopping & Tanzanite", sw: "🛍️ Ununuzi na Tanzanite" } }
      ]
    },
    thrill: {
      m: { en: "Excellent choice! Arusha is base camp for the world-famous Serengeti migration and the Ngorongoro Crater, and for climbers there's the underrated Mount Meru — technically challenging with breathtaking sunrise views.",
           sw: "Chaguo zuri! Arusha ni kambi ya uhamiaji maarufu wa Serengeti na Kreta ya Ngorongoro, na kwa wapandaji kuna Mlima Meru — wenye changamoto lakini machweo/mawio ya kupendeza." },
      o: [
        { g: "ngorongoro", l: { en: "🦁 Ngorongoro Crater — how long?", sw: "🦁 Kreta ya Ngorongoro — muda gani?" } },
        { g: "serengeti", l: { en: "🦓 Serengeti safari — cost?", sw: "🦓 Safari ya Serengeti — bei?" } },
        { g: "meru", l: { en: "⛰️ Is Meru harder than Kili?", sw: "⛰️ Meru ni ngumu kuliko Kili?" } }
      ]
    },
    ngorongoro: {
      m: { en: "The Ngorongoro Crater is a collapsed volcano — a natural amphitheatre packed with the Big Five, including the rare black rhino. It's about a 3-hour drive from Arusha; give it a full day so you're on the crater floor at dawn when the cats are active. A day trip starts around $320 pp (4x4, guide, park fees). Pair it with Lake Manyara or Tarangire for an overnight.",
           sw: "Kreta ya Ngorongoro ni volkano iliyoporomoka — uwanja wa asili uliojaa Big Five, ikiwemo kifaru mweusi adimu. Ni takribani saa 3 kutoka Arusha; itenge siku nzima uwe ndani ya kreta alfajiri wanyama wakiwa hai. Safari ya siku huanzia $320 kwa mtu (4x4, kiongozi, ada). Iunganishe na Ziwa Manyara au Tarangire kwa kulala." },
      o: [
        { g: "page:#/itineraries", l: { en: "🗺️ See ready-made itineraries", sw: "🗺️ Ona ratiba tayari" } },
        { g: "serengeti", l: { en: "🦓 And the Serengeti?", sw: "🦓 Na Serengeti?" } },
        WA, HOME
      ]
    },
    serengeti: {
      m: { en: "The Serengeti is a 5–7 hour drive (or a short flight) from Arusha — endless plains and, in season, 2M+ wildebeest on the move. Most visitors do a 3-day Serengeti + Ngorongoro loop from about $1,150 pp (guide, 4x4, park fees, lodge/camp). The Great Migration river crossings peak roughly July–September in the north.",
           sw: "Serengeti ni saa 5–7 kwa gari (au ndege fupi) kutoka Arusha — tambarare zisizo na mwisho na, kwa msimu, nyumbu 2M+ wakihama. Wengi hufanya mzunguko wa siku 3 Serengeti + Ngorongoro kuanzia $1,150 kwa mtu. Uvukaji wa mito wa Uhamiaji Mkuu hupamba moto Julai–Septemba kaskazini." },
      o: [
        { g: "page:#/trips", l: { en: "🎟️ Browse safari trips", sw: "🎟️ Angalia safari" } },
        { g: "meru", l: { en: "⛰️ I'd rather climb", sw: "⛰️ Napendelea kupanda" } },
        WA, HOME
      ]
    },
    meru: {
      m: { en: "Mount Meru (4,566 m) is Meru's quieter giant — usually 3–4 days via Momella. It's steeper and more technical near the summit than Kilimanjaro's gentler routes, so many climbers use it as the perfect acclimatisation warm-up before Kili. You go with an armed ranger (there's wildlife!) and the sunrise over Kilimanjaro from the summit is unforgettable.",
           sw: "Mlima Meru (m 4,566) ni jitu tulivu — kawaida siku 3–4 kupitia Momella. Ni mwinuko na wenye ufundi zaidi karibu na kilele kuliko njia laini za Kilimanjaro, hivyo wengi huutumia kama maandalizi kabla ya Kili. Unaenda na askari (kuna wanyama!) na mawio juu ya Kilimanjaro ni ya kusahaulika." },
      o: [
        { g: "page:#/explore", l: { en: "🗺️ See it on the map", sw: "🗺️ Ione kwenye ramani" } },
        WA, HOME
      ]
    },
    culture: {
      m: { en: "Arusha's soul is its people — Maasai, Chagga, Meru and more. You can roast your own Chagga coffee, dance at a Maasai boma, and browse East Africa's biggest art centre all in a day.",
           sw: "Roho ya Arusha ni watu wake — Wamaasai, Wachaga, Wameru na wengine. Unaweza kukaanga kahawa yako ya Kichaga, kucheza kwenye boma la Kimaasai, na kutembelea kituo kikubwa cha sanaa Afrika Mashariki kwa siku moja." },
      o: [
        { g: "heritage", l: { en: "🎨 Cultural Heritage Centre", sw: "🎨 Kituo cha Urithi" } },
        { g: "coffee", l: { en: "☕ Coffee & Materuni falls", sw: "☕ Kahawa na Materuni" } },
        { g: "maasai", l: { en: "🪘 Maasai market & boma", sw: "🪘 Soko na boma la Kimaasai" } }
      ]
    },
    heritage: {
      m: { en: "The Cultural Heritage Centre is a landmark spiral gallery on the edge of town — Africa's largest, with Tingatinga paintings, Makonde carvings and a serious Tanzanite gallery. Entry is free; it's a great half-day and an easy taxi ride from the city centre.",
           sw: "Kituo cha Urithi wa Utamaduni ni jumba la mviringo pembezoni mwa jiji — kikubwa zaidi Afrika, chenye michoro ya Tingatinga, vinyago vya Makonde na jumba kubwa la Tanzanite. Kuingia ni bure; ni nusu siku nzuri, teksi rahisi kutoka mjini." },
      o: [ { g: "shop", l: { en: "🛍️ What should I buy?", sw: "🛍️ Ninunue nini?" } }, WA, HOME ]
    },
    coffee: {
      m: { en: "On Kilimanjaro's foothills, Materuni village pairs an 80 m waterfall hike with a hands-on Chagga coffee experience — pick, roast and brew your own cup with a local family (about $200 pp for the day, income straight to the community). Closer to town, Napuru waterfalls make a lovely short escape.",
           sw: "Miteremko ya Kilimanjaro, kijiji cha Materuni huunganisha maporomoko ya m 80 na uzoefu wa kahawa ya Kichaga — chuma, kaanga na tengeneza kikombe chako na familia (takriban $200 kwa mtu, kipato kwa jamii). Karibu na mji, maporomoko ya Napuru ni pumziko fupi zuri." },
      o: [ { g: "page:#/trips", l: { en: "🎟️ Book a coffee tour", sw: "🎟️ Weka ziara ya kahawa" } }, WA, HOME ]
    },
    maasai: {
      m: { en: "The Maasai Market is a burst of colour — beadwork, shukas and carvings. Bargaining is expected and friendly: greet first, offer around half, settle with a smile. For the real thing, a half-day at a Maasai boma (from ~$200) brings dances, warrior stories and homestead life, with income going straight to the community.",
           sw: "Soko la Kimaasai ni mlipuko wa rangi — shanga, shuka na vinyago. Kupunguza bei ni kawaida na kwa furaha: salimia kwanza, toa nusu, malizia kwa tabasamu. Kwa uhalisia, nusu siku kwenye boma la Kimaasai (kuanzia ~$200) huleta ngoma, hadithi za morani na maisha ya boma, kipato kwa jamii." },
      o: [ { g: "shop", l: { en: "💎 Tell me about Tanzanite", sw: "💎 Niambie kuhusu Tanzanite" } }, WA, HOME ]
    },
    relax: {
      m: { en: "Prefer to slow down? Arusha does calm beautifully — coffee-plantation lodges, a crater lake for canoeing, and gardens with Mount Meru views. Perfect between matches.",
           sw: "Unapenda kupumzika? Arusha ina utulivu mzuri — loji za mashamba ya kahawa, ziwa la kreta kwa makasia, na bustani zenye mandhari ya Mlima Meru. Inafaa kati ya mechi." },
      o: [
        { g: "luxstay", l: { en: "🛎️ Luxury lodges", sw: "🛎️ Loji za kifahari" } },
        { g: "duluti", l: { en: "🛶 Lake Duluti & Chemka", sw: "🛶 Ziwa Duluti na Chemka" } },
        { g: "coffee", l: { en: "☕ A gentle coffee day", sw: "☕ Siku ya kahawa" } }
      ]
    },
    duluti: {
      m: { en: "Lake Duluti is a forest-ringed volcanic crater lake minutes from town — a gentle canoe and a birdwatch (130+ species). For a warm-water treat, the turquoise Chemka (Kikuletwa) hot springs under fig trees are a dreamy rest-day swim about 1.5 h away.",
           sw: "Ziwa Duluti ni ziwa la kreta lililozungukwa na msitu dakika chache kutoka mjini — makasia mepesi na kuangalia ndege (aina 130+). Kwa maji ya joto, chemchemi za Chemka (Kikuletwa) za bluu chini ya mikuyu ni kuogelea kwa ndoto saa 1.5 kutoka hapa." },
      o: [ { g: "luxstay", l: { en: "🛎️ Where do I stay?", sw: "🛎️ Nikae wapi?" } }, WA, HOME ]
    },
    luxstay: {
      m: { en: "Top-end Arusha is gorgeous: Arusha Coffee Lodge (plantation chalets), Gran Meliá and Lake Duluti Serena for lakeside calm, and the landmark Mount Meru Hotel for city convenience and big Mount Meru views. Great for honeymooners and post-safari unwinding.",
           sw: "Arusha ya kiwango cha juu ni ya kuvutia: Arusha Coffee Lodge (vibanda shambani), Gran Meliá na Lake Duluti Serena kwa utulivu wa ziwani, na Mount Meru Hotel maarufu kwa urahisi wa mjini na mandhari ya Meru. Nzuri kwa fungate na kupumzika baada ya safari." },
      o: [ { g: "stay", l: { en: "💰 Mid-range & budget too", sw: "💰 Bei ya kati na nafuu" } }, WA, HOME ]
    },
    stay: {
      m: { en: "Arusha has a bed for every budget. Where shall I point you?",
           sw: "Arusha ina malazi kwa kila bajeti. Nikuelekeze wapi?" },
      o: [
        { g: "luxstay", l: { en: "🛎️ Luxury lodges", sw: "🛎️ Loji za kifahari" } },
        { g: "midstay", l: { en: "🏨 Mid-range value", sw: "🏨 Bei ya kati" } },
        { g: "budstay", l: { en: "🎒 Budget & backpacker", sw: "🎒 Nafuu na wasafiri" } }
      ]
    },
    midstay: {
      m: { en: "Mid-range Arusha is excellent value — try Kibo Palace, Planet Lodge or the historic Arusha Hotel: comfortable rooms, pools, reliable Wi-Fi and easy access to the stadium and city. Expect roughly $60–150 a night depending on season.",
           sw: "Bei ya kati Arusha ina thamani nzuri — jaribu Kibo Palace, Planet Lodge au Arusha Hotel ya kihistoria: vyumba vizuri, mabwawa, Wi-Fi, na urahisi wa kufika uwanjani na mjini. Takribani $60–150 kwa usiku kutegemea msimu." },
      o: [ { g: "budstay", l: { en: "🎒 Cheaper options?", sw: "🎒 Chaguo nafuu?" } }, WA, HOME ]
    },
    budstay: {
      m: { en: "Backpackers love Arusha's social hostels and guesthouses — dorms and privates, shared kitchens, safari-buddy vibes and helpful staff who arrange trips. Budget from roughly $12–35 a night. Stick to well-reviewed places and keep valuables in a locker.",
           sw: "Wasafiri wa bajeti wanapenda hosteli na nyumba za wageni za Arusha — vyumba vya pamoja na binafsi, jiko la pamoja, na wafanyakazi wanaosaidia kupanga safari. Bajeti kuanzia takriban $12–35 kwa usiku. Chagua zenye reviews nzuri na hifadhi vitu vyako." },
      o: [ WA, HOME ]
    },
    eat: {
      m: { en: "Hungry? Arusha eats well — smoky nyama choma joints, ugali with the family, wood-fired 'Zanzibar pizza', plus Indian, Italian and Ethiopian tables, and coffee that's grown on the hills you can see.",
           sw: "Una njaa? Arusha inakula vizuri — nyama choma, ugali, 'Zanzibar pizza', pamoja na vyakula vya Kihindi, Kiitaliano na Kiethiopia, na kahawa inayolimwa milimani unayoiona." },
      o: [
        { g: "localeat", l: { en: "🍖 Best local food", sw: "🍖 Chakula bora cha kienyeji" } },
        { g: "fineeat", l: { en: "🍝 International dining", sw: "🍝 Migahawa ya kimataifa" } },
        { g: "night", l: { en: "🌙 Nightlife", sw: "🌙 Burudani ya usiku" } }
      ]
    },
    localeat: {
      m: { en: "For the real taste of Arusha, go where locals go: grilled nyama choma with kachumbari, ugali and fresh mishkaki, and the famous 'Zanzibar pizza' from a street griddle at night. Ask for the halal and vegetarian options — most places have them. Karibu Arusha lists verified food partners on the Services page.",
           sw: "Kwa ladha halisi ya Arusha, nenda wanapoenda wenyeji: nyama choma na kachumbari, ugali na mishkaki, na 'Zanzibar pizza' maarufu usiku. Uliza chaguo la halali na mboga — sehemu nyingi zinazo. Karibu Arusha ina washirika wa chakula waliothibitishwa kwenye Huduma." },
      o: [ { g: "page:#/services", l: { en: "🍽️ See food partners", sw: "🍽️ Ona washirika wa chakula" } }, WA, HOME ]
    },
    fineeat: {
      m: { en: "For a treat, Arusha has excellent Indian and Italian kitchens, cosy Ethiopian injera spots, and lodge restaurants with garden views. Many sit around the Njiro and city-centre areas — a taxi ride from most hotels. Reservations are wise on match nights.",
           sw: "Kwa starehe, Arusha ina migahawa bora ya Kihindi na Kiitaliano, sehemu za injera za Kiethiopia, na migahawa ya loji yenye mandhari. Nyingi ziko maeneo ya Njiro na katikati ya jiji — teksi kutoka hoteli nyingi. Weka booking usiku wa mechi." },
      o: [ { g: "night", l: { en: "🌙 And after dinner?", sw: "🌙 Na baada ya chakula?" } }, WA, HOME ]
    },
    night: {
      m: { en: "Evenings range from quiet rooftop lounges with Mount Meru sunsets to lively bars and clubs around Njiro and the city centre. Go with a group, use a trusted taxi back to your hotel, and keep your phone discreet. On match days the fan-zone atmosphere is electric.",
           sw: "Jioni zinaanzia lounge tulivu za paa zenye machweo ya Meru hadi baa na klabu za msisimko maeneo ya Njiro na mjini. Nenda na kikundi, tumia teksi ya kuaminika kurudi hoteli, na weka simu yako kwa siri. Siku za mechi, hali ya fan-zone ni ya kusisimua." },
      o: [ WA, HOME ]
    },
    logistics: {
      m: { en: "Getting to and around Arusha is easy once you know the basics — two airports, and everything from dala-dalas to private 4x4s.",
           sw: "Kufika na kuzunguka Arusha ni rahisi ukijua misingi — viwanja viwili vya ndege, na kila kitu kutoka dala-dala hadi 4x4 binafsi." },
      o: [
        { g: "airport", l: { en: "✈️ Airports & transfers", sw: "✈️ Viwanja na usafiri" } },
        { g: "around", l: { en: "🚕 Getting around town", sw: "🚕 Kuzunguka mjini" } },
        { g: "safety", l: { en: "🛡️ Safety tips", sw: "🛡️ Ushauri wa usalama" } }
      ]
    },
    airport: {
      m: { en: "Most international visitors land at Kilimanjaro International Airport (JRO/KIA), about 46 km (~1 hour) from Arusha — arrange a transfer in advance (roughly $50 by car). The small Arusha Airport (ARK) in town handles light aircraft and bush flights to the parks. Have your hotel or a licensed operator meet you; agree the fare before you set off.",
           sw: "Wageni wengi wa kimataifa hutua Kilimanjaro International Airport (JRO/KIA), takriban km 46 (~saa 1) kutoka Arusha — panga usafiri mapema (takriban $50 kwa gari). Kiwanja kidogo cha Arusha (ARK) mjini hushughulikia ndege ndogo za hifadhini. Mwambie hoteli au mwendeshaji akulaki; kubaliana nauli kabla ya kuondoka." },
      o: [ { g: "around", l: { en: "🚕 Now, getting around", sw: "🚕 Sasa, kuzunguka" } }, WA, HOME ]
    },
    around: {
      m: { en: "In town: dala-dalas (shared minibuses) are cheapest, bajaji (tuk-tuks) and taxis are handy for short hops, and for parks you'll want a 4x4 with a driver-guide. Agree taxi fares before you ride, or use a licensed transport partner. Karibu Arusha lists verified transport and car-rental partners on the Services page.",
           sw: "Mjini: dala-dala ndizo nafuu, bajaji na teksi ni rahisi kwa umbali mfupi, na kwa hifadhi unahitaji 4x4 na dereva-kiongozi. Kubaliana nauli ya teksi kabla, au tumia mshirika wa usafiri mwenye leseni. Karibu Arusha ina washirika wa usafiri na magari ya kukodi kwenye Huduma." },
      o: [ { g: "page:#/services", l: { en: "🚗 See transport partners", sw: "🚗 Ona washirika wa usafiri" } }, { g: "safety", l: { en: "🛡️ Safety tips", sw: "🛡️ Usalama" } }, HOME ]
    },
    safety: {
      m: { en: "Arusha is welcoming, and a little street-sense goes a long way: use trusted, licensed operators (look for the Karibu Arusha verified badge), agree prices first, and avoid unofficial 'flycatcher' guides who approach you on the street. Keep valuables discreet, use hotel safes, and take a known taxi at night. For anything urgent, the Visitor Desk is on WhatsApp.",
           sw: "Arusha inakaribisha, na busara kidogo inasaidia: tumia waendeshaji wenye leseni (angalia beji ya Karibu Arusha), kubaliana bei kwanza, na epuka 'flycatcher' wanaokukaribia mtaani. Weka vitu vyako kwa siri, tumia sefu za hoteli, na chukua teksi unayoijua usiku. Kwa dharura, Dawati la Wageni liko WhatsApp." },
      o: [ WA, HOME ]
    },
    shop: {
      m: { en: "Take Arusha home with you — vibrant Maasai beadwork, Tingatinga art, Makonde carvings, and the star of the show: Tanzanite, the blue-violet gem found in just one place on Earth, right here near Arusha.",
           sw: "Beba Arusha nyumbani — shanga za Kimaasai, sanaa ya Tingatinga, vinyago vya Makonde, na nyota ya show: Tanzanite, kito cha bluu-zambarau kinachopatikana sehemu moja tu duniani, hapa Arusha." },
      o: [
        { g: "tanzanite", l: { en: "💎 Buying Tanzanite safely", sw: "💎 Kununua Tanzanite salama" } },
        { g: "maasai", l: { en: "🪘 Markets & bargaining", sw: "🪘 Masoko na kupunguza bei" } },
        { g: "malls", l: { en: "🛒 Malls for essentials", sw: "🛒 Maduka ya mahitaji" } }
      ]
    },
    tanzanite: {
      m: { en: "Tanzanite is a thousand times rarer than diamond and mined only at Mererani near Arusha. Buy from certified dealers (the Tanzanite Experience and Cultural Heritage Centre are reputable), always ask for a certificate of authenticity, and be cautious of 'too good to be true' street offers. It's the ultimate Arusha souvenir.",
           sw: "Tanzanite ni adimu mara elfu kuliko almasi na huchimbwa Mererani karibu na Arusha pekee. Nunua kutoka wauzaji walioidhinishwa (Tanzanite Experience na Kituo cha Urithi ni wa kuaminika), daima uliza cheti cha uhalisia, na kuwa makini na bei za mtaani 'nzuri mno'. Ni zawadi bora ya Arusha." },
      o: [ { g: "page:#/explore", l: { en: "🗺️ Find it on the map", sw: "🗺️ Itafute kwenye ramani" } }, WA, HOME ]
    },
    malls: {
      m: { en: "For everyday needs — SIM cards, snacks, pharmacies, ATMs — Arusha has modern shopping at places like the city-centre supermarkets and malls. Handy for stocking up before a safari or grabbing a local SIM for data.",
           sw: "Kwa mahitaji ya kila siku — laini za simu, vitafunio, maduka ya dawa, ATM — Arusha ina maduka ya kisasa mjini. Ni rahisi kujaza mahitaji kabla ya safari au kupata laini ya data." },
      o: [ HOME, WA ]
    }
  };

  function setupChatbot() {
    const fab = document.getElementById("helpFab");
    const panel = document.getElementById("helpPanel");
    const thread = document.getElementById("cbThread");
    const quick = document.getElementById("cbQuick");
    const form = document.getElementById("cbForm");
    const input = document.getElementById("cbText");
    if (!fab || !panel || !thread) return;

    let started = false;
    let aiMode = null;       // null=unknown, true=Claude on, false=scripted
    const history = [];      // for the AI: {role, content}

    const scrollDown = () => { thread.scrollTop = thread.scrollHeight; };
    function bubble(role, html) {
      const d = document.createElement("div");
      d.className = "cb-msg cb-" + role;
      d.innerHTML = html;
      thread.appendChild(d); scrollDown(); return d;
    }
    function typing() {
      const d = document.createElement("div");
      d.className = "cb-msg cb-bot cb-typing";
      d.innerHTML = "<span></span><span></span><span></span>";
      thread.appendChild(d); scrollDown(); return d;
    }
    function renderOptions(opts) {
      quick.innerHTML = "";
      (opts || []).forEach(o => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "cb-chip"; b.textContent = L(o.l);
        b.addEventListener("click", () => handleOption(o));
        quick.appendChild(b);
      });
    }
    function goNode(id) {
      const node = WELCOME_ARUSHA[id] || WELCOME_ARUSHA.root;
      bubble("bot", esc(L(node.m)).replace(/\n/g, "<br>"));
      renderOptions(node.o);
    }
    function handleOption(o) {
      if (o.g === "wa") { window.open(waLink(window.CONFIG.visitorDeskWhatsApp, "help"), "_blank", "noopener"); return; }
      if (o.g && o.g.indexOf("page:") === 0) { const h = o.g.slice(5); location.hash = h; closePanel(); return; }
      bubble("user", esc(L(o.l)));           // echo the choice
      goNode(o.g);
    }

    function scriptedReply(text) {
      // keyword match into the graph, else offer the root menu
      const q = text.toLowerCase();
      const map = [
        ["ngorongoro|crater|kreta", "ngorongoro"], ["serengeti|migration|nyumbu|wildebeest", "serengeti"],
        ["meru|climb|panda|trek|hike|kili", "meru"], ["coffee|kahawa|materuni|napuru|waterfall|maporomoko", "coffee"],
        ["maasai|boma|market|soko|bead|shanga", "maasai"], ["heritage|art|sanaa|tingatinga|carving|vinyago", "heritage"],
        ["tanzanite|gem|kito|jewel", "tanzanite"], ["mall|sim|atm|pharmacy|shop|ununuzi|nunua", "malls"],
        ["hotel|lodge|stay|malazi|sleep|accommodation|kaa", "stay"], ["luxury|kifahari|honeymoon", "luxstay"],
        ["budget|hostel|nafuu|cheap|backpack", "budstay"], ["eat|food|chakula|restaurant|mgahawa|nyama|ugali", "eat"],
        ["night|club|bar|burudani|lounge", "night"], ["airport|jro|kia|ark|flight|ndege|kiwanja", "airport"],
        ["taxi|dala|bajaji|transport|usafiri|car|gari|rental|kukodi|around|zunguka", "around"],
        ["safe|safety|usalama|scam|theft|wizi", "safety"], ["duluti|chemka|hot spring|relax|pumziko", "duluti"],
        ["invest|uwekezaji|business", "shop"], ["thrill|adventure|msisimko", "thrill"],
        ["culture|utamaduni", "culture"], ["book|weka|price|bei|cost|gharama", "serengeti"],
        ["visa|immigration|uhamiaji", null], ["match|afcon|mechi|stadium|uwanja", null], ["weather|hali ya hewa|joto", null]
      ];
      const facts = {
        visa: { en: "Many nationalities get a visa on arrival or e-visa for Tanzania — check the official immigration portal before you fly. The Visitor Desk can point you to the current rules.",
                sw: "Mataifa mengi hupata visa ukifika au e-visa — angalia tovuti rasmi ya uhamiaji kabla ya safari. Dawati la Wageni linaweza kukuelekeza kanuni za sasa." },
        match: { en: "Arusha's AFCON Pamoja 2027 matches are at the Samia Suluhu Hassan Stadium (19 June – 17 July 2027). See the Matches page for fixtures, and plan a safari in the gaps!",
                 sw: "Mechi za AFCON Pamoja 2027 Arusha ni Uwanja wa Samia Suluhu Hassan (19 Juni – 17 Julai 2027). Angalia ukurasa wa Mechi, na panga safari kwenye mapengo!" },
        weather: { en: "Arusha sits at altitude, so it's pleasantly mild year-round (roughly 13–28°C). June–October is dry and cool — perfect for safaris and matches. Bring a layer for chilly mornings.",
                   sw: "Arusha iko juu, hivyo hali ni ya wastani mwaka mzima (takriban 13–28°C). Juni–Oktoba ni kavu na baridi kidogo — inafaa safari na mechi. Beba nguo ya joto kwa asubuhi." }
      };
      for (const [re, node] of map) {
        if (new RegExp(re).test(q)) {
          if (node) { goNode(node); return; }
          const key = /visa|immigration|uhamiaji/.test(q) ? "visa" : /match|afcon|mechi|stadium|uwanja/.test(q) ? "match" : "weather";
          bubble("bot", esc(L(facts[key])).replace(/\n/g, "<br>"));
          renderOptions([{ g: "root", l: { en: "🧭 Explore more", sw: "🧭 Gundua zaidi" } }, WA]);
          return;
        }
      }
      bubble("bot", esc(t("cb_fallback")));
      renderOptions(WELCOME_ARUSHA.root.o.slice(0, 4).concat([WA]));
    }

    function sendToAI(text) {
      const sb = window.CONFIG.supabase;
      history.push({ role: "user", content: text });
      const dots = typing();
      fetch(sb.url + "/functions/v1/welcome-arusha", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang })
      }).then(r => r.json()).then(d => {
        dots.remove();
        if (d && d.configured && d.reply) {
          aiMode = true;
          history.push({ role: "assistant", content: d.reply });
          bubble("bot", esc(d.reply).replace(/\n/g, "<br>"));
          renderOptions([HOME, WA]);
        } else {
          aiMode = false;               // no key yet → scripted from here on
          scriptedReply(text);
        }
      }).catch(() => { dots.remove(); aiMode = false; scriptedReply(text); });
    }

    function onUserText(text) {
      text = (text || "").trim(); if (!text) return;
      bubble("user", esc(text));
      if (aiMode === false) return scriptedReply(text);
      sendToAI(text);                    // try Claude; falls back to scripted if not configured
    }

    function greet() {
      if (started) return; started = true;
      thread.innerHTML = ""; history.length = 0;
      goNode("root");
    }
    function openPanel() {
      panel.hidden = false; fab.setAttribute("aria-expanded", "true"); fab.classList.add("hidden");
      greet(); setTimeout(() => input && input.focus(), 60);
    }
    function closePanel() {
      panel.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.classList.remove("hidden");
    }
    fab.addEventListener("click", openPanel);
    document.getElementById("helpClose").addEventListener("click", closePanel);
    form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; onUserText(v); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) closePanel(); });
    // re-greet in the new language if the user switches language while open
    window.addEventListener("ka-lang", () => { if (!panel.hidden) { started = false; greet(); } });
  }
  setupChatbot();

  /* ---------- boot ---------- */
  window.addEventListener("hashchange", render);
  applyStaticI18n();
  updateAuthNav();
  if (!location.hash) location.hash = "#/home";
  render();
})();
