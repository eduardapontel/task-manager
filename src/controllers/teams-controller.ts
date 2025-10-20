import { Request, Response } from 'express';
import { prisma } from '@/database/prisma';
import { z } from 'zod';

class TeamsController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().trim().min(1),
            description: z.string().trim().optional(),
        });

        const { name, description } = bodySchema.parse(request.body);

        await prisma.team.create({
            data: {
                name,
                description,
            },
        });

        return response.status(201).json( { message: 'Team created successfully.' } );
    }

    async list(request: Request, response: Response) {
        const teams = await prisma.team.findMany({
            select: {
                id: true,
                name: true,
                description: true,
            },
        });

        return response.status(200).json(teams);
    }

    async edit(request: Request, response: Response) {
        const bodySchema = z.object({
            id: z.string().uuid(),
            name: z.string().trim().min(1).optional(),
            description: z.string().trim().optional(),
        });

        const { id, name, description } = bodySchema.parse(request.body);

        await prisma.team.update({
            where: { id },
            data: {
                name,
                description,
            },
        });

        return response.status(200).json( { message: 'Team updated successfully.' } );
    }

    async delete(request: Request, response: Response) {
        const bodySchema = z.object({
            id: z.string().uuid(),
        });

        const { id } = bodySchema.parse(request.body);

        await prisma.team.delete({
            where: { id },
        });

        return response.status(200).json( { message: 'Team deleted successfully.' } );
    }
}

export { TeamsController };
