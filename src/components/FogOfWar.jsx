// Fog-of-war overlay for the illustrated world map. Obscures the painted map
// except for soft "revealed" areas around discovered locations and the
// party's current location — so players only see geography they've actually
// explored, per traditional D&D mapping.
//
// Props:
//   revealedPoints: [{ id, x, y, r? }]  — coordinates in 0–100 percentage space
//   opacity?: number (0–1)              — how opaque the fog is (default 0.95)
//
// When there are no revealed points, the whole map is fogged.
export default function FogOfWar({ revealedPoints = [], opacity = 0.95 }) {
  if (!revealedPoints.length) {
    return <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(15,12,9,${opacity})` }} aria-hidden="true" />;
  }
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fog-hole">
          <stop offset="0" stopColor="black" />
          <stop offset="0.6" stopColor="black" />
          <stop offset="1" stopColor="white" />
        </radialGradient>
        <mask id="fog-mask">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {revealedPoints.map(p => (
            <circle key={p.id} cx={p.x} cy={p.y} r={p.r ?? 17} fill="url(#fog-hole)" />
          ))}
        </mask>
      </defs>
      <rect
        x="0" y="0" width="100" height="100"
        fill="rgb(15,12,9)"
        mask="url(#fog-mask)"
        opacity={opacity}
      />
    </svg>
  );
}