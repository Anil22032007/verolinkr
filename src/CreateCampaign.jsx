import React, { useState } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function CreateCampaign({ user, onBack, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    niche: '',
    budget: '',
    deliverables: '',
    deadline: '',
  });

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('campaigns').insert({
        brand_id: user.id,
        title: form.title,
        description: form.description,
        niche: form.niche,
        budget: parseInt(form.budget),
        deliverables: form.deliverables,
        deadline: form.deadline,
        status: 'open',
      });

      if (insertError) throw insertError;
      onCreated();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const niches = ['Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Education', 'Gaming', 'Lifestyle', 'Other'];

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>Create Campaign</h1>
          <p>Post a new influencer campaign with escrow-secured payment</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} className="form-body">
          <div className="field">
            <label>Campaign Title</label>
            <input
              type="text"
              placeholder="e.g. Promote our new AI writing tool to creators"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              placeholder="What is your product? What do you want creators to do? Who is your target audience?"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Niche</label>
              <select
                value={form.niche}
                onChange={(e) => update('niche', e.target.value)}
                required
              >
                <option value="">Select niche</option>
                {niches.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Budget (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={form.budget}
                onChange={(e) => update('budget', e.target.value)}
                required
                min={500}
              />
            </div>
          </div>

          <div className="field">
            <label>Deliverables</label>
            <input
              type="text"
              placeholder="e.g. 1 Instagram Reel + 2 Stories + 1 YouTube mention"
              value={form.deliverables}
              onChange={(e) => update('deliverables', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => update('deadline', e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="escrow-note">
            <div className="escrow-note-icon">🔒</div>
            <div>
              <div className="escrow-note-title">Payment goes into escrow</div>
              <div className="escrow-note-desc">Your budget is held securely until you approve the content. Creator gets paid only on your approval.</div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Campaign →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCampaign;
