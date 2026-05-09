import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../store/useStore'

const SHIP_COLORS = {
  cargo:    '#38bdf8',
  tanker:   '#f59e0b',
  fishing:  '#34d399',
  naval:    '#a78bfa',
  research: '#f472b6',
}

const SHIP_LABELS = {
  cargo:    'Cargo',
  tanker:   'Tanker',
  fishing:  'Fishing',
  naval:    'Naval',
  research: 'Research',
}

function shipIcon(type, heading) {
  const color = SHIP_COLORS[type] || '#38bdf8'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <g transform="rotate(${heading}, 11, 11)">
      <polygon points="11,2 15,18 11,14 7,18" fill="${color}" opacity="0.95"/>
      <line x1="11" y1="2" x2="11" y2="18" stroke="${color}" stroke-width="0.5" opacity="0.4"/>
    </g>
  </svg>`
  return L.divIcon({
    html:       svg,
    iconSize:   [22, 22],
    iconAnchor: [11, 11],
    className:  'ship-marker',
  })
}

export default function ShipLayer() {
  const ships = useStore(s => s.ships)

  return ships.map(ship => (
    <Marker
      key={ship.id}
      position={[ship.lat, ship.lng]}
      icon={shipIcon(ship.type, ship.heading)}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} className="!p-0 !m-0 !border-0 !shadow-none !bg-transparent">
        <div style={{
          background:    'rgba(4,10,26,0.97)',
          border:        `1px solid ${SHIP_COLORS[ship.type] ?? '#22d3ee'}30`,
          borderRadius:  8,
          padding:       '8px 12px',
          backdropFilter: 'blur(12px)',
          boxShadow:     '0 4px 20px rgba(0,0,0,0.5)',
          minWidth:      130,
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SHIP_COLORS[ship.type] ?? '#22d3ee', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: SHIP_COLORS[ship.type] ?? '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {SHIP_LABELS[ship.type] ?? ship.type}
            </span>
            <span style={{ fontSize: 10, color: '#334a60', fontFamily: 'var(--font-mono)' }}>#{ship.id}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {[
              { label: 'Speed',     value: `${ship.speed.toFixed(1)} kn` },
              { label: 'Heading',   value: `${ship.heading.toFixed(0)}°` },
              { label: 'Position',  value: `${ship.lat.toFixed(2)}°N` },
              { label: '',          value: `${ship.lng.toFixed(2)}°E` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between gap-4">
                <span style={{ fontSize: 9, color: '#334a60', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6b8fae', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Tooltip>
    </Marker>
  ))
}
