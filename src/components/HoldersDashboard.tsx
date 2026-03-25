import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpDown, RefreshCw, Users, Activity, TrendingUp, Crown } from 'lucide-react';

interface Holder {
  rank: number;
  address: string;
  balance: string;
  txCount: number;
}

type SortField = 'rank' | 'balance' | 'txCount';
type SortDir = 'asc' | 'desc';

const TOTAL_SUPPLY = 1_000_000_000; // 1B tokens
const REFRESH_INTERVAL = 300; // 5 minutes in seconds

const formatBalance = (raw: string, decimals = 18): string => {
  const num = Number(raw) / Math.pow(10, decimals);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toFixed(0);
};

const getBalanceNum = (raw: string, decimals = 18): number => {
  return Number(raw) / Math.pow(10, decimals);
};

const shortenAddress = (addr: string): string => {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

export const HoldersDashboard: React.FC<{ password: string }> = ({ password }) => {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [countdown, setCountdown] = useState(0);

  const fetchHolders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-holders', {
        body: { password },
      });
      if (fnError || !data?.holders) {
        setError(fnError?.message || 'Failed to fetch holder data');
      } else {
        setHolders(data.holders);
        setCountdown(REFRESH_INTERVAL);
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchHolders();
  }, [fetchHolders]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchHolders();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, fetchHolders]);

  const sorted = [...holders].sort((a, b) => {
    let valA: number, valB: number;
    if (sortField === 'balance') {
      valA = getBalanceNum(a.balance);
      valB = getBalanceNum(b.balance);
    } else if (sortField === 'txCount') {
      valA = a.txCount;
      valB = b.txCount;
    } else {
      valA = a.rank;
      valB = b.rank;
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const maxTx = Math.max(...holders.map(h => h.txCount), 1);
  const totalTx = holders.reduce((sum, h) => sum + h.txCount, 0);
  const avgTx = holders.length ? Math.round(totalTx / holders.length) : 0;
  const mostActive = holders.length
    ? holders.reduce((best, h) => (h.txCount > best.txCount ? h : best), holders[0])
    : null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top 100 Holders</h2>
        <div className="flex items-center gap-3">
          {countdown > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Refresh in {formatTime(countdown)}
            </span>
          )}
          <button
            onClick={fetchHolders}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <Users className="w-5 h-5 text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{holders.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tracked Holders</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <Activity className="w-5 h-5 text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTx.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Transactions</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgTx.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Txns/Holder</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <Crown className="w-5 h-5 text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
            {mostActive ? shortenAddress(mostActive.address) : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Most Active</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
              <th
                className="px-4 py-3 text-left cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                onClick={() => handleSort('rank')}
              >
                <span className="flex items-center gap-1">Rank <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-3 text-left">Wallet</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                onClick={() => handleSort('balance')}
              >
                <span className="flex items-center justify-end gap-1">Holdings <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-3 text-right">% Supply</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                onClick={() => handleSort('txCount')}
              >
                <span className="flex items-center justify-end gap-1">Total Txns <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-3 text-right">Activity</th>
            </tr>
          </thead>
          <tbody>
            {loading && holders.length === 0 ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-700/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              sorted.map((holder) => {
                const balNum = getBalanceNum(holder.balance);
                const pct = ((balNum / TOTAL_SUPPLY) * 100).toFixed(2);
                const activityPct = (holder.txCount / maxTx) * 100;
                return (
                  <tr
                    key={holder.address}
                    className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{holder.rank}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://abscan.org/address/${holder.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
                      >
                        {shortenAddress(holder.address)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                      {formatBalance(holder.balance)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{pct}%</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                      {holder.txCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full ml-auto overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${activityPct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
