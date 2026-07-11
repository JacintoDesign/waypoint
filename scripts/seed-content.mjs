import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const BUCKET = "place-photos";

const PLACEHOLDER_USER_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const SEED_GUIDE_ID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

const AUTHOR_EMAIL = "ztm.jacinto.design@gmail.com";
const AUTHOR_DISPLAY_NAME = "Jacinto Wong";
const AUTHOR_HANDLE = "jacinto_wong";

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

  const { error: guideDeleteError } = await supabase
    .from("guides")
    .delete()
    .eq("id", SEED_GUIDE_ID);
  if (guideDeleteError) {
    throw guideDeleteError;
  }

  await removePlaceholderUser(supabase);

  console.log("Clean complete.");
}

async function findAuthUserIdViaList(supabase, email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      return null;
    }

    const match = data.users.find((user) => user.email === email);
    if (match) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function findAuthUserIdViaGenerateLink(supabase, email) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) {
    return null;
  }

  return data.user?.id ?? null;
}

async function findAuthUserIdByEmail(supabase, email) {
  return (
    (await findAuthUserIdViaList(supabase, email)) ??
    (await findAuthUserIdViaGenerateLink(supabase, email))
  );
}

async function ensureAuthorUser(supabase) {
  const existingId = await findAuthUserIdByEmail(supabase, AUTHOR_EMAIL);
  if (existingId) {
    console.log(`Reusing existing author account (${AUTHOR_EMAIL}).`);
    return existingId;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: AUTHOR_EMAIL,
    email_confirm: true,
  });
  if (error) {
    const duplicateEmail =
      error.message?.includes("already been registered") ||
      error.message?.includes("already exists") ||
      error.code === "email_exists";
    if (duplicateEmail) {
      const raced = await findAuthUserIdByEmail(supabase, AUTHOR_EMAIL);
      if (raced) {
        console.log(`Reusing existing author account (${AUTHOR_EMAIL}).`);
        return raced;
      }
    }
    throw error;
  }

  console.log(`Created author account (${AUTHOR_EMAIL}).`);
  return data.user.id;
}

async function ensureAuthorProfile(supabase, userId) {
  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      handle: AUTHOR_HANDLE,
      display_name: AUTHOR_DISPLAY_NAME,
    },
    { onConflict: "id" },
  );
  if (error) {
    throw error;
  }
}

async function removePlaceholderUser(supabase) {
  const { error: userDeleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", PLACEHOLDER_USER_ID);
  if (userDeleteError) {
    throw userDeleteError;
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(PLACEHOLDER_USER_ID);
  if (authError && authError.message !== "User not found") {
    throw authError;
  }
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

  const authorId = await ensureAuthorUser(supabase);
  await ensureAuthorProfile(supabase, authorId);

  const { error: guideError } = await supabase.from("guides").insert({
    id: SEED_GUIDE_ID,
    user_id: authorId,
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
    `Seed complete: author @${AUTHOR_HANDLE} (${AUTHOR_EMAIL}), guide "${SEED_GUIDE_ID}", ${PLACES.length} places.`,
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
  const detail =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);
  console.error("Content seed failed:", detail);
  process.exit(1);
});
