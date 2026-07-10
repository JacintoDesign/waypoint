import { GuideMap } from "@/components/guide-map";
import { demoPlaces } from "@/lib/demo-places";

export default function HomePage() {
  return (
    <main style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 16 }}>Waypoint</h1>
      <div style={{ height: 480 }}>
        <GuideMap places={demoPlaces} />
      </div>
    </main>
  );
}
