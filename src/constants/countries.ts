export interface Country {
  name: string;
  code: string;
  coordinates: [number, number];
  /** International dialing prefix incl. leading + */
  phonePrefix: string;
}

export const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', coordinates: [38.9, -77.0], phonePrefix: '+1' },
  { name: 'United Kingdom', code: 'GB', coordinates: [51.5, -0.12], phonePrefix: '+44' },
  { name: 'France', code: 'FR', coordinates: [48.85, 2.35], phonePrefix: '+33' },
  { name: 'Germany', code: 'DE', coordinates: [52.52, 13.4], phonePrefix: '+49' },
  { name: 'Spain', code: 'ES', coordinates: [40.4, -3.7], phonePrefix: '+34' },
  { name: 'Italy', code: 'IT', coordinates: [41.9, 12.5], phonePrefix: '+39' },
  { name: 'Romania', code: 'RO', coordinates: [44.43, 26.1], phonePrefix: '+40' },
  { name: 'Brazil', code: 'BR', coordinates: [-15.78, -47.92], phonePrefix: '+55' },
  { name: 'Mexico', code: 'MX', coordinates: [19.43, -99.13], phonePrefix: '+52' },
  { name: 'Argentina', code: 'AR', coordinates: [-34.6, -58.38], phonePrefix: '+54' },
  { name: 'Kenya', code: 'KE', coordinates: [-1.29, 36.82], phonePrefix: '+254' },
  { name: 'Nigeria', code: 'NG', coordinates: [9.08, 8.68], phonePrefix: '+234' },
  { name: 'South Africa', code: 'ZA', coordinates: [-26.2, 28.04], phonePrefix: '+27' },
  { name: 'Egypt', code: 'EG', coordinates: [30.04, 31.24], phonePrefix: '+20' },
  { name: 'Morocco', code: 'MA', coordinates: [33.97, -6.85], phonePrefix: '+212' },
  { name: 'Turkey', code: 'TR', coordinates: [39.93, 32.86], phonePrefix: '+90' },
  { name: 'Russia', code: 'RU', coordinates: [55.75, 37.62], phonePrefix: '+7' },
  { name: 'Ukraine', code: 'UA', coordinates: [50.45, 30.52], phonePrefix: '+380' },
  { name: 'India', code: 'IN', coordinates: [28.61, 77.21], phonePrefix: '+91' },
  { name: 'Pakistan', code: 'PK', coordinates: [33.69, 73.05], phonePrefix: '+92' },
  { name: 'China', code: 'CN', coordinates: [39.9, 116.4], phonePrefix: '+86' },
  { name: 'Japan', code: 'JP', coordinates: [35.68, 139.69], phonePrefix: '+81' },
  { name: 'Indonesia', code: 'ID', coordinates: [-6.2, 106.85], phonePrefix: '+62' },
  { name: 'Philippines', code: 'PH', coordinates: [14.6, 120.98], phonePrefix: '+63' },
  { name: 'Australia', code: 'AU', coordinates: [-35.28, 149.13], phonePrefix: '+61' },
  { name: 'Canada', code: 'CA', coordinates: [45.42, -75.69], phonePrefix: '+1' },
  { name: 'Venezuela', code: 'VE', coordinates: [10.5, -66.92], phonePrefix: '+58' },
  { name: 'Colombia', code: 'CO', coordinates: [4.71, -74.07], phonePrefix: '+57' },
  { name: 'Ethiopia', code: 'ET', coordinates: [9.03, 38.74], phonePrefix: '+251' },
];

export const TOPICS = ['Health', 'Politics', 'Migration', 'Economy', 'Conflict', 'Environment', 'Technology'] as const;

/** Hotline displayed in header. Romanian toll-free number. */
export const HOTLINE = {
  display: '+40-800-476-674',
  tel: '+40800476674',
};
