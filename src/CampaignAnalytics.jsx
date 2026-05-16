import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function CampaignAnalytics({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    const { data: camps } = await supabase
      .from('campaigns')
      .select('*')
      .eq('brand_id', user.id)
      .order('created_at', { ascending: false });

    if (camps) {
      setCampaigns(camps);
      for (const camp of camps) {
        await fetchCampaignStats(camp);
      }
    }
    setLoading(false);
  };

  const fetchCampaignStats = async (campaign) => {
    const { data: apps } = await supabase
      .from('applications')
      .select('status')
      .eq('campaign_id', campaign.id);

    const { data: cpv } = await supabase
      .from('cpv_submissions')
      .select('view_count, verified, manual_views')
      .eq('campaign_id', campaign.id);

    const { data: payment } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('campaign_id', campaign.id)
      .eq('status', 'paid')
      .single();

    const appStats = {
      total: apps?.length || 0,
      pending: apps?.filter(a => a.status === 'pending').length || 0,
      approved: apps?.filter(a => a.status === 'approved').length || 0,
      submitted: apps?.filter(a => a.status === 'submitted').length || 0,
      completed: apps?.filter(a => a.status === 'completed').length || 0,
      rejected: apps?.filter(a => a.status === 'rejected').length || 0,
    };

    const totalViews = cpv?.reduce((sum, s) => sum + (s.verified ? s.view_count : s.manual_views || 0), 0) || 0;

    setStats(prev => ({
      ...prev,
      [campaign.id]: {
        ...appStats,
        totalViews,
        cpvCreators: cpv?.length || 0,
        escrowFunded: payment?.amount || 0,
      }
    }));
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const MODEL_LABELS = {
    cpv: '📊 CPV',
    participation: '🚀 Participation',
    one_time: '🤝 One Time',
  };

  const totalStats = {
    campaigns: campaigns.length,
    budget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    funded: campaigns.filter(c => c.escrow_status === 'funded').length,
  };

  if (loading) return <div className="campaigns-loading">Loading analytics...</div>;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>📈 Campaign Analytics</h1>
          <p>Track performance across all your campaigns</p>
        </div>
      </div>

      {/* Overall stats */}
      <div style={{ maxWidth: '760px', margin: '2rem auto', padding: '0 2.5rem' }}>
        <div className="cpv-live-stats" style={{ marginBottom: '2rem' }}>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{totalStats.campaigns}</div>
            <div className="cpv-stat-label">Total Campaigns</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">₹{formatNum(totalStats.budget)}</div>
            <div className="cpv-stat-label">Total Budget</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{totalStats.funded}</div>
            <div className="cpv-stat-label">Escrow Funded</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{campaigns.filter(c => c.status === 'open').length}</div>
            <div className="cpv-stat-label">Active</div>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="campaigns-empty">
            <div className="empty-icon">📈</div>
            <div className="empty-title">No campaigns yet</div>
            <p className="empty-desc">Create your first campaign to see analytics here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {campaigns.map((campaign) => {
              const s = stats[campaign.id] || {};
              const conversionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;

              return (
                <div className="campaign-card" key={campaign.id}>
                  <div className="campaign-top">
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <div className={`campaign-type-badge ${campaign.campaign_type}`}>
                          {MODEL_LABELS[campaign.campaign_type] || '🤝 One Time'}
                        </div>
                        <div className={`status-badge ${campaign.status}`}>{campaign.status}</div>
                        {campaign.escrow_status === 'funded' && (
                          <div style={{ fontSize: '0.7rem', color: '#5DCAA5', fontWeight: 500 }}>🔒 Funded</div>
                        )}
                      </div>
                      <h2 className="campaign-title">{campaign.title}</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="campaign-budget">₹{formatNum(campaign.budget)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', marginTop: '2px' }}>{formatDate(campaign.created_at)}</div>
                    </div>
                  </div>

                  {/* Campaign specific stats */}
                  {campaign.campaign_type === 'cpv' ? (
                    <div className="analytics-grid">
                      <div className="analytics-stat">
                        <div className="analytics-num">{s.cpvCreators || 0}</div>
                        <div className="analytics-label">Creators</div>
                      </div>
                      <div className="analytics-stat">
                        <div className="analytics-num">{formatNum(s.totalViews)}</div>
                        <div className="analytics-label">Total Views</div>
                      </div>
                      <div className="analytics-stat">
                        <div className="analytics-num">₹{formatNum(Math.floor((s.totalViews || 0) * (campaign.cpv_rate || 0)))}</div>
                        <div className="analytics-label">Cost So Far</div>
                      </div>
                      <div className="analytics-stat">
                        <div className="analytics-num">₹{formatNum(campaign.budget - Math.floor((s.totalViews || 0) * (campaign.cpv_rate || 0)))}</div>
                        <div className="analytics-label">Budget Left</div>
                      </div>
                    </div>
                  ) : (
                    <div className="analytics-grid">
                      <div className="analytics-stat">
                        <div className="analytics-num">{s.total || 0}</div>
                        <div className="analytics-label">Applied</div>
                      </div>
                      <div className="analytics-stat">
                        <div className="analytics-num">{s.approved || 0}</div>
                        <div className="analytics-label">Approved</div>
                      </div>
                      <div className="analytics-stat">
                        <div className="analytics-num">{s.submitted || 0}</div>
                        <div className="analytics-label">Submitted</div>
                      </div>
                      <div className="analytics-stat">
                        <div className="analytics-num">{s.completed || 0}</div>
                        <div className="analytics-label">Completed</div>
                      </div>
                    </div>
                  )}

                  {campaign.campaign_type !== 'cpv' && s.total > 0 && (
                    <div className="analytics-bar-wrap">
                      <div className="analytics-bar-label">
                        <span>Completion rate</span>
                        <span>{conversionRate}%</span>
                      </div>
                      <div className="analytics-bar">
                        <div className="analytics-bar-fill" style={{ width: `${conversionRate}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignAnalytics;
