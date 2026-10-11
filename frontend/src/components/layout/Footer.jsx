import { Link } from 'react-router-dom';
import { Brand } from '@/components/Brand';

export function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Brand />
          <p className="max-w-sm text-sm text-muted-foreground">Jobs and internships across India. Apply in one click and see where every application stands.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/jobs" className="hover:text-foreground">Find jobs</Link>
          <Link to="/signup?role=recruiter" className="hover:text-foreground">Hire with JobConnect</Link>
          <a href="https://github.com/kumarrohitkumar/Job_Portal" className="hover:text-foreground" target="_blank" rel="noreferrer">Source code</a>
        </nav>
      </div>
      <p className="container pb-8 text-xs text-muted-foreground">© {new Date().getFullYear()} JobConnect. Built by Rohit Kumar.</p>
    </footer>
  );
}
