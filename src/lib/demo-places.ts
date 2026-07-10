import type { Place } from "@/types/place";

export const demoPlaces: Pick<Place, "id" | "name" | "location">[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Place A",
    location: { lat: 40.75, lng: -73.98 },
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    name: "Place B",
    location: { lat: 34.05, lng: -118.25 },
  },
];
