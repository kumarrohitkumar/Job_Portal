import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { RequireRole } from '@/components/RequireRole';
import Home from '@/pages/Home';

// Everything but the home page loads on demand, so the first visit stays light.
const Jobs = lazy(() => import('@/pages/Jobs'));
const JobDetail = lazy(() => import('@/pages/JobDetail'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const Profile = lazy(() => import('@/pages/Profile'));
const Companies = lazy(() => import('@/pages/recruiter/Companies'));
const CompanyEdit = lazy(() => import('@/pages/recruiter/CompanyEdit'));
const RecruiterJobs = lazy(() => import('@/pages/recruiter/RecruiterJobs'));
const JobForm = lazy(() => import('@/pages/recruiter/JobForm'));
const Applicants = lazy(() => import('@/pages/recruiter/Applicants'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const recruiter = (el) => <RequireRole role="recruiter">{el}</RequireRole>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="signup" element={<AuthPage mode="signup" />} />
        <Route path="profile" element={<RequireRole>{<Profile />}</RequireRole>} />
        <Route path="recruiter/companies" element={recruiter(<Companies />)} />
        <Route path="recruiter/companies/:id" element={recruiter(<CompanyEdit />)} />
        <Route path="recruiter/jobs" element={recruiter(<RecruiterJobs />)} />
        <Route path="recruiter/jobs/new" element={recruiter(<JobForm />)} />
        <Route path="recruiter/jobs/:id/edit" element={recruiter(<JobForm />)} />
        <Route path="recruiter/jobs/:id/applicants" element={recruiter(<Applicants />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
