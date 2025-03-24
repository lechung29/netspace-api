import express from "express"
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import { connectDB } from "./config/database";
import authRouter from "./router/auth";

const app = express()
dotenv.config();


app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}))

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const port = process.env.SERVER_PORT || 5000;
connectDB()

//Router
app.use('/api/v1/auth', authRouter)

app.listen(port, () => {
    console.log(`Server running on port:${port}`);
})