import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CompanyLogo } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api, errorMessage, fieldErrors } from '@/lib/api';

function NewCompanyDialog({ open, onOpenChange }) {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: () => api.post('/companies', { name }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(data.message);
      navigate(`/recruiter/companies/${data.company.id}`);
    },
  });
  const error = fieldErrors(create.error).name ?? (create.error && errorMessage(create.error));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register a company</DialogTitle>
          <DialogDescription>You can add the logo, website and description next.</DialogDescription>
        </DialogHeader>
        <form
          id="new-company"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Company name" error={error}>
            {(id, d, inv) => <Input id={id} aria-describedby={d} aria-invalid={inv} value={name} onChange={(e) => setName(e.target.value)} autoFocus />}
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="new-company" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Companies() {
  const [open, setOpen] = useState(false);
  const { data, isPending, error, refetch } = useQuery({ queryKey: ['companies'], queryFn: () => api.get('/companies').then((r) => r.data.companies) });
  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Companies</h1>
          <p className="mt-1 text-muted-foreground">Jobs are posted under one of your companies.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" /> New company
        </Button>
      </div>
      <div className="mt-8 space-y-3">
        {isPending && Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        {error && <ErrorState message={errorMessage(error)} onRetry={refetch} />}
        {data?.length === 0 && (
          <EmptyState icon={Building2} title="No companies yet" action={<Button onClick={() => setOpen(true)}>Register your company</Button>}>
            Register the company you hire for, then post your first job.
          </EmptyState>
        )}
        {data?.map((c, i) => (
          <Link key={c.id} to={`/recruiter/companies/${c.id}`} className="flex animate-rise items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40" style={{ animationDelay: `${i * 40}ms` }}>
            <CompanyLogo company={c} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.name}</p>
              <p className="truncate text-sm text-muted-foreground">{c.location || 'Add a location'}</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </div>
      {open && <NewCompanyDialog open={open} onOpenChange={setOpen} />}
    </div>
  );
}
