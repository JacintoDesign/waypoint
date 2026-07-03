# Waypoint - Test Plan

Acceptance checks for Waypoint. Each is obeservable; a subagent runs it and returns a clear pass or fail. 

## Location backend

- Nearby: for a point 500m from place A and 5km from place B, the nearby query returns A, omits B, and reports A's distance within 5% of 500m. 
- On-screen: a map area covering A but not B returns A only.
- Empty Result: a query far from all places returns nothing, not an error. 

## Interface behavior

- Hovering a place card highlights its pin on the map.
- Clicking a pin scrolls its card into view.
- A guide with 0 places opens the editor without error.
- Photos load via temporary signed links; an expired link refreshes quickly rather than breaking.

## Access rules

- A logged-out visitor cannot read a private guide.
- A logged-out visitor can read a public guide by its link.
- A user cannot edit a guide they don't own.