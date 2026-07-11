"use client";

import { useEffect, useRef } from "react";
import type { Map as MaplibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Place, PlaceLocation } from "@/types/place";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getMapViewportFromPlaces,
  toLngLat,
  viewportKey,
  type MapViewport,
} from "@/lib/map-viewport";
import { isValidPlaceLocation } from "@/lib/place-location";
import styles from "./guide-map.module.css";

const WAYPOINT_MAP_STYLE_URL = "/styles/waypoint-style.json";
const FIT_BOUNDS_PADDING = 48;
const FIT_BOUNDS_MAX_ZOOM = 15;
const GLOBE_ARRIVAL_FLY_TO = {
  speed: 0.8,
  curve: 1.4,
  essential: true,
} as const;

const maplibreglModulePromise = import("maplibre-gl");

export type GuideMapPlace = Pick<Place, "id" | "name" | "location">;

export type GuideMapDraftPin = {
  id: string;
  location: PlaceLocation;
  label?: string;
};

export type GuideMapProps = {
  places: GuideMapPlace[];
  activePlaceId?: string;
  draftPins?: GuideMapDraftPin[];
  onPinClick?: (placeId: string) => void;
  onDraftPinClick?: (draftId: string) => void;
  onMapClick?: (location: PlaceLocation) => void;
  autoFitViewport?: boolean;
  globeArrival?: boolean;
  className?: string;
};

type MarkerEntry = {
  marker: Marker;
  element: HTMLDivElement;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMapContainerFullyVisible(entry: IntersectionObserverEntry): boolean {
  if (entry.intersectionRatio >= 1) {
    return true;
  }

  const { height, top, bottom } = entry.boundingClientRect;
  const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;

  if (height > viewportHeight) {
    return top <= 0 && bottom >= viewportHeight;
  }

  return false;
}

function getFlyToCamera(map: MaplibreMap, viewport: MapViewport) {
  if (viewport.kind === "bounds") {
    const camera = map.cameraForBounds(viewport.bounds, {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: FIT_BOUNDS_MAX_ZOOM,
    });

    if (camera) {
      return camera;
    }

    return {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
    };
  }

  return {
    center: viewport.center,
    zoom: viewport.zoom,
  };
}

function applyViewport(
  map: MaplibreMap,
  places: GuideMapPlace[],
  draftPins: GuideMapDraftPin[] = [],
) {
  const viewport = getMapViewportFromPlaces([
    ...places,
    ...draftPins.map((pin) => ({ location: pin.location })),
  ]);

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
  draftPins = [],
  onPinClick,
  onDraftPinClick,
  onMapClick,
  autoFitViewport = true,
  globeArrival = false,
  className,
}: GuideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const globeArrivalObserverRef = useRef<IntersectionObserver | null>(null);
  const globeArrivalCompletedRef = useRef(false);
  const maplibreglRef = useRef<Awaited<typeof maplibreglModulePromise>["default"] | null>(
    null,
  );
  const markersByIdRef = useRef<Map<string, MarkerEntry>>(new Map());
  const draftMarkersByIdRef = useRef<Map<string, MarkerEntry>>(new Map());
  const lastViewportKeyRef = useRef("");
  const onPinClickRef = useRef(onPinClick);
  const onDraftPinClickRef = useRef(onDraftPinClick);
  const onMapClickRef = useRef(onMapClick);
  onPinClickRef.current = onPinClick;
  onDraftPinClickRef.current = onDraftPinClick;
  onMapClickRef.current = onMapClick;

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
        syncDraftMarkers(
          map,
          maplibregl.default,
          draftPins,
          draftMarkersByIdRef,
          onDraftPinClickRef,
        );
        lastViewportKeyRef.current = viewportKey([
          ...places,
          ...draftPins.map((pin) => ({ location: pin.location })),
        ]);

        if (globeArrival) {
          if (prefersReducedMotion()) {
            applyViewport(map, places, draftPins);
          } else {
            map.setProjection({ type: "globe" });

            const containerElement = containerRef.current;
            if (!containerElement) {
              return;
            }

            const runGlobeArrival = () => {
              if (cancelled || globeArrivalCompletedRef.current) {
                return;
              }

              globeArrivalCompletedRef.current = true;

              const viewport = getMapViewportFromPlaces([
                ...places,
                ...draftPins.map((pin) => ({ location: pin.location })),
              ]);

              map.once("moveend", () => {
                if (cancelled) {
                  return;
                }

                map.setProjection({ type: "mercator" });
              });

              map.flyTo({
                ...getFlyToCamera(map, viewport),
                ...GLOBE_ARRIVAL_FLY_TO,
              });
            };

            const observer = new IntersectionObserver(
              ([entry]) => {
                if (entry && isMapContainerFullyVisible(entry)) {
                  observer.disconnect();
                  globeArrivalObserverRef.current = null;
                  runGlobeArrival();
                }
              },
              { threshold: [0, 0.25, 0.5, 0.75, 1] },
            );

            globeArrivalObserverRef.current = observer;
            observer.observe(containerElement);
          }
        } else if (autoFitViewport) {
          applyViewport(map, places, draftPins);
        }
      });

      map.on("click", (event) => {
        onMapClickRef.current?.({
          lat: event.lngLat.lat,
          lng: event.lngLat.lng,
        });
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      globeArrivalObserverRef.current?.disconnect();
      globeArrivalObserverRef.current = null;
      globeArrivalCompletedRef.current = false;
      for (const { marker } of markersByIdRef.current.values()) {
        marker.remove();
      }
      markersByIdRef.current.clear();
      for (const { marker } of draftMarkersByIdRef.current.values()) {
        marker.remove();
      }
      draftMarkersByIdRef.current.clear();
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
    syncDraftMarkers(
      map,
      maplibregl,
      draftPins,
      draftMarkersByIdRef,
      onDraftPinClickRef,
    );
  }, [places, activePlaceId, draftPins]);

  useEffect(() => {
    if (!autoFitViewport || globeArrival) {
      return;
    }

    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }

    const nextViewportKey = viewportKey([
      ...places,
      ...draftPins.map((pin) => ({ location: pin.location })),
    ]);
    if (nextViewportKey === lastViewportKeyRef.current) {
      return;
    }

    lastViewportKeyRef.current = nextViewportKey;
    applyViewport(map, places, draftPins);
  }, [places, draftPins, autoFitViewport, globeArrival]);

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
      existing.element.onclick = (event) => {
        event.stopPropagation();
        onPinClickRef.current?.(place.id);
      };
      continue;
    }

    const element = document.createElement("div");
    element.className = isActive
      ? `${styles.pin} ${styles.pinActive}`
      : styles.pin;
    element.title = place.name;
    element.onclick = (event) => {
      event.stopPropagation();
      onPinClickRef.current?.(place.id);
    };

    const marker = new maplibregl.Marker({ element })
      .setLngLat(toLngLat(place.location))
      .addTo(map);

    markersById.current.set(place.id, { marker, element });
  }
}

function syncDraftMarkers(
  map: MaplibreMap,
  maplibregl: Awaited<typeof maplibreglModulePromise>["default"],
  draftPins: GuideMapDraftPin[],
  markersById: { current: Map<string, MarkerEntry> },
  onDraftPinClickRef: { current: ((draftId: string) => void) | undefined },
) {
  const nextDraftIds = new Set(draftPins.map((pin) => pin.id));

  for (const [draftId, { marker }] of markersById.current) {
    if (!nextDraftIds.has(draftId)) {
      marker.remove();
      markersById.current.delete(draftId);
    }
  }

  for (const draftPin of draftPins) {
    if (!isValidPlaceLocation(draftPin.location)) {
      continue;
    }

    const existing = markersById.current.get(draftPin.id);

    if (existing) {
      existing.marker.setLngLat(toLngLat(draftPin.location));
      existing.element.title = draftPin.label ?? "New place";
      existing.element.onclick = (event) => {
        event.stopPropagation();
        onDraftPinClickRef.current?.(draftPin.id);
      };
      continue;
    }

    const element = document.createElement("div");
    element.className = `${styles.pin} ${styles.pinDraft}`;
    element.title = draftPin.label ?? "New place";
    element.onclick = (event) => {
      event.stopPropagation();
      onDraftPinClickRef.current?.(draftPin.id);
    };

    const marker = new maplibregl.Marker({ element })
      .setLngLat(toLngLat(draftPin.location))
      .addTo(map);

    markersById.current.set(draftPin.id, { marker, element });
  }
}
