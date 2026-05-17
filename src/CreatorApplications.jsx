import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function CreatorApplications({ user, onBack }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [reapplying, setReapplying] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [reapplyMessages, setReapplyMessages] = useState({});
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

    const app = applications.find(a => a.id === appId);
    const { error } = await supabase.from('applications').update({
      submission_url: sub.url,
      submission_note: sub.note || '',
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    }).eq('id', appId);

    if (!error) {
      if (app?.campaigns?.brand_id) {
        await supabase.from('notifications').insert({
          user_id: app.campaigns.brand_id,
          title: '📤 Creator Submitted Content',
          message: `A creator has submitted content for "${app.campaigns?.title}". Review and approve to release payment.`,
          type: 'submitted',
          read: false,
        });
      }
      setSuccess('Content submitted! Brand will review and approve payment.');
      setTimeout(() => setSuccess(''), 4000);
      fetchApplications();
    }
    setSubmitting(null);
  };

  const handleReapply = async (appId) => {
    const msg = reapplyMessages[appId];
    if (!msg?.trim()) return;
    setReapplying(appId);

    const app = applications.find(a => a.id === appId);
    const { error } = await supabase.from('applications').update({
      status: 'pending',
      reapply_message: msg,
      reapply_count: (app.reapply_count || 0) + 1,
    }).eq('id', appId);

    if (!error) {
      if (app?.campaigns?.brand_id) {
        await supabase.from('notifications').insert({
          user_id: app.campaigns.brand_id,
          title: '↩ Creator Updated Their Pitch',
          message: `A creator has updated their application for "${app.campaigns?.title}". Review their new pitch.`,
          type: 'application',
          read: false,
        });
      }
      setReapplyMessages(prev => ({ ...prev, [appId]: '' }));
      setSuccess('Updated pitch submitted! Brand will review again.');
      setTimeout(() => setSuccess(''), 4000);
      fetchApplications();
    }
    setReapplying(null);
  };

  const updateSub = (appId, field, value) => setSubmissions(prev => ({ ...prev, [appId]: { ...prev[appId], [field]: value } }));

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

  const getStatusLabel = (status) => ({
    pending: '⏳ Pending — waiting for brand review',
    approved: '✅ Approved — submit your content now',
    submitted: '📤 Submitted — waiting for brand approval',
    rejected: '✕ Not selected — you can update your pitch and reapply',
    completed: '💰 Completed — payment released',
  }[status] || status);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatBudget = (amount) => amount ? '₹' + Number(amount).toLocaleString('en-IN') : '';

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>My Applications</h1>
          <p>Track applications and submit content</p>
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
            const isRejected = app.status === 'rejected';

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
                  {campaign && <div className="campaign-budget">{formatBudget(campaign.budget)}</div>}
                </div>

                {campaign && (
                  <div className="campaign-meta">
                    <div className="meta-item"><span className="meta-label">Deliverables</span><span className="meta-value">{campaign.deliverables}</span></div>
                    {campaign.deadline && <div className="meta-item"><span className="meta-label">Deadline</span><span className="meta-value">{formatDate(campaign.deadline)}</span></div>}
                    <div className="meta-item"><span className="meta-label">Applied</span><span className="meta-value">{formatDate(app.created_at)}</span></div>
                  </div>
                )}

                <div className="app-your-message">
                  <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Your pitch {app.reapply_count > 0 && `(updated ${app.reapply_count}x)`}</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--vero-muted)', lineHeight: 1.6, fontWeight: 300 }}>{app.reapply_message || app.message}</p>
                </div>

                <div className="submission-status" style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color }}>
                  {getStatusLabel(app.status)}
                </div>

                {/* Re-application for rejected */}
                {isRejected && (app.reapply_count || 0) < 2 && (
                  <div className="submission-form" style={{ borderColor: 'rgba(255,179,71,0.2)' }}>
                    <div className="submission-title">↩ Update Your Pitch & Reapply</div>
                    <p className="submission-desc">You can update your pitch and reapply up to 2 times. Make it stronger!</p>
                    <div className="field" style={{ marginBottom: '1rem' }}>
                      <label>Updated pitch message</label>
                      <textarea
                        placeholder="Update your pitch — highlight your audience, past work, or why you're perfect for this campaign..."
                        rows={3}
                        value={reapplyMessages[app.id] || ''}
                        onChange={e => setReapplyMessages(prev => ({ ...prev, [app.id]: e.target.value }))}
                      />
                    </div>
                    <button
                      className="apply-btn"
                      style={{ background: '#FFB347' }}
                      onClick={() => handleReapply(app.id)}
                      disabled={reapplying === app.id || !(reapplyMessages[app.id] || '').trim()}
                    >
                      {reapplying === app.id ? 'Submitting...' : 'Reapply with Updated Pitch →'}
                    </button>
                  </div>
                )}

                {/* Content submission for approved */}
                {isApproved && (
                  <div className="submission-form">
                    <div className="submission-title">📤 Submit Your Content</div>
                    <p className="submission-desc">Post your content on {campaign?.platform || 'social media'} as per the campaign brief, then paste the post URL below.</p>
                    <div className="field" style={{ marginBottom: '0.75rem' }}>
                      <label>Post URL</label>
                      <input type="url" placeholder="https://instagram.com/p/..." value={submissions[app.id]?.url || ''} onChange={e => updateSub(app.id, 'url', e.target.value)} />
                    </div>
                    <div className="field" style={{ marginBottom: '1rem' }}>
                      <label>Note to brand (optional)</label>
                      <textarea placeholder="Any notes about your content..." rows={2} value={submissions[app.id]?.note || ''} onChange={e => updateSub(app.id, 'note', e.target.value)} />
                    </div>
                    <button className="apply-btn" onClick={() => handleSubmit(app.id)} disabled={submitting === app.id || !(submissions[app.id]?.url || '').trim()}>
                      {submitting === app.id ? 'Submitting...' : 'Submit Content for Review →'}
                    </button>
                  </div>
                )}

                {app.status === 'submitted' && app.submission_url && (
                  <div className="submitted-content">
                    <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Submitted content</div>
                    <a href={app.submission_url} target="_blank" rel="noreferrer" className="submission-link">{app.submission_url} ↗</a>
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
