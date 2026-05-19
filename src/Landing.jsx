import React, { useState } from 'react';
import './App.css';

const BLOG_POSTS = [
  {
    id: 1,
    tag: 'Platform',
    title: 'What is VeroLinkr? India\'s First Escrow-Secured Creator Marketplace',
    excerpt: 'India\'s creator economy just crossed ₹3,600 crore. Yet 90% of creators never get paid on time and brands waste 25% of their budget on fake views. VeroLinkr fixes both — with escrow infrastructure that protects every rupee.',
    readTime: '4 min read',
    content: [
      {
        heading: 'The Problem Nobody Has Solved',
        body: 'India has 50 million nano creators. Only 8% earn consistently. The rest quit — not because their content was bad — but because brands ghosted them after delivery. On the brand side, flat fee payments upfront give zero guarantee of real results. Both sides operate on blind trust that fails constantly.',
      },
      {
        heading: 'The VeroLinkr Solution',
        body: 'VeroLinkr is India\'s first escrow-secured influencer marketplace. Every brand payment is locked in escrow before any creator begins work — releasing automatically upon verified content delivery. Brands pay only for real verified results. Creators receive guaranteed payment protection.',
      },
      {
        heading: 'How Escrow Works',
        body: 'Brand deposits budget into escrow. Creator sees funds are secured and begins creating. Content is delivered and verified. Payment releases automatically within 48 hours. Unused budget returns to brand. Zero manual intervention needed for standard transactions.',
      },
      {
        heading: 'Four Campaign Models',
        body: 'VeroLinkr operates four distinct models — CPV (pay per verified view), Participation (fixed payout, instant join), One Time Payment (brand selects specific creators), and Gig Marketplace (on demand content from verified creators). Together they cover every type of brand-creator collaboration that exists.',
      },
    ],
  },
  {
    id: 2,
    tag: 'CPV & Participation',
    title: 'How CPV and Participation Campaigns Work — Zero Matchmaking, Pure Infrastructure',
    excerpt: 'Most platforms make brands pick creators one by one. VeroLinkr\'s CPV and Participation campaigns are different — any eligible creator joins instantly, creates content, and gets paid automatically. No approval. No selection. Pure campaign infrastructure.',
    readTime: '5 min read',
    content: [
      {
        heading: 'CPV Campaign — Pay Per Verified View',
        body: 'Brand deposits ₹2,00,000 at ₹0.15 per view. 500 gaming creators join automatically. All post authentic gameplay videos. System tracks views via YouTube API. Every 5,000 views — ₹750 releases automatically. Campaign ends. Unused budget refunds. Brand paid only for real views that actually happened.',
      },
      {
        heading: 'Participation Campaign — Fixed Payout, Instant Join',
        body: 'Brand deposits ₹60,000 at ₹300 per post. Any eligible creator joins with one click — no brand approval needed. Creator posts genuine content. Submits proof link. Payment holds for 48 hours to ensure post stays live. Then releases automatically. 200 creators. 200 genuine posts. ₹60,000 fully utilized.',
      },
      {
        heading: 'Why Instant Join Changes Everything',
        body: 'Traditional platforms make brands pick creators one by one. This creates a bottleneck. VeroLinkr removes it completely. A Participation Campaign can activate 500 creators simultaneously. That is 500 authentic voices talking about one brand at the same time — creating a genuine wave of social proof that no single creator or ad campaign can match.',
      },
      {
        heading: 'The 48-Hour Hold Mechanism',
        body: 'VeroLinkr\'s payment hold is genuinely novel. Without it: creator posts, gets paid immediately, deletes post. With it: creator posts, knows payment arrives in 48 hours, keeps post live for organic reach. One small mechanism that solves a massive problem nobody else has addressed.',
      },
    ],
  },
  {
    id: 3,
    tag: 'One Time & Gig',
    title: 'One Time Payment and Gig Marketplace — Quality Control Meets On-Demand Content',
    excerpt: 'When brands need specific creators or quick content without a full campaign — VeroLinkr\'s One Time Payment and Gig Marketplace deliver. Escrow protected. Quality guaranteed. Dispute resolution built in.',
    readTime: '5 min read',
    content: [
      {
        heading: 'One Time Payment — Two Ways',
        body: 'Way 1: Brand selects exactly 15 creators from applicants. Each posts publicly. Payment holds 48 hours then releases automatically. Way 2: Brand needs 5 premium unboxing videos for their Facebook ads. Creators deliver files privately. Brand owns content completely. ₹40,000 versus ₹2,25,000 from a production agency. 5 days versus 4 weeks.',
      },
      {
        heading: 'Why Way 2 Is Globally Unique',
        body: 'Every D2C brand running ads knows UGC style content converts 3-4x better than polished brand content. But getting authentic UGC is painful. Agencies charge ₹50,000 per video. VeroLinkr Way 2 lets brands source premium creator-made ad content directly — with escrow security, full content rights, and human dispute resolution. Nothing like this exists in India.',
      },
      {
        heading: 'Gig Marketplace — Fiverr for Verified Creators Only',
        body: 'Unlike Fiverr where anyone can list services — VeroLinkr Gig Marketplace is exclusively for verified creators with real audiences. Brand browses by niche, platform, budget, delivery time. Purchases instantly. ₹2,800 secured in escrow. Creator delivers Reel in 2 days. Brand approves. Payment releases instantly. Zero negotiation. Zero risk.',
      },
      {
        heading: 'Human Dispute Resolution',
        body: 'For One Time Way 2 and Gig disputes — VeroLinkr\'s team steps in. Reviews original brief against submitted content. Makes a fair independent judgment. Neither side can cheat the other. This trust guarantee is why both brands and creators choose VeroLinkr over informal WhatsApp deals.',
      },
    ],
  },
];

function BlogPost({ post, onClose }) {
  return (
    <div className="blog-post-page">
      <div className="blog-post-nav">
        <button className="back-btn" onClick={onClose}>← Back to Blog</button>
        <div className="blog-post-tag">{post.tag}</div>
      </div>
      <div className="blog-post-content">
        <div className="blog-post-meta">{post.readTime}</div>
        <h1 className="blog-post-title">{post.title}</h1>
        <p className="blog-post-excerpt">{post.excerpt}</p>
        <div className="blog-post-divider" />
        {post.content.map((section, i) => (
          <div key={i} className="blog-section">
            <h2 className="blog-section-heading">{section.heading}</h2>
            <p className="blog-section-body">{section.body}</p>
          </div>
        ))}
        <div className="blog-post-cta">
          <div className="blog-post-cta-title">Ready to try VeroLinkr?</div>
          <p className="blog-post-cta-desc">Join India's first escrow-secured creator marketplace. Free to sign up.</p>
          <button className="btn-primary" onClick={onClose} style={{ marginTop: '1rem' }}>
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}

function Landing({ onGetStarted }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('creator');
  const [submitted, setSubmitted] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  if (selectedPost) {
    return <BlogPost post={selectedPost} onClose={() => setSelectedPost(null)} />;
  }

  return (
    <div className="vero-wrap">
      <nav className="nav">
        <div className="logo">Vero<span>Linkr</span></div>
        <ul className="nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#models">4 Models</a></li>
          <li><a href="#blog">Blog</a></li>
        </ul>
        <button className="nav-cta" onClick={onGetStarted}>Get Started</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="badge">
          <div className="badge-dot" />
          India's Campaign-Driven Creator Platform
        </div>
        <h1>Brand campaigns.<br /><em>Not matchmaking.</em></h1>
        <p className="hero-sub">
          VeroLinkr is India's first escrow-secured campaign infrastructure for creators and brands.
          Creators join campaigns instantly. Get paid automatically. Brands pay only for real verified results.
        </p>
        <div className="hero-ctas">
          <button className="btn-primary" onClick={onGetStarted}>Join the Platform →</button>
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
          <div className="stat-label">Automatic payment release</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">4<span> models</span></div>
          <div className="stat-label">Campaign types available</div>
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
            <p className="problem-desc">Delayed payments, ghosted brands, zero protection after content goes live. 90% of Indian creators never get paid on time.</p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">📉</div>
            <div className="problem-title">Brands waste budget on fake views</div>
            <p className="problem-desc">Inflated follower counts, bot engagement, no performance verification. Brands lose 25% of budget to fake impressions.</p>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">Campaign infrastructure.<br />Not matchmaking.</h2>
        <p className="section-sub">VeroLinkr holds payment in escrow. Creators join campaigns instantly. Payment releases automatically on verified delivery.</p>
        <div className="how-steps">
          {[
            { num: '01', title: 'Brand creates campaign and funds escrow', desc: 'Define deliverables, budget, and campaign type. Every rupee secured in escrow before any creator begins work.' },
            { num: '02', title: 'Creators join instantly — no approval needed', desc: 'For CPV and Participation campaigns — any eligible creator joins with one click. No brand selection. No waiting. Pure infrastructure.' },
            { num: '03', title: 'Content created and verified', desc: 'Creator posts content. Submits proof link. VeroLinkr verifies via platform APIs. Views tracked automatically for CPV campaigns.' },
            { num: '04', title: 'Payment releases automatically', desc: 'Participation — 48 hour hold then auto-release. CPV — releases every milestone automatically. One Time — releases on brand approval.' },
          ].map(step => (
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

      {/* 4 MODELS */}
      <section className="section" id="models">
        <div className="section-label">4 Campaign Models</div>
        <h2 className="section-title">Every type of brand-creator<br />collaboration. One platform.</h2>
        <p className="section-sub">VeroLinkr is not four separate products. It is one complete creator economy operating system.</p>

        <div className="models-grid">
          {[
            {
              icon: '📊',
              name: 'CPV Campaign',
              tag: 'Cost Per Verified View',
              desc: 'Brand pays only for real verified views. Any eligible creator joins automatically. Milestone payments release per view threshold. Unused budget refunds.',
              best: 'App launches, brand awareness, mass authentic reach',
              color: 'cpv',
            },
            {
              icon: '🚀',
              name: 'Participation Campaign',
              tag: 'Fixed Payout, Instant Join',
              desc: 'Fixed payout per post. Any eligible creator joins instantly — no brand approval. 48-hour hold ensures post stays live. Payment auto-releases.',
              best: 'UGC collection, product launches, social proof at scale',
              color: 'participation',
            },
            {
              icon: '🤝',
              name: 'One Time Payment',
              tag: 'Quality Controlled Deal',
              desc: 'Brand selects specific creators from applicants. Way 1 — public posts. Way 2 — private content for ads (content only, no public posting).',
              best: 'Quality controlled campaigns, premium ad content creation',
              color: 'one_time',
            },
            {
              icon: '⚡',
              name: 'Gig Marketplace',
              tag: 'On Demand Content',
              desc: 'Verified creators list services. Brands browse and purchase instantly. Escrow protected. Creator delivers. Brand approves. Payment releases.',
              best: 'Quick content needs, small budgets, specific deliverables',
              color: 'gig',
            },
          ].map(model => (
            <div className={`model-landing-card ${model.color}`} key={model.name}>
              <div className="model-landing-icon">{model.icon}</div>
              <div className="model-landing-tag">{model.tag}</div>
              <div className="model-landing-name">{model.name}</div>
              <p className="model-landing-desc">{model.desc}</p>
              <div className="model-landing-best">
                <span className="model-best-label">Best for: </span>{model.best}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* FOR CREATORS */}
      <section className="section">
        <div className="section-label">For Creators</div>
        <h2 className="section-title">Your work. Your money.<br />Guaranteed.</h2>
        <p className="section-sub">Stop chasing brands. Join campaigns instantly. Get paid automatically.</p>
        <div className="features-grid">
          {[
            { icon: '⚡', title: 'Join Instantly', desc: 'CPV and Participation campaigns — no brand approval needed. See campaign, join, create, get paid.' },
            { icon: '🔒', title: 'Escrow Protection', desc: 'Payment secured before you start. You get paid on delivery — always. No more ghosting.' },
            { icon: '💰', title: '48-Hour Payment', desc: 'Participation payments auto-release in 48 hours. CPV payments release per milestone automatically.' },
            { icon: '📊', title: 'Earn Per View', desc: 'CPV campaigns pay you per verified real view. More genuine content — more earnings. Pure merit.' },
          ].map(f => (
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
      <section className="section">
        <div className="section-label">For Brands</div>
        <h2 className="section-title">Spend on results.<br />Not on promises.</h2>
        <p className="section-sub">Launch once. Hundreds of creators participate. Pay only for verified delivery.</p>
        <div className="features-grid">
          {[
            { icon: '🎯', title: 'Pay For Results', desc: 'CPV campaigns — pay per verified view. Participation — pay per delivered post. Zero flat fee risk.' },
            { icon: '🚀', title: 'Mass Activation', desc: '500 creators joining one campaign simultaneously. Creating authentic content wave no ad can replicate.' },
            { icon: '✅', title: 'Verified Creators', desc: 'Every creator verified for authentic followers and real engagement. No fake metrics.' },
            { icon: '🔄', title: 'Auto Everything', desc: 'Payments release automatically. Unused budget refunds automatically. Zero manual coordination.' },
          ].map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* BLOG */}
      <section className="section" id="blog">
        <div className="section-label">Blog</div>
        <h2 className="section-title">Learn how VeroLinkr works.</h2>
        <p className="section-sub">Deep dives into our campaign models, escrow infrastructure, and creator economy insights.</p>

        <div className="blog-grid">
          {BLOG_POSTS.map(post => (
            <div className="blog-card" key={post.id} onClick={() => setSelectedPost(post)}>
              <div className="blog-card-tag">{post.tag}</div>
              <h3 className="blog-card-title">{post.title}</h3>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-footer">
                <span className="blog-card-read">{post.readTime}</span>
                <span className="blog-card-link">Read article →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WAITLIST */}
      <section className="waitlist-section" id="waitlist">
        <div className="waitlist-inner">
          <div className="section-label" style={{ textAlign: 'center' }}>Early Access</div>
          <h2 className="waitlist-title">Join VeroLinkr today.</h2>
          <p className="waitlist-sub">Free to sign up. Campaigns launching now.</p>
          {submitted ? (
            <div className="success-msg">✅ You are on the list! We will reach out soon.</div>
          ) : (
            <form className="waitlist-form" onSubmit={handleWaitlist}>
              <div className="role-toggle">
                <button type="button" className={`role-btn ${role === 'creator' ? 'active' : ''}`} onClick={() => setRole('creator')}>I am a Creator</button>
                <button type="button" className={`role-btn ${role === 'brand' ? 'active' : ''}`} onClick={() => setRole('brand')}>I am a Brand</button>
              </div>
              <div className="email-row">
                <input type="email" placeholder="Enter your email address" value={email} onChange={e => setEmail(e.target.value)} required className="email-input" />
                <button type="submit" className="btn-primary">Join →</button>
              </div>
              <p className="form-note">No spam. Launch updates only.</p>
            </form>
          )}
          <div style={{ marginTop: '2rem' }}>
            <button className="btn-primary" onClick={onGetStarted} style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
              Create Your Account Now →
            </button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">Vero<span>Linkr</span></div>
        <p className="footer-copy">© 2025 VeroLinkr · India's Campaign-Driven Creator Marketplace</p>
        <div className="footer-links">
          <a href="https://verolinkr.substack.com" target="_blank" rel="noreferrer">Newsletter</a>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
