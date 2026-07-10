"use client";

import { useEffect, useRef } from "react";
import type { Map as MaplibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Place } from "@/types/place";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getMapViewportFromPlaces,
  toLngLat,
  viewportKey,
} from "@/lib/map-viewport";
import styles from "./guide-map.module.css";

const WAYPOINT_MAP_STYLE_URL = "/styles/waypoint-style.json";
const FIT_BOUNDS_PADDING = 48;
const FIT_BOUNDS_MAX_ZOOM = 15;

const maplibreglModulePromise = import("maplibre-gl");

export type GuideMapPlace = Pick<Place, "id" | "name" | "location">;

export type GuideMapProps = {
  places: GuideMapPlace[];
  activePlaceId?: string;
  onPinClick?: (placeId: string) => void;
  className?: string;
};

type MarkerEntry = {
  marker: Marker;
  element: HTMLDivElement;
};

function applyViewport(map: MaplibreMap, places: GuideMapPlace[]) {
  const viewport = getMapViewportFromPlaces(places);

  if (viewport.kind === "bounds") {
    map.fitBounds(viewport.bounds, {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: FIT_BOUNDS_MAX_ZOOM,
    });
    return;
  }

  map.easeTo({
    center: viewport.center,
    zoom: viewport.zoom,
  });
}

export function GuideMap({
  places,
  activePlaceId,
  onPinClick,
  className,
}: GuideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const maplibreglRef = useRef<Awaited<typeof maplibreglModulePromise>["default"] | null>(
    null,
  );
  const markersByIdRef = useRef<Map<string, MarkerEntry>>(new Map());
  const lastViewportKeyRef = useRef("");
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;

    void maplibreglModulePromise.then((maplibregl) => {
      if (cancelled) {
        return;
      }

      maplibreglRef.current = maplibregl.default;

      const map = new maplibregl.default.Map({
        container,
        style: WAYPOINT_MAP_STYLE_URL,
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.default.AttributionControl({ compact: true }),
        "bottom-right",
      );

      map.on("load", () => {
        if (cancelled) {
          return;
        }

        syncMarkers(
          map,
          maplibregl.default,
          places,
          activePlaceId,
          markersByIdRef,
          onPinClickRef,
        );
        lastViewportKeyRef.current = viewportKey(places);
        applyViewport(map, places);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      for (const { marker } of markersByIdRef.current.values()) {
        marker.remove();
      }
      markersByIdRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      maplibreglRef.current = null;
      lastViewportKeyRef.current = "";
    };
    // Map is created once per mount; place updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreglRef.current;
    if (!map || !maplibregl || !map.loaded()) {
      return;
    }

    syncMarkers(
      map,
      maplibregl,
      places,
      activePlaceId,
      markersByIdRef,
      onPinClickRef,
    );
  }, [places, activePlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }

    const nextViewportKey = viewportKey(places);
    if (nextViewportKey === lastViewportKeyRef.current) {
      return;
    }

    lastViewportKeyRef.current = nextViewportKey;
    applyViewport(map, places);
  }, [places]);

  return (
    <div
      ref={containerRef}
      className={className ? `${styles.container} ${className}` : styles.container}
      role="region"
      aria-label="Guide map"
    />
  );
}

function syncMarkers(
  map: MaplibreMap,
  maplibregl: Awaited<typeof maplibreglModulePromise>["default"],
  places: GuideMapPlace[],
  activePlaceId: string | undefined,
  markersById: { current: Map<string, MarkerEntry> },
  onPinClickRef: { current: ((placeId: string) => void) | undefined },
) {
  const nextPlaceIds = new Set(places.map((place) => place.id));

  for (const [placeId, { marker }] of markersById.current) {
    if (!nextPlaceIds.has(placeId)) {
      marker.remove();
      markersById.current.delete(placeId);
    }
  }

  for (const place of places) {
    const isActive = place.id === activePlaceId;
    const existing = markersById.current.get(place.id);

    if (existing) {
      existing.marker.setLngLat(toLngLat(place.location));
      existing.element.title = place.name;
      existing.element.classList.toggle(styles.pinActive, isActive);
      existing.element.onclick = () => onPinClickRef.current?.(place.id);
      continue;
    }

    const element = document.createElement("div");
    element.className = isActive
      ? `${styles.pin} ${styles.pinActive}`
      : styles.pin;
    element.title = place.name;
    element.onclick = () => onPinClickRef.current?.(place.id);

    const marker = new maplibregl.Marker({ element })
      .setLngLat(toLngLat(place.location))
      .addTo(map);

    markersById.current.set(place.id, { marker, element });
  }
}
