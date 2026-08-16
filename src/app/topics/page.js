'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const TopicEditor = dynamic(() => import('@/components/TopicEditor'), { ssr: false });

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  async function fetchTopics() {
    setLoading(true);
    try {
      const res = await fetch('/api/topics');
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (err) {
      console.error('Failed to fetch topics', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedTopic({
      id: crypto.randomUUID(),
      title: 'New Topic',
      content: '',
      isNew: true
    });
  }

  async function handleSaveTopic() {
    if (!selectedTopic) return;
    setIsSubmitting(true);
    
    try {
      const action = selectedTopic.isNew ? 'add' : 'update';
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'topic',
          action: action,
          data: {
            id: selectedTopic.id,
            title: selectedTopic.title,
            content: selectedTopic.content
          },
          author: 'User',
        }),
      });

      if (res.ok) {
        // Remove isNew flag
        setSelectedTopic(prev => ({ ...prev, isNew: false }));
        await fetchTopics();
      }
    } catch (error) {
      console.error('Failed to save topic:', error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleDeleteTopic(id) {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'topic',
          action: 'delete',
          data: { id },
          author: 'User',
        }),
      });

      if (res.ok) {
        if (selectedTopic?.id === id) {
          setSelectedTopic(null);
        }
        await fetchTopics();
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  }

  return (
    <>
      <header className="page-header" id="topics-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Topics Workspace</h1>
            <p>Notion-style collaborative document editing.</p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
        {/* Sidebar */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>All Topics</h2>
            <button onClick={handleCreateNew} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              + New
            </button>
          </div>
          
          {loading ? (
            <div style={{ color: 'var(--text-tertiary)' }}>Loading topics...</div>
          ) : topics.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)' }}>No topics yet. Create one!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topics.map(topic => (
                <div 
                  key={topic.id}
                  style={{ 
                    padding: '12px', 
                    background: selectedTopic?.id === topic.id ? 'var(--accent-light)' : 'var(--white)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{topic.title}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {new Date(topic.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}
                    title="Delete topic"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div style={{ flexGrow: 1 }}>
          {selectedTopic ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--white)', padding: '28px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={selectedTopic.title}
                  onChange={(e) => setSelectedTopic(prev => ({ ...prev, title: e.target.value }))}
                  style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    border: 'none', 
                    outline: 'none',
                    width: '100%',
                    background: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                  placeholder="Topic Title"
                />
                <button 
                  onClick={handleSaveTopic} 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ flexShrink: 0 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
              
              <TopicEditor 
                key={selectedTopic.id}
                initialContent={selectedTopic.content}
                onChange={(content) => {
                  setSelectedTopic(prev => ({ ...prev, content }));
                }}
              />
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px', 
              background: 'var(--white)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-tertiary)'
            }}>
              Select a topic from the sidebar or create a new one.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
