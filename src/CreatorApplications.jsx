import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';


function CreatorApplications({ user, onBack }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, campaigns(*)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const handleSubmit = async (appId) => {
    const sub = submissions[appId];
    if (!sub?.url?.trim()) return;
    setSubmitting(appId);

    const { error } = await supabase
      .from('applications')
      .update({
        submission_url: sub.url,
        submission_note: sub.note || '',
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', appId);

    if (!error) {
      setSuccess('Content submitted! Brand will review and approve payment.');
      setTimeout(() => setSuccess(''), 4000);
      fetchApplications();
    }
    setSubmitting(null);
  };

  const updateSub = (appId, field, value) => {
    setSubmissions((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], [field]: value },
    }));
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { bg: 'rgba(255,179,71,0.1)', border: 'rgba(255,179,71,0.2)', color: '#FFB347' },
      approved: { bg: 'rgba(29,158,117,0.1)', border: 'rgba(29,158,117,0.2)', color: '#5DCAA5' },
      submitted: { bg: 'rgba(100,149,237,0.1)', border: 'rgba(100,149,237,0.2)', color: '#8ab4f8' },
      rejected: { bg: 'rgba(226,75,74,0.08)', border: 'rgba(226,75,74,0.2)', color: '#F09595' },
      completed: { bg: 'rgba(29,158,117,0.15)', border: 'rgba(29,158,117,0.3)', color: '#5DCAA5' },
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '⏳ Pending — waiting for brand review',
      approved: '✅ Approved — submit your content now',
      submitted: '📤 Submitted — waiting for brand approval',
      rejected: '✕ Not selected for this campaign',
      completed: '💰 Completed — payment released',
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const formatBudget = (amount) => amount ? '₹' + Number(amount).toLocaleString('en-IN') : '';

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>My Applications</h1>
          <p>Track your campaign applications and submit content</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      {loading ? (
        <div className="campaigns-loading">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No applications yet</div>
          <p className="empty-desc">Browse campaigns and apply to start earning.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {applications.map((app) => {
            const campaign = app.campaigns;
            const statusStyle = getStatusStyle(app.status);
            const isApproved = app.status === 'approved';

            return (
              <div className="campaign-card" key={app.id}>
                <div className="campaign-top">
                  <div>
                    {campaign && (
                      <>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <div className="campaign-niche">{campaign.niche}</div>
                          {campaign.platform && <div className="campaign-niche">{campaign.platform}</div>}
                        </div>
                        <h2 className="campaign-title">{campaign.title}</h2>
                      </>
                    )}
                  </div>
                  {campaign && (
                    <div className="campaign-budget">{formatBudget(campaign.budget)}</div>
                  )}
                </div>

                {campaign && (
                  <div className="campaign-meta">
                    <div className="meta-item">
                      <span className="meta-label">Deliverables</span>
                      <span className="meta-value">{campaign.deliverables}</span>
                    </div>
                    {campaign.deadline && (
                      <div className="meta-item">
                        <span className="meta-label">Deadline</span>
                        <span className="meta-value">{formatDate(campaign.deadline)}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <span className="meta-label">Applied</span>
                      <span className="meta-value">{formatDate(app.created_at)}</span>
                    </div>
                  </div>
                )}

                {/* Your pitch */}
                <div className="app-your-message">
                  <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Your pitch</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--vero-muted)', lineHeight: 1.6, fontWeight: 300 }}>{app.message}</p>
                </div>

                {/* Status badge */}
                <div
                  className="submission-status"
                  style={{
                    background: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    color: statusStyle.color,
                  }}
                >
                  {getStatusLabel(app.status)}
                </div>

                {/* Submission form — only when approved */}
                {isApproved && (
                  <div className="submission-form">
                    <div className="submission-title">📤 Submit Your Content</div>
                    <p className="submission-desc">
                      Post your content on {campaign?.platform || 'social media'} as per the campaign brief, then paste the post URL below.
                    </p>
                    <div className="field" style={{ marginBottom: '0.75rem' }}>
                      <label>Post URL (public link to your content)</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/p/..."
                        value={submissions[app.id]?.url || ''}
                        onChange={(e) => updateSub(app.id, 'url', e.target.value)}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: '1rem' }}>
                      <label>Note to brand (optional)</label>
                      <textarea
                        placeholder="Any notes about your content, creative choices, or performance data..."
                        rows={2}
                        value={submissions[app.id]?.note || ''}
                        onChange={(e) => updateSub(app.id, 'note', e.target.value)}
                      />
                    </div>
                    <button
                      className="apply-btn"
                      onClick={() => handleSubmit(app.id)}
                      disabled={submitting === app.id || !(submissions[app.id]?.url || '').trim()}
                    >
                      {submitting === app.id ? 'Submitting...' : 'Submit Content for Review →'}
                    </button>
                  </div>
                )}

                {/* Submitted — show what was submitted */}
                {app.status === 'submitted' && app.submission_url && (
                  <div className="submitted-content">
                    <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Submitted content</div>
                    <a
                      href={app.submission_url}
                      target="_blank"
                      rel="noreferrer"
                      className="submission-link"
                    >
                      {app.submission_url} ↗
                    </a>
                    {app.submission_note && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--vero-muted)', marginTop: '0.4rem', fontWeight: 300 }}>{app.submission_note}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CreatorApplications;
