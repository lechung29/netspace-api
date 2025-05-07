import { NextFunction, Request, RequestHandler, Response } from "express";
import Users, { IResponseStatus, IUserData, IUserInfo } from "../../models/users/users.model";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs"

//#region Register New User

const registerNewUser: RequestHandler = async (req: Request<{}, {}, Pick<IUserData, "firstName" | "lastName" | "email" | "password">, {}>, res: Response) => {
    const { firstName, lastName, email, password } = req.body;
    const existingUser = await Users.findOne({ email });
    if (!!existingUser) {
        res.status(400).send({
            status: IResponseStatus.Error,
            fieldError: "email",
            message: "The email you entered has already been registered to another account. Please use a different email address to continue signing up.",
        });
    } else {
        const hashPassword = bcryptjs.hashSync(password, 10);
        const newUser = new Users({
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            email,
            password: hashPassword,
        });
    
        try {
            await newUser.save();
            res.status(201).send({
                status: IResponseStatus.Success,
                message: "Welcome! Your account has been successfully created and is now active. You can start using our services.",
            });
        } catch (error: any) {
            res.status(500).send({
                status: IResponseStatus.Error,
                message: "Unable to connect to the server. This may be due to a network interruption or the server is temporarily unavailable. Please check your internet connection or refresh the page after a few minutes.",
            });
        }
    }
    
};

//#endregion

//#region Login User

const loginUser: RequestHandler = async (req: Request<{}, {}, Pick<IUserData, "email" | "password">>, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await Users.findOne({ email })

    if (!existingUser) {
        res.status(400).send({
            status: IResponseStatus.Error,
            fieldError: "email",
            message: "The email address you entered is not associated with any account. Please double-check your email or sign up if you don’t have an account yet.",
        });
    } else if (!bcryptjs.compareSync(password, existingUser.password))  {
        res.status(400).send({
            status: IResponseStatus.Error,
            fieldError: "password",
            message: "The password you entered is incorrect. Please double-check and try again. If you’ve forgotten your password, you can reset it by click 'Forgot password' button below.",
        });
    } else {
        try {
            const accessToken = await jwt.sign({ id: existingUser._id, displayName: existingUser.displayName }, process.env.JWT_SECRET!, { expiresIn: "10m" });
            const currentRefreshToken = await jwt.sign({ id: existingUser._id, email: existingUser.email, displayName: existingUser.displayName }, process.env.JWT_SECRET!, { expiresIn: "1d" });
            await existingUser.updateOne({ $push: { refreshToken: currentRefreshToken }})
            const { password, refreshToken, ...rest } = existingUser.toObject();
            res.status(200).cookie("refreshToken", currentRefreshToken, { httpOnly: true, secure: true, sameSite: "none"}).send({
                status: IResponseStatus.Success,
                message: "Welcome, you’ve successfully logged into your account!",
                data: {
                    ...rest,
                    accessToken,
                },
            });
        } catch (error) {
            res.status(500).send({
                status: IResponseStatus.Error,
                message: "Unable to connect to the server. This may be due to a network interruption or the server is temporarily unavailable. Please check your internet connection or refresh the page after a few minutes.",
            });
        }
    }
};

//#endregion

//#region Refresh Token

export const refreshToken: RequestHandler = async (req: Request, res: Response, NextFunction: NextFunction) => {
    const cookieRefreshToken = req.cookies?.refreshToken
    if (!cookieRefreshToken) {
        res.status(200).send({
            code: 401,
            message: "Your session has expired due to inactivity for an extended period. Please log in again to continue using the app's features.",
        })
    } else {
        let tempUser: IUserInfo | undefined = undefined
        await jwt.verify(cookieRefreshToken, process.env.JWT_REFRESH!, async (err: any, user: any) => {
            if (err) {
                const existingUser = await Users.findOne({ email: (user as IUserInfo).email})
                if (existingUser) {
                    const currentUserRefreshTokens = existingUser.refreshToken
                    await existingUser?.updateOne({ $pull: { refreshToken: currentUserRefreshTokens.filter(i => i !== cookieRefreshToken)}})
                }
                res.status(200).send({
                    code: 401,
                    message: "Your session has expired due to inactivity for an extended period. Please log in again to continue using the app's features.",
                });
            } else {
                tempUser = user as IUserInfo;
                const newAccessToken = await jwt.sign({ id: tempUser._id, displayName: tempUser.displayName }, process.env.JWT_SECRET!, { expiresIn: "10m" });
                res.status(200).send({
                    accessToken: newAccessToken
                })
            }
        });
    }
}

export { registerNewUser, loginUser };
