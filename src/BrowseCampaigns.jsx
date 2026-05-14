import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function BrowseCampaigns({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [message, setMessage] = useState('');
  const [applied, setApplied] = useState([]);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCampaigns();
    fetchMyApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchMyApplications = async () => {
    const { data } = await supabase
      .from('applications')
      .select('campaign_id')
      .eq('creator_id', user.id);
    setApplied((data || []).map((a) => a.campaign_id));
  };

  const handleApply = async (campaignId) => {
    if (!message.trim()) return;
    setApplying(campaignId);

    const { error } = await supabase.from('applications').insert({
      campaign_id: campaignId,
      creator_id: user.id,
      message: message,
      status: 'pending',
    });

    if (!error) {
      setApplied((prev) => [...prev, campaignId]);
      setSuccess('Application sent successfully!');
      setMessage('');
      setTimeout(() => setSuccess(''), 3000);
    }
    setApplying(null);
  };

  const formatBudget = (amount) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>Browse Campaigns</h1>
          <p>Find brand deals that match your content and audience</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      {loading ? (
        <div className="campaigns-loading">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No campaigns yet</div>
          <p className="empty-desc">Brands are joining VeroLinkr. Check back soon — campaigns will appear here.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map((campaign) => {
            const hasApplied = applied.includes(campaign.id);
            const isApplying = applying === campaign.id;

            return (
              <div className="campaign-card" key={campaign.id}>
                <div className="campaign-top">
                  <div>
                    <div className="campaign-niche">{campaign.niche}</div>
                    <h2 className="campaign-title">{campaign.title}</h2>
                  </div>
                  <div className="campaign-budget">{formatBudget(campaign.budget)}</div>
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

                {!hasApplied ? (
                  <div className="apply-section">
                    <textarea
                      className="apply-message"
                      placeholder="Tell the brand why you are the right creator for this campaign..."
                      rows={3}
                      value={isApplying || applying === null ? message : ''}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                      className="apply-btn"
                      onClick={() => handleApply(campaign.id)}
                      disabled={isApplying || !message.trim()}
                    >
                      {isApplying ? 'Applying...' : 'Apply for this Campaign →'}
                    </button>
                  </div>
                ) : (
                  <div className="applied-badge">✅ Applied — waiting for brand response</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BrowseCampaigns;
