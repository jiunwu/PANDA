'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const EVENT_COLORS = [
  { value: '#111111', label: 'Fokuszeit / Blockiert' },
  { value: '#1a8c5b', label: 'Netzwerk / Extern' },
  { value: '#2563eb', label: 'Meeting / Besprechung' },
  { value: '#9333ea', label: 'Event / Seminar' },
  { value: '#dc2626', label: 'Deadline / Wichtig' },
  { value: '#ea580c', label: 'Urlaub / Abwesenheit' },
  { value: '#ca8a04', label: 'Sonstiges' },
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days = [];

  // Fill leading blanks
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -(startDow - 1 - i));
    days.push({ date: d, isCurrentMonth: false });
  }

  // Fill actual days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Fill trailing blanks to complete the grid
  while (days.length % 7 !== 0) {
    const lastDate = days[days.length - 1].date;
    const next = new Date(lastDate);
    next.setDate(next.getDate() + 1);
    days.push({ date: next, isCurrentMonth: false });
  }

  return days;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeDisplay(t) {
  if (!t) return '';
  return t;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [networkContacts, setNetworkContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time_start: '',
    time_end: '',
    color: '#2563eb',
    author: 'Together',
  });

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const cacheBuster = Date.now();
      const [res, netRes] = await Promise.all([
          fetch(`/api/schedules?t=${cacheBuster}`, { cache: 'no-store' }),
          fetch(`/api/network_contacts`)
      ]);
      if (res.ok) setEvents(await res.json());
      if (netRes.ok) setNetworkContacts(await netRes.json());
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }

  function handleDayClick(dateKey) {
    setSelectedDate(dateKey);
    setForm(prev => ({ ...prev, date: dateKey }));
  }

  function openNewEvent() {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      date: selectedDate || formatDateKey(today),
      date_end: '',
      time_start: '',
      time_end: '',
      color: '#2563eb',
      author: 'Together'
    });
    setShowForm(true);
  }


  function openEditEvent(ev) {
    setEditingId(ev.id);
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      date: ev.date || selectedDate || '',
      date_end: ev.date_end || '',
      time_start: ev.time_start || '',
      time_end: ev.time_end || '',
      color: ev.color || '#2563eb',
      author: ev.author || 'Together'
    });
    setShowForm(true);
  }

  async function handleSaveEvent(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setIsSubmitting(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'schedule',
          action: isEdit ? 'update' : 'add',
          data: {
            id: isEdit ? editingId : crypto.randomUUID(),
            ...form,
          },
          author: form.author,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        await fetchEvents();
      }
    } catch (err) {
      console.error('Failed to save event', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    try {
      await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'schedule',
          action: 'delete',
          data: { id },
          author: 'Jiun',
        }),
      });
      await fetchEvents();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  }

  const grid = getMonthGrid(currentYear, currentMonth);
  const todayKey = formatDateKey(today);

  // Group events by date (including multi-day events)
  const eventsByDate = {};
  events.forEach(ev => {
    let current = ev.date;
    const end = ev.date_end || ev.date;
    let safety = 0;
    while (current <= end && safety < 100) {
      if (!eventsByDate[current]) eventsByDate[current] = [];
      eventsByDate[current].push(ev);
      
      const d = new Date(current + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      current = d.toISOString().split('T')[0];
      safety++;
    }
  });

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  return (
    <>
      <header className="page-header" id="calendar-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Calendar</h1>
            <p>Team schedules, deadlines, and events at a glance.</p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="section" style={{ paddingTop: '32px' }}>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Calendar grid */}
          <div style={{ flex: '1 1 600px', minWidth: 0 }}>
            {/* Month controls */}
            <div className="cal-header">
              <div className="cal-header-left">
                <h2 className="cal-month-title">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
                <button className="btn btn-secondary cal-today-btn" onClick={goToToday}>Today</button>
              </div>
              <div className="cal-nav-btns">
                <button className="cal-arrow" onClick={prevMonth} aria-label="Previous month">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="cal-arrow" onClick={nextMonth} aria-label="Next month">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="cal-grid cal-day-headers">
              {DAY_NAMES.map(d => (
                <div key={d} className="cal-day-header">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="cal-grid cal-cells">
              {grid.map(({ date, isCurrentMonth }, i) => {
                const key = formatDateKey(date);
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const dayEvents = eventsByDate[key] || [];
                return (
                  <div
                    key={i}
                    className={`cal-cell ${!isCurrentMonth ? 'cal-cell-outside' : ''} ${isToday ? 'cal-cell-today' : ''} ${isSelected ? 'cal-cell-selected' : ''}`}
                    onClick={() => handleDayClick(key)}
                  >
                    <span className={`cal-date-num ${isToday ? 'cal-date-today' : ''}`}>{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="cal-cell-events">
                        {dayEvents.slice(0, 2).map((ev, j) => (
                          <div key={j} className="cal-cell-caption" style={{ '--ev-color': ev.color || '#111' }}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="cal-cell-more">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: selected day detail + upcoming/previous */}
          <div style={{ flex: '0 0 340px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Selected day */}
            <div className="cal-sidebar">
              <div className="cal-sidebar-header">
                <h3>{selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a day'
                }</h3>
                {selectedDate && (
                  <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={openNewEvent}>
                    + Event
                  </button>
                )}
              </div>

              {!selectedDate ? (
                <div className="cal-sidebar-empty">Click on a day to see its events.</div>
              ) : selectedEvents.length === 0 ? (
                <div className="cal-sidebar-empty">No events on this day.</div>
              ) : (
                <div className="cal-event-list">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className="cal-event-card">
                      <div className="cal-event-color" style={{ background: ev.color || '#111' }}></div>
                      <div className="cal-event-body">
                        <div className="cal-event-title">{ev.title}</div>
                        {(ev.time_start || ev.time_end) && (
                          <div className="cal-event-time">
                            {formatTimeDisplay(ev.time_start)}{ev.time_end ? ` – ${formatTimeDisplay(ev.time_end)}` : ''}
                          </div>
                        )}
                        {ev.description && <div className="cal-event-desc">{ev.description}</div>}
                        {ev.network_contact_id && networkContacts.find(c => c.id === ev.network_contact_id) && (
                          <div className="cal-event-desc" style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong>Contact:</strong> {networkContacts.find(c => c.id === ev.network_contact_id).name}
                          </div>
                        )}
                        <div className="cal-event-footer">
                          <span className="source-tag" style={{ fontSize: '11px' }}>{ev.author || 'Unknown'}</span>
                          <button className="cal-event-edit" onClick={() => openEditEvent(ev)} style={{marginRight: '8px', border: 'none', background: 'none', color: '#666', cursor: 'pointer', fontSize: '12px'}}>Edit</button>
                          <button className="cal-event-delete" onClick={() => handleDeleteEvent(ev.id)} title="Delete">🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="cal-sidebar">
              <div className="cal-sidebar-section-title">
                <span className="cal-section-icon cal-section-icon-upcoming">▲</span>
                Upcoming Events
              </div>
              {events.filter(ev => ev.date >= todayKey).length === 0 ? (
                <div className="cal-sidebar-empty">No upcoming events.</div>
              ) : (
                <div className="cal-event-list">
                  {events
                    .filter(ev => ev.date >= todayKey)
                    .sort((a, b) => a.date.localeCompare(b.date) || (a.time_start || '').localeCompare(b.time_start || ''))
                    .slice(0, 5)
                    .map(ev => (
                      <div key={ev.id} className="cal-timeline-item" onClick={() => handleDayClick(ev.date)}>
                        <div className="cal-timeline-color" style={{ background: ev.color || '#111' }}></div>
                        <div className="cal-timeline-body">
                          <div className="cal-timeline-title">{ev.title}</div>
                          <div className="cal-timeline-meta">
                            {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {ev.time_start && ` · ${ev.time_start}`}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Previous Events */}
            <div className="cal-sidebar">
              <div className="cal-sidebar-section-title">
                <span className="cal-section-icon cal-section-icon-past">▼</span>
                Previous Events
              </div>
              {events.filter(ev => ev.date < todayKey).length === 0 ? (
                <div className="cal-sidebar-empty">No past events.</div>
              ) : (
                <div className="cal-event-list">
                  {events
                    .filter(ev => ev.date < todayKey)
                    .sort((a, b) => b.date.localeCompare(a.date) || (b.time_start || '').localeCompare(a.time_start || ''))
                    .slice(0, 5)
                    .map(ev => (
                      <div key={ev.id} className="cal-timeline-item cal-timeline-past" onClick={() => handleDayClick(ev.date)}>
                        <div className="cal-timeline-color" style={{ background: ev.color || '#111' }}></div>
                        <div className="cal-timeline-body">
                          <div className="cal-timeline-title">{ev.title}</div>
                          <div className="cal-timeline-meta">
                            {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {ev.time_start && ` · ${ev.time_start}`}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* New event modal */}
      {showForm && (
        <div className="cal-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>{editingId ? 'Edit Event' : 'New Event'}</h3>
            <form onSubmit={handleSaveEvent} className="cal-form">
              <label className="cal-field">
                <span className="cal-label">Title</span>
                <input type="text" className="field-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Seminar, Urlaub, Meeting..." required />
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Start Date</span>
                  <input type="date" className="field-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </label>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">End Date (optional)</span>
                  <input type="date" className="field-input" value={form.date_end || ''} onChange={e => setForm(p => ({ ...p, date_end: e.target.value }))} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Start Time</span>
                  <input type="time" className="field-input" value={form.time_start} onChange={e => setForm(p => ({ ...p, time_start: e.target.value }))} />
                </label>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">End Time</span>
                  <input type="time" className="field-input" value={form.time_end} onChange={e => setForm(p => ({ ...p, time_end: e.target.value }))} />
                </label>
              </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Assignee</span>
                  <select className="field-input" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}>
                    <option value="Together">Together</option>
                    <option value="Nina">Nina</option>
                    <option value="Jiun">Jiun</option>
                  </select>
                </label>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Network Contact (Optional)</span>
                  <select className="field-input" value={form.network_contact_id || ''} onChange={e => setForm(p => ({ ...p, network_contact_id: e.target.value }))}>
                    <option value="">-- None --</option>
                    {networkContacts.map(nc => (
                      <option key={nc.id} value={nc.id}>{nc.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="cal-field">
                <span className="cal-label">Description</span>
                <textarea className="field-input" style={{ minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..." />
              </label>
              <div className="cal-field">
                <span className="cal-label">Kategorie / Farbe</span>
                <div className="cal-color-picker">
                  {EVENT_COLORS.map(c => (
                    <div
                      key={c.value}
                      className="cal-color-option"
                      onClick={() => setForm(p => ({ ...p, color: c.value }))}
                    >
                      <button
                        type="button"
                        className={`cal-color-swatch ${form.color === c.value ? 'cal-color-active' : ''}`}
                        style={{ background: c.value }}
                        title={c.label}
                      />
                      <span className="cal-color-label" style={{ fontWeight: form.color === c.value ? '600' : 'normal' }}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
