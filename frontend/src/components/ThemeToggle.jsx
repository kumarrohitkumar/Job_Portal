import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const NEXT = { light: 'dark', dark: 'system', system: 'light' };
const ICON = { light: Sun, dark: Moon, system: Monitor };
const LABEL = { light: 'Light theme', dark: 'Dark theme', system: 'System theme' };

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const Icon = ICON[theme];
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`${LABEL[theme]}. Switch to ${LABEL[NEXT[theme]].toLowerCase()}`}
      title={LABEL[theme]}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
