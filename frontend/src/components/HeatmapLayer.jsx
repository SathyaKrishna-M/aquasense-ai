import React from 'react'
import { Circle, Tooltip } from 'react-leaflet'
import { useStore } from '../store/useStore'
import { useMemo } from 'react'

function riskStyle(risk, viewMode, zone) {
  if (viewMode === 'acoustic') {
    const n = zone.noise
    if (n >= 80) return { fill: '#ef4444', opacity: 0.45 }
    if (n >= 60) return { fill: '#f59e0b', opacity: 0.32 }
    return { fill: '#10b981', opacity: 0.20 }
  }
  if (viewMode === 'sensitivity') {
    const s = zone.sensitivity
    if (s >= 0.75) return { fill: '#a78bfa', opacity: 0.40 }
    if (s >= 0.5)  return { fill: '#818cf8', opacity: 0.28 }
    return { fill: '#64748b', opacity: 0.18 }
  }
  if (viewMode === 'traffic') {
    const d = zone.shipDensity
    if (d >= 70) return { fill: '#f97316', opacity: 0.42 }
    if (d >= 35) return { fill: '#fbbf24', opacity: 0.30 }
    return { fill: '#4ade80', opacity: 0.18 }
  }
  if (risk >= 75) return { fill: '#ef4444', opacity: 0.42 }
  if (risk >= 50) return { fill: '#f59e0b', opacity: 0.30 }
  return { fill: '#10b981', opacity: 0.18 }
}

function riskLabel(risk) {
  if (risk >= 75) return { text: 'CRITICAL', color: '#f87171' }
  if (risk >= 50) return { text: 'ELEVATED', color: '#fb923c' }
  return { text: 'NOMINAL', color: '#34d399' }
}

const FC_ARROWS = {
  critical:   { arrow: '▲▲', color: '#f87171' },
  escalating: { arrow: '▲',  color: '#fb923c' },
  stable:     { arrow: '—',  color: '#6b8fae' },
  decreasing: { arrow: '▼',  color: '#38bdf8' },
}

function ContributorBar({ label, value, color }) {
  const pct = Math.min(100, value)
  return (
    <div style={{ marginTop: 6 }}>
      <div className="flex justify-between" style={{ marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: '#6b8fae' }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#ddeeff' }}>+{value.toFixed(0)}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, opacity: 0.85 }} />
      </div>
    </div>
  )
}

export default function HeatmapLayer() {
  const zones    = useStore(s => s.zones)
  const viewMode = useStore(s => s.viewMode)

  const styledZones = useMemo(() =>
    zones.map(z => ({
      ...z,
      style:              riskStyle(z.risk, viewMode, z),
      lbl:                riskLabel(z.risk),
      fc:                 FC_ARROWS[z.forecast] || FC_ARROWS.stable,
      acousticContrib:    parseFloat((z.noise       * 0.4).toFixed(1)),
      densityContrib:     parseFloat((z.shipDensity * 0.4).toFixed(1)),
      sensitivityContrib: parseFloat((z.sensitivity * 100 * 0.2).toFixed(1)),
    })),
    [zones, viewMode]
  )

  return styledZones.map(z => {
    const isCritical = z.risk >= 75
    const isElevated = z.risk >= 50 && z.risk < 75

    return (
      <React.Fragment key={z.id}>
        {isCritical && (
          <Circle
            center={[z.lat, z.lng]}
            radius={215000}
            pathOptions={{
              color:       z.style.fill,
              fillColor:   z.style.fill,
              fillOpacity: 0.08,
              weight:      0,
              className:   'zone-critical-outer',
            }}
            interactive={false}
          />
        )}

        <Circle
          center={[z.lat, z.lng]}
          radius={160000}
          pathOptions={{
            color:       z.style.fill,
            fillColor:   z.style.fill,
            fillOpacity: z.style.opacity,
            weight:      isCritical ? 2 : 1.5,
            opacity:     isCritical ? 0.9 : isElevated ? 0.7 : 0.45,
            className:   isCritical ? 'zone-critical-inner' : isElevated ? 'zone-elevated-inner' : '',
          }}
        >
          <Tooltip direction="top" opacity={1} className="!p-0 !m-0 !border-0 !shadow-none !bg-transparent">
            <div style={{
              background:    'rgba(4,10,26,0.97)',
              border:        '1px solid rgba(34,211,238,0.15)',
              borderRadius:  10,
              padding:       '12px 14px',
              minWidth:      210,
              backdropFilter: 'blur(16px)',
              boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {/* Zone header */}
              <div className="flex items-start justify-between gap-2" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ddeeff', lineHeight: 1.2 }}>{z.name}</div>
                  <div style={{ fontSize: 10, color: '#6b8fae', marginTop: 1 }}>{z.region}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: z.lbl.color, letterSpacing: '0.08em',
                  padding: '2px 6px', borderRadius: 20, background: `${z.lbl.color}18`, border: `1px solid ${z.lbl.color}30`,
                }}>{z.lbl.text}</span>
              </div>

              {/* Metrics row */}
              <div className="flex gap-4" style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(34,211,238,0.08)' }}>
                <div>
                  <div style={{ fontSize: 9, color: '#334a60', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: z.lbl.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{z.risk}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#334a60', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acoustic</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ddeeff', fontFamily: 'var(--font-mono)' }}>{z.noise} dB</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: '#334a60', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trend</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: z.fc.color }}>{z.fc.arrow}</div>
                </div>
              </div>

              {/* Contributors */}
              <div style={{ fontSize: 9, color: '#334a60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Risk Breakdown</div>
              <ContributorBar label="Acoustic"    value={z.acousticContrib}    color="#38bdf8" />
              <ContributorBar label="Ship Density" value={z.densityContrib}     color="#f59e0b" />
              <ContributorBar label="Sensitivity"  value={z.sensitivityContrib} color="#a78bfa" />

              {z.sonar && (
                <div style={{
                  marginTop: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 10, color: '#fbbf24',
                  background: 'rgba(245,158,11,0.1)',
                  borderRadius: 6, padding: '4px 8px',
                }}>
                  <span>⚡</span> Active sonar anomaly
                </div>
              )}
            </div>
          </Tooltip>
        </Circle>
      </React.Fragment>
    )
  })
}
