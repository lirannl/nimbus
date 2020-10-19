import Axios from "axios";
import { Cve } from "../interfaces/cve_interface";
import { getFromS3, storeInS3, checkKey } from '../aws/awsAccess';
import analyseCves from "../googlecloud/entity_analysis";
import { getFromRedis, storeInRedis } from "../redis/redisFuncs";
import { addDay, dateRange, getPersKey } from "../utils";

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
  const makeDateString = (day: Date) => `${`${day.getDate()}`.padStart(2, '0')}-${`${day.getMonth()+1}`.padStart(2, '0')}-${day.getFullYear()}`;
  const headersObj = {
    time_start: makeDateString(day),
    time_end: makeDateString(addDay(day)),
    time_modifier: "between",
    time_type: "Published",
    skip: skip || 0,
  };
  if (limit) Object.assign(headersObj, { limit: limit });
  const res = await Axios("https://cve.circl.lu/api/query", { headers: headersObj});
  return res.data as { results: Cve[], total: number };
}

/**
 * Gets all CVEs for a given day
 * @param day The day to get all cves for
 */
const cvesForDay = async (day: Date) => {
  // Persistent sources will return all CVEs for the given day immediately, therefore, no further fetches are needed.
  try {
    // Try getting the results from Redis
    const cves = await getFromRedis(getPersKey(day));
    const keyExists = await checkKey(getPersKey(day));
    await storeInS3(keyExists, getPersKey(day), cves);
    return cves;
  } catch { }
  try {
    // Try getting the results from S3
    console.log(`Failed to find ${getPersKey(day)} in redis, checking S3 now...`)
    const cves = await getFromS3(getPersKey(day));
    storeInRedis(cves, getPersKey(day));
    return cves
  } catch {
    console.log(`Failed to find ${getPersKey(day)} in S3, querying source now...`)
  }
  const { results: firstCves, total } = await singleCircluReq(day);
  const cvesPerReq = firstCves.length;
  const latterCves = await Promise.all(skipPoints(total, cvesPerReq).map(
    skip => singleCircluReq(day, skip, cvesPerReq).then(res => res.results)
  ));
  // Add all of the CVEs together into a single array
  const allCves = firstCves.concat(...latterCves);
  // Ignore CVEs that are rejected or disputed
  const relevantCves = allCves.filter(cve => !cve.summary.startsWith("** "));
  console.debug(`Finished getting ${relevantCves.length} cves for ${day.toDateString()}.`);
  // Disabled entity analysis temporarily until we sort out how we're going to authenticate
  const analysedCves = await analyseCves(relevantCves);
  storeInS3(false, getPersKey(day), analysedCves);
  storeInRedis(analysedCves, getPersKey(day));
  return analysedCves;
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
