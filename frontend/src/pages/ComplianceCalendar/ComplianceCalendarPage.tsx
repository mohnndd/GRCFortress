import { useEffect, useMemo, useState } from 'react';
import { listCalendarEvents, type CalendarEvent } from '../../api/calendarApi';
import './ComplianceCalendar.css';

const EVENT_TYPE_LABEL: Record<string, string> = {
  RISK_REVIEW: 'Risk Review',
  CONTRACT_END: 'Contract End',
  CONTRACT_RENEWAL: 'Contract Renewal',
  OBSERVATION_DUE: 'Observation Due',
  TERMS_REVIEW: 'Terms Review',
};

const EVENT_TYPE_CLASS: Record<string, string> = {
  RISK_REVIEW: 'cal-event--risk',
  CONTRACT_END: 'cal-event--contract-end',
  CONTRACT_RENEWAL: 'cal-event--contract-renewal',
  OBSERVATION_DUE: 'cal-event--observation',
  TERMS_REVIEW: 'cal-event--terms',
};

function pad2(n: number) { return String(n).padStart(2, '0'); }

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DOW_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ComplianceCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    listCalendarEvents()
      .then(setEvents)
      .catch(() => setError('Failed to load calendar events.'))
      .finally(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
    setSelected(null);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
    setSelected(null);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelected(null);
  }

  // Build calendar grid
  const { days, eventsByDate } = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const eventsByDate: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
      eventsByDate[e.date].push(e);
    }

    return { days, eventsByDate };
  }, [year, month, events]);

  const todayStr = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const selectedEvents = selected ? (eventsByDate[selected] ?? []) : [];

  return (
    <div className="cal-page">
      <div className="cal-header">
        <div>
          <h2>Compliance Calendar</h2>
          <p className="cal-subtitle">Upcoming risk reviews, contract deadlines, observation targets, and terms renewals.</p>
        </div>
      </div>

      <div className="cal-legend">
        {Object.entries(EVENT_TYPE_LABEL).map(([type, label]) => (
          <span key={type} className={`cal-legend-item ${EVENT_TYPE_CLASS[type] ?? ''}`}>{label}</span>
        ))}
      </div>

      {error && <p className="cal-error">{error}</p>}
      {loading && <p className="cal-state">Loading events…</p>}

      {!loading && !error && (
        <div className="cal-body">
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
            <h3 className="cal-month-label">{MONTH_NAMES[month - 1]} {year}</h3>
            <button className="cal-nav-btn" onClick={nextMonth}>›</button>
            <button className="cal-today-btn" onClick={goToday}>Today</button>
          </div>

          <div className="cal-grid">
            {DOW_HEADERS.map((d) => (
              <div key={d} className="cal-dow">{d}</div>
            ))}
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="cal-cell cal-cell--empty" />;
              const dateStr = isoDate(year, month, day);
              const dayEvents = eventsByDate[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selected;
              return (
                <div
                  key={dateStr}
                  className={`cal-cell${isToday ? ' cal-cell--today' : ''}${isSelected ? ' cal-cell--selected' : ''}${dayEvents.length > 0 ? ' cal-cell--has-events' : ''}`}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                >
                  <span className="cal-day-num">{day}</span>
                  <div className="cal-dots">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <span key={i} className={`cal-dot ${EVENT_TYPE_CLASS[e.type] ?? ''}`} />
                    ))}
                    {dayEvents.length > 3 && <span className="cal-dot-more">+{dayEvents.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="cal-detail">
              <div className="cal-detail-header">
                <h4>{selected}</h4>
                <button className="cal-detail-close" onClick={() => setSelected(null)}>✕</button>
              </div>
              {selectedEvents.length === 0
                ? <p className="cal-state">No events on this date.</p>
                : selectedEvents.map((e, i) => (
                  <div key={i} className={`cal-event-item ${EVENT_TYPE_CLASS[e.type] ?? ''}`}>
                    <span className="cal-event-type">{EVENT_TYPE_LABEL[e.type] ?? e.type}</span>
                    <span className="cal-event-title">{e.title}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
