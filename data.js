/* =====================================================================
   KARIBU ARUSHA — CONTENT DATA
   ---------------------------------------------------------------------
   This is the ONE file your team edits to change what visitors see.
   No coding needed beyond following the pattern. Each item has:
     - English (en) and Kiswahili (sw) text fields
     - other languages fall back to English automatically
   Prices are indicative (USD) — confirm with each operator.
   ===================================================================== */

window.CONFIG = {
  // Visitor Desk WhatsApp (intl format, no +, no spaces). 0787 540 009 → 255787540009
  visitorDeskWhatsApp: "255787540009",
  // Cinematic hero background VIDEO of Arusha (mp4, landscape, plays muted).
  // Paste a direct .mp4 URL (Supabase Storage / your CDN) OR a local path like
  // "media/arusha-hero.mp4". Leave "" to use the photo slideshow instead.
  // If a video ever fails to load, the photo slideshow shows automatically.
  // (webm plays on Chrome/Edge/Firefox/Android; Safari/iOS fall back to the 4K photos.)
  // Multiple clips CROSS-ROTATE in the hero. Add your own Arusha/HeyGen mp4s here.
  // Each clip has a caption card + a time-of-day window (24h) when it leads.
  heroVideos: [
    { src: "media/arusha-v1.mp4", from: 5,  to: 12,
      title: { en: "Napuru Waterfalls", sw: "Maporomoko ya Napuru" },
      note:  { en: "A hidden gem minutes from Arusha city", sw: "Kito kilichofichika dakika chache kutoka mjini Arusha" } },
    { src: "media/arusha-v2.mp4", from: 12, to: 17,
      title: { en: "The Great Migration — Serengeti", sw: "Uhamiaji Mkuu — Serengeti" },
      note:  { en: "2M+ wildebeest, a day-trip from Arusha", sw: "Nyumbu 2M+, safari ya siku kutoka Arusha" } },
    { src: "media/arusha-v3.mp4", from: 17, to: 5,
      title: { en: "Golden hour at the waterhole", sw: "Jioni ya dhahabu kisimani" },
      note:  { en: "Giraffes at dusk — Tarangire & Arusha NP", sw: "Twiga machweo — Tarangire na Arusha NP" } }
  ],
  heroVideoRotate: 12000,               // ms each clip shows before crossfading to the next
  // Optional: paste a form endpoint URL (e.g. Formspree/Google Apps Script/Supabase) to
  // ALSO send registrations to a real server. Leave "" to store on-device only.
  registrationEndpoint: "",
  // NOTE: the admin passcode is now stored SECURELY in the Supabase database
  // (initial value: "arusha2027") and can be changed inside the Admin panel.
  // This field is kept only for reference and is no longer used to log in.
  adminCode: "arusha2027",
  // Real central backend (Supabase). Every registration is saved here across ALL devices.
  // View them at: Supabase dashboard → project "karibu-arusha" → Table Editor → registrations
  supabase: {
    url: "https://buvvljnhgkjmumxtvenq.supabase.co",
    anonKey: "sb_publishable_Je9PkAk_GwjK4rE55tvAXg_ulqNlscI"
  },
  city: "Arusha",
  tournament: "AFCON Pamoja 2027",
  dates: "19 June – 17 July 2027",
  stadium: "Samia Suluhu Hassan Stadium, Arusha",
};

/* ---------- TRIPS (timed around empty match days) ---------- */
window.TRIPS = [
  {
    id: "ngorongoro-day",
    duration: 1,
    icon: "🦁",
    grad: "grad-gold",
    priceFrom: 320,
    rating: 4.9,
    tags: ["safari", "wildlife", "unesco"],
    name: { en: "Ngorongoro Crater Day Safari", sw: "Safari ya Siku Moja Kreta ya Ngorongoro" },
    summary: {
      en: "Descend into the world's largest intact volcanic caldera — lions, rhinos, elephants and flamingos in one day.",
      sw: "Shuka ndani ya kreta kubwa zaidi duniani — simba, kifaru, tembo na heroe kwa siku moja."
    },
    highlights: {
      en: ["Big Five in a single crater", "Picnic lunch on the crater floor", "Back in Arusha by evening — match-day friendly"],
      sw: ["Wanyama watano wakubwa kwenye kreta moja", "Chakula cha mchana ndani ya kreta", "Kurudi Arusha jioni — inafaa siku ya mchezo"]
    }
  },
  {
    id: "tarangire-day",
    duration: 1,
    icon: "🐘",
    grad: "grad-green",
    priceFrom: 280,
    rating: 4.8,
    tags: ["safari", "wildlife", "family"],
    name: { en: "Tarangire National Park Day Safari", sw: "Safari ya Siku Moja Hifadhi ya Tarangire" },
    summary: {
      en: "Giant baobab trees and the largest elephant herds in northern Tanzania, two hours from the stadium.",
      sw: "Mibuyu mikubwa na makundi makubwa ya tembo kaskazini mwa Tanzania, saa mbili kutoka uwanjani."
    },
    highlights: {
      en: ["Huge elephant herds", "Ancient baobab landscape", "Great for families & first-timers"],
      sw: ["Makundi makubwa ya tembo", "Mandhari ya mibuyu ya kale", "Inafaa kwa familia na wanaoanza"]
    }
  },
  {
    id: "arusha-np-day",
    duration: 1,
    icon: "🦒",
    grad: "grad-teal",
    priceFrom: 220,
    rating: 4.7,
    tags: ["safari", "family", "nearby"],
    name: { en: "Arusha National Park Day Trip", sw: "Safari ya Siku Moja Hifadhi ya Arusha" },
    summary: {
      en: "Giraffes, colobus monkeys and the Momella Lakes at the foot of Mount Meru — closest park to the city.",
      sw: "Twiga, ngedere na Maziwa ya Momella chini ya Mlima Meru — hifadhi iliyo karibu zaidi na jiji."
    },
    highlights: {
      en: ["30 minutes from Arusha city", "Walking safari & canoeing option", "Perfect half-day between matches"],
      sw: ["Dakika 30 kutoka jiji la Arusha", "Safari ya kutembea na kupiga makasia", "Inafaa nusu siku kati ya mechi"]
    }
  },
  {
    id: "materuni-coffee",
    duration: 1,
    icon: "☕",
    grad: "grad-brown",
    priceFrom: 200,
    rating: 4.9,
    tags: ["culture", "nature", "food"],
    name: { en: "Materuni Waterfalls & Coffee Tour", sw: "Maporomoko ya Materuni na Ziara ya Kahawa" },
    summary: {
      en: "A Kilimanjaro-foothills waterfall hike, then roast and brew your own Chagga coffee with a local family.",
      sw: "Matembezi ya maporomoko chini ya Kilimanjaro, kisha kaanga na utengeneze kahawa yako ya Kichaga."
    },
    highlights: {
      en: ["80m waterfall swim", "Hands-on coffee roasting", "Authentic local-family income"],
      sw: ["Kuogelea kwenye maporomoko ya mita 80", "Kukaanga kahawa mwenyewe", "Kipato cha moja kwa moja kwa familia"]
    }
  },
  {
    id: "maasai-boma",
    duration: 1,
    icon: "🛖",
    grad: "grad-red",
    priceFrom: 200,
    rating: 4.8,
    tags: ["culture", "community", "family"],
    name: { en: "Maasai Village & Cultural Boma", sw: "Kijiji cha Kimaasai na Boma la Utamaduni" },
    summary: {
      en: "Spend a half-day with a Maasai community — dances, beadwork, traditional homestead life and stories.",
      sw: "Tumia nusu siku na jamii ya Kimaasai — ngoma, shanga, maisha ya boma na hadithi."
    },
    highlights: {
      en: ["Direct income to the community", "Beadwork you can take home", "Family & photography friendly"],
      sw: ["Kipato cha moja kwa moja kwa jamii", "Shanga za kuchukua nyumbani", "Inafaa familia na upigaji picha"]
    }
  },
  {
    id: "manyara-ngorongoro-2d",
    duration: 2,
    icon: "🦩",
    grad: "grad-gold",
    priceFrom: 650,
    rating: 4.9,
    tags: ["safari", "wildlife", "overnight"],
    name: { en: "Lake Manyara + Ngorongoro · 2 Days", sw: "Ziwa Manyara + Ngorongoro · Siku 2" },
    summary: {
      en: "Tree-climbing lions and flamingos at Manyara, then the Ngorongoro Crater the next morning. One overnight.",
      sw: "Simba wapandao miti na heroe Manyara, kisha Kreta ya Ngorongoro asubuhi inayofuata. Kulala mara moja."
    },
    highlights: {
      en: ["Two iconic parks in 48 hours", "Lodge overnight included", "Fits a two-match gap"],
      sw: ["Hifadhi mbili maarufu kwa saa 48", "Malazi ya lodge yamejumuishwa", "Inafaa pengo la mechi mbili"]
    }
  },
  {
    id: "tarangire-ngorongoro-2d",
    duration: 2,
    icon: "🐃",
    grad: "grad-green",
    priceFrom: 620,
    rating: 4.8,
    tags: ["safari", "wildlife", "overnight"],
    name: { en: "Tarangire + Ngorongoro · 2 Days", sw: "Tarangire + Ngorongoro · Siku 2" },
    summary: {
      en: "Elephant country and the great caldera back to back — the classic northern short safari.",
      sw: "Nchi ya tembo na kreta kubwa mfululizo — safari fupi maarufu ya kaskazini."
    },
    highlights: {
      en: ["Best of two parks", "All park fees & guide included", "Comfortable mid-range lodge"],
      sw: ["Bora ya hifadhi mbili", "Ada zote na kiongozi vimejumuishwa", "Malazi ya kati yenye starehe"]
    }
  },
  {
    id: "serengeti-ngorongoro-3d",
    duration: 3,
    icon: "🌍",
    grad: "grad-teal",
    priceFrom: 1150,
    rating: 5.0,
    tags: ["safari", "wildlife", "bucket-list"],
    name: { en: "Serengeti + Ngorongoro · 3 Days", sw: "Serengeti + Ngorongoro · Siku 3" },
    summary: {
      en: "The bucket-list classic: endless Serengeti plains, the Great Migration in season, and the crater finale.",
      sw: "Safari ya ndoto: tambarare za Serengeti, Uhamiaji Mkuu kwa msimu, na kreta mwishoni."
    },
    highlights: {
      en: ["The world-famous Serengeti", "Great Migration (seasonal)", "Two nights, fully guided"],
      sw: ["Serengeti maarufu duniani", "Uhamiaji Mkuu (kwa msimu)", "Usiku mbili, kiongozi kamili"]
    }
  }
];

/* ---------- OPERATORS (licensed & region-verified) ---------- */
/* OPERATORS directory is now driven by real approved partners (public_partners).
   Seed demo operators removed — only self-registered, verified partners appear. */
window.OPERATORS = [];

/* ---------- MATCH SCHEDULE (placeholder — update when CAF confirms) ---------- */
window.MATCHES = [
  { date: "2027-06-21", time: "16:00", group: "Group C", venue: "Samia Suluhu Hassan Stadium",
    home: { name: "Tanzania", code: "TZA", iso: "tz" }, away: { name: "Algeria", code: "ALG", iso: "dz" } },
  { date: "2027-06-25", time: "19:00", group: "Group C", venue: "Samia Suluhu Hassan Stadium",
    home: { name: "Senegal", code: "SEN", iso: "sn" }, away: { name: "Tanzania", code: "TZA", iso: "tz" } },
  { date: "2027-06-29", time: "16:00", group: "Group E", venue: "Samia Suluhu Hassan Stadium",
    home: { name: "Morocco", code: "MAR", iso: "ma" }, away: { name: "Zambia", code: "ZAM", iso: "zm" } },
  { date: "2027-07-04", time: "19:00", group: "Round of 16", venue: "Samia Suluhu Hassan Stadium",
    home: { name: "Winner Group C", code: "1C", iso: "" }, away: { name: "3rd place", code: "3rd", iso: "" } },
  { date: "2027-07-10", time: "19:00", group: "Quarter-final", venue: "Samia Suluhu Hassan Stadium",
    home: { name: "To be decided", code: "TBD", iso: "" }, away: { name: "To be decided", code: "TBD", iso: "" } }
];

/* ---------- "DISCOVER ARUSHA" — facts & wonders that attract tourists ---------- */
window.DASHBOARD = {
  stats: [
    { icon: "🦁", value: 5, suffix: "", label: { en: "The Big Five — all seeable in one day at Ngorongoro", sw: "Wanyama Watano Wakuu — waone wote kwa siku moja Ngorongoro" } },
    { icon: "⛰️", value: 5895, suffix: " m", label: { en: "Mount Kilimanjaro — the highest peak in Africa", sw: "Mlima Kilimanjaro — kilele kirefu zaidi Afrika" } },
    { icon: "🌍", value: 8, suffix: "", label: { en: "National parks & natural wonders within reach", sw: "Hifadhi na maajabu ya asili yaliyo karibu" } },
    { icon: "🦓", value: 2000000, suffix: "+", label: { en: "Wildebeest in the Great Migration", sw: "Nyumbu katika Uhamiaji Mkuu" } }
  ],
  // world-class attractions and their drive time (hours) from Arusha
  wonders: [
    { icon: "🦁", drive: 3,   name: { en: "Ngorongoro Crater", sw: "Kreta ya Ngorongoro" }, note: { en: "The world's largest intact caldera — Big Five & flamingos.", sw: "Kreta kubwa zaidi duniani — Big Five na heroe." } },
    { icon: "🌍", drive: 6,   name: { en: "Serengeti", sw: "Serengeti" }, note: { en: "Endless plains and the Great Migration.", sw: "Tambarare zisizo na mwisho na Uhamiaji Mkuu." } },
    { icon: "🐘", drive: 2,   name: { en: "Tarangire", sw: "Tarangire" }, note: { en: "Giant baobabs and huge elephant herds.", sw: "Mibuyu mikubwa na makundi makubwa ya tembo." } },
    { icon: "🦩", drive: 2,   name: { en: "Lake Manyara", sw: "Ziwa Manyara" }, note: { en: "Tree-climbing lions and pink flamingos.", sw: "Simba wapandao miti na heroe wa waridi." } },
    { icon: "🦒", drive: 0.5, name: { en: "Arusha National Park", sw: "Hifadhi ya Arusha" }, note: { en: "Giraffes & the Momella Lakes, minutes from town.", sw: "Twiga na Maziwa ya Momella, dakika kutoka mjini." } },
    { icon: "☕", drive: 1.5, name: { en: "Kilimanjaro & Materuni", sw: "Kilimanjaro na Materuni" }, note: { en: "Waterfalls, coffee farms and Africa's rooftop.", sw: "Maporomoko, mashamba ya kahawa na paa la Afrika." } }
  ]
};

/* ---------- EAC MEMBER STATES (for the EAC / Non-EAC registration portal) ---------- */
window.EAC = [
  { c: "TZ", d: 255, n: "Tanzania" },
  { c: "KE", d: 254, n: "Kenya" },
  { c: "UG", d: 256, n: "Uganda" },
  { c: "RW", d: 250, n: "Rwanda" },
  { c: "BI", d: 257, n: "Burundi" },
  { c: "SS", d: 211, n: "South Sudan" },
  { c: "CD", d: 243, n: "DR Congo" },
  { c: "SO", d: 252, n: "Somalia" }
];

/* ---------- EXPLORE ARUSHA — every attraction with real GPS coordinates.
   cat: park | mountain | museum | culture | nature  (used by map filters) ---------- */
window.ATTRACTIONS = [
  { id: "ngorongoro",   cat: "park",     icon: "🦁", lat: -3.1725, lng: 35.5876,
    name: { en: "Ngorongoro Crater", sw: "Kreta ya Ngorongoro" },
    desc: { en: "UNESCO World Heritage — the world's largest intact caldera. Big Five in one day.", sw: "Urithi wa Dunia (UNESCO) — kreta kubwa zaidi duniani. Big Five kwa siku moja." } },
  { id: "serengeti",    cat: "park",     icon: "🌍", lat: -2.3333, lng: 34.8333,
    name: { en: "Serengeti National Park", sw: "Hifadhi ya Taifa Serengeti" },
    desc: { en: "Endless plains and the Great Migration — 2M+ wildebeest.", sw: "Tambarare zisizo na mwisho na Uhamiaji Mkuu — nyumbu 2M+." } },
  { id: "tarangire",    cat: "park",     icon: "🐘", lat: -3.8333, lng: 36.0000,
    name: { en: "Tarangire National Park", sw: "Hifadhi ya Taifa Tarangire" },
    desc: { en: "Giant baobabs and the biggest elephant herds in the north.", sw: "Mibuyu mikubwa na makundi makubwa zaidi ya tembo kaskazini." } },
  { id: "manyara",      cat: "park",     icon: "🦩", lat: -3.4999, lng: 35.7500,
    name: { en: "Lake Manyara National Park", sw: "Hifadhi ya Ziwa Manyara" },
    desc: { en: "Tree-climbing lions, hippos and pink flamingos under the Rift wall.", sw: "Simba wapandao miti, viboko na heroe chini ya ukuta wa Bonde la Ufa." } },
  { id: "arusha-np",    cat: "park",     icon: "🦒", lat: -3.2500, lng: 36.8500,
    name: { en: "Arusha National Park", sw: "Hifadhi ya Taifa Arusha" },
    desc: { en: "Giraffes, colobus monkeys and the Momella Lakes — 30 min from town.", sw: "Twiga, mbega na Maziwa ya Momella — dakika 30 kutoka mjini." } },
  { id: "mt-meru",      cat: "mountain", icon: "⛰️", lat: -3.2367, lng: 36.7456,
    name: { en: "Mount Meru (4,566 m)", sw: "Mlima Meru (m 4,566)" },
    desc: { en: "Tanzania's 2nd-highest peak — a spectacular 3-4 day trek above Arusha.", sw: "Kilele cha pili Tanzania — mlima wa kuvutia wa siku 3-4 juu ya Arusha." } },
  { id: "kilimanjaro",  cat: "mountain", icon: "🗻", lat: -3.0674, lng: 37.3556,
    name: { en: "Mount Kilimanjaro (5,895 m)", sw: "Mlima Kilimanjaro (m 5,895)" },
    desc: { en: "Africa's rooftop — day hikes on the lower routes from Arusha.", sw: "Paa la Afrika — matembezi ya siku kwenye njia za chini kutoka Arusha." } },
  { id: "ol-doinyo",    cat: "mountain", icon: "🌋", lat: -2.7646, lng: 35.9147,
    name: { en: "Ol Doinyo Lengai", sw: "Ol Doinyo Lengai" },
    desc: { en: "The Maasai 'Mountain of God' — the world's only active natrocarbonatite volcano.", sw: "'Mlima wa Mungu' wa Kimaasai — volkano hai ya kipekee duniani." } },
  { id: "lake-natron",  cat: "nature",   icon: "🦢", lat: -2.4160, lng: 36.0450,
    name: { en: "Lake Natron", sw: "Ziwa Natron" },
    desc: { en: "Crimson soda lake — breeding ground for 2.5M lesser flamingos.", sw: "Ziwa jekundu la soda — mazalia ya heroe milioni 2.5." } },
  { id: "lake-duluti",  cat: "nature",   icon: "🛶", lat: -3.3853, lng: 36.7904,
    name: { en: "Lake Duluti", sw: "Ziwa Duluti" },
    desc: { en: "Volcanic crater lake minutes from town — canoeing and forest walks.", sw: "Ziwa la kreta dakika chache kutoka mjini — makasia na matembezi msituni." } },
  { id: "chemka",       cat: "nature",   icon: "💧", lat: -3.4358, lng: 37.2831,
    name: { en: "Chemka (Kikuletwa) Hot Springs", sw: "Chemchemi za Chemka (Kikuletwa)" },
    desc: { en: "Turquoise natural pools under fig trees — a perfect rest-day swim.", sw: "Madimbwi ya asili ya bluu chini ya mikuyu — kuogelea siku ya mapumziko." } },
  { id: "themi-falls",  cat: "nature",   icon: "🏞️", lat: -3.3475, lng: 36.7048,
    name: { en: "Themi Waterfalls", sw: "Maporomoko ya Themi" },
    desc: { en: "A hidden waterfall hike inside Arusha city's green edge.", sw: "Maporomoko yaliyofichika pembezoni mwa kijani mwa jiji la Arusha." } },
  { id: "napuru-falls", cat: "nature",   icon: "💦", lat: -3.3050, lng: 36.7550,
    name: { en: "Napuru Waterfalls", sw: "Maporomoko ya Napuru" },
    desc: { en: "A lush, twin-drop waterfall in a green gorge just minutes from Arusha city — a favourite short escape.", sw: "Maporomoko mapacha katika bonde la kijani dakika chache tu kutoka jiji la Arusha — pumziko fupi la kupendwa." } },
  { id: "materuni-falls", cat: "nature", icon: "☕", lat: -3.2167, lng: 37.3500,
    name: { en: "Materuni Waterfalls", sw: "Maporomoko ya Materuni" },
    desc: { en: "An 80-metre waterfall on Kilimanjaro's foothills, paired with a hands-on Chagga coffee experience.", sw: "Maporomoko ya mita 80 miteremko ya Kilimanjaro, pamoja na uzoefu wa kahawa ya Kichaga." } },
  { id: "ndoro-falls",  cat: "nature",   icon: "🌊", lat: -3.3667, lng: 37.0333,
    name: { en: "Ndoro Waterfalls", sw: "Maporomoko ya Ndoro" },
    desc: { en: "A peaceful cascade in the Usa River area east of Arusha, surrounded by coffee and banana farms.", sw: "Maporomoko tulivu eneo la Usa River mashariki mwa Arusha, yakizungukwa na mashamba ya kahawa na migomba." } },
  { id: "kalalani-falls", cat: "nature", icon: "🏞️", lat: -3.2500, lng: 36.9000,
    name: { en: "Kalalani (Meru) Waterfalls", sw: "Maporomoko ya Kalalani (Meru)" },
    desc: { en: "Forest waterfalls tumbling off the slopes of Mount Meru, reached by a lovely guided nature walk.", sw: "Maporomoko ya msituni yanayoteremka miteremko ya Mlima Meru, yanafikiwa kwa matembezi mazuri ya asili." } },
  { id: "decl-museum",  cat: "museum",   icon: "🏛️", lat: -3.3722, lng: 36.6889,
    name: { en: "Arusha Declaration Museum", sw: "Makumbusho ya Azimio la Arusha" },
    desc: { en: "Where Mwalimu Nyerere's 1967 Arusha Declaration story is kept alive.", sw: "Historia ya Azimio la Arusha la 1967 la Mwalimu Nyerere." } },
  { id: "nat-history",  cat: "museum",   icon: "🦴", lat: -3.3672, lng: 36.6822,
    name: { en: "Natural History Museum (Old Boma)", sw: "Makumbusho ya Historia Asilia (Boma la Kale)" },
    desc: { en: "A German-era boma with human-origins exhibits from Olduvai Gorge.", sw: "Boma la enzi za Kijerumani na maonyesho ya chimbuko la binadamu (Olduvai)." } },
  { id: "tanzanite-mus",cat: "museum",   icon: "💎", lat: -3.3660, lng: 36.6830,
    name: { en: "The Tanzanite Experience Museum", sw: "Makumbusho ya Tanzanite Experience" },
    desc: { en: "The story of Tanzanite — found ONLY in Mererani, near Arusha.", sw: "Historia ya Tanzanite — inapatikana Mererani PEKEE, karibu na Arusha." } },
  { id: "cultural-ctr", cat: "culture",  icon: "🎨", lat: -3.3941, lng: 36.6353,
    name: { en: "Cultural Heritage Centre", sw: "Kituo cha Urithi wa Utamaduni" },
    desc: { en: "Africa's largest art & craft centre — carvings, gems and a spiral gallery.", sw: "Kituo kikubwa zaidi Afrika cha sanaa — vinyago, vito na jumba la sanaa." } },
  { id: "maasai-mkt",   cat: "culture",  icon: "🧺", lat: -3.3681, lng: 36.6875,
    name: { en: "Maasai Market Curios", sw: "Soko la Kimaasai la Kumbukumbu" },
    desc: { en: "Beadwork, fabrics and souvenirs straight from local makers.", sw: "Shanga, vitambaa na zawadi moja kwa moja kutoka kwa watengenezaji." } },
  { id: "meserani",     cat: "culture",  icon: "🐍", lat: -3.4092, lng: 36.4633,
    name: { en: "Meserani Snake Park & Maasai Museum", sw: "Meserani Snake Park na Makumbusho ya Kimaasai" },
    desc: { en: "Reptile park, free Maasai cultural museum and camel rides.", sw: "Hifadhi ya wanyama watambaao, makumbusho ya Kimaasai na kupanda ngamia." } },
  { id: "longido",      cat: "culture",  icon: "🛖", lat: -2.7290, lng: 36.6970,
    name: { en: "Longido Cultural Tourism", sw: "Utalii wa Utamaduni Longido" },
    desc: { en: "Walk with Maasai warriors under Mount Longido — real village life.", sw: "Tembea na morani chini ya Mlima Longido — maisha halisi ya kijiji." } },
  { id: "mulala",       cat: "culture",  icon: "🌱", lat: -3.2660, lng: 36.8830,
    name: { en: "Mulala Cultural Village", sw: "Kijiji cha Utamaduni Mulala" },
    desc: { en: "A women-run village experience on Meru's slopes — cheese, coffee, farms.", sw: "Kijiji kinachoongozwa na akina mama miteremko ya Meru — jibini, kahawa, mashamba." } },
  { id: "hadzabe",      cat: "culture",  icon: "🏹", lat: -3.6833, lng: 35.0500,
    name: { en: "Hadzabe of Lake Eyasi", sw: "Wahadzabe wa Ziwa Eyasi" },
    desc: { en: "Spend a dawn with one of Earth's last hunter-gatherer peoples — a real hunt, wild honey and the click language.", sw: "Tumia alfajiri na mojawapo ya jamii za mwisho za wawindaji-wakusanyaji duniani — uwindaji halisi, asali ya porini na lugha ya mibofyo." } },
  { id: "aicc",         cat: "conference", icon: "🏢", lat: -3.3667, lng: 36.6959,
    name: { en: "AICC — Arusha Int'l Conference Centre", sw: "AICC — Kituo cha Mikutano cha Kimataifa Arusha" },
    desc: { en: "East Africa's diplomatic hub — conferences, summits and the EAC neighbourhood.", sw: "Kitovu cha kidiplomasia cha Afrika Mashariki — mikutano, makongamano na eneo la EAC." } },
  { id: "mtmeru-hotel", cat: "conference", icon: "🏨", lat: -3.3546, lng: 36.7000,
    name: { en: "Mount Meru Hotel — conference & stay", sw: "Hoteli ya Mount Meru — mikutano na malazi" },
    desc: { en: "Landmark 5-star hotel with large conference halls facing Mount Meru.", sw: "Hoteli maarufu ya nyota 5 yenye kumbi kubwa za mikutano ikitazama Mlima Meru." } },
  { id: "gran-melia",   cat: "conference", icon: "🏨", lat: -3.3770, lng: 36.6790,
    name: { en: "Gran Meliá Arusha — conference & stay", sw: "Gran Meliá Arusha — mikutano na malazi" },
    desc: { en: "Luxury hotel and event venue in coffee-farm gardens above the city.", sw: "Hoteli ya kifahari na kumbi za matukio ndani ya bustani za kahawa juu ya jiji." } },
  { id: "arusha-hotel", cat: "conference", icon: "🏨", lat: -3.3707, lng: 36.6873,
    name: { en: "The Arusha Hotel — meetings & stay", sw: "The Arusha Hotel — vikao na malazi" },
    desc: { en: "Historic city-centre hotel with boardrooms and banquet halls since 1894.", sw: "Hoteli ya kihistoria katikati ya jiji yenye vyumba vya vikao tangu 1894." } }
];

/* ---------- attach a real photo + fallback gradient to every attraction ----------
   If an image ever fails to load, the gradient + emoji still shows, so a card
   never looks broken. Photos are lazy-loaded (performance). */
(function () {
  const base = "https://images.unsplash.com/photo-";
  const q = "?w=800&q=60&auto=format&fit=crop";
  const meta = {
    ngorongoro:   ["1535941339077-2dd1c7963098", "grad-gold"],  // lions
    serengeti:    ["1469474968028-56623f02e42e", "grad-teal"],  // plains
    tarangire:    ["1516426122078-c23e76319801", "grad-green"], // elephants
    manyara:      ["1549366021-9f761d450615",    "grad-gold"],  // wildlife
    "arusha-np":  ["1547471080-7cc2caa01a7e",    "grad-teal"],  // giraffe
    "mt-meru":    ["1464822759023-fed622ff2c3b", "grad-green"], // mountain
    kilimanjaro:  ["1523805009345-7448845a9e53", "grad-teal"],  // savanna + peak
    "ol-doinyo":  ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Lengai_from_Natron.jpg/960px-Lengai_from_Natron.jpg", "grad-red"], // Ol Doinyo Lengai from Lake Natron
    "lake-natron":["1552083375-1447ce886485",    "grad-red"],   // flamingos
    "lake-duluti":["1439066615861-d1af74d74000", "grad-teal"],  // lake forest
    chemka:       ["1437482078695-73f5ca6c96e2", "grad-teal"],  // turquoise water
    "themi-falls":["1432405972618-c60b0225b8f9", "grad-green"], // waterfall
    "napuru-falls":["1437482078695-73f5ca6c96e2", "grad-teal"], // waterfall
    "materuni-falls":["1508233620744-7ff2b5b9f88f", "grad-brown"], // coffee falls
    "ndoro-falls":["1465146633011-14f8e0781093", "grad-teal"], // cascade
    "kalalani-falls":["1467890947394-8171244e5410", "grad-green"], // forest falls
    "decl-museum":["https://upload.wikimedia.org/wikipedia/commons/4/49/Uhuru_Monument_Aug_2011.jpg", "grad-brown"], // Arusha Uhuru Monument — the actual Arusha Declaration monument
    "nat-history":["1584285405429-136bf988919c", "grad-brown"], // historic building
    "tanzanite-mus":["1515562141207-7a88fb7ce338","grad-gold"], // gemstone
    "cultural-ctr":["1578321272176-b7bbc0679853", "grad-red"],  // african art
    "maasai-mkt": ["1528301040-b204c9b4c4b6",    "grad-red"],   // beadwork market
    meserani:     ["1516426122078-c23e76319801", "grad-brown"], // (reuse) wildlife
    longido:      ["1523805009345-7448845a9e53", "grad-red"],   // maasai land
    mulala:       ["1500382017468-9049fed747ef", "grad-green"], // farms
    hadzabe:      ["https://upload.wikimedia.org/wikipedia/commons/1/1f/Hadzabe_Hunters.jpg", "grad-brown"], // Hadza hunters, Lake Eyasi
    aicc:         ["1587825140708-dfaf72ae4b04", "grad-teal"],  // conference hall
    "mtmeru-hotel":["1566073771259-6a8506099945", "grad-gold"], // hotel
    "gran-melia": ["1582719508461-905c673771fd", "grad-gold"],  // luxury hotel
    "arusha-hotel":["1551882547-ff40c63fe5fa",   "grad-brown"]  // classic hotel
  };
  (window.ATTRACTIONS || []).forEach(a => {
    const m = meta[a.id];
    a.grad = (m && m[1]) || "grad-green";
    if (m && m[0] && m[0].indexOf(" ") === -1) {
      a.img = /^https?:\/\//.test(m[0]) ? m[0] : base + m[0] + q;   // allow full URLs (e.g. Wikimedia)
    }
  });
})();

/* ---------- EVENTS CALENDAR (marathons, sports, conferences, culture — per RAS) ----------
   tbc: true = date awaiting official confirmation (shown with a TBC badge). */
window.EVENTS = [
  { id: "afcon-groupc-1", type: "afcon", date: "2027-06-21", tbc: false, venue: "Samia Suluhu Hassan Stadium",
    name: { en: "AFCON: Tanzania vs Algeria", sw: "AFCON: Tanzania vs Algeria" },
    desc: { en: "Group C opener in Arusha — kick-off 16:00.", sw: "Ufunguzi wa Kundi C Arusha — saa 16:00." }, link: "#/matches" },
  { id: "arusha-marathon", type: "sports", date: "2027-06-27", tbc: true, venue: "Arusha City",
    name: { en: "Arusha City Marathon", sw: "Mbio za Marathon za Jiji la Arusha" },
    desc: { en: "5K fun run, 21K and full marathon through the city under Mount Meru.", sw: "Mbio za 5K, 21K na marathon kamili kupitia jiji chini ya Mlima Meru." } },
  { id: "fanzone-opening", type: "culture", date: "2027-06-19", tbc: true, venue: "City Fan Zone",
    name: { en: "AFCON Fan Zone opening festival", sw: "Tamasha la ufunguzi la Fan Zone" },
    desc: { en: "Live music, food stalls and big screens — every match day.", sw: "Muziki, chakula na skrini kubwa — kila siku ya mechi." } },
  { id: "site-expo", type: "conference", date: "2027-06-24", tbc: true, venue: "AICC",
    name: { en: "S!TE — Swahili Int'l Tourism Expo (Arusha edition)", sw: "S!TE — Maonyesho ya Utalii ya Kimataifa (Arusha)" },
    desc: { en: "Tourism trade expo: operators, investors and buyers at the AICC.", sw: "Maonyesho ya biashara ya utalii: waendeshaji, wawekezaji na wanunuzi AICC." } },
  { id: "cultural-week", type: "culture", date: "2027-07-01", tbc: true, venue: "Cultural Heritage Centre",
    name: { en: "Arusha Cultural Week", sw: "Wiki ya Utamaduni Arusha" },
    desc: { en: "Maasai dance, crafts, Tanzanite exhibitions and food of the region.", sw: "Ngoma za Kimaasai, sanaa, maonyesho ya Tanzanite na vyakula vya mkoa." } },
  { id: "investor-forum", type: "conference", date: "2027-07-06", tbc: true, venue: "Mount Meru Hotel",
    name: { en: "Invest in Arusha Forum", sw: "Kongamano la Wekeza Arusha" },
    desc: { en: "TIC, RAS Arusha and sector leaders on tourism, agri & Tanzanite value-addition.", sw: "TIC, RAS Arusha na viongozi wa sekta: utalii, kilimo na uongezaji thamani wa Tanzanite." } },
  { id: "afcon-quarter", type: "afcon", date: "2027-07-10", tbc: false, venue: "Samia Suluhu Hassan Stadium",
    name: { en: "AFCON Quarter-final in Arusha", sw: "Robo fainali ya AFCON Arusha" },
    desc: { en: "Quarter-final night — kick-off 19:00.", sw: "Usiku wa robo fainali — saa 19:00." }, link: "#/matches" },

];

/* ---------- NATIONAL TANZANIA EVENTS — recurring annuals, generated 2027 → 2030 ----------
   Each entry repeats every year with a stable month-day (md). Dates for festivals/marathons
   are approximate and carry a "date to confirm" flag (tbc). */
(function () {
  const ANNUAL = [
    { md: "01-01", type: "culture",    tbc: false, grad: "grad-gold",  venue: "Nationwide",
      name: { en: "New Year's Day", sw: "Siku ya Mwaka Mpya" },
      desc: { en: "Public holiday — celebrations across Tanzania.", sw: "Sikukuu ya kitaifa — sherehe kote Tanzania." } },
    { md: "02-14", type: "music",      tbc: true,  grad: "grad-red",   venue: "Stone Town, Zanzibar",
      name: { en: "Sauti za Busara Music Festival", sw: "Tamasha la Muziki Sauti za Busara" },
      desc: { en: "East Africa's celebrated live-music festival in historic Stone Town.", sw: "Tamasha maarufu la muziki wa moja kwa moja Afrika Mashariki, Mji Mkongwe." } },
    { md: "03-07", type: "sports",     tbc: true,  grad: "grad-teal",  venue: "Moshi / Kilimanjaro",
      name: { en: "Kilimanjaro Marathon", sw: "Marathon ya Kilimanjaro" },
      desc: { en: "One of East Africa's most scenic marathons, run in the shadow of Kilimanjaro.", sw: "Moja ya marathon za mandhari zaidi Afrika Mashariki, chini ya Kilimanjaro." } },
    { md: "04-26", type: "culture",    tbc: false, grad: "grad-green", venue: "Nationwide",
      name: { en: "Union Day", sw: "Siku ya Muungano" },
      desc: { en: "National holiday marking the union of Tanganyika and Zanzibar.", sw: "Sikukuu ya kitaifa ya Muungano wa Tanganyika na Zanzibar." } },
    { md: "05-01", type: "culture",    tbc: false, grad: "grad-red",   venue: "Nationwide",
      name: { en: "Workers' Day (May Day)", sw: "Siku ya Wafanyakazi (Mei Mosi)" },
      desc: { en: "National public holiday honouring workers.", sw: "Sikukuu ya kitaifa kuwaenzi wafanyakazi." } },
    { md: "06-14", type: "conference", tbc: true,  grad: "grad-gold",  venue: "AICC, Arusha",
      name: { en: "Karibu / KiliFair Travel & Tourism Fair", sw: "Karibu / KiliFair — Maonyesho ya Utalii" },
      desc: { en: "Arusha's flagship international travel trade fair for operators and buyers.", sw: "Maonyesho makuu ya kimataifa ya biashara ya utalii Arusha kwa waendeshaji na wanunuzi." } },
    { md: "07-07", type: "conference", tbc: false, grad: "grad-gold",  venue: "Dar es Salaam",
      name: { en: "Saba Saba — Dar Int'l Trade Fair", sw: "Saba Saba — Maonyesho ya Biashara Dar" },
      desc: { en: "Tanzania's biggest trade fair — business, industry and international exhibitors.", sw: "Maonyesho makubwa ya biashara Tanzania — biashara, viwanda na waonyeshaji wa kimataifa." } },
    { md: "07-08", type: "music",      tbc: true,  grad: "grad-teal",  venue: "Stone Town, Zanzibar",
      name: { en: "Zanzibar International Film Festival", sw: "Tamasha la Filamu la Kimataifa Zanzibar" },
      desc: { en: "The Indian Ocean's largest film and arts festival.", sw: "Tamasha kubwa zaidi la filamu na sanaa la Bahari ya Hindi." } },
    { md: "07-15", type: "culture",    tbc: true,  grad: "grad-green", venue: "Serengeti",
      name: { en: "The Great Migration season", sw: "Msimu wa Uhamiaji Mkuu" },
      desc: { en: "Peak river-crossing season in the northern Serengeti — one of Earth's greatest wildlife shows.", sw: "Kilele cha msimu wa kuvuka mito kaskazini mwa Serengeti — moja ya maonyesho makubwa ya wanyamapori duniani." } },
    { md: "08-08", type: "culture",    tbc: false, grad: "grad-green", venue: "Nationwide",
      name: { en: "Nane Nane — Farmers' Day", sw: "Nane Nane — Siku ya Wakulima" },
      desc: { en: "National agricultural day celebrating Tanzania's farmers, with regional exhibitions.", sw: "Siku ya kitaifa ya kilimo kusherehekea wakulima, na maonyesho ya mikoa." } },
    { md: "10-14", type: "culture",    tbc: false, grad: "grad-brown", venue: "Nationwide",
      name: { en: "Nyerere Day", sw: "Siku ya Nyerere" },
      desc: { en: "National day remembering the Father of the Nation, Mwalimu Julius Nyerere.", sw: "Siku ya kitaifa kumkumbuka Baba wa Taifa, Mwalimu Julius Nyerere." } },
    { md: "12-09", type: "culture",    tbc: false, grad: "grad-gold",  venue: "Nationwide",
      name: { en: "Independence Day (Uhuru Day)", sw: "Siku ya Uhuru" },
      desc: { en: "Tanzania's national independence celebrations.", sw: "Sherehe za kitaifa za uhuru wa Tanzania." } }
  ];
  // From the current year through the tournament year — the smart agenda hides
  // anything before today, so the calendar starts at "this month" and runs forward.
  const YEARS = [2026, 2027];
  YEARS.forEach(y => ANNUAL.forEach((e, i) => {
    window.EVENTS.push({
      id: "nat-" + y + "-" + i, type: e.type, date: y + "-" + e.md, tbc: e.tbc,
      national: true, grad: e.grad, venue: e.venue, name: e.name, desc: e.desc
    });
  }));
})();

/* ---------- SUGGESTED ITINERARIES (Destination-Tanzania style, Arusha edition) ----------
   Day-by-day plans timed around AFCON match gaps. Prices = our real trip prices
   bundled ("from $X per person"); balance always paid to licensed operators. */
window.ITINERARIES = [
  {
    id: "matchday-escape-1d", days: 1, priceFrom: 220, icon: "🦒", grad: "grad-teal",
    photoId: "1547471080-7cc2caa01a7e",
    tags: ["wildlife", "family", "half-day"],
    name: { en: "Match-Day Escape · 1 Day", sw: "Pumziko la Siku ya Mechi · Siku 1" },
    summary: { en: "One free day? Morning game drive in Arusha National Park, Cultural Heritage Centre after lunch — back before kick-off.",
               sw: "Una siku moja? Mzunguko wa asubuhi Hifadhi ya Arusha, Kituo cha Urithi mchana — urudi kabla ya mechi." },
    plan: {
      en: ["07:00 Pick-up — Arusha NP game drive (giraffes, colobus, Momella Lakes)",
           "12:30 Lunch with Mount Meru views",
           "14:00 Cultural Heritage Centre — art, Tanzanite gallery, souvenirs",
           "17:00 Back in the city / stadium zone"],
      sw: ["07:00 Kuchukuliwa — mzunguko Hifadhi ya Arusha (twiga, mbega, Maziwa ya Momella)",
           "12:30 Chakula cha mchana ukiona Mlima Meru",
           "14:00 Kituo cha Urithi — sanaa, Tanzanite, kumbukumbu",
           "17:00 Kurudi mjini / uwanjani"]
    }
  },
  {
    id: "between-matches-3d", days: 3, priceFrom: 1150, icon: "🌍", grad: "grad-gold",
    photoId: "1535941339077-2dd1c7963098",
    tags: ["safari", "bucket-list", "overnight"],
    name: { en: "Between Two Matches · 3 Days", sw: "Kati ya Mechi Mbili · Siku 3" },
    summary: { en: "The classic gap-filler: Serengeti plains, the Great Migration in season, and the Ngorongoro Crater finale.",
               sw: "Mpango maarufu: tambarare za Serengeti, Uhamiaji Mkuu kwa msimu, na Kreta ya Ngorongoro mwishoni." },
    plan: {
      en: ["Day 1 — Drive to Serengeti via Ngorongoro highlands; afternoon game drive",
           "Day 2 — Full Serengeti day: migration herds, big cats, sunset at camp",
           "Day 3 — Dawn in Ngorongoro Crater (Big Five), back in Arusha by evening"],
      sw: ["Siku 1 — Kwenda Serengeti kupitia nyanda za Ngorongoro; mzunguko wa jioni",
           "Siku 2 — Siku nzima Serengeti: makundi ya uhamiaji, simba, machweo kambini",
           "Siku 3 — Alfajiri Kreta ya Ngorongoro (Big Five), kurudi Arusha jioni"]
    }
  },
  {
    id: "afcon-week-5d", days: 5, priceFrom: 1590, icon: "🦁", grad: "grad-green",
    photoId: "1516426122078-c23e76319801",
    tags: ["safari", "culture", "waterfalls"],
    name: { en: "AFCON Week Explorer · 5 Days", sw: "Wiki ya AFCON · Siku 5" },
    summary: { en: "Wildlife + culture + waterfalls around your fixtures: Tarangire, Ngorongoro, Materuni, a Maasai boma and Napuru falls.",
               sw: "Wanyamapori + utamaduni + maporomoko kuzunguka mechi zako: Tarangire, Ngorongoro, Materuni, boma la Kimaasai na Napuru." },
    plan: {
      en: ["Day 1 — Tarangire: baobabs & the great elephant herds",
           "Day 2 — Ngorongoro Crater day safari",
           "Day 3 — Match day: Napuru waterfalls hike + Maasai Market (city day)",
           "Day 4 — Materuni waterfalls & Chagga coffee experience",
           "Day 5 — Maasai boma morning, afternoon at leisure / fan zone"],
      sw: ["Siku 1 — Tarangire: mibuyu na makundi makubwa ya tembo",
           "Siku 2 — Safari ya Kreta ya Ngorongoro",
           "Siku 3 — Siku ya mechi: Napuru + Soko la Kimaasai (mjini)",
           "Siku 4 — Materuni na kahawa ya Kichaga",
           "Siku 5 — Boma la Kimaasai asubuhi, mchana fan zone"]
    }
  },
  {
    id: "grand-arusha-7d", days: 7, priceFrom: 2350, icon: "⛰️", grad: "grad-brown",
    photoId: "1464822759023-fed622ff2c3b",
    tags: ["safari", "trek", "culture", "premium"],
    name: { en: "Grand Arusha Circuit · 7 Days", sw: "Mzunguko Mkuu wa Arusha · Siku 7" },
    summary: { en: "After the group stage: the full northern circuit — Serengeti, Ngorongoro, Tarangire, Lake Natron & Ol Doinyo Lengai country, plus Meru foothills.",
               sw: "Baada ya group stage: mzunguko mzima wa kaskazini — Serengeti, Ngorongoro, Tarangire, Ziwa Natron na Ol Doinyo Lengai, pamoja na miteremko ya Meru." },
    plan: {
      en: ["Day 1 — Arusha NP warm-up drive + Lake Duluti canoe",
           "Day 2 — Tarangire elephants",
           "Day 3-4 — Serengeti (overnight): migration & big cats",
           "Day 5 — Ngorongoro Crater sunrise safari",
           "Day 6 — Lake Natron flamingos, Ol Doinyo Lengai views, Maasai villages",
           "Day 7 — Meru waterfalls & coffee farewell, transfer to KIA/stadium"],
      sw: ["Siku 1 — Hifadhi ya Arusha + makasia Ziwa Duluti",
           "Siku 2 — Tembo wa Tarangire",
           "Siku 3-4 — Serengeti (kulala): uhamiaji na simba",
           "Siku 5 — Kreta ya Ngorongoro alfajiri",
           "Siku 6 — Heroe wa Ziwa Natron, Ol Doinyo Lengai, vijiji vya Kimaasai",
           "Siku 7 — Maporomoko ya Meru na kahawa, kuaga — KIA/uwanjani"]
    }
  }
];

/* ---------- INVEST IN ARUSHA — sectors shown inside the registered-tourist area ---------- */
window.INVESTMENTS = {
  sectors: [
    { id: "tourism",  ic: "camera",
      name: { en: "Tourism & Hospitality", sw: "Utalii na Ukarimu" },
      stat: { en: "1.8M+ int'l visitors to Tanzania/year — the northern circuit starts in Arusha", sw: "Wageni 1.8M+ wa kimataifa kwa mwaka — mzunguko wa kaskazini unaanzia Arusha" },
      desc: { en: "Lodges, hotels, tour operations, eco-camps and adventure products around Serengeti, Ngorongoro and Kilimanjaro. AFCON 2027 adds a continental spotlight.", sw: "Loji, hoteli, kampuni za safari na kambi za kiikolojia kuzunguka Serengeti, Ngorongoro na Kilimanjaro. AFCON 2027 inaongeza umaarufu wa kibara." } },
    { id: "agri",     ic: "sprout",
      name: { en: "Agriculture & Horticulture", sw: "Kilimo na Kilimo-bustani" },
      stat: { en: "Arusha exports coffee, flowers & vegetable seeds — #1 seed-producing region", sw: "Arusha inasafirisha kahawa, maua na mbegu — mkoa #1 kwa uzalishaji wa mbegu" },
      desc: { en: "Fertile volcanic soils on Meru's slopes: coffee estates, avocado, floriculture greenhouses and seed multiplication with direct air-freight via KIA.", sw: "Udongo wa volkano wenye rutuba: mashamba ya kahawa, parachichi, maua ya kijani-nyumba na uzalishaji wa mbegu — usafirishaji wa moja kwa moja kupitia KIA." } },
    { id: "tanzanite",ic: "gem",
      name: { en: "Tanzanite & Mining", sw: "Tanzanite na Madini" },
      stat: { en: "Tanzanite exists in ONE place on Earth: Mererani, Arusha region", sw: "Tanzanite inapatikana sehemu MOJA tu duniani: Mererani, mkoa wa Arusha" },
      desc: { en: "Value-addition is the opportunity: cutting, polishing, certification and jewellery — supported by the Mererani controlled trading hub.", sw: "Fursa ni kuongeza thamani: ukataji, ung'arishaji, uthibitisho na usonara — ikisaidiwa na soko rasmi la Mererani." } },
    { id: "mice",     ic: "building",
      name: { en: "Conference Tourism & Real Estate (MICE)", sw: "Utalii wa Mikutano na Majengo (MICE)" },
      stat: { en: "Arusha hosts the EAC HQ & AICC — East Africa's diplomatic capital", sw: "Arusha ni makao makuu ya EAC na AICC — mji wa kidiplomasia wa Afrika Mashariki" },
      desc: { en: "International conferences, serviced apartments, hotels and mixed-use property serving diplomats, NGOs and business travellers year-round.", sw: "Mikutano ya kimataifa, apartments, hoteli na majengo ya biashara yanayohudumia wanadiplomasia, NGOs na wafanyabiashara mwaka mzima." } },
    { id: "agroproc", ic: "factory",
      name: { en: "Agro-processing & Manufacturing", sw: "Usindikaji wa Mazao na Viwanda" },
      stat: { en: "Raw coffee, meat, dairy & grains ready for local value-addition", sw: "Kahawa, nyama, maziwa na nafaka vinasubiri kuongezwa thamani hapa hapa" },
      desc: { en: "Process what the region grows: coffee roasting, dairy, animal feed, packaging — with the SGR/road corridor linking to Dar port and EAC markets.", sw: "Sindika kinachozalishwa mkoani: kukaanga kahawa, maziwa, chakula cha mifugo, ufungashaji — barabara na reli kuunganisha bandari ya Dar na soko la EAC." } }
  ],
  safety: [
    { ic: "dove", en: "Decades of peace & political stability — Tanzania is among Africa's most stable nations", sw: "Miongo ya amani na utulivu wa kisiasa — Tanzania ni miongoni mwa nchi tulivu zaidi Afrika" },
    { ic: "building", en: "TIC one-stop centre: investor visas, permits and land access in one office", sw: "Kituo kimoja cha TIC: visa za wawekezaji, vibali na upatikanaji wa ardhi ofisi moja" },
    { ic: "globe", en: "EAC headquarters city — direct access to a 300M+ person market", sw: "Mji wa makao makuu ya EAC — soko la watu 300M+ moja kwa moja" },
    { ic: "plane", en: "Kilimanjaro International Airport (KIA) 40 min away, direct EU & Gulf flights", sw: "Uwanja wa ndege wa KIA dakika 40, safari za moja kwa moja Ulaya na Ghuba" },
    { ic: "shield", en: "Investment protected by law (Tanzania Investment Act) & int'l guarantees (MIGA)", sw: "Uwekezaji unalindwa kisheria (Sheria ya Uwekezaji) na dhamana za kimataifa (MIGA)" }
  ]
};

/* ---------- TRIP PHOTOS ----------
   Verified safari imagery (Unsplash). The card gradient shows while the image
   loads or if it ever fails, so the site still looks intentional offline. */
(function () {
  const base = "https://images.unsplash.com/photo-";
  const q = "?w=700&q=60&auto=format&fit=crop";
  const photo = {
    "ngorongoro-day":          "1535941339077-2dd1c7963098", // lions
    "tarangire-day":           "1516426122078-c23e76319801", // elephants
    "arusha-np-day":           "1547471080-7cc2caa01a7e",    // giraffe
    "materuni-coffee":         "1432405972618-c60b0225b8f9", // waterfall
    "maasai-boma":             "1523805009345-7448845a9e53", // savanna (best verified; swap for a real Maasai co-op photo)
    "manyara-ngorongoro-2d":   "1549366021-9f761d450615", // savanna/wildlife
    "tarangire-ngorongoro-2d": "1547970810-dc1eac37d174",    // safari drive
    "serengeti-ngorongoro-3d": "1469474968028-56623f02e42e"  // plains / wildlife
  };
  (window.TRIPS || []).forEach(t => {
    if (photo[t.id]) { t.photoId = photo[t.id]; t.img = base + photo[t.id] + q; }
  });
})();

/* For the demo, every WhatsApp link routes to the real Visitor Desk number.
   When operators are onboarded, give each its own number in the block above. */
(window.OPERATORS || []).forEach(o => { o.whatsapp = window.CONFIG.visitorDeskWhatsApp; });
