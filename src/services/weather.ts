import { getDb } from '@/core/db/database';
import { getCourse } from '@/core/db/repositories/courses';
import {
  listRoundsNeedingWeather,
  markRoundWeatherUnavailable,
  setRoundWeather,
} from '@/core/db/repositories/rounds';
import type { WeatherCondition, WindDirection } from '@/core/db/types';
import { logError } from './errorReporting';
import {
  aggregateHourly,
  celsiusToF,
  GOLF_HOURS_INDEXES,
  kmPerHourToMph,
} from './weatherTypes';

export interface WeatherData {
  temperature_f: number;
  wind_speed_mph: number;
  wind_direction: WindDirection;
  precipitation_mm: number;
  weather_condition: WeatherCondition;
}

const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoHourly {
  hourly?: {
    temperature_2m?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    precipitation?: number[];
    weather_code?: number[];
  };
}

function isoDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function isPastDate(dateIso: string, now: Date = new Date()): boolean {
  const today = isoDateOnly(now.toISOString());
  return isoDateOnly(dateIso) < today;
}

function summarize(payload: OpenMeteoHourly): WeatherData | null {
  const h = payload.hourly;
  if (
    h === undefined ||
    h.temperature_2m === undefined ||
    h.wind_speed_10m === undefined ||
    h.wind_direction_10m === undefined ||
    h.precipitation === undefined ||
    h.weather_code === undefined
  ) {
    return null;
  }
  const pick = <T>(arr: T[]): T[] => GOLF_HOURS_INDEXES
    .filter((i) => i < arr.length)
    .map((i) => arr[i]);

  const aggregated = aggregateHourly({
    // Open-Meteo defaults to °C and km/h — convert.
    temperatureF: pick(h.temperature_2m).map((c) => celsiusToF(c)),
    windSpeedMph: pick(h.wind_speed_10m).map((kmh) => kmPerHourToMph(kmh)),
    windDirectionDeg: pick(h.wind_direction_10m),
    precipitationMm: pick(h.precipitation),
    weatherCodes: pick(h.weather_code),
  });
  return {
    temperature_f: Math.round(aggregated.temperature_f * 10) / 10,
    wind_speed_mph: Math.round(aggregated.wind_speed_mph * 10) / 10,
    wind_direction: aggregated.wind_direction,
    precipitation_mm: Math.round(aggregated.precipitation_mm * 100) / 100,
    weather_condition: aggregated.weather_condition,
  };
}

async function fetchJson(url: string): Promise<OpenMeteoHourly | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as OpenMeteoHourly;
  } catch (e) {
    logError(e, { scope: 'weather.fetchJson', extra: { url } });
    return null;
  }
}

/** Fetch historical (archive) weather for a past date. */
export async function fetchHistoricalWeather(
  lat: number,
  lng: number,
  dateIso: string,
): Promise<WeatherData | null> {
  const date = isoDateOnly(dateIso);
  const url =
    `${ARCHIVE_BASE}?latitude=${lat}&longitude=${lng}` +
    `&start_date=${date}&end_date=${date}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code`;
  const payload = await fetchJson(url);
  if (payload === null) return null;
  return summarize(payload);
}

/** Fetch a forecast (today or future) for a date. */
export async function fetchCurrentForecast(
  lat: number,
  lng: number,
  dateIso: string,
): Promise<WeatherData | null> {
  const date = isoDateOnly(dateIso);
  const url =
    `${FORECAST_BASE}?latitude=${lat}&longitude=${lng}` +
    `&start_date=${date}&end_date=${date}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code`;
  const payload = await fetchJson(url);
  if (payload === null) return null;
  return summarize(payload);
}

/** Choose the right endpoint based on whether the round is in the past. */
export async function fetchWeatherForRound(
  lat: number,
  lng: number,
  dateIso: string,
): Promise<WeatherData | null> {
  return isPastDate(dateIso)
    ? fetchHistoricalWeather(lat, lng, dateIso)
    : fetchCurrentForecast(lat, lng, dateIso);
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Walk every round whose weather hasn't been fetched and try to populate
 * it. Throttled to one request per 200ms so Open-Meteo's free tier stays
 * happy. Skips rounds whose course doesn't have lat/lng.
 *
 * Safe to call repeatedly; each successful round is stamped with
 * weather_fetched_at so it won't be re-fetched. Failed fetches also stamp
 * the round so we don't retry endlessly.
 */
export async function backfillRoundWeather(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
}> {
  const db = getDb();
  const rounds = listRoundsNeedingWeather(db);
  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  for (const round of rounds) {
    const course = getCourse(db, round.course_id);
    if (course === null || course.latitude === null || course.longitude === null) {
      markRoundWeatherUnavailable(db, round.id);
      skipped += 1;
      continue;
    }
    const data = await fetchWeatherForRound(
      course.latitude,
      course.longitude,
      round.played_at,
    );
    if (data === null) {
      markRoundWeatherUnavailable(db, round.id);
      failed += 1;
    } else {
      setRoundWeather(db, round.id, {
        temperature_f: data.temperature_f,
        wind_speed_mph: data.wind_speed_mph,
        wind_direction: data.wind_direction,
        precipitation_mm: data.precipitation_mm,
        weather_condition: data.weather_condition,
      });
      fetched += 1;
    }
    await sleep(200);
  }
  return { fetched, skipped, failed };
}

/** Fire-and-forget weather fetch for a single round (used after Save). */
export function fetchAndStoreWeatherForRound(
  roundId: number,
  lat: number,
  lng: number,
  dateIso: string,
): void {
  void (async () => {
    try {
      const data = await fetchWeatherForRound(lat, lng, dateIso);
      const db = getDb();
      if (data === null) {
        markRoundWeatherUnavailable(db, roundId);
        return;
      }
      setRoundWeather(db, roundId, data);
    } catch (e) {
      logError(e, { scope: 'weather.fetchAndStore', extra: { roundId } });
    }
  })();
}
