import React, { useState, useEffect } from 'react';
import FooterSection from '../components/FooterSection';
import { HoldersDashboard } from '@/components/HoldersDashboard';

const SESSION_KEY = 'abstract_txns_session';
const PASSWORD = 'AbsterSucksEggs987';

const TOKENS = [
  { id: 'retsba', label: 'RETSBA', contract: '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' },
  { id: 'abster', label: 'Abster', contract: '0xc325b7e2736A5202bd860F5974D0AA375E57EdE5' },
  { id: 'god', label: 'God', contract: '0x3D72DDD35cadb4e5B22CDB20b36f98077BE84284' },
  { id: 'polly', label: 'Polly', contract: '0x987CF44F3F5d854eC0703123d7fD003a8b56eBb4' },
] as const;

const AbstractTXNs = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [selectedToken, setSelectedToken] = useState<string>('retsba');

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const { expiresAt } = JSON.parse(session);
        if (Date.now() < expiresAt) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password === PASSWORD) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
      }));
      setAuthenticated(true);
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (checking) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 rounded-xl bg-card text-foreground border border-border outline-none focus:ring-2 focus:ring-primary text-center"
            autoFocus
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!password}
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  const currentToken = TOKENS.find(t => t.id === selectedToken) || TOKENS[0];

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Abstract TXNs</h1>
        
        {/* Token Switcher */}
        <div className="flex justify-center gap-2 mb-8">
          {TOKENS.map((token) => (
            <button
              key={token.id}
              onClick={() => setSelectedToken(token.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                selectedToken === token.id
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              ${token.label}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
          {currentToken.contract ? (
            <HoldersDashboard password="__abstract_txns__" tokenId={currentToken.id} tokenLabel={currentToken.label} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium mb-2">${currentToken.label} — Coming Soon</p>
              <p className="text-sm">Contract address needed to enable tracking</p>
            </div>
          )}
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default AbstractTXNs;
