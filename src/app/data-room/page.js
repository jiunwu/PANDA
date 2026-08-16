'use client';

import { useState, useRef } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function DataRoomPage() {
  const { data, loading, refetch: mutate } = useDashboardData();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (loading) {
    return <div className="page-loading">Loading Data Room...</div>;
  }

  const { dataRoom = [] } = data || {};

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/data-room', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      await mutate();
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/data-room/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Delete failed');
      }

      await mutate();
    } catch (err) {
      console.error(err);
      alert('Failed to delete file');
    }
  };

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Data Room</h1>
          <p className="page-subtitle">Manage project files and documents</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </header>

      <section className="section-block">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataRoom.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px' }}>
                    No files uploaded yet.
                  </td>
                </tr>
              ) : (
                dataRoom.map((doc) => (
                  <tr key={doc.id || doc.title}>
                    <td style={{ fontWeight: 500 }}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {doc.title} {doc.url !== '#' && '↗'}
                      </a>
                    </td>
                    <td>
                      <span className={`type-tag ${doc.status === 'Empty' ? 'type-system' : doc.status === 'Draft' ? 'type-note' : 'type-milestone'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{doc.lastUpdated}</td>
                    <td style={{ textAlign: 'right' }}>
                      {doc.id && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--red)', borderColor: 'var(--red)' }}
                          onClick={() => handleDelete(doc.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
