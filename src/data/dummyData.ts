import type { CSO, Rumor, RumorSubmission, DebunkSubmission, CSORegistration, User } from '@/types';

export const dummyUsers: (User & { password: string })[] = [
  {
    id: 'mod-1',
    email: 'admin@rumorradar.org',
    password: 'RumorRadar2024!Secure',
    name: 'Alex Moderator',
    role: 'moderator',
  },
  {
    id: 'cso-user-1',
    email: 'cso@rumorradar.org',
    password: 'CSOPartner2024!Demo',
    name: 'Maria FactChecker',
    role: 'cso',
    csoId: 'cso-1',
  },
];

export const dummyCSOs: CSO[] = [
  { id: 'cso-1', name: 'FactCheck Alliance', country: 'United States', coordinates: [38.9, -77.0], verified: true, description: 'Independent verification network covering North American media ecosystems.', website: 'https://factcheck.example.org', contactEmail: 'contact@factcheck.example.org', dateJoined: '2023-01-12' },
  { id: 'cso-2', name: 'AFP Factuel', country: 'France', coordinates: [48.85, 2.35], verified: true, description: 'AFP fact-checking unit covering francophone information disorders.', website: 'https://factuel.example.org', contactEmail: 'team@factuel.example.org', dateJoined: '2022-09-04' },
  { id: 'cso-3', name: 'Maldita.es', country: 'Spain', coordinates: [40.4, -3.7], verified: true, description: 'Spanish-language verification platform tracking viral hoaxes.', website: 'https://maldita.example.org', contactEmail: 'hola@maldita.example.org', dateJoined: '2022-11-20' },
  { id: 'cso-4', name: 'Full Fact', country: 'United Kingdom', coordinates: [51.5, -0.12], verified: true, description: 'UK independent fact-checking charity.', website: 'https://fullfact.example.org', contactEmail: 'team@fullfact.example.org', dateJoined: '2022-06-08' },
  { id: 'cso-5', name: 'Correctiv', country: 'Germany', coordinates: [52.52, 13.4], verified: true, description: 'Investigative journalism network across DACH region.', website: 'https://correctiv.example.org', contactEmail: 'info@correctiv.example.org', dateJoined: '2022-08-15' },
  { id: 'cso-6', name: 'DataVerify Kenya', country: 'Kenya', coordinates: [-1.29, 36.82], verified: true, description: 'East-African verification lab focused on election integrity.', website: 'https://dataverify.example.org', contactEmail: 'hello@dataverify.example.org', dateJoined: '2023-03-22' },
  { id: 'cso-7', name: 'Brazilian Fact Lab', country: 'Brazil', coordinates: [-15.78, -47.92], verified: true, description: 'Cross-platform monitoring of Lusophone misinformation.', website: 'https://factlab.example.org', contactEmail: 'oi@factlab.example.org', dateJoined: '2023-02-10' },
  { id: 'cso-8', name: 'Tokyo Info Integrity', country: 'Japan', coordinates: [35.68, 139.69], verified: true, description: 'Verification cooperative for the Asia-Pacific.', website: 'https://infointegrity.example.org', contactEmail: 'team@infointegrity.example.org', dateJoined: '2023-05-01' },
  { id: 'cso-9', name: 'Cairo Media Watch', country: 'Egypt', coordinates: [30.04, 31.24], verified: true, description: 'MENA-region monitoring of viral political claims.', website: 'https://mediawatch.example.org', contactEmail: 'contact@mediawatch.example.org', dateJoined: '2023-04-18' },
];

const now = Date.now();
const day = 86400000;
const iso = (offset: number) => new Date(now - offset * day).toISOString();

export const dummyRumors: Rumor[] = [
  // === DEBUNKED ===
  { id: 'r-1', title: 'Vaccine causes 5G antenna growth', description: 'Viral video claims COVID-19 vaccines implant 5G antennas detectable by magnets.', originCountry: 'United States', topic: 'Health', coordinates: [40.71, -74.0], intensity: 0.45, status: 'debunked', submittedAt: iso(45), sourceLanguage: 'en', debunkedBy: 'FactCheck Alliance', debunkedAt: iso(40), debunkContent: 'No verified medical study supports this claim. Magnet adherence to skin is a common skin friction effect.', debunkSources: ['https://who.int/covid', 'https://factcheck.example.org/vaccine-magnet'] },
  { id: 'r-2', title: 'Stolen ballots found in shipping container', description: 'Photos circulating on Telegram allege thousands of pre-marked ballots were intercepted at port.', originCountry: 'Brazil', topic: 'Politics', coordinates: [-22.9, -43.2], intensity: 0.62, status: 'debunked', submittedAt: iso(30), sourceLanguage: 'es', debunkedBy: 'Brazilian Fact Lab', debunkedAt: iso(28), debunkContent: 'Container photos were from a 2018 logistics audit unrelated to elections. Original source confirmed.', debunkSources: ['https://factlab.example.org/ballot-hoax'] },
  { id: 'r-3', title: 'Migrant caravan funded by foreign government', description: 'Claim that organized buses arrived from a single nation-state sponsor.', originCountry: 'Mexico', topic: 'Migration', coordinates: [19.43, -99.13], intensity: 0.55, status: 'debunked', submittedAt: iso(22), sourceLanguage: 'es', debunkedBy: 'Brazilian Fact Lab', debunkedAt: iso(20), debunkContent: 'Independent reporters traced funding to small NGO microgrants. No evidence of state sponsorship.', debunkSources: ['https://reuters.example/migrant'] },
  { id: 'r-4', title: 'Central bank to seize private deposits', description: 'WhatsApp message warns of overnight account freeze.', originCountry: 'Argentina', topic: 'Economy', coordinates: [-34.6, -58.38], intensity: 0.78, status: 'debunked', submittedAt: iso(15), sourceLanguage: 'es', debunkedBy: 'Maldita.es', debunkedAt: iso(13), debunkContent: 'Central bank communiqué denies any such measure; message originated from a parody account.', debunkSources: ['https://maldita.example.org/bank'] },
  { id: 'r-5', title: 'Drone strike footage from unrelated 2019 event', description: 'Old drone footage repurposed and miscaptioned as recent strike.', originCountry: 'Ukraine', topic: 'Conflict', coordinates: [50.45, 30.52], intensity: 0.7, status: 'debunked', submittedAt: iso(12), sourceLanguage: 'ru', debunkedBy: 'Correctiv', debunkedAt: iso(10), debunkContent: 'Reverse image search confirms footage published in 2019 in a different region.', debunkSources: ['https://correctiv.example.org/drone'] },
  { id: 'r-6', title: 'Tap water contains tracking nanobots', description: 'Conspiracy claim about municipal water supply.', originCountry: 'United Kingdom', topic: 'Health', coordinates: [51.5, -0.12], intensity: 0.32, status: 'debunked', submittedAt: iso(50), sourceLanguage: 'en', debunkedBy: 'Full Fact', debunkedAt: iso(48), debunkContent: 'No nanotechnology of this kind exists at scale. Water utility published full transparency reports.', debunkSources: ['https://fullfact.example.org/water'] },
  { id: 'r-7', title: 'Solar farm causing local cancer cluster', description: 'Allegation that a new solar installation increases regional cancer rates.', originCountry: 'Spain', topic: 'Environment', coordinates: [40.4, -3.7], intensity: 0.4, status: 'debunked', submittedAt: iso(60), sourceLanguage: 'es', debunkedBy: 'Maldita.es', debunkedAt: iso(58), debunkContent: 'Photovoltaic panels emit no ionizing radiation. Regional health stats unchanged year-over-year.', debunkSources: ['https://maldita.example.org/solar'] },
  { id: 'r-8', title: 'AI deepfake of head of state announcing surrender', description: 'Synthetic video shared as breaking news on Telegram.', originCountry: 'Ukraine', topic: 'Conflict', coordinates: [50.45, 30.52], intensity: 0.88, status: 'debunked', submittedAt: iso(90), sourceLanguage: 'ru', debunkedBy: 'Correctiv', debunkedAt: iso(89), debunkContent: 'Forensic AI detection score 99.4% synthetic. Official channels confirmed disinformation.', debunkSources: ['https://correctiv.example.org/deepfake'] },

  // === VERIFIED TRUE ===
  { id: 'r-9', title: 'New cyber attack targets banking sector', description: 'Reports of coordinated phishing campaign against regional banks.', originCountry: 'Germany', topic: 'Technology', coordinates: [52.52, 13.4], intensity: 0.6, status: 'verified-true', submittedAt: iso(8), sourceLanguage: 'en', verifiedBy: 'Correctiv', verifiedAt: iso(7), verificationContent: 'Confirmed by national cybersecurity agency. Multiple banks acknowledged the attack.', verificationSources: ['https://bsi.example/alert'] },
  { id: 'r-10', title: 'Drought forces emergency rationing', description: 'Local authorities have introduced water rationing schedules.', originCountry: 'Kenya', topic: 'Environment', coordinates: [-1.29, 36.82], intensity: 0.5, status: 'verified-true', submittedAt: iso(18), sourceLanguage: 'en', verifiedBy: 'DataVerify Kenya', verifiedAt: iso(16), verificationContent: 'Government bulletin and field interviews confirm rationing in 7 counties.', verificationSources: ['https://dataverify.example.org/drought'] },

  // === PENDING / TRENDING ===
  { id: 'r-11', title: 'Mystery illness spreading through schools', description: 'Reports of unidentified respiratory symptoms in multiple schools.', originCountry: 'India', topic: 'Health', coordinates: [28.61, 77.21], intensity: 0.82, status: 'pending', submittedAt: iso(2), sourceLanguage: 'en' },
  { id: 'r-12', title: 'Election software allegedly switching votes', description: 'Anonymous post claims voting machines flipped ballots.', originCountry: 'United States', topic: 'Politics', coordinates: [33.75, -84.39], intensity: 0.91, status: 'pending', submittedAt: iso(1), sourceLanguage: 'en' },
  { id: 'r-13', title: 'Crypto exchange to halt withdrawals', description: 'Unverified claim of imminent withdrawal freeze.', originCountry: 'Japan', topic: 'Economy', coordinates: [35.68, 139.69], intensity: 0.74, status: 'pending', submittedAt: iso(3), sourceLanguage: 'en' },
  { id: 'r-14', title: 'Border wall breach footage', description: 'Video allegedly shows mass crossing event.', originCountry: 'Mexico', topic: 'Migration', coordinates: [32.5, -117.04], intensity: 0.66, status: 'pending', submittedAt: iso(4), sourceLanguage: 'es' },
  { id: 'r-15', title: 'New pandemic strain confirmed', description: 'Social media posts claim a novel respiratory pathogen.', originCountry: 'China', topic: 'Health', coordinates: [30.59, 114.3], intensity: 0.55, status: 'pending', submittedAt: iso(5), sourceLanguage: 'en' },
  { id: 'r-16', title: 'Government to ban encrypted messaging', description: 'Allegation of forthcoming legislation outlawing E2E encryption.', originCountry: 'Russia', topic: 'Technology', coordinates: [55.75, 37.62], intensity: 0.48, status: 'pending', submittedAt: iso(6), sourceLanguage: 'ru' },
  { id: 'r-17', title: 'Foreign troops massing on border', description: 'Satellite imagery of unclear provenance circulating.', originCountry: 'Ukraine', topic: 'Conflict', coordinates: [49.99, 36.23], intensity: 0.85, status: 'pending', submittedAt: iso(2), sourceLanguage: 'ru' },
  { id: 'r-18', title: 'Fuel subsidy to be removed overnight', description: 'WhatsApp forward warns of immediate pump price hike.', originCountry: 'Nigeria', topic: 'Economy', coordinates: [9.08, 8.68], intensity: 0.7, status: 'pending', submittedAt: iso(3), sourceLanguage: 'en' },
  { id: 'r-19', title: 'Volcano eruption imminent in capital region', description: 'Unverified seismologist warning circulating.', originCountry: 'Indonesia', topic: 'Environment', coordinates: [-6.2, 106.85], intensity: 0.42, status: 'pending', submittedAt: iso(5), sourceLanguage: 'en' },
  { id: 'r-20', title: 'Civilian airliner shot down — unverified video', description: 'Alleged amateur footage uploaded to a Telegram channel.', originCountry: 'Turkey', topic: 'Conflict', coordinates: [39.93, 32.86], intensity: 0.93, status: 'pending', submittedAt: iso(1), sourceLanguage: 'en' },
  { id: 'r-21', title: 'Hospital chain collapsing financially', description: 'Anonymous insider screenshot of internal memo.', originCountry: 'Italy', topic: 'Health', coordinates: [41.9, 12.5], intensity: 0.36, status: 'pending', submittedAt: iso(8), sourceLanguage: 'en' },
  { id: 'r-22', title: 'Major dam at risk of failure', description: 'Photographs of cracks shared with alarming captions.', originCountry: 'Egypt', topic: 'Environment', coordinates: [30.04, 31.24], intensity: 0.58, status: 'pending', submittedAt: iso(7), sourceLanguage: 'ar' },
  { id: 'r-23', title: 'AI chatbot leaked personal data of millions', description: 'Allegation of mass PII exfiltration via conversational AI.', originCountry: 'United States', topic: 'Technology', coordinates: [37.77, -122.41], intensity: 0.5, status: 'pending', submittedAt: iso(4), sourceLanguage: 'en' },
];

export const dummyRumorSubmissions: RumorSubmission[] = [
  { id: 'sub-1', claim: 'Microchips in vaccine boosters track location', description: 'Long-form post claims new boosters contain tracking devices.', originCountry: 'Canada', originCoordinates: [45.42, -75.69], subjectCountry: 'United States', topic: 'Health', source: 'Telegram channel', submittedAt: iso(1), status: 'pending' },
  { id: 'sub-2', claim: 'Stock market crash predicted by leaked memo', description: 'Screenshot allegedly from major bank.', originCountry: 'United Kingdom', originCoordinates: [51.5, -0.12], topic: 'Economy', source: 'Twitter/X', submittedAt: iso(2), status: 'pending' },
  { id: 'sub-3', claim: 'Refugee numbers fabricated by NGO', description: 'Anonymous source claims data manipulation.', originCountry: 'Germany', originCoordinates: [52.52, 13.4], topic: 'Migration', source: 'WhatsApp', submittedAt: iso(3), status: 'pending' },
];

export const dummyDebunkSubmissions: DebunkSubmission[] = [
  { id: 'deb-1', rumorId: 'r-11', csoId: 'cso-1', csoName: 'FactCheck Alliance', content: 'Investigated reports — symptoms align with seasonal flu, no novel pathogen.', sources: ['https://who.int/flu'], submissionType: 'debunk', submittedAt: iso(1), status: 'pending' },
];

export const dummyCSORegistrations: CSORegistration[] = [
  { id: 'reg-1', organizationName: 'Verify Vietnam', country: 'Indonesia', contactName: 'Nguyen Linh', contactEmail: 'contact@verifyvn.example.org', website: 'https://verifyvn.example.org', description: 'Southeast Asian fact-checking collective focused on health misinformation.', submittedAt: iso(2), status: 'pending' },
];
