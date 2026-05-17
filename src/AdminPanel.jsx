import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const ADMIN_EMAIL = 'prajapatiab534@gmail.com';

function AdminPanel({ user, onBack }) {
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    const [campsRes, paymentsRes, appsRes, withdrawRes] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*, campaigns(title)').order('created_at', { ascending: false }).limit(50),
      supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false }),
    ]);
    setCampaigns(campsRes.data || []);
    setPayments(paymentsRes.data || []);
    setApplications(appsRes.data || []);
    setWithdrawals(withdrawRes.data || []);
    setLoading(false);
  };

  const markWithdrawalPaid = async (id, creatorId, amount) => {
    await supabase.from('withdrawal_requests').update({ status: 'paid' }).eq('id', id);
    await supabase.from('notifications').insert({
      user_id: creatorId,
      title: '💰 Withdrawal Processed!',
      message: `Your withdrawal of ₹${amount.toLocaleString('en-IN')} has been sent to your UPI. Check your account.`,
      type: 'payment',
      read: false,
    });
    fetchAll();
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const platformRevenue = Math.round(totalRevenue * 0.05);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

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
        <div className="cpv-live-stats" style={{ marginBottom: '1.5rem' }}>
          <div className="cpv-stat"><div className="cpv-stat-num">{campaigns.length}</div><div className="cpv-stat-label">Campaigns</div></div>
          <div className="cpv-stat"><div className="cpv-stat-num">{applications.length}</div><div className="cpv-stat-label">Applications</div></div>
          <div className="cpv-stat"><div className="cpv-stat-num">₹{formatNum(platformRevenue)}</div><div className="cpv-stat-label">Revenue (5%)</div></div>
          <div className="cpv-stat"><div className="cpv-stat-num" style={{ color: pendingWithdrawals.length > 0 ? '#FFB347' : 'var(--vero-accent)' }}>{pendingWithdrawals.length}</div><div className="cpv-stat-label">Pending Withdrawals</div></div>
        </div>

        {pendingWithdrawals.length > 0 && (
          <div className="cpv-manual-note" style={{ marginBottom: '1.5rem' }}>
            ⚠️ {pendingWithdrawals.length} withdrawal request{pendingWithdrawals.length > 1 ? 's' : ''} pending — ₹{formatNum(pendingAmount)} total. Process these via UPI and mark as paid.
          </div>
        )}

        <div className="filter-bar" style={{ padding: '0 0 1.5rem' }}>
          {['campaigns', 'applications', 'withdrawals', 'payments'].map(t => (
            <button key={t} className={`filter-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'withdrawals' && pendingWithdrawals.length > 0 && <span className="notif-badge" style={{ marginLeft: '6px' }}>{pendingWithdrawals.length}</span>}
            </button>
          ))}
        </div>

        {tab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campaigns.map(c => (
              <div className="application-card" key={c.id}>
                <div className="app-top">
                  <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--vero-text)' }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className={`campaign-type-badge ${c.campaign_type}`}>{c.campaign_type}</div>
                    <div className={`status-badge ${c.status}`}>{c.status}</div>
                  </div>
                </div>
                <div className="campaign-meta" style={{ margin: '0.5rem 0 0' }}>
                  <div className="meta-item"><span className="meta-label">Budget</span><span className="meta-value">₹{formatNum(c.budget)}</span></div>
                  <div className="meta-item"><span className="meta-label">Escrow</span><span className="meta-value" style={{ color: c.escrow_status === 'funded' ? '#5DCAA5' : '#FFB347' }}>{c.escrow_status || 'unfunded'}</span></div>
                  <div className="meta-item"><span className="meta-label">Niche</span><span className="meta-value">{c.niche}</span></div>
                  <div className="meta-item"><span className="meta-label">Created</span><span className="meta-value">{formatDate(c.created_at)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'applications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.map(a => (
              <div className="application-card" key={a.id}>
                <div className="app-top">
                  <div style={{ fontSize: '0.85rem', color: 'var(--vero-muted)' }}>{a.campaigns?.title || 'Unknown Campaign'}</div>
                  <div className={`app-status ${a.status}`}>{a.status}</div>
                </div>
                <p className="app-message">{a.message}</p>
                {a.submission_url && <a href={a.submission_url} target="_blank" rel="noreferrer" className="submission-link">{a.submission_url} ↗</a>}
                <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', marginTop: '0.5rem' }}>{formatDate(a.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'withdrawals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {withdrawals.length === 0 ? (
              <div className="campaigns-empty"><div className="empty-icon">💸</div><div className="empty-title">No withdrawals yet</div></div>
            ) : (
              withdrawals.map(w => (
                <div className="application-card" key={w.id} style={{ borderColor: w.status === 'pending' ? 'rgba(255,179,71,0.3)' : 'var(--vero-border)' }}>
                  <div className="app-top">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--vero-text)', fontFamily: 'Syne, sans-serif' }}>₹{formatNum(w.amount)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--vero-muted)', marginTop: '2px' }}>UPI: {w.upi_id}</div>
                    </div>
                    <div style={{ color: w.status === 'paid' ? '#5DCAA5' : '#FFB347', fontWeight: 500, fontSize: '0.82rem' }}>
                      ● {w.status}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--vero-muted)', margin: '0.5rem 0' }}>{formatDate(w.created_at)}</div>
                  {w.status === 'pending' && (
                    <button className="approve-btn" onClick={() => markWithdrawalPaid(w.id, w.creator_id, w.amount)}>
                      ✅ Mark as Paid — Send ₹{formatNum(w.amount)} to {w.upi_id}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {payments.length === 0 ? (
              <div className="campaigns-empty"><div className="empty-icon">💰</div><div className="empty-title">No payments yet</div></div>
            ) : (
              payments.map(p => (
                <div className="application-card" key={p.id}>
                  <div className="app-top">
                    <div style={{ fontWeight: 500, color: 'var(--vero-text)', fontSize: '0.9rem' }}>₹{formatNum(p.amount)}</div>
                    <div className={`app-status ${p.status}`}>{p.status}</div>
                  </div>
                  <div className="campaign-meta" style={{ margin: '0.5rem 0 0' }}>
                    <div className="meta-item"><span className="meta-label">Platform Fee</span><span className="meta-value">₹{formatNum(Math.round(p.amount * 0.05))}</span></div>
                    <div className="meta-item"><span className="meta-label">Date</span><span className="meta-value">{formatDate(p.created_at)}</span></div>
                    <div className="meta-item"><span className="meta-label">Order ID</span><span className="meta-value" style={{ fontSize: '0.72rem' }}>{p.razorpay_order_id}</span></div>
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
