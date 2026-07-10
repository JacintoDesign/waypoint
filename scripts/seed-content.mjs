import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const BUCKET = "place-photos";

const SEED_USER_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const SEED_GUIDE_ID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

/** @type {ReadonlyArray<{
 *   id: string;
 *   name: string;
 *   address: string;
 *   notes: string;
 *   rating: number;
 *   category: string;
 *   sortOrder: number;
 *   lat: number;
 *   lng: number;
 *   photoFile: string;
 * }>} */
const PLACES = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    name: "Nyhavn",
    address: "Nyhavn, 1051 København",
    notes:
      "The 17th-century waterfront canal with gabled townhouses, outdoor cafés, and harbour boats — Copenhagen at its most photogenic.",
    rating: 5,
    category: "landmark",
    sortOrder: 0,
    lat: 55.6799,
    lng: 12.5908,
    photoFile: "nyhavn, CPH.jpg",
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    name: "Rundetårn",
    address: "Købmagergade 52A, 1150 København",
    notes:
      "Europe's oldest functioning observatory, with a spiral ramp instead of stairs and a rooftop lookout over the old city.",
    rating: 4,
    category: "attraction",
    sortOrder: 1,
    lat: 55.6814,
    lng: 12.5757,
    photoFile: "round tower, CPH.jpg",
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    name: "SMK – Statens Museum for Kunst",
    address: "Sølvgade 48-50, 1307 København",
    notes:
      "Denmark's national gallery spans seven centuries — from Renaissance masters to contemporary Nordic works in a park-side setting.",
    rating: 5,
    category: "museum",
    sortOrder: 2,
    lat: 55.6889,
    lng: 12.5784,
    photoFile: "smk gallery, CPH.jpg",
  },
  {
    id: "11111111-1111-1111-1111-111111111104",
    name: "Designmuseum Danmark",
    address: "Bredgade 68, 1260 København",
    notes:
      "Danish design history from the 17th century to today — furniture, fashion, and craft in a former royal hospital.",
    rating: 4,
    category: "museum",
    sortOrder: 3,
    lat: 55.6869,
    lng: 12.593,
    photoFile: "designmuseum, CPH.jpg",
  },
  {
    id: "11111111-1111-1111-1111-111111111105",
    name: "The Black Diamond",
    address: "Søren Kierkegaards Plads 1, 1221 København",
    notes:
      "The Royal Danish Library's waterfront extension — black granite facets, a soaring atrium, and harbour views from the reading rooms.",
    rating: 5,
    category: "architecture",
    sortOrder: 4,
    lat: 55.6736,
    lng: 12.5806,
    photoFile: "black diamond, CPH.jpg",
  },
  {
    id: "11111111-1111-1111-1111-111111111106",
    name: "Tivoli Gardens",
    address: "Vesterbrogade 3, 1630 København",
    notes:
      "One of the world's oldest amusement parks — gardens, pavilions, and vintage rides a short walk from City Hall.",
    rating: 5,
    category: "park",
    sortOrder: 5,
    lat: 55.6737,
    lng: 12.5684,
    photoFile: "tivoli gardens, CPH.jpg",
  },
  {
    id: "11111111-1111-1111-1111-111111111107",
    name: "Museum of Illusions Copenhagen",
    address: "Vandkunsten 5, 1467 København",
    notes:
      "Interactive optical illusions and perspective rooms — fun for an hour of mind-bending photos in the city centre.",
    rating: 4,
    category: "museum",
    sortOrder: 6,
    lat: 55.6761,
    lng: 12.5686,
    photoFile: "museum of illusions, CPH.jpg",
  },
];

const PHOTOS_DIR = join(process.cwd(), "seed/photos");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createServiceClient() {
  loadEnvFile(join(process.cwd(), ".env.local"));
  loadEnvFile(join(process.cwd(), ".env"));

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function toGeographyPoint(lng, lat) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw listError;
  }

  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 52_428_800,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (createError) {
    throw createError;
  }

  console.log(`Created storage bucket "${BUCKET}" (private).`);
}

async function listStorageFiles(supabase, prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return [];
  }

  const paths = [];

  for (const item of data) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id === null) {
      const nested = await listStorageFiles(supabase, itemPath);
      paths.push(...nested);
      continue;
    }

    paths.push(itemPath);
  }

  return paths;
}

async function cleanSeed(supabase) {
  console.log("Cleaning existing Copenhagen seed data...");

  const storagePaths = await listStorageFiles(supabase, SEED_GUIDE_ID);
  if (storagePaths.length > 0) {
    const { error } = await supabase.storage.from(BUCKET).remove(storagePaths);
    if (error) {
      throw error;
    }
    console.log(`Removed ${storagePaths.length} object(s) from "${BUCKET}".`);
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(SEED_USER_ID);
  if (authError && authError.message !== "User not found") {
    throw authError;
  }

  console.log("Clean complete.");
}

function assertPhotoFilesExist() {
  const filesOnDisk = new Set(readdirSync(PHOTOS_DIR));
  const missing = PLACES.map((place) => place.photoFile).filter(
    (file) => !filesOnDisk.has(file),
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing photo file(s) in ${PHOTOS_DIR}: ${missing.join(", ")}`,
    );
  }
}

async function insertSeed(supabase) {
  console.log("Inserting Copenhagen seed data...");

  const { error: authCreateError } = await supabase.auth.admin.createUser({
    id: SEED_USER_ID,
    email: "copenhagen-seed@waypoint.local",
    password: createHash("sha256").update(SEED_USER_ID).digest("hex"),
    email_confirm: true,
  });
  if (authCreateError) {
    throw authCreateError;
  }

  const { error: userError } = await supabase.from("users").insert({
    id: SEED_USER_ID,
    handle: "copenhagen_guide",
    display_name: "Sofie Andersen",
  });
  if (userError) {
    throw userError;
  }

  const { error: guideError } = await supabase.from("guides").insert({
    id: SEED_GUIDE_ID,
    user_id: SEED_USER_ID,
    title: "Copenhagen Again",
    description:
      "A photo-forward guide to Copenhagen landmarks, museums, and harbour walks — the places worth visiting again.",
    is_public: true,
  });
  if (guideError) {
    throw guideError;
  }

  const placeRows = PLACES.map((place) => ({
    id: place.id,
    guide_id: SEED_GUIDE_ID,
    name: place.name,
    address: place.address,
    notes: place.notes,
    rating: place.rating,
    category: place.category,
    sort_order: place.sortOrder,
    location: toGeographyPoint(place.lng, place.lat),
  }));

  const { error: placesError } = await supabase.from("places").insert(placeRows);
  if (placesError) {
    throw placesError;
  }

  for (const place of PLACES) {
    const filePath = join(PHOTOS_DIR, place.photoFile);
    const fileBytes = readFileSync(filePath);
    const objectPath = `${SEED_GUIDE_ID}/${place.id}/${basename(place.photoFile)}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, fileBytes, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (uploadError) {
      throw uploadError;
    }

    const storagePath = uploadData.path;
    const { error: photoError } = await supabase.from("photos").insert({
      place_id: place.id,
      storage_path: storagePath,
      caption: place.name,
      sort_order: 0,
    });
    if (photoError) {
      throw photoError;
    }

    console.log(`Uploaded ${place.photoFile} → ${storagePath}`);
  }

  console.log(
    `Seed complete: author @copenhagen_guide, guide "${SEED_GUIDE_ID}", ${PLACES.length} places.`,
  );
}

async function main() {
  assertPhotoFilesExist();

  const supabase = createServiceClient();

  await ensureBucket(supabase);
  await cleanSeed(supabase);
  await insertSeed(supabase);
}

main().catch((error) => {
  console.error("Content seed failed:", error.message ?? error);
  process.exit(1);
});
