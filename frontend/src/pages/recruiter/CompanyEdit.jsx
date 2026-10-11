import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImageUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CompanyLogo } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { ErrorState, PageSpinner } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkFile } from '@/hooks/useUpload';
import { api, errorMessage, fieldErrors } from '@/lib/api';

export default function CompanyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const { data: company, isPending, error } = useQuery({ queryKey: ['company', id], queryFn: () => api.get(`/companies/${id}`).then((r) => r.data.company) });
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (company) setForm({ name: company.name, description: company.description, website: company.website, location: company.location });
  }, [company]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const save = useMutation({
    mutationFn: () => {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v ?? ''));
      if (logo) body.append('logo', logo);
      return api.patch(`/companies/${id}`, body).then((r) => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.setQueryData(['company', id], data.company);
      toast.success(data.message);
      navigate('/recruiter/companies');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isPending || (!form && !error)) return <PageSpinner />;
  if (error)
    return (
      <div className="container max-w-3xl py-10">
        <ErrorState message={errorMessage(error)} />
      </div>
    );
  const errors = fieldErrors(save.error);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function pickLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const problem = checkFile(file, 'image');
    if (problem) return toast.error(problem);
    if (!file) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="container max-w-3xl py-10">
      <Link to="/recruiter/companies" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Companies
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">Company details</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-8 space-y-6 rounded-3xl border bg-card p-6 sm:p-8"
      >
        <div className="flex items-center gap-4">
          <CompanyLogo company={{ ...company, name: form.name, logoUrl: preview ?? company.logoUrl }} className="size-20 text-2xl" />
          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickLogo} className="sr-only" tabIndex={-1} aria-hidden="true" />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <ImageUp className="size-4" aria-hidden="true" /> {company.logoUrl || preview ? 'Change logo' : 'Upload logo'}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP, up to 2 MB.</p>
          </div>
        </div>
        <Field label="Company name" error={errors.name}>
          {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} value={form.name} onChange={set('name')} />}
        </Field>
        <Field label="Description" optional error={errors.description}>
          {(fid, d, inv) => <textarea id={fid} aria-describedby={d} aria-invalid={inv} rows={4} value={form.description} onChange={set('description')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />}
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Website" optional error={errors.website}>
            {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} type="url" placeholder="https://" value={form.website} onChange={set('website')} />}
          </Field>
          <Field label="Location" optional error={errors.location}>
            {(fid, d, inv) => <Input id={fid} aria-describedby={d} aria-invalid={inv} placeholder="Bengaluru" value={form.location} onChange={set('location')} />}
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/recruiter/companies')}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save company'}
          </Button>
        </div>
      </form>
    </div>
  );
}
