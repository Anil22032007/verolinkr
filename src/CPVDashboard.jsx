import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function CPVDashboard({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [approving, setApproving] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCPVCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCPVCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('brand_id', user.id)
      .eq('campaign_type', 'cpv')
      .order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchSubmissions = async (campaignId) => {
    if (submissions[campaignId] && expanded === campaignId) {
      setExpanded(null);
      return;
    }
    const { data } = await supabase
      .from('cpv_submissions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    setSubmissions((prev) => ({ ...prev, [campaignId]: data || [] }));
    setExpanded(campaignId);
  };

  const approveViews = async (submissionId, campaignId, manualViews, cpvRate, milestoneViews) => {
    setApproving(submissionId);
    const milestones = Math.floor(manualViews / milestoneViews);
    const paymentAmount = Math.floor(manualViews * cpvRate);

    await supabase
      .from('cpv_submissions')
      .update({
        view_count: manualViews,
        verified: true,
        payment_released: paymentAmount,
      })
      .eq('id', submissionId);

    setSubmissions((prev) => ({
      ...prev,
      [campaignId]: prev[campaignId].map((s) =>
        s.id === submissionId
          ? { ...s, view_count: manualViews, verified: true, payment_released: paymentAmount }
          : s
      ),
    }));

    setSuccess(`✅ Verified ${Number(manualViews).toLocaleString()} views. ₹${paymentAmount.toLocaleString()} earned by creator across ${milestones} milestones.`);
    setTimeout(() => setSuccess(''), 5000);
    setApproving(null);
  };

  const getTotalStats = (campaignId) => {
    const subs = submissions[campaignId] || [];
    const totalViews = subs.reduce((sum, s) => sum + (s.verified ? s.view_count : s.manual_views || 0), 0);
    const totalCreators = subs.length;
    const totalPaid = subs.reduce((sum, s) => sum + (s.payment_released || 0), 0);
    return { totalViews, totalCreators, totalPaid };
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>📊 CPV Campaign Monitor</h1>
          <p>Track views, verify submissions, monitor campaign performance</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      {loading ? (
        <div className="campaigns-loading">Loading CPV campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No CPV campaigns yet</div>
          <p className="empty-desc">Create a CPV campaign to start tracking verified views.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map((campaign) => {
            const stats = getTotalStats(campaign.id);
            const budgetUsed = Math.round((stats.totalPaid / campaign.budget) * 100);

            return (
              <div className="campaign-card" key={campaign.id}>
                <div className="campaign-top">
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div className="campaign-type-badge cpv">📊 CPV</div>
                      <div className="campaign-niche">{campaign.niche}</div>
                      <div className={`status-badge ${campaign.status}`}>{campaign.status}</div>
                    </div>
                    <h2 className="campaign-title">{campaign.title}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="campaign-budget">₹{formatNum(campaign.budget)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', marginTop: '2px' }}>
                      ₹{campaign.cpv_rate}/view
                    </div>
                  </div>
                </div>

                {/* Live stats */}
                {expanded === campaign.id && submissions[campaign.id] && (
                  <div className="cpv-live-stats">
                    <div className="cpv-stat">
                      <div className="cpv-stat-num">{formatNum(stats.totalViews)}</div>
                      <div className="cpv-stat-label">Total Views</div>
                    </div>
                    <div className="cpv-stat">
                      <div className="cpv-stat-num">{stats.totalCreators}</div>
                      <div className="cpv-stat-label">Creators</div>
                    </div>
                    <div className="cpv-stat">
                      <div className="cpv-stat-num">₹{formatNum(stats.totalPaid)}</div>
                      <div className="cpv-stat-label">Paid Out</div>
                    </div>
                    <div className="cpv-stat">
                      <div className="cpv-stat-num">{budgetUsed}%</div>
                      <div className="cpv-stat-label">Budget Used</div>
                    </div>
                  </div>
                )}

                <div className="campaign-meta">
                  <div className="meta-item">
                    <span className="meta-label">Milestone</span>
                    <span className="meta-value">Every {formatNum(campaign.milestone_views)} views</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Duration</span>
                    <span className="meta-value">{campaign.duration_days} days</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Platform</span>
                    <span className="meta-value">{campaign.platform}</span>
                  </div>
                </div>

                <div className="campaign-actions">
                  <button className="view-apps-btn" onClick={() => fetchSubmissions(campaign.id)}>
                    {expanded === campaign.id ? 'Hide Submissions' : 'View Submissions'}
                  </button>
                </div>

                {expanded === campaign.id && (
                  <div className="applications-list">
                    {!submissions[campaign.id] || submissions[campaign.id].length === 0 ? (
                      <div className="no-apps">No submissions yet. Creators will join and submit their posts.</div>
                    ) : (
                      submissions[campaign.id].map((sub) => (
                        <div className="application-card" key={sub.id}>
                          <div className="app-top">
                            <div className="app-date">Submitted {formatDate(sub.created_at)}</div>
                            <div style={{
                              color: sub.verified ? '#5DCAA5' : '#FFB347',
                              fontWeight: 500,
                              fontSize: '0.78rem'
                            }}>
                              {sub.verified ? '✅ Verified' : '⏳ Pending Verification'}
                            </div>
                          </div>

                          <div className="campaign-meta" style={{ margin: '0.5rem 0 0.75rem' }}>
                            <div className="meta-item">
                              <span className="meta-label">Platform</span>
                              <span className="meta-value">{sub.platform}</span>
                            </div>
                            <div className="meta-item">
                              <span className="meta-label">Views reported</span>
                              <span className="meta-value" style={{ color: 'var(--vero-accent)', fontWeight: 600 }}>
                                {formatNum(sub.verified ? sub.view_count : sub.manual_views)}
                              </span>
                            </div>
                            <div className="meta-item">
                              <span className="meta-label">Earnings</span>
                              <span className="meta-value">
                                ₹{formatNum(Math.floor((sub.verified ? sub.view_count : sub.manual_views) * campaign.cpv_rate))}
                              </span>
                            </div>
                            {sub.payment_released > 0 && (
                              <div className="meta-item">
                                <span className="meta-label">Released</span>
                                <span className="meta-value" style={{ color: '#5DCAA5' }}>₹{formatNum(sub.payment_released)}</span>
                              </div>
                            )}
                          </div>

                          <a
                            href={sub.post_url}
                            target="_blank"
                            rel="noreferrer"
                            className="submission-link"
                            style={{ display: 'block', marginBottom: '0.75rem' }}
                          >
                            View Post ↗
                          </a>

                          {!sub.verified && sub.manual_views > 0 && (
                            <div className="app-actions">
                              <button
                                className="approve-btn"
                                onClick={() => approveViews(
                                  sub.id,
                                  campaign.id,
                                  sub.manual_views,
                                  campaign.cpv_rate,
                                  campaign.milestone_views
                                )}
                                disabled={approving === sub.id}
                              >
                                {approving === sub.id ? 'Verifying...' : `✅ Verify ${formatNum(sub.manual_views)} Views`}
                              </button>
                            </div>
                          )}

                          {sub.verified && (
                            <div style={{ fontSize: '0.82rem', color: '#5DCAA5', fontWeight: 500 }}>
                              💰 ₹{formatNum(sub.payment_released)} released to creator
                            </div>
                          )}
                        </div>
                      ))
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

export default CPVDashboard;
