import express from "express";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import { AxiosError } from "axios";
import { init_cache, get_cache, getICS } from "./utils/cache.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// serve HTML
app.get("/", (_, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/** get-ics 
 * this route is the main route to get all ics data and has 4 "types"
 * @type {string} full - returns the (possibly cached) full dataset 
 * @type {string} min - returns the 1/2 most recent (possibly cached) dataset 
 * @type {string} upcoming - returns the only upcoming (possibly cached) dataset
 * @type {string} fresh - returns a non cached version of the data
 */
app.get("/get-ics/:type", async (req, res) => {
    try {
        const validTypes = ["full", "min", "upcoming", "fresh"];
        const type = req.params.type;

        if (!validTypes.includes(type)) {
            throw new Error("given :type field is not a valid type. please use full, min, upcoming or fresh");
        }

        if (type == "fresh") {
            const [data, err] = await getICS();
            if (err) throw new Error(err);
            res.json(data).status(200);
            return;
        }

        const [data, err] = await get_cache(type);
        if (err) throw new Error(err);

        res.json(data).status(200);
    } catch (e) {
        if (e instanceof AxiosError) {
            res.json({
                "data": null,
                "message": null,
                "error": `Request error! AxiosError: ${e}`,
            }).status(500);
        } else {
            res.json({
                "data": null,
                "message": null,
                "error": `Internal Error: ${e}`,
            }).status(500);
        }
    }
});

/*
app.get('/users/:userId/posts/:postId', (req, res) => {
  // Access route parameters
  const userId = req.params.userId;
  const postId = req.params.postId;

  res.send(`User ID: ${userId}, Post ID: ${postId}`);
});
*/

(async function () {
    // init cache dir and preload recent data
    const err = await init_cache();
    if (err) {
        console.log(err);
        process.exit(1);
    }
    app.listen(3000, () => {
        console.log("Server listening at localhost:3000");
    });
})();

