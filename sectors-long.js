/* =====================================================================
   SECTOR LONG-FORM — clickable "Invest & Learn" detail pages.
   Mirrors attractions-long.js: keeps heavy bilingual content out of the
   card data (data.js → window.INVESTMENTS) so listing cards stay light.

   Shape per sector id (must match an id in window.INVESTMENTS.sectors):
     intro:    { en:[paragraphs], sw:[paragraphs] }   // the opportunity
     learn:    { en:[skills],     sw:[skills] }        // what to learn / master
     start:    { en:[steps],      sw:[steps] }         // how to get started
     partners: { en:[who],        sw:[who] }           // who to work with locally
   ===================================================================== */
window.SECTOR_LONG = {

  tourism: {
    intro: {
      en: [
        "Arusha is the gateway to Tanzania's northern safari circuit — Serengeti, Ngorongoro Crater, Tarangire, Lake Manyara and Mount Kilimanjaro all start here. Over 1.8 million international visitors reach Tanzania each year, and the majority who come for wildlife pass through Arusha first.",
        "AFCON Pamoja 2027 turns a global football audience toward the city. Every match day leaves free hours; every travelling fan is a potential safari-goer. Lodges, boutique hotels, eco-camps, transport, guiding and experience products all have room to grow — especially those that let a fan turn a 90-minute match into a three-day memory."
      ],
      sw: [
        "Arusha ni lango la mzunguko wa utalii wa kaskazini mwa Tanzania — Serengeti, Bonde la Ngorongoro, Tarangire, Ziwa Manyara na Mlima Kilimanjaro vyote vinaanzia hapa. Zaidi ya wageni milioni 1.8 wa kimataifa hufika Tanzania kila mwaka, na wengi wanaokuja kwa ajili ya wanyamapori hupitia Arusha kwanza.",
        "AFCON Pamoja 2027 inavutia hadhira ya soka duniani kuja mjini. Kila siku ya mechi inaacha masaa ya ziada; kila shabiki anayesafiri ni mteja wa safari ya wanyama. Loji, hoteli, kambi za kiikolojia, usafiri, uongozaji na bidhaa za matukio — vyote vina nafasi ya kukua, hasa vinavyomwezesha shabiki kubadili mechi ya dakika 90 kuwa kumbukumbu ya siku tatu."
      ]
    },
    learn: {
      en: ["Guiding & wildlife knowledge (birds, mammals, ecology, safety)", "Hospitality & front-of-house service to international standard", "Digital booking, reviews and reputation management", "Basic French, Arabic or Portuguese for AFCON visitors"],
      sw: ["Uongozaji na maarifa ya wanyamapori (ndege, mamalia, ikolojia, usalama)", "Ukarimu na huduma ya mstari wa mbele kwa kiwango cha kimataifa", "Uwekaji nafasi mtandaoni, reviews na usimamizi wa sifa", "Kifaransa, Kiarabu au Kireno cha msingi kwa wageni wa AFCON"]
    },
    start: {
      en: ["Register your business and get a TALA / tour operator licence where required", "Partner with a licensed operator first to build a track record", "List your rooms or experiences on this platform and global channels", "Start small, collect reviews, then reinvest into capacity"],
      sw: ["Sajili biashara yako na upate leseni ya TALA / mwendeshaji utalii inapohitajika", "Shirikiana kwanza na mwendeshaji mwenye leseni ili kujenga rekodi", "Orodhesha vyumba au matukio yako kwenye jukwaa hili na njia za kimataifa", "Anza kidogo, kusanya reviews, kisha wekeza tena kuongeza uwezo"]
    },
    partners: {
      en: ["Tanzania Tourist Board & TALA for licensing", "Licensed Arusha tour operators (see our Operators page)", "Hotels and transport SACCOs for shared bookings"],
      sw: ["Bodi ya Utalii Tanzania na TALA kwa leseni", "Waendeshaji utalii wenye leseni wa Arusha (angalia ukurasa wa Operators)", "Hoteli na SACCOs za usafiri kwa nafasi za pamoja"]
    }
  },

  agri: {
    intro: {
      en: [
        "The volcanic slopes of Mount Meru give Arusha some of the most fertile soil in East Africa. The region is Tanzania's number-one producer of certified seed, and a leading exporter of coffee, cut flowers, avocado and vegetables — much of it air-freighted to Europe within 48 hours through Kilimanjaro International Airport.",
        "Three learning tracks are especially open to young people and new investors: horticulture (roses, vegetables, seed multiplication under greenhouses), dairy (improved cattle, milk collection and cold chain), and beekeeping (honey and beeswax from Meru's forest edge). Each needs relatively little land to start and rewards skill and consistency more than capital."
      ],
      sw: [
        "Miteremko ya volkano ya Mlima Meru inaipa Arusha udongo wenye rutuba zaidi Afrika Mashariki. Mkoa huu ni namba moja Tanzania kwa uzalishaji wa mbegu bora, na kinara wa kusafirisha kahawa, maua, parachichi na mboga — vingi vinapelekwa Ulaya ndani ya saa 48 kupitia Uwanja wa Ndege wa Kilimanjaro.",
        "Njia tatu za kujifunza zipo wazi hasa kwa vijana na wawekezaji wapya: kilimo-bustani (waridi, mboga, uzalishaji wa mbegu kwenye greenhouse), maziwa (ng'ombe bora, ukusanyaji wa maziwa na mnyororo wa ubaridi), na ufugaji nyuki (asali na nta kutoka ukingo wa msitu wa Meru). Kila moja inahitaji ardhi kidogo kuanza na inalipa ujuzi na uthabiti zaidi ya mtaji."
      ]
    },
    learn: {
      en: ["Horticulture: greenhouse management, drip irrigation, grading & cold chain", "Dairy: improved breeds, feed formulation, hygienic milking, milk testing", "Beekeeping: Langstroth hives, harvesting, honey processing & packaging", "Post-harvest handling and export quality standards (GlobalGAP basics)"],
      sw: ["Kilimo-bustani: usimamizi wa greenhouse, umwagiliaji wa matone, upangaji wa daraja na mnyororo wa ubaridi", "Maziwa: mbari bora, uchanganyaji wa chakula, ukamuaji wa usafi, upimaji wa maziwa", "Ufugaji nyuki: mizinga ya Langstroth, uvunaji, usindikaji wa asali na ufungashaji", "Utunzaji baada ya mavuno na viwango vya ubora wa nje (misingi ya GlobalGAP)"]
    },
    start: {
      en: ["Pick ONE track (horticulture, dairy or beekeeping) and train on it properly", "Start on 1/4 acre or 3–5 hives / 2–3 dairy cows — prove the unit economics", "Join a cooperative or out-grower scheme for inputs and guaranteed buyers", "Add value locally (packed honey, cooled milk, graded flowers) before scaling"],
      sw: ["Chagua njia MOJA (kilimo-bustani, maziwa au nyuki) na ujifunze vizuri", "Anza na robo eka au mizinga 3–5 / ng'ombe 2–3 — thibitisha uchumi wa kipimo", "Jiunge na ushirika au mpango wa wakulima kwa pembejeo na wanunuzi wa uhakika", "Ongeza thamani hapa (asali iliyofungashwa, maziwa yaliyopozwa, maua yaliyopangwa) kabla ya kupanua"]
    },
    partners: {
      en: ["TAHA (Tanzania Horticultural Association) for market links & training", "Local dairy cooperatives and milk collection centres", "District beekeeping officers and forest-edge honey groups"],
      sw: ["TAHA (Chama cha Kilimo-bustani Tanzania) kwa masoko na mafunzo", "Ushirika wa maziwa na vituo vya ukusanyaji maziwa", "Maafisa nyuki wa wilaya na vikundi vya asali vya ukingo wa msitu"]
    }
  },

  tanzanite: {
    intro: {
      en: [
        "Tanzanite is found in exactly one place on Earth: the Mererani hills, a short drive from Arusha. The stone is up to a thousand times rarer than diamond, yet most of the value has historically left the country as rough rock.",
        "The real opportunity is value-addition: cutting, polishing, grading, certification and jewellery-making done here in Arusha. The Mererani controlled trading hub gives licensed buyers a formal, traceable market — and every stone finished locally keeps more of its worth in Tanzanian hands."
      ],
      sw: [
        "Tanzanite hupatikana sehemu moja tu duniani: milima ya Mererani, safari fupi kutoka Arusha. Jiwe hili ni adimu hadi mara elfu moja kuliko almasi, lakini kihistoria thamani nyingi imeondoka nchini kama jiwe ghafi.",
        "Fursa halisi ni kuongeza thamani: ukataji, ung'arishaji, upangaji wa daraja, uthibitisho na usonara ufanyike hapa Arusha. Soko rasmi la Mererani linawapa wanunuzi wenye leseni soko lenye ufuatiliaji — na kila jiwe linalomalizika hapa linabakiza thamani zaidi mikononi mwa Watanzania."
      ]
    },
    learn: {
      en: ["Gemmology basics: identifying, grading and valuing tanzanite", "Lapidary skills — cutting and polishing to international cut standards", "Certification, ethics and traceability (conflict-free sourcing)", "Jewellery design and finishing for export markets"],
      sw: ["Misingi ya jemolojia: kutambua, kupanga daraja na kuthamini tanzanite", "Ujuzi wa ukataji na ung'arishaji kwa viwango vya kimataifa", "Uthibitisho, maadili na ufuatiliaji (chanzo kisicho na migogoro)", "Ubunifu wa vito na umaliziaji kwa masoko ya nje"]
    },
    start: {
      en: ["Get a dealer/broker licence and trade only through the Mererani hub", "Train in lapidary at a recognised centre before buying rough stock", "Build relationships with certified graders and export agents", "Sell finished, certified pieces — not rough — to capture the margin"],
      sw: ["Pata leseni ya dila/dalali na fanya biashara kupitia soko la Mererani pekee", "Jifunze ukataji katika kituo kinachotambulika kabla ya kununua ghafi", "Jenga uhusiano na wapangaji daraja walioidhinishwa na mawakala wa nje", "Uza vito vilivyomalizika, vilivyothibitishwa — si ghafi — ili kupata faida"]
    },
    partners: {
      en: ["Mererani controlled trading hub & mining authorities", "Licensed gemmology and lapidary training centres", "Certified grading laboratories and export agents"],
      sw: ["Soko rasmi la Mererani na mamlaka za madini", "Vituo vyenye leseni vya mafunzo ya jemolojia na ukataji", "Maabara za upangaji daraja na mawakala wa usafirishaji nje"]
    }
  },

  mice: {
    intro: {
      en: [
        "Arusha is East Africa's diplomatic capital. It hosts the East African Community headquarters and the Arusha International Conference Centre (AICC), drawing diplomats, NGOs, courts and business travellers all year round — not just in tourist season.",
        "That steady, high-spending flow supports conference tourism, serviced apartments, hotels and mixed-use real estate (MICE: Meetings, Incentives, Conferences, Exhibitions). Demand is year-round and less weather-dependent than safari, making it a resilient complement to tourism."
      ],
      sw: [
        "Arusha ni mji wa kidiplomasia wa Afrika Mashariki. Ni makao makuu ya Jumuiya ya Afrika Mashariki na Kituo cha Mikutano cha Kimataifa cha Arusha (AICC), kikivutia wanadiplomasia, NGOs, mahakama na wafanyabiashara mwaka mzima — si msimu wa utalii pekee.",
        "Mtiririko huu wa uhakika, wenye matumizi makubwa, unasaidia utalii wa mikutano, apartments, hoteli na majengo ya matumizi mchanganyiko (MICE). Mahitaji ni ya mwaka mzima na hayategemei hali ya hewa kama safari, na hivyo ni nyongeza thabiti kwa utalii."
      ]
    },
    learn: {
      en: ["Event & conference management and logistics", "Serviced-apartment and property management", "Corporate hospitality and protocol for delegates", "Digital marketing to reach international conference organisers"],
      sw: ["Usimamizi wa matukio na mikutano na uratibu", "Usimamizi wa apartments na majengo", "Ukarimu wa kimashirika na itifaki kwa wajumbe", "Masoko ya kidijitali kufikia waandaaji wa mikutano wa kimataifa"]
    },
    start: {
      en: ["Start with a service (catering, décor, AV, transport) before owning property", "Register with AICC and hotels as an approved supplier", "Offer serviced short-stay apartments near the conference district", "Bundle stay + transport + experience packages for delegations"],
      sw: ["Anza na huduma (chakula, mapambo, sauti/picha, usafiri) kabla ya kumiliki jengo", "Jisajili AICC na hoteli kama msambazaji aliyeidhinishwa", "Toa apartments za muda mfupi karibu na eneo la mikutano", "Unganisha vifurushi vya malazi + usafiri + matukio kwa wajumbe"]
    },
    partners: {
      en: ["AICC and the EAC secretariat procurement offices", "Established Arusha hotels and DMCs (destination management)", "Local property developers and SACCOs"],
      sw: ["AICC na ofisi za manunuzi za sekretarieti ya EAC", "Hoteli na DMCs za Arusha zilizoimarika", "Wajenzi wa majengo wa ndani na SACCOs"]
    }
  },

  agroproc: {
    intro: {
      en: [
        "Arusha grows far more than it processes. Raw coffee, meat, dairy, honey, grains and fruit largely leave the region unfinished — which means the profit of roasting, packing and branding is being made somewhere else.",
        "Agro-processing closes that gap: coffee roasting, dairy products, animal feed, fruit drying, honey packing and food packaging. With the road and railway (SGR) corridor linking Arusha to Dar es Salaam port and the 300-million-person EAC market, a small processing unit can reach far beyond the region."
      ],
      sw: [
        "Arusha inazalisha zaidi ya inavyosindika. Kahawa ghafi, nyama, maziwa, asali, nafaka na matunda kwa kiasi kikubwa vinaondoka mkoani bila kumalizwa — maana yake faida ya kukaanga, kufungasha na kutengeneza brand inapatikana kwingine.",
        "Usindikaji wa mazao unaziba pengo hilo: kukaanga kahawa, bidhaa za maziwa, chakula cha mifugo, kukausha matunda, kufungasha asali na ufungashaji wa vyakula. Kwa barabara na reli (SGR) inayounganisha Arusha na bandari ya Dar es Salaam na soko la EAC la watu milioni 300, kiwanda kidogo cha usindikaji kinaweza kufika mbali zaidi ya mkoa."
      ]
    },
    learn: {
      en: ["Food processing, hygiene and safety standards (TBS / TFDA)", "Product development, packaging and branding", "Basic business finance, costing and pricing", "Quality control and shelf-life management"],
      sw: ["Usindikaji wa chakula, usafi na viwango vya usalama (TBS / TFDA)", "Ukuzaji wa bidhaa, ufungashaji na utengenezaji wa brand", "Fedha za msingi za biashara, ukokotoaji wa gharama na bei", "Udhibiti wa ubora na usimamizi wa muda wa bidhaa"]
    },
    start: {
      en: ["Choose one product you can source locally and sell reliably", "Get TBS/TFDA certification early — it unlocks shops and export", "Start with simple equipment and a clean, compliant space", "Build a brand and consistent quality before chasing volume"],
      sw: ["Chagua bidhaa moja unayoweza kupata hapa na kuuza kwa uhakika", "Pata uthibitisho wa TBS/TFDA mapema — unafungua maduka na soko la nje", "Anza na vifaa rahisi na eneo safi, linalozingatia sheria", "Jenga brand na ubora thabiti kabla ya kufuatilia wingi"]
    },
    partners: {
      en: ["Tanzania Bureau of Standards (TBS) and TFDA for certification", "SIDO (Small Industries Development Organisation) for equipment & training", "Farmer cooperatives for a steady raw-material supply"],
      sw: ["Shirika la Viwango Tanzania (TBS) na TFDA kwa uthibitisho", "SIDO (Shirika la Kuhudumia Viwanda Vidogo) kwa vifaa na mafunzo", "Ushirika wa wakulima kwa usambazaji wa uhakika wa malighafi"]
    }
  }

};
