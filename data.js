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
  mobileMoney: { name: "VELLAT COMPANY LIMITED", till: "M-Pesa Lipa 51219278" },
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
    desc: { en: "A women-run village experience on Meru's slopes — cheese, coffee, farms.", sw: "Kijiji kinachoongozwa na akina mama miteremko ya Meru — jibini, kahawa, mashamba." } }
];

/* ---------- INVEST IN ARUSHA — sectors shown inside the registered-tourist area ---------- */
window.INVESTMENTS = {
  sectors: [
    { id: "tourism",  icon: "🦁",
      name: { en: "Tourism & Hospitality", sw: "Utalii na Ukarimu" },
      stat: { en: "1.8M+ int'l visitors to Tanzania/year — the northern circuit starts in Arusha", sw: "Wageni 1.8M+ wa kimataifa kwa mwaka — mzunguko wa kaskazini unaanzia Arusha" },
      desc: { en: "Lodges, hotels, tour operations, eco-camps and adventure products around Serengeti, Ngorongoro and Kilimanjaro. AFCON 2027 adds a continental spotlight.", sw: "Loji, hoteli, kampuni za safari na kambi za kiikolojia kuzunguka Serengeti, Ngorongoro na Kilimanjaro. AFCON 2027 inaongeza umaarufu wa kibara." } },
    { id: "agri",     icon: "🌾",
      name: { en: "Agriculture & Horticulture", sw: "Kilimo na Kilimo-bustani" },
      stat: { en: "Arusha exports coffee, flowers & vegetable seeds — #1 seed-producing region", sw: "Arusha inasafirisha kahawa, maua na mbegu — mkoa #1 kwa uzalishaji wa mbegu" },
      desc: { en: "Fertile volcanic soils on Meru's slopes: coffee estates, avocado, floriculture greenhouses and seed multiplication with direct air-freight via KIA.", sw: "Udongo wa volkano wenye rutuba: mashamba ya kahawa, parachichi, maua ya kijani-nyumba na uzalishaji wa mbegu — usafirishaji wa moja kwa moja kupitia KIA." } },
    { id: "tanzanite",icon: "💎",
      name: { en: "Tanzanite & Mining", sw: "Tanzanite na Madini" },
      stat: { en: "Tanzanite exists in ONE place on Earth: Mererani, Arusha region", sw: "Tanzanite inapatikana sehemu MOJA tu duniani: Mererani, mkoa wa Arusha" },
      desc: { en: "Value-addition is the opportunity: cutting, polishing, certification and jewellery — supported by the Mererani controlled trading hub.", sw: "Fursa ni kuongeza thamani: ukataji, ung'arishaji, uthibitisho na usonara — ikisaidiwa na soko rasmi la Mererani." } },
    { id: "mice",     icon: "🏢",
      name: { en: "Conference Tourism & Real Estate (MICE)", sw: "Utalii wa Mikutano na Majengo (MICE)" },
      stat: { en: "Arusha hosts the EAC HQ & AICC — East Africa's diplomatic capital", sw: "Arusha ni makao makuu ya EAC na AICC — mji wa kidiplomasia wa Afrika Mashariki" },
      desc: { en: "International conferences, serviced apartments, hotels and mixed-use property serving diplomats, NGOs and business travellers year-round.", sw: "Mikutano ya kimataifa, apartments, hoteli na majengo ya biashara yanayohudumia wanadiplomasia, NGOs na wafanyabiashara mwaka mzima." } },
    { id: "agroproc", icon: "🏭",
      name: { en: "Agro-processing & Manufacturing", sw: "Usindikaji wa Mazao na Viwanda" },
      stat: { en: "Raw coffee, meat, dairy & grains ready for local value-addition", sw: "Kahawa, nyama, maziwa na nafaka vinasubiri kuongezwa thamani hapa hapa" },
      desc: { en: "Process what the region grows: coffee roasting, dairy, animal feed, packaging — with the SGR/road corridor linking to Dar port and EAC markets.", sw: "Sindika kinachozalishwa mkoani: kukaanga kahawa, maziwa, chakula cha mifugo, ufungashaji — barabara na reli kuunganisha bandari ya Dar na soko la EAC." } }
  ],
  safety: [
    { icon: "🕊️", en: "Decades of peace & political stability — Tanzania is among Africa's most stable nations", sw: "Miongo ya amani na utulivu wa kisiasa — Tanzania ni miongoni mwa nchi tulivu zaidi Afrika" },
    { icon: "🏛️", en: "TIC one-stop centre: investor visas, permits and land access in one office", sw: "Kituo kimoja cha TIC: visa za wawekezaji, vibali na upatikanaji wa ardhi ofisi moja" },
    { icon: "🌍", en: "EAC headquarters city — direct access to a 300M+ person market", sw: "Mji wa makao makuu ya EAC — soko la watu 300M+ moja kwa moja" },
    { icon: "✈️", en: "Kilimanjaro International Airport (KIA) 40 min away, direct EU & Gulf flights", sw: "Uwanja wa ndege wa KIA dakika 40, safari za moja kwa moja Ulaya na Ghuba" },
    { icon: "⚖️", en: "Investment protected by law (Tanzania Investment Act) & int'l guarantees (MIGA)", sw: "Uwekezaji unalindwa kisheria (Sheria ya Uwekezaji) na dhamana za kimataifa (MIGA)" }
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
