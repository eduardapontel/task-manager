import { Request, Response } from 'express';
import { prisma } from '@/database/prisma';
import { z } from 'zod';

class TeamMembersController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            userId: z.string().uuid(),
            teamId: z.string().uuid(),
        });

        const { userId, teamId } = bodySchema.parse(request.body);

        await prisma.teamMembers.create({
            data: {
                userId,
                teamId,
            },
        });

        return response.json({ userId, teamId });
    }

    async list(request: Request, response: Response) {
        const bodySchema = z.object({
            teamId: z.string().uuid(),
        });

        const { teamId } = bodySchema.parse(request.body);

        const members = await prisma.teamMembers.findMany({
            where: { teamId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                user: {
                    role: 'asc',
                },
            },
        });

        const users = members.map((member) => member.user);

        return response.json(users);
    }

    async delete(request: Request, response: Response) {
        const bodySchema = z.object({
            userId: z.string().uuid(),
            teamId: z.string().uuid(),
        });

        const { userId, teamId } = bodySchema.parse(request.body);

        await prisma.teamMembers.delete({
            where: { userId, teamId },
        });

        return response.json({ userId, teamId });
    }
}

export { TeamMembersController };
