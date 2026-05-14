import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function ManageCampaigns({ user, onBack, onCreateNew }) {
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchMyCampaigns();
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

  const fetchApplications = async (campaignId) => {
    if (applications[campaignId]) {
      setExpanded(expanded === campaignId ? null : campaignId);
      return;
    }

    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    setApplications((prev) => ({ ...prev, [campaignId]: data || [] }));
    setExpanded(campaignId);
  };

  const updateApplicationStatus = async (appId, campaignId, status) => {
    await supabase.from('applications').update({ status }).eq('id', appId);
    setApplications((prev) => ({
      ...prev,
      [campaignId]: prev[campaignId].map((a) =>
        a.id === appId ? { ...a, status } : a
      ),
    }));
  };

  const closeCampaign = async (campaignId) => {
    await supabase.from('campaigns').update({ status: 'closed' }).eq('id', campaignId);
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'closed' } : c))
    );
  };

  const formatBudget = (amount) => '₹' + amount.toLocaleString('en-IN');
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>My Campaigns</h1>
          <p>Manage your campaigns and review creator applications</p>
        </div>
        <button className="form-submit" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={onCreateNew}>
          + New Campaign
        </button>
      </div>

      {loading ? (
        <div className="campaigns-loading">Loading your campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No campaigns yet</div>
          <p className="empty-desc">Create your first campaign and start receiving applications from verified creators.</p>
          <button className="form-submit" style={{ marginTop: '1.5rem' }} onClick={onCreateNew}>
            Create First Campaign →
          </button>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map((campaign) => (
            <div className="campaign-card" key={campaign.id}>
              <div className="campaign-top">
                <div>
                  <div className="campaign-niche">{campaign.niche}</div>
                  <h2 className="campaign-title">{campaign.title}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div className="campaign-budget">{formatBudget(campaign.budget)}</div>
                  <div className={`status-badge ${campaign.status}`}>{campaign.status}</div>
                </div>
              </div>

              <p className="campaign-desc">{campaign.description}</p>

              <div className="campaign-meta">
                <div className="meta-item">
                  <span className="meta-label">Deliverables</span>
                  <span className="meta-value">{campaign.deliverables}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Deadline</span>
                  <span className="meta-value">{formatDate(campaign.deadline)}</span>
                </div>
              </div>

              <div className="campaign-actions">
                <button
                  className="view-apps-btn"
                  onClick={() => fetchApplications(campaign.id)}
                >
                  {expanded === campaign.id ? 'Hide Applications' : 'View Applications'}
                </button>
                {campaign.status === 'open' && (
                  <button
                    className="close-campaign-btn"
                    onClick={() => closeCampaign(campaign.id)}
                  >
                    Close Campaign
                  </button>
                )}
              </div>

              {expanded === campaign.id && (
                <div className="applications-list">
                  {!applications[campaign.id] || applications[campaign.id].length === 0 ? (
                    <div className="no-apps">No applications yet. Share your campaign to attract creators.</div>
                  ) : (
                    applications[campaign.id].map((app) => (
                      <div className="application-card" key={app.id}>
                        <div className="app-top">
                          <div className="app-date">Applied {formatDate(app.created_at)}</div>
                          <div className={`app-status ${app.status}`}>{app.status}</div>
                        </div>
                        <p className="app-message">{app.message}</p>
                        {app.status === 'pending' && (
                          <div className="app-actions">
                            <button
                              className="approve-btn"
                              onClick={() => updateApplicationStatus(app.id, campaign.id, 'approved')}
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => updateApplicationStatus(app.id, campaign.id, 'rejected')}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
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
