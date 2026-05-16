import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function EarningsWallet({ user, onBack }) {
  const [, setEarnings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [cpvSubmissions, setCpvSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [success, setSuccess] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    fetchAllEarnings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllEarnings = async () => {
    // Completed campaign applications
    const { data: apps } = await supabase
      .from('applications')
      .select('*, campaigns(title, budget, payout_per_post, cpv_rate, campaign_type)')
      .eq('creator_id', user.id)
      .eq('status', 'completed');

    // CPV submissions
    const { data: cpv } = await supabase
      .from('cpv_submissions')
      .select('*, campaigns(title, cpv_rate)')
      .eq('creator_id', user.id)
      .eq('verified', true);

    setApplications(apps || []);
    setCpvSubmissions(cpv || []);
    setLoading(false);
  };

  const calculateAppEarning = (app) => {
    if (!app.campaigns) return 0;
    if (app.campaigns.campaign_type === 'participation') return app.campaigns.payout_per_post || 0;
    if (app.campaigns.campaign_type === 'one_time') return app.campaigns.budget || 0;
    return 0;
  };

  const calculateCPVEarning = (sub) => {
    if (!sub.campaigns) return 0;
    return Math.floor(sub.view_count * sub.campaigns.cpv_rate);
  };

  const totalFromApps = applications.reduce((sum, a) => sum + calculateAppEarning(a), 0);
  const totalFromCPV = cpvSubmissions.reduce((sum, s) => sum + calculateCPVEarning(s), 0);
  const totalEarned = totalFromApps + totalFromCPV;
  const platformFee = Math.round(totalEarned * 0.05);
  const withdrawable = totalEarned - platformFee;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawing(true);

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Withdrawal Request Received',
      message: `Your withdrawal request of ₹${withdrawable.toLocaleString('en-IN')} to UPI ${upiId} has been received. We will process it within 24 hours.`,
      type: 'payment',
    });

    setSuccess(`Withdrawal request submitted! ₹${withdrawable.toLocaleString('en-IN')} will be sent to ${upiId} within 24 hours.`);
    setShowWithdraw(false);
    setUpiId('');
    setWithdrawing(false);
    setTimeout(() => setSuccess(''), 5000);
  };

  const formatNum = (n) => Number(n || 0).toLocaleString('en-IN');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  if (loading) return <div className="campaigns-loading">Loading wallet...</div>;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>💰 Earnings Wallet</h1>
          <p>Track your earnings and request withdrawals</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      <div className="form-card">
        {/* Wallet summary */}
        <div className="wallet-summary">
          <div className="wallet-stat">
            <div className="wallet-stat-num">₹{formatNum(totalEarned)}</div>
            <div className="wallet-stat-label">Total Earned</div>
          </div>
          <div className="wallet-stat">
            <div className="wallet-stat-num">₹{formatNum(platformFee)}</div>
            <div className="wallet-stat-label">Platform Fee (5%)</div>
          </div>
          <div className="wallet-stat highlight">
            <div className="wallet-stat-num">₹{formatNum(withdrawable)}</div>
            <div className="wallet-stat-label">Available to Withdraw</div>
          </div>
        </div>

        {withdrawable > 0 ? (
          !showWithdraw ? (
            <button className="form-submit" onClick={() => setShowWithdraw(true)} style={{ marginBottom: '2rem' }}>
              Request Withdrawal →
            </button>
          ) : (
            <form onSubmit={handleWithdraw} className="form-body" style={{ marginBottom: '2rem' }}>
              <div className="field">
                <label>Your UPI ID</label>
                <input
                  type="text"
                  placeholder="yourname@upi or phone@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              </div>
              <div className="escrow-note">
                <div className="escrow-note-icon">💰</div>
                <div>
                  <div className="escrow-note-title">₹{formatNum(withdrawable)} will be sent to your UPI</div>
                  <div className="escrow-note-desc">Processing time: within 24 hours. Manual processing until Razorpay Route is activated.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="form-submit" disabled={withdrawing}>
                  {withdrawing ? 'Submitting...' : 'Confirm Withdrawal →'}
                </button>
                <button type="button" className="btn-secondary" style={{ padding: '0.9rem', borderRadius: '8px' }} onClick={() => setShowWithdraw(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="cpv-manual-note" style={{ marginBottom: '2rem' }}>
            Complete campaigns to start earning. Your withdrawable balance will appear here.
          </div>
        )}

        {/* Earnings history */}
        <div className="cpv-section-title" style={{ marginBottom: '1rem' }}>Earnings History</div>

        {applications.length === 0 && cpvSubmissions.length === 0 ? (
          <div className="campaigns-empty" style={{ padding: '2rem 0' }}>
            <div className="empty-icon">📋</div>
            <div className="empty-title">No earnings yet</div>
            <p className="empty-desc">Complete campaigns to start earning. Your payment history will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.map((app) => (
              <div className="earning-item" key={app.id}>
                <div className="earning-item-left">
                  <div className="earning-item-icon">🤝</div>
                  <div>
                    <div className="earning-item-title">{app.campaigns?.title || 'Campaign'}</div>
                    <div className="earning-item-type">{app.campaigns?.campaign_type?.replace('_', ' ')} campaign · {formatDate(app.created_at)}</div>
                  </div>
                </div>
                <div className="earning-item-amount">+₹{formatNum(calculateAppEarning(app))}</div>
              </div>
            ))}
            {cpvSubmissions.map((sub) => (
              <div className="earning-item" key={sub.id}>
                <div className="earning-item-left">
                  <div className="earning-item-icon">📊</div>
                  <div>
                    <div className="earning-item-title">{sub.campaigns?.title || 'CPV Campaign'}</div>
                    <div className="earning-item-type">{formatNum(sub.view_count)} verified views · {formatDate(sub.created_at)}</div>
                  </div>
                </div>
                <div className="earning-item-amount">+₹{formatNum(calculateCPVEarning(sub))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EarningsWallet;
