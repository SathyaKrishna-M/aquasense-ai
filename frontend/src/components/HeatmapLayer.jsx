import React from 'react'
import { Circle, Tooltip } from 'react-leaflet'
import { useStore } from '../store/useStore'
import { useMemo } from 'react'

// ── Risk level → color config ──────────────────────────────────────────────
function riskColors(risk, viewMode, zone) {
  if (viewMode === 'acoustic') {
    const n = zone.noise
    if (n >= 80) return { fill: '#ef4444', stroke: '#f87171', label: 'HIGH',     lc: '#f87171' }
    if (n >= 60) return { fill: '#f59e0b', stroke: '#fbbf24', label: 'MEDIUM',   lc: '#fbbf24' }
    return               { fill: '#10b981', stroke: '#34d399', label: 'LOW',      lc: '#34d399' }
  }
  if (viewMode === 'sensitivity') {
    const s = zone.sensitivity
    if (s >= 0.75) return { fill: '#a78bfa', stroke: '#c4b5fd', label: 'HIGH',   lc: '#c4b5fd' }
    if (s >= 0.5)  return { fill: '#6366f1', stroke: '#818cf8', label: 'MEDIUM', lc: '#818cf8' }
    return                { fill: '#334155', stroke: '#475569', label: 'LOW',     lc: '#64748b' }
  }
  if (viewMode === 'traffic') {
    const d = zone.shipDensity
    if (d >= 70) return { fill: '#f97316', stroke: '#fb923c', label: 'DENSE',    lc: '#fb923c' }
    if (d >= 35) return { fill: '#eab308', stroke: '#facc15', label: 'MODERATE', lc: '#facc15' }
    return               { fill: '#22c55e', stroke: '#4ade80', label: 'SPARSE',   lc: '#4ade80' }
  }
  // Combined risk
  if (risk >= 75) return { fill: '#ef4444', stroke: '#f87171', label: 'CRITICAL', lc: '#f87171' }
  if (risk >= 50) return { fill: '#f59e0b', stroke: '#fbbf24', label: 'ELEVATED', lc: '#fbbf24' }
  return                 { fill: '#10b981', stroke: '#34d399', label: 'NOMINAL',  lc: '#34d399' }
}

const FC_ARROWS = {
  critical:   { arrow: '▲▲', color: '#f87171' },
  escalating: { arrow: '▲',  color: '#fb923c' },
  stable:     { arrow: '―',  color: '#5a7a9a' },
  decreasing: { arrow: '▼',  color: '#38bdf8' },
}

// Radius tiers (meters)
const R = {
  FAR:  130000,  // outermost glow (critical only)
  OUT:   95000,  // outer halo
  MID:   70000,  // mid glow
  CORE:  50000,  // solid core
  DOT:   20000,  // bright center
}

function ContributorBar({ label, value, color }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 9, color: '#5a7a9a' }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#c8ddef' }}>+{value.toFixed(0)}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, value)}%`,
          background: color, borderRadius: 2,
          boxShadow: `0 0 6px ${color}60`,
        }} />
      </div>
    </div>
  )
}

export default function HeatmapLayer() {
  const zones    = useStore(s => s.zones)
  const viewMode = useStore(s => s.viewMode)

  const styled = useMemo(() =>
    zones.map(z => ({
      ...z,
      c:  riskColors(z.risk, viewMode, z),
      fc: FC_ARROWS[z.forecast] || FC_ARROWS.stable,
      aC: parseFloat((z.noise       * 0.4).toFixed(1)),
      dC: parseFloat((z.shipDensity * 0.4).toFixed(1)),
      sC: parseFloat((z.sensitivity * 100 * 0.2).toFixed(1)),
    })),
    [zones, viewMode]
  )

  return styled.map(z => {
    const isCrit = z.risk >= 75
    const isElev = z.risk >= 50 && z.risk < 75
    const f = z.c.fill
    const s = z.c.stroke

    return (
      <React.Fragment key={z.id}>

        {/* FAR glow ring — critical only, CSS blur */}
        {isCrit && (
          <Circle center={[z.lat, z.lng]} radius={R.FAR}
            pathOptions={{
              fillColor: f, fillOpacity: 0.05,
              color: s, opacity: 0.15, weight: 1,
              dashArray: '4 10',
              className: 'zone-critical-outer zone-blur-far',
            }}
            interactive={false}
          />
        )}

        {/* OUTER halo — CSS blur */}
        <Circle center={[z.lat, z.lng]} radius={R.OUT}
          pathOptions={{
            fillColor: f, fillOpacity: isCrit ? 0.09 : isElev ? 0.06 : 0.04,
            color: 'transparent', weight: 0,
            className: 'zone-blur-out',
          }}
          interactive={false}
        />

        {/* MID glow — slight blur */}
        <Circle center={[z.lat, z.lng]} radius={R.MID}
          pathOptions={{
            fillColor: f, fillOpacity: isCrit ? 0.16 : isElev ? 0.11 : 0.07,
            color: 'transparent', weight: 0,
            className: 'zone-blur-mid',
          }}
          interactive={false}
        />

        {/* CORE — main visible zone with tooltip */}
        <Circle center={[z.lat, z.lng]} radius={R.CORE}
          pathOptions={{
            fillColor: f, fillOpacity: isCrit ? 0.38 : isElev ? 0.26 : 0.17,
            color: s, weight: isCrit ? 1.5 : 1,
            opacity: isCrit ? 0.85 : isElev ? 0.60 : 0.40,
            className: isCrit ? 'zone-critical-inner' : isElev ? 'zone-elevated-inner' : 'zone-safe-inner',
          }}
        >
          <Tooltip direction="top" opacity={1} className="!p-0 !m-0 !border-0 !shadow-none !bg-transparent">
            <div style={{
              background:    'rgba(3,10,24,0.97)',
              border:        `1px solid ${s}28`,
              borderRadius:  11,
              padding:       '13px 15px',
              minWidth:      228,
              backdropFilter: 'blur(24px)',
              boxShadow:     `0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px ${s}12, inset 0 1px 0 rgba(255,255,255,0.03)`,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2eeff', lineHeight: 1.25 }}>{z.name}</div>
                  <div style={{ fontSize: 9, color: '#5a7a9a', marginTop: 2, letterSpacing: '0.05em' }}>{z.region} · {z.id}</div>
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: z.c.lc, letterSpacing: '0.10em',
                  padding: '3px 8px', borderRadius: 20,
                  background: `${f}18`, border: `1px solid ${s}35`,
                  whiteSpace: 'nowrap', marginLeft: 8,
                  boxShadow: isCrit ? `0 0 10px ${f}30` : 'none',
                }}>{z.c.label}</div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', gap: 16, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(34,211,238,0.07)' }}>
                <div>
                  <div style={{ fontSize: 8, color: '#2a3f55', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: z.c.lc, fontFamily: 'var(--font-mono)', lineHeight: 1, textShadow: isCrit ? `0 0 16px ${f}80` : 'none' }}>{z.risk}</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: '#2a3f55', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Acoustic</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#c8ddef', fontFamily: 'var(--font-mono)' }}>{z.noise} dB</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: '#2a3f55', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Density</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#c8ddef', fontFamily: 'var(--font-mono)' }}>{Math.round(z.shipDensity)}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: '#2a3f55', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Forecast</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: z.fc.color }}>{z.fc.arrow}</div>
                </div>
              </div>

              {/* Contributors */}
              <div style={{ fontSize: 8, color: '#2a3f55', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>
                Risk Contributors
              </div>
              <ContributorBar label="Acoustic Activity"      value={z.aC} color="#38bdf8" />
              <ContributorBar label="Vessel Density"         value={z.dC} color="#f59e0b" />
              <ContributorBar label="Ecological Sensitivity"  value={z.sC} color="#a78bfa" />

              {z.sonar && (
                <div style={{
                  marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 10, color: '#fbbf24', fontWeight: 600,
                  background: 'rgba(245,158,11,0.08)', borderRadius: 6, padding: '5px 10px',
                  border: '1px solid rgba(245,158,11,0.18)',
                }}>
                  ⚡ Active sonar anomaly detected
                </div>
              )}
            </div>
          </Tooltip>
        </Circle>

        {/* CENTER DOT — bright focal point */}
        <Circle center={[z.lat, z.lng]} radius={R.DOT}
          pathOptions={{
            fillColor: s, fillOpacity: isCrit ? 0.70 : isElev ? 0.50 : 0.35,
            color: s, weight: 0, opacity: 0,
          }}
          interactive={false}
        />

      </React.Fragment>
    )
  })
}
