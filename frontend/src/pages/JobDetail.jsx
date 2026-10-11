import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Calendar, CheckCircle2, ExternalLink, GraduationCap, IndianRupee, MapPin, Users } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CompanyLogo } from '@/components/Avatar';
import { EmptyState, ErrorState, PageSpinner } from '@/components/States';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatExperience, formatSalary, timeAgo } from '@/lib/format';

function ApplyPanel({ job }) {
  const { user } = useAuth();
  const location = useLocation();
  const qc = useQueryClient();
  const apply = useMutation({
    mutationFn: () => api.post(`/jobs/${job.id}/apply`),
    onSuccess: () => {
      toast.success('Application sent. Track it from your profile.');
      qc.invalidateQueries({ queryKey: ['job', job.id] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!user)
    return (
      <Button asChild size="lg" className="w-full">
        <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>Sign in to apply</Link>
      </Button>
    );
  if (user.role === 'recruiter') return <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">You are signed in as a recruiter. Job seekers apply from this page.</p>;
  if (job.hasApplied)
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 font-semibold text-success">
          <CheckCircle2 className="size-5" aria-hidden="true" /> You applied for this job
        </p>
        <StatusBadge status={job.myStatus} />
        <Button asChild variant="outline" className="w-full">
          <Link to="/profile">See my applications</Link>
        </Button>
      </div>
    );
  return (
    <div className="space-y-2">
      <Button size="lg" className="w-full" onClick={() => apply.mutate()} disabled={apply.isPending}>
        {apply.isPending ? 'Sending…' : 'Apply now'}
      </Button>
      {!user.profile.resumeUrl && (
        <p className="text-xs text-muted-foreground">
          Tip: <Link to="/profile" className="font-semibold text-primary underline-offset-2 hover:underline">add your resume</Link> so the recruiter can see it.
        </p>
      )}
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const { data: job, isPending, error, refetch } = useQuery({ queryKey: ['job', id], queryFn: () => api.get(`/jobs/${id}`).then((r) => r.data.job), retry: (n, err) => err?.response?.status !== 404 && n < 2 });

  if (isPending) return <PageSpinner />;
  if (error?.response?.status === 404)
    return (
      <div className="container py-16">
        <EmptyState icon={Briefcase} title="This job is no longer listed" action={<Button asChild><Link to="/jobs">Browse open jobs</Link></Button>}>
          It may have been filled or closed by the recruiter.
        </EmptyState>
      </div>
    );
  if (error)
    return (
      <div className="container py-16">
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      </div>
    );

  const facts = [
    [IndianRupee, 'Salary', formatSalary(job.salary)],
    [GraduationCap, 'Experience', formatExperience(job.experienceLevel)],
    [Briefcase, 'Job type', job.jobType],
    [Users, 'Openings', job.position],
    [MapPin, 'Location', job.location],
    [Calendar, 'Posted', formatDate(job.createdAt)],
  ];

  return (
    <div className="container py-8">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> All jobs
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CompanyLogo company={job.company} className="size-16 text-xl" />
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{job.title}</h1>
              <p className="mt-1 text-muted-foreground">
                {job.company?.name} <span aria-hidden="true">·</span> {job.location} <span aria-hidden="true">·</span> {timeAgo(job.createdAt)}
              </p>
            </div>
          </header>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(([Icon, label, value]) => (
              <div key={label} className="rounded-xl border bg-card p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden="true" /> {label}
                </dt>
                <dd className="tabular mt-1 font-bold">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-10">
            <h2 className="text-xl font-bold">About the role</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{job.description}</p>
          </section>
          {job.requirements.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">What you&apos;ll need</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {job.requirements.map((r) => (
                  <li key={r} className="rounded-full border bg-card px-3 py-1 text-sm font-medium">
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {job.company?.description && (
            <section className="mt-10 rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-bold">About {job.company.name}</h2>
              <p className="mt-2 text-muted-foreground">{job.company.description}</p>
              {job.company.website && (
                <a href={job.company.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Visit website <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </section>
          )}
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="tabular font-display text-3xl font-extrabold">{formatSalary(job.salary)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.applicantCount} {job.applicantCount === 1 ? 'person has' : 'people have'} applied
            </p>
            <div className="mt-5">
              <ApplyPanel job={job} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
