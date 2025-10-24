import { Request, Response } from 'express';
import { prisma } from '@/database/prisma';
import { z } from 'zod';
import { AppError } from '@/utils/AppError';

class TasksController {
    async list(request: Request, response: Response) {
        const querySchema = z.object({
            status: z.enum(['pending', 'in_progress', 'completed']).optional(),
            priority: z.enum(['low', 'medium', 'high']).optional(),
            teamId: z.string().uuid().optional(),
            assignedTo: z.string().uuid().optional(),
        });

        const filters = querySchema.parse(request.query);

        const tasks = await prisma.tasks.findMany({
            where: filters,
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                assignedTo: true,
                teamId: true,
            },
        });

        return response.status(200).json(tasks);
    }

    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            title: z.string().trim().min(1),
            description: z.string().trim().optional(),
            status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
            priority: z.enum(['low', 'medium', 'high']),
            teamId: z.string().uuid(),
        });

        const { title, description, status, priority, teamId } = bodySchema.parse(request.body);

        await prisma.tasks.create({
            data: {
                title,
                description,
                status,
                priority,
                teamId,
            },
        });

        return response.status(201).json({ message: 'Task created successfully.' });
    }

    async assign(request: Request, response: Response) {
        const { id } = request.params;

        const bodySchema = z.object({
            assignedTo: z.string().uuid(),
        });

        const { assignedTo } = bodySchema.parse(request.body);

        const task = await prisma.tasks.findUnique({
            where: { id },
            select: { teamId: true },
        });

        if (!task) {
            throw new AppError('Task not found.', 404);
        }

        const isMember = await prisma.teamMembers.findFirst({
            where: {
                teamId: task.teamId,
                userId: assignedTo,
            },
        });

        if (!isMember) {
            throw new AppError('User is not a member of the team.', 400);
        }

        await prisma.tasks.update({
            where: { id },
            data: { assignedTo },
        });

        return response.status(200).json({ message: 'Task assigned successfully.' });
    }

    async update(request: Request, response: Response) {
        const { id } = request.params;
        const userId = request.user?.id;

        if (!userId) {
            throw new AppError('User must be authenticated to change task status', 401);
        }

        const bodySchema = z.object({
            title: z.string().trim().min(1).optional(),
            description: z.string().trim().optional(),
            status: z.enum(['pending', 'in_progress', 'completed']).optional(),
            priority: z.enum(['low', 'medium', 'high']).optional(),
            teamId: z.string().uuid().optional(),
        });

        const { title, description, status, priority, teamId } = bodySchema.parse(request.body);

        const existingTask = await prisma.tasks.findUnique({
            where: { id },
            select: { status: true },
        });

        if (!existingTask) {
            throw new AppError('Task not found.', 404);
        }

        await prisma.tasks.update({
            where: { id },
            data: {
                title,
                description,
                status,
                priority,
                teamId,
            },
        });

        if (status && status !== existingTask.status) {
            await prisma.tasksHistory.create({
                data: {
                    taskId: id,
                    changedBy: userId,
                    previousStatus: existingTask.status,
                    newStatus: status,
                },
            });
        }

        return response.status(200).json({ message: 'Task updated successfully.' });
    }

    async history(request: Request, response: Response) {
        const { id } = request.params;

        const task = await prisma.tasks.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        const history = await prisma.tasksHistory.findMany({
            where: { taskId: id },
            orderBy: { changedAt: 'desc' },
            select: {
                id: true,
                previousStatus: true,
                newStatus: true,
                changedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return response.status(200).json(history);
    }

    async delete(request: Request, response: Response) {
        const { id } = request.params;

        await prisma.tasks.delete({
            where: { id },
        });

        return response.status(200).json({ message: 'Task deleted successfully.' });
    }
}

export { TasksController };
