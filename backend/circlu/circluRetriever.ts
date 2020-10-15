import Redis from "redis";
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


const redisClient = Redis.createClient();
/**
 * Store data in redis
 * @param data The data to store
 */
const storeInRedis = (data: Cve[], key: string) => new Promise((resolve, reject) => {
  redisClient.set(key, JSON.stringify(data), (err, success) => {
    if (success) resolve(success);
    else reject(err);
  });
}) as Promise<"OK">;

// Determine if a given object is an array of Cves
function isCveArr(obj: any): obj is Cve[] { return true }

/**
 * Gets CVE arrays from redis using a promise instead of a callback
 */
const getFromRedis = (key: string) => new Promise((resolve, reject) => {
  redisClient.get(key, (err, reply) => {
    if (!reply) reject(err || new Error("Unknown error."));
    else {
      const replyObj = JSON.parse(reply);
      if (isCveArr(replyObj)) resolve(replyObj);
      else reject(new Error(`"${key}" does not contain a valid array of CVEs.`));
    }
  });
}) as Promise<Cve[]>;

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

const getPersKey = (day: Date) => day.toISOString().split("T")[0];

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
  return (await Axios("https://cve.circl.lu/api/query", { headers: headersObj })).data as
    { results: Cve[], total: number };
}

/**
 * Gets all CVEs for a given day
 * @param day The day to get all cves for
 */
const cvesForDay = async (day: Date) => {
  // Persistent sources will return all CVEs for the given day immediately, therefore, no further fetches are needed.
  try {
    const cves = await getFromRedis(getPersKey(day));
    // Todo: store in S3 here
    return cves;
  }
  catch {}
  // Try getting the results from S3
  const { results: firstCves, total } = await singleCircluReq(day);
  const reqLength = firstCves.length;
  const skips = skipPoints(total, reqLength);
  const latterCves = await Promise.all(skips.map(
    skip => singleCircluReq(day, skip, reqLength).then(res => res.results)
  ));
  // Add all of the CVEs together into a single array
  const allCves = firstCves.concat(...latterCves);
  // Ignore CVEs that are rejected or disputed
  const relevantCves = allCves.filter(cve => !cve.summary.startsWith("** "));
  // TODO: Entity analysis on the CVEs + storage in S3

  storeInRedis(relevantCves, getPersKey(day));
  return relevantCves;
}

/**
 * Receive CVEs from Circlu
 * @param from Time to fetch from
 * @param to Time to fetch until
 */
const getCVEs = async (from: Date, to: Date) => {
  const cves = await Promise.all(dateRange(from, to).map(date => cvesForDay(date).then(cves => ({ cves: cves, date: date }))));
  return cves.reduce((acc, curr) => Object.assign(acc, { [getPersKey(curr.date)]: curr.cves }), {} as { [date: string]: Cve[] });
}

export default getCVEs;
