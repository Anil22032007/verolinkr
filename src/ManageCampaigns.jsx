import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Payment from './Payment';
import './Forms.css';

async function notify(userId, title, message, type = 'info') {
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, read: false });
}

function ManageCampaigns({ user, onBack, onCreateNew }) {
  const [campaigns, setCampaigns] = useState([]);
  const [joins, setJoins] = useState({});
  const [applications, setApplications] = useState({});
  const [creatorProfiles, setCreatorProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [payingCampaign, setPayingCampaign] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [releasingPayment, setReleasingPayment] = useState(null);

  useEffect(() => {
    fetchMyCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('brand_id', user.id)
      .order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchParticipants = async (campaign) => {
    if (expanded === campaign.id) { setExpanded(null); return; }

    if (campaign.campaign_type === 'cpv' || campaign.campaign_type === 'participation') {
      // Fetch joins for CPV and Participation
      const { data } = await supabase
        .from('campaign_joins')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });
      setJoins(prev => ({ ...prev, [campaign.id]: data || [] }));
    } else {
      // Fetch applications for One Time
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });
      setApplications(prev => ({ ...prev, [campaign.id]: data || [] }));

      // Fetch creator profiles
      if (data && data.length > 0) {
        const ids = data.map(a => a.creator_id);
        const { data: profiles } = await supabase
          .from('creator_profiles')
          .select('*, profiles(name)')
          .in('id', ids);
        if (profiles) {
          const map = {};
          profiles.forEach(p => { map[p.id] = p; });
          setCreatorProfiles(prev => ({ ...prev, ...map }));
        }
      }
    }
    setExpanded(campaign.id);
  };

  // One Time only — approve/reject applications
  const updateApplicationStatus = async (appId, campaignId, status) => {
    await supabase.from('applications').update({ status }).eq('id', appId);
    const app = applications[campaignId]?.find(a => a.id === appId);
    const campaign = campaigns.find(c => c.id === campaignId);
    if (app && campaign) {
      if (status === 'approved') await notify(app.creator_id, '🎉 Application Approved!', `Your application for "${campaign.title}" has been approved. Create your content and submit.`, 'approved');
      else if (status === 'rejected') await notify(app.creator_id, 'Application Not Selected', `Your application for "${campaign.title}" was not selected. You can update your pitch and reapply.`, 'rejected');
      else if (status === 'completed') await notify(app.creator_id, '💰 Payment Released!', `Your payment for "${campaign.title}" has been released to your wallet.`, 'payment');
    }
    setApplications(prev => ({ ...prev, [campaignId]: prev[campaignId].map(a => a.id === appId ? { ...a, status } : a) }));
  };

  // Participation — release payment to creator after 48hr (manual override)
  const releaseParticipationPayment = async (joinId, campaignId, creatorId, campaignTitle, amount) => {
    setReleasingPayment(joinId);
    await supabase.from('campaign_joins').update({ status: 'paid', payment_released: true, payment_amount: amount }).eq('id', joinId);
    await notify(creatorId, '💰 Payment Released!', `Your payment of ₹${Number(amount).toLocaleString('en-IN')} for "${campaignTitle}" has been released to your wallet.`, 'payment');
    setJoins(prev => ({ ...prev, [campaignId]: prev[campaignId].map(j => j.id === joinId ? { ...j, status: 'paid', payment_released: true } : j) }));
    setReleasingPayment(null);
  };

  const closeCampaign = async (campaignId) => {
    await supabase.from('campaigns').update({ status: 'closed' }).eq('id', campaignId);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'closed' } : c));
  };

  const copyShareLink = (campaign) => {
    const link = `${window.location.origin}?campaign=${campaign.share_token || campaign.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(campaign.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBudget = (amount) => '₹' + Number(amount).toLocaleString('en-IN');
  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';

  const MODEL_LABELS = { cpv: '📊 CPV', participation: '🚀 Participation', one_time: '🤝 One Time' };

  const getAppStatusLabel = (status) => ({
    pending: { text: 'Pending', color: '#FFB347' },
    approved: { text: 'Approved', color: '#5DCAA5' },
    submitted: { text: 'Content Submitted', color: '#8ab4f8' },
    rejected: { text: 'Not Selected', color: '#F09595' },
    completed: { text: 'Completed', color: '#5DCAA5' },
  }[status] || { text: status, color: 'var(--vero-muted)' });

  if (payingCampaign) {
    return <Payment campaign={payingCampaign} user={user} onBack={() => setPayingCampaign(null)} onSuccess={() => {
      setCampaigns(prev => prev.map(c => c.id === payingCampaign.id ? { ...c, escrow_status: 'funded' } : c));
      setPayingCampaign(null);
    }} />;
  }

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>My Campaigns</h1>
          <p>Manage all your campaigns across all 4 models</p>
        </div>
        <button className="form-submit" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={onCreateNew}>+ New Campaign</button>
      </div>

      {loading ? (
        <div className="campaigns-loading">Loading your campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No campaigns yet</div>
          <p className="empty-desc">Create your first campaign to start working with creators.</p>
          <button className="form-submit" style={{ marginTop: '1.5rem' }} onClick={onCreateNew}>Create First Campaign →</button>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map(campaign => {
            const isCPV = campaign.campaign_type === 'cpv';
            const isParticipation = campaign.campaign_type === 'participation';
            const isOneTime = campaign.campaign_type === 'one_time';
            const campaignJoins = joins[campaign.id] || [];
            const campaignApps = applications[campaign.id] || [];
            const joinedCount = campaignJoins.length;
            const submittedCount = campaignJoins.filter(j => j.status === 'submitted' || j.status === 'paid').length;
            const paidCount = campaignJoins.filter(j => j.status === 'paid').length;

            return (
              <div className="campaign-card" key={campaign.id}>
                <div className="campaign-top">
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div className={`campaign-type-badge ${campaign.campaign_type}`}>{MODEL_LABELS[campaign.campaign_type] || '🤝 One Time'}</div>
                      <div className="campaign-niche">{campaign.niche}</div>
                      <div className={`status-badge ${campaign.status}`}>{campaign.status}</div>
                    </div>
                    <h2 className="campaign-title">{campaign.title}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="campaign-budget">{formatBudget(campaign.budget)}</div>
                    <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                      {campaign.escrow_status === 'funded'
                        ? <span style={{ color: '#5DCAA5' }}>🔒 Escrow Funded</span>
                        : <span style={{ color: '#FFB347' }}>⚠ Not Funded</span>}
                    </div>
                  </div>
                </div>

                <p className="campaign-desc">{campaign.description}</p>

                <div className="campaign-meta">
                  <div className="meta-item"><span className="meta-label">Deliverables</span><span className="meta-value">{campaign.deliverables}</span></div>
                  <div className="meta-item"><span className="meta-label">Deadline</span><span className="meta-value">{formatDate(campaign.deadline)}</span></div>
                  {isCPV && <div className="meta-item"><span className="meta-label">Rate</span><span className="meta-value">₹{campaign.cpv_rate}/view</span></div>}
                  {isParticipation && <div className="meta-item"><span className="meta-label">Payout/Creator</span><span className="meta-value">₹{formatNum(campaign.payout_per_post)}</span></div>}
                </div>

                {/* Live stats for CPV and Participation */}
                {(isCPV || isParticipation) && expanded === campaign.id && (
                  <div className="cpv-live-stats" style={{ marginBottom: '1rem' }}>
                    <div className="cpv-stat"><div className="cpv-stat-num">{joinedCount}</div><div className="cpv-stat-label">Joined</div></div>
                    <div className="cpv-stat"><div className="cpv-stat-num">{submittedCount}</div><div className="cpv-stat-label">Submitted</div></div>
                    <div className="cpv-stat"><div className="cpv-stat-num">{paidCount}</div><div className="cpv-stat-label">Paid</div></div>
                    <div className="cpv-stat">
                      <div className="cpv-stat-num">₹{formatNum(paidCount * (campaign.payout_per_post || 0))}</div>
                      <div className="cpv-stat-label">Released</div>
                    </div>
                  </div>
                )}

                <div className="campaign-actions">
                  {campaign.escrow_status !== 'funded' && campaign.status === 'open' && (
                    <button className="fund-escrow-btn" onClick={() => setPayingCampaign(campaign)}>🔒 Fund Escrow</button>
                  )}
                  <button className="view-apps-btn" onClick={() => fetchParticipants(campaign)}>
                    {expanded === campaign.id ? 'Hide' : (isCPV || isParticipation) ? 'View Participants' : 'View Applications'}
                  </button>
                  <button className="view-apps-btn" onClick={() => copyShareLink(campaign)}>
                    {copiedId === campaign.id ? '✅ Copied!' : '🔗 Share Link'}
                  </button>
                  {campaign.status === 'open' && (
                    <button className="close-campaign-btn" onClick={() => closeCampaign(campaign.id)}>Close</button>
                  )}
                </div>

                {expanded === campaign.id && (
                  <div className="applications-list">

                    {/* CPV and Participation — show joins */}
                    {(isCPV || isParticipation) && (
                      campaignJoins.length === 0 ? (
                        <div className="no-apps">No creators have joined yet. Share your campaign link to attract creators.</div>
                      ) : (
                        campaignJoins.map(join => (
                          <div className="application-card" key={join.id}>
                            <div className="app-top">
                              <div className="app-date">Joined {formatDate(join.created_at)}</div>
                              <div style={{ color: join.status === 'paid' ? '#5DCAA5' : join.status === 'submitted' ? '#8ab4f8' : '#FFB347', fontWeight: 500, fontSize: '0.78rem' }}>
                                ● {join.status === 'joined' ? 'Creating content' : join.status === 'submitted' ? 'Post submitted' : 'Paid'}
                              </div>
                            </div>

                            {join.post_url && (
                              <div style={{ margin: '0.5rem 0' }}>
                                <a href={join.post_url} target="_blank" rel="noreferrer" className="submission-link">{join.post_url} ↗</a>
                                {join.post_note && <p style={{ fontSize: '0.82rem', color: 'var(--vero-muted)', marginTop: '0.25rem', fontWeight: 300 }}>{join.post_note}</p>}
                              </div>
                            )}

                            {/* Participation — release payment button */}
                            {isParticipation && join.status === 'submitted' && (
                              <div className="app-actions">
                                <button
                                  className="approve-btn"
                                  disabled={releasingPayment === join.id}
                                  onClick={() => releaseParticipationPayment(join.id, campaign.id, join.creator_id, campaign.title, campaign.payout_per_post)}
                                >
                                  {releasingPayment === join.id ? 'Releasing...' : `💰 Release ₹${formatNum(campaign.payout_per_post)}`}
                                </button>
                              </div>
                            )}

                            {join.status === 'paid' && (
                              <div style={{ fontSize: '0.82rem', color: '#5DCAA5', fontWeight: 500 }}>
                                💰 ₹{formatNum(campaign.payout_per_post)} released
                              </div>
                            )}
                          </div>
                        ))
                      )
                    )}

                    {/* One Time — show applications with creator profiles */}
                    {isOneTime && (
                      campaignApps.length === 0 ? (
                        <div className="no-apps">No applications yet. Share your campaign link to attract creators.</div>
                      ) : (
                        campaignApps.map(app => {
                          const sl = getAppStatusLabel(app.status);
                          const cp = creatorProfiles[app.creator_id];
                          return (
                            <div className="application-card" key={app.id}>
                              <div className="app-top">
                                <div className="app-date">Applied {formatDate(app.created_at)}</div>
                                <div style={{ color: sl.color, fontWeight: 500, fontSize: '0.78rem' }}>● {sl.text}</div>
                              </div>

                              {cp && (
                                <div className="creator-profile-snapshot">
                                  <div className="snapshot-name">{cp.profiles?.name || 'Creator'}</div>
                                  <div className="snapshot-stats">
                                    {cp.instagram_handle && <div className="snapshot-stat"><span>📸</span>{cp.instagram_handle} · {formatNum(cp.instagram_followers)} followers</div>}
                                    {cp.youtube_handle && <div className="snapshot-stat"><span>▶️</span>{cp.youtube_handle} · {formatNum(cp.youtube_subscribers)} subscribers</div>}
                                    {cp.engagement_rate > 0 && <div className="snapshot-stat"><span>📊</span>Engagement: <strong style={{ color: cp.engagement_rate >= 5 ? '#5DCAA5' : '#FFB347' }}>{cp.engagement_rate}%</strong></div>}
                                    {cp.niche && <div className="snapshot-stat"><span>🎯</span>{cp.niche}</div>}
                                    {cp.past_brands && <div className="snapshot-stat"><span>🤝</span>{cp.past_brands}</div>}
                                  </div>
                                </div>
                              )}

                              <p className="app-message">{app.reapply_message || app.message}</p>

                              {app.submission_url && (
                                <div className="submitted-content" style={{ marginBottom: '0.75rem' }}>
                                  <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Content submitted</div>
                                  <a href={app.submission_url} target="_blank" rel="noreferrer" className="submission-link">{app.submission_url} ↗</a>
                                </div>
                              )}

                              <div className="app-actions">
                                {app.status === 'pending' && (
                                  <>
                                    <button className="approve-btn" onClick={() => updateApplicationStatus(app.id, campaign.id, 'approved')}>✅ Select Creator</button>
                                    <button className="reject-btn" onClick={() => updateApplicationStatus(app.id, campaign.id, 'rejected')}>✕ Not Selected</button>
                                  </>
                                )}
                                {app.status === 'submitted' && (
                                  <>
                                    <button className="approve-btn" onClick={() => updateApplicationStatus(app.id, campaign.id, 'completed')}>✅ Approve & Release Payment</button>
                                    <button className="reject-btn" onClick={() => updateApplicationStatus(app.id, campaign.id, 'approved')}>↩ Request Changes</button>
                                  </>
                                )}
                                {app.status === 'completed' && <div style={{ fontSize: '0.85rem', color: '#5DCAA5', fontWeight: 500 }}>💰 Payment released</div>}
                              </div>
                            </div>
                          );
                        })
                      )
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

export default ManageCampaigns;
