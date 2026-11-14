'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'sql_lens_solved_challenges_v1';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('sql-lens-solved-updated', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('sql-lens-solved-updated', callback);
  };
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return '[]';
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function getServerSnapshot(): string {
  return '[]';
}

export function useSolvedChallenges() {
  const rawSolved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const solvedIds = useMemo(() => {
    try {
      const parsed = JSON.parse(rawSolved);
      return new Set<string>(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set<string>();
    }
  }, [rawSolved]);

  const markSolved = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      const parsed = current ? JSON.parse(current) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('sql-lens-solved-updated'));
      }
    } catch {
      // Ignore storage write issues
    }
  }, []);

  const resetAllProgress = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('sql-lens-solved-updated'));
    } catch {
      // Ignore
    }
  }, []);

  return { solvedIds, markSolved, resetAllProgress, isLoaded: true };
}
