import { useRef, useState, useMemo } from 'react'
import { useStore } from '../store/useStore'

const EVENT_COLORS = {
  spike:      { bg: 'bg-amber-500',  text: 'text-amber-300',  label: 'SONAR SPIKE' },
  alert:      { bg: 'bg-red-500',    text: 'text-red-300',    label: 'ALERT' },
  escalation: { bg: 'bg-orange-500', text: 'text-orange-300', label: 'ESCALATION' },
  elevated:   { bg: 'bg-yellow-500', text: 'text-yellow-300', label: 'ELEVATED' },
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function TimelineSlider() {
  const eventLog      = useStore(s => s.eventLog)
  const isMonitoring  = useStore(s => s.isMonitoring)

  const [expanded, setExpanded] = useState(false)
  const trackRef                = useRef(null)

  const windowMs = 5 * 60 * 1000 // 5-minute window
  const now      = Date.now()
  const oldest   = now - windowMs

  const visibleEvents = useMemo(
    () => eventLog.filter(e => e.ts >= oldest),
    [eventLog, oldest]
  )

  // Position an event on the timeline 0–100%
  function eventPos(ts) {
    return Math.max(0, Math.min(100, ((ts - oldest) / windowMs) * 100))
  }

  return (
    <div className={`glass-darker border-t border-slate-700/50 transition-all duration-300 shrink-0 ${expanded ? 'h-44' : 'h-11'}`}>
      {/* Header / collapse bar */}
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full flex items-center justify-between px-4 h-11 hover:bg-slate-800/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Event Timeline</span>
          {visibleEvents.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/60 rounded text-slate-400">
              {visibleEvents.length} event{visibleEvents.length !== 1 ? 's' : ''} (last 5 min)
            </span>
          )}
          {isMonitoring && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <span className="text-slate-500 text-xs">{expanded ? '▼' : '▲'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 flex flex-col gap-3">
          {/* Visual track */}
          <div className="relative" ref={trackRef}>
            <div className="h-1.5 bg-slate-700/60 rounded-full relative overflow-visible">
              {/* Live fill */}
              <div className="absolute inset-y-0 left-0 bg-sky-600/30 rounded-full" style={{ width: '100%' }} />

              {/* Event markers */}
              {visibleEvents.map(evt => {
                const c = EVENT_COLORS[evt.type] || EVENT_COLORS.elevated
                return (
                  <div
                    key={evt.id}
                    className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${c.bg} cursor-pointer ring-2 ring-slate-900`}
                    style={{ left: `${eventPos(evt.ts)}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                    title={`${c.label}: ${evt.zoneName}\n${formatTime(evt.ts)}`}
                  />
                )
              })}

              {/* NOW indicator */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-0.5 h-3 bg-sky-400/80 -mt-0.5" />
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-slate-600">−5 min</span>
              <span className="text-[9px] text-slate-600">−2.5 min</span>
              <span className="text-[9px] text-sky-500">NOW</span>
            </div>
          </div>

          {/* Event log list */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {visibleEvents.length === 0 && (
              <div className="text-[10px] text-slate-600 italic">No events in the last 5 minutes — all zones nominal</div>
            )}
            {[...visibleEvents].slice(0, 12).map(evt => {
              const c = EVENT_COLORS[evt.type] || EVENT_COLORS.elevated
              return (
                <div key={evt.id} className="shrink-0 bg-slate-800/60 border border-slate-700/40 rounded-lg px-2.5 py-1.5 min-w-[140px]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold ${c.text}`}>{c.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.bg} shrink-0`} />
                  </div>
                  <div className="text-[10px] text-slate-300 truncate font-medium">{evt.zoneName}</div>
                  <div className="text-[9px] text-slate-600">{formatTime(evt.ts)}</div>
                  {evt.risk > 0 && (
                    <div className="text-[9px] text-slate-500">Risk: {evt.risk}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
