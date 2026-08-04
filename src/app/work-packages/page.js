'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WorkPackagesPage() {
  const [workPackages, setWorkPackages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-data')
      .then((res) => res.json())
      .then((data) => {
        setWorkPackages(data.workPackages || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredWP = workPackages.filter(
    (wp) =>
      wp.name?.toLowerCase().includes(search.toLowerCase()) ||
      wp.id?.toLowerCase().includes(search.toLowerCase()) ||
      wp.owner?.toLowerCase().includes(search.toLowerCase())
  );

  const avgProgress =
    workPackages.length > 0
      ? Math.round(workPackages.reduce((sum, wp) => sum + (wp.progress || 0), 0) / workPackages.length)
      : 0;

  return (
    <>
      <header className="page-header" id="work-packages-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Work Packages</h1>
            <p>Comprehensive tracking of all work packages, progress metrics, and task ownership.</p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Summary stats */}
      <div className="stats" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="stat">
          <div className="stat-value">{workPackages.length}</div>
          <div className="stat-label">Total Packages</div>
        </div>
        <div className="stat">
          <div className="stat-value">{avgProgress}%</div>
          <div className="stat-label">Average Completion</div>
        </div>
        <div className="stat">
          <div className="stat-value">{workPackages.filter((w) => w.progress === 100).length}</div>
          <div className="stat-label">Completed Packages</div>
        </div>
        <div className="stat">
          <div className="stat-value">{workPackages.filter((w) => w.progress > 0 && w.progress < 100).length}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>

      <section className="section" id="work-packages-content">
        <div className="section-head" style={{ marginBottom: '20px' }}>
          <h2 className="section-title">All Work Packages ({filteredWP.length})</h2>
          <input
            type="text"
            className="field-input"
            style={{ width: '240px' }}
            placeholder="Search packages or owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>Loading work packages...</div>
        ) : filteredWP.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>No work packages found.</div>
        ) : (
          <table className="table" id="work-packages-table">
            <thead>
              <tr>
                <th>Package ID</th>
                <th>Work Package Name</th>
                <th>Progress</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {filteredWP.map((wp) => (
                <tr key={wp.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', width: '120px' }}>
                    {wp.id}
                  </td>
                  <td style={{ fontSize: '14px', fontWeight: 500 }}>{wp.name}</td>
                  <td style={{ width: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '36px' }}>{wp.progress || 0}%</span>
                      <div className="progress-bar" style={{ flex: 1, marginTop: 0, height: '6px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${wp.progress || 0}%`,
                            background: wp.progress === 100 ? 'var(--green)' : 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="source-tag">{wp.owner || 'TBD'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
