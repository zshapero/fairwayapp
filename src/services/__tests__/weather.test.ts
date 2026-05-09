import { describe, expect, it } from 'vitest';
import {
  aggregateHourly,
  bearingToCompass,
  celsiusToF,
  kmPerHourToMph,
  mapWeatherCode,
} from '../weatherTypes';

describe('mapWeatherCode', () => {
  it('maps WMO codes to coarse buckets', () => {
    expect(mapWeatherCode(0)).toBe('clear');
    expect(mapWeatherCode(1)).toBe('partly_cloudy');
    expect(mapWeatherCode(2)).toBe('partly_cloudy');
    expect(mapWeatherCode(3)).toBe('cloudy');
    expect(mapWeatherCode(61)).toBe('rain');
    expect(mapWeatherCode(80)).toBe('rain');
    expect(mapWeatherCode(95)).toBe('rain');
    expect(mapWeatherCode(73)).toBe('snow');
    expect(mapWeatherCode(86)).toBe('snow');
  });
  it('falls back to cloudy for unknown codes', () => {
    expect(mapWeatherCode(48)).toBe('cloudy');
  });
});

describe('bearingToCompass', () => {
  it('maps cardinal directions correctly', () => {
    expect(bearingToCompass(0)).toBe('N');
    expect(bearingToCompass(45)).toBe('NE');
    expect(bearingToCompass(90)).toBe('E');
    expect(bearingToCompass(180)).toBe('S');
    expect(bearingToCompass(270)).toBe('W');
    expect(bearingToCompass(360)).toBe('N');
  });
  it('handles negative bearings', () => {
    expect(bearingToCompass(-45)).toBe('NW');
  });
});

describe('unit conversions', () => {
  it('celsius to F', () => {
    expect(celsiusToF(0)).toBe(32);
    expect(Math.round(celsiusToF(20) * 10) / 10).toBe(68);
  });
  it('km/h to mph', () => {
    expect(Math.round(kmPerHourToMph(16) * 10) / 10).toBe(9.9);
  });
});

describe('aggregateHourly', () => {
  it('averages temperature and wind speed and sums precipitation', () => {
    const out = aggregateHourly({
      temperatureF: [60, 62, 64, 66, 68, 70, 72],
      windSpeedMph: [5, 6, 7, 8, 9, 10, 11],
      windDirectionDeg: [180, 180, 180, 180, 180, 180, 180],
      precipitationMm: [0, 0, 0.1, 0.2, 0, 0, 0],
      weatherCodes: [0, 0, 0, 1, 1, 1, 1],
    });
    expect(out.temperature_f).toBe(66); // mean of 60..72
    expect(out.wind_speed_mph).toBe(8);
    expect(out.precipitation_mm).toBeCloseTo(0.3, 4);
    expect(out.weather_condition).toBe('partly_cloudy'); // 4 vs 3
    expect(out.wind_direction).toBe('S');
  });
  it('vector-means wind direction so opposite gusts do not cancel naively', () => {
    const out = aggregateHourly({
      temperatureF: [60],
      windSpeedMph: [5],
      windDirectionDeg: [350], // basically N
      precipitationMm: [0],
      weatherCodes: [0],
    });
    expect(out.wind_direction).toBe('N');
  });
  it('returns a defensible default for an empty window', () => {
    const out = aggregateHourly({
      temperatureF: [],
      windSpeedMph: [],
      windDirectionDeg: [],
      precipitationMm: [],
      weatherCodes: [],
    });
    expect(out.temperature_f).toBe(0);
    expect(out.weather_condition).toBe('clear');
  });
});
