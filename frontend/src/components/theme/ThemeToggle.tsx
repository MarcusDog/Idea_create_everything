'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
        <Monitor className="w-5 h-5" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
      title={`当前: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}`}
    >
      {theme === 'light' && <Sun className="w-5 h-5" />}
      {theme === 'dark' && <Moon className="w-5 h-5" />}
      {theme === 'system' && <Monitor className="w-5 h-5" />}
    </button>
  );
}

export default ThemeToggle;
