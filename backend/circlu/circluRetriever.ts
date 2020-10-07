import Axios from "axios";
import { Cve } from "./cve_interface";

/**
 * Get an array of all dates within the given range
 */
function getDates(startDate: Date, stopDate: Date) {
  const dates = [] as Date[];
  const msInDay = 24 * 3600 * 1000;
  let currentDate = startDate;
  while (currentDate <= stopDate) {
      dates.push(new Date (currentDate));
      // Increase current Date by 1
      currentDate = new Date(currentDate.valueOf() + msInDay);
  }
  return dates;
}

/**
 * Generates an array of starting points for future querying of the Circlu API
 * @param max Generate enough starting points to capture this many CVEs
 * @param stepSize How many CVEs will be recieved per API request
 */
const skipPoints = (max: number, stepSize: number) => {
  if (max == 0) return [];
  return recursiveStartPointsBuilder(max, stepSize);
}

/**
 * Generates an array of starting points for future querying of the Circlu API
 * @param max Generate enough starting points to capture this many CVEs
 * @param stepSize How many CVEs will be recieved per API request
 * @param startPoints The accumulating array of starting points
 */
const recursiveStartPointsBuilder: (
  max: number,
  stepSize: number,
  startPoints?: number[]
) => number[] = (max, stepSize, startPoints = [stepSize]) => {
  const newStartPoints = startPoints.concat(
    startPoints.slice(-1)[0] + stepSize
  );
  if (newStartPoints.slice(-1)[0] > max) return startPoints;
  return recursiveStartPointsBuilder(max, stepSize, newStartPoints);
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
  const today = dateFormatter(day);
  const tomorrow = dateFormatter(new Date(day.valueOf() + 24 * 3600 * 1000));
  const headersObj = {
    time_start: dateFormatter(day),
    time_end: dateFormatter(new Date(day.valueOf() + 24 * 3600 * 1000)),
    time_modifier: "between",
    time_type: "Published",
    skip: skip || 0,
  };
  if (limit) Object.assign(headersObj, { limit: limit });
  // Todo: Implement persistence with S3 buckets + redis caches
  return Object.assign((await Axios("https://cve.circl.lu/api/query", {
    headers: headersObj
  })).data, { source: "circlu" }) as { results: Cve[], total: number, source: string };
}

/**
 * Gets all CVEs for a given day
 * @param day The day to get all cves for
 */
const cvesForDay = async (day: Date) => {
  const { results: firstCves, total, source } = await singleCircluReq(day);
  if (source != "circlu")
    return firstCves as Cve[];
  const reqLength = firstCves.length;
  const skips = skipPoints(total, reqLength);
  const latterCves = await Promise.all(skips.map(
    skip => singleCircluReq(day, skip, reqLength).then(res => res.results)
  ));
  const allCves = firstCves.concat(latterCves.reduce((acc, curr) => acc.concat(curr), []))
  return allCves;
}

/**
 * Receive CVEs from Circlu
 * @param from Time to fetch from
 * @param to Time to fetch until
 */
const circluReq = async (from: Date, to: Date) => {
  const cves = await Promise.all(getDates(from, to).map(date => cvesForDay(date).then(cves => ({cves: cves, date: date}))));
  return cves.reduce((acc, curr) => Object.assign(acc, {[curr.date.toDateString()]: curr.cves}), {});
}

export default circluReq;
