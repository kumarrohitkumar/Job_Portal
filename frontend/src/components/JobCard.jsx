import { Clock, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompanyLogo } from '@/components/Avatar';
import { formatExperience, formatSalary, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

export function JobCard({ job, index = 0, className }) {
  return (
    <article
      className={cn('group relative flex animate-rise flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5', className)}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo company={job.company} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold leading-snug">
            <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{job.company?.name}</p>
        </div>
        <p className="tabular shrink-0 rounded-full bg-marigold-soft px-2.5 py-1 text-sm font-bold text-marigold-ink">{formatSalary(job.salary)}</p>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-accent-foreground">{job.jobType}</span>
        <span className="rounded-full bg-muted px-2.5 py-1">{formatExperience(job.experienceLevel)}</span>
        <span className="rounded-full bg-muted px-2.5 py-1">
          {job.position} {job.position === 1 ? 'opening' : 'openings'}
        </span>
      </div>
      <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden="true" /> {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" /> {timeAgo(job.createdAt)}
        </span>
        {job.applicantCount !== undefined && (
          <span className="flex items-center gap-1">
            <Users className="size-3.5" aria-hidden="true" /> {job.applicantCount} applied
          </span>
        )}
      </div>
    </article>
  );
}
