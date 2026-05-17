import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './Forms.css';

function ContentCalendar({ user, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    const [appsRes, gigsRes] = await Promise.all([
      supabase.from('applications').select('*, campaigns(title, deadline, deliverables, platform, campaign_type)').eq('creator_id', user.id).in('status', ['approved', 'submitted']),
      supabase.from('gig_orders').select('*, gigs(title, delivery_days)').eq('creator_id', user.id).in('status', ['pending', 'revision_requested']),
    ]);

    const calItems = [];

    (appsRes.data || []).forEach(app => {
      if (app.campaigns) {
        calItems.push({
          id: app.id,
          type: 'campaign',
          title: app.campaigns.title,
          deadline: app.campaigns.deadline,
          deliverables: app.campaigns.deliverables,
          platform: app.campaigns.platform,
          campaign_type: app.campaigns.campaign_type,
          status: app.status,
        });
      }
    });

    (gigsRes.data || []).forEach(order => {
      if (order.gigs) {
        const deadline = new Date(order.created_at);
        deadline.setDate(deadline.getDate() + (order.gigs.delivery_days || 3));
        calItems.push({
          id: order.id,
          type: 'gig',
          title: order.gigs.title,
          deadline: deadline.toISOString(),
          deliverables: 'Gig delivery',
          platform: 'Gig',
          status: order.status,
        });
      }
    });

    calItems.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    setItems(calItems);
    setLoading(false);
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyColor = (days) => {
    if (days === null) return 'var(--vero-muted)';
    if (days < 0) return '#F09595';
    if (days <= 2) return '#F09595';
    if (days <= 5) return '#FFB347';
    return '#5DCAA5';
  };

  const getUrgencyLabel = (days) => {
    if (days === null) return 'No deadline';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today!';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'No deadline';

  const MODEL_ICONS = { cpv: '📊', participation: '🚀', one_time: '🤝', gig: '⚡' };

  if (loading) return <div className="campaigns-loading">Loading calendar...</div>;

  return (
    <div className="form-wrap">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="form-header-text">
          <h1>📅 Content Calendar</h1>
          <p>All your active campaign deadlines in one place</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="campaigns-empty">
          <div className="empty-icon">📅</div>
          <div className="empty-title">No active deadlines</div>
          <p className="empty-desc">Apply to campaigns and accept gig orders to see your content calendar here.</p>
        </div>
      ) : (
        <div className="campaigns-list">
          {items.map((item) => {
            const days = getDaysLeft(item.deadline);
            const urgencyColor = getUrgencyColor(days);

            return (
              <div className="campaign-card" key={item.id} style={{ borderLeft: `3px solid ${urgencyColor}` }}>
                <div className="campaign-top">
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div className="campaign-niche">{MODEL_ICONS[item.campaign_type || item.type]} {item.platform}</div>
                      <div className="app-status" style={{ background: 'transparent', border: 'none', color: item.status === 'submitted' ? '#8ab4f8' : '#5DCAA5', fontWeight: 500, fontSize: '0.75rem' }}>
                        ● {item.status}
                      </div>
                    </div>
                    <h2 className="campaign-title">{item.title}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: urgencyColor, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                      {getUrgencyLabel(days)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--vero-muted)', marginTop: '2px' }}>
                      {formatDate(item.deadline)}
                    </div>
                  </div>
                </div>

                <div className="campaign-meta">
                  <div className="meta-item">
                    <span className="meta-label">Deliverables</span>
                    <span className="meta-value">{item.deliverables}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Status</span>
                    <span className="meta-value" style={{ textTransform: 'capitalize' }}>{item.status?.replace('_', ' ')}</span>
                  </div>
                </div>

                {days !== null && days <= 2 && days >= 0 && (
                  <div className="cpv-manual-note" style={{ borderColor: 'rgba(240,149,149,0.3)', color: '#F09595', background: 'rgba(240,149,149,0.08)' }}>
                    ⚠️ Deadline approaching! Submit your content as soon as possible to avoid missing the campaign.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ContentCalendar;
