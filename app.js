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
  const CAT_ICON  = { park: "tree", mountain: "mountain", museum: "building", culture: "users", nature: "water" };
  const CAT_COLOR = { park: "#4d5f28", mountain: "#3a4a1e", museum: "#8a6a44", culture: "#c0552b", nature: "#4a7c59" };

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
    "1535941339077-2dd1c7963098", // lions on the savanna
    "1523805009345-7448845a9e53", // giraffe at golden hour
    "1516426122078-c23e76319801", // elephant herd
    "1547471080-7cc2caa01a7e",    // acacia + wildlife
    "1464822759023-fed622ff2c3b"  // mountain / Kilimanjaro mood
  ].map(id => `https://images.unsplash.com/photo-${id}?w=2560&q=70&auto=format&fit=crop`);

  /* the configured list of hero videos (back-compat with the old single field) */
  function heroVideoList() {
    const c = window.CONFIG || {};
    if (Array.isArray(c.heroVideos)) return c.heroVideos.filter(Boolean);
    return c.heroVideo ? [c.heroVideo] : [];
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

    let idx = 0;
    const show = (i) => {
      if (!vids.length) return;
      idx = (i + vids.length) % vids.length;
      vids.forEach((v, n) => {
        if (n === idx) { v.classList.add("ready"); play(v); }
        else { v.classList.remove("ready"); setTimeout(() => { if (!v.classList.contains("ready")) v.pause(); }, 900); }
      });
    };
    // reveal the first clip as soon as it can play
    const first = vids[0];
    first.addEventListener("canplay", () => first.classList.add("ready"), { once: true });
    show(0);

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
          ${heroVideoList().map((src, i) => `<video class="cine-video" data-vi="${i}" muted loop playsinline preload="${i === 0 ? "auto" : "metadata"}" poster="${CINE_SLIDES[0]}"><source src="${src}" type="${/\.webm(\?|$)/i.test(src) ? "video/webm" : "video/mp4"}"></video>`).join("")}
          <div class="cine-grain"></div>
          <div class="cine-scrim"></div>
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
              ${(window.ATTRACTIONS || []).slice(0, 6).map(a => `<span class="exp-teaser-chip">${svgIcon(CAT_ICON[a.cat] || "pin", 14)} ${esc(L(a.name))}</span>`).join("")}
              <span class="exp-teaser-chip more">+${Math.max(0, (window.ATTRACTIONS || []).length - 6)}…</span>
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
          ${tr.priceFrom ? `<button class="btn btn-gold pay-btn" data-pay="${tr.id}">💳 ${t("pay_deposit")} ($${Math.max(10, Math.round(tr.priceFrom * 0.2))})</button>` : ""}
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
    return `
      <section class="container section">
        <h2 class="page-title">${t("sec_ops_title")}</h2>
        <p class="muted">${t("sec_ops_sub")}</p>
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
  const ATT_CATS = ["all", "park", "mountain", "museum", "culture", "nature"];
  const attCard = (a) => `
    <button class="card att-card" data-att="${a.id}" type="button" aria-label="${esc(L(a.name))} — ${t("exp_show_map")}">
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
          ${t("exp_show_map")}
        </span>
      </span>
    </button>`;
  function viewExplore() {
    const u = getCurrentUser();
    const atts = window.ATTRACTIONS || [];
    if (!u || !u.name) {
      // locked teaser — names only, everything else invites registration
      const teaser = atts.slice(0, 8).map(a => `<span class="exp-teaser-chip">${svgIcon(CAT_ICON[a.cat] || "pin", 14)} ${esc(L(a.name))}</span>`).join("");
      return `
        <section class="detail-hero grad-green">
          <div class="container"><h1>${t("exp_title")}</h1><p class="detail-meta">${t("exp_lead")}</p></div>
        </section>
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
      </div>
      <div class="admin-cat" data-cat="reg">
        <div class="admin-head"><h3>${t("admin_sum_reg")}</h3><div class="admin-actions"><button class="btn btn-small" id="regExport"${regs.length ? "" : " disabled"}>⬇ ${t("admin_export")}</button></div></div>
        ${regTable}
      </div>
      <div class="admin-cat" data-cat="enq" hidden><h3>📨 ${t("admin_sum_enq")}</h3>${msgTable(enq)}</div>
      <div class="admin-cat" data-cat="rev" hidden><h3>⭐ ${t("admin_sum_rev")}</h3>${revTable}</div>
      <div class="admin-cat" data-cat="chal" hidden><h3>⚠️ ${t("admin_sum_chal")}</h3>${msgTable(chal)}</div>`;
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
      })
      .catch(() => {
        sessionStorage.removeItem("ka_admin_pass");
        if (container) container.innerHTML = `<p class="form-error">${t("admin_login_err")}</p>`;
      });
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

  /* ---------- Stripe deposit (TEST MODE): server-side edge function owns the key ---------- */
  function startPayment(tripId, btn, amount) {
    const sb = window.CONFIG && window.CONFIG.supabase;
    if (!sb || !sb.url) return;
    const u = getCurrentUser() || {};
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = "⏳ …";
    fetch(sb.url + "/functions/v1/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId, name: u.name || "", email: u.email || "",
        amount: +amount || undefined
      })
    })
      .then(r => r.json())
      .then(d => {
        if (d && d.url) { addActivity({ type: "payment", message: t("act_pay_started") + " — " + tripId }); location.href = d.url; }
        else throw new Error(d && d.error);
      })
      .catch(() => { btn.disabled = false; btn.textContent = orig; alert(t("pay_err")); });
  }
  function viewPayOk() {
    return `
      <section class="container auth-wrap">
        <div class="auth-card">
          <div class="auth-icon">🎉</div>
          <h1 class="auth-title">${t("pay_ok_title")}</h1>
          <p class="auth-sub">${t("pay_ok_sub")}</p>
          <div class="hero-cta-row" style="justify-content:center">
            <a class="btn btn-primary" href="#/account">${t("reg_go_account")}</a>
            <a class="btn btn-ghost" href="#/trips">${t("reg_explore")}</a>
          </div>
        </div>
      </section>`;
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
  /* ---------- premium payment gateway (Card via Stripe · Mobile Money) ---------- */
  const MIN_PAY = 1;                       // tourists can pay any amount from $1
  const TZS_RATE = 2650;                   // display-only USD→TZS approximation
  const fmtTZS = (usd) => "≈ TZS " + Math.round(usd * TZS_RATE).toLocaleString("en-US");
  const MM_PROVIDERS = [
    { id: "mpesa", name: "M-Pesa", ussd: "*150*00#" },
    { id: "tigo", name: "Mixx by Yas", ussd: "*150*01#" },
    { id: "airtel", name: "Airtel Money", ussd: "*150*60#" },
    { id: "halopesa", name: "HaloPesa", ussd: "*150*88#" },
  ];
  function openPayModal(tripId) {
    const tr = window.TRIPS.find(x => x.id === tripId);
    if (!tr || !tr.priceFrom) return;
    const price = tr.priceFrom;
    const deposit = Math.max(MIN_PAY, Math.round(price * 0.2));
    const half = Math.max(MIN_PAY, Math.round(price / 2));
    let amount = deposit;                   // current chosen amount (USD)
    const lock = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;

    modalBody.innerHTML = `
      <div class="pg">
        <div class="pg-head">
          <span class="pg-lock">${lock} ${t("pay_secure_badge")}</span>
          <h3 id="modalTitle" class="pg-title">${t("pay_deposit")}</h3>
          <p class="pg-trip"><span>${tr.icon}</span> ${esc(L(tr.name))} · <span class="muted">${t("from")} $${price}</span></p>
        </div>

        <div class="pg-hero">
          <span class="pg-hero-label">${t("pay_now")}</span>
          <div class="pg-hero-amt">$<span id="pgAmt">${amount}</span></div>
          <span class="pg-hero-tzs" id="pgTzs">${fmtTZS(amount)}</span>
        </div>

        <div class="amt-chips" role="group" aria-label="${t("pay_amount_label")}">
          <button type="button" class="amt-chip active" data-amt="${deposit}"><b>${t("pay_amt_dep")}</b><small>$${deposit}</small></button>
          <button type="button" class="amt-chip" data-amt="${half}"><b>50%</b><small>$${half}</small></button>
          <button type="button" class="amt-chip" data-amt="${price}"><b>${t("pay_amt_full")}</b><small>$${price}</small></button>
        </div>
        <div class="pg-field">
          <label for="payCustom">${t("pay_amt_custom")}</label>
          <div class="pg-input"><span>$</span><input id="payCustom" type="number" inputmode="numeric" min="${MIN_PAY}" max="${price}" step="1" placeholder="${t("pay_amt_ph")} (${MIN_PAY}–${price})" /></div>
        </div>

        <div class="pg-tabs" role="tablist" aria-label="${t("pay_method")}">
          <button type="button" class="pg-tab active" data-tab="card" role="tab" aria-selected="true">💳 ${t("pay_m_card")}</button>
          <button type="button" class="pg-tab" data-tab="mm" role="tab" aria-selected="false">📱 ${t("pay_m_mobile")}</button>
        </div>

        <div class="pg-pane" data-pane="card">
          <p class="pg-brands"><b>VISA</b><b>Mastercard</b><b> Pay</b><b>G Pay</b></p>
          <p class="pg-help">${t("pay_card_help")}</p>
        </div>
        <div class="pg-pane" data-pane="mm" hidden>
          <p class="pg-help">${t("pay_mm_help")}</p>
          <div class="mm-provs" role="group" aria-label="${t("pay_mm_provider")}">
            ${MM_PROVIDERS.map((p, i) => `<button type="button" class="mm-prov${i === 0 ? " active" : ""}" data-prov="${p.id}">${p.name}</button>`).join("")}
          </div>
          <div class="pg-field">
            <label for="mmPhone">${t("pay_mm_phone")}</label>
            <div class="pg-input"><span>📱</span><input id="mmPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0712 345 678" /></div>
          </div>
        </div>

        <div class="pg-err" id="pgErr" role="alert" hidden></div>
        <button class="btn btn-gold btn-block pg-cta" id="pgCta" data-trip="${tr.id}">${t("pay_pay")} $${amount} →</button>
        <p class="pg-foot">${lock} ${t("pay_secure")}</p>
      </div>`;

    const $ = (s) => modalBody.querySelector(s);
    const amtEl = $("#pgAmt"), tzsEl = $("#pgTzs"), cta = $("#pgCta"), custom = $("#payCustom"), err = $("#pgErr");
    let method = "card", provider = MM_PROVIDERS[0].id;
    const ctaLabel = () => method === "card" ? `${t("pay_pay")} $${amount} →` : `${t("pay_mm_cta")} $${amount} →`;
    const setAmount = (v, fromInput) => {
      amount = v; amtEl.textContent = v; tzsEl.textContent = fmtTZS(v);
      cta.textContent = ctaLabel();
      if (!fromInput) { const c = $(".amt-chip[data-amt='" + v + "']"); }
    };

    $(".amt-chips").addEventListener("click", (e) => {
      const c = e.target.closest(".amt-chip"); if (!c) return;
      $(".amt-chips").querySelectorAll(".amt-chip").forEach(x => x.classList.remove("active"));
      c.classList.add("active"); if (custom) custom.value = "";
      setAmount(+c.dataset.amt);
    });
    custom.addEventListener("input", () => {
      if (custom.value === "") return;
      let v = Math.min(price, Math.max(MIN_PAY, Math.round(+custom.value)));
      if (!Number.isFinite(v)) return;
      $(".amt-chips").querySelectorAll(".amt-chip").forEach(x => x.classList.remove("active"));
      setAmount(v, true);
    });
    $(".pg-tabs").addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".pg-tab"); if (!tabBtn) return;
      method = tabBtn.dataset.tab;
      $(".pg-tabs").querySelectorAll(".pg-tab").forEach(x => { const on = x === tabBtn; x.classList.toggle("active", on); x.setAttribute("aria-selected", on); });
      modalBody.querySelectorAll(".pg-pane").forEach(p => { p.hidden = p.dataset.pane !== method; });
      cta.textContent = ctaLabel();
    });
    $(".mm-provs").addEventListener("click", (e) => {
      const p = e.target.closest(".mm-prov"); if (!p) return;
      $(".mm-provs").querySelectorAll(".mm-prov").forEach(x => x.classList.remove("active"));
      p.classList.add("active"); provider = p.dataset.prov;
    });
    cta.addEventListener("click", () => {
      err.hidden = true;
      if (method === "card") return startPayment(tr.id, cta, amount);
      const phone = ($("#mmPhone").value || "").trim();
      if (phone.replace(/\D/g, "").length < 9) { err.textContent = t("pay_mm_err_phone"); err.hidden = false; return; }
      startMobilePayment(tr, amount, provider, phone, cta);
    });
    setAmount(deposit);
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  /* mobile money: try a real ClickPesa USSD-PUSH; fall back to manual "send to Lipa" */
  function startMobilePayment(tr, amount, provider, phone, btn) {
    const prov = MM_PROVIDERS.find(p => p.id === provider) || MM_PROVIDERS[0];
    const u = getCurrentUser() || {};
    const sb = window.CONFIG && window.CONFIG.supabase;
    btn.disabled = true; btn.textContent = "⏳ …";
    fetch(sb.url + "/functions/v1/mm-push", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: tr.id, amount, phone, name: u.name || "", email: u.email || "" })
    })
      .then(r => r.json())
      .then(d => {
        if (d && d.ok && d.orderReference) {           // real push sent — wait for PIN
          addActivity({ type: "payment", message: `${t("act_mm_request")} $${amount} · ${prov.name}` });
          mmWaitForPin(tr, amount, prov, phone, d.orderReference);
        } else {                                        // not configured → manual instructions
          mmManualDone(tr, amount, prov, phone);
        }
      })
      .catch(() => mmManualDone(tr, amount, prov, phone));  // network issue → manual fallback
  }
  function mmWaitForPin(tr, amount, prov, phone, ref) {
    const pg = modalBody.querySelector(".pg"); if (!pg) return;
    pg.innerHTML = `
      <div class="pg-done">
        <div class="pg-spin" aria-hidden="true"></div>
        <h3>${t("pay_mm_wait_title")}</h3>
        <p class="pg-help">${t("pay_mm_wait_sub").replace("{prov}", `<strong>${prov.name}</strong>`).replace("{amt}", `<strong>$${amount}</strong> (${fmtTZS(amount)})`)}</p>
        <p class="pg-foot">${t("pay_mm_wait_ref")} <code>${esc(ref)}</code></p>
      </div>`;
    const sb = window.CONFIG.supabase;
    let tries = 0; const MAX = 20;                     // ~80s
    const done = (paid) => {
      const pg2 = modalBody.querySelector(".pg"); if (!pg2) return;
      if (paid) {
        addActivity({ type: "payment", message: `${t("act_mm_paid")} $${amount} · ${prov.name}` });
        pg2.innerHTML = `<div class="pg-done"><div class="pg-done-mark">✅</div><h3>${t("pay_mm_success_title")}</h3><p class="pg-help">${t("pay_mm_success_sub")}</p><button class="btn btn-primary btn-block" onclick="document.getElementById('modalClose').click()">${t("pay_mm_done")}</button></div>`;
      } else {
        pg2.innerHTML = `<div class="pg-done"><div class="pg-done-mark">⌛</div><h3>${t("pay_mm_fail_title")}</h3><p class="pg-help">${t("pay_mm_fail_sub")}</p><button class="btn btn-gold btn-block pay-btn" data-pay="${tr.id}">${t("pay_mm_retry")}</button></div>`;
      }
    };
    const poll = () => {
      tries++;
      fetch(sb.url + "/functions/v1/mm-status?ref=" + encodeURIComponent(ref))
        .then(r => r.json())
        .then(d => {
          const s = (d && d.status || "").toUpperCase();
          if (s === "SUCCESS" || s === "SETTLED" || s === "PAID" || s === "COMPLETED") return done(true);
          if (s === "FAILED" || s === "CANCELLED" || s === "REJECTED") return done(false);
          if (tries >= MAX) return done(false);
          setTimeout(poll, 4000);
        })
        .catch(() => { if (tries >= MAX) return done(false); setTimeout(poll, 4000); });
    };
    setTimeout(poll, 4000);
  }
  function mmManualDone(tr, amount, prov, phone) {
    const u = getCurrentUser() || {};
    sbInsert("submissions", {
      type: "mobile_payment", name: u.name || null, email: u.email || null, phone,
      country: u.country || null, rating: null, lang,
      message: `Mobile-money request: $${amount} for "${L(tr.name)}" via ${prov.name} (${phone}).`
    }).then(() => addActivity({ type: "payment", message: `${t("act_mm_request")} $${amount} · ${prov.name}` })).catch(() => {});
    const mm = (window.CONFIG && window.CONFIG.mobileMoney) || {};
    const sendBox = mm.till
      ? `<div class="pg-sendbox"><span class="pg-sendbox-l">${t("pay_mm_sendto")}</span><strong class="pg-sendbox-till">${esc(mm.till)}</strong>${mm.name ? `<span class="muted small">${esc(mm.name)}</span>` : ""}</div>`
      : "";
    const pg = modalBody.querySelector(".pg"); if (!pg) return;
    pg.innerHTML = `
      <div class="pg-done">
        <div class="pg-done-mark">📲</div>
        <h3>${t("pay_mm_ok_title")}</h3>
        <p class="pg-help">${t("pay_mm_ok_sub")}</p>
        ${sendBox}
        <div class="pg-steps">
          <div class="pg-step"><span>1</span> ${t("pay_mm_step1").replace("{prov}", `<strong>${prov.name}</strong>`).replace("{ussd}", `<code>${prov.ussd}</code>`)}</div>
          <div class="pg-step"><span>2</span> ${t("pay_mm_step2").replace("{amt}", `<strong>$${amount}</strong> (${fmtTZS(amount)})`)}</div>
          <div class="pg-step"><span>3</span> ${t("pay_mm_step3")}</div>
        </div>
        <button class="btn btn-primary btn-block" onclick="document.getElementById('modalClose').click()">${t("pay_mm_done")}</button>
      </div>`;
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
      case "about": html = viewAbout(); break;
      case "pay-ok": html = viewPayOk(); break;
      default: html = notFound();
    }
    app.innerHTML = html;
    window.scrollTo(0, 0);
    afterRender(route);
    setActiveNav(route);
    updateAuthNav();
  }

  function afterRender(route) {
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
    if (route === "home") { buildScrollHero(); setupCineVideo(); } else stopScrollHero();
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
  }

  /* ---------- language switch ---------- */
  const sel = document.getElementById("langSelect");
  sel.value = lang;
  sel.addEventListener("change", () => {
    lang = sel.value;
    localStorage.setItem("ka_lang", lang);
    applyStaticI18n();
    render();
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

  /* ---------- pay a trip deposit via Stripe Checkout ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".pay-btn");
    if (b) { openPayModal(b.dataset.pay); return; }        // step 1: pretty summary modal
    const go = e.target.closest(".pay-confirm");
    if (go) startPayment(go.dataset.payGo, go);            // step 2: off to Stripe Checkout
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

  /* ---------- boot ---------- */
  window.addEventListener("hashchange", render);
  applyStaticI18n();
  updateAuthNav();
  if (!location.hash) location.hash = "#/home";
  render();
})();
