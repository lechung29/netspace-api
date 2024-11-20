import express from "express"
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"

const app = express()
dotenv.config();


app.use(express.json());
app.use(cors({
    origin: "*"
}))

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));