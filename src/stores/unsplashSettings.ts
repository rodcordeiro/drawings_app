import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContentFilter } from '@/services/unsplash';
import { DRAWING_TIME } from '@/utils/contants.util';
export type UnsplashSettings = { version: 1; searchTerms: string[]; timerEnabled: boolean; timerDurationSeconds: number; contentFilter: ContentFilter };
export const DEFAULT_UNSPLASH_SETTINGS: UnsplashSettings = {version: 1, searchTerms: [], timerEnabled: true, timerDurationSeconds: DRAWING_TIME >= 10 && DRAWING_TIME <= 7200 ? DRAWING_TIME : 60, contentFilter: 'high'};
const KEY = 'unsplash.settings.v1';
export function validateSettings(raw: unknown): UnsplashSettings {
  if (!raw || typeof raw !== 'object') return {...DEFAULT_UNSPLASH_SETTINGS};
  const obj = raw as Record<string, unknown>;
  const searchTerms = Array.isArray(obj.searchTerms) ? [...new Set(obj.searchTerms.filter((t): t is string => typeof t === 'string').map(t => t.trim()).filter(Boolean))] : [];
  return {version: 1, searchTerms,
    timerEnabled: typeof obj.timerEnabled === 'boolean' ? obj.timerEnabled : DEFAULT_UNSPLASH_SETTINGS.timerEnabled,
    timerDurationSeconds: typeof obj.timerDurationSeconds === 'number' && Number.isInteger(obj.timerDurationSeconds) && obj.timerDurationSeconds >= 10 && obj.timerDurationSeconds <= 7200 ? obj.timerDurationSeconds : DEFAULT_UNSPLASH_SETTINGS.timerDurationSeconds,
    contentFilter: obj.contentFilter === 'low' ? 'low' : 'high'};
}
export async function loadUnsplashSettings(): Promise<UnsplashSettings> {
  try { const value = await AsyncStorage.getItem(KEY); return validateSettings(value ? JSON.parse(value) : null); }
  catch { return {...DEFAULT_UNSPLASH_SETTINGS}; }
}
export async function saveUnsplashSettings(settings: UnsplashSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(validateSettings(settings)));
}
