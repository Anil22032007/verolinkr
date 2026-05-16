import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

// Admin email — only this account sees the admin panel
const ADMIN_EMAIL = 'prajapatiab534@gmail.com';

function AdminPanel({ user, onBack }) {
  const [tab, setTab] = useState('overview');
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    const [campsRes, paymentsRes, appsRes] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*, campaigns(title)').order('created_at', { ascending: false }).limit(50),
    ]);
    setCampaigns(campsRes.data || []);
    setPayments(paymentsRes.data || []);
    setApplications(appsRes.data || []);
    setLoading(false);
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const platformRevenue = Math.round(totalRevenue * 0.05);

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="form-wrap">
        <div className="form-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <div className="form-header-text"><h1>Admin Panel</h1></div>
        </div>
        <div className="campaigns-empty">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Access Denied</div>
          <p className="empty-desc">This panel is only accessible to VeroLinkr administrators.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="campaigns-loading">Loading admin data...</div>;

  const openCampaigns = campaigns.filter(c => c.status === 'open').length;
  const fundedCampaigns = campaigns.filter(c => c.escrow_status === 'funded').length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const completedApps = applications.filter(a => a.status === 'completed').length;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>⚙️ Admin Panel</h1>
          <p>VeroLinkr platform management</p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 2.5rem' }}>

        {/* Overview stats */}
        <div className="cpv-live-stats" style={{ marginBottom: '2rem' }}>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{campaigns.length}</div>
            <div className="cpv-stat-label">Total Campaigns</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{openCampaigns}</div>
            <div className="cpv-stat-label">Open</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{fundedCampaigns}</div>
            <div className="cpv-stat-label">Escrow Funded</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">₹{formatNum(platformRevenue)}</div>
            <div className="cpv-stat-label">Platform Revenue</div>
          </div>
        </div>

        <div className="cpv-live-stats" style={{ marginBottom: '2rem' }}>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{applications.length}</div>
            <div className="cpv-stat-label">Total Applications</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{pendingApps}</div>
            <div className="cpv-stat-label">Pending Review</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">{completedApps}</div>
            <div className="cpv-stat-label">Completed</div>
          </div>
          <div className="cpv-stat">
            <div className="cpv-stat-num">₹{formatNum(totalRevenue)}</div>
            <div className="cpv-stat-label">Total Processed</div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="filter-bar" style={{ padding: '0 0 1.5rem' }}>
          {['campaigns', 'applications', 'payments'].map((t) => (
            <button key={t} className={`filter-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Campaigns tab */}
        {tab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campaigns.map((c) => (
              <div className="application-card" key={c.id}>
                <div className="app-top">
                  <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--vero-text)' }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className={`campaign-type-badge ${c.campaign_type}`}>{c.campaign_type}</div>
                    <div className={`status-badge ${c.status}`}>{c.status}</div>
                  </div>
                </div>
                <div className="campaign-meta" style={{ margin: '0.5rem 0 0' }}>
                  <div className="meta-item"><span className="meta-label">Budget</span><span className="meta-value">₹{formatNum(c.budget)}</span></div>
                  <div className="meta-item"><span className="meta-label">Escrow</span><span className="meta-value" style={{ color: c.escrow_status === 'funded' ? '#5DCAA5' : '#FFB347' }}>{c.escrow_status || 'unfunded'}</span></div>
                  <div className="meta-item"><span className="meta-label">Created</span><span className="meta-value">{formatDate(c.created_at)}</span></div>
                  <div className="meta-item"><span className="meta-label">Niche</span><span className="meta-value">{c.niche}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Applications tab */}
        {tab === 'applications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.map((a) => (
              <div className="application-card" key={a.id}>
                <div className="app-top">
                  <div style={{ fontSize: '0.85rem', color: 'var(--vero-muted)' }}>{a.campaigns?.title || 'Unknown Campaign'}</div>
                  <div className={`app-status ${a.status}`}>{a.status}</div>
                </div>
                <p className="app-message">{a.message}</p>
                {a.submission_url && (
                  <a href={a.submission_url} target="_blank" rel="noreferrer" className="submission-link">{a.submission_url} ↗</a>
                )}
                <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', marginTop: '0.5rem' }}>
                  {formatDate(a.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments tab */}
        {tab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {payments.length === 0 ? (
              <div className="campaigns-empty">
                <div className="empty-icon">💰</div>
                <div className="empty-title">No payments yet</div>
                <p className="empty-desc">Payments will appear here once brands fund their campaigns.</p>
              </div>
            ) : (
              payments.map((p) => (
                <div className="application-card" key={p.id}>
                  <div className="app-top">
                    <div style={{ fontWeight: 500, color: 'var(--vero-text)', fontSize: '0.9rem' }}>
                      ₹{formatNum(p.amount)}
                    </div>
                    <div className={`app-status ${p.status}`}>{p.status}</div>
                  </div>
                  <div className="campaign-meta" style={{ margin: '0.5rem 0 0' }}>
                    <div className="meta-item"><span className="meta-label">Razorpay Order</span><span className="meta-value" style={{ fontSize: '0.72rem' }}>{p.razorpay_order_id}</span></div>
                    <div className="meta-item"><span className="meta-label">Payment ID</span><span className="meta-value" style={{ fontSize: '0.72rem' }}>{p.razorpay_payment_id}</span></div>
                    <div className="meta-item"><span className="meta-label">Platform Fee</span><span className="meta-value">₹{formatNum(Math.round(p.amount * 0.05))}</span></div>
                    <div className="meta-item"><span className="meta-label">Date</span><span className="meta-value">{formatDate(p.created_at)}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
