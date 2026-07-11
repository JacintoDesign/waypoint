"use client";

import { useCallback, useRef, useState } from "react";
import { GuideMap } from "@/components/guide-map";
import { PlaceCard, type PlaceCardPlace } from "@/components/place-card";
import styles from "./guide-viewer.module.css";

export type GuideViewerPlace = PlaceCardPlace;

export type GuideViewerProps = {
  places: GuideViewerPlace[];
};

export function GuideViewer({ places }: GuideViewerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const highlightedPlaceId = hoveredPlaceId ?? selectedPlaceId ?? undefined;

  const handlePinClick = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);

    const card = listRef.current?.querySelector<HTMLElement>(
      `[data-place-id="${placeId}"]`,
    );
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <div className={styles.viewer}>
      <div ref={listRef} className={styles.cardList} role="list">
        {places.length === 0 ? (
          <p className={styles.empty}>No places in this guide yet.</p>
        ) : (
          places.map((place) => (
            <div key={place.id} role="listitem">
              <PlaceCard
                place={place}
                isActive={place.id === selectedPlaceId}
                onMouseEnter={() => setHoveredPlaceId(place.id)}
                onMouseLeave={() =>
                  setHoveredPlaceId((current) =>
                    current === place.id ? null : current,
                  )
                }
              />
            </div>
          ))
        )}
      </div>
      <div className={styles.mapPanel}>
        <GuideMap
          places={places}
          activePlaceId={highlightedPlaceId}
          onPinClick={handlePinClick}
          autoFitViewport={false}
          globeArrival
        />
      </div>
    </div>
  );
}
