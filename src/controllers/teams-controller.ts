import { Request, Response } from 'express';
import { prisma } from '@/database/prisma';
import { z } from 'zod';
import { AppError } from '@/utils/AppError';

class TeamsController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().trim().min(1, 'Team name is required'),
            description: z.string().trim().optional(),
        });

        const { name, description } = bodySchema.parse(request.body);

        const existing = await prisma.team.findUnique({ where: { name } });

        if (existing) {
            throw new AppError('Team name already exists.', 400);
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
            },
        });

        return response.status(201).json({ message: 'Team created successfully.', team });
    }

    async list(request: Request, response: Response) {
        const teams = await prisma.team.findMany({
            select: {
                id: true,
                name: true,
                description: true,
            },
        });

        return response.status(200).json( teams );
    }

    async edit(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.string().uuid('Invalid team ID'),
        });

        const { id } = paramsSchema.parse(request.params);

        const team = await prisma.team.findUnique({
            where: { id },
        });

        if (!team) {
            throw new AppError('Team not found.', 404);
        }

        const bodySchema = z
            .object({
                name: z.string().trim().min(1).optional(),
                description: z.string().trim().optional(),
            })
            .refine((data) => Object.keys(data).length > 0, {
                message: 'At least one field must be provided to update',
            });

        const { name, description } = bodySchema.parse(request.body);

        if (name) {
            const duplicate = await prisma.team.findUnique({ where: { name } });
            if (duplicate && duplicate.id !== id) {
                throw new AppError('A team with this name already exists.', 400);
            }
        }

        await prisma.team.update({
            where: { id },
            data: {
                name,
                description,
            },
        });

        return response.status(200).json({ message: 'Team updated successfully.' });
    }

    async delete(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });

        const { id } = paramsSchema.parse(request.params);

        const team = await prisma.team.findUnique({
            where: { id },
        });

        if (!team) {
            throw new AppError('Team not found.', 404);
        }

        await prisma.team.delete({
            where: { id },
        });

        return response.status(200).json({ message: 'Team deleted successfully.' });
    }
}

export { TeamsController };
