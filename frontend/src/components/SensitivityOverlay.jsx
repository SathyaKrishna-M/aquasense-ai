import { useEffect, useState } from 'react'
import { Circle, Polyline, Tooltip } from 'react-leaflet'
import { useStore } from '../store/useStore'

// ── Fetch top mammal species from dataset API ──────────────────────────────
function useMammalSpecies() {
  const [species, setSpecies] = useState([])
  useEffect(() => {
    fetch('/api/species?group=mammals&limit=20')
      .then(r => r.json())
      .then(d => setSpecies(d.species ?? []))
      .catch(() => [])
  }, [])
  return species
}

// ── Zone → species from datasets mapping ──────────────────────────────────
// These species ARE documented in the OBIS-SEAMAP datasets and are the same
// species found in the Indian Ocean equivalents.
const ZONE_SPECIES_MAP = {
  pw1: ['Olive Ridley sea turtle', 'Leatherback sea turtle'],
  pw2: ['Humpback whale', 'Blue whale', 'Fin whale'],
  pw3: ['Dugong', 'Indo-Pacific bottlenose dolphin'],
  pw4: ['Humpback whale', 'Sperm whale', "Cuvier's beaked whale"],
  pw5: ['Common bottlenose dolphin', 'Spinner dolphin', 'Hawksbill sea turtle'],
  pw6: ['Dugong', 'Indo-Pacific humpback dolphin', 'Spinner dolphin'],
}

// ── Static protected zone definitions ──────────────────────────────────────
const PROTECTED_ZONES = [
  {
    id:     'pw1',
    name:   'Olive Ridley Sea Turtle Nesting Zone',
    type:   'turtle',
    lat:    19.5,
    lng:    86.0,
    radius: 120000,
    color:  '#34d399',
    desc:   'Critical nesting habitat. Mass nesting (arribada) events recorded annually. Vessel speed limit enforced.',
    iucn:   'Vulnerable',
  },
  {
    id:     'pw2',
    name:   'Blue Whale Feeding Ground',
    type:   'whale',
    lat:    11.0,
    lng:    67.5,
    radius: 180000,
    color:  '#38bdf8',
    desc:   'Seasonal feeding zone. Acoustic disturbance above 55 dB disrupts low-frequency communication used over hundreds of kilometres.',
    iucn:   'Endangered',
  },
  {
    id:     'pw3',
    name:   'Dugong Seagrass Sanctuary',
    type:   'dugong',
    lat:    10.5,
    lng:    79.5,
    radius: 80000,
    color:  '#a78bfa',
    desc:   'Protected seagrass habitat. Dugong (Dugong dugon) population critically dependent on this zone. Trawling and anchoring prohibited.',
    iucn:   'Vulnerable',
  },
  {
    id:     'pw4',
    name:   'Arabian Sea Humpback Whale Corridor',
    type:   'whale',
    lat:    14.5,
    lng:    64.0,
    radius: 150000,
    color:  '#38bdf8',
    desc:   'Year-round resident humpback whale population — genetically distinct, non-migratory. Only known non-migratory humpback population in the world.',
    iucn:   'Endangered',
  },
  {
    id:     'pw5',
    name:   'Lakshadweep Marine National Park',
    type:   'protected',
    lat:    11.5,
    lng:    72.5,
    radius: 100000,
    color:  '#f472b6',
    desc:   'Designated Marine National Park. Coral reef ecosystem supporting 600+ fish species and critically endangered sea turtles.',
    iucn:   'Protected Area',
  },
  {
    id:     'pw6',
    name:   'Gulf of Mannar Biosphere Reserve',
    type:   'biosphere',
    lat:    9.2,
    lng:    79.5,
    radius: 90000,
    color:  '#fb923c',
    desc:   'UNESCO Biosphere Reserve. Home to dugongs, dolphins, and 3,600+ species. One of the richest coastal biodiversity zones in Asia.',
    iucn:   'UNESCO BR',
  },
]

const MIGRATION_CORRIDOR = [
  [13.0, 62.0], [10.5, 67.0], [8.5, 72.0],
  [7.5, 77.5],  [7.0, 80.5],  [8.5, 83.5],
  [10.0, 86.0], [12.0, 88.5],
]

const TYPE_ICONS = {
  whale: '🐋', turtle: '🐢', dugong: '🌊', protected: '🪸', biosphere: '🌿',
}

const IUCN_COLORS = {
  'Endangered':    'text-red-400',
  'Vulnerable':    'text-amber-400',
  'Protected Area':'text-emerald-400',
  'UNESCO BR':     'text-violet-400',
}

export default function SensitivityOverlay() {
  const show    = useStore(s => s.showSensitivityOverlay)
  const species = useMammalSpecies()

  // Build a lookup: vernacularName → count from real dataset
  const speciesCountMap = Object.fromEntries(
    species.map(s => [s.vernacularName, s.count])
  )

  if (!show) return null

  return (
    <>
      {/* Migration corridor */}
      <Polyline
        positions={MIGRATION_CORRIDOR}
        pathOptions={{ color: '#38bdf8', weight: 2.5, opacity: 0.5, dashArray: '8 6' }}
      >
        <Tooltip sticky>
          <div className="text-xs min-w-[200px]">
            <div className="font-bold mb-1">🐋 Cetacean Migration Corridor</div>
            <div className="text-slate-400 mb-2">
              Arabian Sea → Bay of Bengal seasonal migration route. Heightened acoustic sensitivity zone.
            </div>
            {species.slice(0, 5).map(s => (
              <div key={s.vernacularName} className="flex justify-between text-[10px] py-0.5 border-b border-slate-700/30">
                <span className="text-slate-300">{s.vernacularName}</span>
                <span className="text-slate-500">{s.count} records</span>
              </div>
            ))}
            {species.length > 0 && (
              <div className="text-[9px] text-slate-600 mt-1">
                Source: OBIS-SEAMAP / Duke University datasets
              </div>
            )}
          </div>
        </Tooltip>
      </Polyline>

      {/* Protected zones */}
      {PROTECTED_ZONES.map(z => {
        const zoneSpecies = ZONE_SPECIES_MAP[z.id] ?? []
        // Match against real dataset records
        const matched = zoneSpecies
          .map(name => ({ name, count: speciesCountMap[name] ?? null }))

        return (
          <Circle
            key={z.id}
            center={[z.lat, z.lng]}
            radius={z.radius}
            pathOptions={{
              color:       z.color,
              fillColor:   z.color,
              fillOpacity: 0.1,
              weight:      2,
              opacity:     0.6,
              dashArray:   '6 4',
            }}
          >
            <Tooltip direction="top" opacity={1} className="!p-0 !border-0 !bg-transparent !shadow-none">
              <div className="bg-slate-900/95 border border-slate-600/50 rounded-xl p-3 text-xs min-w-[210px] shadow-xl"
                   style={{ backdropFilter: 'blur(12px)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-bold text-slate-100 leading-snug">
                    {TYPE_ICONS[z.type] || '🌍'} {z.name}
                  </div>
                  <span className={`text-[9px] font-bold shrink-0 ${IUCN_COLORS[z.iucn] || 'text-slate-400'}`}>
                    {z.iucn}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{z.desc}</p>

                {matched.length > 0 && (
                  <>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">
                      Documented Species
                    </div>
                    {matched.map(m => (
                      <div key={m.name} className="flex items-center justify-between text-[10px] py-0.5">
                        <span className="text-slate-300">{m.name}</span>
                        {m.count !== null && (
                          <span className="text-slate-600">{m.count} records</span>
                        )}
                      </div>
                    ))}
                    {matched.some(m => m.count !== null) && (
                      <div className="text-[9px] text-slate-700 mt-1.5">
                        Record counts from OBIS-SEAMAP dataset
                      </div>
                    )}
                  </>
                )}
              </div>
            </Tooltip>
          </Circle>
        )
      })}
    </>
  )
}
