import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Landing from './Landing';
import Auth from './Auth';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setPage('dashboard');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setPage('dashboard');
      } else {
        setUser(null);
        setPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage('landing');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0A0A0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
        color: 'rgba(245,243,238,0.4)',
        fontSize: '0.9rem'
      }}>
        Loading...
      </div>
    );
  }

  if (page === 'auth') {
    return <Auth onAuth={(u) => { setUser(u); setPage('dashboard'); }} onBack={() => setPage('landing')} />;
  }

  if (page === 'dashboard' && user) {
    return <Dashboard user={user} onSignOut={handleSignOut} />;
  }

  return <Landing onGetStarted={() => setPage('auth')} />;
}

export default App;
