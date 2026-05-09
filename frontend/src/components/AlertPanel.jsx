import { useStore } from '../store/useStore'

const SEV = {
  critical: {
    accent:   '#ef4444',
    dimAccent:'rgba(239,68,68,0.12)',
    border:   'rgba(239,68,68,0.28)',
    badge:    'rgba(239,68,68,0.14)',
    label:    'CRITICAL',
    icon:     '⚡',
    pulse:    true,
  },
  elevated: {
    accent:   '#f97316',
    dimAccent:'rgba(249,115,22,0.08)',
    border:   'rgba(249,115,22,0.22)',
    badge:    'rgba(249,115,22,0.12)',
    label:    'ELEVATED',
    icon:     '▲',
    pulse:    false,
  },
  advisory: {
    accent:   '#f59e0b',
    dimAccent:'rgba(245,158,11,0.06)',
    border:   'rgba(245,158,11,0.18)',
    badge:    'rgba(245,158,11,0.10)',
    label:    'ADVISORY',
    icon:     '◎',
    pulse:    false,
  },
}

function ago(ts) {
  const s = Math.round((Date.now() - ts) / 1000)
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`
}

export default function AlertPanel() {
  const alerts            = useStore(s => s.alerts)
  const dismissAlert      = useStore(s => s.dismissAlert)
  const triggerSonarSpike = useStore(s => s.triggerSonarSpike)

  function handleSpike() {
    const zones = ['B3', 'A2', 'A5']
    triggerSonarSpike(zones[Math.floor(Math.random() * zones.length)])
  }

  const critical = alerts.filter(a => a.severity === 'critical')
  const elevated = alerts.filter(a => a.severity === 'elevated')
  const advisory = alerts.filter(a => a.severity === 'advisory')
  const ordered  = [...critical, ...elevated, ...advisory]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="panel-header">
            Incident Log
          </span>
          {alerts.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 800,
              padding: '2px 7px', borderRadius: 20,
              background: 'rgba(239,68,68,0.15)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.28)',
              letterSpacing: '0.04em',
            }}>{alerts.length} ACTIVE</span>
          )}
        </div>
        <button onClick={handleSpike} style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          padding: '4px 10px', borderRadius: 7,
          background: 'rgba(239,68,68,0.08)',
          color: '#f87171', border: '1px solid rgba(239,68,68,0.18)',
          cursor: 'pointer', transition: 'all var(--transition-fast)',
        }}>⚡ SPIKE</button>
      </div>

      {/* Severity summary */}
      {alerts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            { label: 'Critical', count: critical.length, c: '#ef4444' },
            { label: 'Elevated', count: elevated.length, c: '#f97316' },
            { label: 'Advisory', count: advisory.length, c: '#f59e0b' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              padding: '8px 4px', borderRadius: 8,
              background: `${item.c}0a`,
              border: `1px solid ${item.c}20`,
            }}>
              <span className="mono" style={{ fontSize: 18, fontWeight: 900, color: item.c, lineHeight: 1 }}>{item.count}</span>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ fontSize: 22, color: 'var(--risk-safe)', marginBottom: 6, textShadow: '0 0 16px #10b98160' }}>✓</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>All zones nominal</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>No active incidents detected</div>
        </div>
      )}

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
        {ordered.map(alert => {
          const sv = SEV[alert.severity] || SEV.advisory
          return (
            <div key={alert.id} className="alert-enter">
              {/* Outer glow for critical */}
              {sv.pulse && (
                <div className="alert-critical-pulse" style={{
                  position: 'absolute', inset: 0,
                  borderRadius: 10, pointerEvents: 'none',
                  zIndex: 0,
                }} />
              )}
              <div style={{
                position:     'relative',
                borderRadius: 10,
                border:       `1px solid ${sv.border}`,
                background:   sv.dimAccent,
                overflow:     'hidden',
                backdropFilter: 'blur(12px)',
                boxShadow:    sv.pulse ? `0 0 24px ${sv.accent}18, inset 0 1px 0 rgba(255,255,255,0.03)` : 'inset 0 1px 0 rgba(255,255,255,0.02)',
              }}>
                {/* Left accent bar */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: sv.pulse
                    ? `linear-gradient(180deg, ${sv.accent}, ${sv.accent}80)`
                    : `linear-gradient(180deg, ${sv.accent}80, ${sv.accent}30)`,
                  boxShadow: sv.pulse ? `0 0 12px ${sv.accent}` : 'none',
                }} />

                <div style={{ padding: '10px 12px 10px 16px' }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, color: sv.accent }}>{sv.icon}</span>
                      <div>
                        <div style={{
                          fontSize: 9, fontWeight: 800, color: sv.accent,
                          letterSpacing: '0.10em', lineHeight: 1,
                        }}>{sv.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: 2 }}>
                          {alert.sonar ? 'Acoustic Anomaly Detected' : 'Risk Threshold Breached'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      style={{
                        fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
                        background: 'none', border: 'none', padding: '2px 4px',
                        lineHeight: 1, flexShrink: 0,
                        transition: 'color var(--transition-fast)',
                      }}
                    >✕</button>
                  </div>

                  {/* Zone info */}
                  <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-secondary)' }}>
                    {alert.zone}
                    <span style={{ color: 'var(--text-muted)', margin: '0 5px' }}>·</span>
                    <span style={{ color: 'var(--text-muted)' }}>{ago(alert.ts)}</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{alert.cause}</div>

                  {/* Telemetry strip */}
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    {[
                      { label: 'Risk',    value: alert.risk,                   color: sv.accent },
                      { label: 'Noise',   value: `${alert.noise} dB`,           color: 'var(--text-secondary)' },
                      { label: 'Density', value: Math.round(alert.shipDensity), color: 'var(--text-secondary)' },
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{m.label}</div>
                        <div className="mono" style={{ fontSize: 12, fontWeight: 800, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Auto-dismiss bar */}
                  {alert.autoDismissAt && (
                    <div style={{ marginTop: 8, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                      <DismissBar from={alert.ts} to={alert.autoDismissAt} color={sv.accent} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DismissBar({ from, to, color }) {
  const pct = Math.max(0, Math.min(100, 100 - ((Date.now() - from) / (to - from)) * 100))
  return (
    <div style={{
      height: '100%', width: `${pct}%`,
      background: `linear-gradient(90deg, ${color}60, ${color}30)`,
      borderRadius: 1, transition: 'width 1s linear',
    }} />
  )
}
