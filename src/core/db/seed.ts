import type { Db } from './db';
import { createCourse, listCourses } from './repositories/courses';
import { createTee } from './repositories/tees';
import { bulkCreateTeeHoles } from './repositories/teeHoles';
import type { TeeHoleInput } from './repositories/teeHoles';

interface DemoTee {
  tee_name: string;
  gender: string;
  course_rating: number;
  slope_rating: number;
  total_yards: number;
  par_total: number;
  holes: { hole: number; par: number; yardage: number; si: number }[];
}

interface DemoCourse {
  external_id: string;
  club_name: string;
  course_name: string;
  city: string;
  state: string;
  country: string;
  num_holes: 18;
  latitude: number;
  longitude: number;
  tees: DemoTee[];
}

// Pebble Beach Golf Links — Black/Championship tees, men's rating.
// Yardages and pars per the Pebble Beach scorecard; stroke indexes are an
// approximation suitable for demo purposes only.
const PEBBLE_BEACH: DemoCourse = {
  external_id: 'demo:pebble-beach',
  club_name: 'Pebble Beach Golf Links',
  course_name: 'Championship',
  city: 'Pebble Beach',
  state: 'CA',
  country: 'USA',
  num_holes: 18,
  latitude: 36.5683,
  longitude: -121.9485,
  tees: [
    {
      tee_name: 'Black',
      gender: 'M',
      course_rating: 75.5,
      slope_rating: 145,
      total_yards: 7075,
      par_total: 72,
      holes: [
        { hole: 1, par: 4, yardage: 380, si: 11 },
        { hole: 2, par: 5, yardage: 516, si: 13 },
        { hole: 3, par: 4, yardage: 404, si: 7 },
        { hole: 4, par: 4, yardage: 331, si: 17 },
        { hole: 5, par: 3, yardage: 195, si: 15 },
        { hole: 6, par: 5, yardage: 523, si: 5 },
        { hole: 7, par: 3, yardage: 106, si: 18 },
        { hole: 8, par: 4, yardage: 428, si: 1 },
        { hole: 9, par: 4, yardage: 481, si: 3 },
        { hole: 10, par: 4, yardage: 481, si: 9 },
        { hole: 11, par: 4, yardage: 390, si: 12 },
        { hole: 12, par: 3, yardage: 202, si: 14 },
        { hole: 13, par: 4, yardage: 445, si: 4 },
        { hole: 14, par: 5, yardage: 580, si: 8 },
        { hole: 15, par: 4, yardage: 397, si: 10 },
        { hole: 16, par: 4, yardage: 403, si: 6 },
        { hole: 17, par: 3, yardage: 208, si: 16 },
        { hole: 18, par: 5, yardage: 543, si: 2 },
      ],
    },
  ],
};

// A simple municipal-style 18-hole layout. Par 70, no real-world location.
const MUNI: DemoCourse = {
  external_id: 'demo:meadow-municipal',
  club_name: 'Meadow Municipal Golf Course',
  course_name: 'Main',
  city: 'Springfield',
  state: 'IL',
  country: 'USA',
  num_holes: 18,
  latitude: 39.7817,
  longitude: -89.6501,
  tees: [
    {
      tee_name: 'White',
      gender: 'M',
      course_rating: 69.8,
      slope_rating: 118,
      total_yards: 6100,
      par_total: 70,
      holes: [
        { hole: 1, par: 4, yardage: 360, si: 9 },
        { hole: 2, par: 4, yardage: 380, si: 5 },
        { hole: 3, par: 3, yardage: 165, si: 17 },
        { hole: 4, par: 5, yardage: 510, si: 7 },
        { hole: 5, par: 4, yardage: 400, si: 1 },
        { hole: 6, par: 3, yardage: 180, si: 13 },
        { hole: 7, par: 4, yardage: 350, si: 11 },
        { hole: 8, par: 4, yardage: 410, si: 3 },
        { hole: 9, par: 4, yardage: 390, si: 15 },
        { hole: 10, par: 4, yardage: 365, si: 10 },
        { hole: 11, par: 3, yardage: 155, si: 18 },
        { hole: 12, par: 4, yardage: 395, si: 6 },
        { hole: 13, par: 4, yardage: 370, si: 12 },
        { hole: 14, par: 4, yardage: 415, si: 2 },
        { hole: 15, par: 3, yardage: 175, si: 14 },
        { hole: 16, par: 5, yardage: 520, si: 8 },
        { hole: 17, par: 4, yardage: 385, si: 4 },
        { hole: 18, par: 4, yardage: 375, si: 16 },
      ],
    },
  ],
};

const DEMO_COURSES: DemoCourse[] = [PEBBLE_BEACH, MUNI];

/**
 * Insert the demo courses (Pebble Beach + Meadow Municipal) with full tee
 * and hole data. Skips any course whose external_id already exists, so it
 * is safe to call repeatedly.
 *
 * Gated behind __DEV__ in callers — only invoke from the debug screen.
 */
export function seedDemoData(db: Db): { coursesAdded: number } {
  const existing = new Set(
    listCourses(db)
      .map((c) => c.external_id)
      .filter((id): id is string => id !== null),
  );
  let added = 0;
  for (const demo of DEMO_COURSES) {
    if (existing.has(demo.external_id)) continue;
    const course = createCourse(db, {
      external_id: demo.external_id,
      club_name: demo.club_name,
      course_name: demo.course_name,
      city: demo.city,
      state: demo.state,
      country: demo.country,
      num_holes: demo.num_holes,
      latitude: demo.latitude,
      longitude: demo.longitude,
    });
    for (const tee of demo.tees) {
      const created = createTee(db, {
        course_id: course.id,
        tee_name: tee.tee_name,
        gender: tee.gender,
        course_rating: tee.course_rating,
        slope_rating: tee.slope_rating,
        total_yards: tee.total_yards,
        par_total: tee.par_total,
      });
      const holes: TeeHoleInput[] = tee.holes.map((h) => ({
        tee_id: created.id,
        hole_number: h.hole,
        par: h.par,
        yardage: h.yardage,
        stroke_index: h.si,
      }));
      bulkCreateTeeHoles(db, holes);
    }
    added += 1;
  }
  return { coursesAdded: added };
}
