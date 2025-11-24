import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';

 
function verifyUserAuthorization(roles: string[]) {
    return (request: Request, response: Response, next: NextFunction) => {
        if (!request.user) {
            throw new AppError('User not authenticated.', 401);
        }

        if (!roles.includes(request.user.role)) {
            throw new AppError('User not authorized.', 403);
        }

        return next();
    }
}

export { verifyUserAuthorization };