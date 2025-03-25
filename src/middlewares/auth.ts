import jwt from "jsonwebtoken";
import Users, { IResponseStatus, IUserInfo } from "../models/users/users.model";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
    user?: IUserInfo;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.headers["x-token"] ) {
            const token = req.headers["x-token"] as string;
            const payload = jwt.verify(token, process.env.JWT_SECRET!)
            req.user = payload as IUserInfo;
            next();
        }
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(200).send({
                code: 401,
                requestStatus: IResponseStatus.Error,
                message: "Error.Token.Expired",
            });
        }
        return res.status(200).send({
            code: 500,
            requestStatus: IResponseStatus.Error,
            message: error,
        });
    }
};