import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import ShipLayer from './ShipLayer'
import HeatmapLayer from './HeatmapLayer'
import SensitivityOverlay from './SensitivityOverlay'
import { useStore } from '../store/useStore'

const VIEW_MODES = [
  { id: 'combined',    label: 'Combined',    icon: '⊕' },
  { id: 'traffic',     label: 'Traffic',     icon: '⛵' },
  { id: 'acoustic',    label: 'Acoustic',    icon: '◎' },
  { id: 'sensitivity', label: 'Sensitivity', icon: '◈' },
]

// Overlay panel consistent styling
const OVERLAY_PANEL = {
  background:    'rgba(3,10,24,0.92)',
  border:        '1px solid rgba(34,211,238,0.10)',
  borderRadius:  10,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow:     '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(34,211,238,0.05)',
}

export default function MapView() {
  const viewMode               = useStore(s => s.viewMode)
  const setViewMode            = useStore(s => s.setViewMode)
  const showSensitivityOverlay = useStore(s => s.showSensitivityOverlay)
  const toggleSensitivityOverlay = useStore(s => s.toggleSensitivityOverlay)
  const zones                  = useStore(s => s.zones)
  const hideShips              = viewMode === 'acoustic' || viewMode === 'sensitivity'

  const criticalCount  = zones.filter(z => z.risk >= 75).length
  const elevatedCount  = zones.filter(z => z.risk >= 50 && z.risk < 75).length
  const avgRisk        = Math.round(zones.reduce((a, z) => a + z.risk, 0) / zones.length)

  return (
    <div className="relative w-full h-full" style={{ background: '#010b18' }}>

      {/* ── MAP ────────────────────────────────────────────────────────── */}
      <MapContainer
        center={[14, 76]}
        zoom={4}
        minZoom={3}
        maxZoom={12}
        worldCopyJump={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />

        {/* CartoDB Dark Matter — professional naval chart look */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <HeatmapLayer />
        {!hideShips && <ShipLayer />}
        <SensitivityOverlay />
      </MapContainer>

      {/* ── ATMOSPHERE LAYERS (pointer-events: none) ──────────────────── */}

      {/* Vignette */}
      <div className="absolute inset-0 map-vignette pointer-events-none" style={{ zIndex: 400 }} />

      {/* Top + bottom fades */}
      <div className="absolute top-0 left-0 right-0 h-20 map-top-fade pointer-events-none" style={{ zIndex: 401 }} />
      <div className="absolute bottom-0 left-0 right-0 h-16 map-bottom-fade pointer-events-none" style={{ zIndex: 401 }} />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 map-grid pointer-events-none" style={{ zIndex: 402 }} />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 403 }}>
        <div className="scan-line" />
      </div>

      {/* ── STATUS STRIP — top-left ───────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        {/* Zone health summary */}
        <div style={{ ...OVERLAY_PANEL, padding: '8px 12px' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Zone Status
          </div>
          <div className="flex gap-3">
            {[
              { label: 'Critical', count: criticalCount, color: 'var(--risk-critical)' },
              { label: 'Elevated', count: elevatedCount, color: 'var(--risk-elevated)' },
              { label: 'Nominal',  count: zones.length - criticalCount - elevatedCount, color: 'var(--risk-safe)' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-0.5">
                <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.count}</span>
                <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
              </div>
            ))}
            <div style={{ width: 1, background: 'var(--border-subtle)', margin: '0 2px' }} />
            <div className="flex flex-col items-center gap-0.5">
              <span className="mono" style={{
                fontSize: 15, fontWeight: 800, lineHeight: 1,
                color: avgRisk >= 75 ? 'var(--risk-critical)' : avgRisk >= 50 ? 'var(--risk-elevated)' : 'var(--risk-safe)',
              }}>{avgRisk}</span>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Avg Risk</span>
            </div>
          </div>
        </div>

        {/* Coordinate display */}
        <div style={{ ...OVERLAY_PANEL, padding: '6px 12px' }}>
          <div className="flex items-center gap-2">
            <div className="live-blink w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              14.0°N · 76.0°E  ·  INDOPAC GRID
            </span>
          </div>
        </div>
      </div>

      {/* ── VIEW MODE CONTROLS — top-right ───────────────────────────── */}
      <div className="absolute top-3 right-3 z-[1000]" style={{ ...OVERLAY_PANEL, padding: '8px' }}>
        <div style={{
          fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.12em', textAlign: 'center', marginBottom: 6,
          paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)',
        }}>
          Display Mode
        </div>
        <div className="flex flex-col gap-0.5">
          {VIEW_MODES.map(m => {
            const active = viewMode === m.id
            return (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 11px', borderRadius: 6,
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                  background:  active ? 'rgba(34,211,238,0.10)' : 'transparent',
                  color:       active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border:      active ? '1px solid rgba(34,211,238,0.22)' : '1px solid transparent',
                  boxShadow:   active ? '0 0 12px rgba(34,211,238,0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: 12, opacity: active ? 1 : 0.6 }}>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            )
          })}
          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0 2px' }} />
          <button
            onClick={toggleSensitivityOverlay}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 11px', borderRadius: 6,
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', width: '100%',
              transition: 'all var(--transition-fast)',
              background:  showSensitivityOverlay ? 'rgba(16,185,129,0.10)' : 'transparent',
              color:       showSensitivityOverlay ? 'var(--risk-safe)' : 'var(--text-muted)',
              border:      showSensitivityOverlay ? '1px solid rgba(16,185,129,0.22)' : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: 12 }}>🐋</span>
            <span>Bio Zones</span>
          </button>
        </div>
      </div>

      {/* ── RISK LEGEND — bottom-left ─────────────────────────────────── */}
      <div className="absolute bottom-4 left-3 z-[1000]" style={{ ...OVERLAY_PANEL, padding: '12px 14px', minWidth: 168 }}>
        <div style={{
          fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.12em', marginBottom: 8,
        }}>
          {viewMode === 'combined'    ? 'Risk Index'       :
           viewMode === 'traffic'     ? 'Traffic Density'  :
           viewMode === 'acoustic'    ? 'Acoustic Level'   :
           'Ecological Sensitivity'}
        </div>
        <div className="flex flex-col gap-2">
          {viewMode !== 'sensitivity' ? (<>
            <LegendItem color="var(--risk-critical)" glow label={viewMode === 'combined' ? 'Critical  ≥75' : viewMode === 'acoustic' ? 'High  ≥80 dB' : 'Dense  ≥70'} />
            <LegendItem color="var(--risk-elevated)"      label={viewMode === 'combined' ? 'Elevated  50–74' : viewMode === 'acoustic' ? 'Medium  60–79 dB' : 'Moderate  35–69'} />
            <LegendItem color="var(--risk-safe)"          label={viewMode === 'combined' ? 'Nominal  <50' : viewMode === 'acoustic' ? 'Low  <60 dB' : 'Sparse  <35'} />
          </>) : (<>
            <LegendItem color="#a78bfa" label="High Sensitivity  ≥0.75" />
            <LegendItem color="#818cf8" label="Medium  0.5–0.74" />
            <LegendItem color="#475569" label="Low  <0.5" />
          </>)}
          {showSensitivityOverlay && (<>
            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2px 0' }} />
            <LegendItem color="var(--accent-blue)"  label="Cetacean corridor" dashed />
            <LegendItem color="var(--risk-safe)"    label="Protected zones"   dashed />
          </>)}
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 8, paddingTop: 6, fontSize: 9, color: 'var(--text-muted)' }}>
          Bay of Bengal · Arabian Sea
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, dashed, glow }) {
  return (
    <div className="flex items-center gap-2.5">
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background:  dashed ? 'transparent' : color,
        border:      dashed ? `1.5px dashed ${color}` : 'none',
        boxShadow:   glow ? `0 0 6px ${color}` : 'none',
      }} />
      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}
