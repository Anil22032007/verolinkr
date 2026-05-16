import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function Notifications({ user, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    markAllRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  };

  const getIcon = (type) => {
    const icons = {
      approved: '✅',
      rejected: '✕',
      submitted: '📤',
      payment: '💰',
      application: '📋',
      gig: '⚡',
      info: 'ℹ️',
    };
    return icons[type] || 'ℹ️';
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>🔔 Notifications</h1>
          <p>Stay updated on your campaigns and deals</p>
        </div>
      </div>

      {loading ? (
        <div className="campaigns-loading">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">🔔</div>
          <div className="empty-title">No notifications yet</div>
          <p className="empty-desc">You will be notified when brands approve your applications, payments are released, and more.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {notifications.map((n) => (
            <div className={`notification-card ${n.read ? '' : 'unread'}`} key={n.id}>
              <div className="notification-icon">{getIcon(n.type)}</div>
              <div className="notification-body">
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{formatDate(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export async function sendNotification(userId, title, message, type = 'info') {
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    read: false,
  });
}

export default Notifications;
