import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import CreateCampaign from './CreateCampaign';
import ManageCampaigns from './ManageCampaigns';
import BrowseCampaigns from './BrowseCampaigns';
import MyCampaigns from './MyCampaigns';
import GigMarketplace from './GigMarketplace';
import GigOrderManagement from './GigOrderManagement';
import CreatorApplications from './CreatorApplications';
import CPVTracking from './CPVTracking';
import CPVDashboard from './CPVDashboard';
import CPVLeaderboard from './CPVLeaderboard';
import Notifications from './Notifications';
import CreatorProfile from './CreatorProfile';
import BrandProfile from './BrandProfile';
import EarningsWallet from './EarningsWallet';
import CampaignAnalytics from './CampaignAnalytics';
import AdminPanel from './AdminPanel';
import ContentCalendar from './ContentCalendar';
import CreatorSearch from './CreatorSearch';
import './Dashboard.css';

const ADMIN_EMAIL = 'prajapatiab534@gmail.com';

function Dashboard({ user, onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchProfile();
    fetchUnreadCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
    setLoading(false);
  };

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setUnreadCount(count || 0);
  };

  const role = profile?.role || user?.user_metadata?.role || 'creator';
  const name = profile?.name || user?.user_metadata?.name || user?.email;

  if (loading) return <div className="dash-loading">Loading your dashboard...</div>;

  // Route to pages
  if (view === 'create') return <CreateCampaign user={user} onBack={() => setView('home')} onCreated={() => setView('manage')} onGigMarketplace={() => setView('gigs')} />;
  if (view === 'manage') return <ManageCampaigns user={user} onBack={() => setView('home')} onCreateNew={() => setView('create')} />;
  if (view === 'browse') return <BrowseCampaigns user={user} onBack={() => setView('home')} />;
  if (view === 'mycampaigns') return <MyCampaigns user={user} onBack={() => setView('home')} />;
  if (view === 'myapps') return <CreatorApplications user={user} onBack={() => setView('home')} />;
  if (view === 'gigs') return <GigMarketplace user={user} role={role} onBack={() => setView('home')} />;
  if (view === 'gigorders') return <GigOrderManagement user={user} role={role} onBack={() => setView('home')} />;
  if (view === 'cpv') return <CPVTracking user={user} onBack={() => setView('home')} />;
  if (view === 'cpvdash') return <CPVDashboard user={user} onBack={() => setView('home')} />;
  if (view === 'leaderboard') return <CPVLeaderboard user={user} onBack={() => setView('home')} />;
  if (view === 'notifications') return <Notifications user={user} onBack={() => { setView('home'); fetchUnreadCount(); }} />;
  if (view === 'profile') return role === 'creator' ? <CreatorProfile user={user} onBack={() => setView('home')} /> : <BrandProfile user={user} onBack={() => setView('home')} />;
  if (view === 'wallet') return <EarningsWallet user={user} onBack={() => setView('home')} />;
  if (view === 'analytics') return <CampaignAnalytics user={user} onBack={() => setView('home')} />;
  if (view === 'admin') return <AdminPanel user={user} onBack={() => setView('home')} />;
  if (view === 'calendar') return <ContentCalendar user={user} onBack={() => setView('home')} />;
  if (view === 'creatorsearch') return <CreatorSearch onBack={() => setView('home')} />;

  return (
    <div className="dash-wrap">
      <nav className="dash-nav">
        <div className="logo">Vero<span>Linkr</span></div>
        <div className="dash-nav-right">
          <span className="dash-role-badge">{role === 'brand' ? 'Brand' : 'Creator'}</span>
          <span className="dash-user-name">{name}</span>
          <button className="dash-notif-btn" onClick={() => setView('notifications')}>
            🔔 {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          {user.email === ADMIN_EMAIL && (
            <button className="dash-signout" onClick={() => setView('admin')} style={{ background: 'rgba(255,92,53,0.1)', borderColor: 'rgba(255,92,53,0.3)', color: 'var(--vero-accent)' }}>⚙️ Admin</button>
          )}
          <button className="dash-signout" onClick={onSignOut}>Sign Out</button>
        </div>
      </nav>

      <div className="dash-content">
        <div className="dash-welcome">
          <h1>Welcome back, {name?.split(' ')[0]} 👋</h1>
          <p>{role === 'brand'
            ? 'Launch campaigns. Creators join instantly. Pay only for results.'
            : 'Join campaigns instantly. Post content. Get paid automatically.'
          }</p>
        </div>

        <div className="dash-cards">
          {role === 'creator' ? (
            <>
              <div className="dash-card clickable" onClick={() => setView('browse')}>
                <div className="dash-card-icon">🔍</div>
                <div className="dash-card-title">Browse Campaigns</div>
                <p className="dash-card-desc">Join CPV and Participation campaigns instantly. Apply for One Time campaigns.</p>
                <div className="dash-card-action">Browse →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('mycampaigns')}>
                <div className="dash-card-icon">🚀</div>
                <div className="dash-card-title">My Campaigns</div>
                <p className="dash-card-desc">CPV and Participation campaigns you joined. Submit posts and track payments.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('myapps')}>
                <div className="dash-card-icon">🤝</div>
                <div className="dash-card-title">My Applications</div>
                <p className="dash-card-desc">One Time campaign applications. Submit content when approved.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('cpv')}>
                <div className="dash-card-icon">📊</div>
                <div className="dash-card-title">CPV Tracking</div>
                <p className="dash-card-desc">Submit YouTube posts. Track verified views. Earn per milestone automatically.</p>
                <div className="dash-card-action">Track →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('leaderboard')}>
                <div className="dash-card-icon">🏆</div>
                <div className="dash-card-title">CPV Leaderboard</div>
                <p className="dash-card-desc">See top creators across CPV campaigns. Compete for top spot.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('gigs')}>
                <div className="dash-card-icon">⚡</div>
                <div className="dash-card-title">Gig Marketplace</div>
                <p className="dash-card-desc">List your services. Get brand orders directly. Earn consistently.</p>
                <div className="dash-card-action">Manage →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('gigorders')}>
                <div className="dash-card-icon">📦</div>
                <div className="dash-card-title">Gig Orders</div>
                <p className="dash-card-desc">Deliver your gig orders and get paid on approval.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('calendar')}>
                <div className="dash-card-icon">📅</div>
                <div className="dash-card-title">Content Calendar</div>
                <p className="dash-card-desc">All your active campaign deadlines in one place.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('wallet')}>
                <div className="dash-card-icon">💰</div>
                <div className="dash-card-title">Earnings Wallet</div>
                <p className="dash-card-desc">Track all earnings and request withdrawals to your UPI.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('profile')}>
                <div className="dash-card-icon">👤</div>
                <div className="dash-card-title">My Profile</div>
                <p className="dash-card-desc">Complete your creator profile to attract better brand deals.</p>
                <div className="dash-card-action">Edit →</div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-card clickable" onClick={() => setView('create')}>
                <div className="dash-card-icon">📋</div>
                <div className="dash-card-title">Create Campaign</div>
                <p className="dash-card-desc">Launch CPV, Participation, One Time, or Gig campaigns. Creators join instantly.</p>
                <div className="dash-card-action">Create Now →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('manage')}>
                <div className="dash-card-icon">🔍</div>
                <div className="dash-card-title">My Campaigns</div>
                <p className="dash-card-desc">See who joined, submitted content, and manage all payments.</p>
                <div className="dash-card-action">Manage →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('analytics')}>
                <div className="dash-card-icon">📈</div>
                <div className="dash-card-title">Analytics</div>
                <p className="dash-card-desc">Track performance, participants, and ROI across all campaigns.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('cpvdash')}>
                <div className="dash-card-icon">📊</div>
                <div className="dash-card-title">CPV Monitor</div>
                <p className="dash-card-desc">Track views, verify submissions, monitor CPV campaign performance.</p>
                <div className="dash-card-action">Monitor →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('creatorsearch')}>
                <div className="dash-card-icon">🔎</div>
                <div className="dash-card-title">Find Creators</div>
                <p className="dash-card-desc">Search verified creators by niche, followers, and engagement rate.</p>
                <div className="dash-card-action">Search →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('gigs')}>
                <div className="dash-card-icon">⚡</div>
                <div className="dash-card-title">Gig Marketplace</div>
                <p className="dash-card-desc">Browse verified creator gigs. Order instantly. Escrow protected.</p>
                <div className="dash-card-action">Browse →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('gigorders')}>
                <div className="dash-card-icon">📦</div>
                <div className="dash-card-title">Gig Orders</div>
                <p className="dash-card-desc">Review deliveries and approve to release payments.</p>
                <div className="dash-card-action">View →</div>
              </div>
              <div className="dash-card clickable" onClick={() => setView('profile')}>
                <div className="dash-card-icon">🏢</div>
                <div className="dash-card-title">Brand Profile</div>
                <p className="dash-card-desc">Complete your brand profile to build trust with creators.</p>
                <div className="dash-card-action">Edit →</div>
              </div>
            </>
          )}
        </div>

        <div className="dash-models-bar">
          <div className="dash-models-title">VeroLinkr — Campaign Driven Platform</div>
          <div className="dash-models-list">
            {[
              { icon: '📊', name: 'CPV', desc: 'Pay per verified view' },
              { icon: '🚀', name: 'Participation', desc: 'Instant join, fixed payout' },
              { icon: '🤝', name: 'One Time', desc: 'Select specific creators' },
              { icon: '⚡', name: 'Gig', desc: 'On demand content' },
            ].map(m => (
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
          <a href="https://verolinkr.substack.com" target="_blank" rel="noreferrer" className="dash-newsletter-btn">Read Newsletter →</a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
