'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [author, setAuthor] = useState('User');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/dashboard-data');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          action: 'add',
          data: { text: newNote.trim() },
          author: author || 'User',
        }),
      });

      if (res.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="page-header" id="notes-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Project Notes & Log Archive</h1>
            <p>Full record of team notes, agent updates, and research logs.</p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="section" id="add-note-section" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
        <div className="section-head">
          <h2 className="section-title">Add Note</h2>
        </div>
        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            className="chat-input"
            style={{
              width: '100%',
              minHeight: '80px',
              background: '#ffffff',
              color: '#000000',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '12px',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
            placeholder="Type a new project note or research update..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            disabled={isSubmitting}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <input
              type="text"
              className="field-input"
              style={{ width: '180px' }}
              placeholder="Author name (e.g. Jiun)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newNote.trim()}>
              {isSubmitting ? 'Saving Note...' : 'Add Note'}
            </button>
          </div>
        </form>
      </section>

      <section className="section" id="notes-archive">
        <div className="section-head">
          <h2 className="section-title">Notes History</h2>
          <span className="section-meta">{notes.length} total notes</span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>Loading notes...</div>
        ) : notes.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>No notes recorded yet.</div>
        ) : (
          <div className="list-stack">
            {notes.map((note, i) => (
              <div
                className="list-item"
                key={i}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--white)',
                  marginBottom: '8px',
                }}
              >
                <div className="item-title" style={{ fontWeight: 'normal', color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>
                  {note.text}
                </div>
                <div className="item-meta" style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                  <span className="source-tag">{note.author || 'Unknown'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{note.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
