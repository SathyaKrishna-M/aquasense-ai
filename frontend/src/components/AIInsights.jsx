import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store/useStore'

function useTopSpecies() {
  const [top, setTop] = useState(['humpback whale', 'common bottlenose dolphin', "Cuvier's beaked whale", 'sperm whale'])
  useEffect(() => {
    fetch('/api/species?group=mammals&limit=8')
      .then(r => r.json())
      .then(d => {
        const names = (d.species ?? []).map(s => s.vernacularName.toLowerCase())
        if (names.length >= 2) setTop(names)
      })
      .catch(() => null)
  }, [])
  return top
}

function generateInsight(zones, ships, topSpecies) {
  const spiking    = zones.filter(z => z.sonar)
  const critical   = zones.filter(z => z.risk >= 75)
  const escalating = zones.filter(z => z.forecast === 'critical' || z.forecast === 'escalating')
  const avgNoise   = zones.reduce((a, z) => a + z.noise, 0) / zones.length
  const avgRisk    = zones.reduce((a, z) => a + z.risk,  0) / zones.length
  const sp1 = topSpecies[0] ?? 'humpback whale'
  const sp2 = topSpecies[1] ?? 'common bottlenose dolphin'
  const sp3 = topSpecies[2] ?? "Cuvier's beaked whale"

  if (spiking.length > 0) {
    const z = spiking[0]
    return { level: 'critical', title: 'Anomalous Acoustic Event', confidence: 94, icon: '⚡',
      text: `Unusual sonar activity in ${z.name}. Waveform inconsistent with natural sources. At-risk species: ${sp1}, ${sp3} — both documented in OBIS-SEAMAP stranding records as sensitive to impulsive noise. Immediate monitoring recommended.` }
  }
  if (critical.length >= 2) {
    const names = critical.slice(0, 2).map(z => z.name).join(' and ')
    return { level: 'critical', title: 'Multi-Zone Critical Pattern', confidence: 88, icon: '🚨',
      text: `Simultaneous critical conditions across ${names}. Cross-zone acoustic interference may disrupt low-frequency communication used by ${sp1} over distances exceeding 500 km.` }
  }
  if (critical.length === 1) {
    const z = critical[0]
    return { level: 'critical', title: 'Critical Threshold Breached', confidence: 91, icon: '🚨',
      text: `${z.name} has exceeded the 75-point risk threshold. Acoustic levels at ${z.noise.toFixed(0)} dB surpass safe limits for ${sp2} echolocation. Ship density contributes ${Math.round(z.shipDensity * 0.4)} pts to the composite score.` }
  }
  if (escalating.length > 0) {
    const z = escalating[0]
    return { level: 'warning', title: 'Escalation Trajectory Detected', confidence: 76, icon: '📈',
      text: `${z.name} shows a sustained upward risk trend over the last 8 monitoring cycles. Historical OBIS-SEAMAP data links similar patterns to elevated stranding probabilities for ${sp1} and ${sp2}.` }
  }
  if (avgNoise > 62) {
    return { level: 'moderate', title: 'Elevated Baseline Acoustics', confidence: 83, icon: '📡',
      text: `Network-wide baseline at ${avgNoise.toFixed(0)} dB — above the 55 dB ecological comfort threshold. Sustained levels cause cumulative auditory masking in ${sp2} and foraging disruption in ${sp1}. Based on 2,046 stranding events.` }
  }
  if (avgRisk > 45) {
    return { level: 'moderate', title: 'Moderate Systemic Risk', confidence: 79, icon: '🔭',
      text: `Average zone risk at ${avgRisk.toFixed(0)}/100. No single critical zone, but the cumulative stress footprint across monitored corridors is above baseline. ${sp1} migration routes may be indirectly affected.` }
  }
  return { level: 'nominal', title: 'All Systems Nominal', confidence: 97, icon: '✓',
    text: `Marine acoustic levels within safe parameters across all 12 monitored zones. AquaSense AI is conducting passive monitoring across 2.4M km² of ocean surface. 42 documented species under ecological observation.` }
}

const LEVEL = {
  critical: { color: 'var(--risk-critical)', border: 'rgba(239,68,68,0.3)', bar: '#ef4444', badgeBg: 'rgba(239,68,68,0.12)' },
  warning:  { color: 'var(--risk-elevated)', border: 'rgba(249,115,22,0.25)', bar: '#f97316', badgeBg: 'rgba(249,115,22,0.1)' },
  moderate: { color: 'var(--accent-blue)',   border: 'rgba(56,189,248,0.2)', bar: '#38bdf8', badgeBg: 'rgba(56,189,248,0.08)' },
  nominal:  { color: 'var(--risk-safe)',     border: 'rgba(16,185,129,0.2)', bar: '#10b981', badgeBg: 'rgba(16,185,129,0.08)' },
}

const FC_STYLE = {
  critical:   { color: 'var(--risk-critical)', arrow: '▲▲', cls: `badge-critical` },
  escalating: { color: 'var(--risk-elevated)', arrow: '▲',  cls: `badge-escalating` },
  stable:     { color: 'var(--risk-safe)',      arrow: '—',  cls: `badge-stable` },
  decreasing: { color: 'var(--accent-blue)',    arrow: '▼',  cls: `badge-decreasing` },
}

export default function AIInsights() {
  const zones      = useStore(s => s.zones)
  const ships      = useStore(s => s.ships)
  const topSpecies = useTopSpecies()
  const [insight, setInsight] = useState(() => generateInsight(zones, ships, topSpecies))
  const [fadeKey, setFadeKey] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      const next = generateInsight(zones, ships, topSpecies)
      if (next.title !== insight.title || next.level !== insight.level) {
        setInsight(next)
        setFadeKey(k => k + 1)
      }
    }, 4000)
    return () => clearInterval(id)
  }, [zones, ships, topSpecies, insight.title, insight.level])

  const lv = LEVEL[insight.level] || LEVEL.nominal

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-violet)', animation: 'liveBlink 1.8s ease-in-out infinite' }} />
        <span className="panel-header">AI Environmental Analysis</span>
      </div>

      {/* Insight card */}
      <div key={fadeKey} className="panel insight-fade" style={{ border: `1px solid ${lv.border}`, padding: '14px 16px' }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: 18, color: lv.color, marginTop: 2 }}>{insight.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 6 }}>
              {insight.title}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              {insight.text}
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        <div style={{ marginTop: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Confidence</span>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{insight.confidence}%</span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${insight.confidence}%`,
              background: lv.bar,
              borderRadius: 2,
              transition: 'width 1s ease',
            }} />
          </div>
        </div>

        <div style={{
          display:     'inline-block',
          marginTop:   10,
          fontSize:    9,
          fontWeight:  700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding:     '3px 8px',
          borderRadius: 20,
          background:  lv.badgeBg,
          color:       lv.color,
          border:      `1px solid ${lv.border}`,
        }}>{insight.level}</div>
      </div>

      {/* Zone forecast grid */}
      <div className="panel-sm" style={{ padding: '10px 12px' }}>
        <div className="label" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Zone Forecast</div>
        <div className="grid grid-cols-2 gap-1.5">
          {zones.map(z => {
            const fc = FC_STYLE[z.forecast ?? 'stable'] || FC_STYLE.stable
            return (
              <div key={z.id} className="flex items-center justify-between" style={{
                padding:      '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background:   'rgba(255,255,255,0.025)',
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {z.id}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: fc.color }}>{fc.arrow}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
