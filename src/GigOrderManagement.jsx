import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function GigOrderManagement({ user, role, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState({});
  const [deliveryUrls, setDeliveryUrls] = useState({});
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
    setLoading(false);
  };

  const handleDeliver = async (orderId, gigId) => {
    const note = deliveryNotes[orderId] || '';
    const urls = deliveryUrls[orderId] || '';
    if (!urls.trim()) return;
    setDelivering(orderId);

    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);

    const { error } = await supabase.from('gig_deliveries').insert({
      order_id: orderId,
      creator_id: user.id,
      delivery_note: note,
      file_urls: urlList,
      status: 'delivered',
    });

    if (!error) {
      await supabase.from('gig_orders').update({ status: 'delivered' }).eq('id', orderId);

      // Notify brand
      const order = orders.find(o => o.id === orderId);
      if (order?.brand_id) {
        await supabase.from('notifications').insert({
          user_id: order.brand_id,
          title: '📦 Gig Delivered!',
          message: `A creator has delivered your gig order. Review the delivery and approve to release payment.`,
          type: 'submitted',
          read: false,
        });
      }

      setSuccess('Delivery submitted! Brand will review and approve payment.');
      setTimeout(() => setSuccess(''), 4000);
      fetchOrders();
    }
    setDelivering(null);
  };

  const handleApprove = async (orderId, creatorId) => {
    await supabase.from('gig_orders').update({ status: 'completed' }).eq('id', orderId);
    await supabase.from('notifications').insert({
      user_id: creatorId,
      title: '💰 Gig Payment Released!',
      message: 'Your gig delivery has been approved. Payment has been released to your wallet.',
      type: 'payment',
      read: false,
    });
    setSuccess('Delivery approved! Payment released to creator.');
    setTimeout(() => setSuccess(''), 4000);
    fetchOrders();
  };

  const handleRequestRevision = async (orderId, creatorId) => {
    await supabase.from('gig_orders').update({ status: 'revision_requested' }).eq('id', orderId);
    await supabase.from('notifications').insert({
      user_id: creatorId,
      title: '↩ Revision Requested',
      message: 'The brand has requested changes to your gig delivery. Please revise and resubmit.',
      type: 'info',
      read: false,
    });
    setSuccess('Revision requested. Creator has been notified.');
    setTimeout(() => setSuccess(''), 4000);
    fetchOrders();
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { color: '#FFB347', label: '⏳ Pending' },
      delivered: { color: '#8ab4f8', label: '📦 Delivered — Under Review' },
      revision_requested: { color: '#FFB347', label: '↩ Revision Requested' },
      completed: { color: '#5DCAA5', label: '✅ Completed' },
    };
    return styles[status] || { color: 'var(--vero-muted)', label: status };
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  if (loading) return <div className="campaigns-loading">Loading orders...</div>;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>⚡ {role === 'creator' ? 'My Gig Orders' : 'Gig Orders'}</h1>
          <p>{role === 'creator' ? 'Deliver your gig orders and get paid' : 'Review gig deliveries and release payments'}</p>
        </div>
      </div>

      {success && <div className="global-success">{success}</div>}

      {orders.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">⚡</div>
          <div className="empty-title">No orders yet</div>
          <p className="empty-desc">{role === 'creator' ? 'Brand orders will appear here once they purchase your gigs.' : 'Place gig orders from the marketplace to see them here.'}</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {orders.map((order) => {
            const statusInfo = getStatusStyle(order.status);
            const isCreator = role === 'creator';

            return (
              <div className="campaign-card" key={order.id}>
                <div className="campaign-top">
                  <div>
                    <h2 className="campaign-title">{order.gigs?.title || 'Gig Order'}</h2>
                    <div style={{ fontSize: '0.72rem', color: statusInfo.color, fontWeight: 500, marginTop: '4px' }}>
                      {statusInfo.label}
                    </div>
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
                    <div className="meta-label" style={{ marginBottom: '0.4rem' }}>Brand requirements</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--vero-muted)', lineHeight: 1.6, fontWeight: 300 }}>{order.requirements}</p>
                  </div>
                )}

                {/* Creator delivery form */}
                {isCreator && (order.status === 'pending' || order.status === 'revision_requested') && (
                  <div className="submission-form">
                    <div className="submission-title">📦 Submit Your Delivery</div>
                    <p className="submission-desc">Paste the links to your delivered files below (Google Drive, Dropbox, or direct links). One link per line.</p>
                    <div className="field" style={{ marginBottom: '0.75rem' }}>
                      <label>File Links (one per line)</label>
                      <textarea
                        placeholder="https://drive.google.com/...&#10;https://dropbox.com/..."
                        rows={3}
                        value={deliveryUrls[order.id] || ''}
                        onChange={e => setDeliveryUrls(p => ({ ...p, [order.id]: e.target.value }))}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: '1rem' }}>
                      <label>Delivery Note (optional)</label>
                      <textarea
                        placeholder="Any notes about your delivery, creative choices, or revision details..."
                        rows={2}
                        value={deliveryNotes[order.id] || ''}
                        onChange={e => setDeliveryNotes(p => ({ ...p, [order.id]: e.target.value }))}
                      />
                    </div>
                    <button
                      className="apply-btn"
                      onClick={() => handleDeliver(order.id, order.gig_id)}
                      disabled={delivering === order.id || !(deliveryUrls[order.id] || '').trim()}
                    >
                      {delivering === order.id ? 'Submitting...' : 'Submit Delivery →'}
                    </button>
                  </div>
                )}

                {/* Show delivery for brand review */}
                {!isCreator && order.status === 'delivered' && (
                  <div className="app-actions" style={{ marginTop: '0.75rem' }}>
                    <button className="approve-btn" onClick={() => handleApprove(order.id, order.creator_id)}>✅ Approve & Release Payment</button>
                    <button className="reject-btn" onClick={() => handleRequestRevision(order.id, order.creator_id)}>↩ Request Revision</button>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="applied-badge">💰 {isCreator ? 'Payment released to your wallet' : 'Payment released to creator'}</div>
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
