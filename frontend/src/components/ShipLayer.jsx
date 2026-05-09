import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../store/useStore'

const SHIP_CONFIG = {
  cargo:    { color: '#38bdf8', glow: '#0ea5e9', label: 'Cargo',    size: 26 },
  tanker:   { color: '#f59e0b', glow: '#d97706', label: 'Tanker',   size: 28 },
  fishing:  { color: '#34d399', glow: '#059669', label: 'Fishing',  size: 22 },
  naval:    { color: '#a78bfa', glow: '#7c3aed', label: 'Naval',    size: 28 },
  research: { color: '#f472b6', glow: '#db2777', label: 'Research', size: 24 },
}

function shipIcon(type, heading) {
  const cfg  = SHIP_CONFIG[type] ?? SHIP_CONFIG.cargo
  const { color, glow, size } = cfg
  const half = size / 2

  // Sleek vessel silhouette: pointed bow, wider midship, tapered stern
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <filter id="glow-${type}" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g transform="rotate(${heading}, ${half}, ${half})" filter="url(#glow-${type})">
      <polygon
        points="${half},2 ${half + 4},${size - 5} ${half},${size - 9} ${half - 4},${size - 5}"
        fill="${color}"
        opacity="0.95"
      />
      <line x1="${half}" y1="2" x2="${half}" y2="${size - 2}"
        stroke="${glow}" stroke-width="0.8" opacity="0.35"/>
      <circle cx="${half}" cy="${size * 0.38}" r="1.8" fill="${glow}" opacity="0.9"/>
    </g>
  </svg>`

  return L.divIcon({
    html:       svg,
    iconSize:   [size, size],
    iconAnchor: [half, half],
    className:  'ship-marker',
  })
}

export default function ShipLayer() {
  const ships = useStore(s => s.ships)

  return ships.map(ship => {
    const cfg = SHIP_CONFIG[ship.type] ?? SHIP_CONFIG.cargo
    return (
      <Marker
        key={ship.id}
        position={[ship.lat, ship.lng]}
        icon={shipIcon(ship.type, ship.heading)}
        zIndexOffset={100}
      >
        <Tooltip direction="top" offset={[0, -12]} opacity={1} className="!p-0 !m-0 !border-0 !shadow-none !bg-transparent">
          <div style={{
            background:    'rgba(4,10,26,0.97)',
            border:        `1px solid ${cfg.color}35`,
            borderRadius:  8,
            padding:       '9px 13px',
            backdropFilter: 'blur(16px)',
            boxShadow:     `0 4px 24px rgba(0,0,0,0.55), 0 0 0 1px ${cfg.color}18`,
            minWidth:      140,
          }}>
            {/* Header */}
            <div className="flex items-center gap-2" style={{ marginBottom: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {cfg.label}
              </span>
              <span style={{ fontSize: 10, color: '#334a60', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                #{String(ship.id).padStart(3, '0')}
              </span>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px' }}>
              {[
                { label: 'Speed',   value: `${ship.speed.toFixed(1)} kn` },
                { label: 'Heading', value: `${((ship.heading % 360 + 360) % 360).toFixed(0)}°` },
                { label: 'Lat',     value: `${ship.lat.toFixed(3)}°N` },
                { label: 'Lon',     value: `${ship.lng.toFixed(3)}°E` },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: 8, color: '#334a60', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#8bacc8', fontWeight: 600 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Tooltip>
      </Marker>
    )
  })
}
