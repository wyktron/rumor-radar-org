# Rumor Watch

# Rumor Radar - Lovable Project Prompt

## Overview

Create a comprehensive disinformation tracking and fact-checking platform called **Rumor Radar**. This is a real-time rumor tracking platform that monitors, visualizes, and debunks misinformation spreading across countries. The platform features an interactive heatmap, CSO (Civil Society Organization) network, timeline view, and moderation dashboard.

## Core Features

### 1. Interactive Heatmap (Main View)
- **Leaflet.js-based map** showing rumor spreading origins
- **Glowing markers** with colors based on intensity/trending level:
  - Blue (0-25%): Low
  - Cyan (25-50%): Moderate  
  - Amber (50-75%): High
  - Red (75-100%): Viral
- **Draggable markers** - Moderators can reposition rumor origins by dragging
- **Marker popups** showing rumor details (title, country, topic, status, intensity)
- Click markers to expand full details in a dialog
- **Filter panel** - filter by country, topic, status, date range

### 2. Timeline View
- Chronological list of all rumors (newest first)
- Search functionality
- Filters: Country, Topic, Status (pending/debunked/verified-true)
- RSS feed available at `/api/rss`
- Each entry shows: date, status badge, country, topic, intensity indicator
- Expandable details with debunk/verification info

### 3. CSO Network View
- Grid of verified fact-checking organizations
- Each CSO card shows: name, country, verified badge, description, website, contact email, date joined
- Map showing CSO locations

### 4. Dashboard (Moderator/CSO Workspace)
- **Login Required** - Different roles:
  - Moderator: Approve/reject submissions, manage registrations, control trending intensity
  - CSO: Submit debunks/verifications
- **Moderator tabs:**
  - Overview: Stats (total rumors, debunked, verified true, pending, CSO partners)
  - Submissions: Review/approve anonymous rumor submissions with translation
  - Debunks: Review/approve CSO debunk submissions
  - Registrations: Approve new CSO partners
  - Trending Control: Adjust intensity sliders for each rumor
- **CSO tabs:**
  - Submit Debunk: Form to debunk or verify rumors (with source URL validation)
  - My Debunks: Track submitted debunks

### 5. Submit Rumor (Public)
- Anonymous submission form
- Fields: claim, location (country), topic (dropdown)
- Optional: source (social media, messaging app, etc.)

### 6. Multi-language Support
- Supported languages: English, French, Spanish, Arabic, Russian
- Language switcher in header
- Automatic source language detection based on country
- All content translatable
- RTL support for Arabic

### 7. Impact View
- Statistics visualization
- Charts showing debunk success

### 8. About Section
- Platform information
- CSO partnership explanation

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Maps:** Leaflet.js + react-leaflet
- **Backend (optional):** PocketBase (for production)
- **i18n:** i18next + react-i18next
- **Forms:** React Hook Form + Zod
- **Deployment:** Docker (Nginx)

## UI/UX Specifications

### Color Palette
- Primary: Blue (#3b82f6)
- Secondary: Slate (#64748b)
- Background: White (#ffffff) / Slate-50 (#f8fafc)
- Success: Emerald (#10b981)
- Warning: Amber (#f59e0b)
- Error: Red (#ef4444)
- Map tiles: OpenStreetMap or CartoDB

### Component Library (shadcn/ui)
- Button, Input, Textarea, Label, Badge
- Dialog (for rumor details)
- Select (dropdowns)
- Tabs (dashboard)
- Slider (intensity control)
- Card, Sheet, Toast
- Avatar, Calendar
- Pagination, Separator
- Switch, Toggle
- Command (search)
- Form with shadcn validation

### Layout
- Fixed header with navigation (Heatmap, Timeline, CSOs, Dashboard, Impact, About)
- Collapsible filter panel on heatmap
- Mobile responsive
- Dark/light theme support

### Map Features
- Default center: [15, 5] (world view)
- Default zoom: 2
- Custom glowing markers with pulsing animation
- Debunked rumors: green glow
- Verified true: blue glow
- Pending/active: intensity-based color

## Data Models (TypeScript Interfaces)

```typescript
type UserRole = 'moderator' | 'cso' | 'anonymous' | 'guest';

interface CSO {
  id: string;
  name: string;
  country: string;
  logo?: string;
  verified: boolean;
  description: string;
  website?: string;
  contactEmail: string;
  dateJoined: string;
}

interface Rumor {
  id: string;
  title: string;
  description: string;
  country: CountryRegion;
  topic: 'Health' | 'Politics' | 'Migration' | 'Economy' | 'Conflict' | 'Environment' | 'Technology';
  coordinates: [number, number]; // [lat, lng]
  intensity: number; // 0-1
  status: 'pending' | 'approved' | 'debunked' | 'verified-true' | 'rejected';
  submittedAt: string;
  sourceLanguage: 'en' | 'fr' | 'es' | 'ar' | 'ru';
  translations: {
    en?: { title: string; description: string };
    fr?: { title: string; description: string };
    es?: { title: string; description: string };
    ar?: { title: string; description: string };
    ru?: { title: string; description: string };
  };
  // Debunk info
  debunkedBy?: string;
  debunkedAt?: string;
  debunkContent?: string;
  debunkSources?: string[];
  // Verification info
  verifiedBy?: string;
  verifiedAt?: string;
  verificationContent?: string;
  verificationSources?: string[];
}

interface RumorSubmission {
  id: string;
  claim: string;
  location: CountryRegion;
  topic: Topic;
  source?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DebunkSubmission {
  id: string;
  rumorId: string;
  csoId: string;
  content: string;
  sources: string[];
  submissionType: 'debunk' | 'verify-true';
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface CSORegistration {
  id: string;
  organizationName: string;
  country: CountryRegion;
  contactName: string;
  contactEmail: string;
  website?: string;
  description: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  csoId?: string;
  isApproved: boolean;
}
```

## Default Data (Dummy)

### Sample CSOs (Global)
1. FactCheck Alliance - United States
2. AFP Factuel - France
3. Maldita.es - Spain
4. Full Fact - United Kingdom
5. Correctiv - Germany
6. DataVerify Kenya - Kenya
7. Brazilian Fact Lab - Brazil
8. Tokyo Info Integrity - Japan
9. Cairo Media Watch - Egypt

### Sample Rumors
Include ~20 debunked and ~20 pending rumors covering various countries and topics.

### Topics
- Health, Politics, Migration, Economy, Conflict, Environment, Technology

### Demo Users
- Moderator: admin@rumorradar.org / RumorRadar2024!Secure
- CSO: cso@rumorradar.org / CSOPartner2024!Demo

## Deployment

### Docker Compose
- Frontend: Nginx on port 80
- PocketBase: Optional backend on port 8090

### Environment Variables
```
VITE_POCKETBASE_URL=https://your-domain.com
VITE_USE_BACKEND=false  // Use dummy data
```

### Production Features (Optional)
- Cloudflare Tunnel for public access
- PocketBase backend for persistence
- Email notifications
- Contact form

## File Structure

```
/app
  /src
    /components
      /map
        DraggableHeatmapMap.tsx
      /ui
        (shadcn components)
      Header.tsx
      SubscribeButton.tsx
      NotificationPrompt.tsx
      DemoPopup.tsx
    /context
      AuthContext.tsx
      DataContext.tsx
    /sections
      DashboardSection.tsx
      TimelineSection.tsx
      CSONetworkSection.tsx
      ImpactSection.tsx
      AboutSection.tsx
      SubmitSection.tsx
    /hooks
      useRumors.ts
      useCSOs.ts
      useTranslatedRumors.ts
      use-mobile.ts
      use-toast.ts
    /services
      rumorService.ts
      csoService.ts
      emailService.ts
      contactService.ts
    /lib
      pocketbase.ts
      utils.ts
    /data
      dummyData.ts
    /types
      index.ts
    /constants
      countries.ts
    /i18n
      index.ts
      /locales
        en.json, fr.json, es.json, ar.json, ru.json
    App.tsx
    main.tsx
    index.css
  package.json
  tailwind.config.js
  vite.config.ts
  tsconfig.json
```

## Key Implementation Details

1. **Map Rendering**: Use react-leaflet with custom marker icons (divIcon with CSS shadows for glow effect)

2. **State Management**: React Context for Auth and Data (dummy data when VITE_USE_BACKEND=false)

3. **i18n**: Complete translation files for all 5 languages with keys for all UI text

4. **Country Data**: Use `world-countries` npm package for country names, coordinates, phone prefixes

5. **Filtering**: Client-side filtering by country, topic, status - update map and list views reactively

6. **Intensity Control**: Moderator can adjust intensity 0-100% with slider - immediately updates marker colors

7. **Demo Mode**: Hardcoded dummy users check against dummyUsers array - no real authentication in dev mode

8. **Responsive**: Mobile-friendly with collapsible panels and touch support for map

## Build & Run

```bash
npm install
npm run dev     # Development
npm run build   # Production build
npm run lint   # Linting
```

Production build creates static files in `/dist` - serve via Nginx.

## Additional Notes

- All user data stored locally in context when using dummy mode
- Form validation using Zod schemas
- Toast notifications for user feedback
- Demo popup shows on first visit explaining the platform
- Notification prompt for browser notifications permission
- RSS feed endpoint for timeline subscriptions

VERY IMPORTANT: THE PROPOSED TOOLS ARE JUST A SUGGESTION, USE THE AVAILABLE CONNECTORS YOU HAVE TO REPLACE AND MAKE A BETTER ARCHITECTURE

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rumor-radar-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/07ff7927-d1b1-4451-9602-1fe56e069b7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
