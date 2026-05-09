import { useStore } from '../store/useStore'

function StatChip({ label, value, sub, valueStyle }) {
  return (
    <div className="panel-sm flex flex-col gap-0.5 px-3 py-2.5">
      <div className="label" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="metric text-xl" style={valueStyle}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export default function RiskStats() {
  const ships  = useStore(s => s.ships)
  const zones  = useStore(s => s.zones)
  const alerts = useStore(s => s.alerts)

  const avgNoise     = (zones.reduce((a, z) => a + z.noise, 0) / zones.length).toFixed(1)
  const highRiskCount = zones.filter(z => z.risk >= 75).length
  const medRiskCount  = zones.filter(z => z.risk >= 50 && z.risk < 75).length

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatChip
        label="Active Ships"
        value={ships.length}
        sub="BOB + Arabian Sea"
        valueStyle={{ color: 'var(--accent-cyan)' }}
      />
      <StatChip
        label="Avg Acoustic"
        value={`${avgNoise} dB`}
        sub="All zones"
        valueStyle={{ color: parseFloat(avgNoise) > 65 ? 'var(--risk-elevated)' : 'var(--text-primary)' }}
      />
      <StatChip
        label="High Risk Zones"
        value={highRiskCount}
        sub={`${medRiskCount} elevated`}
        valueStyle={{ color: highRiskCount > 0 ? 'var(--risk-critical)' : 'var(--risk-safe)' }}
      />
      <StatChip
        label="Active Alerts"
        value={alerts.length}
        sub={alerts.length === 0 ? 'All clear' : 'Require attention'}
        valueStyle={{ color: alerts.length > 0 ? 'var(--risk-critical)' : 'var(--risk-safe)' }}
      />
    </div>
  )
}
