import type { WeatherCondition, WindDirection } from '@/core/db/types';

/** Open-Meteo WMO weather codes, mapped to our coarse condition buckets. */
export function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    return 'snow';
  }
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 95) return 'rain'; // thunderstorm — bucket as rain
  return 'cloudy';
}

const COMPASS: WindDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Convert a wind bearing in degrees (meteorological FROM) to a compass label. */
export function bearingToCompass(degrees: number): WindDirection {
  // Normalize to [0, 360)
  const d = ((degrees % 360) + 360) % 360;
  // 8-way: each bucket is 45° wide, centered on N at 0/360.
  const index = Math.floor((d + 22.5) / 45) % 8;
  return COMPASS[index];
}

export function celsiusToF(c: number): number {
  return c * (9 / 5) + 32;
}

export function metersPerSecondToMph(mps: number): number {
  return mps * 2.236936;
}

export function kmPerHourToMph(kmh: number): number {
  return kmh * 0.621371;
}

export interface AggregatedWeather {
  /** Mean over the window, in °F. */
  temperature_f: number;
  /** Mean over the window, in mph. */
  wind_speed_mph: number;
  /** Vector-mean wind direction over the window, as a compass label. */
  wind_direction: WindDirection;
  /** Sum of precipitation across the window, in mm. */
  precipitation_mm: number;
  /** Mode (most common) condition over the window. */
  weather_condition: WeatherCondition;
}

/**
 * Average a slice of hourly Open-Meteo arrays into a single round-day
 * weather summary. The "round window" is the 10am–4pm local hours by
 * default (golf-prime time). Caller chooses indexes; this is just math.
 */
export function aggregateHourly(input: {
  temperatureF: number[];
  windSpeedMph: number[];
  windDirectionDeg: number[];
  precipitationMm: number[];
  weatherCodes: number[];
}): AggregatedWeather {
  const n = input.temperatureF.length;
  if (n === 0) {
    return {
      temperature_f: 0,
      wind_speed_mph: 0,
      wind_direction: 'N',
      precipitation_mm: 0,
      weather_condition: 'clear',
    };
  }

  const temperature_f =
    input.temperatureF.reduce((s, v) => s + v, 0) / n;
  const wind_speed_mph =
    input.windSpeedMph.reduce((s, v) => s + v, 0) / n;
  const precipitation_mm = input.precipitationMm.reduce((s, v) => s + v, 0);

  // Vector mean of wind direction so opposite gusts don't average into 0.
  let sumX = 0;
  let sumY = 0;
  for (const deg of input.windDirectionDeg) {
    const rad = (deg * Math.PI) / 180;
    sumX += Math.cos(rad);
    sumY += Math.sin(rad);
  }
  const meanRad = Math.atan2(sumY / n, sumX / n);
  const meanDeg = (meanRad * 180) / Math.PI;
  const wind_direction = bearingToCompass(meanDeg);

  // Mode condition.
  const counts = new Map<WeatherCondition, number>();
  for (const code of input.weatherCodes) {
    const c = mapWeatherCode(code);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let weather_condition: WeatherCondition = 'clear';
  let max = -1;
  for (const [c, k] of counts) {
    if (k > max) {
      max = k;
      weather_condition = c;
    }
  }

  return {
    temperature_f,
    wind_speed_mph,
    wind_direction,
    precipitation_mm,
    weather_condition,
  };
}

/** Indexes of the 10:00–16:00 hours (inclusive) within a 24-hour array. */
export const GOLF_HOURS_INDEXES: number[] = [10, 11, 12, 13, 14, 15, 16];
