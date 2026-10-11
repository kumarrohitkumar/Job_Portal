import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MapPin, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { JobCard } from '@/components/JobCard';
import { EmptyState, ErrorState, JobCardSkeleton } from '@/components/States';
import { Button } from '@/components/ui/button';
import { api, errorMessage } from '@/lib/api';
import { JOB_TYPES } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Search state lives in the URL, so results can be shared and the back button works. */
export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const keyword = params.get('keyword') ?? '';
  const location = params.get('location') ?? '';
  const jobType = params.get('jobType') ?? '';
  const [draft, setDraft] = useState({ keyword, location });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setDraft({ keyword, location });
  }, [keyword, location]);

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['jobs', { keyword, location, jobType }],
    queryFn: () => api.get('/jobs', { params: { keyword: keyword || undefined, location: location || undefined, jobType: jobType || undefined } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  function update(next) {
    const merged = { keyword, location, jobType, ...next };
    setParams(Object.fromEntries(Object.entries(merged).filter(([, v]) => v)), { replace: true });
  }
  const activeCount = [keyword, location, jobType].filter(Boolean).length;

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Find jobs</h1>
      <form
        role="search"
        aria-label="Search jobs"
        onSubmit={(e) => {
          e.preventDefault();
          update({ keyword: draft.keyword.trim(), location: draft.location.trim() });
        }}
        className="mt-6 grid gap-2 rounded-2xl border bg-card p-2 shadow-sm sm:grid-cols-[1fr_0.7fr_auto]"
      >
        <label className="flex items-center gap-2 rounded-xl px-3 focus-within:bg-muted">
          <Search className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Job title, skill or keyword</span>
          <input value={draft.keyword} onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} placeholder="Title, skill or keyword" className="h-11 w-full bg-transparent focus:outline-none" />
        </label>
        <label className="flex items-center gap-2 rounded-xl px-3 focus-within:bg-muted sm:border-l">
          <MapPin className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">City</span>
          <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="City" className="h-11 w-full bg-transparent focus:outline-none" />
        </label>
        <Button type="submit" className="h-11 rounded-xl px-6">
          Search
        </Button>
      </form>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filters" className={cn('lg:block', filtersOpen ? 'block' : 'hidden')}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Job type</h2>
          <div className="mt-3 flex flex-wrap gap-2 lg:flex-col">
            {['', ...JOB_TYPES].map((t) => (
              <button
                key={t || 'any'}
                type="button"
                aria-pressed={jobType === t}
                onClick={() => update({ jobType: t })}
                className={cn('rounded-full border px-3.5 py-1.5 text-left text-sm font-medium transition-colors lg:rounded-lg', jobType === t ? 'border-primary bg-primary-soft text-accent-foreground' : 'bg-card hover:border-primary/50')}
              >
                {t || 'Any type'}
              </button>
            ))}
          </div>
        </aside>

        <section aria-labelledby="results" aria-busy={isFetching}>
          <div className="flex flex-wrap items-center gap-2">
            <p id="results" className="mr-auto text-sm text-muted-foreground" aria-live="polite">
              {data ? (
                <>
                  <span className="font-bold text-foreground">{data.total}</span> {data.total === 1 ? 'job' : 'jobs'}
                  {keyword && <> for “{keyword}”</>}
                  {location && <> in {location}</>}
                </>
              ) : (
                'Searching…'
              )}
            </p>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })}>
                <X className="size-4" aria-hidden="true" /> Clear filters
              </Button>
            )}
            <Button variant="outline" size="sm" className="lg:hidden" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
              <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters
            </Button>
          </div>
          <div className={cn('mt-4 grid gap-4 md:grid-cols-2 transition-opacity', isFetching && !isPending && 'opacity-60')}>
            {isPending && Array.from({ length: 4 }, (_, i) => <JobCardSkeleton key={i} />)}
            {data?.jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
          </div>
          {error && <ErrorState message={errorMessage(error)} onRetry={refetch} />}
          {data?.jobs.length === 0 && (
            <EmptyState icon={SearchX} title="No jobs match that search" action={<Button variant="outline" onClick={() => setParams({}, { replace: true })}>See all jobs</Button>}>
              Try a broader keyword, another city, or a different job type.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
