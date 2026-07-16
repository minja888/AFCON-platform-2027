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
    // 2) The central Supabase row is now created server-side by the user_register RPC
    //    (with a bcrypt password + welcome email), so no direct REST insert here.
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
  // Shrink a picked photo before upload: partners may choose files up to 20MB, but we
  // store a light ~1600px WebP (a few hundred KB) so galleries load fast. Falls back to
  // the original for GIF/SVG or if compression wouldn't help.
  function compressImage(file, maxDim = 1600, quality = 0.82) {
    return new Promise((resolve) => {
      if (!file || !/^image\//.test(file.type) || /gif|svg/i.test(file.type)) return resolve(file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth, h = img.naturalHeight;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
        try {
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          cv.toBlob((blob) => resolve(blob && blob.size < file.size ? blob : file), "image/webp", quality);
        } catch (e) { resolve(file); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
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
    download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/>',
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
    dove:     '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"/>',
    sparkle:  '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    chat:     '<path d="M4 5h16v10H9l-4 4V5z"/><path d="M8 9h8M8 12h5"/>',
    star:     '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4M8 13h3M8 17h6"/>',
    rainbow:  '<path d="M4 20a8 8 0 0 1 16 0"/><path d="M7 20a5 5 0 0 1 10 0"/><path d="M10 20a2 2 0 0 1 4 0"/>',
    megaphone:'<path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Z"/><path d="M8 15v3a1 1 0 0 0 1 1h1.5"/><path d="M18 9a3.5 3.5 0 0 1 0 6"/>',
    flame:'<path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1 .4-2 1-3-2 1-3 3-3 5a6 6 0 0 0 12 0c0-5-4-8-6-11Z"/>',
    heart:'<path d="M12 21s-6.7-4.3-9.3-8.3C1 10 1.8 6.4 4.8 5.3 7 4.5 9.2 5.6 12 8.3c2.8-2.7 5-3.8 7.2-3 3 1.1 3.8 4.7 2.1 7.4C18.7 16.7 12 21 12 21Z"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    receipt:  '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    alert:    '<path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17h.01"/>'
  };
  function svgIcon(name, size) {
    const s = size || 22;
    return `<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.pin}</svg>`;
  }
  const CAT_ICON  = { park: "tree", mountain: "mountain", museum: "building", culture: "users", nature: "water", conference: "building" };
  const CAT_COLOR = { park: "#4d5f28", mountain: "#3a4a1e", museum: "#8a6a44", culture: "#c0552b", nature: "#4a7c59", conference: "#234f3b" };

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
  // Higher-resolution, less-compressed stills on desktop / retina; lighter on phones.
  const _cineVW = (typeof window !== "undefined")
    ? Math.max(window.innerWidth || 0, (window.screen && window.screen.width) || 0) : 0;
  const _cineWide = _cineVW >= 1024 ||
                    (typeof window !== "undefined" && (window.devicePixelRatio || 1) > 1.5);
  const _cineW = _cineWide ? 3840 : 1600;
  const _cineQ = _cineWide ? 82 : 68;
  const CINE_SLIDES = [
    "1547471080-7cc2caa01a7e",    // acacia + giraffe savanna
    "1523805009345-7448845a9e53", // giraffe at golden hour
    "1464822759023-fed622ff2c3b"  // mountain / Kilimanjaro mood
  ].map(id => `https://images.unsplash.com/photo-${id}?w=${_cineW}&q=${_cineQ}&auto=format&fit=crop`);

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
      // Only a real load error drops a clip. (Previously a 12s readyState timeout
      // removed clips that were merely still buffering — on phones/slow networks the
      // heavy clips got killed before they could play, so the hero showed no video.)
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
        if (n === idx) { if (v.readyState === 0) { try { v.load(); } catch (e) {} } v.classList.add("ready"); play(v); setCaption(+v.dataset.vi); }
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
          ${heroVideoList().map((v, i) => `<video class="cine-video" data-vi="${i}" muted loop playsinline preload="${i === 0 ? "auto" : "none"}" poster="${CINE_SLIDES[0]}"><source src="${v.src}" type="${/\.webm(\?|$)/i.test(v.src) ? "video/webm" : "video/mp4"}"></video>`).join("")}
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
          <span class="hero-flame">${svgIcon("flame", 16)}<span class="hero-flame-tx">${t("hero_flame")}</span></span>
          <span class="hero-kicker">${t("hero_kicker")}</span>
          <p class="hero-lead">${t("hero_lead")}</p>
          <h1 class="hero-arusha">Arusha</h1>
          <p class="hero-script">${t("hero_script")}</p>
          <p class="hero-sub">${t("hero_sub")}</p>
          <div class="hero-cta-row">
            ${primaryCta("btn btn-primary")}
            <a href="#/explore" class="btn btn-ghost btn-on-dark">${t("nav_explore")}</a>
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

      <section class="container section trips-section" id="planSection">
        <div class="section-head trips-head">
          <div>
            <span class="trips-kicker">${t("sec_trips_kicker")}</span>
            <h2>${t("home_plan_title")}</h2>
            <p class="muted">${t("home_plan_sub")}</p>
          </div>
        </div>
        <input type="search" id="homeSearch" class="search-box home-search" placeholder="${t("home_search_ph")}" />
        <div class="home-disc-chips" id="homeDiscChips">
          <button class="chip active" data-disc="all">${t("hd_all")}</button>
          <button class="chip" data-disc="trip">${t("hd_trips")}</button>
          <button class="chip" data-disc="itin">${t("hd_itin")}</button>
          <button class="chip" data-disc="svc">${t("hd_svc")}</button>
        </div>
        <div class="card-grid trips-grid" id="homeDiscover">
          ${(window.TRIPS || []).slice(0, 4).map(tr => `<div class="disc-item" data-kind="trip">${tripCard(tr)}</div>`).join("")}
          ${(window.ITINERARIES || []).slice(0, 2).map(it => `<div class="disc-item" data-kind="itin">${itinCard(it)}</div>`).join("")}
        </div>
        <p class="muted small center" id="homeNoMatch" hidden>${t("exp_no_match")}</p>
        <div class="center mt hero-cta-row" style="justify-content:center">
          <a href="#/trips" class="btn btn-primary">${t("home_see_all")} →</a>
          <a href="#/explore" class="btn btn-ghost">${t("nav_explore")}</a>
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
        <div class="card-grid op-grid" id="homeOps"><p class="muted">${t("admin_loading")}</p></div>
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

      <section class="container section" id="homeEventsSection">
        <div class="section-head">
          <div>
            <span class="trips-kicker">${t("ev_home_kicker")}</span>
            <h2>${t("ev_title")}</h2>
            <p class="muted">${t("ev_home_sub")}</p>
          </div>
          <a href="#/events" class="link-more">${t("nav_events")} →</a>
        </div>
        <div class="ev-list" id="homeEvList"><p class="muted">${t("admin_loading")}</p></div>
      </section>
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
  // Operator directory is now driven by REAL approved partners (public_partners),
  // not seed data — clicking a card opens that partner's verified profile + services.
  function partnerOpCard(p) {
    const initial = (p.company_name || "?").trim().charAt(0).toUpperCase();
    const n = p.service_count || 0;
    return `
      <a class="card op-card op-partner-card" href="#/partner-profile/${esc(p.slug)}">
        <div class="op-partner-top">
          <span class="op-partner-avatar">${p.logo_path
            ? `<img src="${svcPhotoUrl(p.logo_path)}" alt="${esc(p.company_name)}" loading="lazy" onerror="this.parentNode.textContent='${initial}'"/>`
            : initial}</span>
          <span class="verified-pill">${svgIcon("shield", 13)} ${t("verified")}</span>
        </div>
        <h3>${esc(p.company_name)}</h3>
        <span class="op-partner-type">${svgIcon(P_ICON[p.ptype] || "globe", 14)} ${t("pt_" + p.ptype)}</span>
        ${p.about ? `<p class="muted op-partner-about">${esc(p.about)}</p>` : ""}
        <div class="op-partner-foot">
          <span class="op-svc-count">${svgIcon("sparkle", 13)} ${n} ${n === 1 ? t("admin_services_1") : t("admin_services_n")}</span>
          <span class="op-partner-go">${t("pr_view_profile")} →</span>
        </div>
      </a>`;
  }
  /* compact category dropdown (replaces the long chip row) */
  function catSelect(id) {
    return `
      <label class="cat-select">
        <span class="cat-select-ic">${svgIcon("map", 15)}</span>
        <select id="${id}">
          <option value="all">${t("att_all")}</option>
          ${P_TYPES.map(c => `<option value="${c}">${t("pt_" + c)}</option>`).join("")}
        </select>
      </label>`;
  }
  function viewOperators() {
    return `
      <section class="detail-hero grad-green tz-band">
        <div class="container"><h1>${t("sec_ops_title")}</h1><p class="detail-meta">${t("sec_ops_sub")}</p></div>
      </section>
      <section class="container section">
        <div class="filter-bar">
          <input type="search" id="opSearch" class="search-box" placeholder="${t("search_ph")}" />
          ${catSelect("opCat")}
        </div>
        <div class="card-grid op-grid" id="opGrid"><p class="muted">${t("admin_loading")}</p></div>
      </section>`;
  }
  let opCache = null;
  function bindOperators() {
    const grid = document.getElementById("opGrid");
    if (!grid) return;
    const apply = () => {
      const q = (document.getElementById("opSearch")?.value || "").trim().toLowerCase();
      const cat = document.getElementById("opCat")?.value || "all";
      const list = (opCache || []).filter(p =>
        (cat === "all" || p.ptype === cat) &&
        (!q || (p.company_name || "").toLowerCase().includes(q) || (p.about || "").toLowerCase().includes(q) ||
               t("pt_" + p.ptype).toLowerCase().includes(q)));
      grid.innerHTML = list.length ? list.map(partnerOpCard).join("")
        : `<div class="op-empty"><span>${svgIcon("users", 34)}</span><p class="muted">${t("ops_none")}</p>
             <a class="btn btn-primary" href="#/partners">${t("nav_partners")} →</a></div>`;
    };
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_partners?select=*&order=service_count.desc,created_at.desc`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => { opCache = Array.isArray(rows) ? rows : []; apply(); })
      .catch(() => { grid.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
    const search = document.getElementById("opSearch");
    if (search) search.addEventListener("input", apply);
    const catSel = document.getElementById("opCat");
    if (catSel) catSel.addEventListener("change", apply);
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
        <div class="dashboard-hero-bg" style="background: linear-gradient(135deg, #4d5f28 0%, #3a4a1e 50%, #24331a 100%); position: relative; overflow: hidden;">
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
        <input type="search" id="attSearch" class="search-box" placeholder="${t("exp_search_ph")}" />
        <div class="chips" id="attFilters">${chips}</div>
        <div id="attMap" class="att-map" role="application" aria-label="${t("exp_map_label")}"></div>
        <div class="card-grid att-grid" id="attGrid">${atts.map(attCard).join("")}</div>
      </section>
      <section class="container section commit-band">
        <span class="trips-kicker">${t("commit_kicker")}</span>
        <h2 class="commit-title">${t("commit_title")}</h2>
        <p class="muted commit-sub">${t("commit_sub")}</p>
        <div class="commit-grid">
          ${[["shield","commit_1_t","commit_1_d"],["star","commit_2_t","commit_2_d"],["check","commit_3_t","commit_3_d"],["heart","commit_4_t","commit_4_d"]]
            .map(([ic,tk,dk]) => `<div class="commit-card"><span class="commit-ic">${svgIcon(ic, 22)}</span><h3>${t(tk)}</h3><p>${t(dk)}</p></div>`).join("")}
        </div>
        <p class="commit-peace">${svgIcon("heart", 16)} ${t("commit_peace")}</p>
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

    // category filter + text search work together
    const filters = document.getElementById("attFilters");
    const search = document.getElementById("attSearch");
    const applyAttFilter = () => {
      const cat = filters ? (filters.querySelector(".chip.active")?.dataset.attcat || "all") : "all";
      const q = (search?.value || "").trim().toLowerCase();
      const grid = document.getElementById("attGrid");
      const match = (a) => (cat === "all" || a.cat === cat) &&
        (!q || L(a.name).toLowerCase().includes(q) || L(a.desc).toLowerCase().includes(q) || t("att_" + a.cat).toLowerCase().includes(q));
      const list = (window.ATTRACTIONS || []).filter(match);
      if (grid) grid.innerHTML = list.length ? list.map(attCard).join("") : `<p class="muted">${t("exp_no_match")}</p>`;
      Object.keys(attMarkers).forEach(id => {
        const a = window.ATTRACTIONS.find(x => x.id === id);
        if (attMap) { if (a && match(a)) attMarkers[id].addTo(attMap); else attMap.removeLayer(attMarkers[id]); }
      });
    };
    if (filters) filters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-attcat]"); if (!b) return;
      filters.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      b.classList.add("active"); applyAttFilter();
    });
    if (search) search.addEventListener("input", applyAttFilter);
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
        ${(function () {
          const lng = (window.ATTRACTION_LONG || {})[a.id];
          const paras = lng ? (lng[lang] || lng.en) : null;
          return (paras && paras.length)
            ? `<div class="prose place-prose">${paras.map(p => `<p>${esc(p)}</p>`).join("")}</div>`
            : `<p class="detail-summary">${esc(L(a.desc))}</p>`;
        })()}
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
  let PARTNER_EVENTS = null;   // fetched approved partner events (normalised)
  const EV_GRAD = { afcon: "grad-teal", sports: "grad-green", conference: "grad-gold", culture: "grad-red", music: "grad-brown", other: "grad-green" };
  function allEvents() {
    const nat = (window.EVENTS || []).map(e2 => ({
      title: L(e2.name), etype: e2.type, date: e2.date, venue: e2.venue,
      desc: L(e2.desc), link: e2.link, tbc: e2.tbc, by: null, national: e2.national, grad: e2.grad
    }));
    const partner = (PARTNER_EVENTS || []).map(e2 => ({
      title: e2.title, etype: e2.etype, date: e2.date_start, venue: e2.venue,
      desc: e2.description, link: e2.link, tbc: false, by: e2.company_name,
      photo: e2.photo_path, partner_slug: e2.partner_slug
    }));
    return nat.concat(partner).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }
  /* trip-style event card (media header + date badge) for horizontal scrollers */
  function eventCard(e2) {
    const d = new Date(e2.date + "T00:00:00");
    const day = d.getDate(), mon = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en", { month: "short" });
    const yr = d.getFullYear();
    const inner = `
        <div class="ev-card-media ${e2.grad || EV_GRAD[e2.etype] || "grad-green"}">
          ${e2.photo ? `<img class="ev-card-img" src="${svcPhotoUrl(e2.photo)}" alt="${esc(e2.title)}" loading="lazy" decoding="async" onerror="this.remove()" /><span class="ev-card-scrim"></span>` : `<span class="ev-card-icon">${svgIcon(EV_ICON[e2.etype] || "globe", 30)}</span>`}
          <span class="ev-card-date"><b>${day}</b><small>${mon} ${yr}</small></span>
          ${e2.national ? `<span class="ev-card-nat">🇹🇿</span>` : ""}
        </div>
        <div class="ev-card-body">
          <div class="ev-top">
            <span class="ev-type ev-type-${e2.etype}">${t("ev_" + (e2.etype || "other"))}</span>
            ${e2.tbc ? `<span class="ev-tbc">${t("ev_tbc")}</span>` : ""}
            ${e2.by ? `<span class="ev-by">${svgIcon("shield", 12)} ${esc(e2.by)}</span>` : ""}
          </div>
          <h3>${esc(e2.title)}</h3>
          ${e2.venue ? `<p class="ev-meta">${svgIcon("pin", 13)} ${esc(e2.venue)}</p>` : ""}
        </div>`;
    return e2.link
      ? `<a class="card ev-card" href="${esc(e2.link)}">${inner}</a>`
      : `<div class="card ev-card">${inner}</div>`;
  }
  /* Smart agenda row: big date chip + live countdown + details (anchored to today) */
  function evAgendaRow(e2) {
    const d = new Date((e2.date || "") + "T00:00:00");
    const day = d.getDate();
    const mon = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en", { month: "short" });
    const wd = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { weekday: "short" });
    const dd = evDaysAway(e2.date);
    const past = dd < 0;
    const countdown = past ? "" : dd === 0 ? `<span class="ev-ag-count is-today">${t("ev_today")}</span>`
      : dd === 1 ? `<span class="ev-ag-count">${t("ev_tomorrow")}</span>`
      : `<span class="ev-ag-count">${t("ev_in")} ${dd} ${dd === 1 ? t("ev_day") : t("ev_days")}</span>`;
    const inner = `
      <span class="ev-ag-date ${e2.grad || EV_GRAD[e2.etype] || "grad-green"}">
        <b>${day}</b><small>${mon}</small><em>${wd}</em>
      </span>
      <span class="ev-ag-body">
        <span class="ev-ag-top">
          <span class="ev-type ev-type-${e2.etype}">${svgIcon(EV_ICON[e2.etype] || "globe", 12)} ${t("ev_" + (e2.etype || "other"))}</span>
          ${e2.national ? `<span class="ev-ag-nat">🇹🇿</span>` : ""}
          ${e2.tbc ? `<span class="ev-tbc">${t("ev_tbc")}</span>` : ""}
          ${e2.by ? `<span class="ev-by">${svgIcon("shield", 11)} ${esc(e2.by)}</span>` : ""}
          ${countdown}
        </span>
        <strong class="ev-ag-title">${esc(e2.title)}</strong>
        ${e2.venue ? `<span class="ev-ag-meta">${svgIcon("pin", 12)} ${esc(e2.venue)}</span>` : ""}
        ${e2.desc ? `<span class="ev-ag-desc">${esc(e2.desc)}</span>` : ""}
      </span>`;
    return e2.link ? `<a class="ev-ag-row${past ? " is-past" : ""}" href="${esc(e2.link)}">${inner}</a>`
                   : `<div class="ev-ag-row${past ? " is-past" : ""}">${inner}</div>`;
  }
  function eventsHtml(f) {
    const list = allEvents().filter(e2 => f === "all" || e2.etype === f);
    if (!list.length) return `<p class="muted">${t("ev_none")}</p>`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isPast = (e2) => { const d = new Date((e2.date || "") + "T00:00:00"); return !isNaN(d) && d < today; };
    const upcoming = list.filter(e2 => !isPast(e2));
    const past = list.filter(isPast).reverse(); // most-recent past first
    // group upcoming by "Month Year"
    const groups = {};
    upcoming.forEach(e2 => {
      const d = new Date((e2.date || "") + "T00:00:00");
      const key = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { month: "long", year: "numeric" });
      (groups[key] = groups[key] || []).push(e2);
    });
    const upHtml = Object.keys(groups).map(k => `
      <div class="ev-ag-month">
        <div class="ev-ag-month-head"><span class="ev-ag-month-name">${k}</span><span class="ev-ag-month-n">${groups[k].length} ${t("ev_count")}</span></div>
        <div class="ev-ag-rows">${groups[k].map(evAgendaRow).join("")}</div>
      </div>`).join("");
    const pastHtml = past.length ? `
      <details class="ev-ag-past">
        <summary>${t("ev_past")} (${past.length})</summary>
        <div class="ev-ag-rows">${past.map(evAgendaRow).join("")}</div>
      </details>` : "";
    return (upHtml || `<p class="muted">${t("ev_none_upcoming")}</p>`) + pastHtml;
  }
  /* upcoming events from today (for the animated hero) */
  function upcomingEvents(n) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return allEvents()
      .filter(e2 => { const d = new Date((e2.date || "") + "T00:00:00"); return !isNaN(d) && d >= today; })
      .slice(0, n || 6);
  }
  function evDaysAway(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date((dateStr || "") + "T00:00:00");
    return Math.round((d - today) / 86400000);
  }
  function evHeroSlide(e2, i) {
    const d = new Date((e2.date || "") + "T00:00:00");
    const dd = evDaysAway(e2.date);
    const countdown = dd <= 0 ? t("ev_today") : dd === 1 ? t("ev_tomorrow")
      : `${t("ev_in")} <b>${dd}</b> ${dd === 1 ? t("ev_day") : t("ev_days")}`;
    const dateLabel = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return `<div class="evhero-slide${i === 0 ? " is-active" : ""} ${e2.grad || EV_GRAD[e2.etype] || "grad-green"}" data-ehslide="${i}">
      ${e2.photo ? `<img class="evhero-img" src="${svcPhotoUrl(e2.photo)}" alt="" loading="lazy" onerror="this.remove()" />` : ""}
      <span class="evhero-scrim"></span>
      <div class="evhero-tx">
        <span class="evhero-eyebrow">${svgIcon(EV_ICON[e2.etype] || "globe", 14)} ${t("ev_" + (e2.etype || "other"))}${e2.national ? " · 🇹🇿" : ""}</span>
        <h3 class="evhero-title">${esc(e2.title)}</h3>
        <p class="evhero-date">${dateLabel}${e2.venue ? " · " + esc(e2.venue) : ""}</p>
        <span class="evhero-count">${countdown}</span>
      </div>
    </div>`;
  }
  function eventsHeroHtml() {
    const up = upcomingEvents(6);
    if (!up.length) return "";
    return `<div class="evhero" id="evHero">
      <span class="evhero-h">${svgIcon("sparkle", 15)} ${t("ev_hero_h")}</span>
      <div class="evhero-stage">
        <div class="evhero-track" id="evHeroTrack">${up.map(evHeroSlide).join("")}</div>
        <button type="button" class="evhero-nav evhero-prev" id="evHeroPrev" aria-label="prev">‹</button>
        <button type="button" class="evhero-nav evhero-next" id="evHeroNext" aria-label="next">›</button>
      </div>
      <div class="evhero-dots" id="evHeroDots">${up.map((_, i) => `<button type="button" class="evhero-dot${i === 0 ? " is-active" : ""}" data-eh="${i}" aria-label="${i + 1}"></button>`).join("")}</div>
    </div>`;
  }
  function bindEventsHero() {
    const hero = document.getElementById("evHero"); if (!hero) return;
    const track = hero.querySelector("#evHeroTrack");
    const slides = Array.from(hero.querySelectorAll(".evhero-slide"));
    const dots = Array.from(hero.querySelectorAll(".evhero-dot"));
    if (slides.length < 2) return;
    let idx = 0, timer = null;
    const go = (i) => {
      idx = (i + slides.length) % slides.length;
      if (track) track.style.transform = "translateX(-" + (idx * 100) + "%)";
      slides.forEach((s, n) => s.classList.toggle("is-active", n === idx));
      dots.forEach((d, n) => d.classList.toggle("is-active", n === idx));
    };
    const start = () => { if (reduceMotion) return; stop(); timer = setInterval(() => go(idx + 1), 4500); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    hero.addEventListener("click", (e) => {
      if (e.target.closest("#evHeroNext")) { go(idx + 1); start(); }
      else if (e.target.closest("#evHeroPrev")) { go(idx - 1); start(); }
      else { const dot = e.target.closest("[data-eh]"); if (dot) { go(+dot.dataset.eh); start(); } }
    });
    hero.addEventListener("mouseenter", stop); hero.addEventListener("mouseleave", start);
    start();
  }
  /* Daily calendar strip (economic-calendar style) — horizontal day-by-day cards,
     starting from TODAY. Re-reads today each render so the start advances with the date. */
  function dcalCard(e2) {
    const d = new Date((e2.date || "") + "T00:00:00");
    const dd = evDaysAway(e2.date);
    const dayLabel = dd <= 0 ? t("cal_today") : d.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { weekday: "long" });
    const dateShort = d.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { day: "numeric", month: "short" });
    const count = dd <= 0 ? t("ev_today") : dd === 1 ? t("ev_tomorrow") : `${dd} ${t("ev_days")}`;
    const badge = e2.national ? "🇹🇿" : `${svgIcon(EV_ICON[e2.etype] || "globe", 18)}`;
    const inner = `
      <div class="dcal-top">
        <span class="dcal-day">${dayLabel}</span>
        <span class="dcal-time">${dateShort}</span>
      </div>
      <div class="dcal-mid">
        <span class="dcal-badge ${e2.grad || EV_GRAD[e2.etype] || "grad-green"}">${badge}</span>
        <h3 class="dcal-name">${esc(e2.title)}</h3>
      </div>
      <div class="dcal-grid">
        <div><small>${t("cal_when")}</small><b>${dateShort}</b></div>
        <div><small>${t("cal_count")}</small><b>${count}</b></div>
        <div><small>${t("cal_kind")}</small><b>${t("ev_" + (e2.etype || "other"))}</b></div>
      </div>`;
    return e2.link ? `<a class="dcal-card" href="${esc(e2.link)}">${inner}</a>` : `<div class="dcal-card">${inner}</div>`;
  }
  function dailyStripHtml() {
    const up = upcomingEvents(Infinity);   // every upcoming event, today → the very last date
    if (!up.length) return "";
    return `<div class="dcal" id="dcal">
      <div class="dcal-head">
        <h2 class="dcal-title">${svgIcon("calendar", 18)} ${t("cal_daily_h")}</h2>
        <div class="dcal-nav">
          <button type="button" class="dcal-btn" id="dcalPrev" aria-label="${t("cal_scroll_left")}">‹</button>
          <button type="button" class="dcal-btn" id="dcalNext" aria-label="${t("cal_scroll_right")}">›</button>
        </div>
      </div>
      <div class="dcal-scroller" id="dcalScroller">${up.map(dcalCard).join("")}</div>
    </div>`;
  }
  function bindDailyStrip() {
    const sc = document.getElementById("dcalScroller"); if (!sc) return;
    const prev = document.getElementById("dcalPrev"), next = document.getElementById("dcalNext");
    const upd = () => {
      const max = sc.scrollWidth - sc.clientWidth - 1;
      if (prev) prev.disabled = sc.scrollLeft <= 0;
      if (next) next.disabled = sc.scrollLeft >= max;
    };
    const by = () => Math.max(240, sc.clientWidth * 0.8);
    if (prev) prev.addEventListener("click", () => sc.scrollBy({ left: -by(), behavior: "smooth" }));
    if (next) next.addEventListener("click", () => sc.scrollBy({ left: by(), behavior: "smooth" }));
    sc.addEventListener("scroll", upd, { passive: true });
    upd();
  }
  function viewEvents(filter) {
    const f = filter || "all";
    const chips = ["all", "afcon", "sports", "conference", "culture", "music"].map(c =>
      `<button class="chip ${c === f ? "active" : ""}" data-evtype="${c}">${t("ev_" + c)}</button>`).join("");
    return `
      <section class="detail-hero grad-green tz-band">
        <div class="container"><h1>${t("ev_title")}</h1><p class="detail-meta">${t("ev_lead")}</p></div>
      </section>
      <section class="container section">
        <div id="evStripHost">${dailyStripHtml()}</div>
        <div class="ev-cta">
          <span>${t("ev_partner_cta")}</span>
          <a class="btn btn-small btn-gold" href="#/partner">${t("ev_partner_btn")} →</a>
        </div>
        <div class="chips" id="evFilters">${chips}</div>
        <div class="ev-list" id="evList">${eventsHtml(f)}</div>
      </section>`;
  }
  function bindEvents() {
    const f = document.getElementById("evFilters");
    let stripBound = false;
    const rerender = () => {
      const cat = document.querySelector("#evFilters .chip.active")?.dataset.evtype || "all";
      const list = document.getElementById("evList"); if (list) list.innerHTML = eventsHtml(cat);
      const host = document.getElementById("evStripHost");
      if (host && !stripBound) { host.innerHTML = dailyStripHtml(); bindDailyStrip(); stripBound = true; }  // rebuild once with partner events
      setupReveal();
    };
    if (f) f.onclick = (e) => {
      const b = e.target.closest("[data-evtype]"); if (!b) return;
      f.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      b.classList.add("active"); rerender();
    };
    // always refresh so newly-approved partner events show up immediately
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_events?select=*&order=date_start`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => { PARTNER_EVENTS = Array.isArray(rows) ? rows : []; rerender(); })
      .catch(() => { if (PARTNER_EVENTS === null) PARTNER_EVENTS = []; });
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
        <div class="pw-flow" id="pwFlow">
          <div class="pw-flow-track" id="pwFlowTrack">
            ${steps.map((s, i) => `
              <button type="button" class="pw-chip${i === 0 ? " is-active" : ""}" data-pwstep="${i}">
                <span class="pw-chip-n">${svgIcon(PW_STEP_ICON[i], 18)}</span>
                <span class="pw-chip-t">${esc(s.split("—")[0].trim())}</span>
                ${i < steps.length - 1 ? `<span class="pw-chip-arrow">→</span>` : ""}
              </button>`).join("")}
          </div>
          <div class="pw-slides" id="pwSlides">
            ${steps.map((s, i) => `
              <div class="pw-slide${i === 0 ? " is-active" : ""}" data-pwslide="${i}">
                <span class="pw-slide-n">${i + 1}</span>
                <span class="pw-slide-ic">${svgIcon(PW_STEP_ICON[i], 34)}</span>
                <div class="pw-slide-tx"><strong>${esc(s.split("—")[0].trim())}</strong><p>${esc((s.split("—")[1] || "").trim())}</p></div>
              </div>`).join("")}
            <button type="button" class="pw-nav pw-prev" id="pwPrev" aria-label="${t("pw_slide_prev")}">‹</button>
            <button type="button" class="pw-nav pw-next" id="pwNext" aria-label="${t("pw_slide_next")}">›</button>
          </div>
          <div class="pw-dots" id="pwDots">${steps.map((_, i) => `<button type="button" class="pw-dot${i === 0 ? " is-active" : ""}" data-pwdot="${i}" aria-label="${i + 1}"></button>`).join("")}</div>
        </div>
        <div class="center mt hero-cta-row" style="justify-content:center">
          <a class="btn btn-primary btn-lg" href="#/partner-signup">${t("pw_cta")}</a>
          <a class="btn btn-ghost" href="#/partner">${t("pw_login")}</a>
        </div>
      </section>`;
  }
  const PW_STEP_ICON = ["users", "building", "shield", "map", "sparkle"];
  function bindPartners() {
    const flow = document.getElementById("pwFlow"); if (!flow) return;
    const slides = Array.from(flow.querySelectorAll(".pw-slide"));
    const chips = Array.from(flow.querySelectorAll(".pw-chip"));
    const dots = Array.from(flow.querySelectorAll(".pw-dot"));
    let idx = 0, timer = null;
    const go = (i) => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === idx));
      chips.forEach((c, n) => c.classList.toggle("is-active", n === idx));
      dots.forEach((d, n) => d.classList.toggle("is-active", n === idx));
    };
    const start = () => { if (reduceMotion) return; stop(); timer = setInterval(() => go(idx + 1), 4200); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    flow.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-pwstep]"); const dot = e.target.closest("[data-pwdot]");
      if (chip) { go(+chip.dataset.pwstep); start(); }
      else if (dot) { go(+dot.dataset.pwdot); start(); }
      else if (e.target.closest("#pwNext")) { go(idx + 1); start(); }
      else if (e.target.closest("#pwPrev")) { go(idx - 1); start(); }
    });
    flow.addEventListener("mouseenter", stop); flow.addEventListener("mouseleave", start);
    start();
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
    // TIN auto-formats into groups of three digits: 123456789 → 123-456-789
    const tinEl = document.getElementById("pTin");
    if (tinEl) tinEl.addEventListener("input", () => {
      const digits = tinEl.value.replace(/\D/g, "").slice(0, 12);
      tinEl.value = (digits.match(/.{1,3}/g) || []).join("-");
    });
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
        <section class="container auth-wrap auth-split">
          ${authArt("partner")}
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
    const approved = p.status === "approved";
    const tab = (id, icon, label, badge) => `<button type="button" class="pdash-tab" data-ptab="${id}">
        ${svgIcon(icon, 16)}<span>${label}</span>${badge ? `<span class="pdash-tab-badge" id="pdBadge_${id}" hidden></span>` : ""}</button>`;
    const lock = `<div class="pdash-lock">${svgIcon("shield", 26)}<h3>${p.status === "rejected" ? t("pp_rejected_t") : t("pp_pending_t")}</h3><p class="muted">${p.status === "rejected" ? t("pp_rejected_d") : t("pp_pending_d")}</p></div>`;
    return `
      <section class="pdash-hero tz-band">
        <div class="container pdash-hero-in">
          <a class="pdash-avatar" id="pdAvatar" href="#/partner-profile/${esc(p.slug || "")}" title="${t("pd_view_public")}">${(p.company || "?").trim().charAt(0).toUpperCase()}</a>
          <div class="pdash-hero-tx">
            <p class="pdash-hi">${t("pd_welcome")}</p>
            <h1>${esc(p.company)}</h1>
            <p class="detail-meta">${t("pt_" + p.ptype)} · ${stBadge}</p>
          </div>
          <button class="btn btn-ghost btn-on-dark pdash-logout" id="pLogout">${t("admin_logout")}</button>
        </div>
      </section>

      <nav class="pdash-tabs container" id="pdashTabs" role="tablist">
        ${tab("home", "sparkle", t("pd_tab_home"))}
        ${tab("profile", "users", t("pd_tab_profile"))}
        ${tab("listings", "map", t("pd_tab_listings"))}
        ${tab("events", "globe", t("pd_tab_events"))}
        ${tab("enquiries", "chat", t("pd_tab_enquiries"), true)}
      </nav>

      <section class="container section pdash-body">
        <!-- OVERVIEW -->
        <div class="pdash-panel is-active" data-ppanel="home">
          <div class="pdash-setup card">
            <div class="pdash-setup-head">
              <div><h2 class="pdash-h">${t("pd_setup_h")}</h2><p class="muted small">${t("pd_setup_sub")}</p></div>
              <div class="pdash-ring" id="pdRing"><svg viewBox="0 0 44 44"><circle class="ring-bg" cx="22" cy="22" r="19"/><circle class="ring-fg" id="pdRingFg" cx="22" cy="22" r="19"/></svg><span id="pdRingPct">0%</span></div>
            </div>
            <ol class="pdash-steps" id="pdSteps"></ol>
          </div>
          <div class="pdash-stats" id="pdStats"></div>
        </div>

        <!-- PROFILE (always available) -->
        <div class="pdash-panel" data-ppanel="profile">
          <div class="pdash-panel-head"><div><h2 class="pdash-h">${t("pd_profile_h")}</h2><p class="muted small">${t("pd_profile_sub")}</p></div>
            <a class="btn btn-small btn-ghost" id="pdViewPublic" target="_blank" rel="noopener" href="#/partner-profile/${esc(p.slug || "")}">${svgIcon("globe", 14)} ${t("pd_view_public")}</a></div>
          <form id="pfProfile" class="reg-form pform pdash-form" novalidate>
            <div class="pf-logo-row">
              <div class="pf-logo-prev" id="pfLogoPrev">${(p.company || "?").trim().charAt(0).toUpperCase()}</div>
              <div class="field pf-logo-field"><label for="pfLogo">${t("pd_logo")}</label>
                <input id="pfLogo" type="file" accept="image/jpeg,image/png,image/webp" />
                <p class="field-note">${t("pd_logo_note")}</p></div>
            </div>
            <div class="field"><label for="pfAbout">${t("pd_about")}</label>
              <textarea id="pfAbout" rows="5" class="acct-msg" maxlength="1500" placeholder="${t("pd_about_ph")}"></textarea></div>
            <div class="field"><label for="pfExp">${t("pf_experience")}</label>
              <textarea id="pfExp" rows="3" class="acct-msg" maxlength="1500" placeholder="${t("pf_experience_ph")}"></textarea></div>
            <div class="field"><label for="pfActInput">${t("pf_activities")}</label>
              <div class="pf-tags" id="pfActTags"></div>
              <input id="pfActInput" type="text" placeholder="${t("pf_activities_ph")}" autocomplete="off" />
              <p class="field-note">${t("pf_activities_hint")}</p></div>
            <h3 class="pdash-subh">${t("pd_socials_h")}</h3>
            <div class="pf-grid2">
              <div class="field"><label for="pfWebsite">${t("pd_website")}</label><input id="pfWebsite" type="url" inputmode="url" placeholder="https://…" /></div>
              <div class="field"><label for="pfWa">${t("pd_wa")}</label><input id="pfWa" type="tel" inputmode="tel" placeholder="2557XXXXXXXX" /></div>
              <div class="field"><label for="pfIg">${t("pd_ig")}</label><input id="pfIg" type="text" placeholder="@handle or link" /></div>
              <div class="field"><label for="pfFb">${t("pd_fb")}</label><input id="pfFb" type="text" placeholder="Page name or link" /></div>
              <div class="field"><label for="pfTk">${t("pd_tiktok")}</label><input id="pfTk" type="text" placeholder="@handle or link" /></div>
              <div class="field"><label for="pfYt">${t("pd_yt")}</label><input id="pfYt" type="text" placeholder="Channel or link" /></div>
              <div class="field"><label for="pfX">${t("pd_x")}</label><input id="pfX" type="text" placeholder="@handle or link" /></div>
            </div>
            <div id="pfErr" class="form-error" role="alert" hidden></div>
            <div class="form-ok" id="pfOk" hidden>${t("pd_saved")}</div>
            <button type="submit" class="btn btn-primary">${t("pd_save")}</button>
          </form>
        </div>

        <!-- LISTINGS -->
        <div class="pdash-panel" data-ppanel="listings">
          ${!approved ? lock : `
          <div class="pdash-panel-head"><div><h2 class="pdash-h">${t("pp_add_h")}</h2><p class="muted small">${t("pd_listings_intro")}</p></div></div>
          <form id="svcForm" class="reg-form pform pdash-form" novalidate>
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
        </div>

        <!-- EVENTS -->
        <div class="pdash-panel" data-ppanel="events">
          ${!approved ? lock : `
          <div class="pdash-panel-head"><div><h2 class="pdash-h">${t("pe_add_h")}</h2><p class="muted small">${t("pd_events_intro")}</p></div></div>
          <form id="peForm" class="reg-form pform pdash-form" novalidate>
            <div class="field"><label for="peTitle">${t("pe_title")} <span class="req">*</span></label>
              <input id="peTitle" type="text" placeholder="${t("pe_title_ph")}" /></div>
            <div class="field"><label for="peType">${t("ev_type_l")}</label>
              <select id="peType">
                <option value="culture">${t("ev_culture")}</option>
                <option value="sports">${t("ev_sports")}</option>
                <option value="conference">${t("ev_conference")}</option>
                <option value="music">${t("ev_music")}</option>
                <option value="other">${t("pt_other")}</option>
              </select></div>
            <div class="field"><label for="peStart">${t("pe_start")} <span class="req">*</span></label>
              <input id="peStart" type="date" /></div>
            <div class="field"><label for="peEnd">${t("pe_end")}</label>
              <input id="peEnd" type="date" /></div>
            <div class="field"><label for="peVenue">${t("pe_venue")}</label>
              <input id="peVenue" type="text" placeholder="${t("pe_venue_ph")}" /></div>
            <div class="field"><label for="peDesc">${t("pp_s_desc")}</label>
              <textarea id="peDesc" rows="3" class="acct-msg"></textarea></div>
            <div class="field"><label for="pePhoto">${t("pe_photo")}</label>
              <input id="pePhoto" type="file" accept="image/jpeg,image/png,image/webp" />
              <p class="field-note">${t("pe_photo_note")}</p></div>
            <div class="field"><label for="peLink">${t("pe_link")}</label>
              <input id="peLink" type="url" placeholder="https://..." /></div>
            <div id="peErr" class="form-error" role="alert" hidden></div>
            <div class="form-ok" id="peOk" hidden>✓ ${t("pe_ok")}</div>
            <button type="submit" class="btn btn-primary">${t("pe_submit")}</button>
          </form>
          <div id="myEvents"></div>`}
        </div>

        <!-- ENQUIRIES -->
        <div class="pdash-panel" data-ppanel="enquiries">
          ${!approved ? lock : `
          <div class="pdash-panel-head"><div><h2 class="pdash-h">${t("pd_enq_h")}</h2><p class="muted small">${t("pd_enq_sub")}</p></div>
            <button class="btn btn-small btn-gold" id="pdShareProfile">${svgIcon("globe", 14)} ${t("pd_share_profile")}</button></div>
          <div id="pdEnq"><p class="muted">${t("admin_loading")}</p></div>`}
        </div>
      </section>`;
  }

  /* onboarding steps + overview stats (from partner_my_profile) */
  function renderPartnerOverview(prof, p) {
    const done = { register: true, verify: p.status === "approved", profile: !!(prof && prof.about),
      listing: !!(prof && prof.service_count > 0), live: p.status === "approved" && !!(prof && prof.service_count > 0) };
    const order = ["register", "verify", "profile", "listing", "live"];
    const nowIdx = order.findIndex(k => !done[k]);
    const pct = Math.round(order.filter(k => done[k]).length / order.length * 100);
    const stepsEl = document.getElementById("pdSteps");
    if (stepsEl) stepsEl.innerHTML = order.map((k, i) => {
      const st = done[k] ? "done" : (i === nowIdx ? "now" : "todo");
      const tag = st === "done" ? t("pd_step_done") : st === "now" ? t("pd_step_now") : t("pd_step_todo");
      return `<li class="pstep pstep-${st}">
        <span class="pstep-dot">${done[k] ? "✓" : i + 1}</span>
        <div class="pstep-tx"><strong>${t("pd_step_" + k)}</strong><small>${t("pd_step_" + k + "_d")}</small></div>
        <span class="pstep-tag">${tag}</span></li>`;
    }).join("");
    const pctEl = document.getElementById("pdRingPct"); if (pctEl) pctEl.textContent = pct + "%";
    const ring = document.getElementById("pdRingFg");
    if (ring) { const c = 2 * Math.PI * 19; ring.style.strokeDasharray = c; ring.style.strokeDashoffset = c * (1 - pct / 100); }
    const stats = document.getElementById("pdStats");
    if (stats) stats.innerHTML = [
      ["map", prof ? prof.service_count : 0, t("pd_stat_listings"), "listings"],
      ["globe", prof ? prof.event_count : 0, t("pd_stat_events"), "events"],
      ["chat", prof ? prof.enquiry_count : 0, t("pd_stat_enquiries"), "enquiries"]
    ].map(s => `<button class="pdash-stat" data-goto="${s[3]}"><span class="pdash-stat-ic">${svgIcon(s[0], 20)}</span>
        <span class="pdash-stat-n">${s[1]}</span><span class="pdash-stat-l">${s[2]}</span></button>`).join("");
    // enquiries badge on the tab
    const nb = document.getElementById("pdBadge_enquiries");
    if (nb && prof && prof.new_enquiry_count > 0) { nb.textContent = prof.new_enquiry_count; nb.hidden = false; }
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
    const p = getPartner(); if (!p) return;

    // ---- tab switching (hash #/partner#tab or click) ----
    const tabs = document.getElementById("pdashTabs");
    const panels = document.querySelectorAll(".pdash-panel");
    const goTab = (id) => {
      document.querySelectorAll(".pdash-tab").forEach(b => b.classList.toggle("is-active", b.dataset.ptab === id));
      panels.forEach(pl => pl.classList.toggle("is-active", pl.dataset.ppanel === id));
      if (id === "enquiries") loadEnquiries();
      if (id === "listings" && window._svcMap) setTimeout(() => window._svcMap.invalidateSize(), 60);
    };
    if (tabs) tabs.addEventListener("click", (e) => { const b = e.target.closest(".pdash-tab"); if (b) goTab(b.dataset.ptab); });
    document.querySelector('.pdash-tab[data-ptab="home"]')?.classList.add("is-active");
    // overview stat cards jump to their tab
    document.getElementById("pdStats") && document.body.addEventListener("click", function statJump(e) {
      const s = e.target.closest("[data-goto]"); if (s && document.getElementById("pdStats")?.contains(s)) goTab(s.dataset.goto);
    });

    // ---- activities tag input (chips the partner adds) ----
    let pfActivities = [];
    function renderActTags() {
      const host = document.getElementById("pfActTags"); if (!host) return;
      host.innerHTML = pfActivities.map((a, i) =>
        `<span class="pf-tag">${esc(a)}<button type="button" class="pf-tag-x" data-act-rm="${i}" aria-label="remove">×</button></span>`).join("");
      host.querySelectorAll("[data-act-rm]").forEach(b => b.addEventListener("click", () => {
        pfActivities.splice(+b.dataset.actRm, 1); renderActTags();
      }));
    }
    const actInput = document.getElementById("pfActInput");
    if (actInput) actInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const val = actInput.value.trim().replace(/,$/, "");
        if (val && pfActivities.length < 20 && !pfActivities.includes(val)) { pfActivities.push(val); renderActTags(); }
        actInput.value = "";
      }
    });

    // ---- fetch profile → overview + fill form + public link ----
    let prof = null;
    sbRpcNamed("partner_my_profile", { p_email: p.email, p_pass: p.pass }).then(d => {
      prof = d || {};
      renderPartnerOverview(prof, p);
      const setV = (id, val) => { const el2 = document.getElementById(id); if (el2 && val) el2.value = val; };
      setV("pfAbout", prof.about); setV("pfWebsite", prof.website); setV("pfWa", prof.whatsapp);
      setV("pfIg", prof.instagram); setV("pfFb", prof.facebook); setV("pfTk", prof.tiktok);
      setV("pfYt", prof.youtube); setV("pfX", prof.x_handle); setV("pfExp", prof.experience);
      pfActivities = Array.isArray(prof.activities) ? prof.activities.slice() : [];
      renderActTags();
      if (prof.logo_path) { const pv = document.getElementById("pfLogoPrev"); if (pv) pv.innerHTML = `<img src="${svcPhotoUrl(prof.logo_path)}" alt="" onerror="this.remove()"/>`;
        const av2 = document.getElementById("pdAvatar"); if (av2) av2.innerHTML = `<img src="${svcPhotoUrl(prof.logo_path)}" alt="" onerror="this.parentNode.textContent='${(p.company || "?").trim().charAt(0).toUpperCase()}'"/>`; }
      if (prof.slug) {
        const vp = document.getElementById("pdViewPublic"); if (vp) vp.href = "#/partner-profile/" + prof.slug;
        const av = document.getElementById("pdAvatar"); if (av) av.href = "#/partner-profile/" + prof.slug;
        p.slug = prof.slug; setPartner(p);
      }
    }).catch(() => {});

    // ---- profile save (optional logo upload) ----
    const pf = document.getElementById("pfProfile");
    if (pf) pf.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = document.getElementById("pfErr"); err.hidden = true;
      const v = (id) => (document.getElementById(id).value || "").trim();
      const btn = pf.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = t("pd_saving");
      const sb2 = window.CONFIG.supabase;
      try {
        let logoPath = null;
        const lfRaw = (document.getElementById("pfLogo") || { files: [] }).files[0];
        if (lfRaw) {
          if (lfRaw.size > 20 * 1024 * 1024) throw new Error("logo_big");
          const lf = await compressImage(lfRaw, 512);
          const ext = ((lf.type || lfRaw.type).split("/")[1] || "webp").replace(/[^a-z0-9]/g, "") || "webp";
          logoPath = "logo-" + crypto.randomUUID() + "." + ext;
          const up = await fetch(sb2.url + "/storage/v1/object/partner-photos/" + logoPath, {
            method: "POST", headers: { "apikey": sb2.anonKey, "Authorization": "Bearer " + sb2.anonKey, "Content-Type": lf.type || lfRaw.type }, body: lf });
          if (!up.ok) throw new Error("logo");
        }
        await sbRpcNamed("partner_update_profile", {
          p_email: p.email, p_pass: p.pass, p_about: v("pfAbout") || null, p_website: v("pfWebsite") || null,
          p_instagram: v("pfIg") || null, p_facebook: v("pfFb") || null, p_tiktok: v("pfTk") || null,
          p_youtube: v("pfYt") || null, p_whatsapp: v("pfWa") || null, p_x: v("pfX") || null, p_logo: logoPath,
          p_experience: v("pfExp") || null, p_activities: pfActivities
        });
        document.getElementById("pfOk").hidden = false;
        if (logoPath) { const pv = document.getElementById("pfLogoPrev"); if (pv) pv.innerHTML = `<img src="${svcPhotoUrl(logoPath)}" alt=""/>`; }
        // refresh overview (profile now complete)
        sbRpcNamed("partner_my_profile", { p_email: p.email, p_pass: p.pass }).then(d => renderPartnerOverview(d || {}, p)).catch(() => {});
        setTimeout(() => { document.getElementById("pfOk").hidden = true; }, 3000);
      } catch (ex) { err.textContent = t("acct_err"); err.hidden = false; }
      btn.disabled = false; btn.textContent = t("pd_save");
    });

    // ---- enquiries loader + share ----
    function loadEnquiries() {
      const host = document.getElementById("pdEnq"); if (!host) return;
      sbRpcNamed("partner_my_enquiries", { p_email: p.email, p_pass: p.pass }).then(rows => {
        rows = Array.isArray(rows) ? rows : [];
        const badge = document.getElementById("pdBadge_enquiries"); if (badge) badge.hidden = true;
        host.innerHTML = rows.length ? `<div class="pdash-enq-list">${rows.map(q => `
          <div class="pdash-enq${q.status === "new" ? " is-new" : ""}">
            <div class="pdash-enq-top"><strong>${esc(q.tourist_name || t("mo_anon"))}</strong>
              ${q.status === "new" ? `<span class="pdash-enq-new">${t("pd_enq_new")}</span>` : ""}
              <span class="pdash-enq-date">${new Date(q.created_at).toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { day: "numeric", month: "short" })}</span></div>
            <p class="pdash-enq-msg">${esc(q.message)}</p>
            ${q.tourist_contact ? `<p class="pdash-enq-contact">${svgIcon("chat", 13)} <a href="${/@/.test(q.tourist_contact) ? "mailto:" : "https://wa.me/"}${esc(q.tourist_contact.replace(/[^0-9a-zA-Z@._+-]/g, ""))}">${esc(q.tourist_contact)}</a></p>` : ""}
          </div>`).join("")}</div>` : `<div class="mo-empty"><span>💬</span><p class="muted">${t("pd_enq_none")}</p></div>`;
      }).catch(() => { host.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
    }
    const shareBtn = document.getElementById("pdShareProfile");
    if (shareBtn) shareBtn.addEventListener("click", () => {
      const url = location.origin + location.pathname + "#/partner-profile/" + (p.slug || prof?.slug || "");
      if (navigator.share) navigator.share({ title: p.company, url }).catch(() => {});
      else { navigator.clipboard?.writeText(url); shareBtn.textContent = "✓ " + url; }
    });

    if (p.status !== "approved") return;

    // map: tap to drop the service-area pin
    loadLeaflet().then(() => {
      const el2 = document.getElementById("svcMap"); if (!el2) return;
      const m = window.L.map("svcMap", { scrollWheelZoom: false }).setView([-3.37, 36.68], 11);
      window._svcMap = m;
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap" }).addTo(m);
      let mk = null;
      m.on("click", (ev) => {
        document.getElementById("sLat").value = ev.latlng.lat.toFixed(5);
        document.getElementById("sLng").value = ev.latlng.lng.toFixed(5);
        if (mk) mk.setLatLng(ev.latlng); else mk = window.L.marker(ev.latlng).addTo(m);
      });
    }).catch(() => {});

    const list = document.getElementById("mySvcs");
    const svcFormEl = document.getElementById("svcForm");
    const setV2 = (id, val) => { const el2 = document.getElementById(id); if (el2) el2.value = (val == null ? "" : val); };
    let editingSvc = null;   // when set, the form edits this service id instead of adding
    const submitBtn = () => svcFormEl && svcFormEl.querySelector("button[type=submit]");
    function resetSvcForm() {
      editingSvc = null;
      ["sTitle", "sDesc", "sPrice", "sArea", "sWa", "sPhotos", "sLat", "sLng"].forEach(id => setV2(id, ""));
      const b = submitBtn(); if (b) b.textContent = t("pp_s_add");
      ["svcCancel", "svcEditTag"].forEach(id => { const e2 = document.getElementById(id); if (e2) e2.remove(); });
    }
    function enterEdit(s) {
      editingSvc = s.id;
      setV2("sTitle", s.title); setV2("sCat", s.category); setV2("sDesc", s.description);
      setV2("sPrice", s.price_from); setV2("sArea", s.area_name); setV2("sWa", s.whatsapp);
      setV2("sLat", s.lat); setV2("sLng", s.lng);
      const b = submitBtn(); if (b) b.textContent = t("ps_save");
      if (b && !document.getElementById("svcCancel")) {
        const c = document.createElement("button");
        c.type = "button"; c.id = "svcCancel"; c.className = "btn btn-ghost"; c.style.marginLeft = "8px";
        c.textContent = t("ps_cancel"); c.addEventListener("click", resetSvcForm); b.after(c);
      }
      if (svcFormEl && !document.getElementById("svcEditTag")) {
        const tag = document.createElement("p");
        tag.id = "svcEditTag"; tag.className = "field-note psvc-edit-tag";
        tag.textContent = t("ps_edit_title") + " — " + s.title; svcFormEl.prepend(tag);
      }
      if (svcFormEl) svcFormEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const loadMine = () => sbRpcNamed("partner_my_services", { p_email: p.email, p_pass: p.pass })
      .then(rows => {
        window._mySvcRows = Array.isArray(rows) ? rows : [];
        list.innerHTML = (rows && rows.length) ? `<div class="psvc-list">${rows.map(s => {
          const ph = Array.isArray(s.photos) ? s.photos : [];
          const thumb = ph.length ? `<img src="${svcPhotoUrl(ph[0])}" alt="" loading="lazy" onerror="this.remove()"/>` : svgIcon(P_ICON[s.category] || "globe", 22);
          return `<div class="psvc-row">
            <span class="psvc-thumb">${thumb}</span>
            <div class="psvc-info"><strong>${esc(s.title)}</strong>
              <span class="muted small">${t("pt_" + s.category)}${s.price_from ? " · $" + s.price_from : ""}${s.area_name ? " · " + esc(s.area_name) : ""}</span></div>
            <div class="psvc-actions">
              <button class="btn btn-small" data-edit-svc="${s.id}">${svgIcon("map", 13)} ${t("ps_edit")}</button>
              <button class="btn btn-small btn-danger" data-del-svc="${s.id}">${t("ps_delete")}</button>
            </div></div>`;
        }).join("")}</div>`
          : `<p class="muted">${t("pp_none")}</p>`;
        list.querySelectorAll("[data-edit-svc]").forEach(b => b.addEventListener("click", () => {
          const s = (window._mySvcRows || []).find(x => String(x.id) === b.dataset.editSvc); if (s) enterEdit(s);
        }));
        list.querySelectorAll("[data-del-svc]").forEach(b => b.addEventListener("click", () => {
          if (!confirm(t("ps_del_confirm"))) return;
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
      if (files.find(fl => fl.size > 20 * 1024 * 1024)) { err.textContent = t("pp_s_photo_big"); err.hidden = false; return; }
      const btn = f.querySelector("button[type=submit]"); const wasEditing = editingSvc;
      btn.disabled = true; btn.textContent = "\u23F3 " + t("ps_uploading");
      const sb3 = window.CONFIG.supabase;
      Promise.all(files.map(async fl => {
        const blob = await compressImage(fl);
        const ext = ((blob.type || fl.type).split("/")[1] || "webp").replace(/[^a-z0-9]/g, "") || "webp";
        const ph = crypto.randomUUID() + "." + ext;
        const r = await fetch(sb3.url + "/storage/v1/object/partner-photos/" + ph, {
          method: "POST", headers: { "apikey": sb3.anonKey, "Authorization": "Bearer " + sb3.anonKey, "Content-Type": blob.type || fl.type },
          body: blob
        });
        if (!r.ok) throw new Error("photo");
        return ph;
      })).then(paths => {
        const common = {
          p_email: p.email, p_pass: p.pass, p_title: v("sTitle"), p_category: v("sCat"),
          p_description: v("sDesc") || null, p_price: v("sPrice") ? +v("sPrice") : null, p_currency: "USD",
          p_area: v("sArea"), p_lat: v("sLat") ? +v("sLat") : null, p_lng: v("sLng") ? +v("sLng") : null,
          p_whatsapp: v("sWa").replace(/\D/g, "")
        };
        // when editing and no new photos uploaded, pass null \u2192 COALESCE keeps existing photos
        return wasEditing
          ? sbRpcNamed("partner_update_service", Object.assign(common, { p_id: wasEditing, p_photos: paths.length ? paths : null }))
          : sbRpcNamed("partner_add_service", Object.assign(common, { p_photos: paths }));
      }).then(() => {
        const ok = document.getElementById("sOk"); ok.textContent = "\u2713 " + (wasEditing ? t("ps_updated") : t("pp_s_ok")); ok.hidden = false;
        btn.disabled = false; resetSvcForm();
        setTimeout(() => { ok.hidden = true; }, 3000);
        loadMine();
      }).catch(() => { err.textContent = t("acct_err"); err.hidden = false; btn.disabled = false; btn.textContent = wasEditing ? t("ps_save") : t("pp_s_add"); });
    });

    // ---- partner events: submit + list (pending until admin approves) ----
    const evList = document.getElementById("myEvents");
    const loadMyEvents = () => sbRpcNamed("partner_my_events", { p_email: p.email, p_pass: p.pass }).then(rows => {
      if (!evList) return;
      evList.innerHTML = (rows && rows.length) ? `<div class="table-wrap"><table class="reg-table">
        <thead><tr><th>${t("pe_title")}</th><th>${t("pe_start")}</th><th>${t("admin_status")}</th></tr></thead>
        <tbody>${rows.map(e2 => `<tr><td>${esc(e2.title)}</td><td>${esc(e2.date_start)}</td>
          <td><span class="pstat pstat-${e2.status}">${e2.status === "approved" ? "✓" : e2.status === "rejected" ? "✕" : "⏳"} ${t("pp_st_" + e2.status)}</span></td></tr>`).join("")}</tbody></table></div>` : "";
    }).catch(() => {});
    loadMyEvents();
    const ef = document.getElementById("peForm");
    if (ef) ef.addEventListener("submit", (e) => {
      e.preventDefault();
      const er = document.getElementById("peErr"); er.hidden = true;
      const v = (id) => (document.getElementById(id).value || "").trim();
      if (!v("peTitle") || !v("peStart")) { er.textContent = t("pe_err"); er.hidden = false; return; }
      const b = ef.querySelector("button[type=submit]"); b.disabled = true;
      const sbE = window.CONFIG.supabase;
      const pf2 = (document.getElementById("pePhoto") || { files: [] }).files[0];
      const uploadPhoto = (!pf2) ? Promise.resolve(null)
        : (pf2.size > 20 * 1024 * 1024 ? Promise.reject(new Error("big"))
          : (async () => { const blob = await compressImage(pf2);
              const ext = ((blob.type || pf2.type).split("/")[1] || "webp").replace(/[^a-z0-9]/g, "") || "webp";
              const ph = "ev-" + crypto.randomUUID() + "." + ext;
              const r = await fetch(sbE.url + "/storage/v1/object/partner-photos/" + ph, {
                method: "POST", headers: { "apikey": sbE.anonKey, "Authorization": "Bearer " + sbE.anonKey, "Content-Type": blob.type || pf2.type }, body: blob });
              if (!r.ok) throw new Error("photo"); return ph; })());
      uploadPhoto.then(photoPath => sbRpcNamed("partner_event_submit", {
        p_email: p.email, p_pass: p.pass, p_title: v("peTitle"), p_etype: v("peType"),
        p_start: v("peStart"), p_end: v("peEnd") || null, p_venue: v("peVenue") || null,
        p_description: v("peDesc") || null, p_link: v("peLink") || null, p_photo: photoPath
      })).then(() => {
        document.getElementById("peOk").hidden = false; b.disabled = false;
        ["peTitle", "peStart", "peEnd", "peVenue", "peDesc", "peLink", "pePhoto"].forEach(id => { const el2 = document.getElementById(id); if (el2) el2.value = ""; });
        loadMyEvents();
      }).catch(() => { er.textContent = t("acct_err"); er.hidden = false; b.disabled = false; });
    });
  }

  /* ---- tourist-facing partner profile (#/partner-profile/:slug) ---- */
  function partnerSocials(prof) {
    const abs = (v, base) => !v ? null : (/^https?:\/\//.test(v) ? v : base + String(v).replace(/^@/, "").replace(/^\/+/, ""));
    return [
      ["globe", t("pr_visit_site"), prof.website && (/^https?:\/\//.test(prof.website) ? prof.website : "https://" + prof.website)],
      ["chat", "WhatsApp", prof.whatsapp ? "https://wa.me/" + String(prof.whatsapp).replace(/\D/g, "") : null],
      ["camera", "Instagram", abs(prof.instagram, "https://instagram.com/")],
      ["users", "Facebook", abs(prof.facebook, "https://facebook.com/")],
      ["sparkle", "TikTok", abs(prof.tiktok, "https://tiktok.com/@")],
      ["globe", "YouTube", abs(prof.youtube, "https://youtube.com/")],
      ["globe", "X", abs(prof.x_handle, "https://x.com/")]
    ].filter(s => s[2]);
  }
  function viewPartnerProfile(slug) {
    return `
      <section class="container section" id="prWrap" data-slug="${esc(slug || "")}">
        <a class="link-inline pr-back" href="#/operators">← ${t("pr_back")}</a>
        <div id="prBody"><p class="muted">${t("admin_loading")}</p></div>
      </section>`;
  }
  function bindPartnerProfile(slug) {
    const body = document.getElementById("prBody");
    if (!body || !slug) return;
    const sb = window.CONFIG.supabase;
    const h = { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey };
    Promise.all([
      fetch(`${sb.url}/rest/v1/public_partners?slug=eq.${encodeURIComponent(slug)}&select=*`, { headers: h }).then(r => r.json()),
      fetch(`${sb.url}/rest/v1/public_services?partner_slug=eq.${encodeURIComponent(slug)}&select=*&order=created_at.desc`, { headers: h }).then(r => r.json())
    ]).then(([partners, svcs]) => {
      const prof = Array.isArray(partners) && partners[0];
      if (!prof) { body.innerHTML = `<div class="mo-empty"><span>🔍</span><p class="muted">${t("pr_not_found")}</p></div>`; return; }
      const initial = (prof.company_name || "?").trim().charAt(0).toUpperCase();
      const socials = partnerSocials(prof);
      const since = new Date(prof.created_at).getFullYear();
      body.innerHTML = `
        <div class="pr-hero card">
          <span class="pr-avatar">${prof.logo_path ? `<img src="${svcPhotoUrl(prof.logo_path)}" alt="${esc(prof.company_name)}" onerror="this.parentNode.textContent='${initial}'"/>` : initial}</span>
          <div class="pr-hero-tx">
            <span class="pr-verified">${svgIcon("shield", 14)} ${t("pr_verified")}</span>
            <h1>${esc(prof.company_name)}</h1>
            <p class="muted">${t("pt_" + prof.ptype)} · ${t("pr_since")} ${since}</p>
          </div>
        </div>
        ${prof.about ? `<div class="pr-about card"><p>${esc(prof.about).replace(/\n/g, "<br>")}</p></div>` : ""}
        ${prof.experience ? `<div class="pr-exp card"><h2 class="pdash-h">${t("pr_experience_h")}</h2><p>${esc(prof.experience).replace(/\n/g, "<br>")}</p></div>` : ""}
        ${(Array.isArray(prof.activities) && prof.activities.length) ? `<div class="pr-offers"><h2 class="pdash-h">${t("pr_offers_h")}</h2>
          <div class="pr-tags">${prof.activities.map(a => `<span class="pr-tag">${svgIcon("sparkle", 12)} ${esc(a)}</span>`).join("")}</div></div>` : ""}
        ${socials.length ? `<div class="pr-connect"><h2 class="pdash-h">${t("pr_connect_h")}</h2>
          <div class="pr-links">${socials.map(s => `<a class="pr-link" target="_blank" rel="noopener" href="${esc(s[2])}">${svgIcon(s[0], 16)} ${s[1]}</a>`).join("")}</div></div>` : ""}
        <h2 class="pdash-h pr-svc-h">${t("pr_services_h")}</h2>
        <div class="svc-grid">${(Array.isArray(svcs) && svcs.length) ? svcs.map(svcPhotoCard).join("") : `<p class="muted">${t("pr_no_services")}</p>`}</div>
        <div class="pr-enq card">
          <h2 class="pdash-h">${t("pr_enquire_h")}</h2>
          <form id="prEnqForm" class="reg-form pform" novalidate>
            <div class="pf-grid2">
              <div class="field"><label for="prName">${t("pr_enq_name")}</label><input id="prName" type="text" autocomplete="name" /></div>
              <div class="field"><label for="prContact">${t("pr_enq_contact")}</label><input id="prContact" type="text" inputmode="email" /></div>
            </div>
            <div class="field"><label for="prMsg">${t("pr_enq_msg")} <span class="req">*</span></label>
              <textarea id="prMsg" rows="4" class="acct-msg" maxlength="1200" placeholder="${t("pr_enq_msg_ph")}"></textarea></div>
            <div id="prEnqErr" class="form-error" role="alert" hidden></div>
            <button type="submit" class="btn btn-primary">${t("pr_enq_send")}</button>
          </form>
          <div id="prEnqOk" class="reg-success" hidden><div class="reg-success-mark">✓</div><p class="reg-success-msg">${t("pr_enq_ok")}</p></div>
        </div>`;
      const ef = document.getElementById("prEnqForm");
      if (ef) ef.addEventListener("submit", (e) => {
        e.preventDefault();
        const err = document.getElementById("prEnqErr"); err.hidden = true;
        const msg = (document.getElementById("prMsg").value || "").trim();
        if (!msg) { err.textContent = t("pr_enq_empty"); err.hidden = false; return; }
        const btn = ef.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = t("pr_enq_sending");
        sbRpc("enquiry_submit", {
          p_slug: slug, p_name: (document.getElementById("prName").value || "").trim() || null,
          p_contact: (document.getElementById("prContact").value || "").trim() || null, p_message: msg, p_service: null
        }).then(() => { ef.hidden = true; document.getElementById("prEnqOk").hidden = false; })
          .catch(() => { err.textContent = t("pr_enq_err"); err.hidden = false; btn.disabled = false; btn.textContent = t("pr_enq_send"); });
      });
    }).catch(() => { body.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
  }

  /* photo-first partner-service card (like a trip card) - used on Services + Home */
  const svcPhotoUrl = (ph) => window.CONFIG.supabase.url + "/storage/v1/object/public/partner-photos/" + ph;
  function svcPhotoCard(s) {
    const ph = Array.isArray(s.photos) ? s.photos : [];
    const first = ph.length ? svcPhotoUrl(ph[0]) : null;
    /* every uploaded photo is viewable: 2+ photos become a swipe/scroll gallery with dots */
    const media = ph.length > 1
      ? `<div class="svc-gal" onscroll="var i=Math.round(this.scrollLeft/this.clientWidth);this.parentNode.querySelectorAll('.svc-dot').forEach(function(d,j){d.classList.toggle('on',j===i)})">
           ${ph.map((p, i) => `<img src="${svcPhotoUrl(p)}" alt="${esc(s.title)} ${i + 1}" loading="lazy" decoding="async" onerror="this.remove()" />`).join("")}
         </div>
         <span class="svc-dots">${ph.map((_, i) => `<i class="svc-dot${i === 0 ? " on" : ""}"></i>`).join("")}</span>`
      : (first ? `<img class="att-img" src="${first}" alt="${esc(s.title)}" loading="lazy" decoding="async" onerror="this.remove()" />`
               : `<span class="att-media-fallback">${svgIcon(P_ICON[s.category] || "globe", 40)}</span>`);
    return `
      <div class="card svc-card svc-photo-card">
        <div class="att-media grad-green">
          ${media}
          <span class="att-scrim"></span>
          <span class="att-cat-pill">${svgIcon(P_ICON[s.category] || "globe", 14)} ${t("pt_" + (s.category || "other"))}</span>
          ${ph.length > 1 ? `<span class="svc-photo-n">${svgIcon("camera", 13)} ${ph.length}</span>` : ""}
        </div>
        <div class="att-body">
          <span class="att-name">${esc(s.title)}</span>
          <span class="muted small">${s.partner_slug ? `<a class="link-inline" href="#/partner-profile/${esc(s.partner_slug)}">${esc(s.company_name)}</a>` : esc(s.company_name)}${s.website ? ` &middot; <a class="link-inline" target="_blank" rel="noopener" href="${esc(s.website)}">${t("sv_site")}</a>` : ""}</span>
          ${s.description ? `<span class="att-desc">${esc(s.description)}</span>` : ""}
          <div class="svc-meta">
            ${s.area_name ? `<span>${svgIcon("pin", 14)} ${esc(s.area_name)}</span>` : ""}
            ${s.price_from ? `<span class="price">${t("from")} <strong>$${s.price_from}</strong></span>` : ""}
          </div>
          ${s.whatsapp ? `<a class="btn btn-small btn-gold" target="_blank" rel="noopener" href="https://wa.me/${esc(s.whatsapp)}?text=${encodeURIComponent(t("wa_msg") + s.title)}">\uD83D\uDCAC ${t("contact_whatsapp")}</a>` : ""}
        </div>
      </div>`;
  }

  /* home: fold verified partner services INTO the combined discovery grid,
     then wire the universal search + kind chips so everything is findable. */
  function loadHomeServices() {
    const grid = document.getElementById("homeDiscover");
    if (!grid) return;
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_services?select=*&order=created_at.desc`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => {
      if (Array.isArray(rows) && rows.length) {
        const html = rows.map(s => `<div class="disc-item" data-kind="svc">${svcPhotoCard(s)}</div>`).join("");
        grid.insertAdjacentHTML("beforeend", html);
      }
      applyHomeFilter();
    }).catch(() => {});
  }
  // home: featured verified partners (real registered operators)
  function loadHomeOps() {
    const grid = document.getElementById("homeOps");
    if (!grid) return;
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_partners?select=*&order=service_count.desc,created_at.desc&limit=4`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => {
      grid.innerHTML = (Array.isArray(rows) && rows.length)
        ? rows.map(partnerOpCard).join("")
        : `<div class="op-empty"><span>${svgIcon("users", 30)}</span><p class="muted">${t("ops_none")}</p>
             <a class="btn btn-primary" href="#/partners">${t("nav_partners")} →</a></div>`;
    }).catch(() => { grid.innerHTML = `<p class="muted">—</p>`; });
  }
  function applyHomeFilter() {
    const grid = document.getElementById("homeDiscover");
    if (!grid) return;
    const q = (document.getElementById("homeSearch")?.value || "").trim().toLowerCase();
    const kind = document.querySelector("#homeDiscChips .chip.active")?.dataset.disc || "all";
    let shown = 0;
    Array.from(grid.children).forEach(el2 => {
      const okKind = kind === "all" || el2.dataset.kind === kind;
      const okText = !q || el2.textContent.toLowerCase().includes(q);
      const show = okKind && okText;
      el2.style.display = show ? "" : "none";
      if (show) shown++;
    });
    const nm = document.getElementById("homeNoMatch"); if (nm) nm.hidden = shown > 0;
  }
  /* home: upcoming events (national + partner) near the bottom of the page */
  function loadHomeEvents() {
    const host = document.getElementById("homeEvList");
    if (!host) return;
    const render = () => {
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = allEvents().filter(e2 => (e2.date || "") >= today).slice(0, 12);
      const list = upcoming.length ? upcoming : allEvents().slice(0, 12);
      host.className = "ev-scroller";
      host.innerHTML = list.length ? list.map(eventCard).join("") : `<p class="muted">${t("ev_none")}</p>`;
    };
    render();
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_events?select=*&order=date_start`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => { PARTNER_EVENTS = Array.isArray(rows) ? rows : []; render(); }).catch(() => {});
  }
  function bindHomeDiscovery() {
    const s = document.getElementById("homeSearch");
    if (s) s.addEventListener("input", applyHomeFilter);
    const chips = document.getElementById("homeDiscChips");
    if (chips) chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-disc]"); if (!b) return;
      chips.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      b.classList.add("active"); applyHomeFilter();
    });
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

  /* ---- tourist/user password reset (from the emailed 24h link) ---- */
  function viewUserReset(token) {
    return `
      <section class="container auth-wrap">
        <form id="uResetForm" class="auth-card" novalidate>
          <div class="auth-icon">🔑</div>
          <h1 class="auth-title">${t("ur_title")}</h1>
          <p class="auth-sub">${t("ur_sub")}</p>
          <div class="field"><label for="urPass">${t("login_pass")}</label>
            <div class="pass-wrap"><input id="urPass" type="password" autocomplete="new-password" /><button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button></div></div>
          <div id="urErr" class="form-error" role="alert" hidden></div>
          <button type="submit" class="btn btn-primary btn-block" data-token="${esc(token || "")}">${t("ur_btn")}</button>
        </form>
      </section>`;
  }
  function bindUserReset() {
    const f = document.getElementById("uResetForm");
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = f.querySelector("button[type=submit]");
      const err = document.getElementById("urErr"); err.hidden = true;
      btn.disabled = true;
      sbRpc("user_reset_password", { p_token: btn.dataset.token, p_pass: document.getElementById("urPass").value })
        .then(() => { alert(t("ur_ok")); location.hash = "#/login"; })
        .catch(() => { err.textContent = t("pr_err"); err.hidden = false; btn.disabled = false; });
    });
  }

  /* ---- public services marketplace (approved partners only) ---- */
  function viewServices() {
    return `
      <section class="detail-hero grad-gold tz-band">
        <div class="container"><h1>${t("sv_title")}</h1><p class="detail-meta">${t("sv_lead")}</p></div>
      </section>
      <section class="container section">
        <div class="filter-bar">
          <input type="search" id="svcSearch" class="search-box" placeholder="${t("sv_search_ph")}" />
          ${catSelect("svcCat")}
        </div>
        <div class="card-grid" id="svcGrid"><p class="muted">${t("admin_loading")}</p></div>
        <p class="muted small center mt">${t("sv_note")}</p>
      </section>`;
  }
  let svcCache = null;
  function bindServices() {
    const grid = document.getElementById("svcGrid");
    if (!grid) return;
    const card = svcPhotoCard;
    const search = document.getElementById("svcSearch");
    const apply = () => {
      const cat = document.getElementById("svcCat")?.value || "all";
      const q = (search?.value || "").trim().toLowerCase();
      const rows = (svcCache || []).filter(s => (cat === "all" || s.category === cat) &&
        (!q || (s.title || "").toLowerCase().includes(q) || (s.company_name || "").toLowerCase().includes(q) ||
               (s.area_name || "").toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q) ||
               t("pt_" + (s.category || "other")).toLowerCase().includes(q)));
      grid.innerHTML = rows.length ? rows.map(card).join("") : `<p class="muted">${t("sv_none")}</p>`;
    };
    const sb = window.CONFIG.supabase;
    fetch(`${sb.url}/rest/v1/public_services?select=*&order=created_at.desc`, {
      headers: { "apikey": sb.anonKey, "Authorization": "Bearer " + sb.anonKey }
    }).then(r => r.json()).then(rows => { svcCache = Array.isArray(rows) ? rows : []; apply(); })
      .catch(() => { grid.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
    const catSel = document.getElementById("svcCat");
    if (catSel) catSel.addEventListener("change", apply);
    if (search) search.addEventListener("input", apply);
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
    const value = (ic, tt, dd) => `<div class="card val-card"><span class="inv-icon">${svgIcon(ic, 24)}</span><h3>${t(tt)}</h3><p class="muted">${t(dd)}</p></div>`;
    return `
      <section class="detail-hero grad-gold tz-band">
        <div class="container">
          <h1>${t("about_title")}</h1>
          <p class="detail-meta">${t("about_lead")}</p>
        </div>
      </section>

      <section class="container section">
        <span class="trips-kicker">${t("about_story_k")}</span>
        <h2 class="page-title" style="text-transform:none">${t("about_story_t")}</h2>
        <div class="prose">
          <p>${t("about_story_1")}</p>
          <p>${t("about_story_2")}</p>
          <p>${t("about_story_3")}</p>
          <p>${t("about_story_4")}</p>
          <p>${t("about_story_5")}</p>
        </div>
      </section>

      <section class="container section">
        <div class="vision-band">
          <div class="vision-card">
            <span class="vision-badge">${svgIcon("globe", 18)} ${t("about_vision_k")}</span>
            <h2>${t("about_vision_t")}</h2>
            <p>${t("about_vision_d")}</p>
          </div>
          <div class="mission-card">
            <span class="vision-badge">${svgIcon("map", 18)} ${t("about_mission_k")}</span>
            <h2>${t("about_mission_t")}</h2>
            <p>${t("about_mission_d")}</p>
          </div>
        </div>
      </section>

      <section class="container section">
        <h2 class="page-title" style="text-transform:none">${t("about_values_t")}</h2>
        <p class="muted">${t("about_values_sub")}</p>
        <div class="val-grid">
          ${value("shield", "val1_t", "val1_d")}
          ${value("users", "val2_t", "val2_d")}
          ${value("sprout", "val3_t", "val3_d")}
          ${value("water", "val4_t", "val4_d")}
          ${value("gem", "val5_t", "val5_d")}
          ${value("globe", "val6_t", "val6_d")}
        </div>
      </section>

      <section class="container section">
        <div class="center hero-cta-row" style="justify-content:center">
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

    /* One unified list — every country is equally welcome (no EAC / non-EAC split). */
    const zone = "all";
    const zoneCountries = () => window.COUNTRIES;
    function rebuildDial() {
      dial.innerHTML = zoneCountries().map(c =>
        `<option value="+${c.d}" data-c="${c.c}"${c.c === "TZ" ? " selected" : ""}>${flag(c.c)} +${c.d}</option>`).join("");
      const opt = dial.selectedOptions[0];
      if (opt) setDialFlag(opt.getAttribute("data-c"));
    }

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
    form.addEventListener("submit", async (e) => {
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
      // Create the central server account (bcrypt password + welcome email) when an email is given.
      // Falls back to local-only for phone-only sign-ups or if the backend is unreachable.
      if (email) {
        try {
          await sbRpcNamed("user_register", {
            p_name: name, p_country: countryName, p_country_code: countryCode,
            p_dial: phone ? dial.value : null, p_phone: phone || null,
            p_email: email, p_interest: interest, p_lang: lang, p_zone: zone, p_pass: pass
          });
        } catch (ex) {
          if (/email_exists/.test(String(ex))) {
            err.innerHTML = `<div>• ${esc(t("reg_err_exists"))}</div>`; err.hidden = false; return;
          }
          // other backend errors: keep going with the local copy so the user isn't blocked
        }
      }
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
    }).then(r => { if (!r.ok) throw new Error("rpc " + r.status);
      if (r.status === 204) return null;
      return r.text().then(txt => txt ? JSON.parse(txt) : null); });
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

    // big, clickable admin cards — each jumps to its category panel
    const ADMIN_META = [
      { tab: "reg", icon: "receipt", label: t("admin_sum_reg"), count: regs.length },
      { tab: "enq", icon: "chat", label: t("admin_sum_enq"), count: enq.length },
      { tab: "rev", icon: "star", label: t("admin_sum_rev"), count: avg ? `${rev.length} · ${avg}★` : rev.length },
      { tab: "chal", icon: "alert", label: t("admin_sum_chal"), count: chal.length },
      { tab: "partners", icon: "shield", label: t("admin_sum_partners"), badge: "badgePartners" },
      { tab: "evs", icon: "calendar", label: t("admin_sum_evs"), badge: "badgeEvs" }
    ];
    const catHead = (m) => `<h3 class="admin-cat-h">${svgIcon(m.icon, 20)} ${m.label}</h3>`;
    const M = Object.fromEntries(ADMIN_META.map(m => [m.tab, m]));

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
      <div class="admin-cards" id="adminTabs">
        ${ADMIN_META.map((m, i) => `
          <button class="admin-card admin-tab${i === 0 ? " active" : ""}" data-tab="${m.tab}">
            <span class="ac-icon">${svgIcon(m.icon, 26)}</span>
            <strong class="ac-count">${m.count != null ? m.count : ""}${m.badge ? `<span class="admin-badge" id="${m.badge}" hidden></span>` : ""}</strong>
            <span class="ac-label">${m.label}</span>
          </button>`).join("")}
      </div>
      <div class="admin-cat" data-cat="reg">
        <div class="admin-head">${catHead(M.reg)}<div class="admin-actions"><button class="btn btn-small" id="regExport"${regs.length ? "" : " disabled"}>${svgIcon("map", 13)} ${t("admin_export")}</button></div></div>
        ${regTable}
      </div>
      <div class="admin-cat" data-cat="enq" hidden>${catHead(M.enq)}${msgTable(enq)}</div>
      <div class="admin-cat" data-cat="rev" hidden>${catHead(M.rev)}${revTable}</div>
      <div class="admin-cat" data-cat="chal" hidden>${catHead(M.chal)}${msgTable(chal)}</div>
      <div class="admin-cat" data-cat="partners" hidden>${catHead(M.partners)}<div id="adminPartners"><p class="muted">${t("admin_loading")}</p></div></div>
      <div class="admin-cat" data-cat="evs" hidden>${catHead(M.evs)}<div id="adminEvs"><p class="muted">${t("admin_loading")}</p></div></div>`;
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
        <section class="container auth-wrap auth-split">
          ${authArt("admin")}
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
        loadAdminEvents(pass);
      })
      .catch(() => {
        sessionStorage.removeItem("ka_admin_pass");
        if (container) container.innerHTML = `<p class="form-error">${t("admin_login_err")}</p>`;
      });
  }

  function setAdminBadge(id, n) {
    const el = document.getElementById(id);
    if (!el) return;
    if (n > 0) { el.textContent = n; el.hidden = false; } else { el.hidden = true; }
  }

  /* admin: partner-event queue (approve / reject) */
  function loadAdminEvents(pass) {
    const host = document.getElementById("adminEvs");
    if (!host) return;
    sbRpc("admin_events", { p_pass: pass }).then(rows => {
      rows = Array.isArray(rows) ? rows : [];
      setAdminBadge("badgeEvs", rows.filter(x => x.status === "pending").length);
      if (!rows.length) { host.innerHTML = `<p class="muted admin-empty">${t("admin_none")}</p>`; return; }
      const stPill = (st) => `<span class="pstat pstat-${st}">${st === "approved" ? "✓" : st === "rejected" ? "✕" : "⏳"} ${t("pp_st_" + st)}</span>`;
      host.innerHTML = `<div class="table-wrap"><table class="reg-table">
        <thead><tr><th>${t("pe_title")}</th><th>${t("ev_type_l")}</th><th>${t("pe_start")}</th><th>${t("pe_venue")}</th><th>${t("ps_company")}</th><th>${t("admin_status")}</th><th></th></tr></thead>
        <tbody>${rows.map(e2 => `<tr>
          <td><strong>${esc(e2.title)}</strong></td>
          <td>${t("ev_" + (e2.etype || "other"))}</td>
          <td>${esc(e2.date_start)}${e2.date_end ? " – " + esc(e2.date_end) : ""}</td>
          <td>${esc(e2.venue || "—")}</td>
          <td>${esc(e2.company || "—")}</td>
          <td>${stPill(e2.status)}</td>
          <td class="admin-actions-cell">
            ${e2.status !== "approved" ? `<button class="btn btn-small btn-gold" data-estat="approved" data-eid="${e2.id}">✓ ${t("admin_approve")}</button>` : ""}
            ${e2.status !== "rejected" ? `<button class="btn btn-small" data-estat="rejected" data-eid="${e2.id}">✕ ${t("admin_reject")}</button>` : ""}
          </td></tr>`).join("")}</tbody></table></div>`;
      host.querySelectorAll("[data-estat]").forEach(b => b.addEventListener("click", () => {
        b.disabled = true;
        sbRpc("admin_event_status", { p_pass: pass, p_id: +b.dataset.eid, p_status: b.dataset.estat })
          .then(() => loadAdminEvents(pass)).catch(() => { b.disabled = false; alert(t("acct_err")); });
      }));
    }).catch(() => { host.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
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
      setAdminBadge("badgePartners", rows.filter(x => x.status === "pending").length);
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
              ${p.doc_path ? `<span class="doc-pair"><button class="btn btn-small" data-doc="${esc(p.doc_path)}">${svgIcon("receipt", 13)} ${t("admin_view_doc")}</button><button class="doc-dl" data-doc="${esc(p.doc_path)}" data-dl="1" title="${t("admin_download")}" aria-label="${t("admin_download")}">${svgIcon("download", 15)}</button></span>` : "—"}
              ${p.tin_doc_path ? `<span class="doc-pair"><button class="btn btn-small" data-doc="${esc(p.tin_doc_path)}">${svgIcon("receipt", 13)} TIN</button><button class="doc-dl" data-doc="${esc(p.tin_doc_path)}" data-dl="1" title="${t("admin_download")}" aria-label="${t("admin_download")}">${svgIcon("download", 15)}</button></span>` : ""}</td>
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
        const isDl = b.dataset.dl === "1";
        // Open the tab synchronously (inside the user gesture) so the pop-up blocker
        // doesn't kill it — we redirect it once the signed URL arrives.
        const win = window.open("", "_blank");
        fetch(window.CONFIG.supabase.url + "/functions/v1/partner-doc", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pass, path: b.dataset.doc, download: isDl })
        }).then(r => r.json()).then(d2 => {
          b.disabled = false;
          if (d2 && d2.url) {
            if (win) { win.location = d2.url; }
            else { const a = document.createElement("a"); a.href = d2.url; a.target = "_blank"; a.rel = "noopener"; a.click(); }
          } else {
            if (win) win.close();
            alert((d2 && d2.error === "not-found") ? t("admin_doc_missing") : t("acct_err"));
          }
        }).catch(() => { b.disabled = false; if (win) win.close(); alert(t("acct_err")); });
      }));
      const exp = document.getElementById("partExport");
      if (exp) exp.addEventListener("click", () => exportPartnersCSV(rows));
    }).catch(() => { host.innerHTML = `<p class="form-error">${t("acct_err")}</p>`; });
  }

  /* ===================================================================
     VIEW: TOURIST LOGIN (sign in with the account made at registration)
     =================================================================== */
  /* Split-screen auth art panel — "Visit Arusha" branding + animated Arusha photos
     (replaces the cartoon concept with real, floating destination imagery). */
  const AUTH_ART_IMGS = [
    "1547471080-7cc2caa01a7e",   // acacia savanna + giraffe
    "1516426122078-c23e76319801",// elephants
    "1523805009345-7448845a9e53",// giraffe golden hour
    "1464822759023-fed622ff2c3b" // Kilimanjaro / Meru mood
  ].map(id => `https://images.unsplash.com/photo-${id}?w=1200&q=76&auto=format&fit=crop`);
  function authArt(kind) {
    const tag = t("auth_art_" + (kind || "tourist"));
    return `
      <div class="auth-art" aria-hidden="true">
        <div class="auth-art-photos">
          ${AUTH_ART_IMGS.map((u, i) => `<span class="aa-tile aa-tile-${i}" style="background-image:url('${u}')"></span>`).join("")}
          <span class="aa-orb aa-orb-1"></span><span class="aa-orb aa-orb-2"></span>
        </div>
        <div class="auth-art-scrim"></div>
        <div class="auth-art-tx">
          <span class="auth-brand"><span class="auth-brand-mark">${svgIcon("mountain", 20)}</span> ${t("auth_brand")}</span>
          <h2 class="auth-art-title">${t("auth_art_h")}</h2>
          <p class="auth-art-sub">${tag}</p>
          <div class="auth-art-foot">${svgIcon("shield", 14)} <span>${t("auth_art_trust")}</span></div>
        </div>
      </div>`;
  }
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
      <section class="container auth-wrap auth-split">
        ${authArt("tourist")}
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
          <p class="muted small auth-alt"><button type="button" class="link-inline linklike" id="uForgot">${t("login_forgot")}</button></p>
          <p class="muted small auth-alt">${t("login_no_acct")} <a href="#/register" class="link-inline">${t("login_register")}</a></p>
        </form>
      </section>`;
  }
  function bindLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    // "Forgot password?" — email a reset link to the registered address (server-side).
    const fg = document.getElementById("uForgot");
    if (fg) fg.addEventListener("click", () => {
      const em = (document.getElementById("loginId").value || "").trim() || prompt(t("login_forgot_ph"));
      if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { alert(t("login_forgot_ph")); return; }
      sbRpc("user_request_reset", { p_email: em }).finally(() => alert(t("login_forgot_sent")));
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("loginId").value.trim();
      const pass = document.getElementById("loginPass").value;
      const err = document.getElementById("loginErr"); err.hidden = true;
      const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
      // 1) try the central server account (works across devices)
      try {
        const d = await sbRpcNamed("user_login", { p_id: id, p_pass: pass });
        if (d && d.ok) {
          setCurrentUser({ name: d.name, email: d.email, phone: d.phone, country: d.country, ts: new Date().toISOString() });
          updateAuthNav(); location.hash = "#/home"; render(); return;
        }
      } catch (_ex) { /* fall through to local check */ }
      // 2) fall back to a local account created on this device
      const rec = findRegByLogin(id);
      if (rec && rec.pass && rec.pass === hashPass(pass)) {
        setCurrentUser({ name: rec.name, email: rec.email, phone: rec.phone, country: rec.country, ts: rec.ts });
        updateAuthNav(); location.hash = "#/home"; render(); return;
      }
      err.textContent = t("login_err"); err.hidden = false; btn.disabled = false;
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
    // route enquiries to the official Visitor Desk + the verified-partner directory
    modalBody.innerHTML = `
      <h3 id="modalTitle">${t("book_title")}</h3>
      <p class="muted">${t("book_intro")}</p>
      <p class="book-trip">🎟️ <strong>${esc(L(tr.name))}</strong> · ${t("from")} $${tr.priceFrom}</p>
      <p class="book-choose">${t("book_choose")}</p>
      <div class="book-list">
        <a class="book-op" target="_blank" rel="noopener" href="${waLink(window.CONFIG.visitorDeskWhatsApp, L(tr.name))}">
          <span class="op-icon">${svgIcon("chat", 22)}</span>
          <span class="book-op-text"><strong>${t("book_visitor_desk")}</strong><small>${t("book_visitor_sub")}</small></span>
          <span class="book-op-go">→</span>
        </a>
        <a class="book-op" href="#/operators">
          <span class="op-icon">${svgIcon("shield", 22)}</span>
          <span class="book-op-text"><strong>${t("book_browse_ops")}</strong><small>${t("sec_ops_sub")}</small></span>
          <span class="book-op-go">→</span>
        </a>
      </div>`;
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
      case "partner-profile": html = viewPartnerProfile(param); break;
      case "partner-reset": html = viewPartnerReset(param); break;
      case "reset": html = viewUserReset(param); break;
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
    if (route === "operators") bindOperators();
    if (route === "itineraries") bindItineraries();
    if (route === "partners") bindPartners();
    if (route === "partner-signup") bindPartnerSignup();
    if (route === "partner") bindPartnerPortal();
    if (route === "partner-profile") bindPartnerProfile(param);
    if (route === "partner-reset") bindPartnerReset();
    if (route === "reset") bindUserReset();
    if (route === "services") bindServices();
    if (route === "events") bindEvents();
    if (route === "home") { buildScrollHero(); setupCineVideo(); bindHomeDiscovery(); loadHomeServices(); loadHomeEvents(); loadHomeOps(); } else stopScrollHero();
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

  /* ---------- service photo galleries: auto-advance + click-to-enlarge ---------- */
  // Every gallery slides to its next photo each second (pauses on hover/touch,
  // respects reduced-motion, loops back to the first photo at the end).
  setInterval(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".svc-gal").forEach(g => {
      if (g._hold || g.matches(":hover")) return;
      const w = g.clientWidth;
      if (!w || g.scrollWidth <= w + 2) return;
      const n = Math.round(g.scrollWidth / w);
      const next = (Math.round(g.scrollLeft / w) + 1) % n;
      slowGlide(g, next * w);
    });
  }, 5000);
  /* a slower, eased glide (~1.2s) than the browser's default smooth scroll */
  function slowGlide(el, to) {
    const from = el.scrollLeft, dist = to - from, dur = 1200, t0 = performance.now();
    el._gliding = true;
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;  // easeInOutQuad
      el.scrollLeft = from + dist * e;
      if (p < 1 && el._gliding) requestAnimationFrame(step);
      else el._gliding = false;
    })(t0);
  }
  // touching a gallery pauses its auto-advance for a few seconds
  document.addEventListener("touchstart", (e) => {
    const g = e.target.closest(".svc-gal"); if (!g) return;
    g._hold = true; g._gliding = false;   // stop any in-flight glide so it doesn't fight the finger
    clearTimeout(g._holdT);
    g._holdT = setTimeout(() => { g._hold = false; }, 5000);
  }, { passive: true });

  /* lightbox: click any service photo to view it full-size (arrows + ESC) */
  function openLightbox(imgs, idx) {
    const old = document.getElementById("kaLightbox");
    if (old) old.remove();
    let i = idx;
    const lb = document.createElement("div");
    lb.id = "kaLightbox"; lb.className = "lb";
    lb.innerHTML = `
      <button class="lb-x" aria-label="Close">✕</button>
      ${imgs.length > 1 ? `<button class="lb-nav lb-prev" aria-label="Previous">‹</button><button class="lb-nav lb-next" aria-label="Next">›</button>` : ""}
      <img class="lb-img" src="${imgs[i]}" alt="" />
      ${imgs.length > 1 ? `<span class="lb-count">${i + 1} / ${imgs.length}</span>` : ""}`;
    document.body.appendChild(lb);
    const img = lb.querySelector(".lb-img");
    const cnt = lb.querySelector(".lb-count");
    const show = (j) => { i = (j + imgs.length) % imgs.length; img.src = imgs[i]; if (cnt) cnt.textContent = (i + 1) + " / " + imgs.length; };
    lb.addEventListener("click", (e) => {
      if (e.target.closest(".lb-prev")) return show(i - 1);
      if (e.target.closest(".lb-next")) return show(i + 1);
      if (e.target === lb || e.target.closest(".lb-x")) { lb.remove(); document.removeEventListener("keydown", onKey); }
    });
    const onKey = (e) => {
      if (e.key === "Escape") { lb.remove(); document.removeEventListener("keydown", onKey); }
      else if (e.key === "ArrowLeft") show(i - 1);
      else if (e.key === "ArrowRight") show(i + 1);
    };
    document.addEventListener("keydown", onKey);
  }
  document.addEventListener("click", (e) => {
    const im = e.target.closest(".svc-photo-card .svc-gal img, .svc-photo-card .att-img");
    if (!im) return;
    const media = im.closest(".att-media");
    const imgs = Array.from(media.querySelectorAll("img")).map(x => x.src);
    openLightbox(imgs, Math.max(0, imgs.indexOf(im.src)));
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
  const WA = { g: "wa", l: { en: "💬 Karibu Live — chat on WhatsApp", sw: "💬 Karibu Live — ongea WhatsApp" } };
  const HOME = { g: "root", l: { en: "↩︎ Explore more topics", sw: "↩︎ Gundua mada zaidi" } };
  const MORE = { g: "root", l: { en: "✨ Show me something else", sw: "✨ Nionyeshe kitu kingine" } };
  const WELCOME_ARUSHA = {
    root: {
      m: { en: "Karibu sana! 🦒 You're at the gateway to the Northern Safari Circuit — a city humming with energy under the peak of Mount Meru. Wildlife, coffee, culture… Arusha has a rhythm you'll love.\n\nWhat vibe are you feeling today?",
           sw: "Karibu sana! 🦒 Uko kwenye lango la Mzunguko wa Safari wa Kaskazini — jiji lenye msisimko chini ya Mlima Meru. Wanyamapori, kahawa, utamaduni… Arusha ina mdundo utakaoupenda.\n\nUnahisi vibe gani leo?" },
      o: [
        { g: "thrill", l: { en: "🏔️ Thrill seeker", sw: "🏔️ Mpenda msisimko" } },
        { g: "culture", l: { en: "🪘 Culture lover", sw: "🪘 Mpenda utamaduni" } },
        { g: "relax", l: { en: "🌿 Relaxation", sw: "🌿 Pumziko" } },
        { g: "book", l: { en: "🎟️ How to book / contact an operator", sw: "🎟️ Kuweka booking / kupata operator" } },
        { g: "prices", l: { en: "💰 Prices & typical costs", sw: "💰 Bei na gharama za kawaida" } },
        { g: "logistics", l: { en: "✈️ Getting there & around", sw: "✈️ Kufika na kuzunguka" } },
        { g: "stay", l: { en: "🏨 Where to stay", sw: "🏨 Malazi" } },
        { g: "eat", l: { en: "🍽️ Food & nightlife", sw: "🍽️ Chakula na burudani" } },
        { g: "practical", l: { en: "🧭 Practical tips (money, SIM, packing)", sw: "🧭 Vidokezo (pesa, SIM, kubeba)" } },
        { g: "shop", l: { en: "🛍️ Shopping & Tanzanite", sw: "🛍️ Ununuzi na Tanzanite" } }
      ]
    },
    book: {
      m: { en: "Booking on Karibu Arusha is simple and safe: you always deal with a document-verified, licensed operator. Here's the flow — find what you love, then reach the operator directly on WhatsApp to lock in dates and details.",
           sw: "Kuweka booking kwenye Karibu Arusha ni rahisi na salama: daima unashughulika na mwendeshaji mwenye leseni aliyekaguliwa. Njia yenyewe — pata unachopenda, kisha wasiliana na mwendeshaji moja kwa moja WhatsApp kuthibitisha tarehe na maelezo." },
      o: [
        { g: "page:#/trips", l: { en: "🎟️ Browse trips", sw: "🎟️ Angalia safari" } },
        { g: "page:#/services", l: { en: "🧑‍🌾 Find a verified operator/service", sw: "🧑‍🌾 Pata operator/huduma" } },
        { g: "prices", l: { en: "💰 What will it cost?", sw: "💰 Itagharimu kiasi gani?" } },
        WA, MORE
      ]
    },
    prices: {
      m: { en: "Here's a realistic guide to Arusha day-trip prices (per person, with a licensed operator — 4x4, guide and park fees included):",
           sw: "Hii hapa mwongozo halisi wa bei za safari za siku Arusha (kwa mtu, na mwendeshaji mwenye leseni — 4x4, kiongozi na ada):" },
      o: [
        { g: "prices2", l: { en: "🦁 Day trips (Ngorongoro, Tarangire…)", sw: "🦁 Safari za siku" } },
        { g: "prices3", l: { en: "🌍 Multi-day safaris (3–7 days)", sw: "🌍 Safari za siku nyingi" } },
        { g: "book", l: { en: "🎟️ How do I book?", sw: "🎟️ Naweza kuwekaje?" } },
        WA, MORE
      ]
    },
    prices2: {
      m: { en: "Day trips from Arusha, indicative from-prices per person: Arusha National Park ~$220 · Materuni waterfalls & coffee ~$200 · Maasai boma ~$200 · Tarangire ~$280 · Ngorongoro Crater ~$320. These bundle transport, a guide and park fees; your operator confirms the final quote for your group size and season.",
           sw: "Safari za siku kutoka Arusha, bei za kuanzia kwa mtu: Hifadhi ya Arusha ~$220 · Materuni na kahawa ~$200 · Boma la Kimaasai ~$200 · Tarangire ~$280 · Kreta ya Ngorongoro ~$320. Zinajumuisha usafiri, kiongozi na ada; mwendeshaji atathibitisha bei ya mwisho kulingana na idadi yenu na msimu." },
      o: [ { g: "page:#/trips", l: { en: "🎟️ See all trips", sw: "🎟️ Ona safari zote" } }, WA, MORE ]
    },
    prices3: {
      m: { en: "Multi-day safaris (from-prices per person, guided, with lodging): 3-day Serengeti + Ngorongoro ~$1,150 · 5-day AFCON-week explorer ~$1,590 · 7-day grand northern circuit ~$2,350. Longer trips cost more per day for premium lodges and fly-in options — just ask your operator.",
           sw: "Safari za siku nyingi (bei za kuanzia kwa mtu, na malazi): siku 3 Serengeti + Ngorongoro ~$1,150 · siku 5 wiki ya AFCON ~$1,590 · siku 7 mzunguko mkuu ~$2,350. Safari ndefu zina gharama zaidi kwa loji za kifahari na ndege — uliza mwendeshaji." },
      o: [ { g: "page:#/itineraries", l: { en: "🗺️ See itineraries", sw: "🗺️ Ona ratiba" } }, WA, MORE ]
    },
    practical: {
      m: { en: "A few practical things make an Arusha trip smooth — money, connectivity and what to pack. Which one shall I cover?",
           sw: "Vitu vichache vinafanya safari ya Arusha iwe rahisi — pesa, mtandao na cha kubeba. Nikueleze kipi?" },
      o: [
        { g: "money", l: { en: "💳 Money, ATMs & cash", sw: "💳 Pesa, ATM na fedha" } },
        { g: "sim", l: { en: "📶 SIM cards & internet", sw: "📶 Laini za simu na intaneti" } },
        { g: "pack", l: { en: "🎒 What to pack", sw: "🎒 Cha kubeba" } }
      ]
    },
    money: {
      m: { en: "The currency is the Tanzanian Shilling (TZS); USD is widely accepted for safaris and hotels (bring clean, newer notes). ATMs are common in Arusha city and accept Visa/Mastercard. Carry some cash for markets, tips and small vendors, and agree prices before services. Tipping guides/drivers is customary and appreciated.",
           sw: "Sarafu ni Shilingi ya Tanzania (TZS); USD inakubalika sana kwa safari na hoteli (beba noti mpya, safi). ATM zipo nyingi jijini Arusha na zinakubali Visa/Mastercard. Beba fedha kidogo kwa masoko, tip na wauzaji wadogo, na kubaliana bei kabla ya huduma. Kutoa tip kwa viongozi/madereva ni desturi." },
      o: [ { g: "sim", l: { en: "📶 What about SIM & internet?", sw: "📶 Vipi SIM na intaneti?" } }, WA, MORE ]
    },
    sim: {
      m: { en: "Buy a local SIM (Vodacom, Airtel, Halotel or Tigo/Yas) at the airport or in town — cheap data bundles keep you online for maps and WhatsApp. You'll need your passport to register it. Most hotels and lodges have Wi-Fi, though it can be slow deep in the parks.",
           sw: "Nunua laini ya ndani (Vodacom, Airtel, Halotel au Tigo/Yas) uwanjani au mjini — bando za bei nafuu zitakuweka mtandaoni kwa ramani na WhatsApp. Utahitaji pasipoti kuisajili. Hoteli nyingi zina Wi-Fi, ingawa inaweza kuwa polepole ndani ya hifadhi." },
      o: [ { g: "pack", l: { en: "🎒 And what should I pack?", sw: "🎒 Na nibebe nini?" } }, WA, MORE ]
    },
    pack: {
      m: { en: "For Arusha, pack layers: warm mornings and cool evenings at altitude, plus chilly game drives. Bring neutral colours for safari, a hat, sunscreen, sunglasses, insect repellent, sturdy shoes, a light rain jacket, binoculars and a good camera. For mountains (Meru/Kili) you'll need proper cold-weather gear — your operator provides a packing list.",
           sw: "Kwa Arusha, beba nguo za tabaka: asubuhi joto na jioni baridi kwa mwinuko, pamoja na game drive za baridi. Beba rangi za wastani kwa safari, kofia, sunscreen, miwani, dawa ya wadudu, viatu imara, koti jepesi la mvua, darubini na kamera nzuri. Kwa milima (Meru/Kili) utahitaji vifaa vya baridi — mwendeshaji atakupa orodha." },
      o: [ { g: "besttime", l: { en: "📅 Best time to visit?", sw: "📅 Wakati bora wa kuja?" } }, WA, MORE ]
    },
    besttime: {
      m: { en: "Arusha is a year-round destination. June–October is dry, cooler and superb for game viewing (and AFCON 2027!). The Great Migration river crossings in the northern Serengeti peak around July–September. The green season (Nov–May) is lush, quieter and great for birds and calving in the south. There is no bad time — just different magic.",
           sw: "Arusha ni kivutio cha mwaka mzima. Juni–Oktoba ni kavu, baridi kidogo na bora kwa kuona wanyama (na AFCON 2027!). Uvukaji wa Uhamiaji Mkuu kaskazini mwa Serengeti hupamba moto Julai–Septemba. Msimu wa kijani (Nov–Mei) ni wa majani, tulivu na mzuri kwa ndege na kuzaliana. Hakuna wakati mbaya — ni maajabu tofauti tu." },
      o: [ { g: "prices", l: { en: "💰 And the costs?", sw: "💰 Na gharama?" } }, WA, MORE ]
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
        ["thrill|adventure|msisimko", "thrill"], ["culture|utamaduni", "culture"],
        ["book|weka booking|contact|wasiliana|operator|guide|kiongozi|reserve|reservation", "book"],
        ["price|bei|cost|gharama|how much|kiasi gani|budget", "prices"],
        ["money|cash|atm|currency|shilling|tzs|usd|dollar|fedha|pesa|tip", "money"],
        ["sim|internet|wifi|data|network|mtandao|simu card", "sim"],
        ["pack|packing|bring|wear|kubeba|nguo|luggage|nivae", "pack"],
        ["best time|when to|season|msimu|wakati bora|when should", "besttime"],
        ["invest|uwekezaji|business|tanzanite|gem", "shop"], ["hotel|lodge|stay|malazi|sleep|accommodation|kaa", "stay"],
        ["visa|immigration|uhamiaji", null], ["match|afcon|mechi|stadium|uwanja", null], ["weather|hali ya hewa|joto|climate", null]
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
      renderOptions(WELCOME_ARUSHA.root.o.slice(0, 6).concat([WA]));
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
          // keep guiding: always offer a few next taps so the user never dead-ends
          renderOptions([
            { g: "book", l: { en: "🎟️ Help me book", sw: "🎟️ Nisaidie kuweka" } },
            { g: "prices", l: { en: "💰 Prices", sw: "💰 Bei" } },
            WA, MORE
          ]);
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

  /* ---------- live Arusha clock (East Africa Time, UTC+3) ---------- */
  (function liveClock() {
    const cEl = document.getElementById("topClock");
    const dEl = document.getElementById("topDate");
    if (!cEl) return;
    const tick = () => {
      const now = new Date();
      // Arusha = UTC+3, independent of the viewer's timezone
      const eat = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
      const p = (n) => String(n).padStart(2, "0");
      cEl.textContent = p(eat.getHours()) + ":" + p(eat.getMinutes()) + ":" + p(eat.getSeconds());
      if (dEl) dEl.textContent = eat.toLocaleDateString(lang === "sw" ? "sw-TZ" : lang, { weekday: "short", day: "numeric", month: "short" });
    };
    tick(); setInterval(tick, 1000);
  })();

  /* ---------- boot ---------- */
  window.addEventListener("hashchange", render);
  applyStaticI18n();
  updateAuthNav();
  if (!location.hash) location.hash = "#/home";
  render();
})();
