import { create } from 'zustand'

// ── Zone metadata ──────────────────────────────────────────────────────────
const ZONE_META = {
  B1: { name: 'Eastern Bay Shipping Corridor',      region: 'Bay of Bengal', sensitivity: 0.8 },
  B2: { name: 'Sri Lanka Acoustic Zone',            region: 'Bay of Bengal', sensitivity: 0.5 },
  B3: { name: 'Southern Bay Biodiversity Sector',   region: 'Bay of Bengal', sensitivity: 0.9 },
  B4: { name: 'Bengal Deep Water Channel',          region: 'Bay of Bengal', sensitivity: 0.4 },
  B5: { name: 'Chittagong Maritime Corridor',       region: 'Bay of Bengal', sensitivity: 0.7 },
  B6: { name: 'Andaman Sea Passage',                region: 'Bay of Bengal', sensitivity: 0.6 },
  A1: { name: 'Mumbai Offshore Zone',               region: 'Arabian Sea',   sensitivity: 0.6 },
  A2: { name: 'Arabian Deep Marine Zone',           region: 'Arabian Sea',   sensitivity: 0.8 },
  A3: { name: 'Lakshadweep Biodiversity Corridor',  region: 'Arabian Sea',   sensitivity: 0.5 },
  A4: { name: 'Gulf of Khambhat Approach',          region: 'Arabian Sea',   sensitivity: 0.3 },
  A5: { name: 'Coastal Biodiversity Sector',        region: 'Arabian Sea',   sensitivity: 0.9 },
  A6: { name: 'Northern Arabian Monitoring Region', region: 'Arabian Sea',   sensitivity: 0.4 },
}

const ZONE_COORDS = [
  { id: 'B1', lat: 16.0, lng: 87.0 },
  { id: 'B2', lat: 13.5, lng: 85.5 },
  { id: 'B3', lat: 11.0, lng: 84.5 },
  { id: 'B4', lat: 18.0, lng: 89.0 },
  { id: 'B5', lat: 14.5, lng: 91.0 },
  { id: 'B6', lat:  9.5, lng: 83.5 },
  { id: 'A1', lat: 19.0, lng: 65.0 },
  { id: 'A2', lat: 16.0, lng: 63.5 },
  { id: 'A3', lat: 13.5, lng: 67.0 },
  { id: 'A4', lat: 22.0, lng: 62.0 },
  { id: 'A5', lat: 11.5, lng: 69.0 },
  { id: 'A6', lat: 24.0, lng: 64.5 },
]

// ── Ship generation ────────────────────────────────────────────────────────
const SHIP_TYPES = ['cargo', 'tanker', 'fishing', 'naval', 'research']

function generateShips() {
  return Array.from({ length: 18 }, (_, i) => {
    const inBOB = i < 10
    return {
      id: i + 1,
      lat: inBOB ? 9  + Math.random() * 11 : 10 + Math.random() * 13,
      lng: inBOB ? 84 + Math.random() * 10 : 60 + Math.random() * 10,
      speed: 10 + Math.random() * 35,
      type: SHIP_TYPES[Math.floor(Math.random() * SHIP_TYPES.length)],
      heading: Math.random() * 360,
      region: inBOB ? 'BOB' : 'AS',
    }
  })
}

// ── Risk math ─────────────────────────────────────────────────────────────
function calcRisk(acoustic, shipDensity, sensitivity) {
  return Math.min(100, Math.max(0, acoustic * 0.4 + shipDensity * 0.4 + sensitivity * 100 * 0.2))
}

function countShipsNear(ships, lat, lng, radius = 4) {
  return ships.filter(s => Math.abs(s.lat - lat) < radius && Math.abs(s.lng - lng) < radius).length
}

// ── Trend / forecast ───────────────────────────────────────────────────────
function computeTrend(history) {
  if (history.length < 4) return 0
  const half = Math.floor(history.length / 2)
  const older = history.slice(0, half).reduce((a, b) => a + b, 0) / half
  const newer = history.slice(-half).reduce((a, b) => a + b, 0) / half
  return newer - older
}

function getForecast(trend, risk) {
  if (risk >= 75 && trend >= 1.5) return 'critical'
  if (trend >= 4) return 'critical'
  if (trend >= 1.5) return 'escalating'
  if (trend <= -2) return 'decreasing'
  return 'stable'
}

// ── Store ──────────────────────────────────────────────────────────────────
export const useStore = create((set, get) => ({
  ships: generateShips(),

  zones: ZONE_COORDS.map(z => ({
    ...z,
    ...ZONE_META[z.id],
    noise:       30 + Math.random() * 40,
    sonar:       false,
    risk:        0,
    shipDensity: 0,
    riskHistory: [],
    forecast:    'stable',
  })),

  alerts:    [],
  eventLog:  [],

  isMonitoring:          true,
  alertLevel:            'LOW',
  sonarSpikeActive:      false,
  viewMode:              'combined',   // 'traffic' | 'acoustic' | 'sensitivity' | 'combined'
  showSensitivityOverlay: false,

  // ── Actions ──────────────────────────────────────────────────────────────
  setViewMode:              (mode) => set({ viewMode: mode }),
  toggleSensitivityOverlay: ()     => set(s => ({ showSensitivityOverlay: !s.showSensitivityOverlay })),
  toggleMonitoring:         ()     => set(s => ({ isMonitoring: !s.isMonitoring })),
  dismissAlert:             (id)   => set(s => ({ alerts: s.alerts.filter(a => a.id !== id) })),

  triggerSonarSpike: (zoneId) => {
    const zone = get().zones.find(z => z.id === zoneId)
    const ts   = Date.now()
    set(state => ({
      zones: state.zones.map(z =>
        z.id === zoneId ? { ...z, sonar: true, noise: 88 + Math.random() * 12 } : z
      ),
      sonarSpikeActive: true,
      eventLog: [
        { id: `evt-${ts}`, ts, type: 'spike', zoneId, zoneName: zone?.name ?? zoneId, description: 'Sonar anomaly detected', risk: zone?.risk ?? 0 },
        ...state.eventLog,
      ].slice(0, 60),
    }))
    setTimeout(() => {
      set(state => ({
        zones: state.zones.map(z => z.id === zoneId ? { ...z, sonar: false } : z),
        sonarSpikeActive: false,
      }))
    }, 8000)
  },

  tick: () => {
    set(state => {
      // 1. Move ships
      const ships = state.ships.map(ship => {
        const rad   = (ship.heading * Math.PI) / 180
        const speed = ship.speed / 3000
        let lat     = ship.lat + Math.cos(rad) * speed
        let lng     = ship.lng + Math.sin(rad) * speed
        let heading = ship.heading + (Math.random() - 0.5) * 8
        if (ship.region === 'BOB') {
          if (lat < 7  || lat > 22) heading += 180
          if (lng < 83 || lng > 96) heading += 180
        } else {
          if (lat < 7  || lat > 25) heading += 180
          if (lng < 57 || lng > 71) heading += 180
        }
        return { ...ship, lat, lng, heading: heading % 360 }
      })

      // 2. Update zones
      const ts        = Date.now()
      const newEvents = []

      const zones = state.zones.map(z => {
        const noise = z.sonar
          ? z.noise
          : Math.min(100, Math.max(20, z.noise + (Math.random() - 0.48) * 4))

        const density    = countShipsNear(ships, z.lat, z.lng)
        const shipDensity = Math.min(100, density * 14)
        const risk        = parseFloat(calcRisk(noise, shipDensity, z.sensitivity).toFixed(1))
        const riskHistory = [...z.riskHistory, risk].slice(-8)
        const trend       = computeTrend(riskHistory)
        const forecast    = getForecast(trend, risk)

        // Capture escalation transitions for event log
        if (risk >= 75 && z.risk < 75) {
          newEvents.push({ id: `evt-${ts}-${z.id}`, ts, type: 'escalation', zoneId: z.id, zoneName: z.name, description: 'Critical threshold breached', risk })
        } else if (risk >= 50 && z.risk < 50) {
          newEvents.push({ id: `evt-${ts}-${z.id}`, ts, type: 'elevated', zoneId: z.id, zoneName: z.name, description: 'Risk elevated to medium', risk })
        }

        return { ...z, noise: parseFloat(noise.toFixed(1)), shipDensity, risk, riskHistory, forecast }
      })

      // 3. Fire multi-level alerts
      const newAlerts = []
      zones.forEach(z => {
        let severity = null
        if      (z.risk >= 75) severity = 'critical'
        else if (z.risk >= 65) severity = 'elevated'
        else if (z.risk >= 50) severity = 'advisory'
        if (!severity) return

        const cooldown = severity === 'advisory' ? 20000 : 14000
        const already  = state.alerts.find(a => a.zoneId === z.id && ts - a.ts < cooldown)
        if (already) return

        newAlerts.push({
          id:            `${z.id}-${ts}`,
          zoneId:        z.id,
          zone:          z.name,
          region:        z.region,
          risk:          z.risk,
          noise:         z.noise,
          sonar:         z.sonar,
          shipDensity:   z.shipDensity,
          sensitivity:   z.sensitivity,
          severity,
          cause:         z.sonar ? 'Sonar spike + dense traffic' : 'Elevated acoustic disturbance',
          ts,
          autoDismissAt: severity === 'critical' ? null : ts + (severity === 'elevated' ? 22000 : 16000),
        })

        if (severity !== 'advisory') {
          newEvents.push({ id: `evt-a-${ts}-${z.id}`, ts, type: 'alert', zoneId: z.id, zoneName: z.name, description: `${severity} alert triggered`, risk: z.risk, severity })
        }
      })

      // 4. Auto-dismiss expired
      const now          = Date.now()
      const activeAlerts = [...newAlerts, ...state.alerts]
        .filter(a => !a.autoDismissAt || now < a.autoDismissAt)
        .slice(0, 10)

      const maxRisk    = Math.max(...zones.map(z => z.risk))
      const alertLevel = maxRisk >= 75 ? 'HIGH' : maxRisk >= 50 ? 'MEDIUM' : 'LOW'

      return {
        ships,
        zones,
        alertLevel,
        alerts:   activeAlerts,
        eventLog: [...newEvents, ...state.eventLog].slice(0, 60),
      }
    })
  },
}))
