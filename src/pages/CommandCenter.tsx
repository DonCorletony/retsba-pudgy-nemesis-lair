import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FooterSection from '../components/FooterSection';
import { XPTemplateCMS } from '@/components/XPTemplateCMS';
import { HoldersDashboard } from '@/components/HoldersDashboard';
import { NFTAirdropTool } from '@/components/NFTAirdropTool';

const SESSION_KEY = 'retsba_cc_session';
const PASSWORD_KEY = 'retsba_cc_password';

const CommandCenter = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    const savedPw = localStorage.getItem(PASSWORD_KEY);
    if (session) {
      try {
        const { expiresAt } = JSON.parse(session);
        if (Date.now() < expiresAt) {
          setAuthenticated(true);
          if (savedPw) setStoredPassword(savedPw);
        } else {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(PASSWORD_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(PASSWORD_KEY);
      }
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-command-center', {
        body: { password },
      });

      if (fnError || !data?.success) {
        setError('Incorrect password');
        setPassword('');
      } else {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          token: data.token,
          expiresAt: data.expiresAt,
        }));
        localStorage.setItem(PASSWORD_KEY, password);
        setStoredPassword(password);
        setAuthenticated(true);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-retsba dark:bg-gray-900 flex items-center justify-center px-4">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-center"
            autoFocus
          />
          {error && <p className="text-red-200 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retsba dark:bg-gray-900 text-white pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Command Center</h1>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:border dark:border-gray-700 p-6">
          <XPTemplateCMS password={storedPassword} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:border dark:border-gray-700 p-6 mt-8">
          <HoldersDashboard password={storedPassword} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:border dark:border-gray-700 p-6 mt-8">
          <NFTAirdropTool password={storedPassword} />
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default CommandCenter;
