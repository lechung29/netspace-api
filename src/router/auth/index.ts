import express from "express"
import { loginUser, refreshToken, registerNewUser } from "../../controllers/auth"

const authRouter = express.Router()

authRouter.post("/register", registerNewUser)
authRouter.post("/login", loginUser)
authRouter.get("/refresh-token", refreshToken)

export default authRouter