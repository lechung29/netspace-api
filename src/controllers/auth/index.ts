import { NextFunction, Request, RequestHandler, Response } from "express";
import Users, { IResponseStatus, IUserData } from "../../models/users/users.model";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs"

const registerNewUser: RequestHandler = async (req: Request<{}, {}, Pick<IUserData, "displayName" | "email" | "password">, {}>, res: Response) => {
    const { displayName, email, password } = req.body;

    const existingUser = await Users.findOne({ email });

    if (!!existingUser) {
        res.status(200).send({
            requestStatus: IResponseStatus.Error,
            fieldError: {
                fieldName: "email",
                errorMessage: "Error.Existed.Email"
            }
        });
    }
    const newUser = new Users({
        displayName,
        email,
        password: req.body.password,
    });

    try {
        await newUser.save();
        res.status(201).send({
            requestStatus: IResponseStatus.Success,
            message: "Successful.SignUp.User",
        });
    } catch (error: any) {
        res.status(500).send({
            requestStatus: IResponseStatus.Error,
            message: "Error.Network",
        });
    }
};

const loginUser: RequestHandler = async (req: Request<{}, {}, { email: string; password: string }>, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await Users.findOne({ email }).lean();

    if (!existingUser) {
        res.status(200).send({
            responseInfo: {
                status: 0,
                fieldError: "email",
            },
            message: "Email not found",
        });
        return;
    }

    if (!bcryptjs.compareSync(password, existingUser.password)) {
        res.status(200).send({
            responseInfo: {
                status: 0,
                fieldError: "password",
            },
            message: "Password is incorrect",
        });
        return;
    }

    try {
        const accessToken = jwt.sign({ id: existingUser?._id }, process.env.JWT_SECRET!, { expiresIn: "10m" });
        const { password, ...rest } = existingUser;
        const refreshToken = jwt.sign(
            { id: existingUser?._id, email: existingUser?.email, displayName: existingUser?.displayName },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        );
        res.status(200)
            .cookie("jwt", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 1000 * 60 * 60 * 24 * 1, 
            })
            .send({
                responseInfo: {
                    status: 1,
                },
                message: "User login successfully",
                data: {
                    ...rest,
                    accessToken,
                },
            });
        return
    } catch (error) {
        res.status(500).send({
            responseInfo: {
                status: 0,
                fieldError: "email",
            },
            message: "Error.Network",
        });
        return;
    }
};

export { registerNewUser, loginUser };
