import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { seedAcceptanceLocationFixtures } from "./acceptance-location-fixtures.mjs";

const sqlPath = join(process.cwd(), "supabase/seed-acceptance.sql");

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

function isLocalSupabaseRunning() {
  try {
    execSync("supabase status", {
      stdio: "pipe",
      cwd: process.cwd(),
    });
    return true;
  } catch {
    return false;
  }
}

loadEnvFile(join(process.cwd(), ".env"));

if (isLocalSupabaseRunning()) {
  console.log("Seeding acceptance fixtures to local Supabase...");
  execSync(`supabase db query --local -f "${sqlPath}"`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("Acceptance seed complete (local SQL).");
} else {
  console.log(
    "Local Supabase is not running — seeding acceptance fixtures via service role...",
  );
  await seedAcceptanceLocationFixtures();
  console.log("Acceptance seed complete (remote service role).");
}
