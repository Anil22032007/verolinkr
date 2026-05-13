import React, { useState } from 'react';
import { supabase } from './supabase';
import './Auth.css';

function Auth({ onAuth }) {
  const [mode, setMode] = useState('signup'); // signup | login
  const [role, setRole] = useState('creator'); // creator | brand
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    handle: '',
    company: '',
    website: '',
  });

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              role,
              name: role === 'creator' ? form.name : form.company,
              handle: role === 'creator' ? form.handle : '',
              company: role === 'brand' ? form.company : '',
              website: role === 'brand' ? form.website : '',
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Insert profile into profiles table
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: form.email,
            role,
            name: role === 'creator' ? form.name : form.company,
            handle: role === 'creator' ? form.handle : null,
            company: role === 'brand' ? form.company : null,
            website: role === 'brand' ? form.website : null,
          });

          setSuccess('Account created! Check your email to confirm, then log in.');
        }
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (loginError) throw loginError;
        if (data.user) onAuth(data.user);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <a href="/" className="auth-logo">Vero<span>Linkr</span></a>
        <div className="auth-tagline">
          <h2>India's escrow-secured<br />creator marketplace.</h2>
          <p>Creators get paid. Brands get results. Always.</p>
        </div>
        <div className="auth-stats">
          <div className="auth-stat">
            <div className="auth-stat-num">5,000+</div>
            <div className="auth-stat-label">Newsletter subscribers</div>
          </div>
          <div className="auth-stat">
            <div className="auth-stat-num">40%+</div>
            <div className="auth-stat-label">Open rate</div>
          </div>
          <div className="auth-stat">
            <div className="auth-stat-num">₹0</div>
            <div className="auth-stat-label">Lost in escrow deals</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {/* Mode toggle */}
          <div className="auth-mode-toggle">
            <button
              className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            >
              Sign Up
            </button>
            <button
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              Log In
            </button>
          </div>

          {/* Role toggle — only on signup */}
          {mode === 'signup' && (
            <div className="role-toggle">
              <button
                className={`role-btn ${role === 'creator' ? 'active' : ''}`}
                onClick={() => setRole('creator')}
                type="button"
              >
                I'm a Creator
              </button>
              <button
                className={`role-btn ${role === 'brand' ? 'active' : ''}`}
                onClick={() => setRole('brand')}
                type="button"
              >
                I'm a Brand
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Creator fields */}
            {mode === 'signup' && role === 'creator' && (
              <>
                <div className="field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Instagram / YouTube Handle</label>
                  <input
                    type="text"
                    placeholder="@yourhandle"
                    value={form.handle}
                    onChange={(e) => update('handle', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Brand fields */}
            {mode === 'signup' && role === 'brand' && (
              <>
                <div className="field">
                  <label>Company Name</label>
                  <input
                    type="text"
                    placeholder="Your company name"
                    value={form.company}
                    onChange={(e) => update('company', e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Website</label>
                  <input
                    type="url"
                    placeholder="https://yourcompany.com"
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Common fields */}
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? 'Please wait...'
                : mode === 'signup'
                ? `Create ${role === 'creator' ? 'Creator' : 'Brand'} Account →`
                : 'Log In →'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <button
              className="auth-switch-btn"
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setSuccess(''); }}
            >
              {mode === 'signup' ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
