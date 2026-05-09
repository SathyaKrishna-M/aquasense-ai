import { useStore } from '../store/useStore'

const SEVERITY = {
  critical: {
    borderColor: 'rgba(239,68,68,0.35)',
    bg:          'rgba(239,68,68,0.07)',
    color:       '#f87171',
    badgeBg:     'rgba(239,68,68,0.15)',
    label:       'CRITICAL',
    icon:        '⚡',
    pulse:       true,
  },
  elevated: {
    borderColor: 'rgba(249,115,22,0.3)',
    bg:          'rgba(249,115,22,0.05)',
    color:       '#fb923c',
    badgeBg:     'rgba(249,115,22,0.12)',
    label:       'ELEVATED',
    icon:        '⚠',
    pulse:       false,
  },
  advisory: {
    borderColor: 'rgba(245,158,11,0.2)',
    bg:          'rgba(245,158,11,0.04)',
    color:       '#fbbf24',
    badgeBg:     'rgba(245,158,11,0.1)',
    label:       'ADVISORY',
    icon:        '📡',
    pulse:       false,
  },
}

function formatRelTime(ts) {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  return `${Math.round(s / 60)}m ago`
}

export default function AlertPanel() {
  const alerts           = useStore(s => s.alerts)
  const dismissAlert     = useStore(s => s.dismissAlert)
  const triggerSonarSpike = useStore(s => s.triggerSonarSpike)

  function handleManualSpike() {
    const zones = ['B3', 'A2', 'A5']
    triggerSonarSpike(zones[Math.floor(Math.random() * zones.length)])
  }

  const critical = alerts.filter(a => a.severity === 'critical')
  const elevated = alerts.filter(a => a.severity === 'elevated')
  const advisory = alerts.filter(a => a.severity === 'advisory')
  const ordered  = [...critical, ...elevated, ...advisory]

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="panel-header">
          Active Alerts
          {alerts.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding:  '1px 6px',
              borderRadius: 20,
              background:   'rgba(239,68,68,0.18)',
              color:        '#f87171',
              border:       '1px solid rgba(239,68,68,0.3)',
              marginLeft:   4,
            }}>{alerts.length}</span>
          )}
        </div>
        <button
          onClick={handleManualSpike}
          style={{
            fontSize:    10,
            fontWeight:  600,
            padding:     '4px 10px',
            borderRadius: 8,
            background:  'rgba(239,68,68,0.1)',
            color:       '#f87171',
            border:      '1px solid rgba(239,68,68,0.2)',
            cursor:      'pointer',
            transition:  'all var(--transition-fast)',
          }}
        >
          ⚡ Spike
        </button>
      </div>

      {/* Count strip */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Critical', count: critical.length, color: 'var(--risk-critical)' },
            { label: 'Elevated', count: elevated.length, color: 'var(--risk-elevated)' },
            { label: 'Advisory', count: advisory.length, color: 'var(--risk-moderate)' },
          ].map(item => (
            <div key={item.label} className="panel-sm flex flex-col items-center py-2">
              <span className="metric text-base" style={{ color: item.color }}>{item.count}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 20, color: 'var(--risk-safe)', marginBottom: 6 }}>✓</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>All zones nominal</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>No active alerts detected</div>
        </div>
      )}

      {/* Alert list */}
      <div className="flex flex-col gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
        {ordered.map(alert => {
          const s = SEVERITY[alert.severity] || SEVERITY.advisory
          return (
            <div key={alert.id} className="alert-enter" style={{ position: 'relative' }}>
              {s.pulse && <div className="alert-pulse" style={{
                position:     'absolute',
                inset:        0,
                borderRadius: 'var(--radius-md)',
                pointerEvents: 'none',
              }} />}
              <div style={{
                borderRadius: 'var(--radius-md)',
                border:       `1px solid ${s.borderColor}`,
                background:   s.bg,
                padding:      '10px 12px',
                position:     'relative',
              }}>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  style={{
                    position:  'absolute',
                    top:       8,
                    right:     8,
                    color:     'var(--text-muted)',
                    fontSize:  11,
                    cursor:    'pointer',
                    background: 'none',
                    border:    'none',
                    padding:   '2px 4px',
                    lineHeight: 1,
                  }}
                >✕</button>

                <div className="flex items-start gap-2" style={{ paddingRight: 16 }}>
                  <span style={{ fontSize: 14, marginTop: 1, color: s.color }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 3 }}>
                      <span style={{
                        fontSize:    9,
                        fontWeight:  700,
                        letterSpacing: '0.08em',
                        padding:     '2px 6px',
                        borderRadius: 20,
                        background:  s.badgeBg,
                        color:       s.color,
                        border:      `1px solid ${s.borderColor}`,
                      }}>{s.label}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatRelTime(alert.ts)}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: s.color, lineHeight: 1.3 }}>
                      {alert.sonar ? 'Acoustic Anomaly Detected' : 'Risk Threshold Breached'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{alert.zone}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{alert.cause}</div>

                    <div className="flex gap-4" style={{ marginTop: 6 }}>
                      {[
                        { label: 'Risk',    value: alert.risk,                  color: s.color },
                        { label: 'Noise',   value: `${alert.noise} dB`,          color: 'var(--text-secondary)' },
                        { label: 'Density', value: Math.round(alert.shipDensity), color: 'var(--text-secondary)' },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{item.label}</div>
                          <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {alert.autoDismissAt && (
                  <div style={{ marginTop: 8, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <AutoDismissBar from={alert.ts} to={alert.autoDismissAt} color={s.color} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AutoDismissBar({ from, to, color }) {
  const total   = to - from
  const elapsed = Date.now() - from
  const pct     = Math.max(0, Math.min(100, 100 - (elapsed / total) * 100))
  return (
    <div
      style={{
        height:     '100%',
        width:      `${pct}%`,
        background: color,
        opacity:    0.4,
        borderRadius: 2,
        transition: 'width 1s linear',
      }}
    />
  )
}
