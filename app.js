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
    localStorage.setItem(REG_KEY, JSON.stringify(all));
    const url = window.CONFIG && window.CONFIG.registrationEndpoint;
    if (url) { try { fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) }); } catch (e) {} }
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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll-gallery hero (vanilla port of the bento scroll-animation) ---------- */
  const HERO_GALLERY = [
    "1535941339077-2dd1c7963098", // lions / savanna
    "1547471080-7cc2caa01a7e",    // acacia sunset
    "1549366021-9f761d450615",    // elephant
    "1547970810-dc1eac37d174",    // rhinos on the plains
    "1523805009345-7448845a9e53"  // giraffe at sunset
  ].map(id => `https://images.unsplash.com/photo-${id}?w=1200&q=65&auto=format&fit=crop`);

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
      const tx = lerp(p, 0.1, 0.9, -35, 0);   // slide in from the right
      const sc = lerp(p, 0, 0.9, 0.5, 1);      // grow into the bento grid
      const tf = `translateX(${tx.toFixed(2)}%) scale(${sc.toFixed(3)})`;
      for (const c of cells) c.style.transform = tf;
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
        el.style.setProperty("--reveal-delay", (Math.min(idx, 6) * 50) + "ms");
        revealObserver.observe(el);
      });
  }

  /* ===================================================================
     VIEW: HOME
     =================================================================== */
  function viewHome() {
    const featured = window.TRIPS.slice(0, 6);
    return `
      <section class="scroll-hero" id="scrollHero">
        <div class="scroll-hero-sticky">
          <div class="bento-grid" id="bentoGrid" aria-hidden="true">
            ${HERO_GALLERY.map(u => `<div class="bento-cell"><img src="${u}" alt="Arusha safari" loading="eager" decoding="async" /></div>`).join("")}
          </div>
          <div class="scroll-hero-content" id="scrollHeroContent">
            <span class="hero-kicker">${t("hero_kicker")}</span>
            <p class="hero-lead">${t("hero_lead")}</p>
            <h1 class="hero-arusha">Arusha</h1>
            <p class="hero-script">${t("hero_script")}</p>
            <p class="hero-sub">${t("hero_sub")}</p>
            <div class="hero-cta-row">
              <a href="#/register" class="btn btn-primary">${t("home_reg_cta")}</a>
              <a href="#/trips" class="btn btn-ghost">${t("hero_cta")}</a>
            </div>
            <div class="scroll-hint" aria-hidden="true">↓</div>
          </div>
        </div>
      </section>

      <section class="container hero-stats-band">
        <div class="hero-stats">
          <div><strong>${window.OPERATORS.length}+</strong><span>${t("hero_stat1")}</span></div>
          <div><strong>${Object.keys(window.I18N).length}</strong><span>${t("hero_stat2")}</span></div>
          <div><strong>${window.TRIPS.length}</strong><span>${t("hero_stat3")}</span></div>
        </div>
      </section>

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
        <div class="home-reg">
          <div class="home-reg-text">
            <span class="home-reg-kicker">${t("home_reg_kicker")}</span>
            <h2>${t("home_reg_title")}</h2>
            <p>${t("home_reg_text")}</p>
          </div>
          <a href="#/register" class="btn btn-primary btn-lg">${t("home_reg_cta")} →</a>
        </div>
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
    const countries = window.COUNTRIES || [];
    const dialOpts = countries.map(c =>
      `<option value="+${c.d}" data-c="${c.c}"${c.c === "TZ" ? " selected" : ""}>${flag(c.c)} +${c.d}</option>`).join("");
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

    /* searchable country combobox — type to filter, pick to auto-set the phone code */
    const combo = document.getElementById("regCountryCombo");
    const search = document.getElementById("regCountrySearch");
    const hidden = document.getElementById("regCountry");
    const list = document.getElementById("regCountryList");
    function renderCountryList(q) {
      const query = (q || "").trim().toLowerCase();
      const matches = window.COUNTRIES
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
        ts, name, countryCode, country: countryName,
        dial: phone ? dial.value : "", phone: fullPhone,
        email, interest, lang, pass: hashPass(pass)
      });
      setCurrentUser({ name, email, phone: fullPhone, country: countryName, ts });  // auto sign-in
      updateAuthNav();
      form.hidden = true;
      document.getElementById("regSuccess").hidden = false;
    });
  }

  /* admin table of registrations (shown on the dashboard) */
  function regAdminHTML() {
    const rows = getRegs();
    const body = rows.length
      ? `<div class="table-wrap"><table class="reg-table">
          <thead><tr>
            <th>${t("admin_name")}</th><th>${t("admin_country")}</th><th>${t("admin_contact")}</th>
            <th>${t("admin_interest")}</th><th>${t("admin_when")}</th>
          </tr></thead><tbody>
          ${rows.slice().reverse().map(r => `<tr>
            <td>${esc(r.name)}</td>
            <td>${flag(r.countryCode)} ${esc(r.country)}</td>
            <td>${esc([r.phone, r.email].filter(Boolean).join(" · ")) || "—"}</td>
            <td>${esc(r.interest || "—")}</td>
            <td>${esc(new Date(r.ts).toLocaleDateString(lang === "sw" ? "sw-TZ" : lang))}</td>
          </tr>`).join("")}
          </tbody></table></div>`
      : `<p class="muted admin-empty">${t("admin_empty")}</p>`;
    return `
      <div class="panel admin-panel">
        <div class="admin-head">
          <h3>${t("admin_title")} <span class="admin-count">${rows.length}</span></h3>
          <div class="admin-actions">
            <button class="btn btn-small" id="regExport"${rows.length ? "" : " disabled"}>⬇ ${t("admin_export")}</button>
            <button class="btn btn-small btn-danger" id="regClear"${rows.length ? "" : " disabled"}>${t("admin_clear")}</button>
          </div>
        </div>
        <p class="muted small">${t("admin_sub")}</p>
        ${body}
      </div>`;
  }

  function bindAdmin() {
    const exp = document.getElementById("regExport");
    if (exp) exp.addEventListener("click", exportRegsCSV);
    const clr = document.getElementById("regClear");
    if (clr) clr.addEventListener("click", () => {
      if (confirm(t("admin_confirm_clear"))) { clearRegs(); render(); }
    });
  }

  /* ===================================================================
     VIEW: ADMIN (passcode-gated registrations panel)
     =================================================================== */
  function isAdmin() { return sessionStorage.getItem("ka_admin") === "1"; }
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
              <div class="pass-wrap">
                <input id="adminPass" type="password" autocomplete="current-password" placeholder="${t("admin_pass_ph")}" />
                <button type="button" class="pass-toggle" aria-label="${t("pass_show")}">👁</button>
              </div>
            </div>
            <div id="adminErr" class="form-error" role="alert" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">${t("admin_login_btn")}</button>
          </form>
        </section>`;
    }
    return `
      <section class="detail-hero grad-green">
        <div class="container">
          <h1>${t("admin_title")}</h1>
          <p class="detail-meta">${t("admin_sub")}</p>
        </div>
      </section>
      <section class="container section">
        ${regAdminHTML()}
        <div class="center mt"><button class="btn btn-ghost" id="adminLogout">${t("admin_logout")}</button></div>
      </section>`;
  }
  function bindAdminPage() {
    const login = document.getElementById("adminLogin");
    if (login) {
      login.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = document.getElementById("adminPass").value;
        if (val && val === (window.CONFIG.adminCode || "")) {
          sessionStorage.setItem("ka_admin", "1");
          render();
        } else {
          const er = document.getElementById("adminErr");
          er.textContent = t("admin_login_err"); er.hidden = false;
        }
      });
      return;
    }
    bindAdmin(); // export / clear
    const logout = document.getElementById("adminLogout");
    if (logout) logout.addEventListener("click", () => { sessionStorage.removeItem("ka_admin"); render(); });
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
      case "admin": html = viewAdmin(); break;
      case "about": html = viewAbout(); break;
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
    if (route === "admin") bindAdminPage();
    if (route === "home") buildScrollHero(); else stopScrollHero();
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
