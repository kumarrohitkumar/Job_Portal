import { useMutation, useQuery } from '@tanstack/react-query';
import { Camera, FileText, Inbox, Mail, Pencil, Phone, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, CompanyLogo } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { checkFile } from '@/hooks/useUpload';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import { formatDate } from '@/lib/format';

function useProfileUpdate(onDone) {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (body) => api.patch('/users/me', body).then((r) => r.data),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(data.message);
      onDone?.();
    },
  });
}

function EditProfileDialog({ open, onOpenChange, user }) {
  const [form, setForm] = useState({ fullname: user.fullname, email: user.email, phoneNumber: user.phoneNumber, bio: user.profile.bio, skills: user.profile.skills.join(', ') });
  const update = useProfileUpdate(() => onOpenChange(false));
  const errors = fieldErrors(update.error);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Recruiters see this when you apply.</DialogDescription>
        </DialogHeader>
        <form
          id="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate(form);
          }}
          className="space-y-4"
        >
          <Field label="Full name" error={errors.fullname}>
            {(id, d, inv) => <Input id={id} aria-describedby={d} aria-invalid={inv} value={form.fullname} onChange={set('fullname')} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email}>
              {(id, d, inv) => <Input id={id} type="email" aria-describedby={d} aria-invalid={inv} value={form.email} onChange={set('email')} />}
            </Field>
            <Field label="Phone" error={errors.phoneNumber}>
              {(id, d, inv) => <Input id={id} type="tel" aria-describedby={d} aria-invalid={inv} value={form.phoneNumber} onChange={set('phoneNumber')} />}
            </Field>
          </div>
          <Field label="About you" optional error={errors.bio} hint="A line or two about what you do and what you are looking for.">
            {(id, d, inv) => <textarea id={id} aria-describedby={d} aria-invalid={inv} rows={3} maxLength={500} value={form.bio} onChange={set('bio')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" />}
          </Field>
          <Field label="Skills" optional hint="Separate with commas, e.g. React, SQL, Figma">
            {(id, d) => <Input id={id} aria-describedby={d} value={form.skills} onChange={set('skills')} />}
          </Field>
          {update.error && !Object.keys(errors).length && <p className="text-sm font-medium text-destructive">{errorMessage(update.error)}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="profile-form" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileButton({ kind, field, accept, label, icon: Icon, variant = 'outline' }) {
  const ref = useRef(null);
  const update = useProfileUpdate();
  function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const problem = checkFile(file, kind);
    if (problem) return toast.error(problem);
    if (!file) return;
    const body = new FormData();
    body.append(field, file);
    update.mutate(body, { onError: (err) => toast.error(errorMessage(err)) });
  }
  return (
    <>
      <input ref={ref} type="file" accept={accept} onChange={pick} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <Button type="button" variant={variant} size="sm" onClick={() => ref.current?.click()} disabled={update.isPending}>
        <Icon className="size-4" aria-hidden="true" /> {update.isPending ? 'Uploading…' : label}
      </Button>
    </>
  );
}

function Applications() {
  const { data, isPending, error, refetch } = useQuery({ queryKey: ['applications', 'mine'], queryFn: () => api.get('/applications/mine').then((r) => r.data.applications) });
  return (
    <section className="mt-10" aria-labelledby="apps">
      <h2 id="apps" className="text-2xl font-extrabold">
        My applications {data && <span className="text-muted-foreground">({data.length})</span>}
      </h2>
      <div className="mt-4 space-y-3">
        {isPending && Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        {error && <ErrorState message={errorMessage(error)} onRetry={refetch} />}
        {data?.length === 0 && (
          <EmptyState icon={Inbox} title="No applications yet" action={<Button asChild><Link to="/jobs">Find jobs</Link></Button>}>
            When you apply for a job it shows up here with its status.
          </EmptyState>
        )}
        {data?.map((a, i) => (
          <Link key={a.id} to={`/jobs/${a.job.id}`} className="flex animate-rise items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40" style={{ animationDelay: `${i * 40}ms` }}>
            <CompanyLogo company={a.job.company} className="size-11" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{a.job.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {a.job.company?.name} <span aria-hidden="true">·</span> Applied {formatDate(a.appliedAt)}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const student = user.role === 'student';

  return (
    <div className="container max-w-4xl py-10">
      <section className="rounded-3xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative self-start">
            <Avatar name={user.fullname} src={user.profile.photoUrl} className="size-24 text-2xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold">{user.fullname}</h1>
                <p className="mt-0.5 text-sm font-medium text-primary">{student ? 'Job seeker' : 'Recruiter'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden="true" /> Edit profile
              </Button>
            </div>
            {user.profile.bio && <p className="mt-3 text-muted-foreground">{user.profile.bio}</p>}
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" aria-hidden="true" /> {user.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" aria-hidden="true" /> {user.phoneNumber}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <FileButton kind="image" field="photo" accept="image/png,image/jpeg,image/webp" label={user.profile.photoUrl ? 'Change photo' : 'Add photo'} icon={Camera} variant="ghost" />
            </div>
          </div>
        </div>

        {student && (
          <div className="mt-8 grid gap-4 border-t pt-6 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Skills</h2>
              {user.profile.skills.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {user.profile.skills.map((s) => (
                    <li key={s} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-accent-foreground">
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No skills yet. Add a few so recruiters can find your strengths.</p>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Resume</h2>
              {user.profile.resumeUrl ? (
                <a href={user.profile.resumeUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40">
                  <FileText className="size-8 text-destructive" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{user.profile.resumeOriginalName}</span>
                  <span className="text-sm text-primary">Open</span>
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No resume yet. Recruiters see it with every application.</p>
              )}
              <div className="mt-3">
                <FileButton kind="pdf" field="resume" accept="application/pdf" label={user.profile.resumeUrl ? 'Replace resume' : 'Upload resume (PDF)'} icon={Upload} />
              </div>
            </div>
          </div>
        )}
      </section>

      {student && <Applications />}
      {editing && <EditProfileDialog open={editing} onOpenChange={setEditing} user={user} />}
    </div>
  );
}
