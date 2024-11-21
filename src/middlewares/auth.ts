import jwt from "jsonwebtoken";
import Users, { IUserInfo } from "../models/users/users.model";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
    user?: IUserInfo;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(401).send({
            requestStatus: 0,
            message: "Error.Token.Expired",
        });
    } else {
        const access_token = token.split(" ")[1];
        jwt.verify(access_token, process.env.JWT_SECRET!, (err: any, user: any) => {
            if (err) {
                return res.status(401).send({
                    requestStatus: 0,
                    message: "Error.Token.Expired",
                });
            }
            req.user = user;
            next();
        });
        
    }
};