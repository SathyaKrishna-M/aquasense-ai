import { useEffect, lazy, Suspense, useState } from 'react'
import { useStore } from './store/useStore'
import AlertPanel from './components/AlertPanel'
import AIInsights from './components/AIInsights'
import RiskStats from './components/RiskStats'
import GlobalStats from './components/GlobalStats'
import BottomBar from './components/BottomBar'

const MapView = lazy(() => import('./components/MapView'))

// ── Clock ──────────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <span className="font-mono text-[11px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
      {t.toUTCString().slice(17, 25)} UTC
    </span>
  )
}

// ── Threat level config ────────────────────────────────────────────────────
const THREAT = {
  LOW:    { label: 'LOW',      color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  MEDIUM: { label: 'MEDIUM',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  HIGH:   { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
}

export default function App() {
  const tick             = useStore(s => s.tick)
  const isMonitoring     = useStore(s => s.isMonitoring)
  const toggleMonitoring = useStore(s => s.toggleMonitoring)
  const alertLevel       = useStore(s => s.alertLevel)
  const alerts           = useStore(s => s.alerts)
  const criticalCount    = alerts.filter(a => a.severity === 'critical').length

  useEffect(() => {
    if (!isMonitoring) return
    const id = setInterval(tick, 1200)
    return () => clearInterval(id)
  }, [isMonitoring, tick])

  const threat = THREAT[alertLevel] || THREAT.LOW

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header style={{
        background:   'rgba(2,8,17,0.96)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
        height: '52px',
        flexShrink: 0,
      }} className="flex items-center px-5 gap-6">

        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8">
            <div className="absolute inset-0 rounded-lg opacity-20" style={{ background: 'var(--accent-cyan)' }} />
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 14 C5 10, 8 8, 10 10 C12 12, 15 10, 18 6" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="10" cy="10" r="2.5" fill="#22d3ee" opacity="0.8"/>
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>AquaSense</span>
              <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--accent-cyan)' }}>AI</span>
            </div>
            <div className="label" style={{ color: 'var(--text-muted)', marginTop: -1 }}>Marine Risk Intelligence</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

        {/* System status */}
        <div className="flex items-center gap-2">
          <div className="live-blink w-1.5 h-1.5 rounded-full" style={{ background: isMonitoring ? 'var(--risk-safe)' : 'var(--text-muted)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {isMonitoring ? 'SYSTEM ACTIVE' : 'MONITORING PAUSED'}
          </span>
        </div>

        {/* Region pill */}
        <div className="panel-sm flex items-center gap-2 px-3 py-1">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#22d3ee" strokeWidth="1.2" opacity="0.6"/>
            <path d="M1 6h10M6 1 C4 3, 4 9, 6 11 C8 9, 8 3, 6 1" stroke="#22d3ee" strokeWidth="1" opacity="0.6"/>
          </svg>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Bay of Bengal · Arabian Sea</span>
        </div>

        {/* Live clock */}
        <div className="panel-sm px-3 py-1">
          <LiveClock />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zone count */}
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>12</span>
          <span>zones monitored</span>
        </div>

        {/* Threat level */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: threat.bg,
            border: `1px solid ${threat.border}`,
            transition: 'all var(--transition-smooth)',
          }}>
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: threat.color, boxShadow: alertLevel === 'HIGH' ? `0 0 8px ${threat.color}` : 'none' }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: threat.color, letterSpacing: '0.06em' }}>
            THREAT: {threat.label}
          </span>
          {criticalCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
              style={{ background: 'var(--risk-critical)', color: '#fff' }}>
              {criticalCount}
            </span>
          )}
        </div>

        {/* Monitoring toggle */}
        <button onClick={toggleMonitoring} className="hover-lift flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer"
          style={{
            background:  isMonitoring ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.03)',
            border:      `1px solid ${isMonitoring ? 'rgba(34,211,238,0.2)' : 'var(--border-subtle)'}`,
            color:       isMonitoring ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize:    11,
            fontWeight:  600,
            transition:  'all var(--transition-smooth)',
          }}>
          <div className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'scan-dot' : ''}`}
            style={{ background: isMonitoring ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
          {isMonitoring ? 'LIVE' : 'PAUSED'}
        </button>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* MAP */}
        <div className="flex-1 relative overflow-hidden">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full gap-3"
              style={{ background: '#020a18', color: 'var(--text-secondary)' }}>
              <div className="scan-dot w-2 h-2 rounded-full" style={{ background: 'var(--accent-cyan)' }} />
              <span className="label">Loading maritime systems…</span>
            </div>
          }>
            <MapView />
          </Suspense>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
        <aside style={{
          width: '340px',
          flexShrink: 0,
          borderLeft: '1px solid var(--border-subtle)',
          background:  'rgba(2, 7, 18, 0.92)',
          display:     'flex',
          flexDirection: 'column',
          overflow:    'hidden',
        }}>
          {/* Sidebar header strip */}
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="label" style={{ color: 'var(--text-secondary)' }}>Intelligence Feed</span>
            <div className="flex items-center gap-1.5">
              <div className="live-blink w-1 h-1 rounded-full" style={{ background: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>LIVE</span>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Stats strip */}
            <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <RiskStats />
            </div>

            {/* Alerts */}
            <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <AlertPanel />
            </div>

            {/* AI Insights */}
            <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <AIInsights />
            </div>

            {/* Global Stats */}
            <div className="px-3 py-3">
              <GlobalStats />
            </div>
          </div>
        </aside>
      </div>

      {/* ── BOTTOM ANALYTICS BAR ─────────────────────────────────────── */}
      <BottomBar />
    </div>
  )
}
