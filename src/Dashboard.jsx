import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import './Dashboard.css';

function Dashboard({ user, onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return (
      <div className="dash-loading">Loading your dashboard...</div>
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
          <p>Your VeroLinkr dashboard is ready. Campaigns and escrow features coming soon.</p>
        </div>

        <div className="dash-cards">
          {role === 'creator' ? (
            <>
              <div className="dash-card">
                <div className="dash-card-icon">🎯</div>
                <div className="dash-card-title">Browse Campaigns</div>
                <p className="dash-card-desc">Find brand deals that match your niche and audience.</p>
                <div className="dash-coming-soon">Coming Soon</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">💰</div>
                <div className="dash-card-title">My Earnings</div>
                <p className="dash-card-desc">Track your escrow payments and withdrawals.</p>
                <div className="dash-coming-soon">Coming Soon</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">📊</div>
                <div className="dash-card-title">My Profile</div>
                <p className="dash-card-desc">Complete your creator profile to attract brands.</p>
                <div className="dash-coming-soon">Coming Soon</div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-card">
                <div className="dash-card-icon">📋</div>
                <div className="dash-card-title">Create Campaign</div>
                <p className="dash-card-desc">Launch a new influencer campaign with escrow protection.</p>
                <div className="dash-coming-soon">Coming Soon</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">🔍</div>
                <div className="dash-card-title">Find Creators</div>
                <p className="dash-card-desc">Browse verified creators by niche, reach, and engagement.</p>
                <div className="dash-coming-soon">Coming Soon</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon">📈</div>
                <div className="dash-card-title">Campaign Analytics</div>
                <p className="dash-card-desc">Track performance and ROI for all your campaigns.</p>
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
          <a
            href="https://verolinkr.substack.com"
            target="_blank"
            rel="noreferrer"
            className="dash-newsletter-btn"
          >
            Read Newsletter →
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
