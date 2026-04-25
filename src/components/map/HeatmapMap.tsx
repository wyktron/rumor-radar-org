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
    L.control.zoom({ position: 'topleft' }).addTo(map);
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    ).addTo(map);
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19, opacity: 0.7 },
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
      const marker = L.marker(r.coordinates, {
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
