import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const MODEL_LABELS = {
  cpv: { label: 'CPV', color: 'cpv', icon: '📊' },
  participation: { label: 'Participation', color: 'participation', icon: '🚀' },
  one_time: { label: 'One Time', color: 'one_time', icon: '🤝' },
};

const NICHES = ['All', 'Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Education', 'Gaming', 'Lifestyle', 'Other'];

function BrowseCampaigns({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [messages, setMessages] = useState({});
  const [applied, setApplied] = useState([]);
  const [success, setSuccess] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [nicheFilter, setNicheFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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
    const { data } = await supabase.from('applications').select('campaign_id').eq('creator_id', user.id);
    setApplied((data || []).map((a) => a.campaign_id));
  };

  const handleApply = async (campaignId) => {
    const msg = messages[campaignId] || '';
    if (!msg.trim()) return;
    setApplying(campaignId);

    const { error } = await supabase.from('applications').insert({
      campaign_id: campaignId,
      creator_id: user.id,
      message: msg,
      status: 'pending',
    });

    if (!error) {
      // Notify brand
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign?.brand_id) {
        await supabase.from('notifications').insert({
          user_id: campaign.brand_id,
          title: '📋 New Application Received',
          message: `A creator has applied to your campaign "${campaign.title}". Review their application now.`,
          type: 'application',
          read: false,
        });
      }
      setApplied((prev) => [...prev, campaignId]);
      setMessages((prev) => ({ ...prev, [campaignId]: '' }));
      setSuccess('Application sent! Brand will review and respond.');
      setTimeout(() => setSuccess(''), 4000);
    }
    setApplying(null);
  };

  const formatBudget = (amount) => '₹' + Number(amount).toLocaleString('en-IN');
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';

  // Filter and search
  let filtered = campaigns;
  if (typeFilter !== 'all') filtered = filtered.filter(c => c.campaign_type === typeFilter);
  if (nicheFilter !== 'All') filtered = filtered.filter(c => c.niche === nicheFilter);
  if (search.trim()) filtered = filtered.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );
  if (sortBy === 'budget_high') filtered = [...filtered].sort((a, b) => b.budget - a.budget);
  if (sortBy === 'budget_low') filtered = [...filtered].sort((a, b) => a.budget - b.budget);
  if (sortBy === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>Browse Campaigns</h1>
          <p>{filtered.length} campaigns available</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      {/* Search bar */}
      <div className="search-bar-wrap">
        <input
          type="text"
          className="search-input"
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="budget_high">Highest Budget</option>
          <option value="budget_low">Lowest Budget</option>
        </select>
      </div>

      {/* Type filter */}
      <div className="filter-bar">
        {['all', 'cpv', 'participation', 'one_time'].map((f) => (
          <button key={f} className={`filter-btn ${typeFilter === f ? 'active' : ''}`} onClick={() => setTypeFilter(f)}>
            {f === 'all' ? 'All Types' : MODEL_LABELS[f]?.icon + ' ' + MODEL_LABELS[f]?.label}
          </button>
        ))}
      </div>

      {/* Niche filter */}
      <div className="filter-bar" style={{ paddingTop: '0.5rem' }}>
        {NICHES.map((n) => (
          <button key={n} className={`filter-btn ${nicheFilter === n ? 'active' : ''}`} onClick={() => setNicheFilter(n)}>
            {n}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="campaigns-loading">Loading campaigns...</div>
      ) : filtered.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">{search ? 'No results found' : 'No campaigns yet'}</div>
          <p className="empty-desc">{search ? 'Try a different search term or filter.' : 'Brands are joining VeroLinkr. Check back soon.'}</p>
          {search && <button className="filter-btn" style={{ marginTop: '1rem' }} onClick={() => setSearch('')}>Clear Search</button>}
        </div>
      ) : (
        <div className="campaigns-list">
          {filtered.map((campaign) => {
            const hasApplied = applied.includes(campaign.id);
            const isApplying = applying === campaign.id;
            const model = MODEL_LABELS[campaign.campaign_type] || MODEL_LABELS['one_time'];

            return (
              <div className="campaign-card" key={campaign.id}>
                <div className="campaign-top">
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div className={`campaign-type-badge ${campaign.campaign_type}`}>{model.icon} {model.label}</div>
                      <div className="campaign-niche">{campaign.niche}</div>
                      {campaign.platform && <div className="campaign-niche">{campaign.platform}</div>}
                    </div>
                    <h2 className="campaign-title">{campaign.title}</h2>
                  </div>
                  <div className="campaign-budget">{formatBudget(campaign.budget)}</div>
                </div>

                <p className="campaign-desc">{campaign.description}</p>

                <div className="campaign-meta">
                  <div className="meta-item"><span className="meta-label">Deliverables</span><span className="meta-value">{campaign.deliverables}</span></div>
                  {campaign.campaign_type === 'cpv' && (
                    <>
                      <div className="meta-item"><span className="meta-label">Rate/View</span><span className="meta-value">₹{campaign.cpv_rate}</span></div>
                      <div className="meta-item"><span className="meta-label">Milestone</span><span className="meta-value">Every {Number(campaign.milestone_views).toLocaleString()} views</span></div>
                      <div className="meta-item"><span className="meta-label">Duration</span><span className="meta-value">{campaign.duration_days} days</span></div>
                    </>
                  )}
                  {campaign.campaign_type === 'participation' && (
                    <>
                      <div className="meta-item"><span className="meta-label">Your Payout</span><span className="meta-value" style={{ color: 'var(--vero-accent)', fontWeight: 600 }}>₹{Number(campaign.payout_per_post).toLocaleString()}</span></div>
                      <div className="meta-item"><span className="meta-label">Slots</span><span className="meta-value">{campaign.max_creators} creators</span></div>
                    </>
                  )}
                  {campaign.campaign_type === 'one_time' && (
                    <>
                      <div className="meta-item"><span className="meta-label">Creators Needed</span><span className="meta-value">{campaign.max_creators}</span></div>
                      {campaign.content_only && <div className="meta-item"><span className="meta-label">Type</span><span className="meta-value">Content for Ads</span></div>}
                    </>
                  )}
                  <div className="meta-item"><span className="meta-label">Deadline</span><span className="meta-value">{formatDate(campaign.deadline)}</span></div>
                </div>

                {campaign.campaign_type === 'cpv' ? (
                  <div className="cpv-join-info">⚡ CPV campaigns are open to all verified creators. Connect your social accounts to join automatically once verification launches.</div>
                ) : !hasApplied ? (
                  <div className="apply-section">
                    <textarea
                      className="apply-message"
                      placeholder="Tell the brand why you are the right creator for this campaign..."
                      rows={3}
                      value={messages[campaign.id] || ''}
                      onChange={(e) => setMessages((prev) => ({ ...prev, [campaign.id]: e.target.value }))}
                    />
                    <button
                      className="apply-btn"
                      onClick={() => handleApply(campaign.id)}
                      disabled={isApplying || !(messages[campaign.id] || '').trim()}
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
