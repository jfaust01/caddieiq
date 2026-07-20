/**
 * Test Fixtures for Course Intelligence Metrics
 * Provides various course configurations for comprehensive testing
 */

import type { CourseData } from "../types"

/**
 * Austin Country Club - Real 18-hole championship course
 * Par 71, 6,824 yards (blue tees), multiple tee options
 */
export const AUSTIN_COUNTRY_CLUB: CourseData = {
  id: "course-18214",
  name: "Austin Country Club",
  holes: [
    { holeNumber: 1, par: 4, yardage: 368, handicap: 3 },
    { holeNumber: 2, par: 3, yardage: 187, handicap: 15 },
    { holeNumber: 3, par: 4, yardage: 420, handicap: 5 },
    { holeNumber: 4, par: 4, yardage: 398, handicap: 7 },
    { holeNumber: 5, par: 5, yardage: 541, handicap: 1 },
    { holeNumber: 6, par: 3, yardage: 162, handicap: 17 },
    { holeNumber: 7, par: 4, yardage: 410, handicap: 6 },
    { holeNumber: 8, par: 4, yardage: 383, handicap: 9 },
    { holeNumber: 9, par: 5, yardage: 541, handicap: 2 },
    { holeNumber: 10, par: 4, yardage: 383, handicap: 8 },
    { holeNumber: 11, par: 3, yardage: 195, handicap: 13 },
    { holeNumber: 12, par: 4, yardage: 475, handicap: 4 },
    { holeNumber: 13, par: 5, yardage: 556, handicap: 10 },
    { holeNumber: 14, par: 4, yardage: 397, handicap: 11 },
    { holeNumber: 15, par: 4, yardage: 415, handicap: 12 },
    { holeNumber: 16, par: 3, yardage: 213, handicap: 18 },
    { holeNumber: 17, par: 4, yardage: 426, handicap: 14 },
    { holeNumber: 18, par: 4, yardage: 391, handicap: 16 },
  ],
  tees: [
    {
      teeName: "Blue",
      yardage: 6824,
      rating: 73.2,
      slope: 134,
      holeCount: 18,
    },
    {
      teeName: "White",
      yardage: 6450,
      rating: 72.1,
      slope: 130,
      holeCount: 18,
    },
    {
      teeName: "Gold",
      yardage: 6100,
      rating: 71.2,
      slope: 127,
      holeCount: 18,
    },
    {
      teeName: "Red",
      yardage: 5750,
      rating: 70.4,
      slope: 125,
      holeCount: 18,
    },
  ],
  address: {
    country: "United States",
    state: "TX",
    city: "Austin",
    elevation: 1000,
  },
  coordinates: {
    latitude: 30.2672,
    longitude: -97.8611,
  },
  hazardCounts: {
    water: 8,
    sand: 15,
    trees: 120,
    outOfBounds: 4,
  },
}

/**
 * Easy 9-hole public course
 * Simple layout, beginner-friendly
 */
export const EASY_9_HOLE: CourseData = {
  id: "course-easy-9",
  name: "Meadowbrook Golf Club",
  holes: [
    { holeNumber: 1, par: 4, yardage: 380, handicap: 3 },
    { holeNumber: 2, par: 3, yardage: 145, handicap: 9 },
    { holeNumber: 3, par: 4, yardage: 370, handicap: 5 },
    { holeNumber: 4, par: 4, yardage: 390, handicap: 1 },
    { holeNumber: 5, par: 3, yardage: 160, handicap: 8 },
    { holeNumber: 6, par: 5, yardage: 520, handicap: 2 },
    { holeNumber: 7, par: 4, yardage: 375, handicap: 4 },
    { holeNumber: 8, par: 3, yardage: 155, handicap: 7 },
    { holeNumber: 9, par: 4, yardage: 365, handicap: 6 },
  ],
  tees: [
    {
      teeName: "White",
      yardage: 3240,
      rating: 66.8,
      slope: 115,
      holeCount: 9,
    },
    {
      teeName: "Red",
      yardage: 2980,
      rating: 65.2,
      slope: 110,
      holeCount: 9,
    },
  ],
  address: {
    country: "United States",
    state: "CA",
    city: "San Jose",
    elevation: 150,
  },
  coordinates: {
    latitude: 37.3382,
    longitude: -121.8863,
  },
  hazardCounts: {
    water: 2,
    sand: 5,
    trees: 30,
    outOfBounds: 1,
  },
}

/**
 * Championship course with extreme difficulty
 * Very long, lots of hazards, high variance
 */
export const CHAMPIONSHIP_COURSE: CourseData = {
  id: "course-championship",
  name: "Pinnacle Peaks Championship",
  holes: [
    { holeNumber: 1, par: 4, yardage: 450, handicap: 8 },
    { holeNumber: 2, par: 3, yardage: 220, handicap: 14 },
    { holeNumber: 3, par: 4, yardage: 480, handicap: 4 },
    { holeNumber: 4, par: 5, yardage: 600, handicap: 2 },
    { holeNumber: 5, par: 4, yardage: 440, handicap: 10 },
    { holeNumber: 6, par: 3, yardage: 210, handicap: 16 },
    { holeNumber: 7, par: 5, yardage: 620, handicap: 1 },
    { holeNumber: 8, par: 4, yardage: 460, handicap: 6 },
    { holeNumber: 9, par: 4, yardage: 470, handicap: 9 },
    { holeNumber: 10, par: 4, yardage: 455, handicap: 7 },
    { holeNumber: 11, par: 3, yardage: 225, handicap: 12 },
    { holeNumber: 12, par: 5, yardage: 610, handicap: 3 },
    { holeNumber: 13, par: 4, yardage: 490, handicap: 5 },
    { holeNumber: 14, par: 4, yardage: 475, handicap: 11 },
    { holeNumber: 15, par: 3, yardage: 215, handicap: 18 },
    { holeNumber: 16, par: 4, yardage: 485, handicap: 13 },
    { holeNumber: 17, par: 5, yardage: 630, handicap: 15 },
    { holeNumber: 18, par: 4, yardage: 500, handicap: 17 },
  ],
  tees: [
    {
      teeName: "Championship",
      yardage: 7450,
      rating: 75.8,
      slope: 145,
      holeCount: 18,
    },
    {
      teeName: "Blue",
      yardage: 7000,
      rating: 74.2,
      slope: 140,
      holeCount: 18,
    },
  ],
  address: {
    country: "United States",
    state: "CO",
    city: "Denver",
    elevation: 5280,
  },
  coordinates: {
    latitude: 39.7392,
    longitude: -104.9903,
  },
  hazardCounts: {
    water: 15,
    sand: 35,
    trees: 200,
    outOfBounds: 12,
  },
}

/**
 * Par 3 executive course
 * Short, quick-play course
 */
export const PAR_3_COURSE: CourseData = {
  id: "course-par3",
  name: "Short Game Express",
  holes: [
    { holeNumber: 1, par: 3, yardage: 165, handicap: 3 },
    { holeNumber: 2, par: 3, yardage: 145, handicap: 8 },
    { holeNumber: 3, par: 3, yardage: 185, handicap: 1 },
    { holeNumber: 4, par: 3, yardage: 155, handicap: 6 },
    { holeNumber: 5, par: 3, yardage: 175, handicap: 2 },
    { holeNumber: 6, par: 3, yardage: 140, handicap: 9 },
    { holeNumber: 7, par: 3, yardage: 170, handicap: 4 },
    { holeNumber: 8, par: 3, yardage: 160, handicap: 7 },
    { holeNumber: 9, par: 3, yardage: 180, handicap: 5 },
  ],
  tees: [
    {
      teeName: "White",
      yardage: 1445,
      rating: 61.5,
      slope: 95,
      holeCount: 9,
    },
    {
      teeName: "Red",
      yardage: 1280,
      rating: 58.2,
      slope: 85,
      holeCount: 9,
    },
  ],
  address: {
    country: "United States",
    state: "FL",
    city: "Orlando",
    elevation: 50,
  },
  coordinates: {
    latitude: 28.5383,
    longitude: -81.3792,
  },
  hazardCounts: {
    water: 3,
    sand: 8,
    trees: 25,
    outOfBounds: 1,
  },
}

/**
 * 27-hole facility test course (returned as 18 for analysis)
 */
export const TWENTY_SEVEN_HOLE: CourseData = {
  id: "course-27hole",
  name: "Triple Challenge Club",
  holes: Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    par: i % 3 === 0 ? 5 : i % 2 === 0 ? 4 : 3,
    yardage: 300 + Math.random() * 250,
    handicap: (i % 18) + 1,
  })),
  tees: [
    {
      teeName: "Blue",
      yardage: 6600,
      rating: 72.5,
      slope: 132,
      holeCount: 18,
    },
    {
      teeName: "White",
      yardage: 6200,
      rating: 71.0,
      slope: 128,
      holeCount: 18,
    },
  ],
  address: {
    country: "United States",
    state: "NY",
    city: "New York",
    elevation: 250,
  },
  coordinates: {
    latitude: 40.7128,
    longitude: -74.006,
  },
}

/**
 * Course with minimal data (tests fallback logic)
 */
export const MINIMAL_DATA_COURSE: CourseData = {
  id: "course-minimal",
  name: "Unknown Course",
  holes: [
    { holeNumber: 1, par: 4, yardage: 400, handicap: 1 },
    { holeNumber: 2, par: 3, yardage: 160, handicap: 2 },
  ],
  tees: [],
  address: undefined,
  coordinates: undefined,
}
