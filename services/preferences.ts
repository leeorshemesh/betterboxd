import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { ThemePresetId } from '@/constants/theme';
import type { FeedFilter, TopFiveMode } from '@/types';

export type { ThemePresetId };

export interface AppPreferences {
  themePreset: ThemePresetId;
  defaultExploreFilter: FeedFilter;
  defaultFeedFilter: FeedFilter;
  defaultAddType: Exclude<FeedFilter, 'all'>;
  topFiveMode: TopFiveMode;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  themePreset: 'midnightCoral',
  defaultExploreFilter: 'all',
  defaultFeedFilter: 'all',
  defaultAddType: 'movie',
  topFiveMode: 'mixed',
};

const KEY = 'betterboxd.preferences.v1';

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    /* ignore */
  }
}

function parsePreferences(raw: string | null): AppPreferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      themePreset: parsed.themePreset ?? DEFAULT_PREFERENCES.themePreset,
      defaultExploreFilter: parsed.defaultExploreFilter ?? DEFAULT_PREFERENCES.defaultExploreFilter,
      defaultFeedFilter: parsed.defaultFeedFilter ?? DEFAULT_PREFERENCES.defaultFeedFilter,
      defaultAddType: parsed.defaultAddType ?? DEFAULT_PREFERENCES.defaultAddType,
      topFiveMode: parsed.topFiveMode ?? DEFAULT_PREFERENCES.topFiveMode,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function loadPreferences(): Promise<AppPreferences> {
  return parsePreferences(await readRaw());
}

export async function savePreferences(next: AppPreferences): Promise<void> {
  await writeRaw(JSON.stringify(next));
}

export async function updatePreferences(
  patch: Partial<AppPreferences>,
): Promise<AppPreferences> {
  const current = await loadPreferences();
  const next = { ...current, ...patch };
  await savePreferences(next);
  return next;
}
