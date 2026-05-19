import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const NICHES = ['All', 'Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Education', 'Gaming', 'Lifestyle', 'Other'];

function BrowseCampaigns({ user, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [applying, setApplying] = useState(null);
  const [messages, setMessages] = useState({});
  const [joined, setJoined] = useState([]);
  const [applied, setApplied] = useState([]);
  const [success, setSuccess] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [nicheFilter, setNicheFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchCampaigns();
    fetchMyJoins();
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

  const fetchMyJoins = async () => {
    const { data } = await supabase
      .from('campaign_joins')
      .select('campaign_id')
      .eq('creator_id', user.id);
    setJoined((data || []).map(j => j.campaign_id));
  };

  const fetchMyApplications = async () => {
    const { data } = await supabase
      .from('applications')
      .select('campaign_id')
      .eq('creator_id', user.id);
    setApplied((data || []).map(a => a.campaign_id));
  };

  // INSTANT JOIN for CPV and Participation — no brand approval needed
  const handleJoin = async (campaign) => {
    setJoining(campaign.id);

    const { error } = await supabase.from('campaign_joins').insert({
      campaign_id: campaign.id,
      creator_id: user.id,
      status: 'joined',
    });

    if (!error) {
      setJoined(prev => [...prev, campaign.id]);
      setSuccess(`You joined "${campaign.title}"! Create your content and submit the post link to get paid.`);
      setTimeout(() => setSuccess(''), 5000);

      // Notify brand
      await supabase.from('notifications').insert({
        user_id: campaign.brand_id,
        title: '🚀 New Creator Joined',
        message: `A creator has joined your ${campaign.campaign_type === 'cpv' ? 'CPV' : 'Participation'} campaign "${campaign.title}".`,
        type: 'application',
        read: false,
      });
    }
    setJoining(null);
  };

  // APPLY for One Time campaigns — brand selects
  const handleApply = async (campaign) => {
    const msg = messages[campaign.id] || '';
    if (!msg.trim()) return;
    setApplying(campaign.id);

    const { error } = await supabase.from('applications').insert({
      campaign_id: campaign.id,
      creator_id: user.id,
      message: msg,
      status: 'pending',
    });

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: campaign.brand_id,
        title: '📋 New Application Received',
        message: `A creator has applied to your campaign "${campaign.title}". Review their application now.`,
        type: 'application',
        read: false,
      });
      setApplied(prev => [...prev, campaign.id]);
      setMessages(prev => ({ ...prev, [campaign.id]: '' }));
      setSuccess('Application sent! Brand will review and respond.');
      setTimeout(() => setSuccess(''), 4000);
    }
    setApplying(null);
  };

  const formatBudget = (amount) => '₹' + Number(amount).toLocaleString('en-IN');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';

  const MODEL_LABELS = {
    cpv: { label: 'CPV', icon: '📊', color: 'cpv' },
    participation: { label: 'Participation', icon: '🚀', color: 'participation' },
    one_time: { label: 'One Time', icon: '🤝', color: 'one_time' },
  };

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

      <div className="search-bar-wrap">
        <input type="text" className="search-input" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="budget_high">Highest Budget</option>
          <option value="budget_low">Lowest Budget</option>
        </select>
      </div>

      <div className="filter-bar">
        {['all', 'cpv', 'participation', 'one_time'].map(f => (
          <button key={f} className={`filter-btn ${typeFilter === f ? 'active' : ''}`} onClick={() => setTypeFilter(f)}>
            {f === 'all' ? 'All Types' : MODEL_LABELS[f]?.icon + ' ' + MODEL_LABELS[f]?.label}
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ paddingTop: '0.5rem' }}>
        {NICHES.map(n => (
          <button key={n} className={`filter-btn ${nicheFilter === n ? 'active' : ''}`} onClick={() => setNicheFilter(n)}>{n}</button>
        ))}
      </div>

      {loading ? (
        <div className="campaigns-loading">Loading campaigns...</div>
      ) : filtered.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">{search ? 'No results found' : 'No campaigns yet'}</div>
          <p className="empty-desc">{search ? 'Try a different search or filter.' : 'Brands are joining VeroLinkr. Check back soon.'}</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {filtered.map(campaign => {
            const model = MODEL_LABELS[campaign.campaign_type] || MODEL_LABELS['one_time'];
            const hasJoined = joined.includes(campaign.id);
            const hasApplied = applied.includes(campaign.id);
            const isCPV = campaign.campaign_type === 'cpv';
            const isParticipation = campaign.campaign_type === 'participation';
            const isOneTime = campaign.campaign_type === 'one_time';

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
                  {isCPV && <>
                    <div className="meta-item"><span className="meta-label">Rate/View</span><span className="meta-value" style={{ color: 'var(--vero-accent)', fontWeight: 600 }}>₹{campaign.cpv_rate}</span></div>
                    <div className="meta-item"><span className="meta-label">Milestone</span><span className="meta-value">Every {Number(campaign.milestone_views).toLocaleString()} views</span></div>
                    <div className="meta-item"><span className="meta-label">Duration</span><span className="meta-value">{campaign.duration_days} days</span></div>
                  </>}
                  {isParticipation && <>
                    <div className="meta-item"><span className="meta-label">Your Payout</span><span className="meta-value" style={{ color: 'var(--vero-accent)', fontWeight: 600 }}>₹{Number(campaign.payout_per_post).toLocaleString()}</span></div>
                    <div className="meta-item"><span className="meta-label">Slots</span><span className="meta-value">{campaign.max_creators} creators</span></div>
                  </>}
                  {isOneTime && <>
                    <div className="meta-item"><span className="meta-label">Creators Needed</span><span className="meta-value">{campaign.max_creators}</span></div>
                    {campaign.content_only && <div className="meta-item"><span className="meta-label">Type</span><span className="meta-value">Content for Ads (no public post)</span></div>}
                  </>}
                  <div className="meta-item"><span className="meta-label">Deadline</span><span className="meta-value">{formatDate(campaign.deadline)}</span></div>
                </div>

                {/* CPV — Instant Join */}
                {isCPV && (
                  hasJoined ? (
                    <div className="applied-badge">✅ Joined — Go to CPV Tracking to submit your post and track views</div>
                  ) : (
                    <div className="instant-join-section">
                      <div className="instant-join-info">
                        <span>⚡</span>
                        <span>Open to all eligible creators. Join instantly — no approval needed. Post content. Earn per verified view.</span>
                      </div>
                      <button className="join-btn" onClick={() => handleJoin(campaign)} disabled={joining === campaign.id}>
                        {joining === campaign.id ? 'Joining...' : '⚡ Join Campaign Instantly →'}
                      </button>
                    </div>
                  )
                )}

                {/* Participation — Instant Join */}
                {isParticipation && (
                  hasJoined ? (
                    <div className="applied-badge">✅ Joined — Go to My Campaigns to submit your post and get paid ₹{Number(campaign.payout_per_post).toLocaleString()}</div>
                  ) : (
                    <div className="instant-join-section">
                      <div className="instant-join-info">
                        <span>🚀</span>
                        <span>Fixed ₹{Number(campaign.payout_per_post).toLocaleString()} payout. Join instantly — no approval needed. Post content. Get paid automatically.</span>
                      </div>
                      <button className="join-btn" onClick={() => handleJoin(campaign)} disabled={joining === campaign.id}>
                        {joining === campaign.id ? 'Joining...' : '🚀 Join Campaign Instantly →'}
                      </button>
                    </div>
                  )
                )}

                {/* One Time — Apply with pitch */}
                {isOneTime && (
                  hasApplied ? (
                    <div className="applied-badge">✅ Applied — brand will review and select creators</div>
                  ) : (
                    <div className="apply-section">
                      <div className="instant-join-info" style={{ background: 'rgba(255,179,71,0.06)', borderColor: 'rgba(255,179,71,0.2)', color: '#FFB347' }}>
                        <span>🤝</span>
                        <span>Brand selects {campaign.max_creators} specific creator{campaign.max_creators > 1 ? 's' : ''}. Submit your pitch to apply.</span>
                      </div>
                      <textarea
                        className="apply-message"
                        placeholder="Tell the brand why you are the right creator for this campaign..."
                        rows={3}
                        value={messages[campaign.id] || ''}
                        onChange={e => setMessages(prev => ({ ...prev, [campaign.id]: e.target.value }))}
                      />
                      <button
                        className="apply-btn"
                        onClick={() => handleApply(campaign)}
                        disabled={applying === campaign.id || !(messages[campaign.id] || '').trim()}
                      >
                        {applying === campaign.id ? 'Applying...' : 'Submit Application →'}
                      </button>
                    </div>
                  )
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
