import { useState, useEffect, useCallback, createContext, useContext, ReactNode, createElement } from 'react';
import { getAllSettings, setSetting } from '../db/queries';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  updateSetting: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllSettings().then(s => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    await setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return createElement(SettingsContext.Provider, { value: { settings, loaded, updateSetting } }, children);
}

// All components share the same settings state via context
export function useSettings() {
  return useContext(SettingsContext);
}
