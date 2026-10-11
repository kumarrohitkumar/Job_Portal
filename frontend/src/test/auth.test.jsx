import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireRole } from '@/components/RequireRole';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const recruiter = { id: 'r1', fullname: 'Riya Kapoor', email: 'r@example.com', role: 'recruiter', profile: { photoUrl: null } };
let auth;
function Capture() {
  auth = useAuth();
  return null;
}

function renderApp(initial = '/login') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['jobs', 'mine'], ['stale data from the previous account']);
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <AuthProvider>
          <Capture />
          <Routes>
            <Route path="/login" element={<p>login page</p>} />
            <Route path="/recruiter" element={<RequireRole role="recruiter"><p>recruiter area</p></RequireRole>} />
            <Route path="/jobs" element={<p>job list</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return qc;
}

describe('auth state', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ data: { user: null } });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
  });

  it('a guest opening a recruiter page is sent to sign in', async () => {
    renderApp('/recruiter');
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('after signIn the user is signed in immediately, and the old account’s cached data is gone', async () => {
    const qc = renderApp('/login');
    await waitFor(() => expect(auth.loading).toBe(false));
    act(() => auth.signIn(recruiter));
    await waitFor(() => expect(auth.user).toEqual(recruiter));
    expect(qc.getQueryData(['jobs', 'mine'])).toBeUndefined();
  });

  it('a signed-in recruiter sees the recruiter page; signOut signs them out', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { user: recruiter } });
    renderApp('/recruiter');
    expect(await screen.findByText('recruiter area')).toBeInTheDocument();
    await act(() => auth.signOut());
    await waitFor(() => expect(auth.user).toBeNull());
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('a job seeker on a recruiter page goes to the job list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { user: { ...recruiter, role: 'student' } } });
    renderApp('/recruiter');
    expect(await screen.findByText('job list')).toBeInTheDocument();
  });
});
