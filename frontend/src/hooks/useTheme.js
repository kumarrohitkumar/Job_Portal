import { useEffect, useState } from 'react';

const read = () => {
  try {
    return localStorage.getItem('theme') ?? 'system';
  } catch {
    return 'system';
  }
};

/** Light, dark or follow the system; saved per browser. */
export function useTheme() {
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches));
    apply();
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* private mode: theme just isn't remembered */
    }
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  return [theme, setTheme];
}
