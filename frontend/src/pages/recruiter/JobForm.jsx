import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Field } from '@/components/Field';
import { EmptyState, ErrorState, PageSpinner } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import { JOB_TYPES } from '@/lib/format';

const EMPTY = { title: '', description: '', requirements: '', salary: '', experienceLevel: '', location: '', jobType: 'Full-time', position: '1', companyId: '' };
const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

export default function JobForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const companies = useQuery({ queryKey: ['companies'], queryFn: () => api.get('/companies').then((r) => r.data.companies) });
  const job = useQuery({ queryKey: ['job', id], queryFn: () => api.get(`/jobs/${id}`).then((r) => r.data.job), enabled: editing });

  useEffect(() => {
    if (job.data)
      setForm({ ...job.data, requirements: job.data.requirements.join(', '), salary: String(job.data.salary), experienceLevel: String(job.data.experienceLevel), position: String(job.data.position), companyId: job.data.company?.id ?? '' });
  }, [job.data]);
  useEffect(() => {
    if (!editing && companies.data?.length === 1) setForm((f) => (f.companyId ? f : { ...f, companyId: companies.data[0].id }));
  }, [editing, companies.data]);

  const save = useMutation({
    mutationFn: () => {
      const { companyId, ...rest } = form;
      const body = { title: rest.title, description: rest.description, requirements: rest.requirements, salary: rest.salary, experienceLevel: rest.experienceLevel, location: rest.location, jobType: rest.jobType, position: rest.position };
      return (editing ? api.patch(`/jobs/${id}`, body) : api.post('/jobs', { ...body, companyId })).then((r) => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['job', data.job.id] });
      toast.success(data.message);
      navigate('/recruiter/jobs');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (companies.isPending || (editing && job.isPending)) return <PageSpinner />;
  if (companies.error || job.error)
    return (
      <div className="container max-w-3xl py-10">
        <ErrorState message={errorMessage(companies.error ?? job.error)} />
      </div>
    );
  if (!editing && companies.data.length === 0)
    return (
      <div className="container max-w-3xl py-16">
        <EmptyState icon={Building2} title="Register a company first" action={<Button asChild><Link to="/recruiter/companies">Go to companies</Link></Button>}>
          Every job is posted under a company you manage.
        </EmptyState>
      </div>
    );

  const errors = fieldErrors(save.error);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container max-w-3xl py-10">
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> My jobs
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">{editing ? 'Edit job' : 'Post a job'}</h1>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-8 space-y-6 rounded-3xl border bg-card p-6 sm:p-8"
      >
        {!editing && (
          <Field label="Company" error={errors.companyId}>
            {(fid, d, inv) => (
              <select id={fid} aria-describedby={d} aria-invalid={inv} value={form.companyId} onChange={set('companyId')} className={selectClass}>
                <option value="">Choose a company</option>
                {companies.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        <Field label="Job title" error={errors.title}>
          {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} placeholder="Frontend Developer" value={form.title} onChange={set('title')} />}
        </Field>
        <Field label="Description" error={errors.description} hint="What the person will do, who they work with, and what success looks like.">
          {(fid, d, inv) => <textarea id={fid} aria-describedby={d} aria-invalid={inv} rows={6} value={form.description} onChange={set('description')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />}
        </Field>
        <Field label="Skills and requirements" optional error={errors.requirements} hint="Separate with commas, e.g. React, TypeScript, Git">
          {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} value={form.requirements} onChange={set('requirements')} />}
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Salary (₹ LPA)" error={errors.salary} hint="Annual CTC in lakh rupees, e.g. 12">
            {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} type="number" min="0" step="0.5" inputMode="decimal" value={form.salary} onChange={set('salary')} />}
          </Field>
          <Field label="Experience (years)" error={errors.experienceLevel} hint="0 for freshers">
            {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} type="number" min="0" inputMode="numeric" value={form.experienceLevel} onChange={set('experienceLevel')} />}
          </Field>
          <Field label="Location" error={errors.location}>
            {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} placeholder="Bengaluru" value={form.location} onChange={set('location')} />}
          </Field>
          <Field label="Job type" error={errors.jobType}>
            {(fid, d, inv) => (
              <select id={fid} aria-describedby={d} aria-invalid={inv} value={form.jobType} onChange={set('jobType')} className={selectClass}>
                {JOB_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Openings" error={errors.position}>
            {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} type="number" min="1" inputMode="numeric" value={form.position} onChange={set('position')} />}
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/recruiter/jobs')}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Post job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
