'use client';

import { useState, useEffect } from 'react';

export default function NetworkPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Contact', relevance: '', email: '', phone: '', linkedin: '', first_contact_date: '', last_contact_date: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openNewContact() {
    setForm({ name: '', type: 'Contact', relevance: '', email: '', phone: '', linkedin: '', first_contact_date: '', last_contact_date: '', notes: '' });
    setEditingId(null);
    setShowModal(true);
  }

  function openEditContact(contact) {
    setForm({ ...contact });
    setEditingId(contact.id);
    setShowModal(true);
  }

  async function handleSaveContact(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const author = localStorage.getItem('panda_user') || 'Jiun';
    const action = editingId ? 'update' : 'add';
    const payload = {
      type: 'network_contact',
      action,
      data: { ...form, id: editingId },
      author
    };

    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        fetchContacts();
      } else {
        console.error('Failed to save contact');
      }
    } catch (err) {
      console.error('Failed to save contact', err);
    }
    setIsSubmitting(false);
  }

  async function handleDeleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    const author = localStorage.getItem('panda_user') || 'Jiun';
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'network_contact',
          action: 'delete',
          data: { id },
          author
        })
      });
      if (res.ok) {
        fetchContacts();
      }
    } catch (err) {
      console.error('Failed to delete contact', err);
    }
  }

  async function fetchContacts() {
    setLoading(true);
    try {
      const res = await fetch('/api/network_contacts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setContacts(data);
      } else {
        setContacts([]);
        console.error('Failed to fetch contacts, expected array but got:', data);
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
      setContacts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 className="page-title">Network & Contacts</h1>
          <span className="page-subtitle">Manage mentors, companies, investors, and other connections</span>
        </div>
        <button className="btn btn-primary" onClick={openNewContact}>+ Contact</button>
      </header>

      {loading ? (
        <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading network contacts...</div>
      ) : (
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '20px' }}>
          {contacts.map(contact => (
            <div key={contact.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{contact.name}</h3>
                <span className="source-tag" style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                  {contact.type}
                </span>
              </div>

              {contact.relevance && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <strong>Relevance:</strong> {contact.relevance}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', marginBottom: '12px', flex: 1 }}>
                {contact.email && <div><a href={`mailto:${contact.email}`} style={{ color: 'var(--text-primary)' }}>{contact.email}</a></div>}
                {contact.phone && <div><a href={`tel:${contact.phone}`} style={{ color: 'var(--text-primary)' }}>{contact.phone}</a></div>}
                {contact.linkedin && <div><a href={contact.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)' }}>LinkedIn Profile</a></div>}
              </div>

              {(contact.notes || contact.last_contact_date || contact.first_contact_date) && (
                <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {contact.first_contact_date && <div style={{ marginBottom: '4px' }}><strong>First Contact:</strong> {new Date(contact.first_contact_date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                  {contact.last_contact_date && <div style={{ marginBottom: '4px' }}><strong>Last Contact:</strong> {new Date(contact.last_contact_date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                  {contact.notes && <div>{contact.notes}</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={() => openEditContact(contact)}>Edit</button>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '12px', color: 'var(--text-error)' }} onClick={() => handleDeleteContact(contact.id)}>Delete</button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              No contacts found. Add one to get started.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="cal-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>{editingId ? 'Edit Contact' : 'New Contact'}</h3>
            <form onSubmit={handleSaveContact} className="cal-form">
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="cal-field" style={{ flex: 2 }}>
                  <span className="cal-label">Name</span>
                  <input type="text" className="field-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </label>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Type</span>
                  <select className="field-input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="Mentor">Mentor</option>
                    <option value="Company">Company</option>
                    <option value="Investor">Investor</option>
                    <option value="Contact">Contact</option>
                  </select>
                </label>
              </div>
              <label className="cal-field">
                <span className="cal-label">Relevance (Why are they relevant?)</span>
                <input type="text" className="field-input" value={form.relevance} onChange={e => setForm(p => ({ ...p, relevance: e.target.value }))} />
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Email</span>
                  <input type="email" className="field-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </label>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Phone</span>
                  <input type="text" className="field-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </label>
              </div>
              <label className="cal-field">
                <span className="cal-label">LinkedIn</span>
                <input type="url" className="field-input" value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." />
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">First Contact</span>
                  <input type="date" className="field-input" value={form.first_contact_date} onChange={e => setForm(p => ({ ...p, first_contact_date: e.target.value }))} />
                </label>
                <label className="cal-field" style={{ flex: 1 }}>
                  <span className="cal-label">Last Contact</span>
                  <input type="date" className="field-input" value={form.last_contact_date} onChange={e => setForm(p => ({ ...p, last_contact_date: e.target.value }))} />
                </label>
              </div>
              <label className="cal-field">
                <span className="cal-label">Notes</span>
                <textarea className="field-input" style={{ minHeight: '60px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Met at..." />
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
