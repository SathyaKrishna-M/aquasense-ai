import { Marker, Polyline, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../store/useStore'
import { useRef } from 'react'

const SHIP_CONFIG = {
  cargo:    { color: '#38bdf8', glow: '#0ea5e9', label: 'Cargo Vessel',     size: 28, priority: 1 },
  tanker:   { color: '#f59e0b', glow: '#d97706', label: 'Oil Tanker',       size: 30, priority: 1 },
  fishing:  { color: '#34d399', glow: '#059669', label: 'Fishing Vessel',   size: 22, priority: 2 },
  naval:    { color: '#a78bfa', glow: '#7c3aed', label: 'Naval Vessel',     size: 30, priority: 0 },
  research: { color: '#f472b6', glow: '#db2777', label: 'Research Vessel',  size: 24, priority: 2 },
}

// Trail opacity steps (newest to oldest)
const TRAIL_OPACITY = [0.45, 0.32, 0.22, 0.14, 0.08, 0.04]

function makeIcon(type, heading) {
  const cfg  = SHIP_CONFIG[type] ?? SHIP_CONFIG.cargo
  const { color, glow, size } = cfg
  const cx = size / 2

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="g${type}" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${glow}" stop-opacity="0.7"/>
      </radialGradient>
      <filter id="f${type}">
        <feGaussianBlur stdDeviation="1.8" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g transform="rotate(${heading}, ${cx}, ${cx})" filter="url(#f${type})">
      <!-- Hull -->
      <polygon
        points="${cx},2 ${cx+4.5},${size-6} ${cx},${size-10} ${cx-4.5},${size-6}"
        fill="url(#g${type})"
        opacity="0.97"
      />
      <!-- Bridge -->
      <rect x="${cx-2}" y="${size*0.38}" width="4" height="4"
        fill="${color}" opacity="0.75" rx="1"/>
      <!-- Bow light -->
      <circle cx="${cx}" cy="3.5" r="1.5" fill="white" opacity="0.9"/>
    </g>
  </svg>`

  return L.divIcon({
    html:       svg,
    iconSize:   [size, size],
    iconAnchor: [cx, cx],
    className:  'ship-marker',
  })
}

export default function ShipLayer() {
  const ships     = useStore(s => s.ships)
  const trailsRef = useRef({})

  // Update trails (during render — ref update is safe)
  ships.forEach(ship => {
    const prev = trailsRef.current[ship.id] ?? []
    const last = prev[prev.length - 1]
    const moved = !last ||
      Math.abs(last[0] - ship.lat) > 0.008 ||
      Math.abs(last[1] - ship.lng) > 0.008
    if (moved) {
      trailsRef.current[ship.id] = [...prev, [ship.lat, ship.lng]].slice(-7)
    }
  })

  return ships.map(ship => {
    const cfg   = SHIP_CONFIG[ship.type] ?? SHIP_CONFIG.cargo
    const trail = trailsRef.current[ship.id] ?? []
    const hdg   = ((ship.heading % 360) + 360) % 360

    return (
      <React.Fragment key={ship.id}>
        {/* Wake trail — segments rendered newest-to-oldest with fading opacity */}
        {trail.length >= 2 && trail.slice(0, -1).map((pos, i) => {
          const from = trail[trail.length - 2 - i]
          const to   = trail[trail.length - 1 - i]
          if (!from || !to) return null
          return (
            <Polyline
              key={`trail-${ship.id}-${i}`}
              positions={[from, to]}
              pathOptions={{
                color:   cfg.color,
                weight:  Math.max(1, 2.5 - i * 0.35),
                opacity: TRAIL_OPACITY[i] ?? 0.03,
                dashArray: i > 2 ? '2 5' : undefined,
              }}
              interactive={false}
            />
          )
        })}

        {/* Ship marker */}
        <Marker
          position={[ship.lat, ship.lng]}
          icon={makeIcon(ship.type, hdg)}
          zIndexOffset={200 - (cfg.priority * 50)}
        >
          <Tooltip direction="top" offset={[0, -14]} opacity={1}
            className="!p-0 !m-0 !border-0 !shadow-none !bg-transparent">
            <div style={{
              background:    'rgba(3,10,24,0.97)',
              border:        `1px solid ${cfg.color}30`,
              borderRadius:  9,
              padding:       '10px 14px',
              backdropFilter: 'blur(20px)',
              boxShadow:     `0 8px 28px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.color}15, inset 0 1px 0 rgba(255,255,255,0.03)`,
              minWidth:      152,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: cfg.color,
                  boxShadow: `0 0 8px ${cfg.color}`,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: cfg.color,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>{cfg.label}</span>
                <span style={{
                  fontSize: 9, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', marginLeft: 'auto',
                }}>#{String(ship.id).padStart(3, '0')}</span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 18px' }}>
                {[
                  { label: 'Speed',   value: `${ship.speed.toFixed(1)} kn` },
                  { label: 'Heading', value: `${hdg.toFixed(0)}°` },
                  { label: 'Lat',     value: `${ship.lat.toFixed(3)}°N` },
                  { label: 'Lon',     value: `${ship.lng.toFixed(3)}°E` },
                ].map(r => (
                  <div key={r.label}>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{r.label}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#8bacc8', fontWeight: 600 }}>{r.value}</div>
                  </div>
                ))}
              </div>

              {/* Region tag */}
              <div style={{
                marginTop: 9, paddingTop: 7,
                borderTop: '1px solid rgba(34,211,238,0.07)',
                fontSize: 9, color: 'var(--text-muted)',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{ship.region === 'BOB' ? 'Bay of Bengal' : 'Arabian Sea'}</span>
                <span style={{ color: cfg.color, fontWeight: 600 }}>● ACTIVE</span>
              </div>
            </div>
          </Tooltip>
        </Marker>
      </React.Fragment>
    )
  })
}

// React needed for Fragment
import React from 'react'
