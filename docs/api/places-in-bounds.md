# Waypoint API

## Places in bounds (on-screen)

`GET /api/places/in-bounds`

Query parameters (WGS84 / EPSG:4326):

| Param | Type | Description |
|-------|------|-------------|
| `north` | number | Northern latitude bound (-90 to 90) |
| `south` | number | Southern latitude bound (-90 to 90) |
| `east` | number | Eastern longitude bound (-180 to 180) |
| `west` | number | Western longitude bound (-180 to 180) |
| `guideId` | uuid (optional) | Limit results to a single guide |

Validation: `north > south`, `east > west`.

### Response `200`

```json
{
  "places": [
    {
      "id": "uuid",
      "guideId": "uuid",
      "name": "string",
      "address": "string | null",
      "notes": "string | null",
      "rating": 1,
      "category": "string | null",
      "sortOrder": 0,
      "location": {
        "latitude": 40.75,
        "longitude": -73.98
      }
    }
  ]
}
```

### Errors

- `400` — invalid or missing bounds parameters
- `500` — database/RPC failure

Spatial filtering runs in Postgres via `get_places_in_bounds` RPC (see migration).
