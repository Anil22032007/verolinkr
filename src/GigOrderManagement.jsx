import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function GigOrderManagement({ user, role, onBack }) {
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState({});
  const [deliveryUrls, setDeliveryUrls] = useState({});
  const [ratings, setRatings] = useState({});
  const [reviewTexts, setReviewTexts] = useState({});
  const [submittingReview, setSubmittingReview] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    const field = role === 'creator' ? 'creator_id' : 'brand_id';
    const { data } = await supabase
      .from('gig_orders')
      .select('*, gigs(title, price, delivery_days, revisions)')
      .eq(field, user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);

    // Fetch existing reviews
    if (data && data.length > 0) {
      const orderIds = data.map(o => o.id);
      const { data: reviewData } = await supabase.from('gig_reviews').select('*').in('order_id', orderIds);
      if (reviewData) {
        const reviewMap = {};
        reviewData.forEach(r => { reviewMap[r.order_id] = r; });
        setReviews(reviewMap);
      }
    }
    setLoading(false);
  };

  const handleDeliver = async (orderId) => {
    const urls = deliveryUrls[orderId] || '';
    if (!urls.trim()) return;
    setDelivering(orderId);

    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    const { error } = await supabase.from('gig_deliveries').insert({
      order_id: orderId,
      creator_id: user.id,
      delivery_note: deliveryNotes[orderId] || '',
      file_urls: urlList,
      status: 'delivered',
    });

    if (!error) {
      await supabase.from('gig_orders').update({ status: 'delivered' }).eq('id', orderId);
      const order = orders.find(o => o.id === orderId);
      if (order?.brand_id) {
        await supabase.from('notifications').insert({
          user_id: order.brand_id,
          title: '📦 Gig Delivered!',
          message: `A creator has delivered your gig order for "${order.gigs?.title}". Review and approve to release payment.`,
          type: 'submitted', read: false,
        });
      }
      setSuccess('Delivery submitted! Brand will review and approve payment.');
      setTimeout(() => setSuccess(''), 4000);
      fetchOrders();
    }
    setDelivering(null);
  };

  const handleApprove = async (orderId, creatorId, gigId) => {
    await supabase.from('gig_orders').update({ status: 'completed' }).eq('id', orderId);
    await supabase.from('notifications').insert({
      user_id: creatorId,
      title: '💰 Gig Payment Released!',
      message: 'Your gig delivery has been approved. Payment has been released to your wallet.',
      type: 'payment', read: false,
    });
    setSuccess('Delivery approved! Payment released to creator.');
    setTimeout(() => setSuccess(''), 4000);
    fetchOrders();
  };

  const handleRevision = async (orderId, creatorId) => {
    await supabase.from('gig_orders').update({ status: 'revision_requested' }).eq('id', orderId);
    await supabase.from('notifications').insert({
      user_id: creatorId,
      title: '↩ Revision Requested',
      message: 'The brand has requested changes to your gig delivery. Please revise and resubmit.',
      type: 'info', read: false,
    });
    setSuccess('Revision requested. Creator has been notified.');
    setTimeout(() => setSuccess(''), 4000);
    fetchOrders();
  };

  const handleReview = async (order) => {
    const rating = ratings[order.id];
    if (!rating) return;
    setSubmittingReview(order.id);

    const { error } = await supabase.from('gig_reviews').insert({
      gig_id: order.gig_id,
      order_id: order.id,
      brand_id: user.id,
      creator_id: order.creator_id,
      rating,
      review: reviewTexts[order.id] || '',
    });

    if (!error) {
      setSuccess('Review submitted! Thank you for your feedback.');
      setTimeout(() => setSuccess(''), 3000);
      fetchOrders();
    }
    setSubmittingReview(null);
  };

  const getStatusInfo = (status) => ({
    pending: { color: '#FFB347', label: '⏳ Pending — awaiting delivery' },
    delivered: { color: '#8ab4f8', label: '📦 Delivered — Under Review' },
    revision_requested: { color: '#FFB347', label: '↩ Revision Requested' },
    completed: { color: '#5DCAA5', label: '✅ Completed' },
  }[status] || { color: 'var(--vero-muted)', label: status });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const renderStars = (rating) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  if (loading) return <div className="campaigns-loading">Loading orders...</div>;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>📦 {role === 'creator' ? 'My Gig Orders' : 'Gig Orders'}</h1>
          <p>{role === 'creator' ? 'Deliver orders and get paid' : 'Review deliveries and release payments'}</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      {orders.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No orders yet</div>
          <p className="empty-desc">{role === 'creator' ? 'Brand orders will appear here once they purchase your gigs.' : 'Place gig orders from the marketplace to see them here.'}</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isCreator = role === 'creator';
            const existingReview = reviews[order.id];

            return (
              <div className="campaign-card" key={order.id}>
                <div className="campaign-top">
                  <div>
                    <h2 className="campaign-title">{order.gigs?.title || 'Gig Order'}</h2>
                    <div style={{ fontSize: '0.72rem', color: statusInfo.color, fontWeight: 500, marginTop: '4px' }}>{statusInfo.label}</div>
                  </div>
                  <div className="campaign-budget">₹{Number(order.gigs?.price || 0).toLocaleString()}</div>
                </div>

                <div className="campaign-meta">
                  <div className="meta-item"><span className="meta-label">Delivery</span><span className="meta-value">{order.gigs?.delivery_days} days</span></div>
                  <div className="meta-item"><span className="meta-label">Revisions</span><span className="meta-value">{order.gigs?.revisions} included</span></div>
                  <div className="meta-item"><span className="meta-label">Ordered</span><span className="meta-value">{formatDate(order.created_at)}</span></div>
                </div>

                {order.requirements && (
                  <div className="app-your-message">
                    <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Requirements</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--vero-muted)', lineHeight: 1.6, fontWeight: 300 }}>{order.requirements}</p>
                  </div>
                )}

                {/* Creator delivery form */}
                {isCreator && (order.status === 'pending' || order.status === 'revision_requested') && (
                  <div className="submission-form">
                    <div className="submission-title">📦 Submit Your Delivery</div>
                    <p className="submission-desc">Paste file links below. One link per line (Google Drive, Dropbox, etc.)</p>
                    <div className="field" style={{ marginBottom: '0.75rem' }}>
                      <label>File Links (one per line)</label>
                      <textarea placeholder="https://drive.google.com/..." rows={3} value={deliveryUrls[order.id] || ''} onChange={e => setDeliveryUrls(p => ({ ...p, [order.id]: e.target.value }))} />
                    </div>
                    <div className="field" style={{ marginBottom: '1rem' }}>
                      <label>Delivery Note (optional)</label>
                      <textarea placeholder="Notes about your delivery..." rows={2} value={deliveryNotes[order.id] || ''} onChange={e => setDeliveryNotes(p => ({ ...p, [order.id]: e.target.value }))} />
                    </div>
                    <button className="apply-btn" onClick={() => handleDeliver(order.id)} disabled={delivering === order.id || !(deliveryUrls[order.id] || '').trim()}>
                      {delivering === order.id ? 'Submitting...' : 'Submit Delivery →'}
                    </button>
                  </div>
                )}

                {/* Brand review buttons */}
                {!isCreator && order.status === 'delivered' && (
                  <div className="app-actions" style={{ marginTop: '0.75rem' }}>
                    <button className="approve-btn" onClick={() => handleApprove(order.id, order.creator_id, order.gig_id)}>✅ Approve & Release Payment</button>
                    <button className="reject-btn" onClick={() => handleRevision(order.id, order.creator_id)}>↩ Request Revision</button>
                  </div>
                )}

                {/* Gig review after completion */}
                {!isCreator && order.status === 'completed' && !existingReview && (
                  <div className="submission-form" style={{ marginTop: '0.75rem' }}>
                    <div className="submission-title">⭐ Leave a Review</div>
                    <p className="submission-desc">Help other brands by rating this creator's work.</p>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={`star ${(ratings[order.id] || 0) >= star ? 'active' : ''}`}
                          onClick={() => setRatings(p => ({ ...p, [order.id]: star }))}
                        >⭐</span>
                      ))}
                    </div>
                    <div className="field" style={{ marginBottom: '1rem' }}>
                      <label>Review (optional)</label>
                      <textarea placeholder="How was working with this creator?" rows={2} value={reviewTexts[order.id] || ''} onChange={e => setReviewTexts(p => ({ ...p, [order.id]: e.target.value }))} />
                    </div>
                    <button className="apply-btn" onClick={() => handleReview(order)} disabled={!ratings[order.id] || submittingReview === order.id}>
                      {submittingReview === order.id ? 'Submitting...' : 'Submit Review →'}
                    </button>
                  </div>
                )}

                {/* Show existing review */}
                {existingReview && (
                  <div className="review-display">
                    <span className="review-stars">{renderStars(existingReview.rating)}</span>
                    {existingReview.review && <span className="review-text">"{existingReview.review}"</span>}
                  </div>
                )}

                {order.status === 'completed' && !existingReview && isCreator && (
                  <div className="applied-badge">💰 Payment released to your wallet</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GigOrderManagement;
