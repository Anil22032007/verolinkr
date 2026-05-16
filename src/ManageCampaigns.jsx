import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Payment from './Payment';
import './Forms.css';

async function notify(userId, title, message, type = 'info') {
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, read: false });
}

function ManageCampaigns({ user, onBack, onCreateNew }) {
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [payingCampaign, setPayingCampaign] = useState(null);

  useEffect(() => {
    fetchMyCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyCampaigns = async () => {
    const { data } = await supabase.from('campaigns').select('*').eq('brand_id', user.id).order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchApplications = async (campaignId) => {
    if (applications[campaignId] && expanded === campaignId) { setExpanded(null); return; }
    const { data } = await supabase.from('applications').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false });
    setApplications((prev) => ({ ...prev, [campaignId]: data || [] }));
    setExpanded(campaignId);
  };

  const updateStatus = async (appId, campaignId, status) => {
    await supabase.from('applications').update({ status }).eq('id', appId);
    const app = applications[campaignId]?.find(a => a.id === appId);
    const campaign = campaigns.find(c => c.id === campaignId);

    if (app && campaign) {
      if (status === 'approved') {
        await notify(app.creator_id, '🎉 Application Approved!', `Your application for "${campaign.title}" has been approved. Submit your content now to get paid.`, 'approved');
      } else if (status === 'rejected') {
        await notify(app.creator_id, 'Application Not Selected', `Your application for "${campaign.title}" was not selected this time. Keep applying!`, 'rejected');
      } else if (status === 'completed') {
        await notify(app.creator_id, '💰 Payment Released!', `Your payment for "${campaign.title}" has been released to your wallet. Check your earnings.`, 'payment');
      }
    }

    setApplications((prev) => ({
      ...prev,
      [campaignId]: prev[campaignId].map((a) => a.id === appId ? { ...a, status } : a),
    }));
  };

  const closeCampaign = async (campaignId) => {
    await supabase.from('campaigns').update({ status: 'closed' }).eq('id', campaignId);
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, status: 'closed' } : c));
  };

  const formatBudget = (amount) => '₹' + Number(amount).toLocaleString('en-IN');
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';

  const MODEL_LABELS = { cpv: '📊 CPV', participation: '🚀 Participation', one_time: '🤝 One Time' };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: 'Pending', color: '#FFB347' },
      approved: { text: 'Approved', color: '#5DCAA5' },
      submitted: { text: 'Content Submitted', color: '#8ab4f8' },
      rejected: { text: 'Rejected', color: '#F09595' },
      completed: { text: 'Completed', color: '#5DCAA5' },
    };
    return labels[status] || { text: status, color: 'var(--vero-muted)' };
  };

  if (payingCampaign) {
    return (
      <Payment
        campaign={payingCampaign}
        user={user}
        onBack={() => setPayingCampaign(null)}
        onSuccess={() => {
          setCampaigns((prev) => prev.map((c) => c.id === payingCampaign.id ? { ...c, escrow_status: 'funded' } : c));
          setPayingCampaign(null);
        }}
      />
    );
  }

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>My Campaigns</h1>
          <p>Manage campaigns, fund escrow, review submissions</p>
        </div>
        <button className="form-submit" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={onCreateNew}>+ New Campaign</button>
      </div>

      {loading ? (
        <div className="campaigns-loading">Loading your campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No campaigns yet</div>
          <p className="empty-desc">Create your first campaign and start receiving creator applications.</p>
          <button className="form-submit" style={{ marginTop: '1.5rem' }} onClick={onCreateNew}>Create First Campaign →</button>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map((campaign) => (
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
                    {campaign.escrow_status === 'funded' ? <span style={{ color: '#5DCAA5' }}>🔒 Escrow Funded</span> : <span style={{ color: '#FFB347' }}>⚠ Not Funded</span>}
                  </div>
                </div>
              </div>

              <p className="campaign-desc">{campaign.description}</p>

              <div className="campaign-meta">
                <div className="meta-item"><span className="meta-label">Deliverables</span><span className="meta-value">{campaign.deliverables}</span></div>
                <div className="meta-item"><span className="meta-label">Deadline</span><span className="meta-value">{formatDate(campaign.deadline)}</span></div>
                {campaign.campaign_type === 'cpv' && campaign.cpv_rate && <div className="meta-item"><span className="meta-label">Rate</span><span className="meta-value">₹{campaign.cpv_rate}/view</span></div>}
                {campaign.campaign_type === 'participation' && campaign.payout_per_post && <div className="meta-item"><span className="meta-label">Payout/Creator</span><span className="meta-value">₹{Number(campaign.payout_per_post).toLocaleString()}</span></div>}
              </div>

              <div className="campaign-actions">
                {campaign.escrow_status !== 'funded' && campaign.status === 'open' && (
                  <button className="fund-escrow-btn" onClick={() => setPayingCampaign(campaign)}>🔒 Fund Escrow</button>
                )}
                <button className="view-apps-btn" onClick={() => fetchApplications(campaign.id)}>
                  {expanded === campaign.id ? 'Hide Applications' : 'View Applications'}
                </button>
                {campaign.status === 'open' && <button className="close-campaign-btn" onClick={() => closeCampaign(campaign.id)}>Close Campaign</button>}
              </div>

              {expanded === campaign.id && (
                <div className="applications-list">
                  {!applications[campaign.id] || applications[campaign.id].length === 0 ? (
                    <div className="no-apps">No applications yet. Share your campaign to attract creators.</div>
                  ) : (
                    applications[campaign.id].map((app) => {
                      const sl = getStatusLabel(app.status);
                      return (
                        <div className="application-card" key={app.id}>
                          <div className="app-top">
                            <div className="app-date">Applied {formatDate(app.created_at)}</div>
                            <div style={{ color: sl.color, fontWeight: 500, fontSize: '0.78rem' }}>● {sl.text}</div>
                          </div>
                          <p className="app-message">{app.message}</p>
                          {app.submission_url && (
                            <div className="submitted-content" style={{ marginBottom: '0.75rem' }}>
                              <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Content submitted</div>
                              <a href={app.submission_url} target="_blank" rel="noreferrer" className="submission-link">{app.submission_url} ↗</a>
                              {app.submission_note && <p style={{ fontSize: '0.82rem', color: 'var(--vero-muted)', marginTop: '0.35rem', fontWeight: 300 }}>{app.submission_note}</p>}
                            </div>
                          )}
                          <div className="app-actions">
                            {app.status === 'pending' && (
                              <>
                                <button className="approve-btn" onClick={() => updateStatus(app.id, campaign.id, 'approved')}>✅ Approve Creator</button>
                                <button className="reject-btn" onClick={() => updateStatus(app.id, campaign.id, 'rejected')}>✕ Reject</button>
                              </>
                            )}
                            {app.status === 'submitted' && (
                              <>
                                <button className="approve-btn" onClick={() => updateStatus(app.id, campaign.id, 'completed')}>✅ Approve & Release Payment</button>
                                <button className="reject-btn" onClick={() => updateStatus(app.id, campaign.id, 'approved')}>↩ Request Changes</button>
                              </>
                            )}
                            {app.status === 'completed' && <div style={{ fontSize: '0.85rem', color: '#5DCAA5', fontWeight: 500 }}>💰 Payment released to creator</div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageCampaigns;
