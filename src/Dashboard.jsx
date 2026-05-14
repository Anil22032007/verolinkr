import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import CreateCampaign from './CreateCampaign';
import ManageCampaigns from './ManageCampaigns';
import BrowseCampaigns from './BrowseCampaigns';
import GigMarketplace from './GigMarketplace';
import './Dashboard.css';

function Dashboard({ user, onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const role = profile?.role || user?.user_metadata?.role || 'creator';
  const name = profile?.name || user?.user_metadata?.name || user?.email;

  if (loading) return <div className="dash-loading">Loading your dashboard...</div>;

  if (view === 'create') return <CreateCampaign user={user} onBack={() => setView('home')} onCreated={() => setView('manage')} onGigMarketplace={() => setView('gigs')} />;
  if (view === 'manage') return <ManageCampaigns user={user} onBack={() => setView('home')} onCreateNew={() => setView('create')} />;
  if (view === 'browse') return <BrowseCampaigns user={user} onBack={() => setView('home')} />;
  if (view === 'gigs') return <GigMarketplace user={user} role={role} onBack={() => setView('home')} />;

  return (
    <div className="dash-wrap">
      <nav className="dash-nav">
        <div className="logo">Vero<span>Linkr</span></div>
        <div className="dash-nav-right">
          <span className="dash-role-badge">{role === 'brand' ? 'Brand' : 'Creator'}</span>
          <span className="dash-user-name">{name}</span>
          <button className="dash-signout" onClick={onSignOut}>Sign Out</button>
        </div>
      </nav>

      <div className="dash-content">
        <div className="dash-welcome">
          <h1>Welcome back, {name?.split(' ')[0]} 👋</h1>
          <p>{role === 'brand' ? 'Create campaigns across all 4 models. Find verified creators.' : 'Browse campaigns, apply for deals, list your gigs.'}</p>
        </div>

        <div className="dash-cards">
          {role === 'creator' ? (
            <>
              <div className="dash-card clickable" onClick={() => setView('browse')}>
                <div className="dash-card-icon">🎯</div>
                <div className="dash-card-title">Browse Campaigns</div>
                <p className="dash-card-desc">Find CPV, Participation, and One Time campaigns. Apply directly.</p>
                <div className="dash-card-action">Browse Now →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('gigs')}>
                <div className="dash-card-icon">⚡</div>
                <div className="dash-card-title">Gig Marketplace</div>
                <p className="dash-card-desc">List your services. Get brand orders directly. Earn consistently.</p>
                <div className="dash-card-action">Manage Gigs →</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">💰</div>
                <div className="dash-card-title">My Earnings</div>
                <p className="dash-card-desc">Track escrow payments and withdrawals across all campaigns.</p>
                <div className="dash-coming-soon">Coming in Phase 4</div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-card clickable" onClick={() => setView('create')}>
                <div className="dash-card-icon">📋</div>
                <div className="dash-card-title">Create Campaign</div>
                <p className="dash-card-desc">Launch CPV, Participation, One Time, or Gig campaigns.</p>
                <div className="dash-card-action">Create Now →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('manage')}>
                <div className="dash-card-icon">🔍</div>
                <div className="dash-card-title">My Campaigns</div>
                <p className="dash-card-desc">Review applications and manage all active campaigns.</p>
                <div className="dash-card-action">Manage →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('gigs')}>
                <div className="dash-card-icon">⚡</div>
                <div className="dash-card-title">Gig Marketplace</div>
                <p className="dash-card-desc">Browse verified creator gigs. Order instantly. Escrow protected.</p>
                <div className="dash-card-action">Browse Gigs →</div>
              </div>
            </>
          )}
        </div>

        <div className="dash-models-bar">
          <div className="dash-models-title">VeroLinkr's 4 Campaign Models</div>
          <div className="dash-models-list">
            {[
              { icon: '📊', name: 'CPV', desc: 'Pay per verified view' },
              { icon: '🚀', name: 'Participation', desc: 'UGC at scale' },
              { icon: '🤝', name: 'One Time', desc: 'Controlled quality deal' },
              { icon: '⚡', name: 'Gig', desc: 'On demand content' },
            ].map((m) => (
              <div className="dash-model-pill" key={m.name}>
                <span>{m.icon}</span>
                <div>
                  <div className="dash-model-name">{m.name}</div>
                  <div className="dash-model-desc">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-newsletter">
          <div className="dash-newsletter-text">
            <div className="dash-newsletter-title">Stay updated with India's Creator Economy</div>
            <div className="dash-newsletter-sub">Read the VeroLinkr newsletter — insights every 4 days.</div>
          </div>
          <a href="https://verolinkr.substack.com" target="_blank" rel="noreferrer" className="dash-newsletter-btn">
            Read Newsletter →
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
