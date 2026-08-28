'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── EXIST Budget Configuration ───
const COACHING_BUDGET = 5000;
const SACHMITTEL_BUDGET = 25000;
const TOTAL_BUDGET = COACHING_BUDGET + SACHMITTEL_BUDGET;

// ─── Category System (EXIST Guideline) ───
const BUDGET_TYPES = {
  coaching: { label: 'Coaching', budget: COACHING_BUDGET, color: '#8b5cf6' },
  sachmittel: { label: 'Sachmittel', budget: SACHMITTEL_BUDGET, color: '#2563eb' },
};

const CATEGORIES = [
  // Coaching categories
  { id: 'coaching_strategy', budget: 'coaching', label: 'Strategie & Geschäftsmodell', icon: '📊', hint: 'Geschäftsmodell, Produkt, Vertrieb, Marketing, Innovationsschutz, Finanzierung' },
  { id: 'coaching_legal', budget: 'coaching', label: 'Rechts- & Steuerberatung', icon: '⚖️', hint: 'Kaufmännische & steuerliche Gestaltung, Rechtsberatung' },
  { id: 'coaching_training', budget: 'coaching', label: 'Weiterbildung (gründungsbez.)', icon: '🎓', hint: 'Gründungsspezifische Weiterbildung zu den benannten Themenfeldern' },
  // Sachmittel categories
  { id: 'sach_material', budget: 'sachmittel', label: 'Material & Lizenzen', icon: '📦', hint: 'Material, Funktionsmuster, Lizenzen, Software' },
  { id: 'sach_services', budget: 'sachmittel', label: 'Dienstleistungen', icon: '🔧', hint: 'Softwareentwicklung, Marketingkonzepte, Patentrecherchen (Auftragsvergabe/Werkvertrag)' },
  { id: 'sach_travel', budget: 'sachmittel', label: 'Dienstreisen', icon: '✈️', hint: 'Tagungen, Weiterbildung, Pilotkunden (nach BayRKG)' },
  { id: 'sach_investment', budget: 'sachmittel', label: 'Investitionen', icon: '💻', hint: 'PC, spezielle Geräte für das Vorhaben' },
  { id: 'sach_pr', budget: 'sachmittel', label: 'Öffentlichkeitsarbeit', icon: '📢', hint: 'Pilotkunden-Gewinnung, Messen, Präsentationen (mit Förderlogos)' },
  { id: 'sach_techconsult', budget: 'sachmittel', label: 'Technische Beratung', icon: '🔬', hint: 'Technische/gestalterische Beratungsleistungen & Schulungen' },
  { id: 'sach_other', budget: 'sachmittel', label: 'Sonstiges', icon: '📁', hint: 'Literatur (sofern nicht ausleihbar), etc.' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Legacy category migration mapping
const LEGACY_CATEGORY_MAP = {
  travel: 'sach_travel',
  accommodation: 'sach_travel',
  materials: 'sach_material',
  conference: 'sach_travel',
  other: 'sach_other',
};

function resolveCategory(catId) {
  return CATEGORY_MAP[catId] || CATEGORY_MAP[LEGACY_CATEGORY_MAP[catId]] || { id: catId, budget: 'sachmittel', label: catId, icon: '📁', hint: '' };
}

function resolveBudgetType(catId) {
  const cat = resolveCategory(catId);
  return cat.budget;
}

const CATEGORY_COLORS = {
  coaching_strategy: '#8b5cf6',
  coaching_legal: '#a855f7',
  coaching_training: '#c084fc',
  sach_material: '#2563eb',
  sach_services: '#0891b2',
  sach_travel: '#059669',
  sach_investment: '#d97706',
  sach_pr: '#e11d48',
  sach_techconsult: '#6366f1',
  sach_other: '#6b7280',
  // Legacy fallbacks
  travel: '#059669',
  accommodation: '#059669',
  materials: '#2563eb',
  conference: '#059669',
  other: '#6b7280',
};

// Coaching max daily rate per EXIST guideline
const COACHING_MAX_DAILY_RATE = 1000; // €1.000 netto incl. Reisekosten

// BayRKG rates
const BAYRKG_RATES = {
  small: { rate: 90, label: '< 300.000 Einwohner' },
  large: { rate: 120, label: '≥ 300.000 Einwohner' },
};
const DAILY_ALLOWANCE_FULL = 28;
const DAILY_ALLOWANCE_HALF = 14;

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

// Calculate Tagegeld per BayRKG based on departure/return times
function calcTagegeld(startDate, endDate, departureTime, returnTime) {
  if (!startDate || !endDate) return { days: [], total: 0 };
  const totalDays = calcDays(startDate, endDate);
  if (totalDays <= 0) return { days: [], total: 0 };

  const depHour = departureTime ? parseFloat(departureTime.split(':')[0]) + parseFloat(departureTime.split(':')[1] || 0) / 60 : 8;
  const retHour = returnTime ? parseFloat(returnTime.split(':')[0]) + parseFloat(returnTime.split(':')[1] || 0) / 60 : 18;

  const days = [];

  if (totalDays === 1) {
    const hours = Math.max(0, retHour - depHour);
    const rate = hours >= 8 ? DAILY_ALLOWANCE_HALF : 0;
    const label = hours >= 8 ? `${hours.toFixed(1)}h → 14 €` : `${hours.toFixed(1)}h → 0 € (<8h)`;
    days.push({ date: startDate, hours, rate, label });
  } else {
    const firstDayHours = Math.max(0, 24 - depHour);
    const firstRate = firstDayHours >= 8 ? DAILY_ALLOWANCE_HALF : 0;
    days.push({
      date: startDate, hours: firstDayHours, rate: firstRate,
      label: `Anreise ${departureTime || '08:00'} → ${firstDayHours.toFixed(1)}h → ${firstRate} €`,
    });

    const s = new Date(startDate);
    for (let i = 1; i < totalDays - 1; i++) {
      const d = new Date(s);
      d.setDate(d.getDate() + i);
      days.push({ date: d.toISOString().split('T')[0], hours: 24, rate: DAILY_ALLOWANCE_FULL, label: `Ganzer Tag → 28 €` });
    }

    const lastDayHours = Math.max(0, retHour);
    const lastRate = lastDayHours >= 8 ? DAILY_ALLOWANCE_HALF : 0;
    days.push({
      date: endDate, hours: lastDayHours, rate: lastRate,
      label: `Abreise ${returnTime || '18:00'} → ${lastDayHours.toFixed(1)}h → ${lastRate} €`,
    });
  }

  const total = days.reduce((sum, d) => sum + d.rate, 0);
  return { days, total };
}

// ─── EXIST Guideline Reference Data ───
const EXIST_ELIGIBLE_COACHING = [
  'Geschäftsmodell, Produkt, Vertrieb',
  'Marketing, Innovationsschutz, Finanzierung',
  'Kaufmännische & steuerliche Beratung',
  'Rechtsberatung (begrenzt)',
  'Gründungsspezifische Weiterbildung',
];
const EXIST_NOT_ELIGIBLE_COACHING = [
  'Technische/gestalterische Beratung → Sachmittel',
  'Notar- & Anmeldegebühren (Unternehmensausgabe)',
];
const EXIST_ELIGIBLE_SACHMITTEL = [
  'Material, Funktionsmuster, Lizenzen, Software',
  'Dienstleistungen (Softwareentwicklung, Marketingkonzepte, Patentrecherchen)',
  'Dienstreisen (Tagungen, Weiterbildung, Pilotkunden)',
  'Investitionen (PC, spezielle Geräte)',
  'Technische/gestalterische Beratung & Schulungen',
  'Öffentlichkeitsarbeit (mit Förderlogos)',
  'Literatur (sofern nicht ausleihbar)',
];
const EXIST_NOT_ELIGIBLE_SACHMITTEL = [
  'Grundausstattung Hochschule (Miete, Büroausstattung, Standardsoftware, Telefon)',
  'Personalmittel für studentische Hilfskräfte',
  'Leistungen innerhalb der Hochschule',
  'Schutzrechte-Anmeldung auf Privatpersonen/Unternehmen',
  'Produktwerbung / Unternehmensmarketing',
  'Bewirtungskosten',
  'Persönliche Weiterbildung ohne Projektbezug',
  'Direkte Gründungsaufwendungen (Notar, Gewerbe, Steuer)',
  'Sachausgaben die nicht mehr wirksam werden',
];

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
  const [guidelineOpen, setGuidelineOpen] = useState(false);

  // Expense form state
  const [expCategory, setExpCategory] = useState('sach_material');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expInvoiceUrl, setExpInvoiceUrl] = useState('');
  const [expInvoiceName, setExpInvoiceName] = useState('');
  const [expInvoiceTo, setExpInvoiceTo] = useState('hochschule');
  const [expProjectRelevance, setExpProjectRelevance] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Travel plan form state
  const [trvDestination, setTrvDestination] = useState('');
  const [trvPurpose, setTrvPurpose] = useState('');
  const [trvStartDate, setTrvStartDate] = useState('');
  const [trvEndDate, setTrvEndDate] = useState('');
  const [trvCitySize, setTrvCitySize] = useState('small');
  const [trvAccommodationCost, setTrvAccommodationCost] = useState('');
  const [trvDepartureTime, setTrvDepartureTime] = useState('08:00');
  const [trvReturnTime, setTrvReturnTime] = useState('18:00');
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

  // ─── Derived values ───
  // Split expenses by budget type
  const coachingExpenses = expenses.filter(e => resolveBudgetType(e.category) === 'coaching');
  const sachmittelExpenses = expenses.filter(e => resolveBudgetType(e.category) === 'sachmittel');
  const coachingSpent = coachingExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const sachmittelSpent = sachmittelExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const coachingRemaining = COACHING_BUDGET - coachingSpent;
  const sachmittelRemaining = SACHMITTEL_BUDGET - sachmittelSpent;

  // Category totals grouped by actual categories in use
  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => {
      const resolved = LEGACY_CATEGORY_MAP[e.category] || e.category;
      return resolved === cat.id;
    }).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(ct => ct.total > 0);

  const filteredExpenses = activeTab === 'all'
    ? expenses
    : activeTab === 'coaching'
      ? coachingExpenses
      : activeTab === 'sachmittel'
        ? sachmittelExpenses
        : expenses.filter(e => (LEGACY_CATEGORY_MAP[e.category] || e.category) === activeTab);

  // Travel plan computed values
  const trvNights = calcNights(trvStartDate, trvEndDate);
  const trvDays = calcDays(trvStartDate, trvEndDate);
  const trvNightlyRate = BAYRKG_RATES[trvCitySize].rate;
  const trvActualPerNight = parseFloat(trvAccommodationCost) || 0;
  const trvAccommodationTotal = trvNights * trvActualPerNight;
  const trvMaxAccommodation = trvNights * trvNightlyRate;
  const trvAccommodationOverLimit = trvActualPerNight > trvNightlyRate;
  const trvTagegeld = calcTagegeld(trvStartDate, trvEndDate, trvDepartureTime, trvReturnTime);
  const trvDailyAllowanceTotal = trvTagegeld.total;
  const trvTransport = parseFloat(trvTransportCost) || 0;
  const trvTotalEstimated = trvAccommodationTotal + trvTransport + trvDailyAllowanceTotal;

  // Coaching daily rate warning
  const isCoachingCategory = resolveBudgetType(expCategory) === 'coaching';
  const expAmountNum = parseFloat(expAmount) || 0;
  const coachingRateWarning = isCoachingCategory && expAmountNum > COACHING_MAX_DAILY_RATE;

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
    setExpCategory('sach_material');
    setExpDescription('');
    setExpAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpInvoiceUrl('');
    setExpInvoiceName('');
    setExpInvoiceTo('hochschule');
    setExpProjectRelevance('');
    setEditingExpense(null);
  }

  function resetTravelForm() {
    setTrvDestination('');
    setTrvPurpose('');
    setTrvStartDate('');
    setTrvEndDate('');
    setTrvCitySize('small');
    setTrvAccommodationCost('');
    setTrvDepartureTime('08:00');
    setTrvReturnTime('18:00');
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
          invoice_to: expInvoiceTo || 'hochschule',
          project_relevance: expProjectRelevance || null,
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
    setExpInvoiceTo(exp.invoice_to || 'hochschule');
    setExpProjectRelevance(exp.project_relevance || '');
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
            departure_time: trvDepartureTime,
            return_time: trvReturnTime,
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
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          action: 'add',
          data: {
            category: 'sach_travel',
            description: `Reise: ${plan.destination} — ${plan.purpose || 'Dienstreise'}`,
            amount: plan.total_estimated,
            date: plan.end_date,
          },
          author: 'User',
        }),
      });
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

  // Budget health helpers
  function budgetBar(label, spent, budget, color, planned) {
    const pct = Math.min(100, (spent / budget) * 100);
    const planPct = planned ? Math.min(100 - pct, (planned / budget) * 100) : 0;
    const healthColor = pct > 90 ? 'var(--red)' : pct > 70 ? '#d97706' : 'var(--green)';
    return (
      <div className="fin-sub-budget" key={label}>
        <div className="fin-sub-budget-header">
          <div>
            <span className="fin-sub-budget-label">{label}</span>
            <span className="fin-sub-budget-total">{formatEuro(budget)}</span>
          </div>
          <div className="fin-sub-budget-nums">
            <span style={{ color: healthColor, fontWeight: 600 }}>{formatEuro(spent)}</span>
            <span className="fin-sub-budget-sep">/</span>
            <span>{formatEuro(budget)}</span>
          </div>
        </div>
        <div className="fin-budget-bar">
          <div className="fin-budget-segment fin-segment-spent" style={{ width: `${pct}%`, background: color }} />
          {planPct > 0 && <div className="fin-budget-segment fin-segment-planned" style={{ width: `${planPct}%` }} />}
        </div>
        <div className="fin-sub-budget-remaining">
          Verbleibend: <strong>{formatEuro(budget - spent)}</strong>
          {pct > 80 && <span className="fin-sub-budget-warn">⚠️ {pct.toFixed(0)}% verbraucht</span>}
        </div>
      </div>
    );
  }

  const currentCatInfo = resolveCategory(expCategory);

  return (
    <>
      {/* Page Header */}
      <header className="page-header" id="finance-header">
        <div className="page-header-row">
          <div>
            <h1>Finance</h1>
            <p>EXIST Gründungsstipendium — Coaching & Sachmittel nach Richtlinie verwalten.</p>
          </div>
        </div>
      </header>

      {/* EXIST Guideline Reference (Collapsible) */}
      <section className="section" id="exist-guideline">
        <button
          className="fin-guideline-toggle"
          onClick={() => setGuidelineOpen(!guidelineOpen)}
          id="guideline-toggle-btn"
        >
          <span className="fin-guideline-toggle-icon">📋</span>
          <span className="fin-guideline-toggle-text">EXIST Richtlinien — Förderfähigkeit</span>
          <span className={`fin-guideline-chevron ${guidelineOpen ? 'fin-chevron-open' : ''}`}>▸</span>
        </button>

        {guidelineOpen && (
          <div className="fin-guideline-content">
            <div className="fin-guideline-grid">
              {/* Coaching column */}
              <div className="fin-guideline-col">
                <div className="fin-guideline-col-header" style={{ borderColor: '#8b5cf6' }}>
                  <h3>🎯 Coaching</h3>
                  <span className="fin-guideline-budget">Budget: {formatEuro(COACHING_BUDGET)}</span>
                </div>
                <div className="fin-guideline-constraint">
                  ⚠️ Max. <strong>1.000 €/Tag netto</strong> einschl. Reisekosten pro Berater
                </div>
                <div className="fin-guideline-list-section">
                  <h4 className="fin-guideline-list-title fin-eligible">✅ Förderfähig</h4>
                  <ul className="fin-guideline-list">{EXIST_ELIGIBLE_COACHING.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
                <div className="fin-guideline-list-section">
                  <h4 className="fin-guideline-list-title fin-not-eligible">❌ Nicht förderfähig</h4>
                  <ul className="fin-guideline-list">{EXIST_NOT_ELIGIBLE_COACHING.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
              </div>

              {/* Sachmittel column */}
              <div className="fin-guideline-col">
                <div className="fin-guideline-col-header" style={{ borderColor: '#2563eb' }}>
                  <h3>🔧 Sachausgaben</h3>
                  <span className="fin-guideline-budget">Budget: {formatEuro(SACHMITTEL_BUDGET)}</span>
                </div>
                <div className="fin-guideline-constraint">
                  📄 Rechnungen auf <strong>Hochschule/Forschungseinrichtung</strong> · UVgO/VOL-A beachten · Nur innerhalb Laufzeit
                </div>
                <div className="fin-guideline-list-section">
                  <h4 className="fin-guideline-list-title fin-eligible">✅ Förderfähig</h4>
                  <ul className="fin-guideline-list">{EXIST_ELIGIBLE_SACHMITTEL.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
                <div className="fin-guideline-list-section">
                  <h4 className="fin-guideline-list-title fin-not-eligible">❌ Nicht förderfähig</h4>
                  <ul className="fin-guideline-list">{EXIST_NOT_ELIGIBLE_SACHMITTEL.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
                <div className="fin-guideline-constraint" style={{ marginTop: '8px' }}>
                  🇪🇺 Vergabe außerhalb EU nur nach Abstimmung mit PtJ (kein EU-Anbieter oder ≥50% günstiger)
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Budget Overview — Split into Coaching & Sachmittel */}
      <section className="section" id="budget-overview">
        <div className="fin-stats-grid">
          <div className="fin-stat-card">
            <span className="fin-stat-label">Gesamtbudget</span>
            <span className="fin-stat-value">{formatEuro(TOTAL_BUDGET)}</span>
          </div>
          <div className="fin-stat-card">
            <span className="fin-stat-label">Coaching</span>
            <span className="fin-stat-value" style={{ color: coachingSpent > COACHING_BUDGET * 0.9 ? 'var(--red)' : '#8b5cf6' }}>
              {formatEuro(coachingSpent)}
            </span>
          </div>
          <div className="fin-stat-card">
            <span className="fin-stat-label">Sachmittel</span>
            <span className="fin-stat-value" style={{ color: sachmittelSpent > SACHMITTEL_BUDGET * 0.9 ? 'var(--red)' : '#2563eb' }}>
              {formatEuro(sachmittelSpent)}
            </span>
          </div>
          <div className="fin-stat-card">
            <span className="fin-stat-label">Gesamt verbleibend</span>
            <span className="fin-stat-value">{formatEuro(coachingRemaining + sachmittelRemaining)}</span>
          </div>
        </div>

        <div className="fin-dual-budget">
          {budgetBar('Coaching', coachingSpent, COACHING_BUDGET, '#8b5cf6')}
          {budgetBar('Sachmittel', sachmittelSpent, SACHMITTEL_BUDGET, '#2563eb', totalPlanned)}
        </div>
      </section>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <section className="section" id="category-breakdown">
          <div className="section-head">
            <h2 className="section-title">Ausgaben nach Kategorie</h2>
          </div>
          <div className="fin-category-bars">
            {categoryTotals.map(ct => (
              <div className="fin-cat-row" key={ct.id}>
                <span className="fin-cat-label">{ct.icon} {ct.label}</span>
                <div className="fin-cat-bar-track">
                  <div
                    className="fin-cat-bar-fill"
                    style={{
                      width: `${TOTAL_BUDGET > 0 ? Math.max(0.5, (ct.total / TOTAL_BUDGET) * 100) : 0}%`,
                      background: CATEGORY_COLORS[ct.id] || '#6b7280',
                      minWidth: ct.total > 0 ? '4px' : '0',
                    }}
                  />
                </div>
                <span className="fin-cat-amount">{formatEuro(ct.total)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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

        {/* Budget type filter tabs */}
        <div className="fin-filter-tabs">
          <button
            className={`fin-filter-tab ${activeTab === 'all' ? 'fin-filter-tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Alle
            <span className="fin-filter-count">{expenses.length}</span>
          </button>
          <button
            className={`fin-filter-tab ${activeTab === 'coaching' ? 'fin-filter-tab-active' : ''}`}
            onClick={() => setActiveTab('coaching')}
            style={activeTab === 'coaching' ? { borderColor: '#8b5cf6', color: '#8b5cf6' } : {}}
          >
            🎯 Coaching
            {coachingExpenses.length > 0 && <span className="fin-filter-count">{coachingExpenses.length}</span>}
          </button>
          <button
            className={`fin-filter-tab ${activeTab === 'sachmittel' ? 'fin-filter-tab-active' : ''}`}
            onClick={() => setActiveTab('sachmittel')}
            style={activeTab === 'sachmittel' ? { borderColor: '#2563eb', color: '#2563eb' } : {}}
          >
            🔧 Sachmittel
            {sachmittelExpenses.length > 0 && <span className="fin-filter-count">{sachmittelExpenses.length}</span>}
          </button>
        </div>

        {/* Expense table */}
        {filteredExpenses.length === 0 ? (
          <div className="fin-empty-state">
            <span className="fin-empty-icon">📋</span>
            <p>Keine Ausgaben vorhanden.</p>
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
                  <th>Budget</th>
                  <th>Kategorie</th>
                  <th>Beschreibung</th>
                  <th>Rechnung</th>
                  <th>Betrag</th>
                  <th style={{ textAlign: 'center' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => {
                  const catInfo = resolveCategory(exp.category);
                  const budgetType = catInfo.budget;
                  const catColor = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS[catInfo.id] || '#6b7280';
                  return (
                    <tr key={exp.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
                      <td>
                        <span className={`fin-budget-type-badge fin-badge-${budgetType}`}>
                          {budgetType === 'coaching' ? '🎯' : '🔧'} {BUDGET_TYPES[budgetType]?.label || budgetType}
                        </span>
                      </td>
                      <td>
                        <span className="fin-cat-badge" style={{ background: catColor + '18', color: catColor, borderColor: catColor + '30' }}>
                          {catInfo.icon} {catInfo.label}
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
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5" style={{ fontWeight: 600 }}>Summe</td>
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
              Höchstgrenzen für Übernachtungskosten: <strong>max. 90 €/Nacht</strong> (Orte unter 300.000 EW)
              bzw. <strong>max. 120 €/Nacht</strong> (Orte ab 300.000 EW).
              Tagegeld: <strong>28 €</strong> (ganzer Tag) / <strong>14 €</strong> (≥ 8h Abwesenheit) / <strong>0 €</strong> (&lt; 8h).
              Die tatsächlichen Kosten können niedriger liegen.
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
                    <span>
                      {formatDate(plan.start_date)}{plan.departure_time ? ` ${plan.departure_time}` : ''} – {formatDate(plan.end_date)}{plan.return_time ? ` ${plan.return_time}` : ''}
                    </span>
                  </div>
                  <div className="fin-travel-detail">
                    <span className="fin-detail-label">Nächte</span>
                    <span>{plan.nights}</span>
                  </div>
                  <div className="fin-travel-detail">
                    <span className="fin-detail-label">Übernachtung</span>
                    <span>
                      {formatEuro(plan.accommodation_total)} ({plan.nights} Nächte)
                      {(() => {
                        const actualPerNight = plan.nights > 0 ? plan.accommodation_total / plan.nights : 0;
                        const maxRate = plan.nightly_rate || BAYRKG_RATES[plan.city_size || 'small'].rate;
                        const isOver = actualPerNight > maxRate;
                        return (
                          <span
                            className={`fin-limit-badge ${isOver ? 'fin-limit-over' : 'fin-limit-ok'}`}
                            title={isOver
                              ? `Über Höchstgrenze: ${formatEuro(actualPerNight)}/Nacht > max. ${formatEuro(maxRate)}/Nacht`
                              : `Innerhalb Höchstgrenze: ${formatEuro(actualPerNight)}/Nacht ≤ max. ${formatEuro(maxRate)}/Nacht`
                            }
                          >
                            {isOver ? `⚠️ über max. ${formatEuro(maxRate)}/N` : `✅ ≤ max. ${formatEuro(maxRate)}/N`}
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                  <div className="fin-travel-detail">
                    <span className="fin-detail-label">Tagegeld</span>
                    <span>
                      {formatEuro(plan.daily_allowance_total)}
                      {(() => {
                        const tg = calcTagegeld(plan.start_date, plan.end_date, plan.departure_time, plan.return_time);
                        if (tg.days.length === 0) return null;
                        return (
                          <span className="fin-tagegeld-breakdown">
                            ({tg.days.map((d, i) => (
                              <span key={i} className="fin-tagegeld-day" title={d.label}>
                                {d.rate === 28 ? '●' : d.rate === 14 ? '◐' : '○'}
                              </span>
                            ))})
                          </span>
                        );
                      })()}
                    </span>
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

      {/* ─── Expense Modal ─── */}
      {showExpenseModal && (
        <div className="cal-modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()} id="expense-modal" style={{ width: '520px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              {editingExpense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
            </h3>
            <form className="cal-form" onSubmit={handleAddExpense}>
              {/* Budget type + Category selection */}
              <div className="cal-field">
                <label className="cal-label">Kategorie (EXIST)</label>
                <select className="field-input" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                  <optgroup label="🎯 Coaching">
                    {CATEGORIES.filter(c => c.budget === 'coaching').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🔧 Sachmittel">
                    {CATEGORIES.filter(c => c.budget === 'sachmittel').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </optgroup>
                </select>
                {/* Eligibility hint */}
                <div className="fin-cat-hint">
                  💡 {currentCatInfo.hint}
                </div>
              </div>

              <div className="cal-field">
                <label className="cal-label">Beschreibung</label>
                <input
                  className="field-input"
                  type="text"
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  placeholder="z.B. Beratung Geschäftsmodell, Softwarelizenz, Zugticket"
                />
              </div>
              <div className="cal-field">
                <label className="cal-label">Betrag (€ netto)</label>
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
                {/* Coaching daily rate warning */}
                {coachingRateWarning && (
                  <div className="fin-limit-check fin-limit-check-over">
                    ⚠️ Coaching Tageshonorarsatz max. {formatEuro(COACHING_MAX_DAILY_RATE)} netto einschl. Reisekosten.
                    Falls dies mehrere Tage umfasst, bitte in der Beschreibung vermerken.
                  </div>
                )}
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

              {/* Vorhabensbezug (project relevance) */}
              <div className="cal-field">
                <label className="cal-label">Vorhabensbezug</label>
                <input
                  className="field-input"
                  type="text"
                  value={expProjectRelevance}
                  onChange={e => setExpProjectRelevance(e.target.value)}
                  placeholder="Bezug zum EXIST-Vorhaben beschreiben"
                />
                <div className="fin-cat-hint" style={{ fontSize: '11px' }}>
                  📋 Für alle Ausgaben muss der Vorhabensbezug erkennbar sein.
                </div>
              </div>

              {/* Invoice addressed to */}
              <div className="cal-field">
                <label className="cal-label">Rechnung ausgestellt auf</label>
                <select className="field-input" value={expInvoiceTo} onChange={e => setExpInvoiceTo(e.target.value)}>
                  <option value="hochschule">Hochschule / Forschungseinrichtung</option>
                  <option value="privat">Privatanschrift (begründeter Ausnahmefall)</option>
                </select>
                {expInvoiceTo === 'privat' && (
                  <div className="fin-limit-check fin-limit-check-over" style={{ marginTop: '4px' }}>
                    ⚠️ Nur in begründeten Ausnahmefällen. Ausgaben auf Personen-/Kapitalgesellschaft sind nicht zuwendungsfähig.
                  </div>
                )}
              </div>

              {/* File upload */}
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

      {/* ─── Travel Plan Modal ─── */}
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
                  placeholder="z.B. Konferenz, Meeting, Pilotkunde"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="cal-field">
                  <label className="cal-label">Anreise</label>
                  <div className="fin-datetime-row">
                    <input
                      className="field-input"
                      type="date"
                      value={trvStartDate}
                      onChange={e => setTrvStartDate(e.target.value)}
                      required
                    />
                    <input
                      className="field-input fin-time-input"
                      type="time"
                      value={trvDepartureTime}
                      onChange={e => setTrvDepartureTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="cal-field">
                  <label className="cal-label">Abreise</label>
                  <div className="fin-datetime-row">
                    <input
                      className="field-input"
                      type="date"
                      value={trvEndDate}
                      onChange={e => setTrvEndDate(e.target.value)}
                      required
                    />
                    <input
                      className="field-input fin-time-input"
                      type="time"
                      value={trvReturnTime}
                      onChange={e => setTrvReturnTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* City size toggle */}
              <div className="cal-field">
                <label className="cal-label">Ortsgröße (BayRKG Höchstgrenze)</label>
                <div className="fin-city-toggle">
                  <button
                    type="button"
                    className={`fin-city-option ${trvCitySize === 'small' ? 'fin-city-option-active' : ''}`}
                    onClick={() => setTrvCitySize('small')}
                  >
                    <span className="fin-city-rate">max. {formatEuro(90)}/Nacht</span>
                    <span className="fin-city-desc">&lt; 300.000 EW</span>
                  </button>
                  <button
                    type="button"
                    className={`fin-city-option ${trvCitySize === 'large' ? 'fin-city-option-active' : ''}`}
                    onClick={() => setTrvCitySize('large')}
                  >
                    <span className="fin-city-rate">max. {formatEuro(120)}/Nacht</span>
                    <span className="fin-city-desc">≥ 300.000 EW</span>
                  </button>
                </div>
              </div>

              <div className="cal-field">
                <label className="cal-label">Tatsächliche Übernachtungskosten (€/Nacht)</label>
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={trvAccommodationCost}
                  onChange={e => setTrvAccommodationCost(e.target.value)}
                  placeholder={`z.B. 75 (max. ${trvNightlyRate} €/Nacht)`}
                />
                {trvActualPerNight > 0 && (
                  <div className={`fin-limit-check ${trvAccommodationOverLimit ? 'fin-limit-check-over' : 'fin-limit-check-ok'}`}>
                    {trvAccommodationOverLimit
                      ? `⚠️ ${formatEuro(trvActualPerNight)}/Nacht überschreitet Höchstgrenze von ${formatEuro(trvNightlyRate)}/Nacht`
                      : `✅ ${formatEuro(trvActualPerNight)}/Nacht liegt innerhalb der Höchstgrenze von ${formatEuro(trvNightlyRate)}/Nacht`
                    }
                  </div>
                )}
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
                    <span>
                      {trvNights} × {formatEuro(trvActualPerNight)} = {formatEuro(trvAccommodationTotal)}
                      {trvActualPerNight > 0 && (
                        <span className={`fin-preview-limit ${trvAccommodationOverLimit ? 'fin-preview-limit-over' : 'fin-preview-limit-ok'}`}>
                          {trvAccommodationOverLimit ? '⚠️' : '✅'} max. {formatEuro(trvMaxAccommodation)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="fin-preview-row">
                    <span>Tagegeld ({trvDays} Tage)</span>
                    <span>{formatEuro(trvDailyAllowanceTotal)}</span>
                  </div>
                  {trvTagegeld.days.length > 0 && (
                    <div className="fin-tagegeld-detail">
                      {trvTagegeld.days.map((d, i) => (
                        <div key={i} className="fin-tagegeld-row">
                          <span className="fin-tagegeld-dot">{d.rate === 28 ? '●' : d.rate === 14 ? '◐' : '○'}</span>
                          <span className="fin-tagegeld-info">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
