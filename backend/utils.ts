import { Cve } from "./interfaces/cve_interface";

// Remove null elements from an array with nulls and return an array without nulls
export function removeNulls<T>(arr: (T | null)[]) {
    return arr.filter(e => e != null) as T[];
}

/**
 * Returns the persistence key for a given date object
 * @param day Date for which to return a persistence key
 */
export const getPersKey = (day: Date) => day.toISOString().split("T")[0];

// Determine if a given object is an array of Cves
export function isCveArr(obj: any): obj is Cve[] { return true }

/**
 * Return a date with `amount` many days added
 * @param old Old date
 * @param amount How many days to add (default: 1)
 */
export const addDay = (old: Date, amount = 1) => {
    const msInDay = 24 * 3600 * 1000;
    return new Date(old.valueOf() + (msInDay * amount));
  }

/**
 * Get an array of all dates within the given range
 */
export function dateRange(startDate: Date, stopDate: Date) {
    const dates = [] as Date[];
    let currentDate = startDate;
    while (currentDate <= stopDate) {
      dates.push(new Date(currentDate));
      // Increase current Date by 1
      currentDate = addDay(currentDate);
    }
    return dates;
  }