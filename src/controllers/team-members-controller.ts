import { Request, Response } from 'express';
import { AppError } from '@/utils/AppError';
import { prisma } from '@/database/prisma';
import { z } from 'zod';

class TeamMembersController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            userId: z.string().uuid('Invalid user ID'),
            teamId: z.string().uuid('Invalid team ID'),
        });

        const { userId, teamId } = bodySchema.parse(request.body);

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('User not found.', 404);
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            throw new AppError('Team not found.', 404);
        }

        const existingMember = await prisma.teamMembers.findUnique({
            where: { userId },
        });

        if (existingMember) {
            throw new AppError('User is already a member of a team.', 409);
        }

        await prisma.teamMembers.create({
            data: {
                userId,
                teamId,
            },
        });

        return response
            .status(201)
            .json({ message: 'Team member added successfully.' });
    }

    async list(request: Request, response: Response) {
        const querySchema = z.object({
            teamId: z.string().uuid('Invalid team ID'),
        });

        const { teamId } = querySchema.parse(request.query);

        const team = await prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            throw new AppError('Team not found.', 404);
        }

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

        const member = await prisma.teamMembers.findUnique({
            where: { userId, teamId },
        });

        if (!member) {
            throw new AppError('Member not found in this team.', 404);
        }

        await prisma.teamMembers.delete({
            where: { userId, teamId },
        });

        return response.json({ message: 'Team member deleted successfully.' });
    }
}

export { TeamMembersController };
