import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const SUPABASE_URL = 'https://sxmtdqktimpwxjtudtfi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bXRkcWt0aW1wd3hqdHVkdGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDYzODIsImV4cCI6MjA5NDIyMjM4Mn0.hI7C3mvEm3ROLO8-mlb6O5xL5P32rfx1roTALgA7AjM';

function CPVTracking({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    campaign_id: '',
    post_url: '',
    platform: 'instagram',
    manual_views: '',
  });

  useEffect(() => {
    fetchCPVCampaigns();
    fetchMySubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCPVCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_type', 'cpv')
      .eq('status', 'open');
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchMySubmissions = async () => {
    const { data } = await supabase
      .from('cpv_submissions')
      .select('*, campaigns(title, cpv_rate, milestone_views, budget)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    setSubmissions(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!form.campaign_id) {
      setError('Please select a campaign.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('cpv_submissions').insert({
      campaign_id: form.campaign_id,
      creator_id: user.id,
      post_url: form.post_url,
      platform: form.platform,
      manual_views: parseInt(form.manual_views) || 0,
      view_count: 0,
      verified: false,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess('Post submitted! Views will be tracked automatically for YouTube. Instagram requires manual verification until Meta API is approved.');
      setForm({ campaign_id: '', post_url: '', platform: 'instagram', manual_views: '' });
      fetchMySubmissions();
      setTimeout(() => setSuccess(''), 5000);
    }
    setSubmitting(false);
  };

  const handleTrackViews = async (submission) => {
    setTracking(submission.id);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/track-views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          submission_id: submission.id,
          post_url: submission.post_url,
          platform: submission.platform,
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setSuccess(`Views updated! Current count: ${result.view_count.toLocaleString()}`);
      fetchMySubmissions();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
    setTracking(null);
  };

  const calculateEarnings = (submission) => {
    const campaign = submission.campaigns;
    if (!campaign) return 0;
    const views = submission.verified ? submission.view_count : submission.manual_views;
    return Math.floor(views * campaign.cpv_rate);
  };

  const calculateMilestones = (submission) => {
    const campaign = submission.campaigns;
    if (!campaign) return 0;
    const views = submission.verified ? submission.view_count : submission.manual_views;
    return Math.floor(views / campaign.milestone_views);
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>📊 CPV Tracking</h1>
          <p>Submit your posts and track verified views for CPV campaigns</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}
      {error && <div className="form-error" style={{ margin: '0 2.5rem 1rem' }}>{error}</div>}

      {/* Submit new post */}
      <div className="form-card">
        <div className="cpv-section-title">Submit a Post to CPV Campaign</div>

        {loading ? (
          <div className="campaigns-loading">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="campaigns-empty" style={{ padding: '2rem 0' }}>
            <div className="empty-icon">📊</div>
            <div className="empty-title">No CPV campaigns open</div>
            <p className="empty-desc">Check back soon — brands are joining VeroLinkr.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-body" style={{ marginTop: '1.5rem' }}>
            <div className="field">
              <label>Select Campaign</label>
              <select
                value={form.campaign_id}
                onChange={(e) => setForm((p) => ({ ...p, campaign_id: e.target.value }))}
                required
              >
                <option value="">Choose a CPV campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — ₹{c.cpv_rate}/view — Milestone every {formatNum(c.milestone_views)} views
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Platform</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div className="field">
                <label>Current View Count</label>
                <input
                  type="number"
                  placeholder="e.g. 12500"
                  value={form.manual_views}
                  onChange={(e) => setForm((p) => ({ ...p, manual_views: e.target.value }))}
                  min={0}
                />
              </div>
            </div>

            <div className="field">
              <label>Post URL</label>
              <input
                type="url"
                placeholder={form.platform === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://instagram.com/p/...'}
                value={form.post_url}
                onChange={(e) => setForm((p) => ({ ...p, post_url: e.target.value }))}
                required
              />
            </div>

            {form.platform === 'youtube' && (
              <div className="cpv-api-note">
                ⚡ YouTube views tracked automatically via API
              </div>
            )}

            {form.platform === 'instagram' && (
              <div className="cpv-manual-note">
                📸 Instagram views verified manually until Meta API is approved. Enter your current view count above.
              </div>
            )}

            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Post →'}
            </button>
          </form>
        )}
      </div>

      {/* My submissions */}
      {submissions.length > 0 && (
        <div className="campaigns-list" style={{ marginTop: '0' }}>
          <div className="cpv-section-title" style={{ padding: '0 0 1rem' }}>My CPV Submissions</div>
          {submissions.map((sub) => {
            const earnings = calculateEarnings(sub);
            const milestones = calculateMilestones(sub);
            const views = sub.verified ? sub.view_count : sub.manual_views;
            const campaign = sub.campaigns;

            return (
              <div className="campaign-card" key={sub.id}>
                <div className="campaign-top">
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div className="campaign-niche">{sub.platform}</div>
                      {sub.verified ? (
                        <div className="campaign-type-badge participation">✅ API Verified</div>
                      ) : (
                        <div className="campaign-type-badge one_time">📋 Manual</div>
                      )}
                    </div>
                    <h2 className="campaign-title">{campaign?.title || 'CPV Campaign'}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="campaign-budget">₹{formatNum(earnings)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', marginTop: '2px' }}>earned</div>
                  </div>
                </div>

                <div className="campaign-meta">
                  <div className="meta-item">
                    <span className="meta-label">Views</span>
                    <span className="meta-value" style={{ color: 'var(--vero-accent)', fontWeight: 600 }}>
                      {formatNum(views)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Rate</span>
                    <span className="meta-value">₹{campaign?.cpv_rate}/view</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Milestones hit</span>
                    <span className="meta-value">{milestones}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Next milestone at</span>
                    <span className="meta-value">
                      {formatNum((milestones + 1) * (campaign?.milestone_views || 5000))} views
                    </span>
                  </div>
                </div>

                <a
                  href={sub.post_url}
                  target="_blank"
                  rel="noreferrer"
                  className="submission-link"
                  style={{ display: 'block', marginBottom: '1rem' }}
                >
                  View Post ↗
                </a>

                {sub.platform === 'youtube' && (
                  <button
                    className="view-apps-btn"
                    onClick={() => handleTrackViews(sub)}
                    disabled={tracking === sub.id}
                  >
                    {tracking === sub.id ? 'Fetching views...' : '🔄 Refresh View Count'}
                  </button>
                )}

                {sub.platform === 'instagram' && (
                  <div className="cpv-manual-note" style={{ marginTop: '0' }}>
                    Instagram auto-tracking coming once Meta approves our API. View count updated manually for now.
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

export default CPVTracking;
