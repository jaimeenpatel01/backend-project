import cookieParser from 'cookie-parser';
import express from 'express'
import cors from 'cors'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:"19kb"}))
app.use(express.urlencoded({limit:"19kb"}))
app.use(express.static("public"))

export { app }