import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const NICHES = ['Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Education', 'Gaming', 'Lifestyle', 'Other'];

function CreatorProfile({ user, onBack }) {
  const [, setProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    bio: '',
    instagram_handle: '',
    youtube_handle: '',
    instagram_followers: '',
    youtube_subscribers: '',
    engagement_rate: '',
    niche: '',
    past_brands: '',
    portfolio_url: '',
  });

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    const { data: base } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    

    const { data } = await supabase.from('creator_profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data);
      setForm({
        bio: data.bio || '',
        instagram_handle: data.instagram_handle || '',
        youtube_handle: data.youtube_handle || '',
        instagram_followers: data.instagram_followers || '',
        youtube_subscribers: data.youtube_subscribers || '',
        engagement_rate: data.engagement_rate || '',
        niche: data.niche || '',
        past_brands: data.past_brands || '',
        portfolio_url: data.portfolio_url || '',
      });
    }
    setLoading(false);
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: user.id,
      bio: form.bio,
      instagram_handle: form.instagram_handle,
      youtube_handle: form.youtube_handle,
      instagram_followers: parseInt(form.instagram_followers) || 0,
      youtube_subscribers: parseInt(form.youtube_subscribers) || 0,
      engagement_rate: parseFloat(form.engagement_rate) || 0,
      niche: form.niche,
      past_brands: form.past_brands,
      portfolio_url: form.portfolio_url,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('creator_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  };

  const completionScore = () => {
    const fields = [form.bio, form.instagram_handle || form.youtube_handle, form.niche, form.engagement_rate, form.past_brands];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (loading) return <div className="campaigns-loading">Loading profile...</div>;

  const score = completionScore();

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>My Creator Profile</h1>
          <p>Complete your profile to attract better brand deals</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      <div className="form-card">
        {/* Profile completion */}
        <div className="profile-completion">
          <div className="profile-completion-header">
            <span className="profile-completion-label">Profile Completion</span>
            <span className="profile-completion-score" style={{ color: score === 100 ? '#5DCAA5' : score >= 60 ? '#FFB347' : 'var(--vero-accent)' }}>
              {score}%
            </span>
          </div>
          <div className="profile-completion-bar">
            <div
              className="profile-completion-fill"
              style={{
                width: `${score}%`,
                background: score === 100 ? '#5DCAA5' : score >= 60 ? '#FFB347' : 'var(--vero-accent)',
              }}
            />
          </div>
          {score < 100 && (
            <p className="profile-completion-hint">Complete your profile to get more brand deal approvals</p>
          )}
        </div>

        <form onSubmit={handleSave} className="form-body">
          <div className="field">
            <label>Bio</label>
            <textarea
              placeholder="Tell brands about yourself — your content style, audience, and what makes you unique..."
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
            />
          </div>

          <div className="field">
            <label>Niche</label>
            <select value={form.niche} onChange={(e) => update('niche', e.target.value)}>
              <option value="">Select your primary niche</option>
              {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Instagram Handle</label>
              <input type="text" placeholder="@yourhandle" value={form.instagram_handle} onChange={(e) => update('instagram_handle', e.target.value)} />
            </div>
            <div className="field">
              <label>Instagram Followers</label>
              <input type="number" placeholder="e.g. 15000" value={form.instagram_followers} onChange={(e) => update('instagram_followers', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>YouTube Handle</label>
              <input type="text" placeholder="@yourchannel" value={form.youtube_handle} onChange={(e) => update('youtube_handle', e.target.value)} />
            </div>
            <div className="field">
              <label>YouTube Subscribers</label>
              <input type="number" placeholder="e.g. 8000" value={form.youtube_subscribers} onChange={(e) => update('youtube_subscribers', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Engagement Rate (%)</label>
            <input type="number" placeholder="e.g. 4.5" step="0.1" value={form.engagement_rate} onChange={(e) => update('engagement_rate', e.target.value)} />
          </div>

          <div className="field">
            <label>Past Brand Collaborations</label>
            <input type="text" placeholder="e.g. Mamaearth, Boat, Nykaa, mCaffeine" value={form.past_brands} onChange={(e) => update('past_brands', e.target.value)} />
          </div>

          <div className="field">
            <label>Portfolio URL (optional)</label>
            <input type="url" placeholder="https://yourportfolio.com" value={form.portfolio_url} onChange={(e) => update('portfolio_url', e.target.value)} />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="form-submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatorProfile;
