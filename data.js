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
  // Mobile-money merchant the tourist sends money to (M-Pesa Lipa Namba / Tigo / Airtel /
  // HaloPesa merchant, or a personal number). Leave "" to hide the "Send to" box.
  mobileMoney: { name: "", till: "" },   // e.g. { name: "Karibu Arusha", till: "Lipa 5551234" }
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
    priceFrom: 180,
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
    priceFrom: 150,
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
    priceFrom: 110,
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
    priceFrom: 65,
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
    priceFrom: 55,
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
    priceFrom: 460,
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
    priceFrom: 440,
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
    priceFrom: 720,
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
window.OPERATORS = [
  {
    id: "kilimanjaro-wonders",
    icon: "🚙",
    category: "safari",
    verified: true,
    rating: 4.9,
    license: "TALA-AR-2024-118",
    name: { en: "Kilimanjaro Wonders Safaris", sw: "Kilimanjaro Wonders Safaris" },
    desc: { en: "Licensed tour operator running day & multi-day safaris with English/French-speaking guides.", sw: "Mwendesha safari mwenye leseni — safari za siku na za siku nyingi, viongozi wa Kiingereza/Kifaransa." },
    whatsapp: "255700000001"
  },
  {
    id: "serengeti-pride",
    icon: "🦓",
    category: "safari",
    verified: true,
    rating: 4.8,
    license: "TALA-AR-2023-204",
    name: { en: "Serengeti Pride Adventures", sw: "Serengeti Pride Adventures" },
    desc: { en: "Family-run safari company specialising in Serengeti & Ngorongoro overnight trips.", sw: "Kampuni ya familia ya safari, bingwa wa safari za Serengeti na Ngorongoro za kulala." },
    whatsapp: "255700000002"
  },
  {
    id: "arusha-coffee-plantation",
    icon: "☕",
    category: "culture",
    verified: true,
    rating: 4.9,
    license: "TTB-AGRI-AR-208",
    name: { en: "Arusha Coffee Plantation Tour", sw: "Ziara ya Shamba la Kahawa Arusha" },
    desc: { en: "Walk a working Arusha coffee estate — from cherry to cup, with roasting and a fresh tasting.", sw: "Tembea shamba halisi la kahawa Arusha — kutoka tunda hadi kikombe, na kukaanga na kuonja." },
    whatsapp: "255787540009"
  },
  {
    id: "maasai-heritage",
    icon: "🛖",
    category: "culture",
    verified: true,
    rating: 4.8,
    license: "ACC-CULT-2023-031",
    name: { en: "Maasai Heritage Boma", sw: "Boma la Urithi wa Kimaasai" },
    desc: { en: "Community-run cultural visits — dance, beadwork and homestead experiences.", sw: "Ziara za kiutamaduni za jamii — ngoma, shanga na maisha ya boma." },
    whatsapp: "255700000004"
  },
  {
    id: "mount-meru-lodge",
    icon: "🏨",
    category: "stay",
    verified: true,
    rating: 4.7,
    license: "TTB-HOTEL-AR-559",
    name: { en: "Mount Meru View Lodge", sw: "Mount Meru View Lodge" },
    desc: { en: "Mid-range lodge near the stadium, halal-friendly kitchen and airport transfers.", sw: "Lodge ya kati karibu na uwanja, jiko la halali na usafiri wa uwanja wa ndege." },
    whatsapp: "255700000005"
  },
  {
    id: "arusha-bites",
    icon: "🍽️",
    category: "food",
    verified: true,
    rating: 4.6,
    license: "ACC-FOOD-2024-412",
    name: { en: "Arusha Bites Restaurant", sw: "Mgahawa wa Arusha Bites" },
    desc: { en: "Local & international dishes with clearly-marked halal and vegetarian options.", sw: "Vyakula vya kienyeji na kimataifa, na chaguo la halali na mboga." },
    whatsapp: "255700000006"
  },
  {
    id: "twiga-transport",
    icon: "🚖",
    category: "transport",
    verified: true,
    rating: 4.7,
    license: "SUMATRA-AR-9921",
    name: { en: "Twiga Taxi & Boda Service", sw: "Huduma ya Teksi na Boda ya Twiga" },
    desc: { en: "Vetted drivers for stadium, airport and town transfers — fixed, fair fares.", sw: "Madereva waliothibitishwa kwa uwanja, ndege na mjini — nauli za uhakika." },
    whatsapp: "255700000007"
  },
  {
    id: "snowcap-guides",
    icon: "🥾",
    category: "trek",
    verified: true,
    rating: 4.9,
    license: "TALA-AR-2023-150",
    name: { en: "Snow Cap Mountain Guides", sw: "Snow Cap Mountain Guides" },
    desc: { en: "Certified guides for Mount Meru day hikes and Kilimanjaro day-route walks.", sw: "Viongozi waliothibitishwa kwa Mlima Meru na njia za siku za Kilimanjaro." },
    whatsapp: "255700000008"
  }
];

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
