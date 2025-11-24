import { Request, Response } from 'express';
import { prisma } from '@/database/prisma';
import { AppError } from '@/utils/AppError';
import { hash } from 'bcrypt';
import { z } from 'zod';

class UsersController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().trim().min(1, 'Name is required').max(100),
            email: z.string().email('Invalid email format').trim(),
            password: z.string().min(6, 'Password must be at least 6 characters').max(100),
        });

        const { name, email, password } = bodySchema.parse(request.body);

        const userWithSameEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (userWithSameEmail) {
            throw new AppError('Email already in use.', 409);
        }

        const hashedPassword = await hash(password, 8);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const { password: _, ...userWithoutPassword } = user;

        return response.status(201).json(userWithoutPassword);
    }

    async update(request: Request, response: Response) {
        const bodySchema = z
            .object({
                name: z.string().trim().min(1, 'Name cannot be empty').max(100).optional(),
                email: z.string().email('Invalid email format').trim().optional(),
                password: z
                    .string()
                    .min(6, 'Password must be at least 6 characters')
                    .max(100)
                    .optional(),
            })
            .refine((data) => Object.keys(data).length > 0, {
                message: 'At least one field must be provided to update',
            });

        const { name, email, password } = bodySchema.parse(request.body);

        const userId = request.user?.id;

        if (!userId) {
            throw new AppError('User must be authenticated.', 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('User not found.', 404);
        }

        if (email && email !== user.email) {
            const emailInUse = await prisma.user.findUnique({
                where: { email },
            });

            if (emailInUse) {
                throw new AppError('Email already in use.', 409);
            }
        }

        const hashedPassword = password ? await hash(password, 8) : undefined;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const { password: _, ...userWithoutPassword } = updatedUser;

        return response.status(200).json(userWithoutPassword);
    }

    async delete(request: Request, response: Response) {
        const userId = request.user?.id;

        if (!userId) {
            throw new AppError('User must be authenticated.', 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('User not found.', 404);
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return response.status(200).json({ message: 'User deleted successfully.' });
    }
}

export { UsersController };
