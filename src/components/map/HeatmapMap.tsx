import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '@/context/AppContext';
import type { Rumor } from '@/types';
import { intensityColor, intensityLabel, statusLabel, relativeTime } from '@/lib/rumor-utils';

interface Props {
  rumors: Rumor[];
  draggable?: boolean;
  onSelect?: (rumor: Rumor) => void;
  /** When true, clicking the map calls `onPick` with [lat, lng] instead of selecting markers. */
  pickMode?: boolean;
  onPick?: (coords: [number, number]) => void;
}

function buildIcon(color: string, viral: boolean, rumorId: string) {
  return L.divIcon({
    className: '',
    html: `<div class="rumor-marker" data-rumor-id="${rumorId}" style="color:${color}">
      ${viral ? '<div class="pulse"></div>' : ''}
      <div class="core"></div>
      <div class="ping"></div>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/**
 * Approximate "spread radius" in degrees of latitude for each country, so markers
 * fan out inside the country instead of stacking on one centroid.
 */
const SMALL_COUNTRIES = new Set([
  'Moldova', 'Belgium', 'Netherlands', 'Luxembourg', 'Slovenia', 'Albania', 'North Macedonia',
  'Montenegro', 'Kosovo', 'Estonia', 'Latvia', 'Lithuania', 'Switzerland', 'Denmark', 'Israel',
  'Lebanon', 'Cyprus', 'Malta', 'Bosnia and Herzegovina', 'Croatia', 'Serbia', 'Slovakia',
  'Armenia', 'Georgia', 'Azerbaijan', 'Singapore', 'Qatar', 'Kuwait',
]);
const LARGE_COUNTRIES = new Set([
  'Russia', 'United States', 'Canada', 'China', 'Brazil', 'Australia', 'India', 'Argentina',
  'Kazakhstan', 'Algeria', 'Democratic Republic of the Congo', 'Sudan', 'Libya', 'Mexico',
  'Indonesia', 'Saudi Arabia',
]);

function spreadRadius(country: string): number {
  if (SMALL_COUNTRIES.has(country)) return 0.55;
  if (LARGE_COUNTRIES.has(country)) return 7;
  return 2.2;
}

function hash01(s: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Deterministically scatters a marker around its country anchor, so rumors from
 * the same country spread out instead of stacking on one point. Position depends
 * only on the rumor id, so it stays put across filters and reloads.
 */
function scatteredCoords(r: Rumor): [number, number] {
  const [baseLat, baseLng] = r.coordinates;
  const radius = spreadRadius(r.originCountry);
  const t = Math.sqrt(hash01(r.id, 7)) * radius;
  const angle = hash01(r.id, 131) * Math.PI * 2;
  const lngScale = 1 / Math.max(0.25, Math.cos((baseLat * Math.PI) / 180));
  return [baseLat + t * Math.sin(angle), baseLng + t * Math.cos(angle) * lngScale];
}

export function HeatmapMap({ rumors, draggable = false, onSelect, pickMode = false, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
  const { updateRumorCoordinates } = useApp();

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [50, 15],
      zoom: 4,
      worldCopyJump: true,
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
    });
    // Zoom sits top-right, directly beneath the "Submit a rumor" button.
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Esri Light Gray Canvas — free, no API key required.
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
        maxZoom: 16,
      },
    ).addTo(map);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, opacity: 0.8 },
    ).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // update markers when rumors change
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    rumors.forEach((r) => {
      const color = intensityColor(r.intensity, r.status);
      const viral = r.intensity >= 0.6 && r.status === 'pending';
      const marker = L.marker(draggable ? r.coordinates : scatteredCoords(r), {
        icon: buildIcon(color, viral, r.id),
        draggable,
      });
      const aboutBadge = r.subjectCountry && r.subjectCountry !== r.originCountry
        ? `<span style="background:hsl(var(--secondary));padding:2px 6px;border-radius:4px;font-size:10px">about: ${escapeHtml(r.subjectCountry)}</span>`
        : '';
      marker.bindPopup(
        `<div style="min-width:220px">
          <div style="font-weight:600;margin-bottom:4px;color:hsl(var(--foreground))">${escapeHtml(r.title)}</div>
          <div style="font-size:10px;color:hsl(var(--muted-foreground));margin-bottom:6px">Origin · ${escapeHtml(r.originCountry)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            ${aboutBadge}
            <span style="background:hsl(var(--secondary));padding:2px 6px;border-radius:4px;font-size:10px">${escapeHtml(r.topic)}</span>
            <span style="background:${color};color:#000;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600">${statusLabel(r.status)}</span>
          </div>
          <div style="font-size:11px;color:hsl(var(--muted-foreground))">Intensity: ${intensityLabel(r.intensity)} · ${Math.round(r.intensity * 100)}%</div>
          <div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:2px">${relativeTime(r.submittedAt)}</div>
        </div>`,
      );
      marker.on('click', () => onSelect?.(r));
      if (draggable) {
        marker.on('dragend', (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          updateRumorCoordinates(r.id, [ll.lat, ll.lng]);
        });
      }
      marker.addTo(layer);
    });
  }, [rumors, draggable, onSelect, updateRumorCoordinates]);

  // Sweep-marker interaction — pulse markers as the horizontal radar sweep
  // passes over them. We read the bar's actual position each frame so the math
  // stays correct at any viewport size.
  useEffect(() => {
    const container = containerRef.current;
    // The sweep cone lives in the outer wrapper (sibling of the map container),
    // so look it up from the parent — not from the map container itself.
    const root = container?.parentElement;
    if (!container || !root) return;
    const SWEEP_PERIOD_MS = 7000;
    const recentlySwept = new Map<string, number>();
    let raf = 0;

    const tick = () => {
      const bar = root.querySelector<HTMLElement>('.radar-sweep-cone');
      if (bar) {
        const bRect = bar.getBoundingClientRect();
        const edgeX = bRect.right; // leading (right) edge of the sweep bar
        const now = performance.now();
        // Markers are rendered inside the map container by Leaflet
        const markers = container.querySelectorAll<HTMLElement>('.rumor-marker[data-rumor-id]');
        markers.forEach((el) => {
          const r = el.getBoundingClientRect();
          const mx = r.left + r.width / 2;
          const id = el.dataset.rumorId!;
          // Trigger when the leading edge crosses the marker
          if (edgeX >= mx - 6 && edgeX <= mx + 30) {
            const last = recentlySwept.get(id) ?? 0;
            if (now - last > SWEEP_PERIOD_MS - 500) {
              recentlySwept.set(id, now);
              el.classList.remove('swept');
              void el.offsetWidth;
              el.classList.add('swept');
            }
          }
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // pick mode — click anywhere on the map to capture coordinates
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    if (pickHandlerRef.current) {
      map.off('click', pickHandlerRef.current);
      pickHandlerRef.current = null;
    }

    if (pickMode) {
      container.style.cursor = 'crosshair';
      const handler = (e: L.LeafletMouseEvent) => {
        onPick?.([e.latlng.lat, e.latlng.lng]);
      };
      map.on('click', handler);
      pickHandlerRef.current = handler;
    } else {
      container.style.cursor = '';
    }

    return () => {
      if (pickHandlerRef.current) {
        map.off('click', pickHandlerRef.current);
        pickHandlerRef.current = null;
      }
      if (container) container.style.cursor = '';
    };
  }, [pickMode, onPick]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full overflow-hidden" />
      {/* Radar sweep overlay — purely decorative, non-interactive */}
      <div className="radar-overlay pointer-events-none absolute inset-0 z-[200] overflow-hidden">
        <div className="radar-sweep-cone" />
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
