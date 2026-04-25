import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
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

  // legend
  const legend = useMemo(
    () => [
      { label: 'Low', color: 'hsl(var(--signal-low))' },
      { label: 'Moderate', color: 'hsl(var(--signal-moderate))' },
      { label: 'High', color: 'hsl(var(--signal-high))' },
      { label: 'Viral', color: 'hsl(var(--signal-viral))' },
      { label: 'Debunked', color: 'hsl(var(--signal-debunked))' },
      { label: 'Verified true', color: 'hsl(var(--signal-verified))' },
    ],
    [],
  );

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full overflow-hidden" />
      {/* Radar sweep overlay — purely decorative, non-interactive */}
      <div className="radar-overlay pointer-events-none absolute inset-0 z-[200] overflow-hidden">
        <div className="radar-sweep-cone" />
      </div>
      {/* Signal intensity legend — positioned above the bottom nav (h-14) so it's always visible */}
      <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 z-[400] glass-panel rounded-md px-3 py-2 text-xs hidden xl:block">
        <div className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground mb-1.5">Signal intensity</div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="signal-dot h-2 w-2" style={{ color: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
