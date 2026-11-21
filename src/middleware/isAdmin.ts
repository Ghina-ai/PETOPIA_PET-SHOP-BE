import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const isAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.roleId !== 1) {
        return res.status(403).json({
            success: false,
            message: "Akses ditolak, khusus Admin",
        });
    }

    next();
};