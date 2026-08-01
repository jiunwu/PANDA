'use client';

import IntegrationCard from '@/components/IntegrationCard';
import integrationsData from '@/data/integrations.json';

export default function IntegrationsPage() {
  const { integrations } = integrationsData;

  return (
    <>
      <header className="page-header" id="integrations-hero">
        <h1>Integrations</h1>
        <p>
          Connect AI agents and services to automate project updates.
          Agents can read project status and push progress, milestones,
          and notes through the API.
        </p>
      </header>

      {/* API Endpoint Info */}
      <section className="section" id="api-info">
        <div className="section-head">
          <h2 className="section-title">API Endpoints</h2>
          <span className="section-meta">For agent integration</span>
        </div>
        <div className="api-grid">
          <div className="api-item">
            <div className="api-method">GET</div>
            <div className="api-details">
              <code className="api-path">/api/status</code>
              <span className="api-desc">Read current project state</span>
            </div>
          </div>
          <div className="api-item">
            <div className="api-method api-method-post">POST</div>
            <div className="api-details">
              <code className="api-path">/api/update</code>
              <span className="api-desc">Push milestone, progress, or note updates</span>
            </div>
          </div>
          <div className="api-item">
            <div className="api-method api-method-post">POST</div>
            <div className="api-details">
              <code className="api-path">/api/notify</code>
              <span className="api-desc">Send notifications to connected services</span>
            </div>
          </div>
        </div>
        <div className="api-auth-note">
          All endpoints require <code>Authorization: Bearer PANDA_API_KEY</code> header.
          Set your key in Vercel environment variables.
        </div>
      </section>

      {/* Integration Cards */}
      <section className="section" id="integrations-list">
        <div className="section-head">
          <h2 className="section-title">Services</h2>
          <span className="section-meta">{integrations.length} available</span>
        </div>
        <div className="integrations-stack">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </section>
    </>
  );
}
