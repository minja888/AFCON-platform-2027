/* =====================================================================
   CULTURAL TOURISM — deep, clickable aspects of Arusha's living culture.
   Surfaced in Explore (registered area) as a grid of aspect cards; each
   opens a detail page at #/culture/:id with an intro + clickable
   sub-aspect sections (a chip nav that scrolls within the page).

   window.CULTURE      — light card data for the listing grid.
   window.CULTURE_LONG — deep bilingual content per aspect:
        intro:   { en:[paragraphs], sw:[paragraphs] }
        sections:[ { id, name:{en,sw}, body:{ en:[paras], sw:[paras] } } ]
   ===================================================================== */
window.CULTURE = [
  { id: "peoples",    ic: "users",   grad: "grad-brown",
    name: { en: "Tribes & People", sw: "Makabila na Watu" },
    tag:  { en: "Maasai, Hadzabe, Meru, Chagga & Iraqw", sw: "Wamaasai, Hadzabe, Wameru, Wachagga na Iraqw" } },
  { id: "medicine",   ic: "sprout",  grad: "grad-green",
    name: { en: "Traditional Medicine", sw: "Dawa za Asili" },
    tag:  { en: "Healing plants & the knowledge of healers", sw: "Mimea ya tiba na maarifa ya waganga" } },
  { id: "food",       ic: "camera",  grad: "grad-gold",
    name: { en: "Food & Cuisine", sw: "Chakula na Vyakula" },
    tag:  { en: "Ugali, nyama choma, ndizi & Arabica coffee", sw: "Ugali, nyama choma, ndizi na kahawa" } },
  { id: "dance",      ic: "star",    grad: "grad-red",
    name: { en: "Dance & Music", sw: "Ngoma na Muziki" },
    tag:  { en: "Maasai adumu, ngoma drums & bongo flava", sw: "Adumu ya Wamaasai, ngoma na bongo flava" } },
  { id: "dress",      ic: "gem",     grad: "grad-teal",
    name: { en: "Dress & Adornment", sw: "Mavazi na Mapambo" },
    tag:  { en: "The red shuka, beadwork & kitenge", sw: "Shuka nyekundu, shanga na kitenge" } },
  { id: "ceremonies", ic: "building", grad: "grad-brown",
    name: { en: "Ceremonies & Shows", sw: "Sherehe na Maonyesho" },
    tag:  { en: "Rites of passage, weddings & cultural bomas", sw: "Jando, harusi na maonyesho ya boma" } },
  { id: "agro",       ic: "sprout",  grad: "grad-green",
    name: { en: "Agro-tourism", sw: "Utalii wa Kilimo" },
    tag:  { en: "Coffee tours, farm stays, honey & flowers", sw: "Ziara za kahawa, malazi shambani, asali na maua" } }
];

window.CULTURE_LONG = {

  peoples: {
    intro: {
      en: [
        "Arusha is one of the most culturally rich corners of Africa. Within a day's drive live peoples whose ways of life span thousands of years — from the last hunter-gatherers on the continent to proud pastoralists and skilled mountain farmers. Meeting them respectfully, on their terms, is the deepest experience Arusha offers.",
        "Cultural tourism here is community-run: many villages host visitors directly, so the money you spend supports schools, water and the families you meet. Always go with a licensed guide or a recognised cultural programme, ask before photographing people, and come to learn rather than to stare."
      ],
      sw: [
        "Arusha ni mojawapo ya pembe zenye utajiri mkubwa wa utamaduni Afrika. Ndani ya safari ya siku moja wanaishi watu wenye maisha ya maelfu ya miaka — kuanzia wawindaji-wakusanyaji wa mwisho barani hadi wafugaji wenye fahari na wakulima hodari wa milimani. Kukutana nao kwa heshima, kwa masharti yao, ndiyo uzoefu wa kina zaidi Arusha inatoa.",
        "Utalii wa utamaduni hapa unaendeshwa na jamii: vijiji vingi hupokea wageni moja kwa moja, hivyo pesa unayotumia inasaidia shule, maji na familia unazokutana nazo. Nenda daima na kiongozi mwenye leseni au programu inayotambulika, omba ruhusa kabla ya kupiga picha, na uje kujifunza si kutazama tu."
      ]
    },
    sections: [
      { id: "maasai", name: { en: "The Maasai", sw: "Wamaasai" }, body: {
        en: ["The Maasai are Arusha's most recognisable people — semi-nomadic pastoralists whose lives revolve around cattle, which are wealth, food and identity in one. Age-sets guide a man's life from boyhood to warrior (moran) to elder, and the red shuka cloth and beadwork are read like a language of status and clan.", "Visit a Maasai boma (homestead) to see how homes are built from mud and dung, how the enkang is fenced against lions, and to hear the low, powerful chanting that lifts the famous jumping dance."],
        sw: ["Wamaasai ndio watu wanaotambulika zaidi Arusha — wafugaji wa kuhamahama ambao maisha yao yanazunguka ng'ombe, ambao ni utajiri, chakula na utambulisho kwa pamoja. Makundi ya rika yanaongoza maisha ya mwanamume kutoka utoto hadi shujaa (moran) hadi mzee, na shuka nyekundu na shanga husomwa kama lugha ya hadhi na ukoo.", "Tembelea boma la Kimaasai kuona jinsi nyumba zinavyojengwa kwa udongo na kinyesi, jinsi enkang inavyozungushwa uzio dhidi ya simba, na kusikia uimbaji wa kina unaoinua ngoma maarufu ya kuruka."] } },
      { id: "hadzabe", name: { en: "The Hadzabe", sw: "Wahadzabe" }, body: {
        en: ["Around Lake Eyasi live the Hadzabe, one of the last true hunter-gatherer peoples on Earth, speaking a click language unrelated to any other. They hunt with hand-made bows and gather roots, berries and wild honey exactly as their ancestors did for tens of thousands of years.", "A dawn hunt with the Hadzabe — walking silently through the bush, learning to make fire by hand — is humbling, and one of the rarest cultural encounters left on the planet."],
        sw: ["Kuzunguka Ziwa Eyasi wanaishi Wahadzabe, mojawapo ya watu wa mwisho kweli wa uwindaji-ukusanyaji duniani, wakizungumza lugha ya mibofyo isiyohusiana na nyingine yoyote. Wanawinda kwa pinde za mkono na kukusanya mizizi, matunda na asali ya porini kama walivyofanya mababu zao kwa makumi ya maelfu ya miaka.", "Uwindaji wa alfajiri na Wahadzabe — kutembea kimya porini, kujifunza kuwasha moto kwa mkono — unadhalilisha kiburi, na ni mojawapo ya makutano adimu zaidi ya utamaduni yaliyobaki duniani."] } },
      { id: "meru", name: { en: "Meru & Arusha peoples", sw: "Wameru na Waarusha" }, body: {
        en: ["On the slopes of Mount Meru live the WaMeru and WaArusha, skilled farmers who turned volcanic soil into terraced gardens of banana, coffee and vegetables. Their history includes the famous 1952 Meru Land Case, taken all the way to the United Nations — an early symbol of African self-determination.", "Their villages are welcoming and green, and cultural walks here combine farming knowledge with waterfalls, coffee and warm hospitality."],
        sw: ["Kwenye miteremko ya Mlima Meru wanaishi Wameru na Waarusha, wakulima hodari waliogeuza udongo wa volkano kuwa bustani za matuta za ndizi, kahawa na mboga. Historia yao inajumuisha Kesi maarufu ya Ardhi ya Meru ya 1952, iliyofikishwa hadi Umoja wa Mataifa — ishara ya mapema ya kujitawala kwa Waafrika.", "Vijiji vyao ni vya kukaribisha na vya kijani, na matembezi ya kitamaduni hapa yanachanganya maarifa ya kilimo na maporomoko ya maji, kahawa na ukarimu wa joto."] } },
      { id: "iraqw", name: { en: "Iraqw & neighbours", sw: "Iraqw na majirani" }, body: {
        en: ["South toward Karatu and Mbulu live the Iraqw, farmers and cattle-keepers with roots reaching back to ancient Cushitic migrations, known for distinctive underground-linked homesteads and rich oral tradition. Nearby are the Datooga, master blacksmiths and pastoralists.", "This mix of Bantu, Nilotic, Cushitic and Khoisan peoples in one small region makes Arusha a living museum of how humanity has lived across the ages."],
        sw: ["Kusini kuelekea Karatu na Mbulu wanaishi Iraqw, wakulima na wafugaji wenye mizizi inayofikia uhamiaji wa kale wa Kikushi, wanaojulikana kwa makazi ya kipekee na mapokeo tajiri ya masimulizi. Karibu nao wapo Datooga, wahunzi mahiri na wafugaji.", "Mchanganyiko huu wa watu wa Kibantu, Kiniloti, Kikushi na Khoisan katika mkoa mmoja mdogo unafanya Arusha kuwa jumba la makumbusho hai la jinsi binadamu alivyoishi vizazi vyote."] } }
    ]
  },

  medicine: {
    intro: {
      en: [
        "Long before pharmacies, the peoples of Arusha built deep knowledge of the plants growing around Meru, the Rift forests and the savannah. This traditional medicine is still practised today — often alongside modern clinics — and is passed down carefully through families and healers.",
        "Cultural programmes let visitors walk with a knowledgeable elder to learn how bark, roots and leaves are used. Treat it as living science and heritage: never harvest plants yourself, and see any healing practice as culture to respect, not a remedy to self-prescribe."
      ],
      sw: [
        "Kabla ya maduka ya dawa, watu wa Arusha walijenga maarifa ya kina ya mimea inayoota kuzunguka Meru, misitu ya Bonde la Ufa na savana. Dawa hii ya asili bado inatumika hadi leo — mara nyingi pamoja na zahanati za kisasa — na inarithishwa kwa uangalifu kupitia familia na waganga.",
        "Programu za kitamaduni zinawaruhusu wageni kutembea na mzee mwenye maarifa kujifunza jinsi magome, mizizi na majani vinavyotumika. Ichukulie kama sayansi hai na urithi: usivune mimea mwenyewe, na uone tiba yoyote kama utamaduni wa kuheshimu, si dawa ya kujiandikia."
      ]
    },
    sections: [
      { id: "pharmacy", name: { en: "The bush pharmacy", sw: "Duka la dawa la porini" }, body: {
        en: ["The Maasai are famous for a working knowledge of dozens of medicinal plants. The olkiloriti (acacia) bark is boiled into a strengthening soup; aloe treats wounds and stomach trouble; and roots like olmagirigiriani are used for chest complaints. Much of this knowledge is now being studied by scientists.", "On a guided walk you learn to recognise these plants and hear the stories that keep the knowledge alive from one generation to the next."],
        sw: ["Wamaasai ni maarufu kwa maarifa ya vitendo ya mimea kadhaa ya tiba. Gome la olkiloriti (mgunga) huchemshwa kuwa supu ya kuimarisha mwili; aloe hutibu vidonda na matatizo ya tumbo; na mizizi kama olmagirigiriani hutumika kwa matatizo ya kifua. Maarifa haya mengi sasa yanachunguzwa na wanasayansi.", "Kwenye matembezi yenye kiongozi unajifunza kutambua mimea hii na kusikia hadithi zinazoweka maarifa hai kutoka kizazi kimoja hadi kingine."] } },
      { id: "healers", name: { en: "Healers & knowledge keepers", sw: "Waganga na walinzi wa maarifa" }, body: {
        en: ["The Maasai laibon and the wider mganga wa jadi (traditional healer) hold both herbal skill and a spiritual role in the community — advising on health, disputes and ceremonies. Their standing rests on decades of learning, and their craft is a respected profession, not superstition.", "Meeting a healer through a proper cultural programme is a window into a whole worldview of balance between people, cattle, land and ancestors."],
        sw: ["Laibon wa Kimaasai na mganga wa jadi kwa upana wana ujuzi wa mitishamba na jukumu la kiroho katika jamii — wakishauri kuhusu afya, migogoro na sherehe. Hadhi yao inategemea miongo ya kujifunza, na kazi yao ni taaluma inayoheshimika, si ushirikina.", "Kukutana na mganga kupitia programu sahihi ya kitamaduni ni dirisha la mtazamo mzima wa uwiano kati ya watu, ng'ombe, ardhi na mababu."] } },
      { id: "wellness", name: { en: "Wellness today", sw: "Ustawi leo" }, body: {
        en: ["Modern Arusha blends the old and new: markets sell dried herbs and honey remedies beside pharmacies, and some lodges offer plant-based treatments and steam therapies rooted in local knowledge. Coffee, honey, moringa and aloe grown here are increasingly packaged as natural wellness products.", "It is a chance to buy something authentic and support the farmers and healers who keep the tradition — always from ethical, clearly labelled sources."],
        sw: ["Arusha ya kisasa inachanganya cha zamani na kipya: masoko yanauza mitishamba kavu na tiba za asali kando ya maduka ya dawa, na baadhi ya loji hutoa tiba za mimea na mvuke zenye mizizi ya maarifa ya wenyeji. Kahawa, asali, moringa na aloe inayolimwa hapa inazidi kufungashwa kama bidhaa za ustawi asilia.", "Ni fursa ya kununua kitu halisi na kusaidia wakulima na waganga wanaotunza mila — daima kutoka vyanzo vya kimaadili vyenye lebo wazi."] } }
    ]
  },

  food: {
    intro: {
      en: [
        "Arusha eats well. Fertile farms, cattle herds, highland coffee and a crossroads location have created a cuisine that ranges from smoky roast meat to fresh mountain vegetables and some of the best coffee on Earth. Sharing food is central to Tanzanian hospitality — a guest is never allowed to leave hungry.",
        "A food tour of Arusha means market stalls, street grills, a Chagga banana kitchen and a coffee farm all in one day. Come with an open appetite and eat with your hands where locals do — it is part of the welcome."
      ],
      sw: [
        "Arusha inakula vizuri. Mashamba yenye rutuba, makundi ya ng'ombe, kahawa ya milimani na eneo la njia panda vimeunda vyakula vinavyoanzia nyama choma yenye moshi hadi mboga mpya za mlimani na kahawa bora zaidi duniani. Kushiriki chakula ni kiini cha ukarimu wa Kitanzania — mgeni haruhusiwi kuondoka na njaa.",
        "Ziara ya chakula Arusha inamaanisha vibanda vya soko, mizinga ya barabarani, jiko la ndizi la Kichagga na shamba la kahawa vyote kwa siku moja. Njoo na hamu wazi na ule kwa mkono pale wenyeji wanapofanya — ni sehemu ya karibu."
      ]
    },
    sections: [
      { id: "staples", name: { en: "Staples: ugali & ndizi", sw: "Vyakula vikuu: ugali na ndizi" }, body: {
        en: ["Ugali — a firm maize porridge — is the national comfort food, scooped by hand and dipped in stews of beans, greens (mchicha) or meat. On Meru's slopes the staple is often ndizi: cooking bananas simmered into hearty stews like mtori, a Chagga classic served to guests and new mothers alike.", "Simple, filling and deeply local, these dishes are the everyday heart of Arusha's table."],
        sw: ["Ugali — uji mgumu wa mahindi — ni chakula cha faraja cha taifa, kinachochotwa kwa mkono na kuchovywa kwenye mchuzi wa maharage, mchicha au nyama. Kwenye miteremko ya Meru chakula kikuu mara nyingi ni ndizi: ndizi za kupika zilizopikwa kuwa mchuzi mzito kama mtori, chakula cha kawaida cha Kichagga kinachotolewa kwa wageni na wazazi wapya.", "Rahisi, vinavyoshibisha na vya kienyeji sana, vyakula hivi ni moyo wa kila siku wa meza ya Arusha."] } },
      { id: "meat", name: { en: "Nyama choma & the Maasai diet", sw: "Nyama choma na chakula cha Kimaasai" }, body: {
        en: ["Nyama choma — slow-grilled goat or beef — is a national ritual, eaten with kachumbari salad and ugali, best enjoyed slowly with friends. The Maasai traditionally live on milk, meat and blood from their cattle, a protein-rich diet perfectly suited to a pastoral life.", "Sharing a roast at a local 'choma' spot is one of the friendliest ways to spend an Arusha evening."],
        sw: ["Nyama choma — mbuzi au ng'ombe iliyochomwa taratibu — ni tambiko la taifa, huliwa na kachumbari na ugali, hufurahiwa zaidi taratibu na marafiki. Kimila Wamaasai huishi kwa maziwa, nyama na damu ya ng'ombe wao, chakula chenye protini nyingi kinachofaa kikamilifu maisha ya ufugaji.", "Kushiriki nyama choma kwenye kibanda cha wenyeji ni mojawapo ya njia za kirafiki zaidi za kutumia jioni ya Arusha."] } },
      { id: "coffee", name: { en: "Coffee & the Chagga cup", sw: "Kahawa na kikombe cha Kichagga" }, body: {
        en: ["The volcanic slopes of Meru and Kilimanjaro grow world-class Arabica coffee. On a farm tour you pick cherries, then pulp, dry, roast and grind them by hand before drinking a cup where it grew — a taste no café can match.", "Buying beans straight from the cooperative puts your money directly into the farming families' hands."],
        sw: ["Miteremko ya volkano ya Meru na Kilimanjaro inalima kahawa ya Arabica ya kiwango cha dunia. Kwenye ziara ya shamba unachuma matunda, kisha unamenya, unakausha, unakaanga na kusaga kwa mkono kabla ya kunywa kikombe pale kilipoota — ladha ambayo hakuna mgahawa unaweza kulinganisha.", "Kununua kahawa moja kwa moja kutoka ushirika kunaweka pesa yako moja kwa moja mikononi mwa familia za wakulima."] } },
      { id: "street", name: { en: "Markets & street food", sw: "Masoko na chakula cha barabarani" }, body: {
        en: ["Arusha's markets overflow with avocado, mango, passion fruit and spices. On the street, try chipsi mayai (chip omelette), sizzling mishkaki skewers, samosas and chapati, and sugarcane juice pressed while you watch — cheap, fresh and delicious.", "A guided market walk is the tastiest, most colourful introduction to daily life in the city."],
        sw: ["Masoko ya Arusha yamejaa parachichi, embe, passion na viungo. Barabarani, jaribu chipsi mayai, mishkaki inayochoma, sambusa na chapati, na juisi ya miwa iliyokamuliwa ukiangalia — rahisi, mpya na tamu.", "Matembezi ya soko yenye kiongozi ni utangulizi wa ladha na rangi zaidi wa maisha ya kila siku mjini."] } }
    ]
  },

  dance: {
    intro: {
      en: [
        "Music and dance are how Arusha's peoples mark every important moment — birth, coming of age, marriage, harvest and welcome. From the hypnotic chant of Maasai warriors to thundering drum ngoma and today's bongo flava, rhythm runs through daily life.",
        "Many cultural bomas and lodges host performances, but the most powerful experiences are the real ceremonies you may be invited to witness. Clap, join in when welcomed, and always ask before filming."
      ],
      sw: [
        "Muziki na ngoma ndiyo jinsi watu wa Arusha wanavyoadhimisha kila tukio muhimu — kuzaliwa, kuvunja ungo, ndoa, mavuno na kukaribisha. Kutoka uimbaji wa kuvutia wa mashujaa wa Kimaasai hadi ngoma za ngoma zenye radi na bongo flava ya leo, mdundo unapita katika maisha ya kila siku.",
        "Maonyesho ya boma na loji nyingi hufanya maonyesho, lakini uzoefu wenye nguvu zaidi ni sherehe halisi unazoweza kualikwa kushuhudia. Piga makofi, jiunge unapokaribishwa, na daima omba ruhusa kabla ya kupiga video."
      ]
    },
    sections: [
      { id: "adumu", name: { en: "The Maasai jumping dance", sw: "Ngoma ya kuruka ya Kimaasai" }, body: {
        en: ["Adumu, the famous 'jumping dance', is performed by moran (warriors) standing in a circle. One by one they leap straight up as high as they can, spine erect, while the group sings a deep rising and falling chant — a display of strength, stamina and pride.", "Guests are often invited to try; jumping alongside the warriors, cheered by the group, is unforgettable."],
        sw: ["Adumu, 'ngoma ya kuruka' maarufu, hufanywa na moran (mashujaa) wamesimama kwenye mduara. Mmoja baada ya mwingine wanaruka juu moja kwa moja juu kadri wawezavyo, mgongo wima, huku kundi likiimba uimbaji wa kina unaopanda na kushuka — onyesho la nguvu, uvumilivu na fahari.", "Wageni mara nyingi hualikwa kujaribu; kuruka pamoja na mashujaa, ukishangiliwa na kundi, hakusahauliki."] } },
      { id: "ngoma", name: { en: "Ngoma & drumming", sw: "Ngoma na midundo" }, body: {
        en: ["Across the region, ngoma means both the drum and the dance itself. Each community has its own rhythms for weddings, harvests and initiations, with drums, whistles, ankle bells and call-and-response singing driving dancers late into the night.", "These are participatory, joyful events — the audience is part of the performance."],
        sw: ["Katika mkoa mzima, ngoma inamaanisha ngoma yenyewe na densi pia. Kila jamii ina midundo yake kwa harusi, mavuno na jando, ikiwa na ngoma, filimbi, njuga za miguu na uimbaji wa kuitana ukiendesha wachezaji hadi usiku wa manane.", "Haya ni matukio ya kushiriki, ya furaha — hadhira ni sehemu ya onyesho."] } },
      { id: "modern", name: { en: "Modern sound: bongo flava", sw: "Sauti ya kisasa: bongo flava" }, body: {
        en: ["Tanzania's modern music scene is huge. Bongo flava — a home-grown blend of hip-hop, R&B and taarab — plays from every bus and bar, and coastal taarab and dance-band muziki wa dansi fill weddings and clubs.", "During AFCON 2027, expect live music everywhere; Arusha's nightlife will pulse with both traditional and modern beats."],
        sw: ["Ulingo wa muziki wa kisasa Tanzania ni mkubwa. Bongo flava — mchanganyiko wa nyumbani wa hip-hop, R&B na taarab — inasikika kutoka kila basi na baa, na taarab ya pwani na muziki wa dansi hujaza harusi na klabu.", "Wakati wa AFCON 2027, tarajia muziki wa moja kwa moja kila mahali; maisha ya usiku ya Arusha yatapiga kwa midundo ya kimila na ya kisasa."] } }
    ]
  },

  dress: {
    intro: {
      en: [
        "Clothing in Arusha is never just fabric — it carries clan, age, status and story. Nothing is more iconic than the Maasai red shuka and layered beadwork, but the bright kanga and kitenge cloths worn across town are just as full of meaning.",
        "Buying directly from artisans and women's cooperatives is the best souvenir you can bring home: it is authentic, it lasts, and it supports the makers who keep these crafts alive."
      ],
      sw: [
        "Mavazi Arusha si kitambaa tu — yanabeba ukoo, umri, hadhi na hadithi. Hakuna chenye ishara kubwa zaidi ya shuka nyekundu ya Kimaasai na shanga za tabaka, lakini kanga na kitenge za rangi zinazovaliwa mjini zimejaa maana vilevile.",
        "Kununua moja kwa moja kutoka kwa mafundi na ushirika wa wanawake ni zawadi bora zaidi unayoweza kupeleka nyumbani: ni halisi, inadumu, na inasaidia watengenezaji wanaotunza sanaa hizi."
      ]
    },
    sections: [
      { id: "shuka", name: { en: "The red shuka", sw: "Shuka nyekundu" }, body: {
        en: ["The Maasai shuka — usually a bold red plaid — is worn wrapped around the body against the highland cold and the sun. Red signals bravery and strength and is said to warn off lions; blue, striped and checked cloths carry their own meanings too.", "Durable and beautiful, a genuine shuka is one of the most practical and meaningful things you can take home."],
        sw: ["Shuka ya Kimaasai — kwa kawaida ya kaki nyekundu — huvaliwa ikizungushwa mwilini dhidi ya baridi ya milimani na jua. Nyekundu inaashiria ushujaa na nguvu na inasemekana huogofya simba; vitambaa vya buluu, mistari na miraba vina maana zao pia.", "Ya kudumu na nzuri, shuka halisi ni mojawapo ya vitu vya vitendo na vyenye maana zaidi unavyoweza kupeleka nyumbani."] } },
      { id: "beads", name: { en: "The language of beadwork", sw: "Lugha ya shanga" }, body: {
        en: ["Maasai women create intricate beaded collars, bracelets and earrings, and every colour speaks: red for bravery, white for peace and health, blue for the sky and rain, green for the land, orange for hospitality. A woman's jewellery can show whether she is married and how many children she has.", "Watching the beading and buying straight from the maker supports women's cooperatives directly."],
        sw: ["Wanawake wa Kimaasai hutengeneza kanga za shingo, bangili na hereni za shanga, na kila rangi inasema: nyekundu kwa ushujaa, nyeupe kwa amani na afya, buluu kwa anga na mvua, kijani kwa ardhi, machungwa kwa ukarimu. Mapambo ya mwanamke yanaweza kuonyesha kama ameolewa na ana watoto wangapi.", "Kuangalia utengenezaji wa shanga na kununua moja kwa moja kutoka kwa mtengenezaji kunasaidia ushirika wa wanawake moja kwa moja."] } },
      { id: "kitenge", name: { en: "Kanga & kitenge", sw: "Kanga na kitenge" }, body: {
        en: ["Off the plains, everyday Tanzanian style is the kanga and kitenge — vivid printed cloths worn as wraps, dresses and headscarves. The kanga famously carries a printed Swahili proverb (jina) along its edge, so it can send a message as well as dress the wearer.", "Local tailors will run up a custom kitenge shirt or dress in a day — a colourful, personal keepsake."],
        sw: ["Mbali na uwanda, mtindo wa kila siku wa Kitanzania ni kanga na kitenge — vitambaa vyenye chapa za rangi vinavyovaliwa kama vitambaa, nguo na hijabu. Kanga ni maarufu kwa kubeba methali ya Kiswahili (jina) pembeni, hivyo inaweza kutuma ujumbe pamoja na kumvisha mvaaji.", "Washonaji wa hapa watashona shati au vazi la kitenge kwa siku moja — kumbukumbu ya rangi na ya binafsi."] } }
    ]
  },

  ceremonies: {
    intro: {
      en: [
        "The great moments of life in Arusha are marked with ceremony — some private and sacred, others open shows that welcome visitors. From a boy's passage into warriorhood to a village wedding or a harvest celebration, these events reveal a culture's deepest values.",
        "You can enjoy staged cultural performances at bomas and lodges, or, with the right introduction and respect, be welcomed to a real celebration. Follow your guide's lead on what is public and what is sacred."
      ],
      sw: [
        "Matukio makubwa ya maisha Arusha yanaadhimishwa kwa sherehe — mengine ya faragha na matakatifu, mengine maonyesho wazi yanayokaribisha wageni. Kutoka mvulana kuingia ushujaa hadi harusi ya kijiji au sherehe ya mavuno, matukio haya yanadhihirisha maadili ya ndani zaidi ya utamaduni.",
        "Unaweza kufurahia maonyesho ya kitamaduni yaliyopangwa kwenye maboma na loji, au, kwa utangulizi sahihi na heshima, kukaribishwa kwenye sherehe halisi. Fuata mwongozo wa kiongozi wako kuhusu kipi ni cha wazi na kipi ni kitakatifu."
      ]
    },
    sections: [
      { id: "rites", name: { en: "Rites of passage", sw: "Sherehe za kuvunja ungo" }, body: {
        en: ["Among the Maasai, moving from boyhood to moran (warrior) and later to elder is marked by major ceremonies involving the whole community — the eunoto warrior graduation is one of the most spectacular, with feasting, dancing and elaborate ochre and beadwork.", "These deeply meaningful events are usually private, but a good cultural guide can explain their stages and significance."],
        sw: ["Miongoni mwa Wamaasai, kuhama kutoka utoto hadi moran (shujaa) na baadaye kuwa mzee kunaadhimishwa kwa sherehe kubwa zinazohusisha jamii nzima — kuhitimu kwa mashujaa kwa eunoto ni mojawapo ya kuvutia zaidi, kikiwa na karamu, densi na mapambo ya ochre na shanga.", "Matukio haya yenye maana ya kina kwa kawaida ni ya faragha, lakini kiongozi mzuri wa kitamaduni anaweza kueleza hatua zake na umuhimu wake."] } },
      { id: "weddings", name: { en: "Weddings & celebrations", sw: "Harusi na sherehe" }, body: {
        en: ["Tanzanian weddings are joyful, days-long affairs mixing tradition with modern flair — the send-off (send-off / kitchen party), the church or mosque service, and a huge reception with feasting, drumming and dancing late into the night.", "If you are lucky enough to be invited, dress smart, bring good spirits and be ready to dance."],
        sw: ["Harusi za Kitanzania ni sherehe za furaha, za siku nyingi zinazochanganya mila na mtindo wa kisasa — send-off (kitchen party), ibada ya kanisa au msikiti, na tafrija kubwa yenye karamu, ngoma na densi hadi usiku wa manane.", "Ukibahatika kualikwa, vaa nadhifu, njoo na moyo mzuri na uwe tayari kucheza."] } },
      { id: "bomas", name: { en: "Cultural bomas & shows", sw: "Maboma na maonyesho ya kitamaduni" }, body: {
        en: ["Around Arusha, community cultural bomas welcome visitors for a set programme: a tour of homesteads, dance performances, craft demonstrations and a shared meal, run by the villagers themselves. It is an accessible, respectful way to experience the culture and support the community directly.", "Book through a recognised cultural tourism programme so the money reaches the village, not a middleman."],
        sw: ["Kuzunguka Arusha, maboma ya kitamaduni ya jamii yanakaribisha wageni kwa programu maalum: ziara ya makazi, maonyesho ya densi, maonyesho ya ufundi na chakula cha pamoja, yanayoendeshwa na wanakijiji wenyewe. Ni njia rahisi, yenye heshima ya kupata uzoefu wa utamaduni na kusaidia jamii moja kwa moja.", "Weka nafasi kupitia programu inayotambulika ya utalii wa kitamaduni ili pesa ifike kijijini, si kwa dalali."] } }
    ]
  },

  agro: {
    intro: {
      en: [
        "Arusha's culture is inseparable from its land. Some of the richest experiences here are agro-tourism: spending a day with the farmers whose coffee, bananas, honey and flowers feed the region and the world. You don't just watch — you pick, cook, taste and get your hands in the soil.",
        "Agro-tourism keeps your money in rural families, teaches real skills, and shows the living link between Arusha's food, its farms and its festivals. It is culture you can eat."
      ],
      sw: [
        "Utamaduni wa Arusha hauwezi kutenganishwa na ardhi yake. Baadhi ya uzoefu tajiri zaidi hapa ni utalii wa kilimo: kutumia siku na wakulima ambao kahawa, ndizi, asali na maua yao vinalisha mkoa na dunia. Hutazami tu — unachuma, unapika, unaonja na kuweka mikono kwenye udongo.",
        "Utalii wa kilimo unaweka pesa yako kwa familia za vijijini, unafundisha ujuzi halisi, na unaonyesha uhusiano hai kati ya chakula cha Arusha, mashamba yake na sherehe zake. Ni utamaduni unaoweza kula."
      ]
    },
    sections: [
      { id: "coffee-tour", name: { en: "Coffee farm tours", sw: "Ziara za mashamba ya kahawa" }, body: {
        en: ["On Meru and Kilimanjaro's slopes, Chagga and Meru families welcome you into their coffee gardens for the whole journey from cherry to cup: picking, pulping, drying, roasting over a fire and grinding by hand, finishing with a cup you made yourself.", "It is delicious, hands-on, and directly supports the smallholder cooperatives that grow Tanzania's famous Arabica."],
        sw: ["Kwenye miteremko ya Meru na Kilimanjaro, familia za Kichagga na Kimeru zinakukaribisha kwenye bustani zao za kahawa kwa safari nzima kutoka tunda hadi kikombe: kuchuma, kumenya, kukausha, kukaanga motoni na kusaga kwa mkono, ukimalizia na kikombe ulichotengeneza mwenyewe.", "Ni tamu, ya vitendo, na inasaidia moja kwa moja ushirika wa wakulima wadogo wanaolima Arabica maarufu ya Tanzania."] } },
      { id: "home-gardens", name: { en: "Banana home gardens", sw: "Bustani za ndizi za nyumbani" }, body: {
        en: ["The Chagga home garden (kihamba) is a centuries-old masterpiece of farming: bananas, coffee, beans, vegetables and trees grown together in layers on the same plot, feeding a family year-round. Walking a kihamba with its owner is a lesson in sustainable agriculture the world is only now rediscovering.", "Many farms also cook you a traditional banana meal from the garden you just toured."],
        sw: ["Bustani ya nyumbani ya Kichagga (kihamba) ni kazi bora ya kilimo ya karne nyingi: ndizi, kahawa, maharage, mboga na miti vinavyolimwa pamoja kwa tabaka kwenye kiwanja kimoja, vikilisha familia mwaka mzima. Kutembea kihamba na mmiliki wake ni somo la kilimo endelevu ambalo dunia inagundua tena sasa.", "Mashamba mengi pia yanakupikia chakula cha jadi cha ndizi kutoka bustani uliyotembelea."] } },
      { id: "honey-flowers", name: { en: "Honey & flower farms", sw: "Mashamba ya asali na maua" }, body: {
        en: ["Beekeepers on the forest edge show how honey and beeswax are harvested from log and modern hives, with plenty of tasting. Nearby, Arusha's large flower farms around Usa River grow roses and cuttings flown to Europe daily — a fascinating glimpse of high-tech greenhouse farming and the jobs it brings.", "Both make a sweet, memorable half-day and support Arusha's green economy."],
        sw: ["Wafugaji nyuki ukingoni mwa msitu wanaonyesha jinsi asali na nta vinavyovunwa kutoka mizinga ya magogo na ya kisasa, ikiwa na uonjaji mwingi. Karibu, mashamba makubwa ya maua ya Arusha kuzunguka Usa River yanalima waridi na vipandikizi vinavyorushwa Ulaya kila siku — mwonekano wa kuvutia wa kilimo cha greenhouse cha teknolojia ya juu na ajira kinazoleta.", "Vyote vinafanya nusu siku tamu, ya kukumbukwa na vinasaidia uchumi wa kijani wa Arusha."] } },
      { id: "farm-stays", name: { en: "Cultural farm stays", sw: "Malazi ya kitamaduni shambani" }, body: {
        en: ["For the deepest experience, stay overnight on a working farm: help with the animals and harvest, cook over a wood fire, and share meals and stories with the family. It turns a quick tour into a genuine friendship and a real understanding of rural Tanzanian life.", "Farm stays spread tourism income beyond the city and into the villages that most need it."],
        sw: ["Kwa uzoefu wa kina zaidi, lala usiku kwenye shamba linalofanya kazi: saidia na wanyama na mavuno, pika kwa moto wa kuni, na shiriki chakula na hadithi na familia. Kunageuza ziara ya haraka kuwa urafiki wa kweli na uelewa halisi wa maisha ya vijijini Tanzania.", "Malazi ya shambani yanasambaza mapato ya utalii nje ya jiji hadi vijijini vinavyohitaji zaidi."] } }
    ]
  }

};
