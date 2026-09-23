// Shared location-pin positioning for the world map. Locations with explicit
// map_x/map_y keep their coordinates; the rest are laid out in a golden-angle
// spiral so undiscovered/unspecced pins don't stack on top of each other.
// Coordinates are normalized to a 12.5%–87.5% band so pins never hug the edges.
export function normalizeLocations(locations) {
  if (!locations || !locations.length) return [];
  const withCoords = locations.filter(l => l.map_x != null && l.map_y != null);
  const withoutCoords = locations.filter(l => l.map_x == null || l.map_y == null);
  const assigned = withoutCoords.map((l, i) => {
    const angle = (i * 137.5) * (Math.PI / 180);
    const radius = 25 + Math.floor(i / 8) * 20;
    return { ...l, map_x: 200 + Math.cos(angle) * radius, map_y: 200 + Math.sin(angle) * radius };
  });
  const all = [...withCoords, ...assigned];
  const xs = all.map(l => l.map_x);
  const ys = all.map(l => l.map_y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;
  return all.map(l => ({
    ...l,
    normX: ((l.map_x - minX) / rangeX) * 75 + 12.5,
    normY: ((l.map_y - minY) / rangeY) * 75 + 12.5,
  }));
}