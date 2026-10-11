import { Briefcase, Building2, LogOut, Menu, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@/components/Avatar';
import { Brand } from '@/components/Brand';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const linkClass = ({ isActive }) =>
  cn('rounded-full px-3.5 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary-soft text-accent-foreground' : 'text-muted-foreground hover:text-foreground');

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [location.pathname]);

  const links =
    user?.role === 'recruiter'
      ? [
          { to: '/recruiter/jobs', label: 'My jobs' },
          { to: '/recruiter/companies', label: 'Companies' },
        ]
      : [
          { to: '/', label: 'Home', end: true },
          { to: '/jobs', label: 'Find jobs' },
        ];

  async function logout() {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-4">
        <Brand />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-muted"
              >
                <Avatar name={user.fullname} src={user.profile.photoUrl} className="size-8" />
                <span className="max-w-[10rem] truncate text-sm font-semibold">{user.fullname.split(' ')[0]}</span>
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-64 animate-in fade-in-0 zoom-in-95 rounded-xl border bg-popover p-2 shadow-xl">
                  <div className="border-b px-3 pb-3 pt-1">
                    <p className="truncate font-semibold">{user.fullname}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{user.role === 'recruiter' ? 'Recruiter' : 'Job seeker'}</p>
                  </div>
                  <Link role="menuitem" to="/profile" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <User className="size-4" /> My profile
                  </Link>
                  {user.role === 'recruiter' && (
                    <Link role="menuitem" to="/recruiter/companies" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <Building2 className="size-4" /> Companies
                    </Link>
                  )}
                  <button role="menuitem" type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive-soft">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          )}
          <button type="button" className="grid size-9 place-items-center rounded-full hover:bg-muted md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="container animate-in slide-in-from-top-2 border-t pb-4 pt-2 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium', isActive ? 'bg-primary-soft text-accent-foreground' : '')}>
              <Briefcase className="size-4" /> {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium">
                <User className="size-4" /> My profile
              </NavLink>
              <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 font-medium text-destructive">
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
