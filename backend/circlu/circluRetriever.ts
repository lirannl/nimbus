import Axios from "axios";
import { Cve } from "./cve_interface";

/**
 * Return a date with `amount` many days added
 * @param old Old date
 * @param amount How many days to add (default: 1)
 */
const addDay = (old: Date, amount = 1) => {
  const msInDay = 24 * 3600 * 1000;
  return new Date(old.valueOf() + (msInDay * amount));
}

/**
 * Get an array of all dates within the given range
 */
function dateRange(startDate: Date, stopDate: Date) {
  const dates = [] as Date[];
  let currentDate = startDate;
  while (currentDate <= stopDate) {
    dates.push(new Date(currentDate));
    // Increase current Date by 1
    currentDate = addDay(currentDate);
  }
  return dates;
}

/**
 * Generates an array of starting points for future querying of the Circlu API
 * @param max Generate enough starting points to capture this many CVEs
 * @param stepSize How many CVEs will be recieved per API request
 */
const skipPoints = (max: number, stepSize: number) => {
  if (max <= 0) return [];
  return recursiveSkipPoints(max, stepSize);
}

/**
 * Generates an array of starting points for future querying of the Circlu API
 * @param max Generate enough starting points to capture this many CVEs
 * @param stepSize How many CVEs will be recieved per API request
 * @param startPoints The accumulating array of starting points
 */
const recursiveSkipPoints: (
  max: number,
  stepSize: number,
  startPoints?: number[]
) => number[] = (max, stepSize, startPoints = [stepSize]) => {
  const newStartPoints = startPoints.concat(
    startPoints.slice(-1)[0] + stepSize
  );
  if (newStartPoints.slice(-1)[0] > max) return startPoints;
  return recursiveSkipPoints(max, stepSize, newStartPoints);
};

/**
 * Make a single request to Circlu
 * @param day Day to fetch for
 * @param skip How many CVEs to skip
 */
const singleCircluReq = async (day: Date, skip?: number, limit?: number) => {
  const dateFormatter = (date: Date) => `${`${date.getDate()}`.padStart(2, '0')
    }-${`${date.getMonth() + 1}`.padStart(2, '0')
    }-${date.getFullYear()}`;
  const headersObj = {
    time_start: dateFormatter(day),
    time_end: dateFormatter(new Date(day.valueOf() + 24 * 3600 * 1000)),
    time_modifier: "between",
    time_type: "Published",
    skip: skip || 0,
  };
  if (limit) Object.assign(headersObj, { limit: limit });
  // Todo: Implement persistence with S3 buckets + redis caches
  return Object.assign(
    (await Axios("https://cve.circl.lu/api/query", { headers: headersObj })).data
    , { source: "circlu" }) as
    { results: Cve[], total: number, source: string };
}

/**
 * Gets all CVEs for a given day
 * @param day The day to get all cves for
 */
const cvesForDay = async (day: Date) => {
  const { results: firstCves, total, source } = await singleCircluReq(day);
  // Persistent sources will return all CVEs for the given day immediately, therefore, no further fetches are needed.
  if (source != "circlu")
    return firstCves;
  const reqLength = firstCves.length;
  const skips = skipPoints(total, reqLength);
  const latterCves = await Promise.all(skips.map(
    skip => singleCircluReq(day, skip, reqLength).then(res => res.results)
  ));
  // Add all of the CVEs together into a single array
  const allCves = firstCves.concat(...latterCves); //.reduce((acc, curr) => acc.concat(curr), []));
  // Ignore CVEs that are rejected or disputed
  const relevantCves = allCves.filter(cve => !cve.summary.startsWith("** "));
  // TODO: store the relevant CVEs that were retrieved in persistent sources
  return relevantCves;
}

/**
 * Receive CVEs from Circlu
 * @param from Time to fetch from
 * @param to Time to fetch until
 */
const getCVEs = async (from: Date, to: Date) => {
  const cves = await Promise.all(dateRange(from, to).map(date => cvesForDay(date).then(cves => ({ cves: cves, date: date }))));
  const getDateString = (date: Date) => date.toISOString().split('T')[0];
  return cves.reduce((acc, curr) => Object.assign(acc, { [getDateString(curr.date)]: curr.cves }), {} as { [date: string]: Cve[] });
}

export default getCVEs;
