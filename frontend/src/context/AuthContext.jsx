import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

/** The signed-in user comes from the server (/auth/session), so an expired session can never look signed in. */
export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const { data: user, isPending } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/session').then((r) => r.data.user),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Switching accounts drops everything cached for the previous one, but keeps the 'me' query itself:
  // removing it would leave this provider watching a discarded query.
  const resetOthers = useCallback(() => qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' }), [qc]);

  const setUser = useCallback((u) => qc.setQueryData(['me'], u), [qc]);

  const signIn = useCallback(
    (u) => {
      resetOthers();
      setUser(u);
    },
    [resetOthers, setUser],
  );

  const signOut = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    resetOthers();
    setUser(null);
  }, [resetOthers, setUser]);

  const value = useMemo(() => ({ user: user ?? null, loading: isPending, setUser, signIn, signOut }), [user, isPending, setUser, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
