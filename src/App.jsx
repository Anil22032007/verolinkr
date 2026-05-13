import React, { useState } from 'react';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('creator');
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="vero-wrap">
      {/* NAV */}
      <nav className="nav">
        <div className="logo">Vero<span>Linkr</span></div>
        <ul className="nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#creators">For Creators</a></li>
          <li><a href="#brands">For Brands</a></li>
        </ul>
        <a href="#waitlist" className="nav-cta">Join Waitlist</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="badge">
          <div className="badge-dot" />
          India's Creator Economy Infrastructure
        </div>

        <h1>
          Brand deals.<br />
          <em>Without the trust issues.</em>
        </h1>

        <p className="hero-sub">
          VeroLinkr connects Indian creators with brands using escrow-secured payments —
          so creators always get paid and brands always get results.
        </p>

        <div className="hero-ctas">
          <a href="#waitlist" className="btn-primary">Join the Waitlist →</a>
          <a href="#how" className="btn-secondary">See How It Works</a>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-num">₹0 <span>lost</span></div>
          <div className="stat-label">In escrow-protected deals</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">48<span>hr</span></div>
          <div className="stat-label">Average payment release</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">100<span>%</span></div>
          <div className="stat-label">Verified brand partners</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">India<span className="accent">-first</span></div>
          <div className="stat-label">Built for Indian creators</div>
        </div>
      </div>

      {/* PROBLEM */}
      <section className="section">
        <div className="section-label">The Problem</div>
        <h2 className="section-title">Creator collabs are broken<br />in India.</h2>
        <p className="section-sub">Two problems killing deals before they even begin.</p>

        <div className="problems">
          <div className="problem-card">
            <div className="problem-icon">⏳</div>
            <div className="problem-title">Creators don't get paid</div>
            <p className="problem-desc">
              Delayed payments, ghosted brands, and zero protection after content goes live.
              Creators work for free every day across India.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">📉</div>
            <div className="problem-title">Brands waste budget on fake views</div>
            <p className="problem-desc">
              Inflated follower counts, bot engagement, no performance verification.
              Brands burn money and lose trust in influencer marketing entirely.
            </p>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">One platform. Full protection.</h2>
        <p className="section-sub">
          VeroLinkr holds payment in escrow until content is verified — then releases automatically.
        </p>

        <div className="how-steps">
          {[
            {
              num: '01',
              title: 'Brand creates a campaign',
              desc: 'Define deliverables, budget, and timeline. Payment goes into secure Razorpay escrow — not to the creator yet.',
            },
            {
              num: '02',
              title: 'Creators apply and are matched',
              desc: 'Verified creators browse campaigns. Brands select based on real engagement data — no fake metrics, no guessing.',
            },
            {
              num: '03',
              title: 'Content is created and submitted',
              desc: 'Creator delivers content through the platform. Brand reviews and approves within the agreed timeline.',
            },
            {
              num: '04',
              title: 'Payment releases instantly',
              desc: 'On brand approval, Razorpay releases escrow payment to creator. No waiting. No chasing. No ghosting.',
            },
          ].map((step) => (
            <div className="step" key={step.num}>
              <div className="step-num">{step.num}</div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                <p className="step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* FOR CREATORS */}
      <section className="section" id="creators">
        <div className="section-label">For Creators</div>
        <h2 className="section-title">Your work. Your money.<br />Guaranteed.</h2>
        <p className="section-sub">
          Stop chasing brands for payment. Start focusing on creating.
        </p>

        <div className="features-grid">
          {[
            { icon: '🔒', title: 'Escrow Protection', desc: 'Payment is locked before you start. You get paid on delivery — always.' },
            { icon: '📊', title: 'Real Analytics', desc: 'Show brands your true engagement rate. No more fake metric comparisons.' },
            { icon: '🤝', title: 'Verified Brands', desc: 'Every brand on VeroLinkr is verified. No scams, no fake deals.' },
            { icon: '⚡', title: 'Fast Payouts', desc: 'Payment releases within 48 hours of content approval via Razorpay.' },
          ].map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* FOR BRANDS */}
      <section className="section" id="brands">
        <div className="section-label">For Brands</div>
        <h2 className="section-title">Spend on results.<br />Not on promises.</h2>
        <p className="section-sub">
          Only pay when content is delivered. Find creators who actually convert.
        </p>

        <div className="features-grid">
          {[
            { icon: '🎯', title: 'Pay on Delivery', desc: 'Your budget stays in escrow until content is live and approved. Zero risk.' },
            { icon: '✅', title: 'Verified Creators', desc: 'Every creator is verified for authentic followers and real engagement.' },
            { icon: '📋', title: 'Campaign Dashboard', desc: 'Manage all your influencer campaigns in one place with full tracking.' },
            { icon: '💰', title: 'ROI Guarantee', desc: "If content isn't delivered as agreed, your escrow is refunded automatically." },
          ].map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WAITLIST */}
      <section className="waitlist-section" id="waitlist">
        <div className="waitlist-inner">
          <div className="section-label" style={{ textAlign: 'center' }}>Early Access</div>
          <h2 className="waitlist-title">Be the first on VeroLinkr.</h2>
          <p className="waitlist-sub">
            Launching soon. Join the waitlist and get early access + founding member benefits.
          </p>

          {submitted ? (
            <div className="success-msg">
              ✅ You're on the list! We'll reach out soon.
            </div>
          ) : (
            <form className="waitlist-form" onSubmit={handleWaitlist}>
              <div className="role-toggle">
                <button
                  type="button"
                  className={`role-btn ${role === 'creator' ? 'active' : ''}`}
                  onClick={() => setRole('creator')}
                >
                  I'm a Creator
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'brand' ? 'active' : ''}`}
                  onClick={() => setRole('brand')}
                >
                  I'm a Brand
                </button>
              </div>

              <div className="email-row">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="email-input"
                />
                <button type="submit" className="btn-primary">
                  Join Waitlist →
                </button>
              </div>
              <p className="form-note">No spam. We'll only email you about launch updates.</p>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">Vero<span>Linkr</span></div>
        <p className="footer-copy">© 2025 VeroLinkr · India's Escrow-Secured Creator Marketplace</p>
        <div className="footer-links">
          <a href="https://verolinkr.substack.com" target="_blank" rel="noreferrer">Newsletter</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
