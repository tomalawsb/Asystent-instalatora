/* Globalne stałe i bieżący stan aplikacji. */

const APP_VERSION = '3.7 - 1605261805 AI Prosta';
const STORAGE_KEY = 'pomocnik-instalatora-pwa-v1-quotes';
const SETTINGS_KEY = 'pomocnik-instalatora-pwa-v1-settings';
const PHRASE_DICTIONARY_KEY = 'pomocnik-instalatora-pwa-v1-phrase-dictionary';
const LEARNED_RULES_KEY = 'pomocnik-instalatora-pwa-v1-learned-parser-rules';
const CATALOG_KEY = 'pomocnik-instalatora-pwa-v1-custom-catalog';
const DEVICE_ID_KEY = 'pomocnik-instalatora-pwa-v1-device-id';
let CATALOG = loadCatalog();
let CATEGORIES = Object.keys(CATALOG);

const TYPE_HINTS = {
  'Kamery CCTV': ['Montaż kamery IP zewnętrznej', 'Konfiguracja rejestratora NVR', 'Uruchomienie podglądu zdalnego', 'Okablowanie pod kamerę'],
  'Anteny / Sygnał': ['Montaż anteny DVB-T', 'Ustawienie anteny DVB-T', 'Pomiary sygnału', 'Prowadzenie kabla antenowego'],
  'Sieć / Wi‑Fi': ['Konfiguracja routera', 'Test i optymalizacja Wi‑Fi', 'Prowadzenie skrętki LAN', 'Zarabianie końcówki RJ45'],
  'Domofon': ['Montaż wideodomofonu 1-rodzinnego', 'Montaż panelu bramowego', 'Montaż elektrozaczepu'],
  'Alarm': ['Montaż centrali alarmowej', 'Montaż czujki PIR', 'Montaż sygnalizatora zewnętrznego'],
  'Automatyka bram': ['Montaż napędu bramy przesuwnej', 'Montaż fotokomórek', 'Programowanie pilotów'],
  'Przewody / Okablowanie': ['Kabel antenowy RG6 CU', 'Skrętka UTP Cat 5e CU', 'Skrętka UTP Cat 6 CU', 'Przewód niskoprądowy 2×0,5', 'Prowadzenie przewodu — standardowe'],
  'Złącza / Akcesoria': ['Złącze F kompresyjne RG6', 'Wtyk RJ45 Cat 6 UTP', 'Rozgałęźnik antenowy 2-drożny', 'Zasilacz antenowy 12V z separatorem', 'Wzmacniacz antenowy masztowy'],
  'Dopłaty / Trudne warunki': ['Dopłata za trudny dostęp / wysokość', 'Dopłata za montaż na kominie lub maszcie', 'Dopłata za kucie / przekucie', 'Dopłata za kopanie / trudny grunt'],
  'Serwis': ['Diagnostyka / serwis', 'Aktualizacja oprogramowania', 'Dojazd']
};

const KEYWORDS_TO_TYPES = {
  'kamera': 'Kamery CCTV', 'kamery': 'Kamery CCTV', 'monitoring': 'Kamery CCTV', 'rejestrator': 'Kamery CCTV', 'nvr': 'Kamery CCTV', 'poe': 'Kamery CCTV', 'ptz': 'Kamery CCTV',
  'anten': 'Anteny / Sygnał', 'dvb': 'Anteny / Sygnał', 'satel': 'Anteny / Sygnał', 'konwerter': 'Anteny / Sygnał', 'sygnał': 'Anteny / Sygnał', 'sygnal': 'Anteny / Sygnał',
  'wifi': 'Sieć / Wi‑Fi', 'wi-fi': 'Sieć / Wi‑Fi', 'router': 'Sieć / Wi‑Fi', 'internet': 'Sieć / Wi‑Fi', 'lan': 'Sieć / Wi‑Fi', 'rj45': 'Sieć / Wi‑Fi', 'mesh': 'Sieć / Wi‑Fi',
  'skrętka': 'Przewody / Okablowanie', 'skretka': 'Przewody / Okablowanie', 'cat': 'Przewody / Okablowanie', 'rg6': 'Przewody / Okablowanie', 'przewód': 'Przewody / Okablowanie', 'przewod': 'Przewody / Okablowanie', 'zelowany': 'Przewody / Okablowanie', 'żelowany': 'Przewody / Okablowanie',
  'zlacze': 'Złącza / Akcesoria', 'złącze': 'Złącza / Akcesoria', 'zlacza': 'Złącza / Akcesoria', 'złącza': 'Złącza / Akcesoria', 'wtyk': 'Złącza / Akcesoria', 'wtyki': 'Złącza / Akcesoria', 'rjki': 'Złącza / Akcesoria', 'rj-ki': 'Złącza / Akcesoria', 'beczka': 'Złącza / Akcesoria', 'rozgałęźnik': 'Złącza / Akcesoria', 'rozgaleznik|rozgałeznik': 'Złącza / Akcesoria', 'zasilacz': 'Złącza / Akcesoria', 'wzmacniacz': 'Złącza / Akcesoria', 'keystone': 'Złącza / Akcesoria', 'gniazdo': 'Złącza / Akcesoria',
  'trudny': 'Dopłaty / Trudne warunki', 'trudne': 'Dopłaty / Trudne warunki', 'wysoko': 'Dopłaty / Trudne warunki', 'drabina': 'Dopłaty / Trudne warunki', 'komin': 'Dopłaty / Trudne warunki', 'strych': 'Dopłaty / Trudne warunki', 'przewiert': 'Dopłaty / Trudne warunki', 'kopanie': 'Dopłaty / Trudne warunki', 'wykop': 'Dopłaty / Trudne warunki',
  'domofon': 'Domofon', 'wideodomofon': 'Domofon', 'furtk': 'Domofon', 'elektrozaczep': 'Domofon',
  'alarm': 'Alarm', 'central': 'Alarm', 'czujk': 'Alarm', 'sygnalizator': 'Alarm', 'pir': 'Alarm',
  'bram': 'Automatyka bram', 'pilot': 'Automatyka bram', 'fotokomór': 'Automatyka bram', 'napęd': 'Automatyka bram',
  'serwis': 'Serwis', 'napraw': 'Serwis', 'diagnoz': 'Serwis', 'konfigurac': 'Serwis', 'aktualizac': 'Serwis'
};

const CHECKLISTS = {
  'Kamery CCTV': ['Ustalić miejsca montażu kamer', 'Sprawdzić zasilanie / PoE', 'Sprawdzić sposób prowadzenia przewodów', 'Sprawdzić zasięg sieci lub dostęp do internetu', 'Ustalić miejsce rejestratora i dysku'],
  'Anteny / Sygnał': ['Sprawdzić poziom sygnału', 'Ustalić miejsce montażu anteny lub masztu', 'Sprawdzić stan kabla i złączy', 'Sprawdzić wzmacniacz / zasilacz antenowy', 'Policzyć liczbę gniazd TV / dekoderów'],
  'Sieć / Wi‑Fi': ['Sprawdzić zasięg Wi‑Fi', 'Sprawdzić obecne okablowanie LAN', 'Ustalić miejsce routera / access pointa', 'Zweryfikować adresację i DHCP', 'Wykonać test prędkości i stabilności'],
  'Domofon': ['Sprawdzić okablowanie do furtki', 'Ustalić miejsce monitora / unifonu', 'Sprawdzić elektrozaczep lub zworę', 'Zweryfikować zasilanie urządzeń'],
  'Alarm': ['Ustalić strefy i wejścia', 'Ustalić miejsca czujek', 'Sprawdzić zasilanie i akumulator', 'Sprawdzić komunikację GSM / aplikację'],
  'Automatyka bram': ['Sprawdzić stan mechaniczny bramy', 'Zweryfikować zasilanie napędu', 'Ustalić miejsca fotokomórek i lampy', 'Sprawdzić możliwość sterowania z telefonu'],
  'Przewody / Okablowanie': ['Ustalić typ przewodu: antenowy / internetowy / prądowy', 'Policzyć metry przewodu', 'Określić teren prowadzenia: łatwy / standardowy / trudny', 'Sprawdzić czy materiał i robocizna mają być liczone osobno'],
  'Złącza / Akcesoria': ['Policzyć złącza F i RJ45', 'Ustalić typ złączy: nakręcane, kompresyjne, ekranowane, przelotowe', 'Ustalić rozgałęźniki, wzmacniacze i zasilacze antenowe', 'Sprawdzić czy złącza są jako materiał czy także zarobienie / zaciskanie'],
  'Dopłaty / Trudne warunki': ['Sprawdzić, czy trzeba użyć drabiny / wejść na wysokość', 'Sprawdzić liczbę przewiertów i rodzaj ścian', 'Ustalić czy będzie kopanie, bruk albo trudny grunt', 'Ustalić czy montaż jest na kominie, maszcie, strychu lub elewacji'],
  'Serwis': ['Opisać objawy usterki', 'Sprawdzić istniejący sprzęt', 'Zanotować wynik diagnozy', 'Ustalić zakres naprawy lub konfiguracji']
};


const VOICE_ITEM_RULES = [
  { key: 'camera', category: 'Kamery CCTV', name: 'Montaż kamery IP zewnętrznej', unit: 'szt', keywords: ['kamera', 'kamery', 'kamer', 'cctv'] },
  { key: 'ptz', category: 'Kamery CCTV', name: 'Montaż kamery obrotowej PTZ', unit: 'szt', keywords: ['ptz', 'obrotowa', 'obrotowe'] },
  { key: 'nvr', category: 'Kamery CCTV', name: 'Konfiguracja rejestratora NVR', unit: 'szt', keywords: ['rejestrator', 'nvr', 'dvr'] },
  { key: 'remote_preview', category: 'Kamery CCTV', name: 'Uruchomienie podglądu zdalnego', unit: 'usł', keywords: ['podgląd zdalny', 'podglad zdalny', 'podgląd w telefonie', 'podglad w telefonie', 'podgląd na telefonie', 'podglad na telefonie'] },
  { key: 'cable_lan', category: 'Kamery CCTV', name: 'Prowadzenie skrętki zewnętrznej', unit: 'mb', keywords: ['kabel', 'kabla', 'przewód', 'przewodu', 'skrętka', 'skretka', 'lan', 'utp'] },
  { key: 'rj45', category: 'Złącza / Akcesoria', name: 'Zaciskanie wtyku RJ45', unit: 'szt', keywords: ['rj45', 'rj-45', 'rjki', 'rj-ki', 'końcówka rj45', 'koncowka rj45', 'wtyk rj45', 'wtyki rj45'] },
  { key: 'fplug', category: 'Złącza / Akcesoria', name: 'Zarabianie złącza F', unit: 'szt', keywords: ['złącze f', 'zlacze f', 'złącza f', 'zlacza f', 'końcówka f', 'koncowka f', 'końcówki f', 'koncowki f', 'fka', 'f-ki'] },
  { key: 'antenna', category: 'Anteny / Sygnał', name: 'Montaż anteny DVB-T', unit: 'szt', keywords: ['antena', 'anteny', 'dvb', 'satelitarna'] },
  { key: 'router', category: 'Sieć / Wi‑Fi', name: 'Konfiguracja routera', unit: 'szt', keywords: ['router', 'routera'] },
  { key: 'wifi', category: 'Sieć / Wi‑Fi', name: 'Test i optymalizacja Wi‑Fi', unit: 'usł', keywords: ['wifi', 'wi-fi', 'zasięg', 'zasieg'] },
  { key: 'switch_poe', category: 'Kamery CCTV', name: 'Switch PoE 4-port', unit: 'szt', keywords: ['switch', 'poe'] },
  { key: 'disk', category: 'Kamery CCTV', name: 'Montaż dysku do rejestratora', unit: 'szt', keywords: ['dysk', 'dysku', 'hdd'] },
  { key: 'box_holder', category: 'Kamery CCTV', name: 'Montaż puszki / uchwytu kamery', unit: 'szt', keywords: ['puszka montażowa', 'puszki montażowe', 'puszka montazowa', 'puszki montazowe', 'puszka', 'puszki', 'uchwyt', 'uchwyty'] },
  { key: 'electrical_box', category: 'Kamery CCTV', name: 'Puszka prądowa', unit: 'szt', keywords: ['puszka prądowa', 'puszki prądowe', 'puszka pradowa', 'puszki pradowe'] },
  { key: 'app_training', category: 'Serwis', name: 'Nauka obsługi i instalacja aplikacji', unit: 'usł', keywords: ['nauka obsługi aplikacji', 'nauka obslugi aplikacji', 'instalacja aplikacji'] },
  { key: 'domofon', category: 'Domofon', name: 'Montaż wideodomofonu 1-rodzinnego', unit: 'szt', keywords: ['domofon', 'wideodomofon', 'unifon'] },
  { key: 'alarm_sensor', category: 'Alarm', name: 'Montaż czujki PIR', unit: 'szt', keywords: ['czujka', 'czujki', 'pir'] },
  { key: 'gate_remote', category: 'Automatyka bram', name: 'Programowanie pilotów', unit: 'szt', keywords: ['pilot', 'pilota', 'pilotów', 'pilotow'] },
  { key: 'labor', category: 'Serwis', name: 'Robocizna', unit: 'godz', keywords: ['robocizna', 'praca', 'godzina', 'godziny', 'godzin'] },
  { key: 'service', category: 'Serwis', name: 'Diagnostyka / serwis', unit: 'godz', keywords: ['serwis', 'diagnostyka', 'naprawa'] }
];


const CABLE_MATERIAL_TYPES = [
  {
    key: 'cable_rg6_cu',
    name: 'Kabel antenowy RG6 CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.50,
    score: text => (/\brg\s*-?\s*6\b|\brg6\b|anten\w*|koncentryk|koncentryczn\w*/i.test(text) ? 20 : 0)
  },
  {
    key: 'cable_cat6_gel_cu',
    name: 'Skrętka żelowana Cat 6 CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 3.50,
    score: text => (/zelowan\w*|żelowan\w*|ziemn\w*|zewnetrzn\w*|zewnętrzn\w*|pe\b/i.test(text) ? (/\bcat\s*6\b|\bkat\s*6\b|kategoria\s*6/i.test(text) ? 30 : 0) : 0)
  },
  {
    key: 'cable_cat6_cu',
    name: 'Skrętka UTP Cat 6 CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.00,
    score: text => (/\bcat\s*6\b|\bkat\s*6\b|kategoria\s*6/i.test(text) ? 18 : 0)
  },
  {
    key: 'cable_cat5e_gel_cu',
    name: 'Skrętka żelowana Cat 5e CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.20,
    score: text => (/zelowan\w*|żelowan\w*|ziemn\w*|zewnetrzn\w*|zewnętrzn\w*|pe\b/i.test(text) ? (/\bcat\s*5e\b|\bkat\s*5e\b|kategoria\s*5e/i.test(text) ? 30 : (/skretk\w*|skrętk\w*|internetow\w*|lan|utp/i.test(text) ? 24 : 0)) : 0)
  },
  {
    key: 'cable_cat5e_cu',
    name: 'Skrętka UTP Cat 5e CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.00,
    score: text => (/\bcat\s*5e\b|\bkat\s*5e\b|kategoria\s*5e|skretk\w*|skrętk\w*|internetow\w*|lan|utp/i.test(text) ? 18 : 0)
  },
  {
    key: 'cable_low_voltage_2x05',
    name: 'Przewód niskoprądowy 2×0,5',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 1.50,
    score: text => (/2\s*(?:x|×|razy)\s*0[.,]?5|2x0[.,]?5|2×0[.,]?5/i.test(text) ? 35 : 0)
  },
  {
    key: 'cable_power_ydyp_3x25',
    name: 'Przewód prądowy YDYp 3×2,5',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 5.50,
    score: text => ((/prad\w*|prąd\w*|elektryczn\w*|zasilaj\w*|ydyp|ydy/i.test(text) ? 12 : 0) + (/3\s*x\s*2[.,]?5|3×2[.,]?5/i.test(text) ? 15 : 0))
  },
  {
    key: 'cable_power_ydyp_3x15',
    name: 'Przewód prądowy YDYp 3×1,5',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 3.50,
    score: text => (/prad\w*|prąd\w*|elektryczn\w*|zasilaj\w*|ydyp|ydy/i.test(text) ? 14 : 0)
  }
];

const CABLE_LABOR_TYPES = [
  { key: 'cable_labor_easy', name: 'Prowadzenie przewodu — łatwe', priceNet: 5.00, test: text => /latw\w*|łatw\w*|prosto|bez\s+problemu|po\s+wierzchu|po\s+zewnatrz|po\s+zewnątrz/i.test(text) },
  { key: 'cable_labor_ground', name: 'Prowadzenie przewodu w ziemi', priceNet: 20.00, test: text => /w\s+ziemi|ziemn\w*|zakop\w*|wykop\w*|rurze\s+ziemnej/i.test(text) },
  { key: 'cable_labor_conduit', name: 'Prowadzenie przewodu w peszlu', priceNet: 12.00, test: text => /peszl\w*|rurce|rurze|rura\s+oslonowa|rura\s+osłonowa/i.test(text) },
  { key: 'cable_labor_strip', name: 'Prowadzenie przewodu w listwie', priceNet: 10.00, test: text => /listw\w*|maskowan\w*|korytk\w*/i.test(text) },
  { key: 'cable_labor_hard', name: 'Prowadzenie przewodu — trudne', priceNet: 14.00, test: text => /trudn\w*|ciezk\w*|ciężk\w*|strych|poddasz\w*|dach|komin|pod\s+elewacj\w*/i.test(text) },
  { key: 'cable_labor_standard', name: 'Prowadzenie przewodu — standardowe', priceNet: 8.00, test: () => true }
];


const ACCESSORY_TYPES = [
  { key: 'f_compression', name: 'Złącze F kompresyjne RG6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 2.50, score: text => (/((zlacz\w*|złącz\w*|wtyk\w*|koncowk\w*|końcówk\w*)\s*f|\bf\s*(?:-?ki|ki)?\b)/i.test(text) && /kompres\w*|zaciskan\w*/i.test(text) ? 35 : 0) },
  { key: 'f_angle', name: 'Złącze F kątowe', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 4.00, score: text => (/((zlacz\w*|złącz\w*|wtyk\w*|koncowk\w*|końcówk\w*)\s*f|\bf\s*(?:-?ki|ki)?\b)/i.test(text) && /katow\w*|kątow\w*/i.test(text) ? 34 : 0) },
  { key: 'f_coupler', name: 'Przejście F-F / beczka antenowa', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 2.00, score: text => (/beczk\w*|przejsc\w*\s*f|przejści\w*\s*f|f\s*[-/]\s*f|zlaczk\w*\s*f|złączk\w*\s*f/i.test(text) ? 33 : 0) },
  { key: 'f_screw', name: 'Złącze F nakręcane RG6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 1.50, score: text => (/((zlacz\w*|złącz\w*|wtyk\w*|koncowk\w*|końcówk\w*)\s*f|\bf\s*(?:-?ki|ki)?\b)/i.test(text) ? (/nakrecan\w*|nakręcan\w*/i.test(text) ? 32 : 24) : 0) },
  { key: 'iec_angle', name: 'Wtyk antenowy kątowy', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 6.00, score: text => (/wtyk\w*\s+anten\w*|iec/i.test(text) && /katow\w*|kątow\w*/i.test(text) ? 30 : 0) },
  { key: 'iec_female', name: 'Wtyk antenowy IEC żeński', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 5.00, score: text => (/wtyk\w*\s+anten\w*|iec/i.test(text) && /zenski\w*|żeński\w*|gniazdo/i.test(text) ? 26 : 0) },
  { key: 'iec_male', name: 'Wtyk antenowy IEC męski', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 5.00, score: text => (/wtyk\w*\s+anten\w*|iec/i.test(text) ? 22 : 0) },
  { key: 'splitter4', name: 'Rozgałęźnik antenowy 4-drożny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/rozgal\w*|rozgał\w*|rozdziel\w*|splitter/i.test(text) && /(4|czter\w*)\s*(?:wyjsc|wyjść|droz|dróz|droż)/i.test(text) ? 31 : 0) },
  { key: 'splitter3', name: 'Rozgałęźnik antenowy 3-drożny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 25.00, score: text => (/rozgal\w*|rozgał\w*|rozdziel\w*|splitter/i.test(text) && /(3|trz\w*)\s*(?:wyjsc|wyjść|droz|dróz|droż)/i.test(text) ? 30 : 0) },
  { key: 'splitter2', name: 'Rozgałęźnik antenowy 2-drożny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 20.00, score: text => (/rozgal\w*|rozgał\w*|rozdziel\w*|splitter/i.test(text) ? 25 : 0) },
  { key: 'tap', name: 'Odgałęźnik antenowy TAP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 30.00, score: text => (/odgal\w*|odgał\w*|\btap\b/i.test(text) ? 28 : 0) },
  { key: 'rtv_sat_socket_pass', name: 'Gniazdo RTV/SAT przelotowe', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 40.00, score: text => (/gniazd\w*\s+(?:rtv|sat|rtv\/sat|anten)/i.test(text) && /przelot\w*/i.test(text) ? 28 : 0) },
  { key: 'rtv_sat_socket', name: 'Gniazdo RTV/SAT końcowe', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/gniazd\w*\s+(?:rtv|sat|rtv\/sat|anten)/i.test(text) ? 24 : 0) },
  { key: 'antenna_amp_with_psu', name: 'Wzmacniacz antenowy z zasilaczem', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 155.00, score: text => (/wzmacniacz\w*\s+anten\w*/i.test(text) && /zasilacz\w*/i.test(text) ? 34 : 0) },
  { key: 'antenna_amp_mast', name: 'Wzmacniacz antenowy masztowy', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 80.00, score: text => (/wzmacniacz\w*\s+anten\w*/i.test(text) && /maszt\w*/i.test(text) ? 30 : 0) },
  { key: 'antenna_amp_internal', name: 'Wzmacniacz antenowy wewnętrzny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 120.00, score: text => (/wzmacniacz\w*\s+anten\w*|rozgałęźnik\w*\s+aktywn\w*|rozgaleznik|rozgałeznik\w*\s+aktywn\w*/i.test(text) ? 25 : 0) },
  { key: 'antenna_psu', name: 'Zasilacz antenowy 12V z separatorem', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/zasilacz\w*\s+anten\w*/i.test(text) ? 30 : 0) },
  { key: 'power_supply_12v_5a', name: 'Zasilacz 12V 5A', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 55.00, score: text => (/zasilacz\w*/i.test(text) && /5\s*a\b/i.test(text) ? 22 : 0) },
  { key: 'power_supply_12v_2a', name: 'Zasilacz 12V 2A', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 30.00, score: text => (/zasilacz\w*/i.test(text) && /2\s*a\b/i.test(text) ? 21 : 0) },
  { key: 'power_supply_12v_cctv', name: 'Zasilacz 12V CCTV', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/zasilacz\w*/i.test(text) && /(12\s*v|cctv|kamera|kamer)/i.test(text) ? 18 : 0) },
  { key: 'rj45_cat6_shielded', name: 'Wtyk RJ45 Cat 6 ekranowany FTP/STP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 1.80, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) && /(ftp|stp|ekran\w*)/i.test(text) ? 34 : 0) },
  { key: 'rj45_cat6_pass', name: 'Wtyk RJ45 przelotowy Cat 6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.90, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) && /przelot\w*/i.test(text) ? 33 : 0) },
  { key: 'rj45_cat6', name: 'Wtyk RJ45 Cat 6 UTP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.90, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) ? 30 : 0) },
  { key: 'rj45_cat5e', name: 'Wtyk RJ45 Cat 5e UTP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.60, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*5e|kat\s*5e|kategoria\s*5e)/i.test(text) ? 30 : 0) },
  { key: 'rj45_boot', name: 'Osłonka RJ45', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.50, score: text => (/oslonk\w*|oslon\w*|osłonk\w*|osłon\w*/i.test(text) && /rj\s*-?\s*45|rj/i.test(text) ? 29 : 0) },
  { key: 'rj45_coupler', name: 'Łącznik RJ45 / beczka LAN', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 8.00, score: text => (/beczk\w*|lacznik\w*|łącznik\w*|przejsc\w*|przejści\w*/i.test(text) && /(rj\s*-?\s*45|lan)/i.test(text) ? 28 : 0) },
  { key: 'keystone_cat6', name: 'Moduł keystone RJ45 Cat 6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 18.00, score: text => (/keystone|modul\w*\s+rj|moduł\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) ? 30 : 0) },
  { key: 'keystone_cat5e', name: 'Moduł keystone RJ45 Cat 5e', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 12.00, score: text => (/keystone|modul\w*\s+rj|moduł\w*\s+rj/i.test(text) ? 24 : 0) },
  { key: 'lan_socket_2', name: 'Gniazdo LAN natynkowe 2xRJ45', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/gniazd\w*\s+lan|gniazd\w*\s+rj/i.test(text) && /2\s*x|podwojn\w*|2\s*rj/i.test(text) ? 28 : 0) },
  { key: 'lan_socket_1', name: 'Gniazdo LAN natynkowe 1xRJ45', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 25.00, score: text => (/gniazd\w*\s+lan|gniazd\w*\s+rj/i.test(text) ? 24 : 0) },
  { key: 'patch_panel_24', name: 'Patch panel 24-port', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 140.00, score: text => (/patch\s*panel/i.test(text) && /24/i.test(text) ? 24 : 0) },
  { key: 'patch_panel_12', name: 'Patch panel 12-port', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 80.00, score: text => (/patch\s*panel/i.test(text) ? 20 : 0) }
];

const POLISH_NUMBER_WORDS = {
  'zero': 0,
  'jeden': 1, 'jedna': 1, 'jedno': 1, 'jednej': 1, 'jednego': 1, 'pierwsza': 1, 'pierwszy': 1,
  'dwa': 2, 'dwie': 2, 'dwóch': 2, 'dwoch': 2, 'dwoma': 2, 'drugie': 2, 'drugi': 2,
  'trzy': 3, 'trzech': 3, 'trzema': 3,
  'cztery': 4, 'czterech': 4, 'czterema': 4,
  'pięć': 5, 'piec': 5, 'pięciu': 5, 'pieciu': 5,
  'sześć': 6, 'szesc': 6, 'sześciu': 6, 'szesciu': 6,
  'siedem': 7, 'siedmiu': 7,
  'osiem': 8, 'ośmiu': 8, 'osmiu': 8,
  'dziewięć': 9, 'dziewiec': 9, 'dziewięciu': 9, 'dziewieciu': 9,
  'dziesięć': 10, 'dziesiec': 10, 'dziesięciu': 10, 'dziesieciu': 10,
  'jedenaście': 11, 'jedenascie': 11, 'jednastu': 11,
  'dwanaście': 12, 'dwanascie': 12, 'dwunastu': 12,
  'trzynaście': 13, 'trzynascie': 13, 'trzynastu': 13,
  'czternaście': 14, 'czternascie': 14, 'czternastu': 14,
  'piętnaście': 15, 'pietnascie': 15, 'piętnastu': 15, 'pietnastu': 15,
  'szesnaście': 16, 'szesnascie': 16, 'szesnastu': 16,
  'siedemnaście': 17, 'siedemnascie': 17, 'siedemnastu': 17,
  'osiemnaście': 18, 'osiemnascie': 18, 'osiemnastu': 18,
  'dziewiętnaście': 19, 'dziewietnascie': 19, 'dziewiętnastu': 19, 'dziewietnastu': 19,
  'dwadzieścia': 20, 'dwadziescia': 20, 'dwudziestu': 20,
  'trzydzieści': 30, 'trzydziesci': 30, 'trzydziestu': 30,
  'czterdzieści': 40, 'czterdziesci': 40, 'czterdziestu': 40,
  'pięćdziesiąt': 50, 'piecdziesiat': 50, 'pięćdziesięciu': 50, 'piecdziesieciu': 50,
  'sto': 100, 'stu': 100
};

const CLIENT_FIELD_STOP_WORDS = [
  'telefon', 'tel', 'numer', 'adres', 'ulica', 'ul', 'miejscowość', 'miejscowosc', 'klient', 'klientka', 'imię', 'imie', 'nazwisko',
  'montaż', 'montaz', 'instalacja', 'będę', 'bede', 'kamera', 'kamery', 'kamer', 'kabel', 'przewód', 'przewod', 'dojazd', 'robocizna',
  'rejestrator', 'router', 'domofon', 'wideodomofon', 'alarm', 'czujka', 'pilot', 'anteny', 'antena', 'puszka', 'puszki', 'uchwyt', 'uchwyty', 'ip', 'cctv'
];

const ADDRESS_STOP_WORDS = [
  'telefon', 'tel', 'numer telefonu', 'klient', 'klientka', 'imię', 'imie', 'nazwisko', 'miejscowość', 'miejscowosc',
  'montaż', 'montaz', 'instalacja', 'instalację', 'instalacje', 'będę', 'bede',
  'kamera', 'kamery', 'kamer', 'kabel', 'przewód', 'przewod', 'dojazd', 'robocizna', 'rejestrator',
  'router', 'domofon', 'wideodomofon', 'alarm', 'czujka', 'pilot', 'antena', 'anteny', 'puszka', 'puszki', 'uchwyt', 'uchwyty', 'ip', 'cctv'
];

const KNOWN_CITIES = ['mielec', 'tarnów', 'tarnow', 'rzeszów', 'rzeszow', 'dębica', 'debica', 'kolbuszowa', 'przecław', 'przeclaw', 'radomyśl', 'radomysl'];

let state = createEmptyQuote();
let deferredInstallPrompt = null;
let pendingParse = null;
let lastBreakdownSnapshot = null;

const $ = (id) => document.getElementById(id);
const money = (value) => `${number(value).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
const number = (value, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value ?? '').replace(',', '.').replace(/\s+/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

