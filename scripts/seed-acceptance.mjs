import { execSync } from "node:child_process";
import { join } from "node:path";

const sqlPath = join(process.cwd(), "supabase/seed-acceptance.sql");

function assertLocalSupabaseRunning() {
  try {
    execSync("supabase status", {
      stdio: "pipe",
      cwd: process.cwd(),
    });
  } catch {
    throw new Error("Local Supabase is not running. Start it with: supabase start");
  }
}

assertLocalSupabaseRunning();

console.log("Seeding acceptance fixtures to local Supabase only...");
execSync(`supabase db query --local -f "${sqlPath}"`, {
  stdio: "inherit",
  cwd: process.cwd(),
});
console.log("Acceptance seed complete.");
