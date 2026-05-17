import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function CPVLeaderboard({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [leaderboards, setLeaderboards] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCPVCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCPVCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_type', 'cpv')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchLeaderboard = async (campaignId) => {
    if (leaderboards[campaignId] && expanded === campaignId) { setExpanded(null); return; }

    const { data } = await supabase
      .from('cpv_submissions')
      .select('*, profiles(name)')
      .eq('campaign_id', campaignId)
      .order('view_count', { ascending: false });

    setLeaderboards(prev => ({ ...prev, [campaignId]: data || [] }));
    setExpanded(campaignId);
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (loading) return <div className="campaigns-loading">Loading leaderboard...</div>;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>🏆 CPV Leaderboard</h1>
          <p>Top performing creators across CPV campaigns</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">🏆</div>
          <div className="empty-title">No CPV campaigns yet</div>
          <p className="empty-desc">CPV leaderboards will appear here once campaigns are live.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map((campaign) => (
            <div className="campaign-card" key={campaign.id}>
              <div className="campaign-top">
                <div>
                  <div className="campaign-type-badge cpv" style={{ marginBottom: '0.5rem' }}>📊 CPV</div>
                  <h2 className="campaign-title">{campaign.title}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="campaign-budget">₹{formatNum(campaign.budget)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', marginTop: '2px' }}>₹{campaign.cpv_rate}/view</div>
                </div>
              </div>

              <div className="campaign-meta">
                <div className="meta-item"><span className="meta-label">Milestone</span><span className="meta-value">Every {formatNum(campaign.milestone_views)} views</span></div>
                <div className="meta-item"><span className="meta-label">Duration</span><span className="meta-value">{campaign.duration_days} days</span></div>
                <div className="meta-item"><span className="meta-label">Platform</span><span className="meta-value">{campaign.platform}</span></div>
              </div>

              <button className="view-apps-btn" onClick={() => fetchLeaderboard(campaign.id)}>
                {expanded === campaign.id ? 'Hide Leaderboard' : '🏆 View Leaderboard'}
              </button>

              {expanded === campaign.id && (
                <div className="applications-list">
                  {!leaderboards[campaign.id] || leaderboards[campaign.id].length === 0 ? (
                    <div className="no-apps">No submissions yet. Be the first to join this CPV campaign!</div>
                  ) : (
                    leaderboards[campaign.id].map((sub, index) => {
                      const views = sub.verified ? sub.view_count : sub.manual_views || 0;
                      const earnings = Math.floor(views * campaign.cpv_rate);
                      const isMe = sub.creator_id === user.id;

                      return (
                        <div
                          className="application-card"
                          key={sub.id}
                          style={{ borderColor: isMe ? 'rgba(255,92,53,0.3)' : 'var(--vero-border)', background: isMe ? 'rgba(255,92,53,0.04)' : '' }}
                        >
                          <div className="app-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '1.25rem', minWidth: '28px' }}>{getMedalEmoji(index)}</span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--vero-text)' }}>
                                  {sub.profiles?.name || 'Creator'} {isMe && <span style={{ color: 'var(--vero-accent)', fontSize: '0.75rem' }}>(You)</span>}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)' }}>{sub.platform} · {sub.verified ? '✅ Verified' : '📋 Manual'}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--vero-accent)' }}>
                                {formatNum(views)}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)' }}>views · ₹{formatNum(earnings)}</div>
                            </div>
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

export default CPVLeaderboard;
