import Redis from "redis";
import { isCveArr } from "../circlu/circluRetriever";
import { Cve } from "../interfaces/cve_interface";

const redisClient = Redis.createClient(process.env.REDIS_URL!);

/**
 * Store data in redis
 * @param data The data to store
 */
export const storeInRedis = (data: Cve[], key: string) => new Promise<"OK">((resolve, reject) => {
  redisClient.set(key, JSON.stringify(data), (err, success) => {
    if (success) resolve(success);
    else reject(err);
  });
});

/**
 * Gets CVE arrays from redis using a promise instead of a callback
 */
export const getFromRedis = (key: string) => new Promise<Cve[]>((resolve, reject) => {
  redisClient.get(key, (err, reply) => {
    if (!reply) reject(err || new Error("Unknown error."));
    else {
      console.log(`[!] ${key} found in redis`);
      const replyObj = JSON.parse(reply);
      if (isCveArr(replyObj)) resolve(replyObj);
      else reject(new Error(`"${key}" does not contain a valid array of CVEs.`));
    }
  });
});