import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import ShipLayer from './ShipLayer'
import HeatmapLayer from './HeatmapLayer'
import SensitivityOverlay from './SensitivityOverlay'
import { useStore } from '../store/useStore'

const VIEW_MODES = [
  { id: 'combined',    label: 'Combined',    icon: '⊕' },
  { id: 'traffic',     label: 'Traffic',     icon: '🚢' },
  { id: 'acoustic',    label: 'Acoustic',    icon: '🔊' },
  { id: 'sensitivity', label: 'Sensitivity', icon: '🌿' },
]

const PANEL_STYLE = {
  background:    'rgba(4,10,26,0.94)',
  border:        '1px solid rgba(34,211,238,0.1)',
  borderRadius:  10,
  backdropFilter: 'blur(16px)',
  boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
}

export default function MapView() {
  const viewMode               = useStore(s => s.viewMode)
  const setViewMode            = useStore(s => s.setViewMode)
  const showSensitivityOverlay = useStore(s => s.showSensitivityOverlay)
  const toggleSensitivityOverlay = useStore(s => s.toggleSensitivityOverlay)
  const hideShips              = viewMode === 'acoustic' || viewMode === 'sensitivity'

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[20, 60]}
        zoom={3}
        minZoom={2}
        maxZoom={12}
        worldCopyJump={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
          noWrap={false}
        />
        <HeatmapLayer />
        {!hideShips && <ShipLayer />}
        <SensitivityOverlay />
      </MapContainer>

      {/* View Mode Controls — top-right */}
      <div className="absolute top-3 right-3 z-[1000]" style={{ ...PANEL_STYLE, padding: '8px' }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
          View Mode
        </div>
        <div className="flex flex-col gap-1">
          {VIEW_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                padding:      '5px 12px',
                borderRadius: 8,
                fontSize:     11,
                fontWeight:   600,
                cursor:       'pointer',
                whiteSpace:   'nowrap',
                transition:   'all var(--transition-fast)',
                background:   viewMode === m.id ? 'rgba(34,211,238,0.12)' : 'transparent',
                color:        viewMode === m.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border:       viewMode === m.id ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
              }}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 4 }}>
            <button
              onClick={toggleSensitivityOverlay}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                padding:      '5px 12px',
                borderRadius: 8,
                fontSize:     11,
                fontWeight:   600,
                cursor:       'pointer',
                width:        '100%',
                transition:   'all var(--transition-fast)',
                background:   showSensitivityOverlay ? 'rgba(16,185,129,0.12)' : 'transparent',
                color:        showSensitivityOverlay ? 'var(--risk-safe)' : 'var(--text-muted)',
                border:       showSensitivityOverlay ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
              }}
            >
              <span>🐋</span>
              <span>Bio Zones</span>
            </button>
          </div>
        </div>
      </div>

      {/* Risk Legend — bottom-left */}
      <div className="absolute bottom-4 left-4 z-[1000]" style={{ ...PANEL_STYLE, padding: '12px 14px', minWidth: 160 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {viewMode === 'combined'    ? 'Risk Legend' :
           viewMode === 'traffic'     ? 'Traffic Density' :
           viewMode === 'acoustic'    ? 'Acoustic Level' :
           'Ecological Sensitivity'}
        </div>
        <div className="flex flex-col gap-2">
          {viewMode !== 'sensitivity' ? (
            <>
              <LegendItem color="var(--risk-critical)" label={viewMode === 'combined' ? 'Critical (≥75)' : viewMode === 'acoustic' ? 'High (≥80 dB)' : 'Dense (≥70)'} />
              <LegendItem color="var(--risk-moderate)" label={viewMode === 'combined' ? 'Elevated (50–74)' : viewMode === 'acoustic' ? 'Medium (60–79 dB)' : 'Moderate (35–69)'} />
              <LegendItem color="var(--risk-safe)"     label={viewMode === 'combined' ? 'Nominal (<50)' : viewMode === 'acoustic' ? 'Low (<60 dB)' : 'Sparse (<35)'} />
            </>
          ) : (
            <>
              <LegendItem color="#a78bfa" label="High Sensitivity (≥0.75)" />
              <LegendItem color="#818cf8" label="Medium (0.5–0.74)" />
              <LegendItem color="#64748b" label="Low (<0.5)" />
            </>
          )}
          {showSensitivityOverlay && (
            <>
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2px 0' }} />
              <LegendItem color="var(--accent-blue)"  label="Whale corridor" dashed />
              <LegendItem color="var(--risk-safe)"    label="Protected zones" dashed />
            </>
          )}
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 8, paddingTop: 6, fontSize: 9, color: 'var(--text-muted)' }}>
          Bay of Bengal · Arabian Sea
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-2">
      <div style={{
        width:        8,
        height:       8,
        borderRadius: '50%',
        background:   dashed ? 'transparent' : color,
        border:       dashed ? `1.5px dashed ${color}` : 'none',
        flexShrink:   0,
        opacity:      0.85,
      }} />
      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}
