import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CompanyLogo } from '@/components/Avatar';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api, errorMessage } from '@/lib/api';
import { formatSalary, timeAgo } from '@/lib/format';

export default function RecruiterJobs() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { data, isPending, error, refetch } = useQuery({ queryKey: ['jobs', 'mine'], queryFn: () => api.get('/jobs/mine').then((r) => r.data.jobs) });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const jobs = data?.filter((j) => `${j.title} ${j.company?.name}`.toLowerCase().includes(q.trim().toLowerCase()));
  const total = data?.reduce((s, j) => s + j.applicantCount, 0) ?? 0;

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">My jobs</h1>
          {data && (
            <p className="mt-1 text-muted-foreground">
              {data.length} {data.length === 1 ? 'job' : 'jobs'}, {total} {total === 1 ? 'applicant' : 'applicants'} in total
            </p>
          )}
        </div>
        <Button asChild>
          <Link to="/recruiter/jobs/new">
            <Plus className="size-4" aria-hidden="true" /> Post a job
          </Link>
        </Button>
      </div>

      {data?.length > 0 && (
        <label className="mt-6 flex max-w-sm items-center gap-2 rounded-xl border bg-card px-3">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Filter my jobs</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title or company" className="h-10 w-full bg-transparent text-sm focus:outline-none" />
        </label>
      )}

      <div className="mt-6 space-y-3">
        {isPending && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        {error && <ErrorState message={errorMessage(error)} onRetry={refetch} />}
        {data?.length === 0 && (
          <EmptyState icon={Briefcase} title="You haven't posted a job yet" action={<Button asChild><Link to="/recruiter/jobs/new">Post your first job</Link></Button>}>
            Register a company, then post a role. It appears on the job board right away.
          </EmptyState>
        )}
        {jobs?.map((job, i) => (
          <article key={job.id} className="flex animate-rise flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <CompanyLogo company={job.company} />
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold">
                  <Link to={`/jobs/${job.id}`} className="hover:underline">
                    {job.title}
                  </Link>
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {job.company?.name} <span aria-hidden="true">·</span> {job.location} <span aria-hidden="true">·</span> {formatSalary(job.salary)} <span aria-hidden="true">·</span> {timeAgo(job.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link to={`/recruiter/jobs/${job.id}/applicants`}>
                  <Users className="size-4" aria-hidden="true" /> {job.applicantCount} {job.applicantCount === 1 ? 'applicant' : 'applicants'}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/recruiter/jobs/${job.id}/edit`} aria-label={`Edit ${job.title}`}>
                  <Pencil className="size-4" aria-hidden="true" /> Edit
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive-soft hover:text-destructive" onClick={() => setDeleting(job)} aria-label={`Delete ${job.title}`}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </article>
        ))}
        {data?.length > 0 && jobs?.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No jobs match “{q}”.</p>}
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this job?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” and its {deleting?.applicantCount ?? 0} applications will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={() => remove.mutate(deleting.id)} disabled={remove.isPending}>
              {remove.isPending ? 'Deleting…' : 'Delete job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
