const CITY_ALIASES: Record<string, string> = {
  cph: "Copenhagen",
  copenhagen: "Copenhagen",
  kbh: "Copenhagen",
  nyc: "New York",
  ny: "New York",
  la: "Los Angeles",
  sf: "San Francisco",
  lon: "London",
  ldn: "London",
  par: "Paris",
};

const GENERIC_FILENAME =
  /^(IMG_|DSC_|PXL_|MVIMG_|Screenshot|photo|image|\d{8}[_-]|\d{4}-\d{2}-\d{2})/i;

function humanizePlacePart(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCityHint(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return CITY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

/** Build a geocoding query from a photo filename when it encodes place hints. */
export function buildGeocodeQueryFromFilename(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/i, "").trim();
  if (!base || GENERIC_FILENAME.test(base)) {
    return null;
  }

  let placePart = base;
  let cityPart: string | null = null;

  if (base.includes(",")) {
    const [place, city] = base.split(",", 2).map((part) => part.trim());
    placePart = place;
    cityPart = city;
  } else if (base.includes("__")) {
    const parts = base.split("__").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      cityPart = parts[parts.length - 1];
      placePart = parts.slice(0, -1).join(" ");
    }
  } else {
    const citySuffix = base.match(/^(.*)[-_]([A-Za-z]{2,5})$/);
    if (citySuffix) {
      placePart = citySuffix[1];
      cityPart = citySuffix[2];
    }
  }

  const placeName = humanizePlacePart(placePart);
  if (placeName.length < 3) {
    return null;
  }

  const city = resolveCityHint(cityPart);
  return city ? `${placeName}, ${city}` : placeName;
}
