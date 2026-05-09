import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

function useAnimatedCounter(target, duration = 1400) {
  const [value, setValue] = useState(0)
  const raf   = useRef(null)
  const start = useRef(null)
  const from  = useRef(0)

  useEffect(() => {
    from.current  = value
    start.current = null
    cancelAnimationFrame(raf.current)
    function step(ts) {
      if (!start.current) start.current = ts
      const progress = Math.min((ts - start.current) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from.current + (target - from.current) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return value
}

function useIncidents() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/incidents').then(r => r.json()).then(setData).catch(() => null)
  }, [])
  return data
}

function StatRow({ icon, label, value, sub, color }) {
  return (
    <div className="flex items-center gap-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 15, width: 24, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
        {sub && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--accent-cyan)' }}>{value}</div>
    </div>
  )
}

const HEALTH_BARS = [
  { label: 'Anthropogenic Noise Index',       value: 68, color: 'var(--risk-elevated)' },
  { label: 'Biodiversity Corridor Integrity', value: 74, color: 'var(--risk-safe)' },
  { label: 'Marine Traffic Density Index',    value: 82, color: 'var(--risk-critical)' },
  { label: 'Acoustic Disturbance Frequency',  value: 55, color: 'var(--accent-blue)' },
]

export default function GlobalStats() {
  const zones   = useStore(s => s.zones)
  const ships   = useStore(s => s.ships)
  const incidents = useIncidents()

  const avgNoise  = Math.round(zones.reduce((a, z) => a + z.noise, 0) / zones.length)
  const highRisk  = zones.filter(z => z.risk >= 75).length
  const totalStrandings = incidents?.total_strandings    ?? 0
  const totalSpecies    = incidents?.total_mammal_species ?? 0
  const datasetCount    = incidents?.dataset_summary?.length ?? 4

  const animShips      = useAnimatedCounter(ships.length)
  const animNoise      = useAnimatedCounter(avgNoise)
  const animStrandings = useAnimatedCounter(totalStrandings, 2000)
  const animSpecies    = useAnimatedCounter(totalSpecies, 1800)

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }} />
        <span className="panel-header">Global Intelligence</span>
      </div>

      {/* Live stats */}
      <div className="panel-sm" style={{ padding: '2px 12px' }}>
        <StatRow icon="🚢" label="Vessels Under Observation" value={animShips} color="var(--accent-cyan)" />
        <StatRow icon="🔊" label="Avg Acoustic Level" value={`${animNoise} dB`}
          color={avgNoise > 60 ? 'var(--risk-moderate)' : 'var(--risk-safe)'} />
        <StatRow icon="⚠" label="High-Risk Zones" value={highRisk}
          color={highRisk > 0 ? 'var(--risk-critical)' : 'var(--risk-safe)'} />
      </div>

      {/* Dataset-derived stats */}
      <div className="panel-sm" style={{ padding: '2px 12px' }}>
        <StatRow icon="📋" label="Recorded Strandings" value={animStrandings.toLocaleString()}
          sub={`${datasetCount} scientific datasets`} color="var(--risk-elevated)" />
        <StatRow icon="🐋" label="Documented Marine Species" value={animSpecies}
          sub="Mammals, cetaceans & seabirds" color="var(--accent-violet)" />
      </div>

      {/* Data sources */}
      {incidents?.dataset_summary && (
        <div className="panel-sm" style={{ padding: '10px 12px' }}>
          <div className="label" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Data Sources</div>
          <div className="flex flex-col gap-2">
            {incidents.dataset_summary.map(ds => (
              <div key={ds.id} className="flex items-center gap-2">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</div>
                  <div style={{ fontSize: 9,  color: 'var(--text-muted)',    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.source}</div>
                </div>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {ds.records.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ocean health bars */}
      <div className="panel-sm" style={{ padding: '10px 12px' }}>
        <div className="label" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>Ocean Health Indicators</div>
        <div className="flex flex-col gap-3">
          {HEALTH_BARS.map(item => (
            <div key={item.label}>
              <div className="flex justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{item.label}</span>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{item.value}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{
                  height: '100%',
                  width:  `${item.value}%`,
                  background: item.color,
                  borderRadius: 2,
                  transition: 'width 1s ease',
                  opacity: 0.8,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {highRisk > 0 && (
        <div className="flex items-center gap-2" style={{
          background:   'rgba(239,68,68,0.07)',
          border:       '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding:      '8px 12px',
        }}>
          <span style={{ color: 'var(--risk-critical)', fontSize: 13 }}>⚠</span>
          <span style={{ fontSize: 11, color: '#f87171' }}>
            {highRisk} critical zone{highRisk > 1 ? 's' : ''} require immediate attention
          </span>
        </div>
      )}
    </div>
  )
}
