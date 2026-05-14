import React, { useState } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const CAMPAIGN_MODELS = [
  {
    type: 'cpv',
    icon: '📊',
    title: 'CPV Campaign',
    subtitle: 'Cost Per Verified View',
    desc: 'Pay only for real verified views. Budget in escrow. Payment releases automatically every milestone.',
    best: 'App launches, brand awareness, mass authentic reach',
  },
  {
    type: 'participation',
    icon: '🚀',
    title: 'Participation Campaign',
    subtitle: 'UGC Engine',
    desc: 'Fixed payout per creator. Unlimited creators join simultaneously. Authentic UGC at scale.',
    best: 'Product launches, review collection, social proof',
  },
  {
    type: 'one_time',
    icon: '🤝',
    title: 'One Time Payment',
    subtitle: 'Controlled Quality Deal',
    desc: 'Select specific creators. Public post or private ad content. Escrow protected.',
    best: 'Quality controlled campaigns, premium ad content',
  },
  {
    type: 'gig',
    icon: '⚡',
    title: 'Gig Marketplace',
    subtitle: 'On Demand Content',
    desc: 'Browse verified creator gigs. Buy instantly. Escrow protected. Delivered in days.',
    best: 'Quick content needs, small budgets, specific deliverables',
    redirect: true,
  },
];

const NICHES = ['Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Education', 'Gaming', 'Lifestyle', 'Other'];
const PLATFORMS = ['Instagram', 'YouTube', 'Both'];

function CreateCampaign({ user, onBack, onCreated, onGigMarketplace }) {
  const [step, setStep] = useState(1); // 1 = select model, 2 = fill form
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    niche: '',
    budget: '',
    deliverables: '',
    deadline: '',
    platform: 'Instagram',
    // CPV
    cpv_rate: '',
    milestone_views: '5000',
    duration_days: '3',
    // Participation
    payout_per_post: '',
    max_creators: '',
    // One Time
    content_only: false,
  });

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleModelSelect = (model) => {
    if (model.redirect) {
      onGigMarketplace();
      return;
    }
    setSelectedModel(model);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        brand_id: user.id,
        campaign_type: selectedModel.type,
        title: form.title,
        description: form.description,
        niche: form.niche,
        budget: parseInt(form.budget),
        deliverables: form.deliverables,
        deadline: form.deadline || null,
        platform: form.platform,
        status: 'open',
      };

      if (selectedModel.type === 'cpv') {
        payload.cpv_rate = parseFloat(form.cpv_rate);
        payload.milestone_views = parseInt(form.milestone_views);
        payload.duration_days = parseInt(form.duration_days);
      }

      if (selectedModel.type === 'participation') {
        payload.payout_per_post = parseInt(form.payout_per_post);
        payload.max_creators = parseInt(form.max_creators);
      }

      if (selectedModel.type === 'one_time') {
        payload.max_creators = parseInt(form.max_creators) || 1;
        payload.content_only = form.content_only;
      }

      const { error: insertError } = await supabase.from('campaigns').insert(payload);
      if (insertError) throw insertError;
      onCreated();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="form-wrap">
        <div className="form-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <div className="form-header-text">
            <h1>Create Campaign</h1>
            <p>Choose your campaign model</p>
          </div>
        </div>

        <div className="model-grid">
          {CAMPAIGN_MODELS.map((model) => (
            <div
              className="model-card"
              key={model.type}
              onClick={() => handleModelSelect(model)}
            >
              <div className="model-icon">{model.icon}</div>
              <div className="model-title">{model.title}</div>
              <div className="model-subtitle">{model.subtitle}</div>
              <p className="model-desc">{model.desc}</p>
              <div className="model-best">
                <span className="model-best-label">Best for: </span>
                {model.best}
              </div>
              <div className="model-select-btn">
                {model.redirect ? 'Browse Gigs →' : 'Select →'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
        <div className="form-header-text">
          <h1>{selectedModel.icon} {selectedModel.title}</h1>
          <p>{selectedModel.subtitle}</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} className="form-body">

          <div className="field">
            <label>Campaign Title</label>
            <input type="text" placeholder="e.g. Promote our new AI writing tool to creators" value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea placeholder="What is your product? What do you want creators to do? Who is your target audience?" value={form.description} onChange={(e) => update('description', e.target.value)} required rows={4} />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Niche</label>
              <select value={form.niche} onChange={(e) => update('niche', e.target.value)} required>
                <option value="">Select niche</option>
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Platform</label>
              <select value={form.platform} onChange={(e) => update('platform', e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Total Budget (₹)</label>
            <input type="number" placeholder="e.g. 50000" value={form.budget} onChange={(e) => update('budget', e.target.value)} required min={500} />
          </div>

          {/* CPV specific fields */}
          {selectedModel.type === 'cpv' && (
            <>
              <div className="campaign-model-info">
                <div className="cmi-title">📊 How CPV works</div>
                <div className="cmi-desc">Creators join automatically. Payment releases every time a milestone view count is hit. Unused budget refunds when campaign ends.</div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Rate per View (₹)</label>
                  <input type="number" placeholder="e.g. 0.15" step="0.01" value={form.cpv_rate} onChange={(e) => update('cpv_rate', e.target.value)} required />
                </div>
                <div className="field">
                  <label>Milestone (views)</label>
                  <input type="number" placeholder="e.g. 5000" value={form.milestone_views} onChange={(e) => update('milestone_views', e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Campaign Duration (days)</label>
                <select value={form.duration_days} onChange={(e) => update('duration_days', e.target.value)}>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                </select>
              </div>
            </>
          )}

          {/* Participation specific fields */}
          {selectedModel.type === 'participation' && (
            <>
              <div className="campaign-model-info">
                <div className="cmi-title">🚀 How Participation works</div>
                <div className="cmi-desc">Fixed payout per creator. Creators join and post. VeroLinkr verifies delivery. Payment releases automatically within 48 hours. Unused budget refunds.</div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Payout per Creator (₹)</label>
                  <input type="number" placeholder="e.g. 300" value={form.payout_per_post} onChange={(e) => update('payout_per_post', e.target.value)} required />
                </div>
                <div className="field">
                  <label>Max Creators</label>
                  <input type="number" placeholder="e.g. 100" value={form.max_creators} onChange={(e) => update('max_creators', e.target.value)} required />
                </div>
              </div>
            </>
          )}

          {/* One Time specific fields */}
          {selectedModel.type === 'one_time' && (
            <>
              <div className="campaign-model-info">
                <div className="cmi-title">🤝 How One Time Payment works</div>
                <div className="cmi-desc">You select specific creators from applicants. Escrow holds payment until you approve content. Auto-releases if you don't respond within approval window.</div>
              </div>
              <div className="field">
                <label>Number of Creators Needed</label>
                <input type="number" placeholder="e.g. 10" value={form.max_creators} onChange={(e) => update('max_creators', e.target.value)} required min={1} />
              </div>
              <div className="toggle-field">
                <label className="toggle-label">
                  <input type="checkbox" checked={form.content_only} onChange={(e) => update('content_only', e.target.checked)} />
                  <span className="toggle-text">
                    <strong>Content Only (for Ads)</strong>
                    <span>Creators submit content files directly to you — no public posting required. You own the content completely.</span>
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="field">
            <label>Deliverables</label>
            <input type="text" placeholder="e.g. 1 Instagram Reel + 2 Stories" value={form.deliverables} onChange={(e) => update('deliverables', e.target.value)} required />
          </div>

          {selectedModel.type !== 'cpv' && (
            <div className="field">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
          )}

          <div className="escrow-note">
            <div className="escrow-note-icon">🔒</div>
            <div>
              <div className="escrow-note-title">Payment secured in escrow</div>
              <div className="escrow-note-desc">Your budget is held securely. Creators get paid only on verified delivery. Unused budget returns to you automatically.</div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Creating...' : `Launch ${selectedModel.title} →`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCampaign;
