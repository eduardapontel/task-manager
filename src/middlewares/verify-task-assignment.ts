import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/database/prisma';
import { AppError } from '@/utils/AppError';

function verifyTaskAssignment() {
    return async (request: Request, response: Response, next: NextFunction) => {
        const { id } = request.params;

        const task = await prisma.tasks.findUnique({
            where: { id},
        });

        if (!task) {
            throw new AppError('Task not found.', 404);
        }

        if (!request.user) {
            throw new AppError('User not authenticated.', 401);
        }

        if (task.assignedTo !== request.user.id) {
            throw new AppError('User not authorized to access this task.', 403);
        }

        return next();
    };
}

export { verifyTaskAssignment };
