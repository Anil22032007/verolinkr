import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;
const SUPABASE_URL = 'https://sxmtdqktimpwxjtudtfi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bXRkcWt0aW1wd3hqdHVkdGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDYzODIsImV4cCI6MjA5NDIyMjM4Mn0.hI7C3mvEm3ROLO8-mlb6O5xL5P32rfx1roTALgA7AjM';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Payment({ campaign, user, onBack, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    checkIfPaid();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIfPaid = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'paid')
      .single();
    if (data) setIsPaid(true);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load. Check your internet connection.');

      // Create order via Supabase Edge Function
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: campaign.budget,
          currency: 'INR',
          receipt: `c_${campaign.id.substring(0, 30)}`,
          notes: {
            campaign_id: campaign.id,
            campaign_title: campaign.title,
            brand_id: user.id,
          },
        }),
      });

      const order = await res.json();
      if (order.error) throw new Error(order.error);

      // Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'VeroLinkr',
        description: `Escrow: ${campaign.title}`,
        order_id: order.id,
        handler: async (response) => {
          // Verify payment
          const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaign_id: campaign.id,
              user_id: user.id,
              amount: campaign.budget,
            }),
          });

          const result = await verifyRes.json();
          if (result.error) throw new Error(result.error);

          setIsPaid(true);
          onSuccess && onSuccess();
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#FF5C35',
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const formatBudget = (amount) => '₹' + Number(amount).toLocaleString('en-IN');

  if (isPaid) {
    return (
      <div className="payment-success">
        <div className="payment-success-icon">🔒</div>
        <div className="payment-success-title">Escrow Funded!</div>
        <p className="payment-success-desc">
          {formatBudget(campaign.budget)} is secured in escrow for this campaign.
          Creators will be paid automatically upon your approval.
        </p>
        <button className="form-submit" onClick={onBack} style={{ marginTop: '1.5rem' }}>
          Back to Campaign →
        </button>
      </div>
    );
  }

  return (
    <div className="payment-wrap">
      <div className="payment-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>Fund Escrow</h1>
          <p>Secure your campaign budget before creators start</p>
        </div>
      </div>

      <div className="payment-card">
        <div className="payment-campaign-info">
          <div className="payment-campaign-title">{campaign.title}</div>
          <div className="payment-campaign-type">{campaign.niche} · {campaign.campaign_type?.replace('_', ' ')}</div>
        </div>

        <div className="payment-breakdown">
          <div className="payment-row">
            <span>Campaign Budget</span>
            <span>{formatBudget(campaign.budget)}</span>
          </div>
          <div className="payment-row">
            <span>Platform Fee (5%)</span>
            <span>{formatBudget(Math.round(campaign.budget * 0.05))}</span>
          </div>
          <div className="payment-divider" />
          <div className="payment-row total">
            <span>Total to pay</span>
            <span>{formatBudget(Math.round(campaign.budget * 1.05))}</span>
          </div>
        </div>

        <div className="escrow-note" style={{ marginBottom: '1.5rem' }}>
          <div className="escrow-note-icon">🔒</div>
          <div>
            <div className="escrow-note-title">100% Escrow Protected</div>
            <div className="escrow-note-desc">
              Your money is held securely. Creators only get paid when you approve their content.
              Unused budget is refunded automatically.
            </div>
          </div>
        </div>

        <div className="payment-features">
          {[
            '✅ Creators paid within 48 hours of approval',
            '✅ Unused budget refunded automatically',
            '✅ Zero risk — pay only for verified delivery',
            '✅ VeroLinkr dispute resolution if needed',
          ].map((f) => (
            <div className="payment-feature" key={f}>{f}</div>
          ))}
        </div>

        {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <button
          className="form-submit"
          onClick={handlePayment}
          disabled={loading}
          style={{ fontSize: '1rem', padding: '1rem' }}
        >
          {loading ? 'Opening Payment...' : `Pay ${formatBudget(Math.round(campaign.budget * 1.05))} & Fund Escrow →`}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--vero-muted)', marginTop: '0.75rem' }}>
          Secured by Razorpay · 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
}

export default Payment;
