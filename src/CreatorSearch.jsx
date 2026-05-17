import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const NICHES = ['All', 'Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Education', 'Gaming', 'Lifestyle', 'Other'];

function CreatorSearch({ onBack }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState('All');
  const [sortBy, setSortBy] = useState('followers');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    const { data } = await supabase
      .from('creator_profiles')
      .select('*, profiles(name, email)');
    setCreators(data || []);
    setLoading(false);
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  let filtered = creators;
  if (niche !== 'All') filtered = filtered.filter(c => c.niche === niche);
  if (search.trim()) filtered = filtered.filter(c =>
    c.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.instagram_handle?.toLowerCase().includes(search.toLowerCase()) ||
    c.youtube_handle?.toLowerCase().includes(search.toLowerCase()) ||
    c.past_brands?.toLowerCase().includes(search.toLowerCase())
  );
  if (sortBy === 'followers') filtered = [...filtered].sort((a, b) => (b.instagram_followers + b.youtube_subscribers) - (a.instagram_followers + a.youtube_subscribers));
  if (sortBy === 'engagement') filtered = [...filtered].sort((a, b) => b.engagement_rate - a.engagement_rate);

  const getEngagementColor = (rate) => {
    if (rate >= 5) return '#5DCAA5';
    if (rate >= 3) return '#FFB347';
    return 'var(--vero-muted)';
  };

  const totalFollowers = (c) => (c.instagram_followers || 0) + (c.youtube_subscribers || 0);

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>🔍 Find Creators</h1>
          <p>{filtered.length} verified creators on VeroLinkr</p>
        </div>
      </div>

      <div className="search-bar-wrap">
        <input type="text" className="search-input" placeholder="Search by name, handle, or past brand..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="followers">Most Followers</option>
          <option value="engagement">Best Engagement</option>
        </select>
      </div>

      <div className="filter-bar">
        {NICHES.map(n => (
          <button key={n} className={`filter-btn ${niche === n ? 'active' : ''}`} onClick={() => setNiche(n)}>{n}</button>
        ))}
      </div>

      {loading ? (
        <div className="campaigns-loading">Loading creators...</div>
      ) : filtered.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">👤</div>
          <div className="empty-title">No creators found</div>
          <p className="empty-desc">Try a different search or filter. Creators are joining VeroLinkr daily.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {filtered.map(creator => (
            <div className="campaign-card" key={creator.id} onClick={() => setSelected(selected?.id === creator.id ? null : creator)} style={{ cursor: 'pointer' }}>
              <div className="campaign-top">
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    {creator.niche && <div className="campaign-niche">{creator.niche}</div>}
                    {creator.instagram_handle && <div className="campaign-niche">📸 Instagram</div>}
                    {creator.youtube_handle && <div className="campaign-niche">▶️ YouTube</div>}
                  </div>
                  <h2 className="campaign-title">{creator.profiles?.name || 'Creator'}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--vero-accent)' }}>
                    {formatNum(totalFollowers(creator))}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', marginTop: '2px' }}>total followers</div>
                </div>
              </div>

              {creator.bio && <p className="campaign-desc">{creator.bio}</p>}

              <div className="campaign-meta">
                {creator.instagram_handle && (
                  <div className="meta-item">
                    <span className="meta-label">Instagram</span>
                    <span className="meta-value">{creator.instagram_handle} · {formatNum(creator.instagram_followers)} followers</span>
                  </div>
                )}
                {creator.youtube_handle && (
                  <div className="meta-item">
                    <span className="meta-label">YouTube</span>
                    <span className="meta-value">{creator.youtube_handle} · {formatNum(creator.youtube_subscribers)} subscribers</span>
                  </div>
                )}
                {creator.engagement_rate > 0 && (
                  <div className="meta-item">
                    <span className="meta-label">Engagement</span>
                    <span className="meta-value" style={{ color: getEngagementColor(creator.engagement_rate), fontWeight: 600 }}>
                      {creator.engagement_rate}%
                    </span>
                  </div>
                )}
                {creator.past_brands && (
                  <div className="meta-item">
                    <span className="meta-label">Past Brands</span>
                    <span className="meta-value">{creator.past_brands}</span>
                  </div>
                )}
              </div>

              {selected?.id === creator.id && creator.portfolio_url && (
                <a href={creator.portfolio_url} target="_blank" rel="noreferrer" className="apply-btn" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '0.5rem' }}>
                  View Portfolio ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CreatorSearch;
