import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, Briefcase, Building2, FileText, Search, Send, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JobCard } from '@/components/JobCard';
import { ErrorState, JobCardSkeleton } from '@/components/States';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { api, errorMessage } from '@/lib/api';

const POPULAR = ['React', 'Node.js', 'Data Analyst', 'Internship', 'Designer', 'DevOps'];
const CITIES = ['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad', 'Gurugram'];

/** The one bold moment: the search reads as a sentence the visitor completes. */
function SentenceSearch() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  function submit(e) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (keyword.trim()) q.set('keyword', keyword.trim());
    if (location.trim()) q.set('location', location.trim());
    navigate(`/jobs${q.size ? `?${q}` : ''}`);
  }
  const input = 'min-w-0 border-b-[3px] border-primary/30 bg-transparent px-1 font-display font-bold text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none';
  return (
    <form onSubmit={submit} role="search" aria-label="Search jobs" className="mt-8">
      <p className="font-display text-3xl font-bold leading-[1.35] tracking-tight sm:text-5xl sm:leading-[1.25]">
        I&apos;m looking for{' '}
        <input aria-label="Job title, skill or keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="a React role" className={`${input} w-[10.5ch]`} /> in{' '}
        <input aria-label="City" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="any city" list="cities" className={`${input} w-[8.5ch]`} />
        <datalist id="cities">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" className="h-12 rounded-full px-6 text-base">
          <Search className="size-5" aria-hidden="true" /> Show me jobs
        </Button>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Popular:</span>
          {POPULAR.map((p) => (
            <Link key={p} to={`/jobs?keyword=${encodeURIComponent(p)}`} className="rounded-full border bg-card px-3 py-1 font-medium transition-colors hover:border-primary hover:text-primary">
              {p}
            </Link>
          ))}
        </div>
      </div>
    </form>
  );
}

const STEPS = [
  { icon: Search, title: 'Search', body: 'Filter by skill, city and job type. Salaries are shown on every listing.' },
  { icon: FileText, title: 'Add your resume once', body: 'Upload a PDF to your profile. Every application sends it with you.' },
  { icon: Send, title: 'Apply in one click', body: 'No long forms. See each application move from in review to shortlisted.' },
];

export default function Home() {
  const { user } = useAuth();
  const { data, isPending, error, refetch } = useQuery({ queryKey: ['jobs', 'latest'], queryFn: () => api.get('/jobs?limit=6').then((r) => r.data) });

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-1/3 size-80 rounded-full bg-marigold/15 blur-3xl" />
        <div className="container relative py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            {data ? `${data.total} open roles right now` : 'Open roles across India'}
          </p>
          <SentenceSearch />
        </div>
      </section>

      <section className="container py-16" aria-labelledby="latest">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="latest" className="text-2xl font-extrabold sm:text-3xl">
              Fresh openings
            </h2>
            <p className="mt-1 text-muted-foreground">The newest roles, with salary and experience up front.</p>
          </div>
          <Link to="/jobs" className="hidden items-center gap-1 font-semibold text-primary hover:underline sm:flex">
            All jobs <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isPending && Array.from({ length: 6 }, (_, i) => <JobCardSkeleton key={i} />)}
          {data?.jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
        </div>
        {error && <ErrorState message={errorMessage(error)} onRetry={refetch} />}
        <Button variant="outline" asChild className="mt-6 w-full sm:hidden">
          <Link to="/jobs">See all jobs</Link>
        </Button>
      </section>

      <section className="container" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-extrabold sm:text-3xl">
          From search to shortlist
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-sm font-bold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {user?.role !== 'student' && (
        <section className="container mt-16">
          <div className="grid items-center gap-8 rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Hiring? Post a role in two minutes.</h2>
              <p className="mt-2 text-primary-foreground/80">Register your company, post jobs, and shortlist applicants with their resumes in one place.</p>
              <Button asChild size="lg" className="mt-6 rounded-full bg-marigold text-[hsl(234_34%_12%)] hover:bg-marigold/90">
                <Link to={user?.role === 'recruiter' ? '/recruiter/jobs/new' : '/signup?role=recruiter'}>
                  {user?.role === 'recruiter' ? 'Post a job' : 'Start hiring'} <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                [Building2, 'Company page with your logo'],
                [Briefcase, 'Edit or close roles any time'],
                [Users, 'Applicants with resume, skills and contact'],
                [BadgeCheck, 'Shortlist or decline in one click'],
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3">
                  <Icon className="size-5 shrink-0" aria-hidden="true" /> {text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
