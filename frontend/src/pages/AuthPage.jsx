import { Briefcase, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CompanyLogo } from '@/components/Avatar';
import { Brand } from '@/components/Brand';
import { StatusBadge } from '@/components/StatusBadge';
import { Field } from '@/components/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Only same-site paths are allowed after sign-in, so ?next= can't send people elsewhere. */
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null);
const home = (role) => (role === 'recruiter' ? '/recruiter/jobs' : '/jobs');

const DEMO_TRACKER = [
  { title: 'Frontend Engineer', company: 'Northwind Labs', status: 'accepted' },
  { title: 'Full Stack Developer', company: 'Kestrel Fintech', status: 'pending' },
  { title: 'Product Designer', company: 'Banyan Health', status: 'pending' },
];

const ROLES = [
  { value: 'student', label: 'Job seeker', body: 'Find and apply for jobs', icon: GraduationCap },
  { value: 'recruiter', label: 'Recruiter', body: 'Post jobs and hire', icon: Briefcase },
];

export default function AuthPage({ mode }) {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signup = mode === 'signup';
  const [form, setForm] = useState({ fullname: '', email: '', phoneNumber: '', password: '', role: params.get('role') === 'recruiter' ? 'recruiter' : 'student' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={safeNext(params.get('next')) ?? home(user.role)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const body = signup ? form : { email: form.email, password: form.password };
      const { data } = await api.post(`/auth/${signup ? 'register' : 'login'}`, body);
      signIn(data.user);
      toast.success(data.message);
      navigate(safeNext(params.get('next')) ?? home(data.user.role), { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -bottom-24 -right-24 size-96 rounded-full bg-marigold/25 blur-3xl" />
        <p className="relative font-display text-4xl font-extrabold leading-tight">{signup ? 'One profile. Every application.' : 'Pick up where you left off.'}</p>
        <div aria-hidden="true" className="relative mx-auto w-full max-w-sm space-y-3">
          {DEMO_TRACKER.map((a, i) => (
            <div key={a.title} className="flex animate-rise items-center gap-3 rounded-2xl bg-card p-4 text-card-foreground shadow-xl shadow-black/10" style={{ animationDelay: `${150 + i * 120}ms`, marginLeft: `${i * 18}px` }}>
              <CompanyLogo company={{ name: a.company }} className="size-10 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.company}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
        <ul className="relative space-y-3 text-primary-foreground/85">
          <li>Salaries shown on every job</li>
          <li>Apply in one click with your saved resume</li>
          <li>See when you are shortlisted</li>
        </ul>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-rise">
          <div className="lg:hidden">
            <Brand />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold lg:mt-0">{signup ? 'Create your account' : 'Sign in'}</h1>
          <p className="mt-1 text-muted-foreground">
            {signup ? 'Already have an account?' : 'New to JobConnect?'}{' '}
            <Link to={`${signup ? '/login' : '/signup'}${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`} className="font-semibold text-primary hover:underline">
              {signup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-5" aria-label={signup ? 'Create account' : 'Sign in'}>
            {signup && (
              <fieldset>
                <legend className="text-sm font-semibold">I want to</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <label key={r.value} className={cn('flex cursor-pointer flex-col gap-1 rounded-xl border-2 bg-card p-4 transition-colors', form.role === r.value ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40')}>
                      <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} className="sr-only" />
                      <r.icon className="size-5 text-primary" aria-hidden="true" />
                      <span className="font-bold">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.body}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {signup && (
              <Field label="Full name" error={errors.fullname}>
                {(id, d, invalid) => <Input id={id} aria-describedby={d} aria-invalid={invalid} autoComplete="name" value={form.fullname} onChange={set('fullname')} required />}
              </Field>
            )}
            <Field label="Email" error={errors.email}>
              {(id, d, invalid) => <Input id={id} aria-describedby={d} aria-invalid={invalid} type="email" autoComplete="email" value={form.email} onChange={set('email')} required />}
            </Field>
            {signup && (
              <Field label="Phone number" error={errors.phoneNumber}>
                {(id, d, invalid) => <Input id={id} aria-describedby={d} aria-invalid={invalid} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/[\s-]/g, '') })} required />}
              </Field>
            )}
            <Field label="Password" error={errors.password} hint={signup ? 'At least 8 characters.' : undefined}>
              {(id, d, invalid) => (
                <div className="relative">
                  <Input id={id} aria-describedby={d} aria-invalid={invalid} type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} className="pr-11" required />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (signup ? 'Creating account…' : 'Signing in…') : signup ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          {!signup && (
            <div className="mt-8 rounded-xl border border-dashed bg-card p-4 text-sm">
              <p className="font-semibold">Just looking around?</p>
              <p className="mt-1 text-muted-foreground">
                Demo job seeker: <span className="font-mono text-foreground">student@jobconnect.dev</span>
                <br />
                Demo recruiter: <span className="font-mono text-foreground">recruiter@jobconnect.dev</span>
                <br />
                Password: <span className="font-mono text-foreground">Demo@1234</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
