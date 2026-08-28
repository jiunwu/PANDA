'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const TOTAL_BUDGET = 30000;
const CATEGORIES = ['travel', 'accommodation', 'materials', 'conference', 'other'];
const CATEGORY_LABELS = {
  travel: 'Reisekosten',
  accommodation: 'Übernachtung',
  materials: 'Sachmittel',
  conference: 'Konferenz',
  other: 'Sonstiges',
};
const CATEGORY_COLORS = {
  travel: '#2563eb',
  accommodation: '#7c3aed',
  materials: '#059669',
  conference: '#d97706',
  other: '#6b7280',
};

// BayRKG rates
const BAYRKG_RATES = {
  small: { rate: 90, label: '< 300.000 Einwohner' },
  large: { rate: 120, label: '≥ 300.000 Einwohner' },
};
const DAILY_ALLOWANCE = 28; // €28/day per BayRKG Tagegeld

function formatEuro(n) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcNights(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function calcDays(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diff);
}

export default function FinancePage() {
  const [mounted, setMounted] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [travelPlans, setTravelPlans] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalPlanned, setTotalPlanned] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Expense form state
  const [expCategory, setExpCategory] = useState('travel');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expInvoiceUrl, setExpInvoiceUrl] = useState('');
  const [expInvoiceName, setExpInvoiceName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Travel plan form state
  const [trvDestination, setTrvDestination] = useState('');
  const [trvPurpose, setTrvPurpose] = useState('');
  const [trvStartDate, setTrvStartDate] = useState('');
  const [trvEndDate, setTrvEndDate] = useState('');
  const [trvCitySize, setTrvCitySize] = useState('small');
  const [trvTransportCost, setTrvTransportCost] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance?t=${Date.now()}`, { cache: 'no-store' });
      const d = await res.json();
      if (d.expenses) setExpenses(d.expenses);
      if (d.travelPlans) setTravelPlans(d.travelPlans);
      setTotalSpent(d.totalSpent || 0);
      setTotalPlanned(d.totalPlanned || 0);
    } catch (err) {
      console.error('Failed to fetch finance data:', err);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  // Derived values
  const remaining = TOTAL_BUDGET - totalSpent;
  const spentPct = Math.min(100, (totalSpent / TOTAL_BUDGET) * 100);
  const plannedPct = Math.min(100 - spentPct, (totalPlanned / TOTAL_BUDGET) * 100);
  const categoryTotals = CATEGORIES.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
  }));

  const filteredExpenses = activeTab === 'all'
    ? expenses
    : expenses.filter(e => e.category === activeTab);

  // Travel plan computed values
  const trvNights = calcNights(trvStartDate, trvEndDate);
  const trvDays = calcDays(trvStartDate, trvEndDate);
  const trvNightlyRate = BAYRKG_RATES[trvCitySize].rate;
  const trvAccommodationTotal = trvNights * trvNightlyRate;
  const trvDailyAllowanceTotal = trvDays * DAILY_ALLOWANCE;
  const trvTransport = parseFloat(trvTransportCost) || 0;
  const trvTotalEstimated = trvAccommodationTotal + trvTransport + trvDailyAllowanceTotal;

  // File upload
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/finance/upload', { method: 'POST', body: formData });
      const d = await res.json();
      if (d.url) {
        setExpInvoiceUrl(d.url);
        setExpInvoiceName(d.name || file.name);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  function resetExpenseForm() {
    setExpCategory('travel');
    setExpDescription('');
    setExpAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpInvoiceUrl('');
    setExpInvoiceName('');
    setEditingExpense(null);
  }

  function resetTravelForm() {
    setTrvDestination('');
    setTrvPurpose('');
    setTrvStartDate('');
    setTrvEndDate('');
    setTrvCitySize('small');
    setTrvTransportCost('');
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!expAmount || isNaN(parseFloat(expAmount))) return;
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'expense',
        action: editingExpense ? 'update' : 'add',
        data: {
          ...(editingExpense ? { id: editingExpense.id } : {}),
          category: expCategory,
          description: expDescription,
          amount: parseFloat(expAmount),
          date: expDate,
          invoice_url: expInvoiceUrl || null,
          invoice_name: expInvoiceName || null,
        },
        author: 'User',
      };
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      resetExpenseForm();
      setShowExpenseModal(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to save expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteExpense(id) {
    if (!confirm('Ausgabe wirklich löschen?')) return;
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'expense', action: 'delete', data: { id }, author: 'User' }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  }

  function handleEditExpense(exp) {
    setEditingExpense(exp);
    setExpCategory(exp.category);
    setExpDescription(exp.description || '');
    setExpAmount(String(exp.amount));
    setExpDate(exp.date);
    setExpInvoiceUrl(exp.invoice_url || '');
    setExpInvoiceName(exp.invoice_name || '');
    setShowExpenseModal(true);
  }

  async function handleAddTravelPlan(e) {
    e.preventDefault();
    if (!trvDestination || !trvStartDate || !trvEndDate) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'travel_plan',
          action: 'add',
          data: {
            destination: trvDestination,
            purpose: trvPurpose,
            start_date: trvStartDate,
            end_date: trvEndDate,
            city_size: trvCitySize,
            nights: trvNights,
            nightly_rate: trvNightlyRate,
            accommodation_total: trvAccommodationTotal,
            transport_cost: trvTransport,
            daily_allowance_total: trvDailyAllowanceTotal,
            total_estimated: trvTotalEstimated,
            status: 'planned',
          },
          author: 'User',
        }),
      });
      resetTravelForm();
      setShowTravelModal(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to save travel plan:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTravelPlan(id) {
    if (!confirm('Reiseplan wirklich löschen?')) return;
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'travel_plan', action: 'delete', data: { id }, author: 'User' }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete travel plan:', err);
    }
  }

  async function handleUpdateTravelStatus(id, newStatus) {
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'travel_plan',
          action: 'update',
          data: { id, status: newStatus },
          author: 'User',
        }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to update travel status:', err);
    }
  }

  async function handleConvertToExpense(plan) {
    setIsSubmitting(true);
    try {
      // Add as expense
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          action: 'add',
          data: {
            category: 'travel',
            description: `Reise: ${plan.destination} — ${plan.purpose || 'Dienstreise'}`,
            amount: plan.total_estimated,
            date: plan.end_date,
          },
          author: 'User',
        }),
      });
      // Mark travel plan as completed
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'travel_plan',
          action: 'update',
          data: { id: plan.id, status: 'completed' },
          author: 'User',
        }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to convert travel plan:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted) return null;

  const budgetHealthColor = spentPct > 90 ? 'var(--red)' : spentPct > 70 ? '#d97706' : 'var(--green)';

  return (
    <>
      {/* Page Header */}
      <header className="page-header" id="finance-header">
        <div className="page-header-row">
          <div>
            <h1>Finance</h1>
            <p>Ausgaben verfolgen, Rechnungen hochladen & Reisekosten planen nach BayRKG.</p>
          </div>
        </div>
      </header>

      {/* Budget Overview */}
      <section className="section" id="budget-overview">
        <div className="fin-stats-grid">
          <div className="fin-stat-card">
            <span className="fin-stat-label">Gesamtbudget</span>
            <span className="fin-stat-value">{formatEuro(TOTAL_BUDGET)}</span>
          </div>
          <div className="fin-stat-card">
            <span className="fin-stat-label">Ausgegeben</span>
            <span className="fin-stat-value" style={{ color: budgetHealthColor }}>{formatEuro(totalSpent)}</span>
          </div>
          <div className="fin-stat-card">
            <span className="fin-stat-label">Verbleibend</span>
            <span className="fin-stat-value">{formatEuro(remaining)}</span>
          </div>
          <div className="fin-stat-card">
            <span className="fin-stat-label">Geplant</span>
            <span className="fin-stat-value" style={{ color: '#7c3aed' }}>{formatEuro(totalPlanned)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="fin-budget-bar-wrapper">
          <div className="fin-budget-bar">
            <div
              className="fin-budget-segment fin-segment-spent"
              style={{ width: `${spentPct}%` }}
              title={`Ausgegeben: ${formatEuro(totalSpent)}`}
            />
            <div
              className="fin-budget-segment fin-segment-planned"
              style={{ width: `${plannedPct}%` }}
              title={`Geplant: ${formatEuro(totalPlanned)}`}
            />
          </div>
          <div className="fin-budget-legend">
            <span className="fin-legend-item">
              <span className="fin-legend-dot fin-dot-spent" />
              Ausgegeben ({spentPct.toFixed(1)}%)
            </span>
            <span className="fin-legend-item">
              <span className="fin-legend-dot fin-dot-planned" />
              Geplant ({plannedPct.toFixed(1)}%)
            </span>
            <span className="fin-legend-item">
              <span className="fin-legend-dot fin-dot-remaining" />
              Verfügbar ({(100 - spentPct - plannedPct).toFixed(1)}%)
            </span>
          </div>
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="section" id="category-breakdown">
        <div className="section-head">
          <h2 className="section-title">Ausgaben nach Kategorie</h2>
        </div>
        <div className="fin-category-bars">
          {categoryTotals.map(ct => (
            <div className="fin-cat-row" key={ct.category}>
              <span className="fin-cat-label">{CATEGORY_LABELS[ct.category]}</span>
              <div className="fin-cat-bar-track">
                <div
                  className="fin-cat-bar-fill"
                  style={{
                    width: `${TOTAL_BUDGET > 0 ? Math.max(0.5, (ct.total / TOTAL_BUDGET) * 100) : 0}%`,
                    background: CATEGORY_COLORS[ct.category],
                    minWidth: ct.total > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <span className="fin-cat-amount">{formatEuro(ct.total)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Expense Tracker */}
      <section className="section" id="expense-tracker">
        <div className="section-head">
          <h2 className="section-title">Ausgaben</h2>
          <button
            className="btn btn-primary"
            onClick={() => { resetExpenseForm(); setShowExpenseModal(true); }}
            id="add-expense-btn"
          >
            + Ausgabe hinzufügen
          </button>
        </div>

        {/* Category filter tabs */}
        <div className="fin-filter-tabs">
          <button
            className={`fin-filter-tab ${activeTab === 'all' ? 'fin-filter-tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Alle
            <span className="fin-filter-count">{expenses.length}</span>
          </button>
          {CATEGORIES.map(cat => {
            const count = expenses.filter(e => e.category === cat).length;
            return (
              <button
                key={cat}
                className={`fin-filter-tab ${activeTab === cat ? 'fin-filter-tab-active' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {CATEGORY_LABELS[cat]}
                {count > 0 && <span className="fin-filter-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Expense table */}
        {filteredExpenses.length === 0 ? (
          <div className="fin-empty-state">
            <span className="fin-empty-icon">📋</span>
            <p>Keine Ausgaben{activeTab !== 'all' ? ` in ${CATEGORY_LABELS[activeTab]}` : ''} vorhanden.</p>
            <button className="btn btn-secondary" onClick={() => { resetExpenseForm(); setShowExpenseModal(true); }}>
              Erste Ausgabe hinzufügen
            </button>
          </div>
        ) : (
          <div className="fin-table-wrapper">
            <table className="table" id="expenses-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Kategorie</th>
                  <th>Beschreibung</th>
                  <th>Rechnung</th>
                  <th>Betrag</th>
                  <th style={{ textAlign: 'center' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
                    <td>
                      <span className="fin-cat-badge" style={{ background: CATEGORY_COLORS[exp.category] + '18', color: CATEGORY_COLORS[exp.category], borderColor: CATEGORY_COLORS[exp.category] + '30' }}>
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td>{exp.description || '—'}</td>
                    <td>
                      {exp.invoice_url ? (
                        <a href={exp.invoice_url} target="_blank" rel="noopener noreferrer" className="fin-invoice-link">
                          📎 {exp.invoice_name || 'Rechnung'}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatEuro(exp.amount)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="fin-row-actions">
                        <button className="fin-action-btn" onClick={() => handleEditExpense(exp)} title="Bearbeiten">✏️</button>
                        <button className="fin-action-btn fin-action-delete" onClick={() => handleDeleteExpense(exp.id)} title="Löschen">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ fontWeight: 600 }}>Summe</td>
                  <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatEuro(filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Travel Cost Planner */}
      <section className="section" id="travel-planner">
        <div className="section-head">
          <h2 className="section-title">Reisekostenplaner (BayRKG)</h2>
          <button
            className="btn btn-primary"
            onClick={() => { resetTravelForm(); setShowTravelModal(true); }}
            id="add-travel-btn"
          >
            + Reise planen
          </button>
        </div>

        {/* BayRKG info banner */}
        <div className="fin-info-banner" id="bayrkg-info">
          <div className="fin-info-icon">⚖️</div>
          <div className="fin-info-content">
            <strong>Bayerisches Reisekostengesetz (BayRKG)</strong>
            <p>
              Höchstgrenzen für Übernachtungskosten: <strong>90 €/Nacht</strong> (Orte unter 300.000 EW)
              bzw. <strong>120 €/Nacht</strong> (Orte ab 300.000 EW).
              Tagegeld bei ganztägiger Abwesenheit: <strong>28 €/Tag</strong>.
            </p>
          </div>
        </div>

        {/* Travel plans list */}
        {travelPlans.length === 0 ? (
          <div className="fin-empty-state">
            <span className="fin-empty-icon">✈️</span>
            <p>Noch keine Reisen geplant.</p>
            <button className="btn btn-secondary" onClick={() => { resetTravelForm(); setShowTravelModal(true); }}>
              Erste Reise planen
            </button>
          </div>
        ) : (
          <div className="fin-travel-grid">
            {travelPlans.map(plan => (
              <div className="fin-travel-card" key={plan.id}>
                <div className="fin-travel-card-header">
                  <div>
                    <h3 className="fin-travel-dest">{plan.destination}</h3>
                    {plan.purpose && <p className="fin-travel-purpose">{plan.purpose}</p>}
                  </div>
                  <span className={`fin-status-badge fin-status-${plan.status}`}>
                    {plan.status === 'planned' ? 'Geplant' : plan.status === 'approved' ? 'Genehmigt' : 'Abgeschlossen'}
                  </span>
                </div>

                <div className="fin-travel-details">
                  <div className="fin-travel-detail">
                    <span className="fin-detail-label">Zeitraum</span>
                    <span>{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</span>
                  </div>
                  <div className="fin-travel-detail">
                    <span className="fin-detail-label">Nächte</span>
                    <span>{plan.nights}</span>
                  </div>
                  <div className="fin-travel-detail">
                    <span className="fin-detail-label">Übernachtung</span>
                    <span>{formatEuro(plan.nightly_rate)}/Nacht × {plan.nights} = {formatEuro(plan.accommodation_total)}</span>
                  </div>
                  <div className="fin-travel-detail">
                    <span className="fin-detail-label">Tagegeld</span>
                    <span>{formatEuro(plan.daily_allowance_total)}</span>
                  </div>
                  {plan.transport_cost > 0 && (
                    <div className="fin-travel-detail">
                      <span className="fin-detail-label">Transport</span>
                      <span>{formatEuro(plan.transport_cost)}</span>
                    </div>
                  )}
                  <div className="fin-travel-detail fin-travel-total">
                    <span className="fin-detail-label">Geschätzt gesamt</span>
                    <span className="fin-detail-total">{formatEuro(plan.total_estimated)}</span>
                  </div>
                </div>

                <div className="fin-travel-card-actions">
                  {plan.status === 'planned' && (
                    <button className="btn btn-secondary" onClick={() => handleUpdateTravelStatus(plan.id, 'approved')}>
                      ✓ Genehmigen
                    </button>
                  )}
                  {plan.status === 'approved' && (
                    <button className="btn btn-primary" onClick={() => handleConvertToExpense(plan)} disabled={isSubmitting}>
                      → Als Ausgabe buchen
                    </button>
                  )}
                  <button className="fin-action-btn fin-action-delete" onClick={() => handleDeleteTravelPlan(plan.id)} title="Löschen">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="cal-modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()} id="expense-modal">
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              {editingExpense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
            </h3>
            <form className="cal-form" onSubmit={handleAddExpense}>
              <div className="cal-field">
                <label className="cal-label">Kategorie</label>
                <select className="field-input" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div className="cal-field">
                <label className="cal-label">Beschreibung</label>
                <input
                  className="field-input"
                  type="text"
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  placeholder="z.B. Zugfahrt München–Berlin"
                />
              </div>
              <div className="cal-field">
                <label className="cal-label">Betrag (€)</label>
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="cal-field">
                <label className="cal-label">Datum</label>
                <input
                  className="field-input"
                  type="date"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  required
                />
              </div>
              <div className="cal-field">
                <label className="cal-label">Rechnung / Beleg</label>
                <div
                  className={`fin-dropzone ${uploading ? 'fin-dropzone-uploading' : ''} ${expInvoiceUrl ? 'fin-dropzone-done' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('fin-dropzone-active'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('fin-dropzone-active')}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('fin-dropzone-active');
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      fileInputRef.current.files = dt.files;
                      handleFileUpload({ target: { files: [file] } });
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  {uploading ? (
                    <span className="fin-dropzone-text">⏳ Wird hochgeladen…</span>
                  ) : expInvoiceUrl ? (
                    <span className="fin-dropzone-text">✅ {expInvoiceName || 'Hochgeladen'}</span>
                  ) : (
                    <span className="fin-dropzone-text">📎 Datei hierher ziehen oder klicken (PDF, PNG, JPG)</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploading} style={{ flex: 1 }}>
                  {isSubmitting ? 'Speichern…' : editingExpense ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Travel Plan Modal */}
      {showTravelModal && (
        <div className="cal-modal-overlay" onClick={() => setShowTravelModal(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()} id="travel-modal" style={{ width: '500px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Reise planen
            </h3>
            <form className="cal-form" onSubmit={handleAddTravelPlan}>
              <div className="cal-field">
                <label className="cal-label">Reiseziel</label>
                <input
                  className="field-input"
                  type="text"
                  value={trvDestination}
                  onChange={e => setTrvDestination(e.target.value)}
                  placeholder="z.B. München, Berlin, Nürnberg"
                  required
                />
              </div>
              <div className="cal-field">
                <label className="cal-label">Zweck</label>
                <input
                  className="field-input"
                  type="text"
                  value={trvPurpose}
                  onChange={e => setTrvPurpose(e.target.value)}
                  placeholder="z.B. Konferenz, Meeting, Workshop"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="cal-field">
                  <label className="cal-label">Anreise</label>
                  <input
                    className="field-input"
                    type="date"
                    value={trvStartDate}
                    onChange={e => setTrvStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="cal-field">
                  <label className="cal-label">Abreise</label>
                  <input
                    className="field-input"
                    type="date"
                    value={trvEndDate}
                    onChange={e => setTrvEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* City size toggle */}
              <div className="cal-field">
                <label className="cal-label">Ortsgröße (BayRKG)</label>
                <div className="fin-city-toggle">
                  <button
                    type="button"
                    className={`fin-city-option ${trvCitySize === 'small' ? 'fin-city-option-active' : ''}`}
                    onClick={() => setTrvCitySize('small')}
                  >
                    <span className="fin-city-rate">{formatEuro(90)}/Nacht</span>
                    <span className="fin-city-desc">&lt; 300.000 EW</span>
                  </button>
                  <button
                    type="button"
                    className={`fin-city-option ${trvCitySize === 'large' ? 'fin-city-option-active' : ''}`}
                    onClick={() => setTrvCitySize('large')}
                  >
                    <span className="fin-city-rate">{formatEuro(120)}/Nacht</span>
                    <span className="fin-city-desc">≥ 300.000 EW</span>
                  </button>
                </div>
              </div>

              <div className="cal-field">
                <label className="cal-label">Transportkosten (€)</label>
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={trvTransportCost}
                  onChange={e => setTrvTransportCost(e.target.value)}
                  placeholder="z.B. Zugticket, Mietwagen"
                />
              </div>

              {/* Live cost preview */}
              {trvStartDate && trvEndDate && trvNights > 0 && (
                <div className="fin-cost-preview">
                  <div className="fin-preview-title">Kostenvorschau</div>
                  <div className="fin-preview-row">
                    <span>Übernachtung</span>
                    <span>{trvNights} × {formatEuro(trvNightlyRate)} = {formatEuro(trvAccommodationTotal)}</span>
                  </div>
                  <div className="fin-preview-row">
                    <span>Tagegeld ({trvDays} Tage)</span>
                    <span>{trvDays} × {formatEuro(DAILY_ALLOWANCE)} = {formatEuro(trvDailyAllowanceTotal)}</span>
                  </div>
                  {trvTransport > 0 && (
                    <div className="fin-preview-row">
                      <span>Transport</span>
                      <span>{formatEuro(trvTransport)}</span>
                    </div>
                  )}
                  <div className="fin-preview-row fin-preview-total">
                    <span>Geschätzt gesamt</span>
                    <span>{formatEuro(trvTotalEstimated)}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
                  {isSubmitting ? 'Speichern…' : 'Reise planen'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTravelModal(false)}>
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
