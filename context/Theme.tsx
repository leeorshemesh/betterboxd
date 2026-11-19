import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  applyThemeColors,
  type ThemeColors,
  type ThemePresetId,
} from '@/constants/theme';
import { loadPreferences, updatePreferences } from '@/services/preferences';

interface ThemeContextValue {
  preset: ThemePresetId;
  colors: ThemeColors;
  setPreset: (id: ThemePresetId) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<ThemePresetId>(DEFAULT_THEME_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPreferences().then((prefs) => {
      if (cancelled) return;
      const id = prefs.themePreset in THEME_PRESETS ? prefs.themePreset : DEFAULT_THEME_ID;
      applyThemeColors(THEME_PRESETS[id].colors);
      setPresetState(id);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreset = useCallback((id: ThemePresetId) => {
    applyThemeColors(THEME_PRESETS[id].colors);
    setPresetState(id);
    void updatePreferences({ themePreset: id });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preset,
      colors: THEME_PRESETS[preset].colors,
      setPreset,
      ready,
    }),
    [preset, setPreset, ready],
  );

  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
