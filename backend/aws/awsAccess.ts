import { Cve, Impact, Access } from "../interfaces/cve_interface";
import { isCveArr }  from '../circlu/circluRetriever';

import AWS from 'aws-sdk';
require('dotenv').config({ path: __dirname+'/.env' });

let s3Client = new AWS.S3({ apiVersion: '2006-03-01', region: 'ap-southeast-2' })
// TODO why did the pracs use such an old api version lmao
const bucketName = 'nimbus-store5';
createBucket(); // TODO not sure if this is the best place to call bucket creation

/**
 * Create the Nimbus bucket if it does not already exist
 * @returns status code of creation request
 */
export function createBucket() {
    s3Client.createBucket({ Bucket: bucketName }, function(err, reply) {
        if (err && err.statusCode == 409){
            console.log("[!] Nimbus bucket already exists");
            return err.statusCode;
        } else {
            console.log("[!] Created Nimbus bucket", reply.Location);
            return 200;
        }
    })
}

/**
 * Get CVE arrays from the S3 Nimbus bucket using promise
 * @param key The day to get data for
 */
export const getFromS3 = (key: string) => new Promise((resolve, reject) => {
    s3Client.getObject({ Bucket: bucketName, Key: key}, (err, reply) => {
        if (!reply) reject(err || new Error("Unknown error."));
        else {
            console.log("[!] found in S3")
            const replyObj = JSON.parse(reply?.Body?.toString('utf-8')!)!;
            if (isCveArr(replyObj)) resolve(replyObj);
            else reject(new Error(`"${key}" does not contain a valid array of CVEs.`));
        }
  });
}) as Promise<Cve[]>;

/**
 * Check if a given key exists on S3 to avoid overwriting
 * @param key Key to check in S3
 */
export const checkKey = (key: string) => new Promise((resolve, reject) => {
    s3Client.getObject({ Bucket: bucketName, Key: key}, (err, reply) => {
        if (!reply) {
            console.log("[!] key doesn't exist yet");
            resolve(false);
        } else { 
            console.log("[!] key already in S3 at " + bucketName + "/" + key); 
            resolve(true);
        }
    })
}) as Promise<boolean>;

/**
 * Write a specific item in the S3 Nimbus bucket
 * @param key The day to write data for
 * @param data The data to write
 */
export const storeInS3 = (keyExists:boolean, key: string, data: Cve[]) => new Promise((resolve, reject) => {
    // keyexists is temp fix while @gaby investigates if overwriting can be disabled on S3
    if (keyExists === false) {
        const body = JSON?.stringify(data);
        s3Client.putObject({ Bucket: bucketName, Key: key, Body: body }, (err, reply) => {
            if (!reply) reject(err || new Error("Unknown error."));
            else {
                console.log("[!] key added to S3 in " + bucketName + "/" + key);
                // TODO check HTTP response code? aws docs on non-error statuses is not that great
                const replyCode = 200;
                if (replyCode==200) resolve(replyCode);
                else reject(new Error(`"${key}" response code was not 200`));
            }
        });
    } else {
        // TODO
        resolve(404);
    }
}) as Promise<number>;
