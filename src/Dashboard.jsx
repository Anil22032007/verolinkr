import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import CreateCampaign from './CreateCampaign';
import ManageCampaigns from './ManageCampaigns';
import BrowseCampaigns from './BrowseCampaigns';
import './Dashboard.css';

function Dashboard({ user, onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // home | create | manage | browse

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const role = profile?.role || user?.user_metadata?.role || 'creator';
  const name = profile?.name || user?.user_metadata?.name || user?.email;

  if (loading) {
    return <div className="dash-loading">Loading your dashboard...</div>;
  }

  if (view === 'create') {
    return (
      <CreateCampaign
        user={user}
        onBack={() => setView('home')}
        onCreated={() => setView('manage')}
      />
    );
  }

  if (view === 'manage') {
    return (
      <ManageCampaigns
        user={user}
        onBack={() => setView('home')}
        onCreateNew={() => setView('create')}
      />
    );
  }

  if (view === 'browse') {
    return (
      <BrowseCampaigns
        user={user}
        onBack={() => setView('home')}
      />
    );
  }

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
          <p>{role === 'brand' ? 'Create campaigns and find verified creators.' : 'Browse campaigns and apply for brand deals.'}</p>
        </div>

        <div className="dash-cards">
          {role === 'creator' ? (
            <>
              <div className="dash-card clickable" onClick={() => setView('browse')}>
                <div className="dash-card-icon">🎯</div>
                <div className="dash-card-title">Browse Campaigns</div>
                <p className="dash-card-desc">Find brand deals that match your niche and audience. Apply directly.</p>
                <div className="dash-card-action">Browse Now →</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">💰</div>
                <div className="dash-card-title">My Earnings</div>
                <p className="dash-card-desc">Track your escrow payments and withdrawals.</p>
                <div className="dash-coming-soon">Coming in Phase 4</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">📊</div>
                <div className="dash-card-title">My Applications</div>
                <p className="dash-card-desc">Track the status of your campaign applications.</p>
                <div className="dash-coming-soon">Coming Soon</div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-card clickable" onClick={() => setView('create')}>
                <div className="dash-card-icon">📋</div>
                <div className="dash-card-title">Create Campaign</div>
                <p className="dash-card-desc">Launch a new influencer campaign with escrow-secured payment.</p>
                <div className="dash-card-action">Create Now →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('manage')}>
                <div className="dash-card-icon">🔍</div>
                <div className="dash-card-title">My Campaigns</div>
                <p className="dash-card-desc">Review applications from creators and manage active campaigns.</p>
                <div className="dash-card-action">Manage →</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">📈</div>
                <div className="dash-card-title">Campaign Analytics</div>
                <p className="dash-card-desc">Track performance and ROI across all your campaigns.</p>
                <div className="dash-coming-soon">Coming Soon</div>
              </div>
            </>
          )}
        </div>

        <div className="dash-newsletter">
          <div className="dash-newsletter-text">
            <div className="dash-newsletter-title">Stay updated with the Creator Economy</div>
            <div className="dash-newsletter-sub">Read the VeroLinkr newsletter — India's top creator economy insights.</div>
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
