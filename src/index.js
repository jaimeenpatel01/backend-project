import dotenv from 'dotenv'
import connectDB from './db/index.js'
import express from "express"
import { app } from './app.js'

dotenv.config({
    path:"./.env"
})

// const app = express();

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`db connected at port ${process.env.PORT}`);
        })
    })
    .catch((e) => {
        console.log("errorrr:",e);
    })