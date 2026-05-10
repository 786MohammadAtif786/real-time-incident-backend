import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if(!redisUrl) {
    console.log('Missing redis url');
    process.exit(1);
}

export const redisClient = createClient({
    url: redisUrl
})

redisClient.connect()
    .then(() => {
        console.log("connected to redis");
    }).catch ((err) => {
        console.log(err);
        
    })