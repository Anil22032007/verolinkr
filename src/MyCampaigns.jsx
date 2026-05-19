import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function MyCampaigns({ user, onBack }) {
  const [joins, setJoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [postUrls, setPostUrls] = useState({});
  const [postNotes, setPostNotes] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyJoins();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyJoins = async () => {
    const { data } = await supabase
      .from('campaign_joins')
      .select('*, campaigns(*)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    setJoins(data || []);
    setLoading(false);
  };

  const handleSubmitPost = async (joinId, campaignId, brandId, campaignTitle, payoutPerPost) => {
    const url = postUrls[joinId] || '';
    if (!url.trim()) return;
    setSubmitting(joinId);
    setError('');

    const { error: updateError } = await supabase
      .from('campaign_joins')
      .update({
        post_url: url,
        post_note: postNotes[joinId] || '',
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', joinId);

    if (!updateError) {
      // Notify brand
      await supabase.from('notifications').insert({
        user_id: brandId,
        title: '📤 Creator Submitted Content',
        message: `A creator has submitted their post for "${campaignTitle}". Content will auto-verify and payment will release in 48 hours.`,
        type: 'submitted',
        read: false,
      });

      setSuccess(`Post submitted! Payment of ₹${Number(payoutPerPost || 0).toLocaleString()} will release automatically after 48 hours.`);
      setTimeout(() => setSuccess(''), 5000);
      fetchMyJoins();
    } else {
      setError(updateError.message);
    }
    setSubmitting(null);
  };

  const getStatusInfo = (join) => {
    const campaign = join.campaigns;
    if (!campaign) return { label: join.status, color: 'var(--vero-muted)' };

    if (join.status === 'joined') {
      if (campaign.campaign_type === 'cpv') return { label: '⚡ Joined — Post content and track views in CPV Tracking', color: '#8ab4f8' };
      return { label: '🚀 Joined — Submit your post link below to get paid', color: '#FFB347' };
    }
    if (join.status === 'submitted') return { label: '📤 Post Submitted — Payment releases in 48 hours automatically', color: '#8ab4f8' };
    if (join.status === 'paid') return { label: '💰 Payment Released — Check your wallet', color: '#5DCAA5' };
    return { label: join.status, color: 'var(--vero-muted)' };
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');

  if (loading) return <div className="campaigns-loading">Loading your campaigns...</div>;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>My Campaigns</h1>
          <p>CPV and Participation campaigns you have joined</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}
      {error && <div className="form-error" style={{ margin: '0 2.5rem 1rem' }}>{error}</div>}

      {joins.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">🚀</div>
          <div className="empty-title">No campaigns joined yet</div>
          <p className="empty-desc">Browse CPV and Participation campaigns and join instantly to start earning.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {joins.map(join => {
            const campaign = join.campaigns;
            if (!campaign) return null;
            const statusInfo = getStatusInfo(join);
            const isParticipation = campaign.campaign_type === 'participation';
            const isCPV = campaign.campaign_type === 'cpv';

            return (
              <div className="campaign-card" key={join.id}>
                <div className="campaign-top">
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div className={`campaign-type-badge ${campaign.campaign_type}`}>
                        {isCPV ? '📊 CPV' : '🚀 Participation'}
                      </div>
                      <div className="campaign-niche">{campaign.niche}</div>
                    </div>
                    <h2 className="campaign-title">{campaign.title}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isParticipation && (
                      <div className="campaign-budget">₹{formatNum(campaign.payout_per_post)}</div>
                    )}
                    {isCPV && (
                      <div className="campaign-budget">₹{campaign.cpv_rate}/view</div>
                    )}
                  </div>
                </div>

                <p className="campaign-desc">{campaign.description}</p>

                <div className="campaign-meta">
                  <div className="meta-item"><span className="meta-label">Deliverables</span><span className="meta-value">{campaign.deliverables}</span></div>
                  {campaign.platform && <div className="meta-item"><span className="meta-label">Platform</span><span className="meta-value">{campaign.platform}</span></div>}
                  {isParticipation && <div className="meta-item"><span className="meta-label">Payout</span><span className="meta-value" style={{ color: '#5DCAA5', fontWeight: 600 }}>₹{formatNum(campaign.payout_per_post)} on approval</span></div>}
                  {isCPV && <div className="meta-item"><span className="meta-label">Milestone</span><span className="meta-value">₹{formatNum(Math.floor((campaign.milestone_views || 5000) * campaign.cpv_rate))} every {formatNum(campaign.milestone_views)} views</span></div>}
                  <div className="meta-item"><span className="meta-label">Joined</span><span className="meta-value">{formatDate(join.created_at)}</span></div>
                </div>

                {/* Status */}
                <div className="submission-status" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--vero-border)', color: statusInfo.color, marginBottom: '1rem' }}>
                  {statusInfo.label}
                </div>

                {/* Participation — submit post link */}
                {isParticipation && join.status === 'joined' && (
                  <div className="submission-form">
                    <div className="submission-title">📤 Submit Your Post</div>
                    <p className="submission-desc">
                      Post your content on {campaign.platform || 'social media'} as per the campaign brief, then paste the post link below.
                      Payment of ₹{formatNum(campaign.payout_per_post)} releases automatically after 48 hours.
                    </p>
                    <div className="field" style={{ marginBottom: '0.75rem' }}>
                      <label>Post URL (public link to your content)</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/p/..."
                        value={postUrls[join.id] || ''}
                        onChange={e => setPostUrls(p => ({ ...p, [join.id]: e.target.value }))}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: '1rem' }}>
                      <label>Note (optional)</label>
                      <textarea
                        placeholder="Any notes about your content..."
                        rows={2}
                        value={postNotes[join.id] || ''}
                        onChange={e => setPostNotes(p => ({ ...p, [join.id]: e.target.value }))}
                      />
                    </div>
                    <div className="escrow-note">
                      <div className="escrow-note-icon">⏳</div>
                      <div>
                        <div className="escrow-note-title">48 Hour Auto-Release</div>
                        <div className="escrow-note-desc">After you submit your post — payment releases automatically in 48 hours. No brand approval needed. Keep your post live.</div>
                      </div>
                    </div>
                    <button
                      className="join-btn"
                      style={{ marginTop: '1rem' }}
                      onClick={() => handleSubmitPost(join.id, campaign.id, campaign.brand_id, campaign.title, campaign.payout_per_post)}
                      disabled={submitting === join.id || !(postUrls[join.id] || '').trim()}
                    >
                      {submitting === join.id ? 'Submitting...' : 'Submit Post →'}
                    </button>
                  </div>
                )}

                {/* CPV — redirect to CPV tracking */}
                {isCPV && join.status === 'joined' && (
                  <div className="instant-join-info">
                    <span>📊</span>
                    <span>Go to <strong>CPV Tracking</strong> from your dashboard to submit your post URL and track views. Payment releases automatically every {formatNum(campaign.milestone_views)} views.</span>
                  </div>
                )}

                {/* Submitted — show submitted post */}
                {join.status === 'submitted' && join.post_url && (
                  <div className="submitted-content">
                    <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Submitted post</div>
                    <a href={join.post_url} target="_blank" rel="noreferrer" className="submission-link">{join.post_url} ↗</a>
                    {join.post_note && <p style={{ fontSize: '0.82rem', color: 'var(--vero-muted)', marginTop: '0.35rem', fontWeight: 300 }}>{join.post_note}</p>}
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

export default MyCampaigns;
