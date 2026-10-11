import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, FileText, Inbox, Mail, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, PageSpinner } from '@/components/States';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const FILTERS = [
  ['all', 'All'],
  ['pending', 'In review'],
  ['accepted', 'Shortlisted'],
  ['rejected', 'Not selected'],
];

export default function Applicants() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const key = ['applicants', id];
  const { data, isPending, error, refetch } = useQuery({ queryKey: key, queryFn: () => api.get(`/jobs/${id}/applicants`).then((r) => r.data) });

  const decide = useMutation({
    mutationFn: ({ appId, status }) => api.patch(`/applications/${appId}/status`, { status }).then((r) => r.data),
    // Update the list right away; roll back if the server refuses.
    onMutate: async ({ appId, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (d) => ({ ...d, applications: d.applications.map((a) => (a.id === appId ? { ...a, status } : a)) }));
      return { prev };
    },
    onSuccess: (res) => toast.success(res.message),
    onError: (err, _v, ctx) => {
      qc.setQueryData(key, ctx.prev);
      toast.error(errorMessage(err));
    },
  });

  if (isPending) return <PageSpinner />;
  if (error)
    return (
      <div className="container max-w-5xl py-10">
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      </div>
    );

  const counts = Object.fromEntries(FILTERS.map(([k]) => [k, k === 'all' ? data.applications.length : data.applications.filter((a) => a.status === k).length]));
  const shown = data.applications.filter((a) => filter === 'all' || a.status === filter);

  return (
    <div className="container max-w-5xl py-10">
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> My jobs
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">Applicants</h1>
      <p className="mt-1 text-muted-foreground">
        {data.job.title} at {data.job.company?.name}
      </p>

      <div role="tablist" aria-label="Filter applicants" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={filter === k}
            onClick={() => setFilter(k)}
            className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', filter === k ? 'border-primary bg-primary-soft text-accent-foreground' : 'bg-card hover:border-primary/50')}
          >
            {label} <span className="tabular text-muted-foreground">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {data.applications.length === 0 && (
          <EmptyState icon={Inbox} title="No applicants yet">
            Share the job link; applications appear here as they come in.
          </EmptyState>
        )}
        {data.applications.length > 0 && shown.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No applicants in this group.</p>}
        {shown.map((a, i) => (
          <article key={a.id} className="animate-rise rounded-2xl border bg-card p-5" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar name={a.applicant.fullname} src={a.applicant.profile.photoUrl} className="size-12" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold">{a.applicant.fullname}</h2>
                  <StatusBadge status={a.status} />
                </div>
                <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <Mail className="size-3.5" aria-hidden="true" />
                    <a href={`mailto:${a.applicant.email}`} className="hover:text-foreground hover:underline">
                      {a.applicant.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Phone className="size-3.5" aria-hidden="true" /> {a.applicant.phoneNumber}
                  </li>
                  <li>Applied {formatDate(a.appliedAt)}</li>
                </ul>
                {a.applicant.profile.bio && <p className="mt-3 text-sm">{a.applicant.profile.bio}</p>}
                {a.applicant.profile.skills.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {a.applicant.profile.skills.map((s) => (
                      <li key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                {a.applicant.profile.resumeUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={a.applicant.profile.resumeUrl} target="_blank" rel="noreferrer">
                      <FileText className="size-4" aria-hidden="true" /> Resume
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground sm:text-center">No resume</span>
                )}
                <Button size="sm" variant={a.status === 'accepted' ? 'secondary' : 'default'} disabled={a.status === 'accepted'} onClick={() => decide.mutate({ appId: a.id, status: 'accepted' })} aria-label={`Shortlist ${a.applicant.fullname}`}>
                  <Check className="size-4" aria-hidden="true" /> Shortlist
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive" disabled={a.status === 'rejected'} onClick={() => decide.mutate({ appId: a.id, status: 'rejected' })} aria-label={`Decline ${a.applicant.fullname}`}>
                  <X className="size-4" aria-hidden="true" /> Decline
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
