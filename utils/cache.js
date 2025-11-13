// cache.js: Handles all the data flow of the ICS data.
import fs from "fs";
import axios from "axios";
import { formatICS } from "./formatICS.js";
import { readFile } from "node:fs/promises";
const CACHE_DIR = "./cache/";
const CACHE_FILE = "./cache/formattedICS.json"; // the entire formateed ics 
const CACHE_MIN_FILE = "./cache/min_formattedICS.json"; // 1/2 the size 
const CACHE_UPCOMING_FILE = "./cache/upcoming_formattedICS.json"; // only events that havent passed
const CACHE_EXPIRES = "./cache/expires.txt"; // string representing the expiry time of the cached data
const ICS_URL = "https://calendar.google.com/calendar/ical/c_948c9227076b0217fbd98da0a94d32e8368af19b813593f049467213d96998cc%40group.calendar.google.com/public/basic.ics";

/** getICS
 * helper function to fetch and format ICS data 
 * @returns {Promise<Array<Array, Error>>} [formattedICSData, Error]
 */
export async function getICS() {
    try {
        const { data } = await axios.get(ICS_URL);
        const formatted = formatICS(data);

        return [formatted, null];
    } catch (e) {
        return [null, e];
    }
}

/** init_cache
 * sets up the initial cache structure, should be ran upon express startup 
 * @returns {Promise<Error>} error - returns error if any
 */
export async function init_cache() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR);
        return await update_cache();
    } else {
        return;
    }
}

/** update_cache 
 * updates the cache, doubles as a flush if you want to refresh manually
 * also returns the fresh icsData
 * @returns {Promise<Array<Array, Array, Array, Error>>} - [FullData, MinData, UpcomingData, Error]
 */
export async function update_cache() {
    try {
        const [icsData, err] = await getICS();
        if (err) {
            return [null, null, null, err];
        }

        const minData = icsData.slice(0, (icsData.length / 2));
        const now = new Date().getTime();
        const upcomingData = icsData.reduce((a, cv) => {
            const time = new Date(cv.dtstart).getTime();
            if (now < time) {
                a.push(cv);
            }
            return a;
        }, []);

        // Expiry default at 12hrs, we can change that.
        const expiry = new Date(now + (12 * 60 * 60 * 1000)).getTime();

        fs.writeFileSync(CACHE_FILE, JSON.stringify(icsData));
        fs.writeFileSync(CACHE_MIN_FILE, JSON.stringify(minData));
        fs.writeFileSync(CACHE_UPCOMING_FILE, JSON.stringify(upcomingData));
        fs.writeFileSync(CACHE_EXPIRES, expiry.toString());

        return [icsData, minData, upcomingData, null];
    } catch (e) {
        return [null, null, null, e];
    }
}

/** get_cache
 * checks the cache for ICS data and updates if doesnt exist 
 * if you want to hit the ICS data without a cache just use getICS 
 * @returns {Promise<Array<Array, Error>>} Array<ICSData, Error>
 */
export async function get_cache(fileToRetrieve = "upcoming") {
    const fileKey = {
        "full": CACHE_FILE,
        "min": CACHE_MIN_FILE,
        "upcoming": CACHE_UPCOMING_FILE,
    };
    const returnKey = {
        "full": 0,
        "min": 1,
        "upcoming": 2,
    };

    try {
        let lastTime = await readFile(CACHE_EXPIRES, 'utf8');
        lastTime = parseInt(lastTime);
        const now = new Date().getTime();
        if (now < lastTime) {
            let cached = await readFile(fileKey[fileToRetrieve], 'utf8');
            cached = await JSON.parse(cached);
            return [cached, null];
        }

        // else the cache is stale
        const res = await update_cache();
        return [res[returnKey[fileToRetrieve]], null];

    } catch (e) {
        return [null, e];
    }
}
