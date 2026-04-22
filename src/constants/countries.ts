export interface Country {
  name: string;
  code: string;
  coordinates: [number, number];
}

export const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', coordinates: [38.9, -77.0] },
  { name: 'United Kingdom', code: 'GB', coordinates: [51.5, -0.12] },
  { name: 'France', code: 'FR', coordinates: [48.85, 2.35] },
  { name: 'Germany', code: 'DE', coordinates: [52.52, 13.4] },
  { name: 'Spain', code: 'ES', coordinates: [40.4, -3.7] },
  { name: 'Italy', code: 'IT', coordinates: [41.9, 12.5] },
  { name: 'Brazil', code: 'BR', coordinates: [-15.78, -47.92] },
  { name: 'Mexico', code: 'MX', coordinates: [19.43, -99.13] },
  { name: 'Argentina', code: 'AR', coordinates: [-34.6, -58.38] },
  { name: 'Kenya', code: 'KE', coordinates: [-1.29, 36.82] },
  { name: 'Nigeria', code: 'NG', coordinates: [9.08, 8.68] },
  { name: 'South Africa', code: 'ZA', coordinates: [-26.2, 28.04] },
  { name: 'Egypt', code: 'EG', coordinates: [30.04, 31.24] },
  { name: 'Morocco', code: 'MA', coordinates: [33.97, -6.85] },
  { name: 'Turkey', code: 'TR', coordinates: [39.93, 32.86] },
  { name: 'Russia', code: 'RU', coordinates: [55.75, 37.62] },
  { name: 'Ukraine', code: 'UA', coordinates: [50.45, 30.52] },
  { name: 'India', code: 'IN', coordinates: [28.61, 77.21] },
  { name: 'Pakistan', code: 'PK', coordinates: [33.69, 73.05] },
  { name: 'China', code: 'CN', coordinates: [39.9, 116.4] },
  { name: 'Japan', code: 'JP', coordinates: [35.68, 139.69] },
  { name: 'Indonesia', code: 'ID', coordinates: [-6.2, 106.85] },
  { name: 'Philippines', code: 'PH', coordinates: [14.6, 120.98] },
  { name: 'Australia', code: 'AU', coordinates: [-35.28, 149.13] },
  { name: 'Canada', code: 'CA', coordinates: [45.42, -75.69] },
  { name: 'Venezuela', code: 'VE', coordinates: [10.5, -66.92] },
  { name: 'Colombia', code: 'CO', coordinates: [4.71, -74.07] },
  { name: 'Ethiopia', code: 'ET', coordinates: [9.03, 38.74] },
];

export const TOPICS = ['Health', 'Politics', 'Migration', 'Economy', 'Conflict', 'Environment', 'Technology'] as const;
