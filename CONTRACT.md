# Waypoint - Contract

Data model and build rules for Waypoint. Read before implementing any feature. 

## Data Model

Guides belong to a user, places to a guide, photos to a place. 

```
users
    id, handle, display_name

guides
    id, user_id, title, description, cover_photo_url, is_public, slug

places
    id, guide_id, name, address, notes, rating, category, sort_order, location geography(Point, 4326)

photos
    id, place_id, storarge_path, caption, sort_order
```

## Rules
- Enable the PostGIS extension before any location work
- 'location' is geography(Point, 4326) - never two number columns
- Add a spatial (GiST) index on places.location
- Row Level Security on every table: a user reads/writes only their own guides; pulic guides are readable by anyone when is_public is true
- Slugs are unique, URL-safe, generated when a guide is created
