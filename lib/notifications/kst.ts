// Every timing rule for notifications ("1일 후", "회고 예정일까지의 중간 지점",
// "매일 09:00/13:00/20:00 발송") is specified in Korean wall-clock terms, but
// everything in the DB and in `Date` objects is UTC. This file is the single
// place that converts between the two, so day-boundary and slot-time math
// isn't reimplemented (and re-risked) in every call site.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const DELIVERY_SLOT_HOURS_KST = [9, 13, 20] as const;

interface KSTDateParts {
  year: number;
  month: number; // 0-indexed, matches Date's convention
  date: number;
}

/** The KST calendar date (Y/M/D) that a given UTC instant falls on. */
export function kstDateParts(instant: Date): KSTDateParts {
  const shifted = new Date(instant.getTime() + KST_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), date: shifted.getUTCDate() };
}

/**
 * A UTC Date usable as a "which KST calendar day" bucket key — safe to
 * subtract from another such key to get a whole number of days apart, but
 * NOT a real KST-midnight instant (don't use it as an actual send time).
 */
export function kstDayBucket(instant: Date): Date {
  const { year, month, date } = kstDateParts(instant);
  return new Date(Date.UTC(year, month, date));
}

/** Whole KST calendar days from `from` to `to` (positive if `to` is later). */
export function kstDaysBetween(from: Date, to: Date): number {
  return Math.round((kstDayBucket(to).getTime() - kstDayBucket(from).getTime()) / DAY_MS);
}

/** The real UTC instant for `hourKST`:00 on the KST calendar day `instant` falls on. */
export function kstSlotInstant(instant: Date, hourKST: number): Date {
  const { year, month, date } = kstDateParts(instant);
  return new Date(Date.UTC(year, month, date, hourKST - 9, 0, 0, 0));
}

/** `instant` shifted forward by `days` KST calendar days, at the same KST hour/minute it started at. */
export function addKSTDays(instant: Date, days: number): Date {
  return new Date(instant.getTime() + days * DAY_MS);
}
