import { useEffect, lazy, Suspense, useState } from 'react'
import { useStore } from './store/useStore'
import AlertPanel from './components/AlertPanel'
import AIInsights from './components/AIInsights'
import RiskStats from './components/RiskStats'
import GlobalStats from './components/GlobalStats'
import BottomBar from './components/BottomBar'

const MapView = lazy(() => import('./components/MapView'))

// ── UTC Clock ─────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
      {t.toUTCString().slice(17, 25)}{' '}
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>UTC</span>
    </span>
  )
}

// ── Threat config ──────────────────────────────────────────────────────────
const THREAT = {
  LOW:    { label: 'LOW',      color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.22)' },
  MEDIUM: { label: 'MEDIUM',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  HIGH:   { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.38)' },
}

// ── Divider ────────────────────────────────────────────────────────────────
function VDiv() {
  return <div style={{ width: 1, height: 24, background: 'rgba(34,211,238,0.08)', flexShrink: 0 }} />
}

export default function App() {
  const tick             = useStore(s => s.tick)
  const isMonitoring     = useStore(s => s.isMonitoring)
  const toggleMonitoring = useStore(s => s.toggleMonitoring)
  const alertLevel       = useStore(s => s.alertLevel)
  const alerts           = useStore(s => s.alerts)
  const zones            = useStore(s => s.zones)
  const ships            = useStore(s => s.ships)
  const criticalCount    = alerts.filter(a => a.severity === 'critical').length
  const avgRisk          = Math.round(zones.reduce((a, z) => a + z.risk, 0) / zones.length)

  useEffect(() => {
    if (!isMonitoring) return
    const id = setInterval(tick, 1200)
    return () => clearInterval(id)
  }, [isMonitoring, tick])

  const threat = THREAT[alertLevel] || THREAT.LOW

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ══════════════════════════════════════════════════════════════
          TOP BAR — Command Center Header
      ══════════════════════════════════════════════════════════════ */}
      <header style={{
        height:       52,
        flexShrink:   0,
        background:   'rgba(1,8,18,0.98)',
        borderBottom: '1px solid rgba(34,211,238,0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display:      'flex',
        alignItems:   'center',
        paddingLeft:  20,
        paddingRight: 20,
        gap:          20,
        position:     'relative',
        zIndex:       50,
      }}>

        {/* Ambient top glow */}
        <div style={{
          position:    'absolute',
          top:         0, left: 0, right: 0, height: 1,
          background:  'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.35) 40%, rgba(34,211,238,0.35) 60%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Logo mark */}
          <div style={{ position: 'relative', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: 8,
              background: 'radial-gradient(circle, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0.04) 100%)',
              border: '1px solid rgba(34,211,238,0.20)',
            }} />
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 14 C5 10, 8 8, 10 10 C12 12, 15 10, 18 6" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="10" cy="10" r="2.5" fill="#22d3ee" opacity="0.85"/>
              <circle cx="10" cy="10" r="4.5" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" fill="none"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>AquaSense</span>
              <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--accent-cyan)', letterSpacing: '-0.01em' }}>AI</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: -2 }}>
              Marine Risk Intelligence
            </div>
          </div>
        </div>

        <VDiv />

        {/* System status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <div className={isMonitoring ? 'live-blink' : ''}
            style={{ width: 7, height: 7, borderRadius: '50%', background: isMonitoring ? 'var(--risk-safe)' : 'var(--text-muted)', boxShadow: isMonitoring ? '0 0 8px var(--risk-safe)' : 'none' }}
          />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: isMonitoring ? 'var(--risk-safe)' : 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {isMonitoring ? 'SYSTEM ACTIVE' : 'MONITORING PAUSED'}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              {isMonitoring ? '12 zones · 24 vessels' : 'Simulation halted'}
            </div>
          </div>
        </div>

        <VDiv />

        {/* Region pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.10)',
          borderRadius: 8, padding: '4px 10px',
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#22d3ee" strokeWidth="1.2" opacity="0.5"/>
            <path d="M1 6h10M6 1C4 3,4 9,6 11C8 9,8 3,6 1" stroke="#22d3ee" strokeWidth="1" opacity="0.5"/>
          </svg>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em' }}>
            Bay of Bengal · Arabian Sea
          </span>
        </div>

        {/* Clock */}
        <div style={{
          background: 'rgba(34,211,238,0.03)', border: '1px solid rgba(34,211,238,0.08)',
          borderRadius: 8, padding: '4px 10px', flexShrink: 0,
        }}>
          <LiveClock />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Avg risk telemetry */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(34,211,238,0.06)',
          borderRadius: 8, padding: '4px 12px',
        }}>
          <span className="mono" style={{
            fontSize: 16, fontWeight: 800, lineHeight: 1,
            color: avgRisk >= 75 ? 'var(--risk-critical)' : avgRisk >= 50 ? 'var(--risk-elevated)' : 'var(--risk-safe)',
          }}>{avgRisk}</span>
          <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Avg Risk</span>
        </div>

        {/* Zones count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-cyan)' }}>12</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>zones</span>
          <span style={{ color: 'rgba(34,211,238,0.15)', margin: '0 2px' }}>·</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-blue)' }}>{ships.length}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vessels</span>
        </div>

        <VDiv />

        {/* Threat level */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px', borderRadius: 9, flexShrink: 0,
          background: threat.bg, border: `1px solid ${threat.border}`,
          transition: 'all var(--transition-smooth)',
          boxShadow: alertLevel === 'HIGH' ? `0 0 20px ${threat.color}25` : 'none',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: threat.color,
            boxShadow: alertLevel === 'HIGH' ? `0 0 10px ${threat.color}` : `0 0 4px ${threat.color}60`,
          }} className={alertLevel === 'HIGH' ? 'live-blink' : ''} />
          <div>
            <div style={{ fontSize: 9, color: threat.color, letterSpacing: '0.12em', fontWeight: 800 }}>
              THREAT LEVEL
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, color: threat.color, letterSpacing: '0.06em', lineHeight: 1 }}>
              {threat.label}
            </div>
          </div>
          {criticalCount > 0 && (
            <div className="alert-critical-pulse" style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--risk-critical)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 900, color: '#fff',
            }}>{criticalCount}</div>
          )}
        </div>

        {/* Monitoring toggle */}
        <button onClick={toggleMonitoring}
          className="hover-lift"
          style={{
            display:    'flex', alignItems: 'center', gap: 7,
            padding:    '6px 14px', borderRadius: 9,
            cursor:     'pointer', flexShrink: 0,
            background: isMonitoring ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.02)',
            border:     `1px solid ${isMonitoring ? 'rgba(34,211,238,0.22)' : 'rgba(255,255,255,0.06)'}`,
            color:      isMonitoring ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize:   11, fontWeight: 700, letterSpacing: '0.06em',
            transition: 'all var(--transition-smooth)',
          }}>
          <div className={isMonitoring ? 'scan-dot' : ''}
            style={{ width: 6, height: 6, borderRadius: '50%', background: isMonitoring ? 'var(--accent-cyan)' : 'var(--text-muted)', flexShrink: 0 }} />
          {isMonitoring ? 'LIVE' : 'PAUSED'}
        </button>

      </header>

      {/* ══════════════════════════════════════════════════════════════
          MAIN — Map + Sidebar
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* MAP */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Suspense fallback={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, background: '#010b18', color: 'var(--text-muted)' }}>
              <div className="scan-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
              <span className="label">Initializing maritime systems…</span>
            </div>
          }>
            <MapView />
          </Suspense>
        </div>

        {/* ── RIGHT SIDEBAR ──────────────────────────────────────────── */}
        <aside style={{
          width:           340,
          flexShrink:      0,
          borderLeft:      '1px solid rgba(34,211,238,0.07)',
          background:      'rgba(1,8,18,0.96)',
          display:         'flex',
          flexDirection:   'column',
          overflow:        'hidden',
          position:        'relative',
        }}>
          {/* Sidebar ambient left glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 1,
            background: 'linear-gradient(180deg, transparent, rgba(34,211,238,0.12), transparent)',
            pointerEvents: 'none',
          }} />

          {/* Sidebar header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', flexShrink: 0,
            borderBottom: '1px solid rgba(34,211,238,0.07)',
            background: 'rgba(1,8,18,0.5)',
          }}>
            <span className="label" style={{ color: 'var(--text-secondary)' }}>Intelligence Feed</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="live-blink" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>LIVE</span>
            </div>
          </div>

          {/* Scrollable panels */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Section><RiskStats /></Section>
            <Section><AlertPanel /></Section>
            <Section><AIInsights /></Section>
            <Section last><GlobalStats /></Section>
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM ANALYTICS BAR
      ══════════════════════════════════════════════════════════════ */}
      <BottomBar />
    </div>
  )
}

function Section({ children, last }) {
  return (
    <div style={{
      padding: '14px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(34,211,238,0.05)',
    }}>
      {children}
    </div>
  )
}
