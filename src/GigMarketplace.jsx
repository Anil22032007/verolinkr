import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const NICHES = ['Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Education', 'Gaming', 'Lifestyle', 'Other'];
const PLATFORMS = ['Instagram', 'YouTube', 'Both'];

function GigMarketplace({ user, role, onBack }) {
  const [view, setView] = useState(role === 'creator' ? 'my_gigs' : 'browse');
  const [gigs, setGigs] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGig, setShowCreateGig] = useState(false);
  const [ordering, setOrdering] = useState(null);
  const [orderMsg, setOrderMsg] = useState('');
  const [success, setSuccess] = useState('');
  const [gigForm, setGigForm] = useState({
    title: '', description: '', niche: '', platform: 'Instagram',
    price: '', delivery_days: '', revisions: '2',
  });
  const [gigLoading, setGigLoading] = useState(false);
  const [gigError, setGigError] = useState('');

  useEffect(() => {
    if (view === 'browse') fetchGigs();
    if (view === 'my_gigs') fetchMyGigs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const fetchGigs = async () => {
    setLoading(true);
    const { data } = await supabase.from('gigs').select('*').eq('status', 'active').order('created_at', { ascending: false });
    setGigs(data || []);
    setLoading(false);
  };

  const fetchMyGigs = async () => {
    setLoading(true);
    const { data } = await supabase.from('gigs').select('*').eq('creator_id', user.id).order('created_at', { ascending: false });
    setMyGigs(data || []);
    setLoading(false);
  };

  const handleCreateGig = async (e) => {
    e.preventDefault();
    setGigLoading(true);
    setGigError('');
    const { error } = await supabase.from('gigs').insert({
      creator_id: user.id,
      title: gigForm.title,
      description: gigForm.description,
      niche: gigForm.niche,
      platform: gigForm.platform,
      price: parseInt(gigForm.price),
      delivery_days: parseInt(gigForm.delivery_days),
      revisions: parseInt(gigForm.revisions),
      status: 'active',
    });
    if (error) { setGigError(error.message); }
    else {
      setShowCreateGig(false);
      setGigForm({ title: '', description: '', niche: '', platform: 'Instagram', price: '', delivery_days: '', revisions: '2' });
      fetchMyGigs();
      setSuccess('Gig created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
    setGigLoading(false);
  };

  const handleOrder = async (gig) => {
    if (!orderMsg.trim()) return;
    setOrdering(gig.id);
    const { error } = await supabase.from('gig_orders').insert({
      gig_id: gig.id,
      brand_id: user.id,
      creator_id: gig.creator_id,
      requirements: orderMsg,
      status: 'pending',
    });
    if (!error) {
      setSuccess('Order placed! Creator will deliver within ' + gig.delivery_days + ' days.');
      setOrderMsg('');
      setTimeout(() => setSuccess(''), 4000);
    }
    setOrdering(null);
  };

  const updateGig = (field, value) => setGigForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>⚡ Gig Marketplace</h1>
          <p>Verified creators. On demand content. Escrow protected.</p>
        </div>
        {role === 'creator' && (
          <button className="form-submit" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={() => setShowCreateGig(true)}>
            + List New Gig
          </button>
        )}
      </div>

      {success && <div className="global-success">{success}</div>}

      <div className="filter-bar">
        {role === 'creator' && (
          <button className={`filter-btn ${view === 'my_gigs' ? 'active' : ''}`} onClick={() => setView('my_gigs')}>My Gigs</button>
        )}
        <button className={`filter-btn ${view === 'browse' ? 'active' : ''}`} onClick={() => setView('browse')}>
          {role === 'creator' ? 'Browse All Gigs' : 'All Gigs'}
        </button>
      </div>

      {/* CREATE GIG MODAL */}
      {showCreateGig && (
        <div className="modal-overlay" onClick={() => setShowCreateGig(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>List Your Gig</h2>
              <button className="modal-close" onClick={() => setShowCreateGig(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGig} className="form-body">
              <div className="field">
                <label>Gig Title</label>
                <input type="text" placeholder="e.g. I will create an Instagram Reel for your brand" value={gigForm.title} onChange={(e) => updateGig('title', e.target.value)} required />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea placeholder="Describe what you will deliver, your style, past work..." value={gigForm.description} onChange={(e) => updateGig('description', e.target.value)} required rows={3} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Niche</label>
                  <select value={gigForm.niche} onChange={(e) => updateGig('niche', e.target.value)} required>
                    <option value="">Select niche</option>
                    {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Platform</label>
                  <select value={gigForm.platform} onChange={(e) => updateGig('platform', e.target.value)}>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Price (₹)</label>
                  <input type="number" placeholder="e.g. 2500" value={gigForm.price} onChange={(e) => updateGig('price', e.target.value)} required min={100} />
                </div>
                <div className="field">
                  <label>Delivery (days)</label>
                  <input type="number" placeholder="e.g. 3" value={gigForm.delivery_days} onChange={(e) => updateGig('delivery_days', e.target.value)} required min={1} max={30} />
                </div>
              </div>
              <div className="field">
                <label>Revisions included</label>
                <select value={gigForm.revisions} onChange={(e) => updateGig('revisions', e.target.value)}>
                  <option value="1">1 revision</option>
                  <option value="2">2 revisions</option>
                  <option value="3">3 revisions</option>
                </select>
              </div>
              {gigError && <div className="form-error">{gigError}</div>}
              <button type="submit" className="form-submit" disabled={gigLoading}>
                {gigLoading ? 'Creating...' : 'List Gig →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="campaigns-loading">Loading gigs...</div>
      ) : (
        <div className="campaigns-list">
          {(view === 'my_gigs' ? myGigs : gigs).length === 0 ? (
            <div className="campaigns-empty">
              <div className="empty-icon">⚡</div>
              <div className="empty-title">{view === 'my_gigs' ? 'No gigs listed yet' : 'No gigs available yet'}</div>
              <p className="empty-desc">{view === 'my_gigs' ? 'Create your first gig and start getting brand orders.' : 'Creators are joining VeroLinkr. Check back soon.'}</p>
              {view === 'my_gigs' && (
                <button className="form-submit" style={{ marginTop: '1.5rem' }} onClick={() => setShowCreateGig(true)}>
                  List Your First Gig →
                </button>
              )}
            </div>
          ) : (
            (view === 'my_gigs' ? myGigs : gigs).map((gig) => (
              <div className="campaign-card" key={gig.id}>
                <div className="campaign-top">
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div className="campaign-niche">{gig.niche}</div>
                      <div className="campaign-niche">{gig.platform}</div>
                    </div>
                    <h2 className="campaign-title">{gig.title}</h2>
                  </div>
                  <div className="campaign-budget">₹{Number(gig.price).toLocaleString()}</div>
                </div>

                <p className="campaign-desc">{gig.description}</p>

                <div className="campaign-meta">
                  <div className="meta-item">
                    <span className="meta-label">Delivery</span>
                    <span className="meta-value">{gig.delivery_days} days</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Revisions</span>
                    <span className="meta-value">{gig.revisions} included</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Escrow</span>
                    <span className="meta-value">🔒 Protected</span>
                  </div>
                </div>

                {role === 'brand' && view === 'browse' && (
                  <div className="apply-section">
                    <textarea
                      className="apply-message"
                      placeholder="Describe your requirements — product details, content direction, key messages..."
                      rows={3}
                      value={ordering === gig.id ? orderMsg : orderMsg}
                      onChange={(e) => setOrderMsg(e.target.value)}
                    />
                    <button
                      className="apply-btn"
                      onClick={() => handleOrder(gig)}
                      disabled={ordering === gig.id || !orderMsg.trim()}
                    >
                      {ordering === gig.id ? 'Placing Order...' : `Order for ₹${Number(gig.price).toLocaleString()} →`}
                    </button>
                  </div>
                )}

                {view === 'my_gigs' && (
                  <div className={`applied-badge ${gig.status === 'active' ? '' : 'inactive'}`}>
                    {gig.status === 'active' ? '✅ Live — visible to brands' : '⏸ Paused'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default GigMarketplace;
