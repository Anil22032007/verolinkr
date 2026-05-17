import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const INDUSTRIES = ['Fashion', 'Tech', 'Food & Beverage', 'Beauty', 'Health & Fitness', 'Finance', 'Education', 'Gaming', 'Travel', 'D2C', 'E-commerce', 'Other'];

function BrandProfile({ user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    company_name: '',
    website: '',
    industry: '',
    description: '',
  });

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('brand_profiles').select('*').eq('id', user.id).single();
    if (data) {
      setForm({
        company_name: data.company_name || '',
        website: data.website || '',
        industry: data.industry || '',
        description: data.description || '',
      });
    }
    setLoading(false);
  };

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('brand_profiles').upsert({
      id: user.id,
      company_name: form.company_name,
      website: form.website,
      industry: form.industry,
      description: form.description,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (err) setError(err.message);
    else { setSuccess('Brand profile saved!'); setTimeout(() => setSuccess(''), 3000); }
    setSaving(false);
  };

  const completionScore = () => {
    const fields = [form.company_name, form.website, form.industry, form.description];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  if (loading) return <div className="campaigns-loading">Loading profile...</div>;

  const score = completionScore();

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>Brand Profile</h1>
          <p>Complete your profile to build trust with creators</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      <div className="form-card">
        <div className="profile-completion">
          <div className="profile-completion-header">
            <span className="profile-completion-label">Profile Completion</span>
            <span className="profile-completion-score" style={{ color: score === 100 ? '#5DCAA5' : score >= 60 ? '#FFB347' : 'var(--vero-accent)' }}>{score}%</span>
          </div>
          <div className="profile-completion-bar">
            <div className="profile-completion-fill" style={{ width: `${score}%`, background: score === 100 ? '#5DCAA5' : score >= 60 ? '#FFB347' : 'var(--vero-accent)' }} />
          </div>
          {score < 100 && <p className="profile-completion-hint">Complete your profile — creators trust verified brands more</p>}
        </div>

        <form onSubmit={handleSave} className="form-body">
          <div className="field">
            <label>Company Name</label>
            <input type="text" placeholder="Your company name" value={form.company_name} onChange={e => update('company_name', e.target.value)} required />
          </div>
          <div className="field">
            <label>Website</label>
            <input type="url" placeholder="https://yourcompany.com" value={form.website} onChange={e => update('website', e.target.value)} />
          </div>
          <div className="field">
            <label>Industry</label>
            <select value={form.industry} onChange={e => update('industry', e.target.value)}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="field">
            <label>About Your Brand</label>
            <textarea placeholder="Tell creators about your brand, products, and what you're looking for in collaborations..." value={form.description} onChange={e => update('description', e.target.value)} rows={4} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="form-submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Brand Profile →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BrandProfile;
