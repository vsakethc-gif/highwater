/**
 * state.tsx — what the person has chosen: their place, and whether Scenario Mode is on.
 * Every tab reads it with useAppState().
 *
 * Privacy: an exact location (GPS or ZIP) is kept only in memory. Only a county choice is
 * remembered on the phone, as a convenience. Scenario Mode turns off when the app closes.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { COUNTIES, DEFAULT_COUNTY_FIPS } from '../../shared/config';
import type { Place } from '../../shared/hazards/types';
import { platform } from '../../shared/platform';

const COUNTY_KEY = 'sc5ready.county';

interface AppState {
  place: Place;
  /** Scenario id when Scenario Mode is on, otherwise null. */
  scenario: string | null;
  setPlace: (p: Place) => void;
  setScenario: (id: string | null, county?: string) => void;
}

const Ctx = createContext<AppState | null>(null);

function savedCounty(): string {
  const fips = platform().storage.getItem(COUNTY_KEY);
  return fips && COUNTIES.some((c) => c.fips === fips) ? fips : DEFAULT_COUNTY_FIPS;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [place, setPlaceState] = useState<Place>(() => ({ kind: 'county', fips: savedCounty() }));
  const [scenario, setScenarioState] = useState<string | null>(null);

  const setPlace = useCallback((p: Place) => {
    setPlaceState(p);
    if (p.kind === 'county') platform().storage.setItem(COUNTY_KEY, p.fips);
  }, []);

  /** Turning a scenario on also jumps to that scenario's county, like the website. */
  const setScenario = useCallback(
    (id: string | null, county?: string) => {
      setScenarioState(id);
      if (county) setPlace({ kind: 'county', fips: county });
    },
    [setPlace],
  );

  const value = useMemo(() => ({ place, scenario, setPlace, setScenario }), [place, scenario, setPlace, setScenario]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const s = useContext(Ctx);
  if (!s) throw new Error('useAppState must be used inside AppStateProvider');
  return s;
}
