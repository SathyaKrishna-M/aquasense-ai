import { useState, useEffect, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { useStore } from '../store/useStore'

const TT_STYLE = {
  background:   'rgba(4,10,26,0.97)',
  border:       '1px solid rgba(34,211,238,0.15)',
  borderRadius: 8,
  fontSize:     11,
  color:        '#ddeeff',
}

const EVENT_STYLES = {
  spike:      { color: '#f59e0b', label: 'SONAR SPIKE' },
  alert:      { color: '#ef4444', label: 'ALERT' },
  escalation: { color: '#f97316', label: 'ESCALATION' },
  elevated:   { color: '#fb923c', label: 'ELEVATED' },
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function BottomBar() {
  const zones     = useStore(s => s.zones)
  const eventLog  = useStore(s => s.eventLog)
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory]   = useState([])
  const tickRef                 = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1
      const avgRisk  = zones.reduce((a, z) => a + z.risk,  0) / zones.length
      const avgNoise = zones.reduce((a, z) => a + z.noise, 0) / zones.length
      setHistory(h => [...h.slice(-29), {
        t:     tickRef.current,
        risk:  parseFloat(avgRisk.toFixed(1)),
        noise: parseFloat(avgNoise.toFixed(1)),
      }])
    }, 1500)
    return () => clearInterval(id)
  }, [zones])

  const zoneBarData = zones.map(z => ({
    id:    z.id,
    risk:  z.risk,
    color: z.risk >= 75 ? '#ef4444' : z.risk >= 50 ? '#f97316' : z.risk >= 35 ? '#f59e0b' : '#10b981',
  }))

  const recentEvents = eventLog.filter(e => Date.now() - e.ts < 5 * 60 * 1000)

  return (
    <div className="bottom-expand shrink-0"
      style={{
        height:     expanded ? 196 : 40,
        background: 'rgba(2,6,16,0.97)',
        borderTop:  '1px solid var(--border-subtle)',
      }}>

      {/* Collapse toggle bar */}
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full flex items-center justify-between px-4 cursor-pointer"
        style={{ height: 40, color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-4">
          <span className="label">Analytics Console</span>
          <div className="flex items-center gap-3" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span>
              Avg risk: <span className="mono" style={{
                color: history[history.length - 1]?.risk >= 75 ? 'var(--risk-critical)'
                     : history[history.length - 1]?.risk >= 50 ? 'var(--risk-elevated)' : 'var(--risk-safe)',
              }}>{history[history.length - 1]?.risk ?? '—'}</span>
            </span>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <span>Avg noise: <span className="mono" style={{ color: 'var(--text-secondary)' }}>{history[history.length - 1]?.noise ?? '—'} dB</span></span>
            {recentEvents.length > 0 && (
              <>
                <span style={{ color: 'var(--border-default)' }}>·</span>
                <span style={{ color: '#f97316' }}>{recentEvents.length} events (5 min)</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{expanded ? 'COLLAPSE' : 'EXPAND'}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}>
            <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Analytics content */}
      {expanded && (
        <div className="flex gap-0" style={{ height: 156, paddingBottom: 8 }}>

          {/* Risk trend */}
          <div className="flex flex-col px-4" style={{ width: '36%', borderRight: '1px solid var(--border-subtle)' }}>
            <div className="label mb-2" style={{ color: 'var(--text-muted)', paddingTop: 4 }}>Risk Trend</div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="noiseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Area type="monotone" dataKey="noise" stroke="#22d3ee" strokeWidth={1} fill="url(#noiseGrad)" dot={false} name="Noise dB" />
                  <Area type="monotone" dataKey="risk"  stroke="#ef4444" strokeWidth={1.5} fill="url(#riskGrad)"  dot={false} name="Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Zone distribution */}
          <div className="flex flex-col px-4" style={{ width: '30%', borderRight: '1px solid var(--border-subtle)' }}>
            <div className="label mb-2" style={{ color: 'var(--text-muted)', paddingTop: 4 }}>Zone Risk</div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneBarData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                  <XAxis dataKey="id" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="risk" radius={[2, 2, 0, 0]}>
                    {zoneBarData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event log */}
          <div className="flex flex-col px-4 flex-1" style={{ overflow: 'hidden' }}>
            <div className="label mb-2" style={{ color: 'var(--text-muted)', paddingTop: 4 }}>Event Log</div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1">
              {recentEvents.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 4 }}>
                  No events in last 5 minutes
                </div>
              )}
              {recentEvents.slice(0, 10).map(evt => {
                const s = EVENT_STYLES[evt.type] || EVENT_STYLES.elevated
                return (
                  <div key={evt.id} className="flex items-center gap-2.5 rounded-md px-2 py-1"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: '0.05em', minWidth: 70 }}>{s.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.zoneName}
                    </span>
                    <span className="mono shrink-0" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatTime(evt.ts)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
